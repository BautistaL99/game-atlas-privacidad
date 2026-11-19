/* Read-only inspection of a public, temporary Firebase preview.
 * Does not issue writes, authenticate or deploy. 404/expired preview is nonfatal.
 */
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
const origin='https://gta6mapa--prueba-web-v254-63b0i2o7.web.app/app/';
const dir='revision-v250-prueba-web-android-20261117/';
async function checkAsset(path){
 const url=origin+path, controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),14000);
 try{
  const res=await fetch(url,{redirect:'error',signal:controller.signal,headers:{'User-Agent':'GameAtlas-V255-ReadOnly-QA/1'}});
  if(!res.ok)return {path,status:res.status};
  const buf=Buffer.from(await res.arrayBuffer());
  if(buf.byteLength>2500000)return {path,status:res.status,error:'oversized'};
  let compare=null;
  try{
   const old=await readFile(dir+path);
   compare={sameAsV250:old.equals(buf),v250sha256:createHash('sha256').update(old).digest('hex').slice(0,16)};
  }catch{}
  return {path,status:res.status,bytes:buf.length,sha256:createHash('sha256').update(buf).digest('hex').slice(0,16),...compare};
 }catch(e){return {path,error:e.message}}
 finally{clearTimeout(timeout)}
}
const files=['index.html','app-v137.js','community-v206.js','detail-enhancements-v160.js','online-updates.js','assets/leonida-landmarks-v216.json','atlas-v247-ios-v242-remote-map.js'];
for(const f of files){const item=await checkAsset(f);console.log('V254 READONLY',JSON.stringify(item))}
