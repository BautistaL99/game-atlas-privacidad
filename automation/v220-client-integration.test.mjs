import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync('revision-v216-leonida-preview-20261112/app-v137.js','utf8');
const bridge=app.slice(app.indexOf('/* V220 - signed-sidecar integration'),app.indexOf('window.viApplySignedCatalog=function'));
assert.ok(bridge.startsWith('/* V220'),'missing central catalog bridge');
const t=(es,en,pt)=>({es,en,pt});
const wiki=(url,id)=>({id,category:'vehiculos',title:t('Coche','Car','Carro'),summary:t('Resumen ES','Summary EN','Resumo PT'),sourceUrl:url,wikiRevision:4,
 specs:[{key:'type',label:'type',value:'4-door sedan',labelI18n:t('Tipo','Type','Tipo'),valueI18n:t('Sedán de cuatro puertas','Four-door sedan','Sedã de quatro portas')}]});
const other={id:'community-report-cccccccccccccccccccccccc',sourceUrl:'https://rockstarintel.com/gta-vi-report',sourceName:'RockstarINTEL',title:t('Rumor','Rumour','Rumor'),summary:t('Nota','Report','Nota'),publishedAt:'2026-11-13'};
const make=(lang,existing=[])=>{
 const records=existing.slice(),wind={scrollY:0,scrollTo(){}},events=[],doc={dispatchEvent:e=>events.push(e)};
 let renders=0;
 new Function('records','window','document','requestAnimationFrame','CustomEvent','render','locale',bridge)(
  records,wind,doc,fn=>fn(),class{constructor(type,options){this.type=type;this.detail=options.detail}},()=>renders++,lang);
 return {wind,records,events,get renders(){return renders}};
};
for(const lang of ['es','en','pt'])test('Wiki and independent news visible in shared catalog in '+lang,()=>{
 const env=make(lang);
 const result=env.wind.viApplyCommunityFeed({
  fiches:[wiki('https://gta.wiki/w/Model_A','wiki-community-aaaaaaaaaaaaaaaaaaaaaaaa')],
  news:[other]});
 assert.equal(result.added,2);
 assert.equal(env.records.length,2);
 const item=env.records.find(r=>r.id.startsWith('wiki-community'));
 assert.equal(item.facts[0].key,t('Tipo','Type','Tipo')[lang]);
 assert.equal(item.facts[0].value,t('Sedán de cuatro puertas','Four-door sedan','Sedã de quatro portas')[lang]);
 assert.equal(item.trackable,false);
 assert.equal(item.sources[0].url,'https://gta.wiki/w/Model_A');
 assert.equal(item.category,'vehiculos');
 assert.ok(item.tags.some(s=>s.includes('Sedán')));
 assert.equal(env.records.find(r=>r.id.startsWith('community-report')).category,'actualizaciones');
 assert.equal(env.renders,1);
 assert.equal(env.wind.viWikiCatalogIndexed,true);
});
test('Dedup by source merges source-backed wiki specs without replacing curated title or trackable state',()=>{
 const existing={id:'original-car',title:t('Original ES','Original EN','Original PT'),category:'vehiculos',trackable:true,
 status:'verified',facts:[{key:'Potencia',value:'100',verified:true}],sources:[{url:'https://gta.wiki/w/Model_A',label:'Officially reviewed'}]};
 const env=make('es',[existing]);
 const result=env.wind.viApplyCommunityFeed({fiches:[wiki('https://gta.wiki/w/Model_A','wiki-community-aaaaaaaaaaaaaaaaaaaaaaaa')],news:[]});
 assert.equal(result.added,0);assert.equal(env.records.length,1);
 assert.equal(env.records[0].title.es,'Original ES');
 assert.equal(env.records[0].trackable,true);
 assert.equal(env.records[0].facts.length,2);
 assert.equal(env.records[0].facts[0].key,'Potencia');
});
test('Source must match allowlist and completed multilingual values before integration',()=>{
 const env=make('pt');
 const invalid=wiki('https://random.example/w/Model_A','wiki-community-aaaaaaaaaaaaaaaaaaaaaaaa');
 const valid=wiki('https://gta.wiki/w/Model_B','wiki-community-bbbbbbbbbbbbbbbbbbbbbbbb');
 valid.specs[0].valueI18n={es:'Sedán',en:'Sedan',pt:''};
 env.wind.viApplyCommunityFeed({fiches:[invalid,valid],news:[]});
 assert.equal(env.records.length,1);
 assert.equal(env.records[0].facts.length,0);
});
