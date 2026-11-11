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
export function wikiFiche(title,category,revision){
 const sourceUrl=wikiUrl(title);
 if(!sourceUrl||!Number.isSafeInteger(revision)||revision<0)return null;
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
  sourceTier:'community_indexed_not_rockstar_confirmed',wikiRevision:revision};
}
/* Scan one category page per category, persist continuation.
 * One outage never erases the previously signed 286 fiches. Never publish
 * screenshots, fabricated stats, maps or copied copyrighted images.
 */
export async function getWikiBatch(previous={},fetchFn=fetch){
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
     for(const page of data.query?.pages||[]){const row=wikiFiche(page.title,label,page.revisions?.[0]?.revid||0);if(row)info.push(row)}
    }catch(e){errors.push(category+' metadata: '+e.message)}
   }
   if(info.length)items.push(...info);
   cursor[category]=json.continue?.cmcontinue?json.continue:null;
  }catch(e){errors.push(category+': '+e.message)}
 }
 if(errors.length===WIKI_CATEGORIES.length)throw Error('All GTA Wiki categories offline: keep last signed data');
 return {items:[...new Map(items.map(x=>[x.id,x])).values()],cursor,errors};
}
