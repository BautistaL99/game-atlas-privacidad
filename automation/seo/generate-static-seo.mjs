/* Indexable public HTML for GTA 6 keywords. Outputs static content only; no SPA/hash URLs in sitemap.
 * This uses ONLY the signed catalog already verified by read-signed-envelope.mjs.
 * It never scrapes the web and never invents Rockstar quotes, positions or facts.
 */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';

export const BASE='https://bautistal99.github.io/game-atlas-privacidad/';
export const HUB='guia-gta-6/';
export const ARCHIVE=HUB+'noticias/archivo/';
const heading='Guía GTA 6';
const COMPARE_LANDINGS=[
 {p:HUB+'comparador/',lang:'es',file:'./static-compare/es.html'},
 {p:HUB+'comparador/en/',lang:'en',file:'./static-compare/en.html'},
 {p:HUB+'comparador/pt/',lang:'pt',file:'./static-compare/pt.html'}
];
const E=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const url=p=>p.startsWith('app/')?'https://gta6mapa.web.app/'+p:BASE+p;
function section(title,paras){return '<section class="copy"><h2>'+E(title)+'</h2>'+paras.map(p=>'<p>'+E(p)+'</p>').join('')+'</section>'}
const nav=[
 ['guia-gta-6/','Guía GTA 6'],
 ['guia-gta-6/wiki/','Wiki GTA 6'],
 ['guia-gta-6/mapa/','Mapa'],
 ['guia-gta-6/personajes/','Personajes'],
 ['guia-gta-6/vehiculos/','Vehículos'],
 ['guia-gta-6/armas/','Armas'],
 ['guia-gta-6/comparador/','Comparador'],
 ['guia-gta-6/noticias/','Noticias'],
 ['guia-gta-6/noticias/independientes/','Noticias independientes'],
 ['guia-gta-6/mi-partida/','Mi partida']
];
const guidePages=[
 {p:'guia-gta-6/mapa/',title:'Mapa de GTA 6: lugares y exploración de Leonida | Guía en español',
 desc:'Consultá el mapa interactivo de GTA 6 y explorá los lugares de Leonida. Ubicaciones verificadas, marcadores, favoritos y estado de cada descubrimiento.',
 h:'Mapa interactivo de GTA 6',sub:'Explorá Leonida y organizá los lugares que encontrás.',
 body:section('Cómo usar el mapa de GTA VI',[
  'La guía incluye un mapa interactivo pensado para explorar zonas, consultar fichas y llevar el control de los lugares descubiertos. Podés abrir el mapa, aplicar filtros y consultar la información disponible de cada punto.',
  'Los lugares y nombres se contrastan con las fuentes enlazadas en cada ficha. Si la ubicación exacta todavía no está confirmada, no presentamos un marcador aproximado como si fuera definitivo.',
  'El mapa y sus marcadores pueden cambiar a medida que se confirme información nueva del juego. Revisá siempre la fuente y el estado de verificación de cada elemento.'
 ])+section('Ubicaciones, filtros y progreso',[
  'Podés pasar del mapa a las fichas de lugares y guardar los elementos que te interesan. Los favoritos y el progreso de tu partida se gestionan dentro de la aplicación.',
  'La información publicada antes del lanzamiento o sin una confirmación espacial definitiva se identifica como provisional; no reemplaza al mapa oficial del juego.'
 ]),
 app:'app/#/mapa',appText:'Abrir mapa GTA 6'},
 {p:'guia-gta-6/personajes/',title:'Personajes de GTA 6: Jason, Lucía y fichas | Guía GTA VI',
 desc:'Conocé los personajes de GTA 6, incluidos Jason y Lucía, con fichas en español, imágenes oficiales y fuentes para distinguir datos confirmados de rumores.',
 h:'Personajes de GTA 6',sub:'Protagonistas, relaciones y perfiles con fuentes contrastadas.',
 body:section('Jason y Lucía: los protagonistas',[
  'Jason Duval y Lucía Caminos son los protagonistas presentados por Rockstar Games para Grand Theft Auto VI. La información sobre su historia y sus relaciones se amplía según los materiales oficiales publicados por el estudio.',
  'Nuestra guía reúne fichas para consultar personajes y seguir sus apariciones en la información confirmada. La intención es diferenciar lo anunciado oficialmente de las interpretaciones de la comunidad.'
 ])+section('Qué vas a encontrar en las fichas',[
  'Cada ficha puede reunir una descripción, imágenes y enlaces a las fuentes disponibles. Cuando una característica no está confirmada, evitamos completar el perfil con suposiciones.',
  'Podés consultar los personajes desde el catálogo y guardar tus favoritos sin depender de una cuenta externa.'
 ])+'<aside class="source">Fuente principal: <a href="https://www.rockstargames.com/VI" rel="noopener noreferrer" target="_blank">sitio oficial de Grand Theft Auto VI de Rockstar Games</a>.</aside>',
 app:'app/#/explorar/personajes',appText:'Explorar personajes'},
 {p:'guia-gta-6/vehiculos/',title:'Vehículos de GTA 6: autos, motos y fichas verificadas | Guía',
 desc:'Explorá la guía de vehículos de GTA 6: fichas, categorías, imágenes de referencia y datos confirmados. Consultá modelos y encontralos en el catálogo.',
 h:'Vehículos de GTA 6',sub:'Encontrá los vehículos documentados y distinguí sus datos verificados.',
 body:section('Catálogo de vehículos de GTA VI',[
  'El catálogo agrupa vehículos para que puedas revisar modelos, imágenes y la información disponible sobre ellos. Una aparición en un video promocional no siempre confirma el nombre definitivo de un modelo o sus estadísticas.',
  'Cuando hay datos contrastables se incorporan en las fichas, junto con su procedencia. Si una característica, modificación o ubicación de aparición es desconocida, se mantiene como pendiente.'
 ])+section('Comparar y descubrir',[
  'La sección te permite recorrer distintas fichas y marcar tus elementos favoritos. Los datos de rendimiento, personalización y disponibilidad se incorporan únicamente cuando existe información verificable.',
  'La información de vehículos se actualiza independientemente de tu lista personal de favoritos y elementos completados.'
 ]),
 app:'app/#/explorar/vehiculos',appText:'Explorar vehículos'},
 {p:'guia-gta-6/armas/',title:'Armas de GTA 6: catálogo e información confirmada | Guía',
 desc:'Consultá las armas de GTA 6 y sus fichas en español. Información respaldada por fuentes, características pendientes y seguimiento de descubrimientos.',
 h:'Armas de GTA 6',sub:'Fichas de armamento con información verificada y límites claros.',
 body:section('Qué armas aparecen en GTA VI',[
  'Las imágenes y los videos promocionales pueden mostrar equipamiento, pero no siempre confirman un nombre, un daño exacto o la disponibilidad de un arma. Por eso, nuestra guía separa las observaciones de los datos confirmados.',
  'El catálogo incorpora las armas documentadas y conserva sus fuentes para poder revisar la información cuando aparecen materiales nuevos.'
 ])+section('Características, mejoras y localizaciones',[
  'Las estadísticas, mejoras y puntos de aparición se muestran cuando existen datos suficientes. Un arma nueva no genera automáticamente un marcador en el mapa si todavía no se conoce una ubicación verificable.',
  'Podés usar el catálogo para consultar las fichas y gestionar tus favoritos desde la aplicación.'
 ]),
 app:'app/#/explorar/armas',appText:'Consultar armas'},
 {p:'guia-gta-6/mi-partida/',title:'Progreso en GTA 6: checklist, favoritos y descubrimientos',
 desc:'Organizá tu partida de GTA 6: marcá elementos descubiertos, consultá pendientes y guardá favoritos por categoría con una guía interactiva.',
 h:'Seguimiento de progreso en GTA 6',sub:'Tu partida, favoritos y categorías en un mismo lugar.',
 body:section('Llevá el control de tus descubrimientos',[
  'La sección «Mi partida» permite marcar elementos como completados, revisar pendientes y consultar favoritos. Podés recorrer las categorías del catálogo y registrar lo que ya descubriste.',
  'La guía calcula indicadores de avance sobre los elementos registrados en el catálogo. Las nuevas fichas que se publiquen pueden cambiar el total de elementos disponibles.'
 ])+section('Privacidad y copias de seguridad',[
  'El seguimiento del progreso se conserva localmente en el navegador o en la aplicación instalada, según su configuración. No supone sincronización automática entre dispositivos.',
  'Antes de cambiar de dispositivo o reinstalar la aplicación, conviene utilizar las opciones de respaldo y recuperación de datos disponibles en «Mi partida».'
 ]),
 app:'app/#/partida',appText:'Abrir Mi partida'}
];
function newsFromCatalog(catalog){
 if(catalog?.schema!==1||!Array.isArray(catalog.items))throw Error('Invalid trusted catalog');
 const out=[],ids=new Set();
 for(const record of catalog.items){
  if(record?.status!=='verified'||record.category!=='actualizaciones'||!record.sources?.length)continue;
  const source=record.sources[0].url;let u;
  try{u=new URL(source)}catch{continue}
  if(u.protocol!=='https:'||u.hostname!=='www.rockstargames.com'||!/^\/newswire\/article\/[a-z0-9_-]+\/[a-z0-9_-]+\/?$/i.test(u.pathname)||u.search||u.hash)continue;
  if(!/^[a-z0-9_-]{1,120}$/.test(record.id)||ids.has(record.id))continue;
  if(!record.title?.es||!record.summary?.es||typeof record.title.es!=='string'||typeof record.summary.es!=='string')continue;
  if(record.title.es.length>180||record.summary.es.length>1300)continue;
  const code=u.pathname.split('/')[3],slug=u.pathname.split('/')[4];
  let image='';
  if(record.image?.type==='official'&&typeof record.image.remote==='string'){
   try{
    const media=new URL(record.image.remote);
    if(media.protocol==='https:'&&media.hostname==='media-rockstargames-com.akamaized.net'&&new RegExp('^/tina-uploads/posts/'+code+'/[a-f0-9]{40}\\.(?:jpe?g|png|webp)$').test(media.pathname)&&!media.search&&!media.hash)image=media.href;
   }catch{}
  }
  ids.add(record.id);
  out.push({id:record.id,title:record.title.es,summary:record.summary.es,source:u.href,
   date:/^\d{4}-\d{2}-\d{2}$/.test(record.publishedAt||'')?record.publishedAt:'',
   image,path:'guia-gta-6/noticias/'+code+'-'+slug+'/'});
 }
 return out.sort((a,b)=>b.date.localeCompare(a.date)||a.path.localeCompare(b.path));
}
function basePage({p,title,desc,h,sub,body,kind='WebPage',image=''}) {
 const crumbs=[{'@type':'ListItem',position:1,name:'Guía GTA 6',item:url(HUB)}];
 if(p!==HUB)crumbs.push({'@type':'ListItem',position:2,name:h,item:url(p)});
 const json=[{'@context':'https://schema.org','@type':kind,name:h,url:url(p),description:desc,inLanguage:'es',isAccessibleForFree:true},
  {'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:crumbs}];
 if(p===HUB)json.push({'@context':'https://schema.org','@type':'WebSite',url:url(HUB),name:'Game Atlas Companion — Wiki de GTA 6',inLanguage:'es'});
 const navHtml=nav.map(([route,label])=>'<a '+(p===route?'aria-current="page" ':'')+'href="'+E(url(route))+'">'+E(label)+'</a>').join('');
 const media=image?'<meta property="og:image" content="'+E(image)+'"><meta name="twitter:card" content="summary_large_image">':'<meta name="twitter:card" content="summary">';
 return '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
  '<title>'+E(title)+'</title><meta name="description" content="'+E(desc)+'">'+
  '<meta name="robots" content="'+(p===ARCHIVE?'noindex,follow':'index,follow,max-image-preview:large')+'"><link rel="canonical" href="'+E(url(p))+'">'+
  '<link rel="stylesheet" href="'+E(url(HUB+'seo.css'))+'"><link rel="icon" href="'+E(url('app/icons/vi-logo.svg'))+'" type="image/svg+xml">'+
  '<meta property="og:type" content="website"><meta property="og:title" content="'+E(title)+'">'+
  '<meta property="og:description" content="'+E(desc)+'"><meta property="og:url" content="'+E(url(p))+'">'+media+
  '<script type="application/ld+json">'+JSON.stringify(json).replace(/</g,'\\u003c')+'</script>'+
  '</head><body><header><div class="top"><a class="logo" href="'+E(url(HUB))+'">GTA <em>6</em> · GUÍA</a><a class="app-link" href="'+E(url('app/'))+'">Abrir guía interactiva ↗</a></div><nav aria-label="Secciones de la guía">'+navHtml+'</nav></header>'+
  '<main><div class="intro"><p class="eyebrow">GUÍA INDEPENDIENTE · GTA VI</p><h1>'+E(h)+'</h1><p class="lead">'+E(sub)+'</p></div>'+body+'</main>'+
  '<footer><p>Guía independiente de Grand Theft Auto VI. No oficial ni afiliada a Rockstar Games o Take-Two Interactive.</p>'+
  '<p>Las referencias a Rockstar Games enlazan a sus fuentes originales; las imágenes promocionales pertenecen a sus titulares.</p>'+
  '<p><a href="'+E(url('app/'))+'">Mapa, fichas y seguimiento interactivo</a> · <a href="'+E(url(HUB+'noticias/'))+'">Últimas noticias GTA 6</a> · <a href="'+E(url(''))+'">Privacidad</a></p></footer></body></html>';
}
function newsLink(n){
 const cover=n.image?'<img src="'+E(n.image)+'" alt="Imagen promocional oficial de la noticia: '+E(n.title)+'" loading="lazy" decoding="async">':'<div class="no-cover">Noticia oficial de Rockstar Games</div>';
 return '<article class="card news-card"><a class="cover" href="'+E(url(n.path))+'">'+cover+'</a><div class="card-body">'+
  (n.date?'<time datetime="'+E(n.date)+'">'+E(n.date)+'</time>':'')+
  '<h3><a href="'+E(url(n.path))+'">'+E(n.title)+'</a></h3><p>'+E(n.summary)+'</p>'+
  '<a class="read" href="'+E(url(n.path))+'">Leer resumen y fuente ↗</a></div></article>';
}
function generatePages(catalog){
 const news=newsFromCatalog(catalog),pages=[];
 const cutoff=new Date(Date.now()-90*86400000).toISOString().slice(0,10);
 const recentNews=news.filter((n,i)=>i<12||n.date>=cutoff);
 const oldNews=news.filter((n,i)=>i>=12&&(!n.date||n.date<cutoff));
 const entry=(p,html)=>pages.push({p,html});
 const hubs=nav.filter(x=>x[0]!==HUB).map(([route,label])=>'<a class="card category-card" href="'+E(url(route))+'"><span>EXPLORAR</span><strong>'+E(label)+'</strong><small>Ver información y enlaces a la guía →</small></a>').join('');
 const fresh=recentNews.slice(0,3).map(newsLink).join('');
 entry(HUB,basePage({p:HUB,title:'Wiki GTA 6: personajes, mapa, vehículos y noticias | Game Atlas',desc:'Wiki independiente de GTA 6 en español: personajes, vehículos, armas, mapa interactivo de Leonida, rutas, fichas con fuentes y noticias. No oficial.',
 h:'Wiki de GTA 6: guía interactiva en español',sub:'Fichas, mapa de Leonida, rutas, noticias y progreso de GTA VI con fuentes y contenido independiente.',
 body:'<section class="copy"><h2>Wiki y guía de GTA 6 en un solo lugar</h2><p>Game Atlas Companion reúne una wiki independiente de Grand Theft Auto VI: fichas de personajes, vehículos, armas y lugares, un mapa interactivo y noticias con enlaces a sus fuentes. Distinguimos los anuncios oficiales de los aportes de medios y comunidades, sin presentar rumores como confirmaciones de Rockstar.</p><p>La aplicación interactiva incorpora mapa, fichas, favoritos y seguimiento de progreso. Los datos nuevos se incorporan cuando existen fuentes suficientes y nunca se presentan como confirmados si siguen siendo provisionales.</p></section>'+
 '<section><h2>Explorá las categorías de GTA VI</h2><div class="grid">'+hubs+'</div></section>'+
 '<section><h2>Últimas noticias oficiales sobre GTA 6</h2><p class="muted">Resúmenes independientes con enlace directo al anuncio original de Rockstar Games.</p><div class="news-grid">'+fresh+'</div><p><a class="button" href="'+E(url(HUB+'noticias/'))+'">Ver todas las noticias oficiales →</a></p></section>'+
 section('Información confirmada y datos pendientes',[
  'Distinguimos los anuncios oficiales de los contenidos aportados por la comunidad. Cada ficha indica qué información está respaldada por una fuente y qué detalles todavía faltan confirmar.',
  'Game Atlas Companion es una guía independiente: no representa a Rockstar Games ni sustituye las publicaciones del estudio.'
 ])+
 '<p><a class="button" href="'+E(url('app/'))+'">Entrar al mapa y al catálogo interactivo →</a></p>'
 }));
 for(const d of guidePages){
  const discoverCompare=['guia-gta-6/vehiculos/','guia-gta-6/armas/'].includes(d.p)
   ?'<section class="copy"><h2>Comparar elementos de GTA 6</h2><p>Podés <a href="'+E(url(HUB+'comparador/'))+'">comparar hasta tres elementos de la misma categoría</a> con datos verificados. Las características que todavía no se confirmaron permanecen como pendientes.</p></section>'
   :'';
  entry(d.p,basePage({...d,body:d.body+discoverCompare+'<p><a class="button" href="'+E(url(d.app))+'">'+E(d.appText)+' →</a></p>'}));
 }
 const npath=HUB+'noticias/';
 const newsBody='<section class="copy"><h2>Anuncios oficiales de GTA VI</h2><p>Esta sección reúne noticias de Rockstar Games con títulos y descripciones en español, una imagen correspondiente a la publicación cuando está disponible y un enlace a la fuente original.</p><p>Las publicaciones de otras fuentes se distinguen de las oficiales. Consultá también las noticias independientes, con fecha, medio responsable y fuente original, sin presentarlas como anuncios confirmados.</p></section>'+
 '<section><h2>Noticias oficiales publicadas</h2><div class="news-grid">'+recentNews.map(newsLink).join('')+'</div>'+(oldNews.length?'<p><a class="button" href="'+E(url(ARCHIVE))+'">Ver archivo histórico ('+oldNews.length+') →</a></p>':'')+'</section>'+
 '<section class="copy"><h2>¿Buscás novedades de la comunidad?</h2><p>Podés consultar las noticias de medios independientes con su fuente y fecha. Se mantienen separadas de los anuncios oficiales.</p><p><a href="'+E(url(HUB+'noticias/independientes/'))+'">Ver noticias independientes de GTA 6</a></p></section>'+
 '<p><a class="button" href="'+E(url('app/#/noticias/oficiales'))+'">Abrir Noticias en la guía interactiva →</a></p>';
 entry(npath,basePage({p:npath,title:'Noticias GTA 6: últimas novedades oficiales de Rockstar | Guía',desc:'Últimas noticias oficiales de GTA 6 en español, con imágenes de los anuncios de Rockstar Games, fechas, resúmenes y fuentes originales.',
 h:'Noticias de GTA 6',sub:'Anuncios de Rockstar Games con imágenes y enlaces a las fuentes originales.',body:newsBody,image:news[0]?.image||''}));
 entry(ARCHIVE,basePage({p:ARCHIVE,title:'Archivo de noticias GTA 6 | Anuncios anteriores',desc:'Archivo histórico de anuncios oficiales de GTA 6 publicados por Rockstar Games, con fechas, imágenes y enlaces a las fuentes originales.',
 h:'Archivo de noticias de GTA 6',sub:'Noticias anteriores preservadas, ordenadas por fecha y con su fuente original.',
 body:'<section class="copy"><h2>Noticias anteriores</h2><p>Los anuncios antiguos dejan la lista principal para mantenerla actualizada, pero sus artículos, fechas, imágenes enlazadas y fuentes siguen disponibles. No se eliminan ni se presentan como novedades recientes.</p></section><div class="news-grid">'+oldNews.map(newsLink).join('')+'</div><p><a class="button" href="'+E(url(npath))+'">← Volver a noticias recientes</a></p>'}));
 for(const item of news){
  const imageBlock=item.image?'<figure><img class="article-photo" src="'+E(item.image)+'" alt="Imagen oficial publicada por Rockstar Games para '+E(item.title)+'" loading="eager"><figcaption>Imagen promocional © Rockstar Games / Take-Two Interactive · <a href="'+E(item.source)+'" rel="noopener noreferrer" target="_blank">Fuente original</a>.</figcaption></figure>':'';
  const details='<article class="copy story">'+(item.date?'<p class="date">Publicado: <time datetime="'+E(item.date)+'">'+E(item.date)+'</time> · Fuente: Rockstar Games</p>':'<p class="date">Fuente: Rockstar Games</p>')+
   imageBlock+'<h2>Qué anunció Rockstar Games</h2><p>'+E(item.summary)+'</p>'+
   '<h2>Cómo consultar la información completa</h2><p>Este es un resumen independiente de la publicación oficial. Para comprobar todos los detalles y ver el contenido original, consultá el comunicado de Rockstar Games enlazado a continuación.</p>'+
   '<p><a class="button" href="'+E(item.source)+'" target="_blank" rel="noopener noreferrer">Leer anuncio original en Rockstar Games ↗</a></p>'+
   '<p>También podés consultar las noticias y guardar tus favoritos dentro de la guía interactiva.</p>'+
   '<p><a href="'+E(url('app/#/ficha/'+item.id))+'">Abrir ficha en la aplicación →</a></p>'+
   '<p><a href="'+E(url(npath))+'">← Volver a todas las noticias de GTA 6</a></p></article>';
  entry(item.path,basePage({p:item.path,title:item.title+' | Noticias GTA 6',desc:item.summary.slice(0,157),h:item.title,sub:'Resumen en español de una publicación oficial de Rockstar Games sobre Grand Theft Auto VI.',body:details,image:item.image}));
 }
 return pages;
}
export async function generateStaticSeo(catalog,siteRoot){
 if(!siteRoot||typeof siteRoot!=='string')throw Error('Public clone root missing');
 const pages=generatePages(catalog);
 // These three SEO landing pages are canonical checked-in templates, not
 // untracked manual additions to the public clone. Every full generation
 // restores them and their language metadata without modifying the SPA.
 for(const landing of COMPARE_LANDINGS){
  const html=await readFile(new URL(landing.file,import.meta.url),'utf8');
  if(!html.includes('<html lang="'+landing.lang+'"')||
     !html.includes('<link rel="canonical" href="'+url(landing.p)+'"')||
     !html.includes('application/ld+json'))throw Error('Invalid compare SEO template '+landing.lang);
  pages.push({p:landing.p,html});
 }
 for(const {p,html} of pages){
  const dest=path.join(siteRoot,p,'index.html');
  await mkdir(path.dirname(dest),{recursive:true});
  await writeFile(dest,html+'\n','utf8');
 }
 const css=await readFile(new URL('./static-seo.css',import.meta.url),'utf8');
 await writeFile(path.join(siteRoot,HUB,'seo.css'),css,'utf8');
 // Only canonical GitHub Pages guide URLs. /app/ has its canonical on Firebase and a separate sitemap.
 const alternates=COMPARE_LANDINGS.map(x=>({lang:x.lang,href:url(x.p)}));
 const xml=['<?xml version="1.0" encoding="UTF-8"?>','<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
  ...pages.filter(x=>x.p!==ARCHIVE).map(x=>x.p).map(p=>{
   const compare=COMPARE_LANDINGS.some(x=>x.p===p);
   const hreflang=compare?alternates.map(alt=>'<xhtml:link rel="alternate" hreflang="'+alt.lang+'" href="'+E(alt.href)+'"/>').join(''):'';
   return '  <url><loc>'+E(url(p))+'</loc>'+hreflang+'</url>';
  }),
  '</urlset>',''].join('\n');
 await writeFile(path.join(siteRoot,'sitemap.xml'),xml,'utf8');
 return {pageCount:pages.length,articleCount:pages.length-guidePages.length-3-COMPARE_LANDINGS.length,sitemapCount:pages.length-1,urls:pages.map(x=>url(x.p))};
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
 const [jsonPath,siteRoot]=process.argv.slice(2);
 if(!jsonPath||!siteRoot)throw Error('Usage: generate-static-seo.mjs VALIDATED_CATALOG_JSON PUBLIC_GITHUB_CLONE');
 const data=JSON.parse(await readFile(jsonPath,'utf8'));
 const result=await generateStaticSeo(data,siteRoot);
 console.log('Static GTA 6 SEO generated: '+result.pageCount+' pages; '+result.articleCount+' articles; '+result.sitemapCount+' sitemap URLs');
}
