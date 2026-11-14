import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm,access} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {generateStaticSeo,BASE} from './generate-static-seo.mjs';
import {generateCommunitySeo} from './generate-community-seo-v220.mjs';
const t=(es,en,pt)=>({es,en,pt});
const good={
 id:'wiki-community-aaaaaaaaaaaaaaaaaaaaaaaa',
 category:'vehiculos',title:t('Vehículo de prueba','Test vehicle','Veículo teste'),
 summary:t('Ficha comunitaria GTA VI','Community GTA VI record','Registro comunitário GTA VI'),
 sourceUrl:'https://gta.wiki/w/Test_vehicle',sourceName:'GTA Wiki',
 sourceTier:'community_indexed_not_rockstar_confirmed',wikiRevision:7,
 specs:[
  {key:'type',label:'type',value:'Sedan',labelI18n:t('Tipo','Type','Tipo'),valueI18n:t('Sedán','Sedan','Sedã')},
  {key:'manufacturer',label:'manufacturer',value:'Bravado',labelI18n:t('Fabricante','Manufacturer','Fabricante'),valueI18n:t('Bravado','Bravado','Bravado')}
 ]};
const shallow={...good,id:'wiki-community-bbbbbbbbbbbbbbbbbbbbbbbb',sourceUrl:'https://gta.wiki/w/Shallow',
 title:t('Sin datos','No details','Sem dados'),specs:[]};
const independent={id:'community-report-cccccccccccccccccccccccc',title:t('Según RockstarINTEL: nota GTA 6','GTA 6 report','Notícia GTA 6'),
 summary:t('Medio independiente sobre GTA 6','Independent coverage','Jornalismo independente'),
 publishedAt:'2026-11-12',sourceUrl:'https://rockstarintel.com/report-gta-vi',sourceName:'RockstarINTEL',
 sourceTier:'independent_reporting_not_official',claimStatus:'reported_not_confirmed_by_rockstar'};
const feed={schema:205,revision:4,mode:'INDEPENDENT_REPORTING_AND_COMMUNITY_WIKI_NOT_OFFICIAL',
 news:[independent],fiches:[good,shallow]};
async function fixture(){
 const dir=await mkdtemp(path.join(tmpdir(),'atlas-v220-seo-'));
 await generateStaticSeo({schema:1,revision:1,items:[]},dir);
 return dir;
}
test('Signed community facts create index and only substantive Wiki detail pages',async()=>{
 const dir=await fixture();
 try{
  const result=await generateCommunitySeo(feed,dir);
  assert.equal(result.wikiEntries,2);
  assert.equal(result.indexedWikiPages,1);
  assert.equal(result.independentNews,1);
  const wikihub=await readFile(path.join(dir,'guia-gta-6/wiki/index.html'),'utf8');
  assert.match(wikihub,/Wiki de GTA 6/);
  assert.match(wikihub,/Sin datos/);
  assert.match(wikihub,/comunitaria/);
  assert.match(wikihub,/https:\/\/gta6mapa\.web\.app\/app\/#\/ficha\//);
  const detail=await readFile(path.join(dir,'guia-gta-6/wiki/fichas',good.id,'index.html'),'utf8');
  assert.match(detail,/Fabricante/);
  assert.match(detail,/Bravado/);
  assert.match(detail,/no es informaci[oó]n confirmada por Rockstar/i);
  assert.match(detail,/rel="canonical"/);
  const news=await readFile(path.join(dir,'guia-gta-6/noticias/independientes/index.html'),'utf8');
  assert.match(news,/RockstarINTEL/);
  assert.match(news,/no constituyen anuncios oficiales/);
  await assert.rejects(access(path.join(dir,'guia-gta-6/wiki/fichas',shallow.id,'index.html')));
  const sitemap=await readFile(path.join(dir,'sitemap.xml'),'utf8');
  for(const p of ['guia-gta-6/wiki/','guia-gta-6/noticias/independientes/','guia-gta-6/wiki/fichas/'+good.id+'/'])
   assert(sitemap.includes('<loc>'+BASE+p+'</loc>'),p);
  assert(!sitemap.includes(shallow.id),'thin record must not enter sitemap');
 }finally{await rm(dir,{recursive:true,force:true})}
});
test('Regeneration removes stale detail pages after source no longer qualifies',async()=>{
 const dir=await fixture();
 try{
  await generateCommunitySeo(feed,dir);
  await generateStaticSeo({schema:1,revision:2,items:[]},dir);
  await generateCommunitySeo({...feed,revision:5,fiches:[shallow]},dir);
  await assert.rejects(access(path.join(dir,'guia-gta-6/wiki/fichas',good.id,'index.html')));
  const sitemap=await readFile(path.join(dir,'sitemap.xml'),'utf8');
  assert(!sitemap.includes(good.id));
 }finally{await rm(dir,{recursive:true,force:true})}
});
test('Auto-creates category landings and cleans them if the category shrinks',async()=>{
 const dir=await fixture();
 const third={...shallow,id:'wiki-community-dddddddddddddddddddddddd',sourceUrl:'https://gta.wiki/w/Third',
  title:t('Tercer vehículo GTA 6','Third car','Terceiro veículo')};
 const grouped={...feed,fiches:[good,shallow,third]};
 try{
  const result=await generateCommunitySeo(grouped,dir);
  assert.equal(result.indexedCategoryPages,1);
  const category=await readFile(path.join(dir,'guia-gta-6/wiki/categorias/vehiculos/index.html'),'utf8');
  assert.match(category,/Wiki GTA 6: Vehículos/);
  assert.match(category,/https:\/\/gta6mapa\.web\.app\/app\/#\/explorar\/vehiculos/);
  const sitemap=await readFile(path.join(dir,'sitemap.xml'),'utf8');
  assert(sitemap.includes('guia-gta-6/wiki/categorias/vehiculos/'));
  await generateStaticSeo({schema:1,revision:2,items:[]},dir);
  await generateCommunitySeo(feed,dir);
  await assert.rejects(access(path.join(dir,'guia-gta-6/wiki/categorias/vehiculos/index.html')));
 }finally{await rm(dir,{recursive:true,force:true})}
});
test('Reject missing/wrong signed model rather than generating speculative SEO',async()=>{
 const dir=await fixture();
 try{
  await assert.rejects(()=>generateCommunitySeo({schema:205,news:[],fiches:[]},dir),/Unverified/);
  await assert.rejects(()=>generateCommunitySeo({schema:1,items:[]},dir),/Unverified/);
 }finally{await rm(dir,{recursive:true,force:true})}
});
test('Never insert untrusted markup into Wiki page',async()=>{
 const dir=await fixture();
 try{
  const malicious={...good,title:t('<img src=x onerror=alert(1)>','Test','Teste'),
   specs:[...good.specs,{key:'bad',label:'X',value:'X',
    labelI18n:t('<strong>bad</strong>','Bad','Ruim'),
    valueI18n:t('javascript:alert(1)','Bad','Ruim')}]};
  const x=await generateCommunitySeo({...feed,fiches:[malicious]},dir);
  assert.equal(x.indexedWikiPages,0);
 }finally{await rm(dir,{recursive:true,force:true})}
});
