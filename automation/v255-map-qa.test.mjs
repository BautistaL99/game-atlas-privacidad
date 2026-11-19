import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('V255 map keeps the attributable, calibrated Yanis V17 dataset instead of guessing V18 transform',async()=>{
 const d=JSON.parse(await readFile('app/assets/leonida-landmarks-v216.json','utf8'));
 assert.equal(d.schema,216);assert.equal(d.mapVersion,'map-v216-yanis17');
 assert.equal(d.license,'CC BY 4.0');assert.match(d.source,/github\.com\/rolux\/gtadb\.org/);
 assert(d.items.length>=900);
 assert(d.items.every(p=>/^L\d+$/.test(p.sourceId)&&Number.isFinite(p.x)&&Number.isFinite(p.y)
  &&p.x>=0&&p.x<=100&&p.y>=0&&p.y<=100));
 const ids=d.items.map(p=>p.sourceId);
 assert.equal(new Set(ids).size,ids.length,'Map source IDs must remain stable and unique');
 const safe=d.items.filter(p=>!p.tags.some(t=>['unconfirmed','demolished'].includes(String(t).toLowerCase())));
 assert(safe.length>700&&safe.length<d.items.length,'Explicitly dubious landmarks should not display by default');
});
test('V255 map offers source verification but does not invent verified wiki links',async()=>{
 const s=await readFile('app/app-v137.js','utf8');
 assert(s.includes('https://map.stateofleonida.net/'));
 assert(s.includes('https://gta.wiki/w/Special:Search?search='));
 assert(s.includes("['unconfirmed','demolished']"));
 assert(s.includes('pins.length===0&&!mapAdd&&mapCategories.length>0?'));
});
