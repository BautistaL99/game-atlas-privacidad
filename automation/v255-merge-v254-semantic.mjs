/* Reconcile V255 fixes with the ACTUAL preview V254 without reverting later
 * fixes or reintroducing V220. Safe dry-run, no deploy.
 * Requires npm install --no-save diff-match-patch@1.0.5
 */
import DiffMatchPatch from 'diff-match-patch';
import {readFile,writeFile,mkdir,cp} from 'node:fs/promises';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
const ORIGIN='https://gta6mapa--prueba-web-v254-63b0i2o7.web.app/app/';
const OUT='qa/v255-merged-preview';
const files=['app-v137.js','community-v206.js','detail-enhancements-v160.js'];
const git=spawnSync('git',['fetch','origin','main','--depth=1'],{encoding:'utf8'});
if(git.status!==0)throw Error('main fetch failed: '+git.stderr);
await mkdir(OUT,{recursive:true});
await cp('revision-v250-prueba-web-android-20261117',join(OUT,'app'),{recursive:true});
const report=[];
for(const file of files){
 const baseline=spawnSync('git',['show','origin/main:app/'+file],{encoding:'utf8',maxBuffer:2000000});
 if(baseline.status!==0)throw Error('Baseline missing '+file);
 const modified=await readFile('app/'+file,'utf8');
 const response=await fetch(ORIGIN+file,{redirect:'error',signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw Error('V254 missing '+file+' '+response.status);
 const preview=await response.text();
 if(preview.length<1000||preview.length>1500000)throw Error('Invalid V254 file '+file);
 const dmp=new DiffMatchPatch();
 dmp.Match_Distance=50000;
 dmp.Match_Threshold=0.35;
 dmp.Patch_Margin=60;
 const patchset=dmp.patch_make(baseline.stdout,modified);
 const [merged,passes]=dmp.patch_apply(patchset,preview);
 const done=passes.every(Boolean);
 const row={file,patches:passes.length,passes:passes.filter(Boolean).length,originalBytes:preview.length,mergedBytes:merged.length,applied:done};
 report.push(row);
 if(!done)continue;
 if(file==='app-v137.js'){
  for(const marker of ['wikiCuratedSourceIds','Ver imagen original en GTA Wiki','map.stateofleonida.net','viIosApplyRemoteMap','mapSpotlightHidden','mapRouteOnly']){
   if(!merged.includes(marker))throw Error('Required V254 or V255 feature missing after merge: '+marker);
  }
 }
 await writeFile(join(OUT,'app',file),merged);
}
await writeFile('qa/v255-semantic-merge-report.json',JSON.stringify(report,null,2));
console.log('V255 SEMANTIC MERGE REPORT',JSON.stringify(report));
if(report.some(r=>!r.applied))throw Error('V254 semantic merge incomplete, do not deploy.');
const index=await fetch(ORIGIN+'index.html',{redirect:'error',signal:AbortSignal.timeout(15000)});
if(!index.ok)throw Error('V254 index unavailable');
await writeFile(join(OUT,'app/index.html'),await index.text());
console.log('V254 preserved and V255 overlay applied; not deployed');
