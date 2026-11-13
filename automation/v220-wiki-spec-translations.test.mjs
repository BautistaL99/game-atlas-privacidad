import test from 'node:test';
import assert from 'node:assert/strict';
import {translateFacts} from './v220-wiki-spec-translations.mjs';
const row=(spec)=>({id:'wiki-community-123456789012345678901234',category:'vehiculos',specs:[spec]});
test('Translate known source-backed fields into all 3 locales with zero API requests',async()=>{
 const source={schema:205,revision:9,fiches:[row({key:'gender',label:'gender',value:'M'})]};
 const done=await translateFacts(source,{fetchFn:()=>{throw Error('must not fetch')},maxRequests:0});
 assert.equal(done.translated,1);
 assert.equal(done.requests,0);
 assert.equal(done.next.revision,10);
 assert.deepEqual(done.next.fiches[0].specs[0].valueI18n,{es:'Masculino',en:'Male',pt:'Masculino'});
 assert.equal(source.fiches[0].specs[0].valueI18n,undefined,'source must remain immutable');
});
test('Translate unforeseen keys and descriptive values in bounded automatic remote calls',async()=>{
 let hits=0;const fake=async url=>{
  hits++;const req=new URL(url),q=req.searchParams.get('q'),lang=req.searchParams.get('langpair');
  return {ok:true,text:async()=>JSON.stringify({responseStatus:200,responseData:{translatedText:(lang.endsWith('|es')?'ES ':'PT ')+q}})};
 };
 const source={schema:205,revision:3,fiches:[row({key:'new spec',label:'electrical drive',value:'automatic gearbox'})]};
 const done=await translateFacts(source,{fetchFn:fake,maxRequests:4,maxSpecs:1});
 assert.equal(hits,4);assert.equal(done.requests,4);assert.equal(done.translated,1);
 const spec=done.next.fiches[0].specs[0];
 assert.equal(spec.labelI18n.es,'ES electrical drive');
 assert.equal(spec.valueI18n.pt,'PT automatic gearbox');
 const unchanged=await translateFacts(done.next,{fetchFn:()=>{throw Error('already translated')},maxRequests:0});
 assert.equal(unchanged.next,done.next);
});
test('Quota or malformed translation output leaves the original record pending instead of publishing English as Spanish',async()=>{
 const previous={schema:205,revision:3,fiches:[row({key:'new spec',label:'electrical drive',value:'automatic gearbox'})]};
 const failed=await translateFacts(previous,{fetchFn:async()=>({ok:true,text:async()=>JSON.stringify({responseStatus:429,responseData:{translatedText:'Quota exceeded'}})}),maxRequests:1});
 assert.equal(failed.translated,0);
 assert.equal(failed.next,previous);
 assert.ok(failed.errors.length>0);
 assert.equal(previous.fiches[0].specs[0].valueI18n,undefined);
});
test('Numerical values preserve all digits and branded proper names are not altered',async()=>{
 const source={schema:205,revision:1,fiches:[row({key:'manufacturer',label:'manufacturer',value:'Bravado'}),row({key:'price',label:'price',value:'$120,000'})]};
 const result=await translateFacts(source,{fetchFn:()=>{throw Error('no service')},maxRequests:0});
 assert.equal(result.translated,2);
 assert.equal(result.next.fiches[1].specs[0].valueI18n.pt,'$120,000');
});
