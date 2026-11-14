/* V220: indexable SEO from ALREADY VERIFIED Ed25519 community records.
 * The caller must validate schema/signature BEFORE calling generateCommunitySeo.
 * This module neither requests remote pages nor invents claims or photos.
 */
import {readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import path from 'node:path';

export const BASE='https://bautistal99.github.io/game-atlas-privacidad/';
const HUB='guia-gta-6/';
const WIKI=HUB+'wiki/';
const NEWS=HUB+'noticias/independientes/';
const SOURCE_WIKI='community_indexed_not_rockstar_confirmed';
const SOURCE_NEWS='independent_reporting_not_official';
const CATEGORIES=new Set(['personajes','vehiculos','armas','lugares','mapa-lugares','misiones','coleccionables','secretos','actividades','mundo','fauna','herramientas','actualizaciones']);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const link=p=>p.startsWith('app/')?'https://gta6mapa.web.app/'+p:BASE+p;
const plain=s=>typeof s==='string'&&s.length>0&&s.length<=190&&!/[<>\x00-\x1f]/.test(s);
const validId=s=>typeof s==='string'&&/^wiki-community-[a-f0-9]{24}$/.test(s);
const categoryLabel={personajes:'Personajes',vehiculos:'Vehículos',armas:'Armas',lugares:'Lugares','mapa-lugares':'Mapa y lugares',misiones:'Misiones',coleccionables:'Coleccionables',secretos:'Secretos',actividades:'Actividades',mundo:'Mundo',fauna:'Fauna',herramientas:'Herramientas',actualizaciones:'Actualizaciones'};
function worthwhileFacts(row){
 return (row.specs||[]).filter(x=>
  x&&plain(x.labelI18n?.es)&&plain(x.valueI18n?.es)&&
  !/^(?:unknown|desconocid[oa]|sin datos|n\/a|por confirmar|none|ninguno|m|f|yes|no)$/i.test(x.valueI18n.es.trim())&&
  x.valueI18n.es.trim().length>=3).slice(0,14);
}
function page(p,title,description,h,body){
 const canonical=link(p), desc=description.slice(0,165);
 const structured=[{'@context':'https://schema.org','@type':'WebPage',name:h,url:canonical,description:desc,inLanguage:'es',isAccessibleForFree:true},
  {'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[
   {'@type':'ListItem',position:1,name:'Wiki GTA 6',item:link(WIKI)},
   {'@type':'ListItem',position:2,name:h,item:canonical}]}];
 return '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
  '<title>'+esc(title.slice(0,75))+'</title><meta name="description" content="'+esc(desc)+'">'+
  '<meta name="robots" content="index,follow,max-image-preview:large">'+
  '<link rel="canonical" href="'+esc(canonical)+'">'+
  '<link rel="stylesheet" href="'+esc(link(HUB+'seo.css'))+'">'+
  '<meta property="og:title" content="'+esc(title.slice(0,75))+'"><meta property="og:description" content="'+esc(desc)+'">'+
  '<meta property="og:url" content="'+esc(canonical)+'">'+
  '<script type="application/ld+json">'+JSON.stringify(structured).replace(/</g,'\\u003c')+'</script></head>'+
  '<body><header><div class="top"><a class="logo" href="'+esc(link(HUB))+'">Game Atlas · Wiki GTA 6</a>'+
  '<a class="app-link" href="'+esc(link('app/'))+'">Abrir aplicación interactiva</a></div>'+
  '<nav aria-label="Navegación"><a href="'+esc(link(HUB))+'">Guía GTA 6</a>'+
  '<a href="'+esc(link(WIKI))+'">Wiki</a><a href="'+esc(link(HUB+'mapa/'))+'">Mapa</a>'+
  '<a href="'+esc(link(HUB+'noticias/'))+'">Noticias Rockstar</a>'+
  '<a href="'+esc(link(NEWS))+'">Noticias independientes</a></nav></header>'+
  '<main><div class="intro"><p class="eyebrow">CONTENIDO COMUNITARIO · NO OFICIAL</p><h1>'+esc(h)+'</h1>'+
  '<p class="lead">'+esc(desc)+'</p></div>'+body+'</main>'+
  '<footer><p>Game Atlas Companion: guía independiente de GTA VI, sin afiliación con Rockstar Games ni Take-Two Interactive.</p>'+
  '<p>Las referencias de terceros se muestran con su origen y no equivalen a confirmación oficial.</p>'+
  '<p><a href="'+esc(link(HUB))+'">Guía</a> · <a href="'+esc(link(WIKI))+'">Wiki GTA 6</a> · '+
  '<a href="'+esc(link(''))+'">Privacidad</a></p></footer></body></html>';
}
export async function generateCommunitySeo(community,siteRoot){
 if(!siteRoot||typeof siteRoot!=='string')throw Error('Public site path missing');
 if(!community||community.schema!==205||community.mode!=='INDEPENDENT_REPORTING_AND_COMMUNITY_WIKI_NOT_OFFICIAL'||
    !Array.isArray(community.news)||!Array.isArray(community.fiches))
  throw Error('Unverified community model; do not generate SEO');
 const pages=[],seen=new Set();
 const wiki=community.fiches.filter(x=>x.sourceTier===SOURCE_WIKI&&validId(x.id)&&
  plain(x.title?.es)&&CATEGORIES.has(x.category)&&
  /^https:\/\/gta\.wiki\/w\/[^\s?#]+$/.test(x.sourceUrl||'')&&Number.isInteger(x.wikiRevision))
  .sort((a,b)=>a.category.localeCompare(b.category)||a.title.es.localeCompare(b.title.es,'es'));
 const indexed=wiki.filter(x=>worthwhileFacts(x).length>=2&&!/^unnamed\b/i.test(x.title.es)).slice(0,150);
 for(const x of indexed){
  const p=WIKI+'fichas/'+x.id+'/';
  if(seen.has(p))continue;seen.add(p);
  const facts=worthwhileFacts(x);
  const data='<section class="copy"><h2>Datos documentados por la comunidad</h2>'+
   '<p>Esta ficha procede de GTA Wiki y corresponde a su revisión '+esc(x.wikiRevision)+'. No es información confirmada por Rockstar Games. Contrastá cada dato con el enlace original antes de utilizarlo como definitivo.</p>'+
   '<dl>'+facts.map(f=>'<dt><strong>'+esc(f.labelI18n.es)+'</strong></dt><dd>'+esc(f.valueI18n.es)+'</dd>').join('')+'</dl>'+
   '<p><a href="'+esc(x.sourceUrl)+'" target="_blank" rel="noopener noreferrer">Consultar la ficha original en GTA Wiki</a></p>'+
   '<p><a href="'+esc(link('app/#/ficha/'+x.id))+'">Abrir esta ficha en Game Atlas</a></p></section>';
  pages.push({p,html:page(p,x.title.es+' | Wiki GTA 6 · Game Atlas',
   'Ficha comunitaria de '+x.title.es+' en GTA 6, con datos atribuidos a GTA Wiki y enlace a la fuente. No oficial.',
   x.title.es+' · Wiki GTA 6',data)});
 }
 const indexMap=new Set(indexed.map(x=>x.id));
 const groups=[...new Set(wiki.map(x=>x.category))].sort();
 const categoryPaths=[];
 const groupsHtml=groups.map(c=>{
  const list=wiki.filter(x=>x.category===c);
  const categoryPath=WIKI+'categorias/'+c+'/';
  if(list.length>=3){
   categoryPaths.push(categoryPath);
   const entries='<section class="copy"><h2>Entradas comunitarias de '+esc(categoryLabel[c]||c)+'</h2>'+
    '<p>Este listado procede de GTA Wiki. La fuente documenta su revisión, pero los nombres y características no deben interpretarse como anuncios de Rockstar. Cada elemento enlaza a la ficha en Game Atlas o a su fuente original.</p>'+
    '<ul>'+list.map(x=>{
     const dest=indexMap.has(x.id)?link(WIKI+'fichas/'+x.id+'/'):link('app/#/ficha/'+x.id);
     return '<li><a href="'+esc(dest)+'">'+esc(x.title.es)+'</a> · '+
      '<a href="'+esc(x.sourceUrl)+'" target="_blank" rel="nofollow noopener noreferrer">Fuente GTA Wiki</a></li>';
    }).join('')+'</ul>'+
    '<p><a class="button" href="'+esc(link('app/#/explorar/'+(c==='mapa-lugares'?'lugares':c)))+'">Buscar en el catálogo interactivo</a></p></section>';
   pages.push({p:categoryPath,html:page(categoryPath,
    'Wiki GTA 6: '+(categoryLabel[c]||c)+' y fichas | Game Atlas',
    'Índice de '+(categoryLabel[c]||c).toLowerCase()+' de GTA 6, con enlaces a GTA Wiki, datos de origen y acceso a la guía interactiva independiente.',
    'Wiki GTA 6: '+(categoryLabel[c]||c),entries)});
  }
  return '<section class="copy"><h2>'+(list.length>=3?'<a href="'+esc(link(categoryPath))+'">'+esc(categoryLabel[c]||c)+'</a>':esc(categoryLabel[c]||c))+' ('+list.length+')</h2>'+
   '<p>Entradas vinculadas a GTA VI en la fuente comunitaria. Algunas aún no cuentan con datos suficientes para una página SEO individual.</p>'+
   '<ul>'+list.map(x=>{
    const dest=indexMap.has(x.id)?link(WIKI+'fichas/'+x.id+'/'):link('app/#/ficha/'+x.id);
    return '<li><a href="'+esc(dest)+'">'+esc(x.title.es)+'</a> · <a href="'+esc(x.sourceUrl)+'" rel="nofollow noopener noreferrer" target="_blank">fuente</a></li>';
   }).join('')+'</ul></section>';
 }).join('');
 pages.push({p:WIKI,html:page(WIKI,'Wiki GTA 6: personajes, vehículos y lugares | Game Atlas',
  'Explorá el índice comunitario de GTA 6: personajes, vehículos, armas, lugares y fichas enlazadas a sus fuentes. Wiki independiente y no oficial.',
  'Wiki de GTA 6: índice de fichas y categorías',
  '<section class="copy"><h2>Una wiki interactiva con procedencia visible</h2>'+
  '<p>Consultá personajes, vehículos, lugares y otros elementos de GTA VI. Game Atlas distingue lo anunciado por Rockstar Games de las entradas indexadas desde GTA Wiki, que siguen siendo información comunitaria.</p>'+
  '<p>Podés buscar, filtrar, guardar favoritos y consultar el mapa desde la aplicación. Este índice se actualiza cuando llegan nuevas fichas firmadas, sin necesidad de cambiar la aplicación instalada.</p>'+
  '<p><a class="button" href="'+esc(link('app/#/explorar'))+'">Explorar todas las fichas en la aplicación</a></p></section>'+groupsHtml)});
 const news=community.news.filter(x=>x.sourceTier===SOURCE_NEWS&&
  plain(x.title?.es)&&plain(x.summary?.es)&&
  /^https:\/\/(?:www\.)?rockstarintel\.com\/[^\s?#]+$/.test(x.sourceUrl||'')&&
  /^\d{4}-\d{2}-\d{2}$/.test(x.publishedAt||''))
  .sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt)||a.id.localeCompare(b.id));
 const newsHtml='<section class="copy"><h2>Publicaciones de medios independientes</h2>'+
  '<p>Estas referencias proceden de RockstarINTEL y no constituyen anuncios oficiales de Rockstar Games. Reunimos la fecha y el enlace de origen para facilitar la consulta; los datos pueden requerir confirmación.</p></section>'+
  '<section class="copy"><ul>'+news.map(x=>'<li><time datetime="'+esc(x.publishedAt)+'">'+esc(x.publishedAt)+'</time> · '+
   '<a href="'+esc(x.sourceUrl)+'" target="_blank" rel="nofollow noopener noreferrer">'+esc(x.title.es)+'</a>'+
   '<p>'+esc(x.summary.es)+'</p></li>').join('')+'</ul></section>'+
  '<section class="copy"><h2>Fuentes y verificación</h2><p>Para anuncios confirmados, consultá la sección de noticias oficiales, que está separada de estas publicaciones. Los enlaces independientes permiten revisar cada texto en su sitio original.</p>'+
  '<p><a class="button" href="'+esc(link(HUB+'noticias/'))+'">Noticias oficiales de GTA 6</a></p></section>';
 pages.push({p:NEWS,html:page(NEWS,'Noticias GTA 6 de medios independientes | Game Atlas',
  'Noticias independientes sobre GTA 6 con fecha y fuente original. Separadas de los anuncios oficiales de Rockstar Games.',
  'Noticias independientes de GTA 6',newsHtml)});
 // Remove ONLY the generated, versioned wiki-detail subtree; never curated content.
 const generated=path.join(siteRoot,WIKI,'fichas');
 await rm(generated,{recursive:true,force:true});
 await rm(path.join(siteRoot,WIKI,'categorias'),{recursive:true,force:true});
 for(const x of pages){
  const target=path.join(siteRoot,x.p,'index.html');
  await mkdir(path.dirname(target),{recursive:true});
  await writeFile(target,x.html+'\n','utf8');
 }
 let sitemap=await readFile(path.join(siteRoot,'sitemap.xml'),'utf8');
 if(!sitemap.includes('</urlset>')||!sitemap.includes(BASE+HUB))throw Error('SEO sitemap missing or from wrong site');
 const paths=[WIKI,NEWS,...categoryPaths,...indexed.map(x=>WIKI+'fichas/'+x.id+'/')];
 const xml=paths.filter(p=>!sitemap.includes('<loc>'+link(p)+'</loc>'))
  .map(p=>'  <url><loc>'+esc(link(p))+'</loc></url>').join('\n');
 sitemap=sitemap.replace('</urlset>',xml+'\n</urlset>');
 await writeFile(path.join(siteRoot,'sitemap.xml'),sitemap,'utf8');
 return {wikiEntries:wiki.length,indexedWikiPages:indexed.length,independentNews:news.length,
  indexedCategoryPages:categoryPaths.length,paths:paths,pageCount:pages.length};
}
