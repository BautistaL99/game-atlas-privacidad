/** V244 ranking integrity regression. No fake fastest/slowest outputs without verified stats. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
const app=fs.readFileSync(path.resolve('app/app-v137.js'),'utf8');
const begin=app.indexOf('/* SHARED_SEARCH_ENGINE_START */');
const end=app.indexOf('/* SHARED_SEARCH_ENGINE_END */',begin);
assert(begin>=0 && end>begin,'Shared search engine markers not found');
const context=vm.createContext({});
vm.runInContext(app.slice(begin,end)+'\nglobalThis.query=searchCatalogCore;',context);
const query=(s,items)=>context.query(s,items);
const beginData=app.indexOf('const records=')+'const records='.length;
const endData=app.indexOf(';\n',beginData);
const records=JSON.parse(app.slice(beginData,endData));
const vehicles=records.filter(r=>r.category==='vehiculos');
assert(vehicles.length>0,'No vehicles in catalog');
const count=vehicles.filter(v=>Number.isFinite(v.stats?.speed)).length;
for(const [locale,fast,slow] of [
  ['es','auto mas rapido','auto mas lento'],
  ['en','fastest car','slowest car'],
  ['pt','carro mais rapido','carro mais lento']
]){
 for(const text of [fast,slow]){
  const answer=query(text,records);
  assert.equal(answer.intent,'ranking',locale+' rank intent not recognized: '+text);
  if(answer.measuredCount<2||answer.measuredCount<answer.candidateCount){
   assert.equal(answer.needsData,true,locale+' falsely claims complete data: '+text);
   assert.equal(answer.results.length,0,locale+' exposes unranked vehicles as ranking: '+text);
  }else{
   assert.equal(answer.needsData,false,'Complete rank should be available: '+text);
   const nums=Array.from(answer.results,record=>record.stats.speed);
   for(let i=1;i<nums.length;i++)assert(text===fast?nums[i-1]>=nums[i]:nums[i-1]<=nums[i],
    'Expected reverse ordering for '+text);
  }
 }
 console.log('PASS '+locale+': ranking is truthful for current verified data');
}
const make=(id,speed)=>({id,category:'vehiculos',status:'verified',facets:{tipo:'auto'},stats:{speed},title:{es:id,en:id,pt:id}});
const full=[make('slow',70),make('middle',110),make('fast',180)];
for(const [fast,slow] of [
 ['auto mas rapido','auto mas lento'],
 ['fastest car','slowest car'],
 ['carro mais rapido','carro mais lento']
]){
 const high=query(fast,full),low=query(slow,full);
 assert.equal(high.needsData,false,'Complete ranking high not available: '+fast);
 assert.equal(low.needsData,false,'Complete ranking low not available: '+slow);
 assert.deepEqual(Array.from(high.results,r=>r.id),['fast','middle','slow']);
 assert.deepEqual(Array.from(low.results,r=>r.id),['slow','middle','fast']);
 console.log('PASS synthetic: '+fast+' / '+slow+' order correctly reverses');
}
const partial=[make('known',100),{id:'missing',category:'vehiculos',status:'verified',facets:{tipo:'auto'}}];
for(const q of ['auto mas rapido','auto mas lento']){
 const r=query(q,partial);
 assert.equal(r.needsData,true,'Partial data must not be called a full ranking');
 assert.equal(r.results.length,0,'Partial data displayed as full ranking');
 assert.equal(r.candidateCount,2);assert.equal(r.measuredCount,1);
}
console.log('PASS partial stats: no unverified first/last claims');