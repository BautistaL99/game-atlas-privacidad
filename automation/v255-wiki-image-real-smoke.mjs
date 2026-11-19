/* V255 real-source, read-only E2E check. No catalog update, no image copying,
 * no deployment, no GitHub signing secrets and no user-state changes.
 */
import {wikiPhotoCandidate,enrichWikiImageBatch} from './v255-wiki-image-discovery.mjs';
const sourceUrl='https://gta.wiki/w/Mule';
const endpoint='https://gta.wiki/api.php';
async function request(url){
 const control=new AbortController();
 const alarm=setTimeout(()=>control.abort(),12000);
 try{
  const response=await fetch(url,{signal:control.signal,headers:{Accept:'application/json'}});
  if(!response.ok)throw Error('GTA Wiki HTTP '+response.status);
  const body=await response.text();
  if(body.length>1000000)throw Error('MediaWiki response too large');
  return body;
 }finally{clearTimeout(alarm)}
}
const params=new URLSearchParams({action:'query',prop:'revisions',titles:'Mule',
 rvslots:'main',rvprop:'ids|content',format:'json',formatversion:'2'});
const data=JSON.parse(await request(endpoint+'?'+params));
const page=data.query?.pages?.[0],revision=page?.revisions?.[0];
const raw=revision?.slots?.main?.content??revision?.slots?.main?.['*'];
if(typeof raw!=='string'||!revision?.revid)throw Error('GTA Wiki Mule revision unavailable');
const filename=wikiPhotoCandidate(raw);
if(!filename)throw Error('No exact GTA VI photo found for Mule; review infobox parser');
const row={id:'wiki-community-aaaaaaaaaaaaaaaaaaaaaaaa',sourceUrl};
const result=await enrichWikiImageBatch([row],new Map([[row.id,raw]]),request,{max:1});
const summary={source:sourceUrl,pageRevision:revision.revid,filename,
 photoMatched:result.checked===1,
 photoAllowedForReuse:result.accepted===1,
 image:result.items[0]?.image?.remote||null,errors:result.errors};
console.log('V255 REAL GTA WIKI READ-ONLY CHECK',JSON.stringify(summary,null,2));
if(result.checked!==1||result.errors.length)process.exitCode=1;
if(result.accepted===0)console.log('Image found, but the source file did not pass the independent license/origin/size rules. Do not use it as a generic substitute.');
