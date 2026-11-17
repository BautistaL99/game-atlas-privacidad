/* Game Atlas iOS V240 — QA of comparisons, data-driven ES/EN/PT typeahead,
 * map popups and stable catalog filters. Only loaded in the iOS repository.
 * Never edits favorites, game saves, map data or verified source metadata. */
(()=>{'use strict';
 /* V247: portable search UI for desktop, mobile web and Android. */
 document.documentElement.classList.add('vi-atlas-v247','vi-ios-v240');
 const route=()=>{try{return decodeURIComponent((location.hash||'').slice(1)).split('?')[0]||'/';}catch{return '/';}};
 const lang=()=>{const value=document.documentElement.lang?.slice(0,2);return ['es','en','pt'].includes(value)?value:'es';};
 const norm=text=>String(text||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
 const wording={
  es:{label:'Sugerencias de búsqueda',item:'Ficha verificada',topic:'Categoría',intent:'Búsqueda relacionada',empty:'Sin coincidencias en el catálogo verificado'},
  en:{label:'Search suggestions',item:'Verified entry',topic:'Category',intent:'Related search',empty:'No matches in the verified catalog'},
  pt:{label:'Sugestões de busca',item:'Ficha verificada',topic:'Categoria',intent:'Busca relacionada',empty:'Sem resultados no catálogo verificado'}
 };
 // Category aliases are just search phrases; no fictional GTA VI facts or coordinates.
 const topics=[
  {cat:'vehiculos',terms:{es:['autos','vehículos','coches','motos','camionetas','camiones'],en:['cars','vehicles','motorcycles','trucks','bikes'],pt:['carros','veículos','motos','caminhonetes','caminhões']}},
  {cat:'armas',terms:{es:['armas','revólveres','pistolas','rifles','municiones'],en:['weapons','revolvers','pistols','rifles','ammunition'],pt:['armas','revólveres','pistolas','rifles','munições']}},
  {cat:'misiones',terms:{es:['misiones','misiones principales','misiones secundarias'],en:['missions','main missions','side missions'],pt:['missões','missões principais','missões secundárias']}},
  {cat:'mapa-lugares',terms:{es:['lugares','regiones','ciudades','playas','talleres','ubicaciones'],en:['places','regions','cities','beaches','workshops','locations'],pt:['lugares','regiões','cidades','praias','oficinas','localizações']}},
  {cat:'economia',terms:{es:['propiedades','negocios','casas','tiendas'],en:['properties','businesses','houses','shops'],pt:['propriedades','negócios','casas','lojas']}},
  {cat:'personajes',terms:{es:['personajes','protagonistas'],en:['characters','protagonists'],pt:['personagens','protagonistas']}},
  {cat:'coleccionables',terms:{es:['coleccionables','objetos','secretos'],en:['collectibles','items','secrets'],pt:['colecionáveis','itens','segredos']}},
  {cat:'actividades',terms:{es:['actividades','carreras','deportes'],en:['activities','races','sports'],pt:['atividades','corridas','esportes']}},
  {cat:'mundo',terms:{es:['mundo','radios','animales'],en:['world','radio stations','animals'],pt:['mundo','rádios','animais']}},
  {cat:'actualizaciones',terms:{es:['noticias','actualizaciones','anuncios'],en:['news','updates','announcements'],pt:['notícias','atualizações','anúncios']}},
  {cat:'secretos',terms:{es:['secretos','easter eggs','misterios'],en:['secrets','easter eggs','mysteries'],pt:['segredos','easter eggs','mistérios']}},
  {cat:'herramientas',terms:{es:['herramientas','comparador','mapa interactivo'],en:['tools','comparator','interactive map'],pt:['ferramentas','comparador','mapa interativo']}}
 ];
 // Descriptive, compositional examples beyond two canned ranking queries.
 // They are query ideas, NOT assertions that GTA VI has a verified stat/value.
 const refinements={
  es:[
   'arma con silenciador','arma con mayor capacidad de cargador','arma con más daño',
   'arma con mejor precisión','arma con mayor alcance','arma con munición especial',
   'arma con accesorios','arma con personalización','armas registradas','armas que me faltan',
   'auto con mayor velocidad','auto con mejor aceleración','auto con cuatro puertas',
   'auto con más asientos','auto con tracción integral','auto con alerón','auto con techo abierto',
   'auto deportivo','auto de lujo','autos que me faltan','autos favoritos',
   'moto deportiva','moto con mayor velocidad','motos registradas',
   'personaje con pelo largo','personaje con pelo negro','personaje con barba',
   'personaje de pelo largo','personaje empresario','personaje protagonista',
   'personajes que me faltan','misiones completadas','misiones pendientes',
   'misiones principales','misiones en vice city','lugares de vice city',
   'regiones de leonida','regiones con ubicaciones verificadas',
   'dónde encontrar talleres','dónde encontrar playas','dónde encontrar vehículos',
   'dónde encontrar armas','dónde encontrar propiedades','qué tengo en mi partida',
   'qué me falta en vehículos','qué me falta en armas','comparar tres vehículos',
   'comparar dos armas','noticias oficiales','noticias verificadas',
   'ubicaciones favoritas','lugares visitados','coleccionables pendientes'
  ],
  en:[
   'weapon with a suppressor','weapon with higher magazine capacity','weapon with most damage',
   'weapon with better accuracy','weapon with longer range','weapon with attachments',
   'weapon with customization','owned weapons','missing weapons',
   'car with highest speed','car with best acceleration','car with four doors',
   'car with more seats','car with all wheel drive','car with a spoiler','car with open roof',
   'sports car','luxury cars','missing cars','favorite cars','sports motorcycle',
   'fastest motorcycle','owned motorcycles','character with long hair',
   'character with dark hair','character with a beard','business owner character',
   'main character','missing characters','completed missions','pending missions',
   'main missions','missions in vice city','places in vice city','leonida regions',
   'where to find workshops','where to find beaches','where to find vehicles',
   'where to find weapons','where to find properties','my game progress',
   'which vehicles am I missing','which weapons am I missing','compare three vehicles',
   'compare two weapons','official news','verified news','favorite locations',
   'visited places','missing collectibles'
  ],
  pt:[
   'arma com silenciador','arma com maior capacidade de munição','arma com mais dano',
   'arma com melhor precisão','arma com maior alcance','arma com acessórios',
   'arma com personalização','armas registradas','armas que faltam',
   'carro com maior velocidade','carro com melhor aceleração','carro com quatro portas',
   'carro com mais lugares','carro com tração integral','carro com aerofólio',
   'carro com teto aberto','carro esportivo','carros de luxo','carros que faltam',
   'carros favoritos','moto esportiva','moto mais rápida','motos registradas',
   'personagem com cabelo comprido','personagem com cabelo preto',
   'personagem com barba','personagem empresário','personagem principal',
   'personagens que faltam','missões concluídas','missões pendentes',
   'missões principais','missões em vice city','lugares de vice city',
   'regiões de leonida','onde encontrar oficinas','onde encontrar praias',
   'onde encontrar veículos','onde encontrar armas','onde encontrar propriedades',
   'meu progresso no jogo','quais veículos estão faltando',
   'quais armas estão faltando','comparar três veículos','comparar duas armas',
   'notícias oficiais','notícias verificadas','locais favoritos',
   'lugares visitados','colecionáveis pendentes'
  ]
 };
 const prefixes={
  es:{find:'dónde encontrar',search:'buscar',show:'mostrar',missing:'qué me falta de',have:'qué tengo de',fav:'mis favoritos de',compare:'comparar'},
  en:{find:'where to find',search:'search',show:'show',missing:'which am I missing from',have:'which do I own from',fav:'my favorite',compare:'compare'},
  pt:{find:'onde encontrar',search:'buscar',show:'mostrar',missing:'o que falta em',have:'o que já tenho em',fav:'meus favoritos de',compare:'comparar'}
 };
 const actionableCategories=new Set(['vehiculos','armas','misiones','economia','mapa-lugares','coleccionables','personajes','actividades']);
 const mappedCategories=new Set(['vehiculos','armas','misiones','mapa-lugares','economia']);
 const comparableCategories=new Set(['vehiculos','armas','misiones','mapa-lugares','economia']);
 function dataIndex(language=lang()){
  const entries=[],seen=new Set(),add=(label,kind,priority=5,category='')=>{
   const key=norm(label);if(key.length<2||seen.has(key))return;
   seen.add(key);entries.push({label,kind,priority,category});
  };
  const t=topics;
  const all=typeof window.viIosSearchItems==='function'?window.viIosSearchItems():[];
  for(const item of all){
   const title=item?.title?.[language]||item?.title?.es||item?.title?.en;
   if(title)add(title,'item',0,item.category);
  }
  // All 3 translations generate real category searches. Suffixes are only
  // used when the underlying category supports the requested action.
  const verbs=prefixes[language];
  for(const topic of t){
   const terms=topic.terms[language]||[];
   for(const term of terms){
    add(term,'topic',1,topic.cat);
    add(verbs.search+' '+term,'intent',3,topic.cat);
    add(verbs.show+' '+term,'intent',4,topic.cat);
    if(mappedCategories.has(topic.cat))add(verbs.find+' '+term,'intent',2,topic.cat);
    if(actionableCategories.has(topic.cat)){
     add(verbs.missing+' '+term,'intent',4,topic.cat);
     add(verbs.have+' '+term,'intent',4,topic.cat);
     add(verbs.fav+' '+term,'intent',5,topic.cat);
    }
    if(comparableCategories.has(topic.cat))add(verbs.compare+' '+term,'intent',5,topic.cat);
   }
  }
  for(const expression of refinements[language]||[])add(expression,'intent',6);
  return entries;
 }
 let indexByLanguage={};
 function isSoftMatch(q,text){
  const wordsQ=q.split(' ').filter(Boolean),words=text.split(' ').filter(Boolean);
  if(!wordsQ.length)return false;
  if(text.includes(q))return true;
  // Every typed word is a prefix of the corresponding word, allowing phrases
  // like 'donde encontrar au' or 'where find ca' without guessing facts.
  if(wordsQ.every((word,i)=>words.slice(i).some(x=>x.startsWith(word))))return true;
  return false;
 }
 function score(q,item){
  const text=norm(item.label);
  if(text===q)return item.priority-2;
  if(text.startsWith(q))return item.priority;
  if(text.split(' ').some(part=>part.startsWith(q)))return item.priority+8;
  if(isSoftMatch(q,text))return item.priority+12;
  return Infinity;
 }
 function suggest(query,language=lang(),max=7){
  const q=norm(query);
  if(q.length<2)return [];
  const choices=indexByLanguage[language]||(indexByLanguage[language]=dataIndex(language));
  return choices.map(item=>({...item,score:score(q,item)})).filter(item=>Number.isFinite(item.score))
    .sort((a,b)=>a.score-b.score||a.label.length-b.label.length||a.label.localeCompare(b.label))
    .slice(0,max);
 }
 // Available for deterministic regression tests; no private account data.
 window.viIosSuggestCandidates=suggest;
 let openPanel=null,currentField=null,suppressDisplay=false;
 const activeIds=new Set(['headerSearchInput','homeSearchInput','searchInput']);
 const hostFor=input=>{
  if(input.id==='headerSearchInput')return input.closest('.topbar');
  if(input.id==='homeSearchInput')return input.closest('#homeSearchForm');
  if(input.id==='searchInput')return input.closest('.search-box');
  return null;
 };
 function panelFor(input){
  const host=hostFor(input);if(!host)return null;
  let panel=host.nextElementSibling;
  if(!panel?.classList?.contains('vi-ios-autocomplete')){
   panel=document.createElement('section');panel.className='vi-ios-autocomplete';
   host.insertAdjacentElement('afterend',panel);
  }
  panel.setAttribute('aria-label',wording[lang()].label);
  return panel;
 }
 const closePanel=()=>{if(openPanel){openPanel.hidden=true;openPanel.replaceChildren();openPanel=null}currentField=null};
 const scheduleResultVisibility=()=>requestAnimationFrame(()=>{if(route()!=='/buscar')return;
  const res=document.getElementById('searchResults'),chips=document.querySelector('.search-chips');
  if(res&&chips&&chips.nextElementSibling!==res)chips.after(res);
  if(res){res.setAttribute('aria-live','polite');res.setAttribute('aria-relevant','additions text');}
 });
 function commitSuggestion(input,candidate){
  suppressDisplay=true;closePanel();
  const value=candidate.label;
  input.value=value;
  input.dispatchEvent(new Event('input',{bubbles:true}));
  input.blur();
  requestAnimationFrame(()=>{suppressDisplay=false;});
  if(input.id==='headerSearchInput'){
   const form=input.closest('#headerSearchForm');
   if(form?.requestSubmit)form.requestSubmit();
   else form?.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
  }else if(input.id==='homeSearchInput'){
   const form=input.closest('#homeSearchForm');
   if(form?.requestSubmit)form.requestSubmit();
   else form?.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
  }else scheduleResultVisibility();
 }
 function show(input){
  // V241 owns the unified native suggestions; avoid competing panels.
  if(window.viIosV241Enabled)return;
  if(suppressDisplay||!activeIds.has(input?.id)||!input?.isConnected)return;
  currentField=input;
  const data=suggest(input.value,lang());
  if(!data.length){closePanel();return}
  const panel=panelFor(input);if(!panel)return;
  if(openPanel&&openPanel!==panel)openPanel.hidden=true;
  openPanel=panel;panel.replaceChildren();panel.hidden=false;
  const title=document.createElement('div');title.className='vi-ios-suggest-title';title.textContent=wording[lang()].label;
  panel.append(title);
  for(const candidate of data){
   const button=document.createElement('button');button.type='button';button.className='vi-ios-suggest-option';
   const strong=document.createElement('strong');strong.textContent=candidate.label;
   const note=document.createElement('small');note.textContent=wording[lang()][candidate.kind]||wording[lang()].intent;
   button.append(strong,note);
   button.addEventListener('pointerdown',e=>e.preventDefault());
   button.addEventListener('click',e=>{e.preventDefault();commitSuggestion(input,candidate)});
   panel.append(button);
  }
 }
 document.addEventListener('input',e=>{if(activeIds.has(e.target?.id)){show(e.target);scheduleResultVisibility();}},false);
 document.addEventListener('focusin',e=>{if(activeIds.has(e.target?.id))show(e.target);},false);
 document.addEventListener('focusout',e=>{
  if(!activeIds.has(e.target?.id))return;
  const input=e.target;
  setTimeout(()=>{if(currentField===input&&!openPanel?.contains(document.activeElement))closePanel()},170);
 },false);
 document.addEventListener('keydown',e=>{if(e.key==='Escape')closePanel();},false);
 document.addEventListener('click',e=>{
  if(openPanel&&!openPanel.contains(e.target)&&e.target!==currentField)closePanel();
 },false);
 // Compare forward navigation uses pushState. Reject a late synthetic tap
 // landing on the bottom Explore tab while the catalog DOM has changed.
 document.addEventListener('click',e=>{
  if(Date.now()<Number(window.viIosCompareNavLockUntil||0)
     &&e.target?.closest?.('.bottom-nav a[href="#/explorar"]')){
   e.preventDefault();e.stopImmediatePropagation();
  }
 },true);
 // Same category, new progress filter: refresh content without jumping to top.
 document.addEventListener('click',e=>{
  const a=e.target?.closest?.('.filter-tabs a.filter-tab[href^="#/explorar/"]');
  if(!a||!route().startsWith('/explorar/'))return;
  const target=a.getAttribute('href');if(!target)return;
  if(decodeURIComponent(target.slice(1)).split('?')[0]!==route())return;
  e.preventDefault();if(location.hash===target)return;
  const anchor=document.querySelector('.filter-tabs'),before=anchor?.getBoundingClientRect().top||0;
  const oldY=scrollY;
  history.replaceState(history.state,'',target);
  window.viRefreshApp?.();
  const restore=()=>{const node=document.querySelector('.filter-tabs');
   scrollTo({top:Math.max(0,oldY+(node?.getBoundingClientRect().top||0)-before),behavior:'instant'});
  };restore();requestAnimationFrame(restore);
 },true);
 // Popup must stay above the on-map zoom/action toolbar, with filters free.
 // On devices where controls move (portrait/landscape), measure the *real* space.
 function positionPopup(){
  const map=document.querySelector('#mapApp .atlas-v119:not(.vi-fullscreen-map) #mapCanvas');
  const popup=map?.querySelector(':scope > .atlas-popup');
  if(!map||!popup)return;
  const mr=map.getBoundingClientRect();let reserved=72;
  for(const el of map.querySelectorAll(':scope > .atlas-controls,:scope > .vi-map-zoom-toolbar,:scope > .atlas-mobile-controls')){
   const r=el.getBoundingClientRect();
   if(r.width&&r.height&&r.top>mr.top+mr.height*.55&&r.top<mr.bottom){
    reserved=Math.max(reserved,Math.ceil(mr.bottom-r.top+12));
   }
  }
  const topControls=map.querySelector('.vi-map-filter-chips');const r=topControls?.getBoundingClientRect();
  const available=Math.max(128,Math.floor(mr.height-reserved-(r?r.bottom-mr.top+12:86)-12));
  popup.style.setProperty('bottom',reserved+'px','important');
  popup.style.setProperty('max-height',Math.min(280,available)+'px','important');
 }
 let queued=false;
 const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{
  queued=false;positionPopup();if(route()==='/buscar')scheduleResultVisibility();
 })};
 const root=document.getElementById('root');
 if(root)new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
 addEventListener('resize',schedule,{passive:true});
 addEventListener('hashchange',()=>{closePanel();schedule();},{passive:true});
 schedule();
})();
