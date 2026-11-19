/* Read-only build verification: can V255's reviewed patch be applied onto the
 * ACTUAL Firebase V254 assets, without replacing V254 with a stale V220 bundle?
 * On failure: no upload, no deployment, and original files remain intact.
 */
import {mkdir,cp,writeFile,readFile} from 'node:fs/promises';
import {dirname,join} from 'node:path';
import {spawnSync} from 'node:child_process';
const origin='https://gta6mapa--prueba-web-v254-63b0i2o7.web.app/app/';
const staging='qa/v255-preview-ready';
await mkdir(staging,{recursive:true});
await cp('revision-v250-prueba-web-android-20261117',join(staging,'app'),{recursive:true});
for(const path of ['index.html','app-v137.js','community-v206.js','detail-enhancements-v160.js']){
 const res=await fetch(origin+path,{redirect:'error',signal:AbortSignal.timeout(17000)});
 if(!res.ok)throw Error('V254 is not accessible: '+path+': '+res.status);
 const data=Buffer.from(await res.arrayBuffer());
 if(!data.length||data.length>1200000)throw Error('V254 invalid asset: '+path);
 await writeFile(join(staging,'app',path),data);
}
const before=await readFile(join(staging,'app','app-v137.js'));
const fetchMain=spawnSync('git',['fetch','origin','main','--depth=1'],{encoding:'utf8'});
if(fetchMain.status!==0)throw Error(fetchMain.stderr);
const patch=spawnSync('git',['diff','origin/main','HEAD','--','app/app-v137.js','app/community-v206.js','app/detail-enhancements-v160.js'],{encoding:'utf8',maxBuffer:3000000});
if(patch.status!==0||!patch.stdout.trim())throw Error('Missing V255 delta');
await writeFile(join(staging,'v255.patch'),patch.stdout);
const result=spawnSync('patch',['--batch','-p1','--dry-run','-i','v255.patch'],{cwd:staging,encoding:'utf8',maxBuffer:3000000});
const report={source:'public Firebase V254 preview',inputBytes:before.length,patchBytes:patch.stdout.length,applicable:result.status===0,details:(result.stdout+'\n'+result.stderr).slice(0,3600)};
await writeFile(join('qa','v255-v254-rebase-report.json'),JSON.stringify(report,null,2));
console.log('V255 V254 REBASE REPORT',JSON.stringify(report));
if(result.status!==0)throw Error('DO NOT DEPLOY: V255 diff does not cleanly apply to V254');
