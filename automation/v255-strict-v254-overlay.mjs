/* V255 exact-source V254 overlay, deterministic and fail-closed.
 * No replacement with obsolete V220 app. No external dependency beyond Node 22.
 */
import {readFile,writeFile,mkdir,cp} from 'node:fs/promises';
import {dirname,join} from 'node:path';
import {Script} from 'node:vm';
const ORIGIN='https://gta6mapa--prueba-web-v254-63b0i2o7.web.app/app/';
const OUT='qa/v255-firebase-test';
const appPath=join(OUT,'app');
const dollar=String.fromCharCode(36),tick=String.fromCharCode(96);
async function download(file){
 if(!/^[\w./-]+$/.test(file)||file.includes('..')||file.startsWith('/'))throw Error('Unsafe path '+file);
 const response=await fetch(ORIGIN+file,{redirect:'error',signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw Error('V254 '+file+' HTTP '+response.status);
 const bytes=Buffer.from(await response.arrayBuffer());
 if(!bytes.length||bytes.length>2600000)throw Error('Invalid V254 asset bytes '+file);
 return bytes;
}
function one(src,oldText,newText,label){
 const parts=src.split(oldText);
 if(parts.length!==2)throw Error('Fail closed, V254 anchor '+label+': '+(parts.length-1));
 return parts.join(newText);
}
function between(src,a,b){
 const start=src.indexOf(a);
 if(start<0)throw Error('Missing source segment '+a.slice(0,70));
 const end=src.indexOf(b,start+a.length);
 if(end<0)throw Error('Missing segment end '+b.slice(0,70));
 return src.slice(start,end);
}
await mkdir(appPath,{recursive:true});
await cp('revision-v250-prueba-web-android-20261117',appPath,{recursive:true});
const baseApp=(await readFile('app/app-v137.js','utf8'));
const baseCommunity=(await readFile('app/community-v206.js','utf8'));
const core=['index.html','app-v137.js','community-v206.js','detail-enhancements-v160.js'];
for(const file of core){
 await writeFile(join(appPath,file),await download(file));
}
let html=await readFile(join(appPath,'index.html'),'utf8');
const scripts=[...html.matchAll(/<(?:script|link)\b[^>]*?\b(?:src|href)\s*=\s*["']\.\/([^"'?#]+)(?:\?[^"']*)?["']/gi)].map(m=>m[1]);
const unique=[...new Set(scripts)].filter(p=>!core.includes(p)&&/^[\w./-]+$/.test(p)&&!p.includes('..'));
let fetched=0;
for(const file of unique){
 await mkdir(dirname(join(appPath,file)),{recursive:true});
 await writeFile(join(appPath,file),await download(file));fetched++;
}
let app=await readFile(join(appPath,'app-v137.js'),'utf8');
let community=await readFile(join(appPath,'community-v206.js'),'utf8');
const original=app;
const photoStart='const wikiPhoto=';
const updatedPhoto=between(baseApp,photoStart,';return '+tick+'<img')+';';
const oldPhoto=between(app,'const provided=',';return '+tick+'<img')+';';
app=one(app,oldPhoto,updatedPhoto,'preview photo');
app=one(app,'viWikiSafeRaw(x.key,70)&&(',
 'viWikiSafeRaw(x.key,70)&&!/^(?:panel[ _-]?(?:image|photo)|(?:front|rear|side)[ _-]?image|image|photo|file|caption)/i.test(x.key)&&!/\\.(?:png|jpe?g|webp)(?:\\s|$)/i.test(x.valueI18n?.en||x.value||\'\')&&(',
 'technical image filename exclusion');
const bySourceLine=" for(const row of records)for(const src of row.sources||[])if(src?.url)bySource.set(String(src.url).replace(/\\/$/,''),row.id);";
const alias=between(baseApp,' const canonical=s=>',' let added=0,updated=0;');
app=one(app,bySourceLine,bySourceLine+'\n'+alias.trimEnd(),'explicit wiki identity crosswalk');
const oldMatch='const matchedId=bySource.get(source)||row.id;';
const newMatch=between(baseApp,'const matchedId=','\n  const old=byId.get(matchedId);').trim();
app=one(app,oldMatch,newMatch,'wiki to curated identity');
const oldNext='const next={...old,sources,wikiSpecs:row.wikiSpecs,wikiSource:source};';
const newNext=between(baseApp,'const next={...old,sources,wikiSpecs','\n   viWikiApplyLocale(next,locale);').trim();
app=one(app,oldNext,newNext,'preserve ID and exact photo');
const oldMerge='byId.set(matchedId,{...old,...row,facets:{...(old.facets||{}),...row.facets}});updated++;';
const newMerge=between(baseApp,'byId.set(matchedId,{...old,...row,facets','\n  }\n }\n for(const wiki').trim();
app=one(app,oldMerge,newMerge,'merge wiki image');
app=one(app,'trackable:false,wikiSpecs:specs,wikiSource:wiki.sourceUrl,',
 'trackable:false,wikiSpecs:specs,wikiSource:wiki.sourceUrl,\n   ...(wiki.image?{image:wiki.image}:{}),\n   ...(wiki.imageSource?{imageSource:wiki.imageSource}:{}),',
 'signed image in record');
const photoLink=between(baseApp,dollar+'{i.imageSource?'+tick,dollar+'{i.image?.remote&&i.image?.type===\'official\'?');
const detailCaption='<div class="image-caption"><span>';
if(app.split(detailCaption).length!==2)throw Error('V254 detail caption is not unique');
const captionAt=app.indexOf(detailCaption),captionEnd=app.indexOf('</span>',captionAt+detailCaption.length);
if(captionEnd<0)throw Error('V254 image-caption closing span missing');
app=app.slice(0,captionEnd+7)+photoLink+app.slice(captionEnd+7);
app=one(app,'allowed.has(p.category)&&Number.isFinite(p.x)',
 "allowed.has(p.category)&&!p.tags.some(t=>['unconfirmed','demolished'].includes(String(t).toLowerCase()))&&Number.isFinite(p.x)",
 'hide unconfirmed map points');
const personal=dollar+"{p.kind==='personal'?"+tick+'<button type="button" class="vi-delete-marker"';
const sourceLink=between(baseApp,dollar+"{p.kind==='community'?"+tick+'<a',personal);
const pcount=app.split(personal).length-1;
if(pcount!==2)throw Error('V254 popup layout changed: '+pcount);
app=app.split(personal).join(sourceLink+personal);
if(app.includes('pins.length===0&&!mapAdd?'))app=app.replace('pins.length===0&&!mapAdd?','pins.length===0&&!mapAdd&&mapCategories.length>0?');
community=one(community,
 "item.image!==undefined||item.facts!==undefined||item.mapPoint!==undefined||item.gallery!==undefined)throw Error('Untrusted community profile');",
 "item.facts!==undefined||item.mapPoint!==undefined||item.gallery!==undefined)throw Error('Untrusted community profile');",
 'wiki image signed guard');
const rights=between(baseCommunity,'   if(item.imageSource!==undefined','   if(item.specs!==undefined)');
community=one(community,'   if(item.specs!==undefined){',rights+'   if(item.specs!==undefined){','wiki metadata and rights');
const gallery=await readFile('app/detail-enhancements-v160.js','utf8');
new Script(app,{filename:'app-v137.js'});
new Script(community,{filename:'community-v206.js'});
new Script(gallery,{filename:'detail-enhancements-v160.js'});
if(!original.includes('viIosApplyRemoteMap')||!app.includes('viIosApplyRemoteMap')||
  !app.includes('mapSpotlightHidden')||!app.includes('mapRouteOnly'))throw Error('V254 app map feature missing');
for(const item of ['wikiCuratedSourceIds','imageSource','map.stateofleonida.net','wiki-licensed']){
 if(!app.includes(item))throw Error('Missing integrated V255 '+item);
}
await writeFile(join(appPath,'app-v137.js'),app);
await writeFile(join(appPath,'community-v206.js'),community);
await writeFile(join(appPath,'detail-enhancements-v160.js'),gallery);
await cp('updates',join(OUT,'updates'),{recursive:true});
await writeFile(join(OUT,'index.html'),'<meta http-equiv="refresh" content="0;url=./app/">');
console.log('V255 V254 STRICT OVERLAY',JSON.stringify({baseV254Bytes:original.length,resultBytes:app.length,referencedAssetsFetched:fetched,result:'READY_FOR_QA_NOT_DEPLOYED'}));
