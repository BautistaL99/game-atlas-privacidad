/* V155. Separate news destination: official verified source vs community candidate. */
(()=>{'use strict';
const labels={
 es:{title:'Noticias de GTA VI',sub:'Novedades, anuncios e información con su fuente original.',official:'Oficiales',other:'No oficiales',empty:'Todavía no hay noticias no oficiales listas para publicar.',note:'Las fuentes de la comunidad aparecerán aquí claramente separadas de las confirmaciones de Rockstar.',source:'Leer noticia original',detail:'Ver ficha',nodate:'Fecha por confirmar',archive:'Archivo histórico',archiveEmpty:'Todavía no hay noticias antiguas archivadas.',archiveNote:'Aquí aparecen noticias viejas que salieron de las novedades. Se conserva el texto, la fecha y el enlace original; las fotos se muestran mediante enlaces, sin guardar copias nuevas en nuestro servidor.',imageNotice:'Ilustración conceptual: no confirma el rumor.',unconfirmed:'RUMOR · NO CONFIRMADO',communityVisual:'FUENTE COMUNITARIA'},
 en:{title:'GTA VI News',sub:'Updates and announcements with their original sources.',official:'Official',other:'Unofficial',empty:'No unofficial stories have passed review yet.',note:'Community information will appear here, clearly separated from Rockstar confirmations.',source:'Read original article',detail:'View entry',nodate:'Date to be confirmed',archive:'Historical archive',archiveEmpty:'No older news has been archived yet.',archiveNote:'Older reports move here from recent news. Text, date and source links remain available; image URLs are referenced, not downloaded into our hosting.',imageNotice:'Concept illustration: it does not confirm this rumour.',unconfirmed:'RUMOUR · UNCONFIRMED',communityVisual:'COMMUNITY SOURCE'},
 pt:{title:'Notícias de GTA VI',sub:'Novidades e anúncios com suas fontes originais.',official:'Oficiais',other:'Não oficiais',empty:'Ainda não há notícias não oficiais prontas para publicação.',note:'As notícias da comunidade aparecerão aqui, separadas das confirmações da Rockstar.',source:'Ler notícia original',detail:'Ver ficha',nodate:'Data a confirmar',archive:'Arquivo histórico',archiveEmpty:'Ainda não há notícias antigas arquivadas.',archiveNote:'Notícias antigas saem das novidades e permanecem aqui com texto, data e fonte; imagens são referenciadas, não copiadas para nossa hospedagem.',imageNotice:'Ilustração conceitual: não confirma o rumor.',unconfirmed:'RUMOR · NÃO CONFIRMADO',communityVisual:'FONTE COMUNITÁRIA'}
};
// Community reports do not receive unrelated Rockstar photos.
// Use the same visibly labeled, topic-specific conceptual art in News,
// the home catalog and item cards. This is NOT evidence of a rumor.
function communityPreview(item,t){
 return thumb(item,'vi-news-image');
}
function splitArchive(items,cut){
 const latest=items.filter((r,i)=>i<12||r.publishedAt>=cut);
 const older=items.filter((r,i)=>i>=12&&(!r.publishedAt||r.publishedAt<cut));
 return {latest,older};
}
window.viNewsPage=function(route){
 const t=labels[locale]||labels.es,archive=route==='/noticias/archivo',official=archive||!route.endsWith('/no-oficiales');
 // Retention policy: keep at least 12 latest official announcements visible, and all
 // official reports published in the last 90 days. Old items move to Archive: never delete.
 const cut=new Date(Date.now()-90*86400000).toISOString().slice(0,10);
 const officialItems=records.filter(r=>r.category==='actualizaciones'&&r.status==='verified'&&r.facets?.community!==1)
  .sort((a,b)=>(b.publishedAt||'').localeCompare(a.publishedAt||''));
 const communityItems=records.filter(r=>r.category==='actualizaciones'&&r.status==='verified'&&r.facets?.community===1)
  .sort((a,b)=>(b.publishedAt||'').localeCompare(a.publishedAt||''));
 const olderOfficial=splitArchive(officialItems,cut),olderCommunity=splitArchive(communityItems,cut);
 const older=[...olderOfficial.older,...olderCommunity.older]
  .sort((a,b)=>(b.publishedAt||'').localeCompare(a.publishedAt||''));
 const relevant=archive?older:official?olderOfficial.latest:olderCommunity.latest;
 const rows=relevant.map(i=>{
  const date=/^\d{4}-\d{2}-\d{2}$/.test(i.publishedAt||'')
   ?new Intl.DateTimeFormat(locale==='en'?'en-US':locale==='pt'?'pt-BR':'es-AR',
      {day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(i.publishedAt+'T12:00:00Z')):t.nodate;
  const url=i.sources?.[0]?.url||'';
  const communityCard=i.facets?.community===1;
  const preview=communityCard?communityPreview(i,t):thumb(i,'vi-news-image');
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
 (archive?'<div class="vi-news-archive-note">'+t.archiveNote+'</div>':'')+
 '<div class="vi-news-list">'+(rows||'<div class="vi-news-empty"><h2>'+(archive?t.archiveEmpty:t.empty)+'</h2><p>'+(archive?t.archiveNote:t.note)+'</p></div>')+'</div></section>';
};
})();
