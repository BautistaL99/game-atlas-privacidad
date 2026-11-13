import test from 'node:test';
import assert from 'node:assert/strict';
import {localizeCommunity,knownLabel,knownValue} from './v219-spec-i18n.mjs';

test('common wiki technical keys and values are localized in three languages',()=>{
 assert.equal(knownLabel('body_style').es,'Carrocería');
 assert.equal(knownLabel('manufacturer').pt,'Fabricante');
 assert.equal(knownValue('Yes').es,'Sí');
 assert.equal(knownValue('M').pt,'Masculino');
 assert.equal(knownValue('4-door SUV').es,'SUV de 4 puertas');
 assert.equal(knownValue('Vice City').pt,'Vice City');
});
test('retains unchanged source and caches translations with original key provenance',async()=>{
 const data={schema:205,revision:7,fiches:[{id:'wiki-community-abc',wikiRevision:12,
  specs:[{key:'occupation',label:'occupation',value:'Mechanic'},{key:'unknownfield',label:'unknownfield',value:'custom description 8'}]}]};
 let calls=0;
 const translate=async(text,lang)=>{calls++;return text==='unknownfield'?'field_'+lang:text+'_'+lang};
 const a=await localizeCommunity(data,{translate,limit:20});
 assert.equal(a.next.revision,8);
 assert.equal(a.next.fiches[0].specsI18n.length,2);
 assert.equal(a.next.fiches[0].specsI18n[1].sourceValue,'custom description 8');
 assert.equal(data.revision,7);
 const b=await localizeCommunity(a.next,{translate,cache:a.report.cache});
 assert.equal(b.changed,false);
 assert.equal(calls,4);
});
test('refuses untranslated or altered facts, never displays an unlocalized value',async()=>{
 const data={revision:9,fiches:[{id:'f',specs:[
   {key:'manufacturer',label:'manufacturer',value:'mysterious device 170'},
   {key:'status',label:'status',value:'Unknown'}]}]};
 const a=await localizeCommunity(data,{translate:async()=>{throw Error('offline')},limit:12});
 assert.equal(a.next.fiches[0].specs.length,2);
 assert.equal(a.next.fiches[0].specsI18n.length,1);
 assert.equal(a.report.pending,1);
 assert.equal(a.next.fiches[0].specsI18n[0].value.pt,'Desconhecido');
});
test('translation budget bounds external quota; no speculative replacements',async()=>{
 const data={revision:2,fiches:[{id:'f',specs:[{key:'unfamiliar',label:'unfamiliar',value:'a technical term'}]}]};
 let requests=0;const a=await localizeCommunity(data,{limit:0,translate:async()=>{requests++;return 'incorrect'}});
 assert.equal(requests,0);
 assert.equal(a.report.pending,1);
 assert.equal(a.next.fiches[0].specsI18n?.length||0,0);
});