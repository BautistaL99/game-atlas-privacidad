/* V217 V216-preview: draggable PAGE scrollbar on the outer right edge.
 * Not a button inside the map; does not intercept map or pinch gestures. */
(()=>{'use strict';
 // Portrait AND landscape phones: landscape viewport can exceed 700 CSS px.
 const mobile=()=>window.matchMedia('(max-width:700px), (pointer:coarse) and (max-width:1150px)').matches;
 const mapPage=()=>/^#\/mapa(?:[/?]|$)/.test(location.hash||'');
 const enabled=()=>mobile()&&mapPage();
 const words={
  es:'Agarrá esta barra para subir o bajar la página',
  en:'Drag this bar to scroll the page up or down',
  pt:'Arraste esta barra para subir ou descer a página'
 };
 let rail=null,thumb=null,dragId=null,queued=false;
 // On the mobile map route the app itself scrolls, not the browser viewport.
 // This eliminates Chrome Android's unstyleable blue viewport scroll indicator.
 const scrollNode=()=>enabled()?(document.getElementById('root')||document.scrollingElement||document.documentElement):(document.scrollingElement||document.documentElement);
 const scrollMax=()=>{const node=scrollNode();return Math.max(0,node.scrollHeight-node.clientHeight)};
 let wasEnabled=false;
 function seek(clientY){
  if(!rail||!thumb||rail.hidden)return;
  const rect=rail.getBoundingClientRect();
  const th=thumb.offsetHeight||50;
  const fraction=Math.max(0,Math.min(1,(clientY-rect.top-th/2)/Math.max(1,rect.height-th)));
  scrollNode().scrollTop=fraction*scrollMax();
  drawThumb();
 }
 function attach(){
  if(rail)return;
  rail=document.createElement('div');
  rail.className='v217-page-scroll-rail';
  rail.setAttribute('role','scrollbar');
  rail.setAttribute('aria-orientation','vertical');
  rail.setAttribute('aria-valuemin','0');
  rail.setAttribute('aria-valuemax','100');
  rail.setAttribute('tabindex','0');
  rail.setAttribute('aria-label',words[(document.documentElement.lang||'es').slice(0,2)]||words.es);
  thumb=document.createElement('span');
  thumb.className='v217-page-scroll-thumb';
  rail.append(thumb);
  rail.addEventListener('pointerdown',e=>{
   if(e.button!==0)return;
   e.preventDefault();e.stopPropagation();
   dragId=e.pointerId;
   try{rail.setPointerCapture(e.pointerId)}catch(_){}
   if(document.body.classList.contains('vi-map-modal-active')){
     document.querySelector('#mapCanvas [data-map="fullscreen"]')?.click();
     requestAnimationFrame(()=>{seek(e.clientY);schedule()});
   }else seek(e.clientY);
  });
  rail.addEventListener('pointermove',e=>{
   if(dragId!==e.pointerId)return;
   e.preventDefault();seek(e.clientY);
  });
  for(const ev of ['pointerup','pointercancel','lostpointercapture'])
    rail.addEventListener(ev,e=>{if(dragId===e.pointerId)dragId=null});
  rail.addEventListener('keydown',e=>{
   const commands={ArrowDown:80,ArrowUp:-80,PageDown:innerHeight*.8,PageUp:-innerHeight*.8};
   if(Object.prototype.hasOwnProperty.call(commands,e.key)){
    e.preventDefault();scrollNode().scrollTop+=commands[e.key];
    drawThumb();
   } else if(e.key==='Home'||e.key==='End'){
    e.preventDefault();scrollNode().scrollTop=e.key==='Home'?0:scrollMax();
    drawThumb();
   }
  });
  document.body.append(rail);
 }
 function drawThumb(){
  if(!rail||!thumb)return;
  if(!enabled()){rail.hidden=true;return}
  const max=scrollMax(),height=rail.getBoundingClientRect().height;
  rail.hidden=height<70;
  if(rail.hidden)return;
  const th=Math.min(62,Math.max(44,height-4)); // small draggable handle; never an oversized scrollbar
  thumb.style.height=th+'px';
  const value=max?Math.min(1,Math.max(0,scrollNode().scrollTop/max)):0;
  thumb.style.transform='translateY('+((height-th)*value)+'px)';
  rail.setAttribute('aria-valuenow',String(Math.round(value*100)));
 }
 function ensureRoutesAccess(){
  if(!enabled())return;
  const toolbar=document.querySelector('#mapApp .atlas-v119 .atlas-toolbar');
  if(!toolbar||toolbar.querySelector('.v218-route-access'))return;
  const button=document.createElement('button');
  button.type='button';button.dataset.map='routes';button.className='v218-route-access';
  const lang=(document.documentElement.lang||'es').slice(0,2);
  button.textContent=({es:'🧭 Rutas',en:'🧭 Routes',pt:'🧭 Rotas'})[lang]||'🧭 Rutas';
  button.title=({es:'Ver y crear recorridos',en:'View and create routes',pt:'Ver e criar rotas'})[lang]||'Ver y crear recorridos';
  toolbar.append(button);
 }
 function update(){
  queued=false;
  const active=enabled();
  // A non-viewport scroll container prevents Android's blue overlay rail
  // when users swipe above/beside the map. The green rail controls this node.
  if(active!==wasEnabled){
    const root=document.getElementById('root');
    if(root)root.scrollTop=0;
    (document.scrollingElement||document.documentElement).scrollTop=0;
    wasEnabled=active;
  }
  document.documentElement.classList.toggle('vi-route-map',active);
  if(!active){if(rail)rail.hidden=true;return}
  attach();drawThumb();ensureRoutesAccess();
 }
 function schedule(){if(queued)return;queued=true;requestAnimationFrame(update)}
 addEventListener('scroll',schedule,{passive:true});
 addEventListener('resize',schedule,{passive:true});
 addEventListener('hashchange',schedule);
 addEventListener('popstate',schedule);
 window.visualViewport?.addEventListener('resize',schedule,{passive:true});
 const root=document.getElementById('root');
 if(root){
   root.addEventListener('scroll',schedule,{passive:true});
   new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
 }
 document.addEventListener('DOMContentLoaded',schedule,{once:true});
 schedule();
})();