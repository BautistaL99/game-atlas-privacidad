import test from 'node:test';
import assert from 'node:assert/strict';
import {mergeWikiSafely} from './v210-publisher.mjs';
import {wikiFiche,getWikiBatch,enrichWikiSpecs} from './v210-sources.mjs';
const fiche=(name='Test Car',rev=1,id=12)=>wikiFiche(name,'vehiculos',rev,id);
const spec={key:'seats',label:'seats',value:'2'};
const base=(fiches=[])=>({schema:205,mode:'INDEPENDENT_REPORTING_AND_COMMUNITY_WIKI_NOT_OFFICIAL',revision:2,news:[],fiches:fiches.map(({wikiPageId,...x})=>x)});
test('safe merge preserves IDs, rejects ambiguous aliases and keeps categories',()=>{
 const old=fiche(), state=base([old]);
 const same={...fiche('TEST CAR'),wikiRevision:2};
 const result=mergeWikiSafely(state,[same,{...old,category:'armas',wikiRevision:2}]);
 assert.equal(result.changed,0);assert.equal(result.report.conflicts.length,2);
 assert.equal(result.next,state);
});
test('uninspected revision cannot erase prior facts; checked empty revision can',()=>{
 const old={...fiche(),specs:[spec]},state=base([old]);
 const pending=mergeWikiSafely(state,[{...fiche('Test Car',2),wikiSpecsChecked:false}]);
 assert.equal(pending.report.deferred,1);assert.equal(pending.next,state);
 const reviewed=mergeWikiSafely(state,[{...fiche('Test Car',2),wikiSpecsChecked:true}]);
 assert.equal(reviewed.changed,1);assert.equal(reviewed.next.fiches[0].specs,undefined);
 assert(!('wikiSpecsChecked' in reviewed.next.fiches[0]));
});
test('same revision enrichment adds missing fields without destroying existing ones',()=>{
 const old={...fiche(),specs:[spec]},state=base([old]);
 const next=mergeWikiSafely(state,[{...fiche(),specs:[{...spec,value:'4'},{key:'type',label:'type',value:'sports'}],wikiSpecsChecked:true}]);
 assert.equal(next.report.updated,1);assert.deepEqual(next.next.fiches[0].specs,[spec,{key:'type',label:'type',value:'sports'}]);
 assert.equal(mergeWikiSafely(next.next,[{...fiche(),specs:[spec]}]).changed,0);
});
test('new records append only once and revisions advance once per run',()=>{
 const state=base();
 const a=fiche('Car A'),b=fiche('Car B',1,13);
 const next=mergeWikiSafely(state,[a,b,a]);
 assert.equal(next.report.added,2);assert.equal(next.report.unchanged,1);
 assert.equal(next.next.revision,state.revision+1);assert.equal(next.next.fiches.length,2);
});
test('failed category metadata preserves its cursor while other categories succeed',async()=>{
 const target='Category:Vehicles in GTA VI';
 const cursor={cmcontinue:'old',continue:'-||'};
 let count=0;
 const fake=async(raw)=>{
  const u=new URL(raw);
  if(u.searchParams.get('list')==='categorymembers'){
   const category=u.searchParams.get('cmtitle');
   return new Response(JSON.stringify({query:{categorymembers:[{pageid:category===target?1:++count+10}]},continue:{cmcontinue:'new',continue:'-||'}}));
  }
  const id=Number(u.searchParams.get('pageids'));
  if(id===1)return new Response('down',{status:503});
  return new Response(JSON.stringify({query:{pages:[{pageid:id,title:'Item '+id,revisions:[{revid:2}]}]}}));
 };
 const result=await getWikiBatch({cursor:{[target]:cursor}},fake);
 assert.deepEqual(result.cursor[target],cursor);
 assert.equal(result.items.length,3);
 assert.equal(result.errors.length,1);
});
test('infobox status distinguishes inspected empty from failed fetch',async()=>{
 const a=fiche('Car A',1,12),b=fiche('Car B',1,13);
 const fake=async()=>new Response(JSON.stringify({query:{pages:[{pageid:12,revisions:[{revid:1,slots:{main:{content:'No infobox'}}}]}]}}));
 const result=await enrichWikiSpecs([a,b],{},fake);
 assert.equal(result.items[0].wikiSpecsChecked,true);
 assert.equal(result.items[1].wikiSpecsChecked,false);
 assert.equal(result.withSpecs,0);
});
