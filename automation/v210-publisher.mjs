/* Game Atlas public v210 collector/publisher.
 * Read-only unless a matching Ed25519 SECRET is configured. No new key is
 * exposed in this public repository. The published clients keep their
 * existing public verification key and only accept signed original schemas.
 */
import {createPrivateKey,createPublicKey,sign,verify} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {getOfficial,getIndependent,getWikiBatch,sha,clean,boundedText} from './v210-sources.mjs';
const PUB='qxnlUBqCBknS8KL/Bymrx4COzWN9TpPJAfdHohv/ugI=';
const MODES={official:1,community:205};
const VI=/\b(?:grand theft auto\s*(?:vi|6)|gta\s*(?:vi|6))\b/i;
const DATE=/^\d{4}-\d{2}-\d{2}$/;
const text=(x,max)=>typeof x==='string'&&x.trim().length>0&&x.length<=max&&!/[<>\x00-\x1f]/.test(x);
const tr=(x,max)=>x&&['es','en','pt'].every(l=>text(x[l],max));
function pubKey(){return createPublicKey({key:Buffer.concat([Buffer.from('302a300506032b6570032100','hex'),Buffer.from(PUB,'base64')]),format:'der',type:'spki'})}
export function verifyFeed(envelope,expected){
 if(!envelope||envelope.schema!==expected||typeof envelope.payload!=='string'||envelope.payload.length>4000000||typeof envelope.signature!=='string')
  throw Error('Missing/malformed previously signed feed');
 const ok=verify(null,Buffer.from(envelope.payload),pubKey(),Buffer.from(envelope.signature,'base64'));
 if(!ok)throw Error('Existing feed signature invalid: do not replace');
 const data=JSON.parse(Buffer.from(envelope.payload,'base64').toString('utf8'));
 if(data.schema!==expected||!Number.isSafeInteger(data.revision)||data.revision<1)throw Error('Invalid signed data schema');
 if(expected===1&&!Array.isArray(data.items))throw Error('No signed official items');
 if(expected===205&&(!Array.isArray(data.news)||!Array.isArray(data.fiches)))throw Error('No signed community records');
 return data;
}
export function signFeed(data,secretBase64){
 if(!secretBase64)throw Error('SIGNING_KEY_NOT_CONFIGURED');
 const pem=Buffer.from(secretBase64,'base64').toString('utf8');
 const key=createPrivateKey(pem);
 if(key.asymmetricKeyType!=='ed25519')throw Error('Signer must be Ed25519');
 const derived=createPublicKey(key).export({format:'der',type:'spki'}).subarray(-32).toString('base64');
 if(derived!==PUB)throw Error('Signer does not match the deployed web client key');
 const payload=Buffer.from(JSON.stringify(data)).toString('base64');
 return {schema:data.schema,payload,signature:sign(null,Buffer.from(payload),key).toString('base64')};
}
export function validatePublication(data){
 if(!data||![1,205].includes(data.schema)||!Number.isSafeInteger(data.revision)||data.revision<1)throw Error('Unsafe revision');
 const ids=new Set();
 const records=data.schema===1?data.items:[...data.news,...data.fiches];
 if(!Array.isArray(records)||records.length>1500)throw Error('Overfull catalog');
 for(const row of records){
  if(!row||!text(row.id,128)||ids.has(row.id)||!tr(row.title,180)||!tr(row.summary,data.schema===1?1300:450))throw Error('Unsafe/duplicate item');
  ids.add(row.id);
  if(data.schema===1){
   if(!Array.isArray(row.sources)||!row.sources.length||row.status!=='verified')throw Error('Unapproved official item');
   for(const s of row.sources){const u=new URL(s.url);if(!['www.rockstargames.com','rockstargames.com','gta.wiki','www.grandtheftwiki.com'].includes(u.hostname)||u.protocol!=='https:')throw Error('Invalid catalog source')}
  }else if(row.sourceTier==='independent_reporting_not_official'){
   if(!row.id.startsWith('community-report-')||row.sourceName!=='RockstarINTEL'||row.claimStatus!=='reported_not_confirmed_by_rockstar'||!/^https:\/\/(?:www\.)?rockstarintel\.com\//.test(row.sourceUrl)||!DATE.test(row.publishedAt))throw Error('Bad independent source');
  }else if(row.sourceTier==='community_indexed_not_rockstar_confirmed'){
   if(!row.id.startsWith('wiki-community-')||row.sourceName!=='GTA Wiki'||!/^https:\/\/gta\.wiki\/w\//.test(row.sourceUrl)||!Number.isInteger(row.wikiRevision))throw Error('Bad community source');
  }else throw Error('Unsupported sidecar source tier');
  if(row.publishedAt!==undefined&&!DATE.test(row.publishedAt))throw Error('Bad publication date');
 }
 if(data.schema===205&&data.mode!=='INDEPENDENT_REPORTING_AND_COMMUNITY_WIKI_NOT_OFFICIAL')throw Error('Unknown community mode');
 return true;
}
const urlValid=x=>{try{const u=new URL(x);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&!u.search&&!u.hash}catch{return false}};
function enToTranslated(source,target){
 const sourceNumbers=source.match(/\d+/g)||[],targetNumbers=target.match(/\d+/g)||[];
 if(!text(target,180)||source.toLocaleLowerCase()===target.toLocaleLowerCase()||
  sourceNumbers.some(n=>!targetNumbers.includes(n))||
  VI.test(source)&&!VI.test(target)||
  /\b(?:translation quota exceeded|mymemory warning|invalid request)\b/i.test(target))throw Error('Translation withheld: untrusted output');
 return target;
}
async function myMemory(textToTranslate,lang,fetchFn=fetch){
 const src=clean(textToTranslate,180);
 if(!src||Buffer.byteLength(src)>450)throw Error('Source title is too large to translate safely');
 const q=new URLSearchParams({q:src,langpair:'en|'+(lang==='pt'?'pt-BR':'es'),mt:'1'});
 const raw=await boundedText('https://api.mymemory.translated.net/get?'+q,fetchFn,{max:40000,headers:{Accept:'application/json'}});
 const doc=JSON.parse(raw);
 if(Number(doc.responseStatus)!==200)throw Error('Translation provider refused request');
 return enToTranslated(src,clean(doc.responseData?.translatedText,180));
}
function meta(html,name){
 for(const m of html.matchAll(/<meta\b[^>]{0,1000}>/gi)){
  const tag=m[0];if(!new RegExp('(?:property|name)\\s*=\\s*["\\x27]'+name+'["\\x27]','i').test(tag))continue;
  const content=tag.match(/\bcontent\s*=\s*(["'])(.*?)\1/i);
  if(content)return clean(content[2],180).replace(/\s*[-–]\s*Rockstar Games\s*$/i,'');
 }
 return null;
}
async function officialTitle(url,original,lang,fetchFn=fetch){
 const prefix=lang==='es'?'/es':lang==='pt'?'/br':'';
 const local=url.replace('/newswire/',prefix+'/newswire/');
 let title=null;
 try{title=meta(await boundedText(local,fetchFn,{max:1400000,headers:{Accept:'text/html'}}),'og:title')}catch{}
 if(title&&VI.test(title)&&title.toLowerCase()!==original.toLowerCase())return enToTranslated(original,title);
 return myMemory(original,lang,fetchFn);
}
export async function officialEntry(source,fetchFn=fetch){
 if(!urlValid(source.url)||!/^https:\/\/www\.rockstargames\.com\/newswire\/article\//.test(source.url)||!DATE.test(source.publishedAt))
  throw Error('Bad Rockstar source');
 const en=clean(source.title,150);
 if(!VI.test(en))throw Error('Rockstar item not explicitly GTA VI');
 const es=await officialTitle(source.url,en,'es',fetchFn);
 const pt=await officialTitle(source.url,en,'pt',fetchFn);
 return {id:'rockstar-'+sha(source.url).slice(0,24),category:'actualizaciones',status:'verified',
  title:{es,en,pt},
  summary:{
   es:'Rockstar Games publicó una noticia oficial sobre Grand Theft Auto VI: '+es+'. Consultá el anuncio original para conocer los detalles.',
   en:'Rockstar Games published an official Grand Theft Auto VI announcement: '+en+'. Read the original Rockstar publication for details.',
   pt:'A Rockstar Games publicou uma notícia oficial sobre Grand Theft Auto VI: '+pt+'. Leia o comunicado original para conhecer os detalhes.'
  },
  publishedAt:source.publishedAt,trackable:false,sources:[{url:source.url}]
 };
}
export async function independentEntry(source,fetchFn=fetch){
 if(!urlValid(source.url)||!/^https:\/\/rockstarintel\.com\//.test(source.url)||!DATE.test(source.publishedAt))
  throw Error('Bad independent source');
 const en=clean(source.title,140);
 if(!VI.test(en))throw Error('RSS unrelated to GTA VI');
 const es=await myMemory(en,'es',fetchFn),pt=await myMemory(en,'pt',fetchFn);
 return {id:'community-report-'+sha(source.url).slice(0,24),
  title:{es:'Según RockstarINTEL: '+es,en:'RockstarINTEL reports: '+en,pt:'Segundo a RockstarINTEL: '+pt},
  summary:{
   es:'RockstarINTEL publicó una noticia sobre GTA VI titulada «'+es+'». Es información de un medio independiente; consultá la fuente original.',
   en:'Independent outlet RockstarINTEL published GTA VI coverage titled '+en+'. Read the original article and evidence.',
   pt:'O veículo independente RockstarINTEL publicou uma notícia sobre GTA VI intitulada «'+pt+'». Consulte a fonte original.'
  },publishedAt:source.publishedAt,sourceUrl:source.url,sourceName:'RockstarINTEL',
  sourceTier:'independent_reporting_not_official',claimStatus:'reported_not_confirmed_by_rockstar'};
}
export function appendNews(previous,staged,kind){
 validatePublication(previous);
 const items=kind==='official'?previous.items:previous.news;
 const byId=new Map(items.map(row=>[row.id,row]));
 const byUrl=new Set(items.map(row=>kind==='official'?row.sources?.[0]?.url:row.sourceUrl));
 let added=0;
 for(const item of staged){
  const uri=kind==='official'?item.sources?.[0]?.url:item.sourceUrl;
  if(!uri||!urlValid(uri)||byId.has(item.id)||byUrl.has(uri))continue;
  byId.set(item.id,item);byUrl.add(uri);added++;
 }
 if(!added)return {next:previous,added:0};
 const next={...previous,revision:previous.revision+1,
  [kind==='official'?'items':'news']:[...byId.values()]};
 validatePublication(next);
 return {next,added};
}
export function mergeWiki(previous,staged){
 validatePublication(previous);
 const byId=new Map(previous.fiches.map(row=>[row.id,row]));let changed=0;
 for(const row of staged){
  const old=byId.get(row.id);
  if(!old||row.wikiRevision>old.wikiRevision){byId.set(row.id,old?.specs?{...row,specs:old.specs}:row);changed++}
 }
 if(!changed)return {next:previous,changed:0};
 const next={...previous,revision:previous.revision+1,fiches:[...byId.values()]};
 validatePublication(next);return {next,changed};
}
async function run(){
 const stamp=new Date().toISOString();
 const mode=process.env.GAME_ATLAS_MODE||'news',dry=process.env.GAME_ATLAS_DRY_RUN!=='false';
 const secret=process.env.CATALOG_SIGNING_KEY_PEM_BASE64||'';
 const oldOfficialPath='updates/catalog-envelope.json',oldCommunityPath='updates/community-envelope-v205.json';
 const [oldOfficial,oldCommunity]=await Promise.all([readFile(oldOfficialPath,'utf8').then(JSON.parse),readFile(oldCommunityPath,'utf8').then(JSON.parse)]);
 const [official,community]=[verifyFeed(oldOfficial,MODES.official),verifyFeed(oldCommunity,MODES.community)];
 validatePublication(official);validatePublication(community);
 const report={checkedAt:stamp,mode,runner:'public-free',publisher:'not-activated',officialRevision:official.revision,communityRevision:community.revision,
  previousOfficialCount:official.items.length,previousIndependentCount:community.news.length,previousWikiCount:community.fiches.length,
  newOfficial:0,newIndependent:0,newWiki:0,quarantined:[],warnings:[]};
 let nextOfficial=official,nextCommunity=community,wikiState={};
 if(mode==='news'){
  const sources=await Promise.allSettled([getOfficial(),getIndependent()]);
  if(sources[0].status==='fulfilled'){
   const known=new Set(official.items.flatMap(x=>(x.sources||[]).map(s=>s.url)));
   const fresh=sources[0].value.filter(x=>!known.has(x.url)).sort((a,b)=>a.publishedAt.localeCompare(b.publishedAt)).slice(0,5);
   const translated=[];
   for(const row of fresh)try{translated.push(await officialEntry(row))}catch(e){report.quarantined.push({source:'Rockstar',url:row.url,reason:e.message.slice(0,150)})}
   const merged=appendNews(official,translated,'official');nextOfficial=merged.next;report.newOfficial=merged.added;
  }else report.warnings.push('Rockstar check failed: '+sources[0].reason.message);
  if(sources[1].status==='fulfilled'){
   const known=new Set(community.news.map(x=>x.sourceUrl));
   const fresh=sources[1].value.filter(x=>!known.has(x.url)).sort((a,b)=>a.publishedAt.localeCompare(b.publishedAt)).slice(0,5);
   const translated=[];
   for(const row of fresh)try{translated.push(await independentEntry(row))}catch(e){report.quarantined.push({source:'RockstarINTEL',url:row.url,reason:e.message.slice(0,150)})}
   const merged=appendNews(community,translated,'community');nextCommunity=merged.next;report.newIndependent=merged.added;
  }else report.warnings.push('RockstarINTEL check failed: '+sources[1].reason.message);
  if(sources.every(x=>x.status==='rejected'))throw Error('All news providers down; signed archives unchanged');
 }else if(mode==='wiki'){
  try{wikiState=JSON.parse(await readFile('automation/v210-wiki-state.json','utf8'))}catch(e){if(e.code!=='ENOENT')throw e}
  const scanned=await getWikiBatch(wikiState);
  const joined=mergeWiki(community,scanned.items);
  nextCommunity=joined.next;report.newWiki=joined.changed;report.warnings.push(...scanned.errors);
  wikiState={cursor:scanned.cursor,checkedAt:stamp};
 }else throw Error('Unknown scheduled mode');
 const changed=nextOfficial!==official||nextCommunity!==community;
 report.changesSigned=changed;
 if(!secret){
  report.publisher='SIGNER_SETUP_REQUIRED';
  console.log('CHECK ONLY; missing dedicated repository Actions secret CATALOG_SIGNING_KEY_PEM_BASE64.');
 }else if(dry){
  report.publisher='DRY_RUN_SIGNED_CHECK';
  if(changed){const e1=signFeed(nextOfficial,secret),e2=signFeed(nextCommunity,secret);
   if(nextOfficial!==official)verifyFeed(e1,1);
   if(nextCommunity!==community)verifyFeed(e2,205)}
 }else{
  // Sign and verify every changed feed before any write. If a source fails,
  // preserve its previously signed file; never publish empty replacements.
  const newOfficial=nextOfficial!==official?signFeed(nextOfficial,secret):null;
  const newCommunity=nextCommunity!==community?signFeed(nextCommunity,secret):null;
  if(newOfficial)verifyFeed(newOfficial,1);
  if(newCommunity)verifyFeed(newCommunity,205);
  if(newOfficial)await writeFile(oldOfficialPath,JSON.stringify(newOfficial)+'\n');
  if(newCommunity)await writeFile(oldCommunityPath,JSON.stringify(newCommunity)+'\n');
  if(mode==='wiki')await writeFile('automation/v210-wiki-state.json',JSON.stringify(wikiState,null,2)+'\n');
  report.publisher=changed?'SIGNED_READY_TO_COMMIT':'UNCHANGED_SIGNED_ARCHIVES_PRESERVED';
 }
 await writeFile('automation/v210-last-check.json',JSON.stringify(report,null,2)+'\n');
 console.log('V210 REPORT',JSON.stringify(report));
}
if(process.argv[1]&&import.meta.url===new URL('file://'+(await import('node:path')).resolve(process.argv[1])).href)
 run().catch(error=>{console.error('V210 READ/VERIFY FAILED; no public feed committed:',error.message);process.exitCode=1});
