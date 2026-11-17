/* Preview V220: limit dropdown to the visible area above a mobile keyboard.
   The CSS already anchors the list under the search field; this optional
   enhancement adapts its height when visualViewport shrinks on Android/iOS. */
(()=>{
  'use strict';
  const mobile=()=>window.matchMedia('(max-width:700px)').matches;
  function adjust(){
    if(!mobile())return;
    const box=document.getElementById('headerSuggestions');
    const form=document.getElementById('headerSearchForm');
    if(!box||!form)return;
    const vv=window.visualViewport;
    const visibleBottom=vv ? vv.offsetTop + vv.height : window.innerHeight;
    const inputBottom=form.getBoundingClientRect().bottom;
    const space=Math.max(56,Math.floor(visibleBottom-inputBottom-12));
    box.style.setProperty('--v231-suggest-space',space+'px');
  }
  const requestAdjust=()=>window.requestAnimationFrame(adjust);
  document.addEventListener('focusin',e=>{
    if(e.target.id==='headerSearchInput')requestAdjust();
  });
  document.addEventListener('input',e=>{
    if(e.target.id==='headerSearchInput')requestAdjust();
  });
  window.addEventListener('resize',requestAdjust,{passive:true});
  window.addEventListener('orientationchange',requestAdjust,{passive:true});
  window.visualViewport?.addEventListener('resize',requestAdjust,{passive:true});
  window.visualViewport?.addEventListener('scroll',requestAdjust,{passive:true});
  requestAdjust();
})();
