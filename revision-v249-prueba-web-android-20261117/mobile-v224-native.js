/* Game Atlas V220 native mobile navigation, editor gesture isolation.
   Deliberately does not change user storage, catalog signatures, map records,
   or any of the public Web / Android assets. */
(()=>{'use strict';
 const root=document.getElementById('root');if(!root)return;
 const route=()=>{try{return decodeURIComponent((location.hash||'#/').slice(1))}catch{return '/'}};
 const path=r=>(r||'/').split('?')[0];
 const nestedParent=r=>{
  const p=path(r);
  if(/^\/explorar\/[^/]+/.test(p))return '/explorar';
  if(/^\/noticias\/[^/]+/.test(p))return '/noticias';
  return null;
 };
 const mobile=()=>matchMedia('(max-width:700px), (orientation:landscape) and (max-height:600px) and (pointer:coarse)').matches;
 let activeRoute=route();
 let explicitTarget=null;
 let lastContainer=null;
 let lastNestedBack=null;
 let pendingNewsDetailBack=null;
 // Rankings and News are also tiles of Explore, but do not live below /explorar/.
 // Preserve their entry point so Back returns to Explore only when opened there.
 let exploreExternalEntry=null;
 function parentFor(r){
  const group=nestedParent(r);if(group)return group;
  const p=path(r);
  if((p==='/rankings/speedruns'||p==='/rankings/donaciones'||p==='/noticias')
      && exploreExternalEntry===p)return '/explorar';
  if(/^\/(?:ficha|detalle)\//.test(path(r))){
   const origin=history.state?.viNewsDetailOrigin;
   if(typeof origin==='string'&&origin.startsWith('/'))return path(origin);
   if(lastContainer)return lastContainer;
  }
  return null;
 }
 function replaceAndRender(target,fromBrowserHistory=false){
  if(!target||route()===target)return;
  const oldURL=location.href;
  window.viNativeHistoryReconcileR4?.('#'+target);
  history.replaceState({...history.state,viAndroidNestedBack:true},'', '#'+target);
  activeRoute=route();
  // popstate for a hash navigation is followed by a native hashchange;
  // dispatching a second one here caused a transient double render.
  if(!fromBrowserHistory)window.dispatchEvent(new HashChangeEvent('hashchange',{oldURL,newURL:location.href}));
 }
 // Track explicit link targets separately: selecting another bottom tab is NOT
 // a system Back and should never get replaced with the nested parent.
 document.addEventListener('click',e=>{
  const a=e.target?.closest?.('a[href^="#/"]');
  if(!a||!mobile())return;
  const dst=a.getAttribute('href')?.slice(1);
  if(!dst)return;
  const from=route();
  if(path(from).startsWith('/explorar/') || path(from).startsWith('/noticias/'))lastContainer=from;
  // The 14 Explore tiles include two ranking routes, and the News tile.
  // Opening a main News tab from anywhere else must NOT inherit this origin.
  if(dst==='/noticias'||/^\/rankings\/(speedruns|donaciones)$/.test(dst)) {
   exploreExternalEntry=path(from)==='/explorar' ? path(dst) : null;
  }
  explicitTarget=dst;
  setTimeout(()=>{if(explicitTarget===dst)explicitTarget=null},400);
 },true);
 window.addEventListener('hashchange',()=>{activeRoute=route();explicitTarget=null},false);
 window.addEventListener('popstate',()=>{
  if(!mobile())return;
  const now=route(),from=activeRoute,expected=explicitTarget;
  // A detail opened from Home/News has an actual browser-history entry.
  // Do not rewrite the destination while popstate/hashchange restore it.
  if(/^\/(?:ficha|detalle)\//.test(path(from))){activeRoute=now;return}
  if(expected&&now===expected){activeRoute=now;return}
  const parent=parentFor(from);
  // Keep valid browser history inside the same tab unchanged.
  if(parent&&now!==parent&&now!==from&&nestedParent(now)!==parent){
   replaceAndRender(parent,true);return;
  }
  activeRoute=now;
 },true);
 // Android has a single backButton listener; iOS calls this helper from the edge gesture.
 // Delegate to this specific nested-navigation/marker handler FIRST, then
 // let the original listener manage root tabs and double-back-to-exit.
 window.viNativeHandleBackR4=()=>{
  // Some WebViews can report both a native backButton and a legacy backbutton
  // for the same gesture. Consume the duplicate instead of leaving Explore.
  if(lastNestedBack&&Date.now()-lastNestedBack.at<650&&route()===lastNestedBack.to)return true;
  if(root.querySelector('.atlas-pin-editor')){
   ghostUntil=0;explicitEditorTouch=true;
   root.querySelector('.atlas-pin-editor [data-map="cancel"]')?.click();
   return true;
  }
  // News details keep a true history entry so going back also preserves
  // the original News tab and its scroll position. Consume duplicate gestures.
  const detailOrigin=history.state?.viNewsDetailOrigin;
  if(/^\/(?:ficha|detalle)\//.test(path(route())) && typeof detailOrigin==='string' && detailOrigin.startsWith('/')){
   const entry=history.state?.viNewsDetailNavId||location.hash;
   if(pendingNewsDetailBack?.entry===entry&&Date.now()-pendingNewsDetailBack.at<800)return true;
   pendingNewsDetailBack={entry,at:Date.now()};
   lastNestedBack={to:path(detailOrigin),at:Date.now()};
   history.back();
   return true;
  }
  const parent=parentFor(route());
  if(parent){replaceAndRender(parent);lastNestedBack={to:parent,at:Date.now()};return true}
  return false;
 };
 // Native Android can retarget the compatibility click from the map onto a
 // freshly created select or textarea. Swallow that click only if it did NOT
 // come from a new deliberate touch/pointer in the editor.
 let ghostUntil=0,explicitEditorTouch=false;
 // Only remove native focus ring for gestures started with a finger on a marker.
 // Keyboard navigation continues to show the accessible focus indicator.
 const markTouchMapHandle=e=>{
  if(e.target?.closest?.('.atlas-pin,.atlas-cluster'))document.documentElement.classList.add('vi-v225-touch-marker');
 };
 document.addEventListener('touchstart',markTouchMapHandle,{capture:true,passive:true});
 document.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')markTouchMapHandle(e)},{capture:true,passive:true});
 document.addEventListener('keydown',()=>document.documentElement.classList.remove('vi-v225-touch-marker'),true);
 const inEditor=e=>!!e.target?.closest?.('.atlas-pin-editor');
 const placing=e=>!!e.target?.closest?.('.atlas-map.vi-map-placing')&&!e.target?.closest?.('button,a,input,textarea,select,.atlas-pin-editor,.atlas-popup,.vi-map-filter-chips');
 for(const kind of ['pointerdown','touchstart'])document.addEventListener(kind,e=>{
  if(!mobile())return;
  if(inEditor(e)){explicitEditorTouch=true;return}
  if(placing(e)){explicitEditorTouch=false}
 },{capture:true,passive:true});
 document.addEventListener('touchend',e=>{
  if(mobile()&&placing(e)&&e.changedTouches.length===1){
   ghostUntil=Date.now()+650;explicitEditorTouch=false;
  }
 },{capture:true,passive:true});
 // New editor is a TRUE modal: taps behind it do not reach the map, filters,
 // bottom tabs or other components. All controls INSIDE remain immediately usable.
 const updateEditor=()=>document.documentElement.classList.toggle('vi-v224-marker-open',!!root.querySelector('.atlas-pin-editor'));
 let pending=false;
 const schedule=()=>{if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;updateEditor()})};
 new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
 addEventListener('hashchange',schedule);schedule();
 for(const kind of ['pointerdown','touchstart','touchend','click'])document.addEventListener(kind,e=>{
  if(!root.querySelector('.atlas-pin-editor'))return;
  if(inEditor(e)){
   if(kind==='click'&&Date.now()<ghostUntil&&!explicitEditorTouch){
    e.preventDefault();e.stopImmediatePropagation();ghostUntil=0;
   }
   return;
  }
  if(e.target===root||root.contains(e.target)){
   e.preventDefault();e.stopImmediatePropagation();
  }
 },{capture:true,passive:false});
 document.addEventListener('focusin',e=>{
  if(Date.now()<ghostUntil&&!explicitEditorTouch&&inEditor(e))e.target.blur?.();
 },true);
})();
