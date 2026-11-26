/* Game Atlas public v210 collector/publisher.
 * Read-only unless a matching Ed25519 SECRET is configured. No new key is
 * exposed in this public repository. The published clients keep their
 * existing public verification key and only accept signed original schemas.
 */
import {createPrivateKey,createPublicKey,sign,verify,createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {getOfficial,getIndependent,getWikiBatch,sha,clean,boundedText} from './v210-sources.mjs';
import {translateFacts} from './v220-wiki-spec-translations.mjs';
import {getReviewedLaunchNews} from './v253-manual-news-20261118.mjs';
import {getPhotoForOfficialArticle} from './v210-news-photos.mjs';
import {ownedNewsImageRecord,renderOwnedNewsArt} from './v266-owned-news-art.mjs';
const PUB='qxnlUBqCBknS8KL/Bymrx4COzWN9TpPJAfdHohv/ugI=';
const MODES={official:1,community:205};
let ownedArtDigest;
function sha256OwnedNewsArt(){return ownedArtDigest||(ownedArtDigest=createHash('sha256').update(renderOwnedNewsArt()).digest('hex'))}
// Fixed compatibility limits of the already submitted Web/Android/iOS V253 client.
const MAX_CLIENT_WIKI=1000,MAX_CLIENT_NEWS=220,MAX_CLIENT_ENVELOPE=2200000;
const maxClientPayload=MAX_CLIENT_ENVELOPE-2000;
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
 const provided=secretBase64.trim();
 const pem=provided.startsWith('-----BEGIN PRIVATE KEY-----')
  ?provided:Buffer.from(provided,'base64').toString('utf8');
 const key=createPrivateKey(pem);
 if(key.asymmetricKeyType!=='ed25519')throw Error('Signer must be Ed25519');
 const derived=createPublicKey(key).export({format:'der',type:'spki'}).subarray(-32).toString('base64');
 if(derived!==PUB)throw Error('Signer does not match the deployed web client key');
 const payload=Buffer.from(JSON.stringify(data)).toString('base64');
 if(data.schema===205&&payload.length>maxClientPayload)throw Error('Client V253 signed community feed size exceeded; preserve existing feed');
 return {schema:data.schema,payload,signature:sign(null,Buffer.from(payload),key).toString('base64')};
}
export function validatePublication(data){
 if(!data||![1,205].includes(data.schema)||!Number.isSafeInteger(data.revision)||data.revision<1)throw Error('Unsafe revision');
 const ids=new Set();
 const records=data.schema===1?data.items:[...data.news,...data.fiches];
 if(!Array.isArray(records)||records.length>1500)throw Error('Overfull catalog');
 if(data.schema===205){
  if(data.news.length>MAX_CLIENT_NEWS||data.fiches.length>MAX_CLIENT_WIKI)
   throw Error('Community feed exceeds V253 client entry caps');
  if(Buffer.from(JSON.stringify(data)).toString('base64').length>maxClientPayload)
   throw Error('Community feed exceeds V253 client payload limit');
 }
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
   if(row.specs!==undefined){
    if(!Array.isArray(row.specs)||row.specs.length>18)throw Error('Too many Wiki facts');
    const keys=new Set();
    for(const spec of row.specs){
     if(!spec||!text(spec.key,70)||!text(spec.label,70)||!text(spec.value,170)||keys.has(spec.key))throw Error('Bad Wiki field');
     for(const field of ['labelI18n','valueI18n'])if(spec[field]!==undefined&&!tr(spec[field],field==='labelI18n'?80:190))throw Error('Untrusted Wiki translation');
     keys.add(spec.key);
    }
   }
  }else throw Error('Unsupported sidecar source tier');
  if(row.publishedAt!==undefined&&!DATE.test(row.publishedAt))throw Error('Bad publication date');
 }
 if(data.schema===205&&data.mode!=='INDEPENDENT_REPORTING_AND_COMMUNITY_WIKI_NOT_OFFICIAL')throw Error('Unknown community mode');
 return true;
}
const urlValid=x=>{try{const u=new URL(x);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&!u.search&&!u.hash}catch{return false}};
function enToTranslated(source,target){
 const sourceNumbers=source.match(/\d+/g)||[],targetNumbers=target.match(/\d+/g)||[];
 if(!text(target,180)||/\bj\s+dispon\s+vel\b/i.test(target)||source.toLocaleLowerCase()===target.toLocaleLowerCase()||
  sourceNumbers.some(n=>!targetNumbers.includes(n))||
  VI.test(source)&&!VI.test(target)||
  /\b(?:translation quota exceeded|mymemory warning|invalid request)\b/i.test(target))throw Error('Translation withheld: untrusted output');
 return target;
}
let translationProviderUnavailable=false;
async function myMemory(textToTranslate,lang,fetchFn=fetch){
 if(translationProviderUnavailable)throw Error('Translation provider temporarily unavailable; preserve original source headline');
 const src=clean(textToTranslate,180);
 if(!src||Buffer.byteLength(src)>450)throw Error('Source title is too large to translate safely');
 const q=new URLSearchParams({q:src,langpair:'en|'+(lang==='pt'?'pt-BR':'es'),mt:'1'});
 let raw;
 try{raw=await boundedText('https://api.mymemory.translated.net/get?'+q,fetchFn,{max:40000,headers:{Accept:'application/json'}})}
 catch(e){if(/HTTP (?:429|500|502|503|504)|Timeout|fetch failed/i.test(String(e.message)))translationProviderUnavailable=true;throw e}
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
/* Prefer a genuine Rockstar metadata description, translated into all
 * three locales. If unavailable, the existing safe summary template remains.
 * Never automatically hotlink unreviewed promotional photographs. */
export function safeOfficialExcerpt(raw,limit=170){
 // Never publish a description cut in the middle of a word. Prefer the
 // original first complete sentence; otherwise a visibly abbreviated excerpt.
 const source=clean(raw,1100);
 if(!source)return '';
 if(source.length<=limit)return source;
 const sentence=source.match(/^.{45,220}?[.!?](?=\s|$)/u);
 if(sentence&&sentence[0].length<=limit)return sentence[0].trim();
 const clipped=source.slice(0,limit-1);
 const last=clipped.lastIndexOf(' ');
 if(last<70)return '';
 return clipped.slice(0,last).replace(/[\s,;:–-]+$/u,'')+'…';
}
async function officialExcerpt(url,fetchFn=fetch){
 try{
  const html=await boundedText(url,fetchFn,{max:1200000,headers:{Accept:'text/html'}});
  const en=safeOfficialExcerpt(meta(html,'og:description')||meta(html,'description'));
  if(!en||en.length<34||/cookies?|privacy|javascript required|accept all/i.test(en))return null;
  const es=await myMemory(en,'es',fetchFn),pt=await myMemory(en,'pt',fetchFn);
  return tr({es,en,pt},190)?{es,en,pt}:null;
 }catch{return null}
}

export async function officialEntry(source,fetchFn=fetch){
 if(!urlValid(source.url)||!/^https:\/\/www\.rockstargames\.com\/newswire\/article\//.test(source.url)||!DATE.test(source.publishedAt))
  throw Error('Bad Rockstar source');
 const en=clean(source.title,150);
 if(!VI.test(en)&&source.verifiedContext!=='rockstar_gtavi_description')throw Error('Rockstar item not explicitly GTA VI');
 let es,pt,pending=false;
 try{es=await officialTitle(source.url,en,'es',fetchFn)}
 catch{es='Rockstar Games (titular EN): '+en;pending=true}
 try{pt=await officialTitle(source.url,en,'pt',fetchFn)}
 catch{pt='Rockstar Games (título EN): '+en;pending=true}
 const excerpt=await officialExcerpt(source.url,fetchFn);
 return {id:'rockstar-'+sha(source.url).slice(0,24),category:'actualizaciones',status:'verified',
  title:{es,en,pt},
  summary:excerpt||{
   es:'Rockstar Games publicó una noticia oficial sobre Grand Theft Auto VI: '+es+'. Consultá el anuncio original para conocer los detalles.',
   en:'Rockstar Games published an official Grand Theft Auto VI announcement: '+en+'. Read the original Rockstar publication for details.',
   pt:'A Rockstar Games publicou uma notícia oficial sobre Grand Theft Auto VI: '+pt+'. Leia o comunicado original para conhecer os detalhes.'
  },
  publishedAt:source.publishedAt,trackable:false,sources:[{url:source.url}],
  ...(pending?{translationPending:true}:{}),
  // V266 has a client-side renderer bug for official HTTP image URLs.
  // Safe unsigned remote images are NOT executable and cannot repair that bug.
  // Provide an owned branded fallback via SHA-verified signed image bytes.
  image:ownedNewsImageRecord(sha256OwnedNewsArt())
 };
}
export async function independentEntry(source,fetchFn=fetch){
 if(!urlValid(source.url)||!/^https:\/\/rockstarintel\.com\//.test(source.url)||!DATE.test(source.publishedAt))
  throw Error('Bad independent source');
 const en=clean(source.title,140);
 if(!VI.test(en))throw Error('RSS unrelated to GTA VI');
 let es,pt,pending=false;
 try{es=await myMemory(en,'es',fetchFn)}catch{es=en;pending=true}
 try{pt=await myMemory(en,'pt',fetchFn)}catch{pt=en;pending=true}
 if(es.length>155||pt.length>155)throw Error('Headline exceeds the signed news card limit');
 return {id:'community-report-'+sha(source.url).slice(0,24),
  title:{
   es:'Según RockstarINTEL'+(es===en?' (EN)':'')+': '+es,
   en:'RockstarINTEL reports: '+en,
   pt:'Segundo a RockstarINTEL'+(pt===en?' (EN)':'')+': '+pt
  },
  summary:{
   es:'RockstarINTEL publicó una noticia independiente sobre GTA VI. '+(es===en?'El titular original está en inglés: «'+en+'».':'Titular: «'+es+'».')+' Consultá la fuente original.',
   en:'Independent outlet RockstarINTEL published GTA VI coverage titled '+en+'. Read the original article and evidence.',
   pt:'O veículo independente RockstarINTEL publicou uma notícia sobre GTA VI. '+(pt===en?'Título original em inglês: «'+en+'».':'Título: «'+pt+'».')+' Consulte a fonte original.'
  },publishedAt:source.publishedAt,sourceUrl:source.url,sourceName:'RockstarINTEL',
  sourceTier:'independent_reporting_not_official',claimStatus:'reported_not_confirmed_by_rockstar',
  ...(pending?{translationPending:true}:{})};
}
export function appendNews(previous,staged,kind){
 validatePublication(previous);
 const items=kind==='official'?previous.items:previous.news;
 const byId=new Map(items.map(row=>[row.id,row]));
 const byUrl=new Map(items.map(row=>[kind==='official'?row.sources?.[0]?.url:row.sourceUrl,row.id]));
 let added=0,updated=0;
 for(const item of staged){
  const uri=kind==='official'?item.sources?.[0]?.url:item.sourceUrl;
  if(!uri||!urlValid(uri))continue;
  const existing=byId.get(item.id)||byId.get(byUrl.get(uri));
  if(existing){
   // Upgrade an earlier English-labelled fallback only after a proper
   // multilingual translation arrives from the exact same source URL.
   if(existing.id===item.id&&existing.translationPending===true&&!item.translationPending&&
      (kind==='official'?existing.sources?.[0]?.url:existing.sourceUrl)===uri){
    byId.set(item.id,{...item,image:item.image||existing.image});updated++;
   }else if(kind==='official'&&existing.id===item.id&&!existing.image&&item.image&&existing.sources?.[0]?.url===uri){
    // Add only a source-matched Rockstar photo; preserve title/date/summary and IDs.
    byId.set(item.id,{...existing,image:item.image});updated++;
   }
   continue;
  }
  if(byId.size>=(kind==='official'?1500:MAX_CLIENT_NEWS))continue;
  byId.set(item.id,item);byUrl.set(uri,item.id);added++;
 }
 if(!added&&!updated)return {next:previous,added:0,updated:0};
 const next={...previous,revision:previous.revision+1,
  [kind==='official'?'items':'news']:[...byId.values()]};
 validatePublication(next);
 return {next,added,updated};
}
export function mergeWiki(previous,staged){
 validatePublication(previous);
 const byId=new Map(previous.fiches.map(row=>[row.id,row]));let changed=0;
 for(const row of staged){
  const old=byId.get(row.id);
  const {wikiPageId,...safeRow}=row;
  if(!old&&byId.size>=MAX_CLIENT_WIKI)continue;
  if(!old||row.wikiRevision>old.wikiRevision){
   // A new Wiki source revision must be rechecked. Preserve previously
   // verified translations ONLY when the same key, label and source value
   // are still present verbatim in the new revision; stale facts disappear.
   const enriched=old&&Array.isArray(safeRow.specs)?safeRow.specs.map(spec=>{
    const previous=old.specs?.find(p=>p.key===spec.key&&p.label===spec.label&&p.value===spec.value);
    return previous?{...spec,
     ...(previous.labelI18n?{labelI18n:previous.labelI18n}:{}),
     ...(previous.valueI18n?{valueI18n:previous.valueI18n}:{})}:spec;
   }):safeRow.specs;
   byId.set(row.id,enriched?{...safeRow,specs:enriched}:safeRow);changed++;
  }else if(row.wikiRevision===old.wikiRevision&&safeRow.specs?.length &&
    !Array.isArray(old.specs)){
   // Same source revision: add newly discovered specifications, but never
   // overwrite previously translated facts with a less complete raw scan.
   byId.set(row.id,{...old,specs:safeRow.specs});changed++;
  }
 }
 if(!changed)return {next:previous,changed:0};
 const next={...previous,revision:previous.revision+1,fiches:[...byId.values()]};
 validatePublication(next);return {next,changed};
}
// Conservative ingestion: keep old IDs, quarantine possible aliases, and never
// replace verified attributes when the new revision's infobox was not inspected.
export function mergeWikiSafely(previous,staged){
 validatePublication(previous);
 let next=previous,changed=0;
 const report={added:0,updated:0,unchanged:0,capacity:0,deferred:0,conflicts:[]};
 const norm=v=>String(v||'').normalize('NFKC').trim().replace(/[_\s]+/g,' ').toLocaleLowerCase('en-US');
 const nameKey=row=>row.category+'|'+norm(row.title?.en);
 const urlKey=row=>{try{return new URL(row.sourceUrl).href}catch{return ''}};
 const byId=new Map(previous.fiches.map(row=>[row.id,row]));
 const byName=new Map(previous.fiches.map(row=>[nameKey(row),row.id]));
 const byUrl=new Map(previous.fiches.map(row=>[urlKey(row),row.id]));
 for(const row of staged){
  const old=byId.get(row.id);
  const conflict=(byUrl.get(urlKey(row))||byName.get(nameKey(row)));
  if((old&&old.category!==row.category)||(!old&&conflict)){
   report.conflicts.push({id:row.id,sourceUrl:row.sourceUrl,reason:'Possible duplicate or category change; review required'});continue;
  }
  if(old&&row.wikiRevision>old.wikiRevision&&old.specs?.length&&row.wikiSpecsChecked!==true){
   report.deferred++;continue;
  }
  if(!old&&next.fiches.length>=MAX_CLIENT_WIKI){report.capacity++;continue}
  const {wikiSpecsChecked,...candidate}=row;
  try{
   let result;
   if(old&&row.wikiRevision===old.wikiRevision&&old.specs?.length&&candidate.specs?.length){
    const keys=new Set(old.specs.map(x=>x.key));
    const extras=candidate.specs.filter(x=>!keys.has(x.key)).slice(0,18-old.specs.length);
    if(extras.length){
     const updated={...old,specs:[...old.specs,...extras]};
     const proposed={...next,revision:next.revision+1,fiches:next.fiches.map(x=>x.id===old.id?updated:x)};
     validatePublication(proposed);result={next:proposed,changed:1};
    }else result={next,changed:0};
   }else result=mergeWiki(next,[candidate]);
   if(!result.changed){report.unchanged++;continue}
   next=result.next;changed++;
   const saved=next.fiches.find(x=>x.id===row.id);
   byId.set(saved.id,saved);byName.set(nameKey(saved),saved.id);byUrl.set(urlKey(saved),saved.id);
   if(old)report.updated++;else report.added++;
  }catch(e){
   if(/payload limit|entry caps|Overfull catalog/.test(e.message))report.capacity++;
   else report.conflicts.push({id:row.id,sourceUrl:row.sourceUrl,reason:String(e.message).slice(0,140)});
  }
 }
 if(changed){next={...next,revision:previous.revision+1};validatePublication(next)}
 return {next,changed,report};
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
 if(!secret){
  // Do not burn the anonymous translation quota or claim a successful
  // publication before the owner configures the existing signing key.
  if(mode==='news'){
   const sourceChecks=await Promise.allSettled([getOfficial(),getIndependent()]);
   const oldOfficial=new Set(official.items.flatMap(x=>(x.sources||[]).map(s=>s.url)));
   const oldCommunity=new Set(community.news.map(x=>x.sourceUrl));
   report.detectedUnpublishedOfficial=sourceChecks[0].status==='fulfilled'
    ?sourceChecks[0].value.filter(x=>!oldOfficial.has(x.url)).length:0;
   report.detectedUnpublishedIndependent=sourceChecks[1].status==='fulfilled'
    ?sourceChecks[1].value.filter(x=>!oldCommunity.has(x.url)).length:0;
   for(const [i,source] of sourceChecks.entries())
    if(source.status==='rejected')report.warnings.push((i?'RockstarINTEL':'Rockstar')+': '+String(source.reason?.message||'unavailable').slice(0,160));
  }
  report.publisher='SIGNER_SETUP_REQUIRED';
  report.changesSigned=false;
  await writeFile('automation/v210-last-check.json',JSON.stringify(report,null,2)+'\n');
  console.log('V210 REPORT',JSON.stringify(report));
  return;
 }
 let nextOfficial=official,nextCommunity=community,wikiState={};
 if(mode==='news'){
  const sources=await Promise.allSettled([getOfficial(),getIndependent()]);
  if(sources[0].status==='fulfilled'){
   const known=new Map(official.items.map(x=>[x.sources?.[0]?.url,x]));
   const fresh=sources[0].value.filter(x=>!known.has(x.url)||known.get(x.url)?.translationPending)
    .sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt)).slice(0,12);
   const translated=[];
   for(const row of fresh)try{translated.push(await officialEntry(row))}catch(e){report.quarantined.push({source:'Rockstar',url:row.url,reason:e.message.slice(0,150)})}
   // Restore verified images for existing recent posts without republishing news
   // or changing translations, dates, favorites, app files or map content.
   const photoBackfill=sources[0].value.filter(x=>known.has(x.url)&&!known.get(x.url)?.image&&!known.get(x.url)?.translationPending)
    .sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt)).slice(0,8);
   for(const row of photoBackfill){
    const cover=await getPhotoForOfficialArticle(row.url);
    if(cover)translated.push({...known.get(row.url),image:cover});
   }
   const merged=appendNews(official,translated,'official');nextOfficial=merged.next;report.newOfficial=merged.added;report.updatedOfficial=merged.updated||0;
   const knownAfter=new Set(nextOfficial.items.flatMap(x=>(x.sources||[]).map(y=>y.url)));
   report.latestRockstarSourceDate=sources[0].value.map(x=>x.publishedAt).sort().at(-1)||null;
   report.latestPublishedOfficialDate=nextOfficial.items.filter(x=>x.category==='actualizaciones'&&x.facets?.community!==1).map(x=>x.publishedAt).filter(Boolean).sort().at(-1)||null;
   report.unpublishedRockstarUrls=sources[0].value.filter(x=>!knownAfter.has(x.url)).map(x=>x.url).slice(0,12);
   if(report.unpublishedRockstarUrls.length)
    report.warnings.push('Some verified Rockstar sources require retry or review: '+report.unpublishedRockstarUrls.length);
  }else report.warnings.push('Rockstar check failed: '+sources[0].reason.message);
  if(sources[1].status==='fulfilled'){
   const known=new Map(community.news.map(x=>[x.sourceUrl,x]));
   const fresh=sources[1].value.filter(x=>!known.has(x.url)||known.get(x.url)?.translationPending)
    .sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt)).slice(0,18);
   const translated=[];
   for(const row of fresh)try{translated.push(await independentEntry(row))}catch(e){report.quarantined.push({source:'RockstarINTEL',url:row.url,reason:e.message.slice(0,150)})}
   const merged=appendNews(community,translated,'community');nextCommunity=merged.next;report.newIndependent=merged.added;report.updatedIndependent=merged.updated||0;
   const independentUrls=new Set(nextCommunity.news.map(x=>x.sourceUrl));
   report.latestIndependentSourceDate=sources[1].value.map(x=>x.publishedAt).sort().at(-1)||null;
   report.latestPublishedIndependentDate=nextCommunity.news.map(x=>x.publishedAt).filter(Boolean).sort().at(-1)||null;
   report.unpublishedIndependentUrls=sources[1].value.filter(x=>!independentUrls.has(x.url)).map(x=>x.url).slice(0,12);
  }else report.warnings.push('RockstarINTEL check failed: '+sources[1].reason.message);
  // Manually verified launch-day articles: original publication date and
  // independent attribution are preserved. Duplicate source URLs are ignored.
  // The usual Ed25519 signer/validator handles this just like RSS content.
  const humanReviewed=appendNews(nextCommunity,getReviewedLaunchNews(),'community');
  nextCommunity=humanReviewed.next;
  report.newIndependent+=humanReviewed.added;
  if(sources.every(x=>x.status==='rejected')&&!humanReviewed.added)
   throw Error('All news providers down; signed archives unchanged');
 }else if(mode==='wiki'){
  try{wikiState=JSON.parse(await readFile('automation/v210-wiki-state.json','utf8'))}catch(e){if(e.code!=='ENOENT')throw e}
  const scanned=await getWikiBatch(wikiState,fetch,{withSpecifications:true});
  const joined=mergeWikiSafely(community,scanned.items);
  report.wikiMerge=joined.report;
  report.warnings.push(...(joined.report.capacity?['Client capacity blocked '+joined.report.capacity+' candidates; no existing records removed']:[]));
  report.quarantined.push(...joined.report.conflicts.map(x=>({source:'GTA Wiki',url:x.sourceUrl,reason:x.reason})));
  report.warnings.push(...(joined.report.deferred?['Deferred '+joined.report.deferred+' revised fiches until infobox is checked']:[]));
  nextCommunity=joined.next;report.newWiki=joined.changed;report.warnings.push(...scanned.errors);
  wikiState={cursor:scanned.cursor,specCursor:scanned.specCursor,checkedAt:stamp};
  report.specsInspected=scanned.specsInspected;report.withWikiSpecifications=scanned.withSpecs;
  // Source revisions are validated above. Translate a bounded number of
  // technical properties each scan, retry failures without publishing English
  // as if it were a completed ES/PT translation.
  // Deterministic glossary can process the whole signed catalog with zero API calls.
  // Unknown strings remain pending; remote requests are tightly bounded.
  const i18n=await translateFacts(nextCommunity,{maxRequests:10,maxSpecs:1200});
  nextCommunity=i18n.next;
  report.specsTranslated=i18n.translated;
  report.specsPending=i18n.pending;
  report.translationRequests=i18n.requests;
  report.quarantined.push(...i18n.errors.slice(0,10).map(x=>({source:'GTA Wiki',url:'',reason:x.id+' '+x.key+' '+x.lang+': '+x.reason})));
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
