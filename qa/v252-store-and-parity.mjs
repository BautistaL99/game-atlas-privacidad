/* Game Atlas V252: shared content and storefront regression. No purchases are triggered. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const dirs=process.argv.slice(2);
assert(dirs.length>=2,'Provide the root app and android-v215/www');
const [appDir,androidDir,iosDir]=dirs;
const read=(dir,p)=>fs.readFileSync(path.join(dir,p));
const walk=dir=>{
  const result=new Map();
  const recur=(sub)=>{for(const entry of fs.readdirSync(path.join(dir,sub),{withFileTypes:true})){
    const rel=path.posix.join(sub,entry.name);
    if(entry.isDirectory())recur(rel);
    else if(entry.isFile())result.set(rel,crypto.createHash('sha256').update(read(dir,rel)).digest('hex'));
  }};
  recur('');return result;
};
const a=walk(appDir),b=walk(androidDir);
assert.deepEqual([...a].sort(),[...b].sort(),'Android staging source must match APK webDir byte-for-byte');
const manifest=JSON.parse(read(appDir,'manifest.webmanifest').toString('utf8'));
assert.equal(manifest.id,'/app/','Do not ship a legacy preview manifest in Android/Play');
const src=read(appDir,'app-v137.js').toString('utf8');
const meta=read(appDir,'monetization-v250.js').toString('utf8');
const i=src.indexOf("card('monthly',1,");
assert(i>=0&&src.indexOf("card('lifetime',2,",i)>i&&src.indexOf("card('ranking',3,",i)>i,'Monthly card must be shown before lifetime/ranking');
for(const amount of ['0.99','1.99','2.99','4.99','9.99','19.99','49.99','99.99'])assert(meta.includes(amount),'Missing updated reference price '+amount);
assert(!src.includes('No suma al Top de colaboradores')&&!src.includes('Does not count toward the leaderboard')&&!src.includes('Não conta para o ranking'),'Remove redundant Top notice from ad-free cards');
assert(src.includes('billingPageV249')&&src.includes('vi-v251-route-only-ios'),'Keep billing/route UI');
assert(meta.includes('billingEnabled:false')&&meta.includes('purchaseAvailable(){return false;}'),'Must not simulate payments');
if(iosDir){
  for(const n of ['app-v137.js','monetization-v250.js'])assert.equal(read(appDir,n).toString('utf8'),read(iosDir,n).toString('utf8'),'Cross-platform shared code differs: '+n);
}
for(const pathName of ['assets/leonida-yanis-v17.webp','assets/leonida-landmarks-v216.json','icons/icon-512.png'])assert(a.has(pathName),'Missing important bundled asset '+pathName);
console.log(`PASS V252 storefront/card order and byte-identical app/android content: ${a.size} files; source images embedded`);
