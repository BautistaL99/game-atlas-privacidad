/* V155. Separate news destination: official verified source vs community candidate. */
(()=>{'use strict';
const labels={
 es:{title:'Noticias de GTA VI',sub:'Novedades, anuncios e información con su fuente original.',official:'Oficiales',other:'No oficiales',empty:'Todavía no hay noticias no oficiales listas para publicar.',note:'Las fuentes de la comunidad aparecerán aquí claramente separadas de las confirmaciones de Rockstar.',source:'Leer noticia original',detail:'Ver ficha',nodate:'Fecha por confirmar'},
 en:{title:'GTA VI News',sub:'Updates and announcements with their original sources.',official:'Official',other:'Unofficial',empty:'No unofficial stories have passed review yet.',note:'Community information will appear here, clearly separated from Rockstar confirmations.',source:'Read original article',detail:'View entry',nodate:'Date to be confirmed'},
 pt:{title:'Notícias de GTA VI',sub:'Novidades e anúncios com suas fontes originais.',official:'Oficiais',other:'Não oficiais',empty:'Ainda não há notícias não oficiais prontas para publicação.',note:'As notícias da comunidade aparecerão aqui, separadas das confirmações da Rockstar.',source:'Ler notícia original',detail:'Ver ficha',nodate:'Data a confirmar'}
};
window.viNewsPage=function(route){
 const t=labels[locale]||labels.es,official=!route.endsWith('/no-oficiales');
 const relevant=records.filter(r=>r.category==='actualizaciones'&&r.status==='verified'&&
   (official?(!r.facets||r.facets.community!==1):r.facets?.community===1))
   .sort((a,b)=>(b.publishedAt||'').localeCompare(a.publishedAt||''));
 const rows=relevant.map(i=>{
  const date=/^\d{4}-\d{2}-\d{2}$/.test(i.publishedAt||'')
   ?new Intl.DateTimeFormat(locale==='en'?'en-US':locale==='pt'?'pt-BR':'es-AR',
      {day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(i.publishedAt+'T12:00:00Z')):t.nodate;
  const url=i.sources?.[0]?.url||'';
  return '<article class="vi-news-card">'+
   '<a href="#/ficha/'+encodeURIComponent(i.id)+'" class="vi-news-image-link">'+thumb(i,'vi-news-image')+'</a>'+
   '<div class="vi-news-body">'+
   '<div class="vi-news-date">'+esc(date)+' · '+(official?'Rockstar Games':'Comunidad')+'</div>'+
   '<h2><a href="#/ficha/'+encodeURIComponent(i.id)+'">'+esc(tr(i.title))+'</a></h2>'+
   '<p>'+esc(tr(i.summary))+'</p>'+
   '<div class="vi-news-actions"><a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">'+t.source+' ↗</a>'+
   '<a href="#/ficha/'+encodeURIComponent(i.id)+'">'+t.detail+' →</a></div></div></article>';
 }).join('');
 return '<section class="vi-news-page"><div class="vi-news-hero"><span class="eyebrow">GAME ATLAS · NEWSWIRE</span>'+
 '<h1>'+t.title+'</h1><p>'+t.sub+'</p></div>'+
 '<nav class="vi-news-tabs" aria-label="'+t.title+'">'+
 '<a href="#/noticias/oficiales" class="'+(official?'is-active':'')+'" '+(official?'aria-current="page"':'')+'>✓ '+t.official+'</a>'+
 '<a href="#/noticias/no-oficiales" class="'+(!official?'is-active':'')+'" '+(!official?'aria-current="page"':'')+'>◇ '+t.other+'</a></nav>'+
 '<div class="vi-news-list">'+(rows||'<div class="vi-news-empty"><h2>'+t.empty+'</h2><p>'+t.note+'</p></div>')+'</div></section>';
};
})();
