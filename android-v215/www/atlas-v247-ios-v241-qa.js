/* Game Atlas iOS V241 — signed catalog autocomplete + keyboard-safe map editor.
   Only loaded by iOS. No coordinates, saves, wiki or news changed. */
(()=>{'use strict';
 /* Shared cross-platform implementation: no iOS-only gate. */
 window.viIosV241Enabled=true;
 document.documentElement.classList.add('vi-ios-v241');
 const L=()=>['es','en','pt'].includes(document.documentElement.lang?.slice(0,2))?document.documentElement.lang.slice(0,2):'es';
 const N=x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
 const strings={
  es:{last:'Última búsqueda',records:'Fichas verificadas',rankingUnavailable:'Ranking no verificable',rankingAvailable:'Ranking por datos verificados',phrases:'Sugerencias de búsqueda',map:'Lugares y categorías',related:'Búsqueda relacionada',place:'Ubicación del mapa'},
  en:{last:'Last search',records:'Verified entries',rankingUnavailable:'Ranking not verifiable',rankingAvailable:'Ranking from verified data',phrases:'Search suggestions',map:'Places and categories',related:'Related search',place:'Map location'},
  pt:{last:'Última busca',records:'Fichas verificadas',rankingUnavailable:'Classificação não verificável',rankingAvailable:'Classificação com dados verificados',phrases:'Sugestões de busca',map:'Lugares e categorias',related:'Busca relacionada',place:'Local do mapa'}
 };
 const geo={
  es:['playa','playas','vice city','leonida','regiones','ciudades','aeropuertos','puentes','garajes','talleres','hospitales','hoteles','misiones','autos','motos','armas','lugares','tiendas','ríos','islas','parques','policía'],
  en:['beach','beaches','vice city','leonida','regions','cities','airports','bridges','garages','workshops','hospitals','hotels','missions','cars','motorcycles','weapons','places','shops','rivers','islands','parks','police'],
  pt:['praia','praias','vice city','leonida','regiões','cidades','aeroportos','pontes','garagens','oficinas','hospitais','hotéis','missões','carros','motos','armas','lugares','lojas','rios','ilhas','parques','polícia']
 };
 const phraseAdd={
  es:['auto más rápido','auto con mayor velocidad','auto con mejor aceleración','auto con más asientos','auto más caro','auto más liviano','arma más liviana','arma con más daño','arma con más munición','arma con mayor alcance','arma con silenciador','personaje con pelo largo','personaje empresario','dónde encontrar autos','dónde encontrar armas','dónde encontrar motos','dónde encontrar playas','qué vehículos me faltan','misiones completadas','talleres en vice city','motos más rápidas'],
  en:['fastest car','car with highest speed','car with better acceleration','car with more seats','most expensive car','lightest car','lightest weapon','most powerful weapon','weapon with more ammunition','longest range weapon','weapon with suppressor','character with long hair','business owner character','where to find cars','where to find weapons','where to find motorcycles','where to find beaches','which vehicles am I missing','completed missions','workshops in vice city','fastest motorcycles'],
  pt:['carro mais rápido','carro com maior velocidade','carro com melhor aceleração','carro com mais lugares','carro mais caro','carro mais leve','arma mais leve','arma com mais dano','arma com mais munição','arma com maior alcance','arma com silenciador','personagem com cabelo comprido','personagem empresário','onde encontrar carros','onde encontrar armas','onde encontrar motos','onde encontrar praias','quais veículos estão faltando','missões concluídas','oficinas em vice city','motos mais rápidas']
 };
 const KEY='vi-ios-v241-last-query';
 const last=()=>{try{return localStorage.getItem(KEY)||''}catch{return ''}};
 const remember=query=>{if(query?.trim())try{localStorage.setItem(KEY,query.trim())}catch{}};
 const isMatch=(q,text)=>{
  const s=N(text),words=s.split(' '),tokens=q.split(' ');
  return s.startsWith(q)||tokens.every(word=>words.some(part=>part.startsWith(word)));
 };
 function proposals(query){
  const q=N(query);if(q.length<2)return [];
  const chosen=new Set(),found=[];
  const extras=(phraseAdd[L()]||[]).map(x=>({label:x,priority:0}));
  const old=typeof window.viIosSuggestCandidates==='function'?window.viIosSuggestCandidates(query,L(),35):[];
  for(const x of [...extras,...old]){
   const name=x.label||'',key=N(name);
   if(!key||key===q||chosen.has(key)||!isMatch(q,name))continue;
   chosen.add(key);
   const rank=key.startsWith(q)?0:1;
   found.push({...x,label:name,rank});
  }
  found.sort((a,b)=>a.rank-b.rank||a.priority-b.priority||a.label.length-b.label.length);
  return found.slice(0,6);
 }
 function mapProposals(query){
  const q=N(query);if(q.length<2)return [];
  const all=(geo[L()]||[]).map(x=>({label:x,kind:'topic'}));
  try{for(const p of window.viIosMapNames?.()||[])if(p.name&&p.id)all.push({label:p.name,kind:'pin',id:p.id})}catch{}
  const used=new Set();
  return all.filter(x=>isMatch(q,x.label)).sort((a,b)=>
   (N(a.label).startsWith(q)?0:2)-(N(b.label).startsWith(q)?0:2)||
   (a.kind==='pin'?-1:0)-(b.kind==='pin'?-1:0)||a.label.length-b.label.length
  ).filter(x=>{const k=N(x.label);if(used.has(k))return false;used.add(k);return true}).slice(0,7);
 }
 function host(input){
  if(input.id==='headerSearchInput')return input.closest('.topbar');
  if(input.id==='homeSearchInput')return input.closest('#homeSearchForm');
  if(input.id==='searchInput')return input.closest('.search-box');
  if(input.id==='mapSearchText')return input.closest('.atlas-toolbar');
  return null;
 }
 let current=null,activePanel=null;
 function close(){if(activePanel){activePanel.hidden=true;activePanel.replaceChildren()}activePanel=null;current=null}
 function boxFor(input){
  const parent=host(input);if(!parent)return null;
  let box=parent.nextElementSibling;
  if(!box?.classList?.contains('vi-v241-options')){
   box=document.createElement('section');box.className='vi-ios-autocomplete vi-v241-options';
   parent.insertAdjacentElement('afterend',box);
  }
  box.setAttribute('role','listbox');box.setAttribute('aria-label',strings[L()].phrases);
  return box;
 }
 function title(box,label){const x=document.createElement('div');x.className='vi-v241-group-title';x.textContent=label;box.append(x)}
 function option(box,label,description,action,record=false){
  const b=document.createElement('button');b.type='button';b.className='vi-ios-suggest-option'+(record?' vi-v241-record':'');
  b.setAttribute('role','option');const strong=document.createElement('strong');strong.textContent=label;
  const small=document.createElement('small');small.textContent=description||'';b.append(strong,small);
  b.addEventListener('pointerdown',e=>e.preventDefault());
  b.addEventListener('click',e=>{e.preventDefault();action()});box.append(b);
 }
 let suppress=false;
 function commit(input,label){
  suppress=true;close();input.value=label;input.dispatchEvent(new Event('input',{bubbles:true}));
  if(input.id==='mapSearchText'){input.blur();requestAnimationFrame(()=>suppress=false);return}
  if(input.id==='searchInput'){input.blur();requestAnimationFrame(()=>suppress=false);return}
  const form=input.closest('form');
  form?.requestSubmit?form.requestSubmit():form?.dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));
  input.blur();requestAnimationFrame(()=>suppress=false);
 }
 function show(input){
  if(suppress||!input?.isConnected||!host(input))return;
  const q=input.value.trim(),g=L(),lbl=strings[g];
  const panel=boxFor(input);if(!panel)return;
  if(activePanel&&activePanel!==panel)activePanel.hidden=true;
  activePanel=panel;current=input;panel.replaceChildren();let count=0;
  if(!q&&input.id!=='mapSearchText'&&last()){
   title(panel,lbl.last);option(panel,last(),lbl.last,()=>commit(input,last()));count++;
  }
  if(q.length>=2){
   if(input.id==='mapSearchText'){
    const options=mapProposals(q);
    if(options.length)title(panel,lbl.map);
    for(const x of options){option(panel,x.label,x.kind==='pin'?lbl.place:lbl.related,()=>{if(x.kind==='pin'&&x.id){close();input.blur();window.viIosMapFocusFromSearch?.(x.id)}else commit(input,x.label)});count++}
    const matches=window.viIosMapLiveMatches?.(q,12)||[];
    if(matches.length)title(panel,({es:'Ubicaciones encontradas',en:'Matching locations',pt:'Locais encontrados'})[g]);
    for(const m of matches){option(panel,m.title,m.category,()=>{close();input.blur();window.viIosMapFocusFromSearch?.(m.id)},true);count++}
   }else{
    let cards=[],ranking=null;
    try{
      ranking=window.viIosRankingAvailability?.(q)||null;
      cards=window.viIosSearchCardsFor?.(q,5)||[];
    }catch{}
    // Show an explicit, truthful answer while typing; the same text appears
    // in the descriptive search page when the user submits the query.
    if(ranking&&!ranking.available){
      title(panel,lbl.rankingUnavailable);
      const notice=document.createElement('div');
      notice.className='vi-v244-ranking-notice';
      notice.setAttribute('role','status');
      notice.textContent=ranking.explanation;
      panel.append(notice);count++;
    }
    if(cards.length)title(panel,ranking?lbl.rankingAvailable:lbl.records);
    for(const r of cards){option(panel,r.title,r.category,()=>{
      remember(q);close();input.blur();window.location.hash='#/ficha/'+encodeURIComponent(r.id);
    },true);count++}
    const alternatives=proposals(q);
    if(alternatives.length)title(panel,lbl.phrases);
    for(const x of alternatives){option(panel,x.label,lbl.related,()=>commit(input,x.label));count++}
   }
  }
  panel.hidden=!count;
  input.setAttribute('aria-expanded',String(!!count));
  if(!count){activePanel=null;current=null}
  if(input.id==='mapSearchText')requestAnimationFrame(mapLayout);
 }
 function mapLayout(){
  const map=document.querySelector('#mapApp .atlas-v119.vi-fullscreen-map');
  const field=map?.querySelector('#mapSearchText'),box=map?.querySelector(':scope>.vi-v241-options');
  if(!map||!field||!box||box.hidden)return;
  const outer=map.getBoundingClientRect(),rect=field.getBoundingClientRect();
  const vv=window.visualViewport,bottom=vv?vv.offsetTop+vv.height:innerHeight;
  const top=Math.max(54,Math.round(rect.bottom-outer.top+5));
  const height=Math.max(46,Math.min(220,bottom-rect.bottom-12));
  map.style.setProperty('--v241-map-options-top',top+'px');
  map.style.setProperty('--v241-map-options-height',height+'px');
  map.style.setProperty('--v241-map-results-top',top+height+8+'px');
 }
 const supported=new Set(['headerSearchInput','homeSearchInput','searchInput','mapSearchText']);
 document.addEventListener('input',e=>{if(supported.has(e.target?.id))show(e.target)},false);
 window.viIosMapSuggestionsRefresh=()=>{const el=document.getElementById('mapSearchText');if(el&&el.value.trim().length>=2&&document.activeElement===el)show(el)};
 addEventListener('vi:map-pins-ready',()=>window.viIosMapSuggestionsRefresh?.());
 addEventListener('vi:map-basemap-updated',()=>window.viIosMapSuggestionsRefresh?.());
 document.addEventListener('focusin',e=>{
  if(!supported.has(e.target?.id))return;
  const input=e.target;
  if(last()&&input.value===last()&&input.id!=='mapSearchText')input.value='';
  show(input);
 },true);
 document.addEventListener('focusout',e=>{
  if(!supported.has(e.target?.id))return;
  const input=e.target;
  setTimeout(()=>{if(current===input&&!activePanel?.contains(document.activeElement))close()},180);
 },false);
 document.addEventListener('keydown',e=>{if(e.key==='Escape')close()},true);
 document.addEventListener('click',e=>{
  if(activePanel&&!activePanel.contains(e.target)&&current!==e.target)close();
 },false);
 document.addEventListener('submit',e=>{
  if(!['headerSearchForm','homeSearchForm'].includes(e.target?.id))return;
  const q=e.target.querySelector('input')?.value?.trim();if(!q)return;remember(q);
  requestAnimationFrame(()=>{
   const a=document.getElementById('headerSearchInput');
   if(a&&a!==document.activeElement&&a.value===q)a.value='';
   const b=document.getElementById('homeSearchInput');
   if(b&&b!==document.activeElement&&b.value===q)b.value='';
   close();
  });
 },true);
 function clearIdleHeader(){const el=document.getElementById('headerSearchInput');if(el&&el!==document.activeElement&&last()&&el.value===last())el.value=''}
 // Keep the editor in the visible area, with its bottom near the keyboard.
 let pending=false;
 function markerLayout(){
  clearIdleHeader();mapLayout();
  const editor=document.querySelector('#mapApp .atlas-pin-editor');
  const html=document.documentElement;
  html.classList.toggle('v241-marker-open',!!editor);
  if(!editor){html.classList.remove('v241-marker-keyboard');return}
  const focused=editor.contains(document.activeElement)&&document.activeElement?.matches('input,textarea,select');
  const vv=window.visualViewport;
  const keyboard=!!focused&&(vv?vv.height<innerHeight-85:innerHeight<570);
  html.classList.toggle('v241-marker-keyboard',keyboard);
  const bottom=vv?vv.offsetTop+vv.height:innerHeight;
  const topLimit=Math.max(matchMedia('(orientation:landscape)').matches?18:64,(vv?.offsetTop||0)+10);
  const max=Math.max(150,bottom-topLimit-12);
  html.style.setProperty('--v241-editor-max-height',Math.round(max)+'px');
  const natural=Math.min(editor.scrollHeight||max,max);
  const top=keyboard?Math.max(topLimit,bottom-natural-10):topLimit;
  html.style.setProperty('--v241-editor-top',Math.round(top)+'px');
  if(focused){
   const el=document.activeElement;
   requestAnimationFrame(()=>{if(!editor.isConnected||!editor.contains(el))return;
    const a=el.getBoundingClientRect(),b=editor.getBoundingClientRect();
    if(a.bottom>b.bottom-14)editor.scrollTop+=a.bottom-b.bottom+20;
    else if(a.top<b.top+48)editor.scrollTop-=b.top+48-a.top;
   });
  }
 }
 function queue(){if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;markerLayout()})}
 document.addEventListener('focusin',queue,{capture:true,passive:true});
 document.addEventListener('focusout',queue,{capture:true,passive:true});
 window.visualViewport?.addEventListener('resize',queue,{passive:true});
 window.visualViewport?.addEventListener('scroll',queue,{passive:true});
 window.addEventListener('resize',queue,{passive:true});
 window.addEventListener('hashchange',()=>{close();queue()},{passive:true});
 const root=document.getElementById('root');
 if(root)new MutationObserver(queue).observe(root,{childList:true,subtree:true});
 queue();
})();