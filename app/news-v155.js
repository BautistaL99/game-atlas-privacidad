/* V155. Separate news destination: official verified source vs community candidate. */
(()=>{'use strict';
const labels={
 es:{title:'Noticias de GTA VI',sub:'Novedades, anuncios e información con su fuente original.',official:'Oficiales',other:'No oficiales',empty:'Todavía no hay noticias no oficiales listas para publicar.',note:'Las fuentes de la comunidad aparecerán aquí claramente separadas de las confirmaciones de Rockstar.',source:'Leer noticia original',detail:'Ver ficha',nodate:'Fecha por confirmar',archive:'Archivo',archiveEmpty:'Todavía no hay noticias antiguas archivadas.',archiveNote:'Las publicaciones anteriores se conservarán aquí con su fecha, imagen y fuente original. No se elimina información.',unconfirmed:'RUMOR · NO CONFIRMADO',communityVisual:'FUENTE COMUNITARIA'},
 en:{title:'GTA VI News',sub:'Updates and announcements with their original sources.',official:'Official',other:'Unofficial',empty:'No unofficial stories have passed review yet.',note:'Community information will appear here, clearly separated from Rockstar confirmations.',source:'Read original article',detail:'View entry',nodate:'Date to be confirmed',archive:'Archive',archiveEmpty:'No older news has been archived yet.',archiveNote:'Past announcements will remain available here with dates, images and original sources.',unconfirmed:'RUMOUR · UNCONFIRMED',communityVisual:'COMMUNITY SOURCE'},
 pt:{title:'Notícias de GTA VI',sub:'Novidades e anúncios com suas fontes originais.',official:'Oficiais',other:'Não oficiais',empty:'Ainda não há notícias não oficiais prontas para publicação.',note:'As notícias da comunidade aparecerão aqui, separadas das confirmações da Rockstar.',source:'Ler notícia original',detail:'Ver ficha',nodate:'Data a confirmar',archive:'Arquivo',archiveEmpty:'Ainda não há notícias antigas arquivadas.',archiveNote:'As notícias anteriores ficarão aqui com data, imagem e fonte original.',unconfirmed:'RUMOR · NÃO CONFIRMADO',communityVisual:'FONTE COMUNITÁRIA'}
};
window.viNewsPage=function(route){
 const t=labels[locale]||labels.es,archive=route==='/noticias/archivo',official=archive||!route.endsWith('/no-oficiales');
 // Retention policy: keep at least 12 latest official announcements visible, and all
 // official reports published in the last 90 days. Old items move to Archive: never delete.
 const cut=new Date(Date.now()-90*86400000).toISOString().slice(0,10);
 const all=records.filter(r=>r.category==='actualizaciones'&&r.status==='verified'&&
   (official?(!r.facets||r.facets.community!==1):r.facets?.community===1))
   .sort((a,b)=>(b.publishedAt||'').localeCompare(a.publishedAt||''));
 const recent=all.filter((r,i)=>i<12||r.publishedAt>=cut);
 const older=all.filter((r,i)=>i>=12&&(!r.publishedAt||r.publishedAt<cut));
 const relevant=archive?older:official?recent:all;
 const rows=relevant.map(i=>{
  const date=/^\d{4}-\d{2}-\d{2}$/.test(i.publishedAt||'')
   ?new Intl.DateTimeFormat(locale==='en'?'en-US':locale==='pt'?'pt-BR':'es-AR',
      {day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(i.publishedAt+'T12:00:00Z')):t.nodate;
  const url=i.sources?.[0]?.url||'';
  const communityCard=!official;
  const preview=communityCard?'<div class="vi-news-rumor-cover"><span>GTA VI</span><strong>'+t.unconfirmed+'</strong><small>'+t.communityVisual+'</small></div>':thumb(i,'vi-news-image');
  const sourceLabel=communityCard?(url.includes('grandtheftwiki.com')?'Grand Theft Wiki':'GTA Wiki'):'Rockstar Games';
  return '<article class="vi-news-card'+(communityCard?' vi-news-community':'')+'">'+
   '<a href="#/ficha/'+encodeURIComponent(i.id)+'" class="vi-news-image-link">'+preview+'</a>'+
   '<div class="vi-news-body">'+
   '<div class="vi-news-date">'+esc(date)+' · '+sourceLabel+'</div>'+
   (communityCard?'<div class="vi-news-rumor-label">'+t.unconfirmed+'</div>':'')+
   '<h2><a href="#/ficha/'+encodeURIComponent(i.id)+'">'+esc(tr(i.title))+'</a></h2>'+
   '<p>'+esc(tr(i.summary))+'</p>'+
   '<div class="vi-news-actions"><a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">'+t.source+' ↗</a>'+
   '<a href="#/ficha/'+encodeURIComponent(i.id)+'">'+t.detail+' →</a></div></div></article>';
 }).join('');
 return '<section class="vi-news-page"><div class="vi-news-hero"><span class="eyebrow">GAME ATLAS · NEWSWIRE</span>'+
 '<h1>'+t.title+'</h1><p>'+t.sub+'</p></div>'+
 '<nav class="vi-news-tabs" aria-label="'+t.title+'">'+
 '<a href="#/noticias/oficiales" class="'+(official&&!archive?'is-active':'')+'" '+(official&&!archive?'aria-current="page"':'')+'>✓ '+t.official+'</a>'+
 '<a href="#/noticias/no-oficiales" class="'+(!official?'is-active':'')+'" '+(!official?'aria-current="page"':'')+'>◇ '+t.other+'</a>'+
 '<a href="#/noticias/archivo" class="'+(archive?'is-active':'')+'" '+(archive?'aria-current="page"':'')+'>▣ '+t.archive+' <span class="vi-news-archive-counter">'+older.length+'</span></a></nav>'+
 '<div class="vi-news-list">'+(rows||'<div class="vi-news-empty"><h2>'+(archive?t.archiveEmpty:t.empty)+'</h2><p>'+(archive?t.archiveNote:t.note)+'</p></div>')+'</div></section>';
};
})();
