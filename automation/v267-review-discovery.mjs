/* Read-only discovery. Candidate links only: no publication, no owner approval, no secrets. */
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
export const categories={
 personajes:['Characters in GTA VI'],vehiculos:['Vehicles in GTA VI'],armas:['Weapons in GTA VI'],
 'mapa-lugares':['Locations in GTA VI'],misiones:['Missions in GTA VI'],
 coleccionables:['Collectibles in GTA VI'],secretos:['Secrets in GTA VI','Easter Eggs in GTA VI'],
 economia:['Businesses in GTA VI','Properties in GTA VI'],actividades:['Activities in GTA VI'],
 mundo:['Gangs in GTA VI','Organizations in GTA VI'],
 'flora-fauna':['Animals in GTA VI','Plants in GTA VI','Wildlife in GTA VI'],
 musica:['Radio Stations in GTA VI','Music in GTA VI','Soundtrack in GTA VI']
};
// Deliberate overlap is resolved by review, never automatically categorized twice.
const norm=s=>String(s).normalize('NFKC').toLowerCase().replace(/[_\s]+/g,' ').trim();
const clean=(s,max=180)=>typeof s==='string'&&s.length>0&&s.length<=max&&!/[<>\x00-\x1f]/.test(s);
export function wikiUrl(title){if(!clean(title,160)||/[:/\\{}\[\]]/.test(title))return null;return 'https://gta.wiki/w/'+encodeURIComponent(title.replace(/ /g,'_'));}
const sha=s=>createHash('sha256').update(s).digest('hex');
const verifiedLicense=/^(?:CC0(?: 1\.0)?|Public Domain|CC BY(?:-SA)? [234]\.0)$/i;
export function imageCandidate(file){
 const i=file?.imageinfo?.[0],m=i?.extmetadata||{};if(!i||!clean(file.title,220)||!file.title.startsWith('File:')||!clean(i.descriptionurl,500))return null;
 let u,p;try{u=new URL(i.url);p=new URL(i.descriptionurl)}catch{return null}
 if(u.origin!=='https://gta.wiki'||!/^\/images\/[a-z0-9_/%().,\-]+\.(?:png|jpe?g|webp)$/i.test(u.pathname)||u.search||u.hash||p.origin!=='https://gta.wiki'||!p.pathname.startsWith('/w/File:'))return null;
 const license=m.LicenseShortName?.value,licenseUrl=m.LicenseUrl?.value,artist=m.Artist?.value;
 if(!verifiedLicense.test(license||'')||!clean(licenseUrl,500)||!clean(artist,300)||!/^https:\/\/creativecommons\.org\/(?:licenses|publicdomain)\//i.test(licenseUrl)||!['image/png','image/jpeg','image/webp'].includes(i.mime))return null;
 return {url:u.href,sourcePage:p.href,license,licenseUrl,artist,rightsStatus:'review-required',note:'Metadata only; association, rights, file bytes and attribution must be checked by owner.'};
}
async function api(params,fetchFn){const url='https://gta.wiki/api.php?'+new URLSearchParams({format:'json',formatversion:'2',...params});const r=await fetchFn(url,{redirect:'error',headers:{Accept:'application/json','User-Agent':'GameAtlasReviewDiscovery/1.0'},signal:AbortSignal.timeout(18000)});if(!r.ok)throw Error('HTTP '+r.status);if(Number(r.headers.get('content-length')||0)>2000000)throw Error('API oversized');const text=await r.text();if(text.length>2000000)throw Error('API oversized');const data=JSON.parse(text);if(data.error)throw Error('API '+String(data.error.code||'error'));return data;}
export async function scan(prior={},fetchFn=fetch,{now=new Date().toISOString(),maxPages=25,maxImageChecks=12}={}){
 if(prior.schema!==undefined&&prior.schema!==1)throw Error('Unknown candidate queue schema');
 const rows=new Map((prior.candidates||[]).map(c=>[c.pageId,structuredClone(c)])),state=structuredClone(prior.state||{}),report={};let imageBudget=maxImageChecks;
 for(const [category,aliases] of Object.entries(categories)){
  const results=[];report[category]=results;
  for(const alias of aliases){const title='Category:'+alias,key=category+'|'+title,previous=state[key]||{};try{
   const check=await api({action:'query',titles:title,prop:'categoryinfo'},fetchFn),page=check.query?.pages?.[0];
   if(!page||page.missing||page.ns!==14){results.push({source:title,status:'not-found'});continue;}
   const batch=await api({action:'query',list:'categorymembers',cmtitle:title,cmnamespace:'0',cmlimit:String(maxPages),...(previous.cursor||{})},fetchFn);
   if(!Array.isArray(batch.query?.categorymembers))throw Error('missing members');
   const ids=[...new Set(batch.query.categorymembers.map(p=>p.pageid).filter(x=>Number.isSafeInteger(x)&&x>0))];
   let complete=true,count=0;for(let n=0;n<ids.length;n+=10){const group=ids.slice(n,n+10);
    const meta=await api({action:'query',pageids:group.join('|'),prop:'revisions',rvprop:'ids'},fetchFn);const found=new Set();
    for(const p of meta.query?.pages||[]){const url=wikiUrl(p.title),revision=p.revisions?.[0]?.revid;if(!group.includes(p.pageid)||!url||!Number.isSafeInteger(revision)||revision<1)continue;found.add(p.pageid);
     const old=rows.get(p.pageid);const c={pageId:p.pageid,sourceUrl:url,sourceName:'GTA Wiki',sourceTier:'community-not-confirmed-by-rockstar',communityId:'wiki-community-'+sha(url).slice(0,24),title:p.title,revision,categoryOptions:[...new Set([...(old?.categoryOptions||[]),category])].sort(),categoryEvidence:[...new Set([...(old?.categoryEvidence||[]),title])].sort(),reviewStatus:'pending',needs:['verify-gta-vi-relevance','resolve-category-and-existing-id','write-and-review-es-en-pt','verify-facts-and-map','verify-image-rights'],lastSeen:now};
     if(old?.revision===revision&&old.sourceUrl===url&&old.imageCandidates)c.imageCandidates=old.imageCandidates;
     if(old&&old.sourceUrl!==url)c.previousSourceUrls=[...new Set([...(old.previousSourceUrls||[]),old.sourceUrl])];
     if(imageBudget>0&&!c.imageCandidates){imageBudget--;try{const im=await api({action:'query',pageids:String(p.pageid),prop:'images',imlimit:'10'},fetchFn);const names=(im.query?.pages?.[0]?.images||[]).map(x=>x.title).filter(x=>clean(x,220)&&x.startsWith('File:')).slice(0,4);if(names.length){const info=await api({action:'query',titles:names.join('|'),prop:'imageinfo',iiprop:'url|mime|extmetadata'},fetchFn);c.imageCandidates=(info.query?.pages||[]).map(imageCandidate).filter(Boolean);}else c.imageCandidates=[];}catch(e){c.imageCheckError=String(e.message).slice(0,160);}}
     rows.set(p.pageid,c);count++;
    }if(group.some(id=>!found.has(id)))complete=false;
   }
   if(complete)state[key]={cursor:batch.continue?.cmcontinue?{cmcontinue:batch.continue.cmcontinue,continue:batch.continue.continue||'-||'}:null,scans:(previous.scans||0)+1,lastChecked:now};
   results.push({source:title,status:complete?(batch.continue?.cmcontinue?'partial':'end-of-source'):'metadata-incomplete',count,cursorAdvanced:complete});
  }catch(e){results.push({source:title,status:'error',error:String(e.message).slice(0,200)});}}
 }
 const candidates=[...rows.values()].sort((a,b)=>a.pageId-b.pageId);if(candidates.length>50000)throw Error('Review queue capacity reached; preserve previous artifact');
 const coverage=Object.fromEntries(Object.keys(categories).map(c=>[c,{candidates:candidates.filter(x=>x.categoryOptions.includes(c)).length,unambiguous:candidates.filter(x=>x.categoryOptions.length===1&&x.categoryOptions[0]===c).length,sources:report[c]}]));
 return {schema:1,generatedAt:now,notice:'UNREVIEWED candidates only. No factual completeness, license approval or remote publication implied.',candidates,state,coverage};
}
async function cli(){const file=resolve(process.argv[2]||'review-queue/queue.json');let prior={};try{prior=JSON.parse(await readFile(file,'utf8'))}catch(e){if(e.code!=='ENOENT')throw e;}const next=await scan(prior);await mkdir(dirname(file),{recursive:true});await writeFile(file+'.tmp',JSON.stringify(next,null,2)+'\n');await rename(file+'.tmp',file);console.log(JSON.stringify({candidates:next.candidates.length,coverage:next.coverage},null,2));if(Object.values(next.coverage).every(x=>x.sources.every(s=>['error','not-found'].includes(s.status))))throw Error('No usable category source; prior candidates preserved');}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await cli();
