/* Game Atlas V220 native mobile compatibility. Handles WebView navigation and editor tap safety.
   No mutation of saved progress, pins, routes, external feeds or trusted signing keys. */
(()=>{'use strict';
 const root=document.getElementById('root');if(!root)return;
 const route=()=>{try{return decodeURIComponent((location.hash||'#/').slice(1)).split('?')[0]}catch{return '/'}};
 const isAndroidMobile=()=>matchMedia('(max-width:700px), (orientation:landscape) and (max-height:600px) and (pointer:coarse)').matches;
 const parentOf=r=>{
  if(/^\/explorar\/[^/]+/.test(r))return '/explorar';
  if(/^\/noticias\/[^/]+/.test(r))return '/noticias';
  return null;
 };
 // Native R4 moves native Back and ghost-touch handling to mobile-v224-android.js.
 // The previous popstate-only fix ran after hashchange and skipped nested routes.
 // Restore clear visibility when screen or keyboard changes.
 const sync=()=>{if(!root.querySelector('.atlas-pin-editor'))document.documentElement.classList.remove('vi-v223-lock-editor')};
 new MutationObserver(sync).observe(root,{childList:true,subtree:false});
})();
