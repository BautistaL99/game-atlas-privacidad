/* V208 — signed independent reports and wiki; accept short valid source URLs.
 * No map markers, favorites, progress, category records or official updater changes.
 * Render only after checking Ed25519 and a strict allowlist of publisher domains.
 */
(()=>{'use strict';
 const KEY='vi-community-v206-signed', LANGS=['es','en','pt'],MAX=4000000,MAX_NEWS=220,MAX_WIKI=1000;
 const allowedCategories=new Set(['personajes','vehiculos','armas','mapa-lugares']);
 let cfg=null,issue=null,lastRevision=-1,checking=false,lastCheck=0,timer=null;
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const clean=(x,n)=>typeof x==='string'&&x.length>0&&x.length<=n&&!/[<>\x00-\x1f]/.test(x);
 const translations=(v,n)=>v&&typeof v==='object'&&LANGS.every(l=>clean(v[l],n));
 const hostname=(raw,allowed)=>{
  if(typeof raw!=='string'||raw.length>600)return false;
  try{
   const url=new URL(raw);
   return url.protocol==='https:'&&!url.username&&!url.password&&!url.port&&!url.hash&&!url.search&&
      allowed.includes(url.hostname)&&url.pathname.length>=8;
  }catch{return false}
 };
 function validate(data){
  if(!data||data.schema!==205||data.mode!=='INDEPENDENT_REPORTING_AND_COMMUNITY_WIKI_NOT_OFFICIAL'||
    !Number.isSafeInteger(data.revision)||data.revision<1||!Array.isArray(data.news)||
    !Array.isArray(data.fiches)||data.news.length>MAX_NEWS||data.fiches.length>MAX_WIKI)throw Error('Community schema');
  const seen=new Set();
  for(const item of data.news){
   if(!item||!/^community-report-[a-f0-9]{24}$/.test(item.id)||seen.has(item.id)||
    item.sourceName!=='RockstarINTEL'||item.sourceTier!=='independent_reporting_not_official'||
    item.claimStatus!=='reported_not_confirmed_by_rockstar'||!hostname(item.sourceUrl,['rockstarintel.com','www.rockstarintel.com'])||
    !/^\d{4}-\d{2}-\d{2}$/.test(item.publishedAt)||
    !translations(item.title,180)||!translations(item.summary,450))throw Error('Untrusted community article');
   seen.add(item.id);
  }
  for(const item of data.fiches){
   if(!item||!/^wiki-community-[a-f0-9]{24}$/.test(item.id)||seen.has(item.id)||
     !allowedCategories.has(item.category)||item.sourceName!=='GTA Wiki'||
     item.sourceTier!=='community_indexed_not_rockstar_confirmed'||!hostname(item.sourceUrl,['gta.wiki'])||
     !new URL(item.sourceUrl).pathname.startsWith('/w/')||
     !translations(item.title,160)||!translations(item.summary,450)||
     !Number.isSafeInteger(item.wikiRevision)||item.wikiRevision<0||
     item.image!==undefined||item.facts!==undefined||item.mapPoint!==undefined||item.gallery!==undefined)throw Error('Untrusted community profile');
   if(item.specs!==undefined){
    if(!Array.isArray(item.specs)||item.specs.length>32)throw Error('Untrusted wiki fields');
    const keys=new Set();
    for(const field of item.specs){
     if(!field||!clean(field.key,70)||!clean(field.label,70)||!clean(field.value,180)||
       keys.has(field.key))throw Error('Unsafe sourced wiki specification');
     keys.add(field.key);
    }
   }
   seen.add(item.id);
  }
  return data;
 }
 const decode=raw=>Uint8Array.from(atob(raw),c=>c.charCodeAt(0));
 async function checkSigned(envelope,key){
  if(!envelope||envelope.schema!==205||typeof envelope.payload!=='string'||envelope.payload.length>MAX||
    typeof envelope.signature!=='string'||envelope.signature.length>100||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(envelope.payload))throw Error('Untrusted independent envelope');
  const pub=decode(key),sig=decode(envelope.signature);
  if(pub.length!==32||sig.length!==64)throw Error('Bad community key');
  const cryptoKey=await crypto.subtle.importKey('raw',pub,'Ed25519',false,['verify']);
  if(!await crypto.subtle.verify('Ed25519',cryptoKey,sig,new TextEncoder().encode(envelope.payload)))
    throw Error('Unsigned or modified community feed');
  return validate(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(decode(envelope.payload))));
 }
 function localeOf(lang){return LANGS.includes(lang)?lang:'es'}
 const text=(obj,lang)=>esc(obj?.[localeOf(lang)]||'');
 const words={
  es:{title:'Noticias de medios independientes',label:'MEDIO INDEPENDIENTE · NO CONFIRMADO POR ROCKSTAR',source:'Leer publicación original',wiki:'Fichas de GTA Wiki · No confirmadas por Rockstar',note:'Información comunitaria: sin estadísticas, imágenes o ubicaciones verificadas.',profile:'Consultar ficha en GTA Wiki',more:'Otras fichas comunitarias'},
  en:{title:'Independent media reports',label:'INDEPENDENT REPORT · NOT CONFIRMED BY ROCKSTAR',source:'Read original report',wiki:'GTA Wiki profiles · Not confirmed by Rockstar',note:'Community reference: no verified stats, images or map locations.',profile:'Open GTA Wiki entry',more:'Additional community profiles'},
  pt:{title:'Notícias de veículos independentes',label:'MÍDIA INDEPENDENTE · NÃO CONFIRMADO PELA ROCKSTAR',source:'Ler notícia original',wiki:'Fichas da GTA Wiki · Não confirmadas pela Rockstar',note:'Informação comunitária: sem estatísticas, imagens ou coordenadas verificadas.',profile:'Consultar ficha na GTA Wiki',more:'Outras fichas comunitárias'}
 };
 const date=s=>/^\d{4}-\d{2}-\d{2}$/.test(s||'')?s:'';
 function newsHtml(route,lang){
  if(!issue||route==='/noticias/oficiales'||/[?&]estado=favoritos/.test(location.hash))return '';
  const isArchive=route==='/noticias/archivo',cut=new Date(Date.now()-90*86400000).toISOString().slice(0,10);
  const rows=issue.news.filter(n=>isArchive?n.publishedAt<cut:n.publishedAt>=cut).sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt));
  if(!rows.length)return '';
  const t=words[localeOf(lang)],page=rows.map(i=>
   '<article class="vi-news-card vi-news-community vi-v206-editorial">'+
   '<div class="vi-news-body"><div class="vi-news-date">'+esc(date(i.publishedAt))+' · '+esc(i.sourceName)+'</div>'+
   '<div class="vi-news-rumor-label">'+t.label+'</div>'+
   '<h2><a href="'+esc(i.sourceUrl)+'" target="_blank" rel="noopener noreferrer">'+text(i.title,lang)+'</a></h2>'+
   '<p>'+text(i.summary,lang)+'</p>'+
   '<div class="vi-news-actions"><a href="'+esc(i.sourceUrl)+'" target="_blank" rel="noopener noreferrer">'+t.source+' ↗</a></div></div></article>'
  ).join('');
  return '<section class="vi-v206-independent-news" aria-label="'+t.title+'">'+page+'</section>';
 }
 function wikiHtml(category,lang){
  // Modern app integrates entries into their existing category cards; no duplicate list.
  if(window.viApplyCommunityFiches)return '';
  if(!issue||!allowedCategories.has(category))return '';
  const rows=issue.fiches.filter(r=>r.category===category).sort((a,b)=>String(a.title.en).localeCompare(String(b.title.en)));
  if(!rows.length)return '';
  const t=words[localeOf(lang)];
  const card=i=>'<article class="vi-v206-wiki-entry"><h3><a href="'+esc(i.sourceUrl)+'" target="_blank" rel="noopener noreferrer">'+text(i.title,lang)+'</a></h3>'+
    '<p>'+text(i.summary,lang)+'</p><a href="'+esc(i.sourceUrl)+'" target="_blank" rel="noopener noreferrer">'+t.profile+' ↗</a></article>';
  const preview=rows.slice(0,8).map(card).join(''),more=rows.slice(8).map(card).join('');
  return '<section class="vi-v206-wiki-list" aria-label="'+t.wiki+'">'+
   '<h2>'+t.wiki+' ('+rows.length+')</h2><p>'+t.note+'</p>'+
   '<div class="vi-v206-wiki-grid">'+preview+'</div>'+
   (more?'<details class="vi-v206-wiki-more"><summary>'+t.more+' ('+(rows.length-8)+')</summary><div class="vi-v206-wiki-grid">'+more+'</div></details>':'')+'</section>';
 }
 const style=document.createElement('style');
 style.id='vi-v206-community-only-style';
 style.textContent=[
 '#root .vi-news-list>[data-vi-community-news],#root .vi-v206-independent-news{display:contents}',
 '#root .vi-v206-editorial{min-height:0}',
 '#root .vi-v206-wiki-list{margin:20px 0 32px;padding:20px;border:1px solid #567384;border-radius:14px;background:#101c2c}',
 '#root .vi-v206-wiki-list>h2{font-size:1.15rem;line-height:1.4;margin:0 0 9px}',
 '#root .vi-v206-wiki-list>p{font-size:.9rem;opacity:.8;margin:0 0 16px}',
 '#root .vi-v206-wiki-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));gap:10px}',
 '#root .vi-v206-wiki-entry{padding:12px;border:1px solid #32495b;border-radius:10px;background:#12283a}',
 '#root .vi-v206-wiki-entry h3{font-size:1rem;margin:0 0 8px}',
 '#root .vi-v206-wiki-entry p{font-size:.85rem;line-height:1.5;opacity:.9;margin:0 0 10px}',
 '#root .vi-v206-wiki-entry a{color:#a9e4eb;text-decoration:underline;text-underline-offset:3px}',
 '#root .vi-v206-wiki-more{margin-top:12px}',
 '#root .vi-v206-wiki-more summary{cursor:pointer;padding:10px 0;color:#b8e8eb}',
 '@media(max-width:700px){#root .vi-v206-wiki-list{padding:12px;margin:14px 0}}'
 ].join('\n');
 document.head.appendChild(style);
 window.viCommunityNewsCards=(route,lang)=>newsHtml(route,lang);
 window.viCommunityWikiSection=(category,lang)=>'<div data-vi-community-wiki="'+esc(category)+'">'+wikiHtml(category,lang)+'</div>';
 window.viCommunityFiches=()=>issue?.fiches||[];
 function refreshVisible(){
  if(issue&&window.viApplyCommunityFiches)window.viApplyCommunityFiches(issue.fiches);
  const language=typeof locale==='string'?locale:(document.documentElement.lang||'es');
  for(const element of document.querySelectorAll('[data-vi-community-news]'))
   element.innerHTML=newsHtml(element.getAttribute('data-vi-community-news'),language);
  for(const element of document.querySelectorAll('[data-vi-community-wiki]'))
   element.innerHTML=wikiHtml(element.getAttribute('data-vi-community-wiki'),language);
 }
 async function refresh(force=false){
  if(!cfg||checking||navigator.onLine===false||(!force&&Date.now()-lastCheck<cfg.interval))return;
  checking=true;lastCheck=Date.now();
  try{
   const r=await fetch(cfg.url,{cache:'no-store',redirect:'error',headers:{Accept:'application/json'},signal:AbortSignal.timeout(12000)});
   if(!r.ok||Number(r.headers.get('content-length')||0)>MAX)throw Error('Community feed unavailable');
   const payload=await r.text();if(payload.length>MAX)throw Error('Community feed oversized');
   const env=JSON.parse(payload),next=await checkSigned(env,cfg.key);
   if(next.revision<lastRevision)throw Error('Community rollback blocked');
   if(next.revision===lastRevision)return;
   issue=next;lastRevision=next.revision;
   try{localStorage.setItem(KEY,JSON.stringify(env))}catch{}
   refreshVisible();
   dispatchEvent(new CustomEvent('vi:community-content-updated',{detail:{revision:lastRevision,news:next.news.length,fiches:next.fiches.length}}));
  }catch(err){console.warn('Community feed rejected; official news remains available:',err.message)}
  finally{checking=false}
 }
 async function start(){
  try{
   const response=await fetch('./online-config.json',{cache:'no-store'});
   if(!response.ok)throw Error('No signed content config');
   const conf=await response.json();
   if(conf.enabled!==true||!clean(conf.publicKeyEd25519Base64,90))return;
   const base=new URL(conf.manifestUrl);
   if(base.protocol!=='https:'||base.hostname!=='bautistal99.github.io'||
      !base.pathname.endsWith('/updates/catalog-envelope.json')||base.search||base.hash)throw Error('Unapproved feed');
   cfg={url:new URL('community-envelope-v205.json',base).href,
    key:conf.publicKeyEd25519Base64,
    interval:Math.max(10,Math.min(1440,Number(conf.minCheckMinutes)||30))*60000};
   try{
    const cached=localStorage.getItem(KEY);
    if(cached){const data=await checkSigned(JSON.parse(cached),cfg.key);issue=data;lastRevision=data.revision;refreshVisible()}
   }catch(e){try{localStorage.removeItem(KEY)}catch{}}
   void refresh(true);
   if(!timer)timer=setInterval(()=>{if(!document.hidden)void refresh()},cfg.interval);
  }catch(err){console.warn('Community bridge inactive:',err.message)}
 }
 window.viRefreshCommunityContent=()=>refresh(true);
 addEventListener('online',()=>void refresh());
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)void refresh()});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else void start();
})();
