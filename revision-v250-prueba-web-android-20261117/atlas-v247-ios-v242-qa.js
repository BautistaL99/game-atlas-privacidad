/* Game Atlas iOS V242: one map search surface, no second floating results
   and safe personal-marker relocation after a signed map revision. */
(()=>{'use strict';
 /* Shared cross-platform implementation: no iOS-only gate. */
 window.viIosV242Enabled=true;
 document.documentElement.classList.add('vi-ios-v242');
 // The old native map results were inside a separate (positioned) container.
 // V241 now includes the same verified locations in its unified search list.
 function enhance(){
  const editor=document.querySelector('#mapApp .atlas-pin-editor');
  const archived=window.viIosMapRelocationDraft?.();
  if(editor&&archived&&editor.dataset.v242Filled!==archived.id){
   editor.dataset.v242Filled=archived.id;
   const value=(id,text)=>{const field=editor.querySelector('#'+id);if(field)field.value=text||''};
   value('mapPinName',archived.title);value('mapPinNote',archived.note);
   value('mapPinCategory',archived.category);value('mapPinLinked',archived.itemId);
  }
  // With a map query, suppress the old results surface even if another script
  // temporarily reconstructs it. Its content is in the unified list above.
  const map=document.querySelector('#mapApp .atlas-v119');
  if(map){
   const query=map.querySelector('#mapSearchText')?.value?.trim();
   const old=map.querySelector(':scope > .atlas-search-results');
   if(query&&old)old.style.display='none';
  }
 }
 let queued=false;
 const queue=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;enhance()})};
 const root=document.querySelector('#root');
 if(root)new MutationObserver(queue).observe(root,{subtree:true,childList:true});
 addEventListener('hashchange',queue,{passive:true});
 queue();
})();