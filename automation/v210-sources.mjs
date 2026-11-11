/* Game Atlas public-source collectors v210.
 * Public code, public URLs, no private repo source or secrets.
 * Read-only. Failure never edits the signed historical catalog.
 */
import {createHash} from 'node:crypto';
export const sha=s=>createHash('sha256').update(String(s)).digest('hex');
const TIMEOUT=18000;
const GVI=/\b(?:grand theft auto\s*(?:vi|6)|gta\s*(?:vi|6))\b/i;
const DATE=/^\d{4}-\d{2}-\d{2}$/;
const entities={amp:'&',quot:'"',apos:"'",nbsp:' ',lt:'',gt:'',rsquo:'’',ndash:'–',mdash:'—',hellip:'…'};
export function clean(s,max=180){
 return String(s??'')
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1')
  .replace(/&#(x[0-9a-f]+|\d+);/gi,(_,n)=>String.fromCodePoint(n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):Number(n)))
  .replace(/&([a-z]+);/gi,(_,x)=>entities[x.toLowerCase()]??' ')
  .replace(/<[^>]*>/g,' ').replace(/[\u0000-\u001f<>]/g,' ')
  .replace(/\s+/g,' ').trim().slice(0,max);
}
export function publicationDate(value,now=Date.now()){
 if(!value)return null;
 const at=Date.parse(String(value));
 if(!Number.isFinite(at)||at>now+86400000||at<Date.parse('2024-01-01T00:00:00Z'))return null;
 return new Date(at).toISOString().slice(0,10);
}
function allowUrl(input,host,route){
 try{const u=new URL(input);if(u.protocol!=='https:'||u.username||u.password||u.port||u.search||u.hash||u.hostname!==host||!route.test(u.pathname))return null;
  return 'https://'+host+u.pathname.replace(/\/$/,'')
 }catch{return null}
}
const official=raw=>allowUrl(raw,'www.rockstargames.com',/^\/newswire\/article\/[a-z0-9_-]+\/[a-z0-9_-]+\/?$/i);
const independent=raw=>allowUrl(raw,'rockstarintel.com',/^\/[a-z0-9][a-z0-9/-]{8,220}\/?$/i);
export async function boundedText(url,fetchFn=fetch,{max=1800000,method='GET',headers={},body}={}){
 const response=await fetchFn(url,{method,headers,body,redirect:'error',signal:AbortSignal.timeout(TIMEOUT)});
 if(!response.ok||Number(response.headers?.get?.('content-length')||0)>max)throw Error('Source unavailable: HTTP '+response.status);
 const value=await response.text();if(Buffer.byteLength(value)>max)throw Error('Source too large');
 return value;
}
export function extractRockstarGraph(json){
 if(json?.errors?.length||!Array.isArray(json?.data?.posts?.results))throw Error('Invalid official GraphQL response');
 const result=[];
 for(const row of json.data.posts.results){
  const url=official(row?.url),title=clean(row?.title,180),date=publicationDate(row?.created);
  if(url&&title&&GVI.test(title)&&date)result.push({url,title,publishedAt:date});
 }
 return [...new Map(result.map(r=>[r.url,r])).values()];
}
export async function getOfficial(fetchFn=fetch){
 const query='{posts(locale:"en_us",limit:80){results{id title url created}}}';
 const raw=await boundedText('https://graph.rockstargames.com/',fetchFn,{method:'POST',max:1400000,
  headers:{Accept:'application/json','Content-Type':'application/json',Origin:'https://www.rockstargames.com','User-Agent':'GameAtlasReadOnlyV210/1.0'},
  body:JSON.stringify({query})});
 return extractRockstarGraph(JSON.parse(raw));
}
function xmlField(item,tag){
 const m=String(item).match(new RegExp('<'+tag+'(?:\\s[^>]*)?>([\\s\\S]*?)<\\/'+tag+'\\s*>','i'));
 return m?clean(m[1],600):'';
}
export function extractRockstarIntelRSS(xml,now=Date.now()){
 if(typeof xml!=='string'||!/<rss\b|<feed\b/i.test(xml))throw Error('Unexpected independent RSS');
 const rows=[];
 for(const m of xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)){
  const item=m[1],url=independent(xmlField(item,'link')),title=xmlField(item,'title'),date=publicationDate(xmlField(item,'pubDate'),now);
  if(!url||!title||!date||!GVI.test(title))continue;
  if(!/gta\s*(?:6|vi)|grand theft auto\s*(?:6|vi)/i.test(title))continue;
  // Never turn old articles into today's news; keep publisher's original pubDate.
  rows.push({url,title,publishedAt:date});
 }
 return [...new Map(rows.map(r=>[r.url,r])).values()];
}
export async function getIndependent(fetchFn=fetch,now=Date.now()){
 const xml=await boundedText('https://rockstarintel.com/feed/',fetchFn,{max:1600000,headers:{Accept:'application/rss+xml,application/xml','User-Agent':'GameAtlasReadOnlyV210/1.0'}});
 return extractRockstarIntelRSS(xml,now);
}
const WIKI_CATEGORIES=[
 ['Category:Vehicles in GTA VI','vehiculos'],['Category:Characters in GTA VI','personajes'],
 ['Category:Weapons in GTA VI','armas'],['Category:Locations in GTA VI','mapa-lugares']
];
export function wikiUrl(title){
 const t=clean(title,130);
 if(t.length<3||/[:/\\{}\[\]]/.test(t))return null;
 const encoded=encodeURIComponent(t.replace(/\s/g,'_'));
 return 'https://gta.wiki/w/'+encoded;
}
export function wikiFiche(title,category,revision,pageId=0){
 const sourceUrl=wikiUrl(title);
 if(!sourceUrl||!Number.isSafeInteger(revision)||revision<=0)return null;
 const labels={
  vehiculos:['vehículos','vehicles','veículos'],
  personajes:['personajes','characters','personagens'],
  armas:['armas','weapons','armas'],
  'mapa-lugares':['lugares','locations','locais']
 }[category];
 if(!labels)return null;
 const en=clean(title,130);
 return {id:'wiki-community-'+sha(sourceUrl).slice(0,24),category,
  title:{es:en,en,pt:en},
  summary:{
   es:'GTA Wiki incluye «'+en+'» entre los '+labels[0]+' vinculados a GTA VI. Esta información comunitaria no está confirmada por Rockstar.',
   en:'GTA Wiki lists '+en+' among its GTA VI '+labels[1]+'. This community information is not confirmed by Rockstar.',
   pt:'A GTA Wiki lista '+en+' entre '+labels[2]+' de GTA VI. Esta informação comunitária não é confirmada pela Rockstar.'
  },sourceUrl,sourceName:'GTA Wiki',
  sourceTier:'community_indexed_not_rockstar_confirmed',wikiRevision:revision,
  ...(pageId>0?{wikiPageId:pageId}:{})};
}
/* Wikitext parser. Only literal, single-valued safe infobox properties,
 * never templates, images, scripts, citations, coordinates or page styling.
 * Unknown keys ARE allowed, so new attributes can grow new UI cells.
 */
const BAD_SPEC_KEY=/^(?:name|title|header.*|image.*|caption.*|photo.*|file.*|logo.*|map.*|radar.*|icon.*|style.*|class|css|script|theme|width|height|coordinates?|latitude|longitude|position|reference.*|ref\d*|template.*|game\d*|group\d+_(?:data|header)\d*|data\d+|label\d+)$/i;
const BAD_SPEC_TOKEN=/(?:^|[ _-])(?:front|rear|top|side|internal|exterior|interior|dashboard)[ _-]?(?:image|photo|picture|view)/i;
export function parseWikiInfobox(source=''){
 if(typeof source!=='string'||source.length>130000)return [];
 const marker=/\{\{\s*infobox(?:[ _][a-z0-9 _-]{0,55})?(?=[|}\n])/i.exec(source);
 if(!marker)return [];
 const start=marker.index;
 const values=[];let depth=0,links=0,p=start+2;
 for(let i=start;i<source.length&&i<start+90000;i++){
  const pair=source.slice(i,i+2);
  if(pair==='{{'){depth++;i++;continue}
  if(pair==='}}'){
   depth--;if(depth===0){values.push(source.slice(p,i));break}i++;continue
  }
  if(pair==='[['){links++;i++;continue}
  if(pair===']]'){links=Math.max(0,links-1);i++;continue}
  if(source[i]==='|'&&depth===1&&links===0){values.push(source.slice(p,i));p=i+1}
 }
 const facts=new Map(),groups=new Map(),data=new Map();
 for(const raw of values.slice(1)){
  const pair=/^\s*([a-z][\w \-]{0,65})\s*=\s*([\s\S]*)$/i.exec(raw);if(!pair)continue;
  const key=pair[1].replace(/[_-]+/g,' ').replace(/\s+/g,' ').trim().toLowerCase();
  const v=pair[2];
  if(!v||v.length>900||/\{\{|\}\}|<\/?[a-z]|\bhttps?:\/\/|(?:File|Image):|\[\[(?:File|Image):/i.test(v))continue;
  const value=clean(v.replace(/\[\[([^\]|]{1,100})\|([^\]]{1,100})\]\]/g,'$2')
    .replace(/\[\[([^\]]{1,100})\]\]/g,'$1').replace(/'{2,5}/g,''),170);
  if(!value||value.length<1||value.length>170||/[{}\[\]|<>]/.test(value))continue;
  const m=/^(?:group\d+ )?label(\d+)$/i.exec(key);
  if(m){groups.set(m[1],value);continue}
  const d=/^(?:group\d+ )?data(\d+)$/i.exec(key);
  if(d){data.set(d[1],value);continue}
  if(BAD_SPEC_KEY.test(key)||BAD_SPEC_TOKEN.test(key)||key.length>70)continue;
  if(!facts.has(key))facts.set(key,{key,label:key,value});
 }
 for(const [id,label] of groups){
  const key=clean(label,70).toLowerCase(),value=data.get(id);
  if(value&&key&&!BAD_SPEC_KEY.test(key)&&!BAD_SPEC_TOKEN.test(key)&&!facts.has(key))
   facts.set(key,{key,label:clean(label,70),value});
 }
 return [...facts.values()].slice(0,18);
}
function revisionContent(page){
 const rev=page?.revisions?.[0];const main=rev?.slots?.main;
 return typeof main?.content==='string'?main.content:typeof main?.['*']==='string'?main['*']:'';
}
export async function enrichWikiSpecs(items,previous={},fetchFn=fetch,{maxPages=60}={}){
 const candidates=items.filter(x=>Number.isSafeInteger(x.wikiPageId)&&x.wikiPageId>0);
 const offset=Math.max(0,Number(previous.specCursor)||0);
 const selected=Array.from({length:Math.min(maxPages,candidates.length)},(_,i)=>candidates[(offset+i)%candidates.length]);
 const enriched=new Map(),errors=[];let inspected=0;
 for(let i=0;i<selected.length;i+=10){
  const group=selected.slice(i,i+10);
  const params=new URLSearchParams({action:'query',pageids:group.map(x=>x.wikiPageId).join('|'),
   prop:'revisions',rvprop:'ids|content',rvslots:'main',format:'json',formatversion:'2'});
  try{
   const json=JSON.parse(await boundedText('https://gta.wiki/api.php?'+params,fetchFn,{max:1900000}));
   if(!Array.isArray(json.query?.pages))throw Error('Missing Wiki revision pages');
   const byId=new Map(group.map(x=>[x.wikiPageId,x]));
   for(const page of json.query.pages){
    const record=byId.get(page.pageid);
    const rev=page.revisions?.[0];
    if(!record||!rev||rev.revid!==record.wikiRevision)continue;
    const specs=parseWikiInfobox(revisionContent(page));
    if(specs.length)enriched.set(record.id,{...record,specs});
    inspected++;
   }
  }catch(e){errors.push('Wiki infobox batch skipped: '+e.message)}
 }
 return {items:items.map(row=>enriched.get(row.id)||row),specCursor:(offset+selected.length)%Math.max(1,candidates.length),
  withSpecs:enriched.size,inspected,errors};
}

/* Scan one category page per category, persist continuation.
 * One outage never erases the previously signed 286 fiches. Never publish
 * screenshots, fabricated stats, maps or copied copyrighted images.
 */
export async function getWikiBatch(previous={},fetchFn=fetch,{withSpecifications=false}={}){
 const cursor={...(previous.cursor||{})},items=[],errors=[];
 for(const [category,label] of WIKI_CATEGORIES){
  try{
   const params=new URLSearchParams({action:'query',list:'categorymembers',cmtitle:category,
    cmnamespace:'0',cmlimit:'50',format:'json',formatversion:'2'});
   if(cursor[category]?.cmcontinue){params.set('cmcontinue',cursor[category].cmcontinue);params.set('continue',cursor[category].continue||'-||')}
   const json=JSON.parse(await boundedText('https://gta.wiki/api.php?'+params,fetchFn,{max:1400000}));
   if(!Array.isArray(json?.query?.categorymembers))throw Error('Wiki category unavailable');
   const members=json.query.categorymembers;
   const info=[];
   for(let i=0;i<members.length;i+=10){
    const ids=members.slice(i,i+10).map(p=>p.pageid).filter(n=>Number.isSafeInteger(n)&&n>0);
    if(!ids.length)continue;
    try{
     const meta=new URLSearchParams({action:'query',pageids:ids.join('|'),prop:'revisions',rvprop:'ids',format:'json',formatversion:'2'});
     const data=JSON.parse(await boundedText('https://gta.wiki/api.php?'+meta,fetchFn,{max:1400000}));
     for(const page of data.query?.pages||[]){const row=wikiFiche(page.title,label,page.revisions?.[0]?.revid||0,page.pageid);if(row)info.push(row)}
    }catch(e){errors.push(category+' metadata: '+e.message)}
   }
   if(info.length)items.push(...info);
   cursor[category]=json.continue?.cmcontinue?json.continue:null;
  }catch(e){errors.push(category+': '+e.message)}
 }
 if(errors.length===WIKI_CATEGORIES.length)throw Error('All GTA Wiki categories offline: keep last signed data');
 const unique=[...new Map(items.map(x=>[x.id,x])).values()];
 if(!unique.length)throw Error('No Wiki entries; preserve previous catalog rather than publishing an empty replacement');
 if(withSpecifications){
  const extra=await enrichWikiSpecs(unique,previous,fetchFn);
  return {items:extra.items,cursor,specCursor:extra.specCursor,
   specsInspected:extra.inspected,withSpecs:extra.withSpecs,errors:[...errors,...extra.errors]};
 }
 return {items:unique,cursor,errors};
}
