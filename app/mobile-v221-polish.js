/* ANDROID V220 mobile QA polish. No changes to app data, map coordinates,
   signed catalogs, filters, favorites or routes. Idempotent on SPA rerenders. */
(()=>{'use strict';
 const root=document.getElementById('root');if(!root)return;
 const words={
  es:{rate:'Valorar',rateHelp:'Valorar Game Atlas en Google Play',compare:'Comparar',scroll:'Deslizá hacia abajo para completar los campos ↓'},
  en:{rate:'Rate app',rateHelp:'Rate Game Atlas on Google Play',compare:'Compare',scroll:'Scroll down to complete the form ↓'},
  pt:{rate:'Avaliar',rateHelp:'Avaliar Game Atlas no Google Play',compare:'Comparar',scroll:'Deslize para baixo para completar o formulário ↓'}
 };
 const isIOS=()=>window.Capacitor?.getPlatform?.()==='ios';
 const playUrl='https://play.google.com/store/apps/details?id=com.indie.viassistant';
 const iosWords={es:{label:'Descargas',hint:'Descargas y estado de Game Atlas para iOS'},en:{label:'Downloads',hint:'Game Atlas iOS downloads and status'},pt:{label:'Downloads',hint:'Downloads e estado do Game Atlas para iOS'}};
 const language=()=>words[(document.documentElement.lang||'es').slice(0,2)]||words.es;
 const isExplore=()=>decodeURIComponent((location.hash||'').slice(1)).split('?')[0]==='/explorar';
 function update(){
  const t=language();
  const rate=root.querySelector('.topbar .mobile-download');
  if(rate){
   if(isIOS()){
    const io=iosWords[(document.documentElement.lang||'es').slice(0,2)]||iosWords.es;
    rate.href='#/descargas';rate.removeAttribute('target');rate.removeAttribute('rel');
    rate.setAttribute('aria-label',io.hint);rate.title=io.hint;
    rate.innerHTML='↧ <span>'+io.label+'</span>';
   }else{
    rate.href=playUrl;rate.target='_blank';rate.rel='noopener noreferrer';
    rate.setAttribute('aria-label',t.rateHelp);rate.title=t.rateHelp;
    rate.innerHTML='☆ <span>'+t.rate+'</span>';
   }
  }
  // The existing six main tabs remain unchanged; a distinct Compare shortcut
  // is visible on Explore, while the existing More-menu destination remains.
  let quick=root.querySelector(':scope > .vi-v221-compare-shortcut');
  const mobile=matchMedia('(max-width:700px)').matches;
  if(!mobile||!isExplore()){
   quick?.remove();
  }else{
   if(!quick){
    quick=document.createElement('a');quick.className='vi-v221-compare-shortcut';
    quick.href='#/comparar';root.append(quick);
   }
   quick.textContent='⇄ '+t.compare;
   quick.setAttribute('aria-label',t.compare);
  }
  const editor=root.querySelector('.atlas-v119 .atlas-pin-editor');
  if(editor&&!editor.querySelector('.vi-v221-scroll-hint')){
   const h=document.createElement('small');h.className='vi-v221-scroll-hint';
   h.textContent=t.scroll;
   editor.querySelector('.atlas-pin-editor-head')?.insertAdjacentElement('afterend',h);
  }else if(editor){
   const h=editor.querySelector('.vi-v221-scroll-hint');
   if(h&&h.textContent!==t.scroll)h.textContent=t.scroll;
  }
 }
 let pending=false;
 function schedule(){if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;update()})}
 new MutationObserver(schedule).observe(root,{childList:true,subtree:false});
 addEventListener('hashchange',schedule);addEventListener('resize',schedule,{passive:true});
 document.addEventListener('DOMContentLoaded',schedule,{once:true});schedule();
})();

/* V222 device QA: avoid click-through when a map touch creates a new marker.
   Synthetic compatibility clicks can target a NEW input/select under the
   finger after the editor replaces the map's DOM on touchend. */
(()=>{'use strict';
 let guardUntil=0;
 const BLOCK_FOR_MS=600;
 const isMapPlacement=(target)=>{
  const canvas=target?.closest?.('.atlas-map.vi-map-placing');
  return !!canvas&&!target.closest('button,a,input,textarea,select,.atlas-pin-editor,.atlas-popup,.vi-map-filter-chips');
 };
 document.addEventListener('touchend',event=>{
  if(event.changedTouches.length!==1||!isMapPlacement(event.target))return;
  guardUntil=Date.now()+BLOCK_FOR_MS;
 },{capture:true,passive:true});
 document.addEventListener('click',event=>{
  if(Date.now()>guardUntil)return;
  const editor=event.target?.closest?.('.atlas-pin-editor');
  if(!editor)return;
  event.preventDefault();event.stopImmediatePropagation();
  guardUntil=0;
 },true);
 // Android's keyboard can resize both layout and visual viewports. Keep the
 // marker editor pinned to the visible top and scroll within it; do not shrink
 // it in proportion to the map canvas underneath the keyboard.
 const root=document.getElementById('root');
 const supported=()=>matchMedia('(max-width:700px), (orientation:landscape) and (max-height:600px) and (pointer:coarse)').matches;
 function updateKeyboardEditor(){
  const editor=root?.querySelector('.atlas-pin-editor');
  const focus=!!editor?.contains(document.activeElement)&&document.activeElement?.matches('input,textarea,select');
  const on=focus&&supported();
  document.documentElement.classList.toggle('vi-v222-marker-keyboard',on);
  if(!on)return;
  const vv=window.visualViewport;
  const height=Math.max(250,Math.round(vv?.height||innerHeight));
  const top=Math.max(10,Math.round(vv?.offsetTop||0)+12);
  const available=Math.max(190,height-top-10);
  document.documentElement.style.setProperty('--vi-v222-editor-top',top+'px');
  document.documentElement.style.setProperty('--vi-v222-editor-height',available+'px');
  requestAnimationFrame(()=>{
   const active=document.activeElement;
   if(editor.isConnected&&editor.contains(active))active?.scrollIntoView({block:'nearest',inline:'nearest'});
  });
 }
 let queued=false;
 const queue=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;updateKeyboardEditor()})};
 document.addEventListener('focusin',queue,{capture:true,passive:true});
 document.addEventListener('focusout',queue,{capture:true,passive:true});
 window.visualViewport?.addEventListener('resize',queue,{passive:true});
 window.addEventListener('resize',queue,{passive:true});
 if(root)new MutationObserver(queue).observe(root,{childList:true,subtree:false});
})();
