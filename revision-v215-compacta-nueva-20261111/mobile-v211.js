/* V211 · Mobile-only navigation accessibility + iOS/Android keyboard support.
 * Does NOT touch routes, signed feeds, localStorage, favorites or progress.
 * Relies only on existing DOM; safely re-applies when the SPA rerenders.
 */
(()=>{'use strict';
 const mobile=matchMedia('(max-width:700px)');
 const shapes={
  '/':'<path d="m3 10 9-7 9 7"/><path d="M5 9.5V21h14V9.5"/><path d="M9 21v-7h6v7"/>',
  '/explorar':'<rect x="3" y="3" width="7" height="7" rx="1.1"/><rect x="14" y="3" width="7" height="7" rx="1.1"/><rect x="3" y="14" width="7" height="7" rx="1.1"/><rect x="14" y="14" width="7" height="7" rx="1.1"/>',
  '/mapa':'<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2z"/><path d="M9 3v16M15 5v16"/>',
  '/noticias':'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 7h9M8 11h9M8 15h5M17 15v2"/>',
  '/partida':'<path d="m12 2 3.1 6.3 7 1-5.1 5 .9 7-5.9-3.3-5.9 3.3.9-7-5.1-5 7-1z"/>',
  more:'<path d="M4 7h16M4 12h16M4 17h16"/>'
 };
 function svg(key){
  return '<svg data-vi-mobile-icon="'+key+'" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">'+shapes[key]+'</svg>';
 }
 function renderIcons(){
  if(!mobile.matches)return;
  const nav=document.querySelector('#root .bottom-nav');
  if(!nav)return;
  nav.setAttribute('aria-label','Navegación principal');
  for(const link of nav.querySelectorAll(':scope > a')){
   const route=(link.getAttribute('href')||'').slice(1);
   const span=link.querySelector(':scope > .nav-symbol');
   if(span&&shapes[route]&&!span.querySelector('svg[data-vi-mobile-icon]')){
    span.innerHTML=svg(route);
    span.setAttribute('aria-hidden','true');
   }
  }
  const more=nav.querySelector('.mobile-more');
  if(more){
   const span=more.querySelector(':scope > summary > .nav-symbol');
   if(span&&!span.querySelector('svg[data-vi-mobile-icon]')){
    span.innerHTML=svg('more');
    span.setAttribute('aria-hidden','true');
   }
   const summary=more.querySelector(':scope > summary');
   if(summary&&!summary.hasAttribute('title'))summary.setAttribute('title','Abrir más secciones');
  }
  const main=document.querySelector('#root main.main');
  if(main&&!main.hasAttribute('id'))main.id='vi-mobile-content';
 }
 let scheduled=false;
 function queueUpgrade(){
  if(scheduled)return;
  scheduled=true;
  requestAnimationFrame(()=>{scheduled=false;renderIcons();});
 }
 const root=document.getElementById('root');
 if(root)new MutationObserver(queueUpgrade).observe(root,{childList:true,subtree:false});
 document.addEventListener('DOMContentLoaded',queueUpgrade,{once:true});
 window.addEventListener('hashchange',queueUpgrade);
 mobile.addEventListener?.('change',queueUpgrade);

 // Avoid covering the on-screen keyboard when editing fields. iOS Safari
 // exposes the visual viewport, while Android may resize the layout viewport.
 const keyboardClass='vi-v211-keyboard-open';
 function updateKeyboard(){
  const focused=document.activeElement;
  const editor=!!focused&&
   (focused.matches('input:not([type=checkbox]):not([type=radio]),textarea,select,[contenteditable=true]'));
  const view=window.visualViewport;
  const smaller=!!view&&view.height < window.innerHeight-145;
  document.documentElement.classList.toggle(keyboardClass,editor&&smaller&&mobile.matches);
 }
 window.visualViewport?.addEventListener('resize',updateKeyboard,{passive:true});
 window.addEventListener('resize',updateKeyboard,{passive:true});
 document.addEventListener('focusin',updateKeyboard,{passive:true});
 document.addEventListener('focusout',()=>requestAnimationFrame(updateKeyboard),{passive:true});

 // Close "More" when tapping another area; preserve native details keyboard
 // handling, all original destinations, and SPA render state.
 document.addEventListener('pointerdown',event=>{
  const more=document.querySelector('#root .mobile-more[open]');
  if(more&&!more.contains(event.target))more.open=false;
 },{passive:true});
 document.addEventListener('keydown',event=>{
  if(event.key==='Escape'){
   const more=document.querySelector('#root .mobile-more[open]');
   if(more){more.open=false;more.querySelector('summary')?.focus();}
  }
 });
})();
