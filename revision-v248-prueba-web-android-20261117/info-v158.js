/* V158. Informational guide inside the MAIN application, never as a second homepage.
 * Accessible discreetly from footer (desktop) and More (mobile).
 * Dynamic news cards read the trusted records already verified by online-updates.js.
 */
(()=>{'use strict';
const text={
 es:{
  eyebrow:'CONSULTA · GUÍA GTA 6',heading:'Información y guías de GTA 6',
  intro:'Encontrá información por temas y noticias con fuentes. Esta sección es complementaria: el mapa, el catálogo, tus favoritos y Mi partida siguen siendo la experiencia principal.',
  back:'Volver al inicio',open:'Explorar dentro de la guía',read:'Fuente original',recent:'Noticias oficiales recientes',
  more:'Ver todas las noticias',source:'Publicaciones de Rockstar Games',quiet:'Esta sección reúne la información sin interrumpir tu partida.',
  cards:[
   ['Mapa de GTA 6','Lugares de Leonida, marcadores y datos de ubicaciones verificadas. No se inventan posiciones sin confirmar.','/mapa'],
   ['Personajes','Jason, Lucía y otros perfiles con información y fuentes contrastadas.','/explorar/personajes'],
   ['Vehículos','Fichas, imágenes y modelos observados en materiales públicos; las estadísticas no confirmadas quedan pendientes.','/explorar/vehiculos'],
   ['Armas','Datos de armamento respaldados por fuentes y puntos del mapa solo cuando se conoce su ubicación.','/explorar/armas'],
   ['Noticias','Anuncios oficiales separados claramente de las novedades no oficiales.','/noticias'],
   ['Mi partida','Progreso por categoría, descubrimientos, pendientes y favoritos guardados en el dispositivo.','/partida']
  ]
 },
 en:{
  eyebrow:'REFERENCE · GTA VI GUIDE',heading:'GTA VI information and guides',
  intro:'Explore topics and sourced news. This is a secondary reference section: the map, catalogue, favorites and your game progress remain the main experience.',
  back:'Back to home',open:'Explore in the app',read:'Original source',recent:'Recent official news',more:'View all news',source:'Rockstar Games announcements',quiet:'Reference material without interrupting your game.',
  cards:[
   ['GTA VI map','Leonida places and verified location markers; unknown positions are not invented.','/mapa'],
   ['Characters','Jason, Lucia and other profiles backed by sources.','/explorar/personajes'],
   ['Vehicles','Models, images and entries with unconfirmed stats marked as pending.','/explorar/vehiculos'],
   ['Weapons','Sourced equipment information; map pins only when a location is known.','/explorar/armas'],
   ['News','Official announcements separated from unofficial reports.','/noticias'],
   ['My game','Your locally saved progress, pending discoveries and favorites.','/partida']
  ]
 },
 pt:{
  eyebrow:'CONSULTA · GUIA GTA VI',heading:'Informações e guias de GTA VI',
  intro:'Encontre informações por temas e notícias com fontes. Esta é uma seção complementar: o mapa, o catálogo, os favoritos e o progresso continuam sendo a experiência principal.',
  back:'Voltar ao início',open:'Explorar no aplicativo',read:'Fonte original',recent:'Últimas notícias oficiais',more:'Ver todas as notícias',source:'Publicações da Rockstar Games',quiet:'Consulte informações sem interromper seu jogo.',
  cards:[
   ['Mapa de GTA VI','Locais de Leonida e marcadores verificados, sem posições inventadas.','/mapa'],
   ['Personagens','Jason, Lucia e outros perfis com fontes verificadas.','/explorar/personajes'],
   ['Veículos','Modelos e imagens com estatísticas ainda não confirmadas identificadas.','/explorar/vehiculos'],
   ['Armas','Informações com fontes e pontos no mapa apenas quando conhecidos.','/explorar/armas'],
   ['Notícias','Anúncios oficiais separados dos relatos não oficiais.','/noticias'],
   ['Meu jogo','Progresso, descobertas pendentes e favoritos salvos neste dispositivo.','/partida']
  ]
 }
};
const escInfo=(v)=>String(v??'').replace(/[&<>"']/g,k=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[k]));
window.viInfoPage=function(){
 const t=text[locale]||text.es;
 const icons=['⌖','◉','▣','◎','▤','☆'];
 const categories=t.cards.map(([label,summary,route],i)=>
  '<article class="vi-info-card"><div class="vi-info-icon" aria-hidden="true">'+icons[i]+'</div>'+
  '<h2>'+escInfo(label)+'</h2><p>'+escInfo(summary)+'</p>'+
  '<a href="#'+escInfo(route)+'">'+escInfo(t.open)+' →</a></article>').join('');
 const updates=records.filter(r=>r.category==='actualizaciones'&&r.status==='verified'&&(!r.facets||r.facets.community!==1))
 .sort((a,b)=>(b.publishedAt||'').localeCompare(a.publishedAt||'')).slice(0,4);
 const stories=updates.map(r=>{
  const article=r.sources?.find(x=>typeof x.url==='string'&&/^https:\/\/www\.rockstargames\.com\/newswire\/article\/[a-z0-9_-]+\/[a-z0-9_-]+\/?$/i.test(x.url))?.url;
  if(!article)return '';
  const title=r.title?.[locale]||r.title?.es||'GTA VI';
  const summary=r.summary?.[locale]||r.summary?.es||'';
  return '<article class="vi-info-story"><span class="vi-info-story-meta">'+escInfo(r.publishedAt||t.source)+'</span>'+
   '<h3>'+escInfo(title)+'</h3><p>'+escInfo(summary)+'</p>'+
   '<a href="'+escInfo(article)+'" target="_blank" rel="noopener noreferrer">'+escInfo(t.read)+' ↗</a></article>';
 }).join('');
 return '<section class="vi-info-page">'+
 '<div class="vi-info-intro"><span class="eyebrow">'+escInfo(t.eyebrow)+'</span><h1>'+escInfo(t.heading)+'</h1>'+
 '<p>'+escInfo(t.intro)+'</p><a href="#/" class="vi-info-back">← '+escInfo(t.back)+'</a></div>'+
 '<div class="vi-info-grid">'+categories+'</div>'+
 '<div class="vi-info-news-header"><h2>'+escInfo(t.recent)+'</h2><p>'+escInfo(t.source)+'</p></div>'+
 '<div class="vi-info-news">'+stories+'</div>'+
 '<p class="vi-info-view-all"><a href="#/noticias/oficiales">'+escInfo(t.more)+' →</a></p>'+
 '<p class="vi-info-quiet">'+escInfo(t.quiet)+'</p></section>';
};
})();
