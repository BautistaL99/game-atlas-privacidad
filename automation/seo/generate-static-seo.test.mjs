import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm,stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {generateStaticSeo,BASE} from './generate-static-seo.mjs';
const id='rockstar-test123',code='abc123def';
const item={id,category:'actualizaciones',status:'verified',publishedAt:'2026-11-05',
 title:{es:'La precarga de GTA 6 comienza el 10 de noviembre',en:'GTA VI preload begins November 10',pt:'Pré-carregamento'},
 summary:{es:'Rockstar Games anunció la precarga de GTA 6 para las plataformas indicadas en su publicación oficial.',en:'Preload announced.',pt:'Pré-carregamento anunciado.'},
 sources:[{url:'https://www.rockstargames.com/newswire/article/'+code+'/grand-theft-auto-vi-preload'}],
 image:{type:'official',remote:'https://media-rockstargames-com.akamaized.net/tina-uploads/posts/'+code+'/'+('a'.repeat(40))+'.jpg',
  officialPage:'https://www.rockstargames.com/newswire/article/'+code+'/grand-theft-auto-vi-preload',
  caption:{es:'Imagen oficial',en:'Official image',pt:'Imagem oficial'}}};
test('Generates indexable GTA 6 HTML for all categories and official articles; SEO does not depend on Atlas keyword',async()=>{
 const temp=await mkdtemp(path.join(tmpdir(),'gta6-seo-'));
 try{
  const result=await generateStaticSeo({schema:1,revision:7,items:[item]},temp);
  assert.equal(result.articleCount,1);
  assert.equal(result.sitemapCount,result.pageCount-1);
  const root=await readFile(path.join(temp,'guia-gta-6/index.html'),'utf8');
  assert.match(root,/<h1>Wiki de GTA 6: guía interactiva en español<\/h1>/);
  assert.match(root,/<meta name="robots" content="index,follow,max-image-preview:large">/);
  assert.match(root,/<a class="app-link" href=/);
  assert.match(root,/<title>Wiki GTA 6: personajes, mapa, vehículos y noticias \| Game Atlas<\/title>/);
  assert.match(root, /Wiki independiente de GTA 6/);
  const sitemap=await readFile(path.join(temp,'sitemap.xml'),'utf8');
  assert.doesNotMatch(sitemap,/game-atlas-privacidad\/app\/<\/loc>/);
  assert.match(sitemap,/<loc>https:\/\/bautistal99\.github\.io\/game-atlas-privacidad\/guia-gta-6\/<\/loc>/);
  assert.match(sitemap,/game-atlas-privacidad\/guia-gta-6\/noticias\/<\/loc>/);
  assert.match(sitemap,/guia-gta-6\/armas\/<\/loc>/);
  assert.match(sitemap,/guia-gta-6\/noticias\/abc123def-grand-theft-auto-vi-preload\/<\/loc>/);
  assert.doesNotMatch(sitemap,/#\//);
  const article=await readFile(path.join(temp,'guia-gta-6/noticias/abc123def-grand-theft-auto-vi-preload/index.html'),'utf8');
  assert.match(article,/La precarga de GTA 6 comienza el 10 de noviembre/);
  assert.match(article,/<time datetime="2026-11-05">2026-11-05<\/time>/);
  assert.match(article,/https:\/\/www\.rockstargames\.com\/newswire\/article\//);
  assert.match(article,/og:image/);
  assert.match(article,/<link rel="canonical" href=/);
  assert.match(article,/https:\/\/schema.org/);
  assert.doesNotMatch(article,/<script(?! type="application\/ld\+json")/);
  await stat(path.join(temp,'guia-gta-6/seo.css'));
 }finally{await rm(temp,{recursive:true,force:true})}
});
test('Rejects invalid catalog instead of publishing untrusted records',async()=>{
 const temp=await mkdtemp(path.join(tmpdir(),'gta6-seo-bad-'));
 try{await assert.rejects(()=>generateStaticSeo({items:[item]},temp));}
 finally{await rm(temp,{recursive:true,force:true})}
});
test('Escapes untrusted display text and rejects unapproved source URLs',async()=>{
 const temp=await mkdtemp(path.join(tmpdir(),'gta6-seo-escape-'));
 try{
  const injected={...item,id:'newrecord',title:{...item.title,es:'<img src=x onerror=alert(1)>'},
   sources:[{url:'https://example.com/bad'}]};
  const result=await generateStaticSeo({schema:1,revision:1,items:[injected]},temp);
  assert.equal(result.articleCount,0);
  const sitemap=await readFile(path.join(temp,'sitemap.xml'),'utf8');
  assert.doesNotMatch(sitemap,/example\.com/);
 }finally{await rm(temp,{recursive:true,force:true})}
});

test('Historical announcements stay as standalone pages, but the archive listing is noindex',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'gta6-news-archive-'));
 try{
  const old=Array.from({length:15},(_,i)=>({...item,id:'old-'+i,publishedAt:'2025-01-12',
    title:{...item.title,es:'Noticia histórica '+i},sources:[{url:'https://www.rockstargames.com/newswire/article/abc123def/old-news-'+i}],
    image:undefined
  }));
  const result=await generateStaticSeo({schema:1,revision:9,items:old},dir);
  assert.equal(result.articleCount,15);
  const main=await readFile(path.join(dir,'guia-gta-6/noticias/index.html'),'utf8');
  const archive=await readFile(path.join(dir,'guia-gta-6/noticias/archivo/index.html'),'utf8');
  assert.match(main,/archivo histórico \(3\)/);
  assert.match(archive,/noindex,follow/);
  assert.match(archive,/Noticia histórica/);
  const xml=await readFile(path.join(dir,'sitemap.xml'),'utf8');
  assert.doesNotMatch(xml,/noticias\/archivo\//);
  assert.match(xml,/noticias\/abc123def-old-news-14\//);
  const one=await readFile(path.join(dir,'guia-gta-6/noticias/abc123def-old-news-14/index.html'),'utf8');
  assert.match(one,/Noticia histórica 14/);
 }finally{await rm(dir,{recursive:true,force:true})}
});

test('Multilingual comparison landing pages survive regeneration with hreflang and category links',async()=>{
 const temp=await mkdtemp(path.join(tmpdir(),'gta6-compare-seo-'));
 try{
  const result=await generateStaticSeo({schema:1,revision:1,items:[]},temp);
  assert.equal(result.articleCount,0,'Landing pages are not Rockstar news articles');
  const base='guia-gta-6/comparador/';
  const languages=[['es',''],['en','en/'],['pt','pt/']];
  const urls=languages.map(([,suffix])=>BASE+base+suffix);
  const sitemap=await readFile(path.join(temp,'sitemap.xml'),'utf8');
  assert.match(sitemap,/xmlns:xhtml="http:\/\/www\.w3\.org\/1999\/xhtml"/);
  for(const [lang,suffix] of languages){
   const page=await readFile(path.join(temp,base,suffix,'index.html'),'utf8');
   const canonical=BASE+base+suffix;
   assert(page.includes('<html lang="'+lang+'"'),'Wrong comparison language '+lang);
   assert(page.includes('<link rel="canonical" href="'+canonical+'">'));
   assert(page.includes('application/ld+json'));
   assert(page.includes('href="https://gta6mapa.web.app/app/#/comparar"'));
   assert(page.includes('hreflang="es"')&&page.includes('hreflang="en"')&&page.includes('hreflang="pt"'));
   assert(sitemap.includes('<loc>'+canonical+'</loc>'),'Sitemap missing '+lang);
  }
  assert.equal((sitemap.match(/<xhtml:link rel="alternate"/g)||[]).length,9,'Missing sitemap language alternatives');
  assert.doesNotMatch(sitemap,/<loc>[^<]*#\//,'Hash routes should never be indexed');
  for(const category of ['armas','vehiculos']){
   const html=await readFile(path.join(temp,'guia-gta-6',category,'index.html'),'utf8');
   assert(html.includes(BASE+base),'Missing comparison cross-link from '+category);
  }
  const hub=await readFile(path.join(temp,'guia-gta-6/index.html'),'utf8');
  assert(hub.includes(BASE+base),'Missing comparison link in main guide');
  assert(urls.every(url=>sitemap.includes(url)),'Missing localized landing URL');
 }finally{await rm(temp,{recursive:true,force:true})}
});
