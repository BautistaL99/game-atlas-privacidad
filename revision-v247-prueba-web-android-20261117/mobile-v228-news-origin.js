/* V220 · Navegacion de fichas de noticias con origen explicito.
   Web y aplicaciones: abrir Ver ficha desde Inicio o Noticias crea UN
   paso real de historial, guardando el origen. El navegador puede hacer
   un unico history.back() sin disparar navegaciones duplicadas. */
(()=>{'use strict';
 let nextEntry=0;
 const source=()=>{try{return decodeURIComponent((location.hash||'#/').slice(1)).split('?')[0]}catch{return '/'}};
 const fromNewsArea=route=>route==='/'||/^\/noticias(?:\/|$)/.test(route)||route==='/explorar/actualizaciones';
 document.addEventListener('click',e=>{
  if(e.defaultPrevented||e.button!==0||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;
  const a=e.target?.closest?.('a[href^="#/ficha/"]');
  if(!a||a.target&&a.target!=='_self'||a.hasAttribute('download'))return;
  const from=source(),to=a.getAttribute('href');
  if(!fromNewsArea(from)||!/^#\/ficha\/[^?#]+/.test(to)||location.hash===to)return;
  // No cambio de localStorage: la vista y su punto de origen solo viven en
  // esta entrada del historial de la sesion.
  e.preventDefault();
  const oldURL=location.href;
  history.pushState({...history.state,viNewsDetailOrigin:from,viNewsDetailTarget:to,viNewsDetailNavId:String(Date.now())+'-'+(++nextEntry)},'',to);
  dispatchEvent(new HashChangeEvent('hashchange',{oldURL,newURL:location.href}));
 },true);
})();
