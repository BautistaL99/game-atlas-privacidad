import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('V255 reviewed wiki-to-curated aliases really exist in BOTH signed and curated data',async()=>{
 const env=JSON.parse(await readFile('updates/community-envelope-v205.json','utf8'));
 const signed=JSON.parse(Buffer.from(env.payload,'base64').toString('utf8'));
 const js=await readFile('app/app-v137.js','utf8');
 const m=/\/\* CATALOG_START \*\/\s*const records=(\[[\s\S]*?\]);\s*\/\* CATALOG_END \*\//.exec(js);
 assert(m,'Original curated records must remain available');
 const curated=JSON.parse(m[1]);
 const matches=[
  ['Enduro','dinka-enduro'],
  ['Stanier (1955)','55-vapid-stanier'],
  ['Dominator Buggy','67-vapid-dominator-buggy'],
  ['Squalo','shitzu-squalo']
 ];
 for(const [name,id] of matches){
  const expected='https://gta.wiki/w/'+encodeURIComponent(name.replace(/ /g,'_'));
  const w=signed.fiches.find(x=>x.sourceUrl===expected&&x.category==='vehiculos');
  const c=curated.find(x=>x.id===id&&x.category==='vehiculos');
  assert(w&&c,'Verified GTA VI wiki + curated vehicle pair missing: '+name+' => '+id);
  assert(js.includes("'vehiculos|"+expected+"','"+id+"'"),'Explicit stable ID source map missing for '+name);
 }
 // Sets of revolvers, body kits and other variants must never merge on a
 // fuzzy match with individual weapons or base vehicle entries.
 assert(!js.includes("'armas|https://gta.wiki/w/Morgan','hawk-little-morgan-revolvers'"));
 assert(!js.includes("'vehiculos|https://gta.wiki/w/Ganado','ganado-retro-build'"));
});
