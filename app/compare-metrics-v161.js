/* V161 - Preparatory GTA V-style fields and carefully qualified numeric comparisons.
 * No invented GTA VI data, no persistent changes to maps, favorites or signed catalogs.
 */
(function(root){'use strict';
 const base=root.viDetailEnhancements;if(!base)return;
 const langText={
  es:{title:'Comparar elementos',intro:'Velocidad, armas, propiedades o misiones. Elegí hasta 3 elementos: destacamos únicamente cifras verificadas y comparables.',choose:'Categoría',select:'Elegí un elemento',facts:'Características',missing:'—',need:'Elegí al menos dos elementos diferentes para empezar.',waiting:'Por ahora no hay dos elementos individuales verificadas en esta categoría.',section:'Datos técnicos en preparación',explainer:'Campos posibles basados en GTA V: no implica que estas características existan en GTA VI. «—» significa que aún no conocemos el valor.',more:'Comparar elementos',cta:'Elegí dos elementos y compará sus características',green:'Valor más favorable',red:'Valor menos favorable',legend:'Solo se colorean valores numéricos con unidades y criterios compatibles. Menor peso o menor duración son criterios orientativos, no prueban una calidad superior.'},
  en:{title:'Compare items',intro:'Cars, weapons, properties or missions: compare up to three entries, with highlights only for verified compatible values.',choose:'Category',select:'Choose an item',facts:'Specifications',missing:'—',need:'Choose at least two different entries.',waiting:'Fewer than two verified individual entries in this category.',section:'Technical specifications in preparation',explainer:'Potential fields based on GTA V; GTA VI mechanics are not confirmed. «—» means the value is unknown.',more:'Compare items',cta:'Compare items in this category',green:'More favorable value',red:'Less favorable value',legend:'Only compatible verified numeric values are highlighted. Lower weight or duration is indicative and does not prove overall quality.'},
  pt:{title:'Comparar elementos',intro:'Veículos, armas, imóveis ou missões: compare até três itens com números confirmados e compatíveis.',choose:'Categoria',select:'Escolha uma ficha',facts:'Características',missing:'—',need:'Escolha duas elementos diferentes.',waiting:'Há menos de duas fichas individuais verificadas nesta categoria.',section:'Ficha técnica em preparação',explainer:'Campos possíveis baseados em GTA V; não confirmam mecânicas de GTA VI. «—» indica valor desconhecido.',more:'Comparar elementos',cta:'Comparar elementos desta categoria',green:'Valor mais favorável',red:'Valor menos favorável',legend:'Somente valores numéricos verificados e compatíveis são coloridos. Menor peso/duração não garante qualidade superior.'}
 };
 const categories={
  vehiculos:['Vehículos','Vehicles','Veículos'],armas:['Armas','Weapons','Armas'],
  economia:['Propiedades y negocios','Properties and businesses','Propriedades e negócios'],
  'mapa-lugares':['Lugares y edificios','Places and buildings','Lugares e edifícios'],
  misiones:['Misiones','Missions','Missões']
 };
 // [key, ES, EN, PT, comparison direction, expected unit, recognized source labels...].
 // Values never come from GTA V: these are headings only.
 const fields={
  vehiculos:[
   ['speed','Velocidad máxima','Top speed','Velocidade máxima','max','speed','velocidad máxima','velocidad maxima','velocidad','top speed'],
   ['accel','Aceleración 0–100 km/h','0–100 km/h acceleration','Aceleração 0–100 km/h','min','duration','aceleración 0–100 km/h','aceleracion 0-100 km/h','0-100 km/h'],
   ['weight','Peso','Weight','Peso','min','weight','peso','weight'],
   ['seats','Plazas','Seats','Lugares','max','count','plazas','asientos','seats','capacidad de pasajeros'],
   ['handling','Manejo','Handling','Manobrabilidade',null,null,'manejo','handling'],
   ['brake','Frenado','Braking','Frenagem',null,null,'frenado','braking'],
   ['drive','Tracción','Drivetrain','Tração',null,null,'tracción','traccion','drivetrain'],
   ['price','Precio','Price','Preço',null,null,'precio','price'],
   ['fuel','Combustible / autonomía','Fuel / range','Combustível / autonomia',null,null,'combustible','autonomía','autonomia','fuel']
  ],
  armas:[
   ['damage','Daño','Damage','Dano',null,null,'daño','dano','damage'],
   ['capacity','Balas por cargador','Magazine capacity','Balas por carregador','max','count','balas por cargador','capacidad del cargador','cargador','magazine capacity'],
   ['reload','Tiempo de recarga','Reload time','Tempo de recarga','min','duration','tiempo de recarga','recarga','reload time'],
   ['rate','Cadencia de disparo','Fire rate','Cadência de tiro',null,null,'cadencia','cadencia de disparo','fire rate'],
   ['range','Alcance','Range','Alcance',null,null,'alcance','range'],
   ['accuracy','Precisión','Accuracy','Precisão',null,null,'precisión','precision','accuracy'],
   ['ammo','Tipo de munición','Ammo type','Tipo de munição',null,null,'munición','municion','tipo de munición','tipo de municion'],
   ['price','Precio','Price','Preço',null,null,'precio','price']
  ],
  economia:[
   ['price','Precio de compra','Purchase price','Preço de compra',null,null,'precio de compra','precio','purchase price'],
   ['type','Tipo de propiedad','Property type','Tipo de propriedade',null,null,'tipo de propiedad','tipo','property type'],
   ['income','Ingresos periódicos','Recurring income','Renda periódica',null,null,'ingresos','ingresos periódicos','recurring income'],
   ['garage','Plazas de garaje','Garage capacity','Vagas de garagem',null,null,'capacidad de garaje','plazas de garaje','garage capacity'],
   ['upgrade','Mejoras disponibles','Available upgrades','Melhorias disponíveis',null,null,'mejoras','mejoras disponibles','upgrades'],
   ['location','Ubicación','Location','Localização',null,null,'ubicación','ubicacion','location']
  ],
  'mapa-lugares':[
   ['region','Región','Region','Região',null,null,'región','region'],
   ['type','Tipo de lugar','Location type','Tipo de local',null,null,'tipo de lugar','tipo','type'],
   ['area','Distrito / zona','District / area','Distrito / área',null,null,'distrito','zona','district'],
   ['activities','Actividades','Activities','Atividades',null,null,'actividades','activities'],
   ['services','Servicios','Services','Serviços',null,null,'servicios','services']
  ],
  misiones:[
   ['duration','Duración media','Average duration','Duração média','min','duration','duración media','duracion media','duración','duracion','average duration','tiempo medio'],
   ['reward','Recompensa monetaria','Cash reward','Recompensa em dinheiro','max','money','recompensa monetaria','recompensa','cash reward','pago'],
   ['requirements','Requisitos','Requirements','Requisitos',null,null,'requisitos','requirements'],
   ['start','Zona de inicio','Starting area','Área inicial',null,null,'zona de inicio','ubicación de inicio','starting area'],
   ['difficulty','Dificultad','Difficulty','Dificuldade',null,null,'dificultad','difficulty'],
   ['character','Personaje','Character','Personagem',null,null,'personaje','character']
  ]
 };
 const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const normalize=s=>String(s||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ');
 const missing=s=>!s||/^(?:—|-|n\/a|no publicado|no publicada|no disponible|sin datos|desconocido|pendiente|a[uú]n sin verificar|todav[ií]a no publicad[oa]|no confirmad[oa])$/i.test(String(s).trim());
 const position=lang=>lang==='en'?2:lang==='pt'?3:1;
 const facts=item=>Array.isArray(item?.facts)?item.facts.filter(f=>f?.verified===true&&f.key&&f.value):[];
 const fieldValue=(item,row)=>facts(item).find(f=>row.slice(6).some(k=>normalize(k)===normalize(f.key)))||null;
 function specGrid(item,lang){
  const config=fields[item?.category];if(!config)return '';
  const t=langText[lang]||langText.es,used=new Set();
  const slots=config.map(row=>{
   const fact=fieldValue(item,row);if(fact)used.add(normalize(fact.key));
   const value=fact&&!missing(fact.value)?fact.value:'—';
   return '<div class="vi-spec-cell'+(value==='—'?' vi-spec-pending':'')+'"><small>'+escape(row[position(lang)])+'</small><strong>'+escape(value)+'</strong></div>';
  }).join('');
  const extras=facts(item).filter(f=>!used.has(normalize(f.key))).map(f=>
   '<div class="vi-spec-cell"><small>'+escape(f.key)+'</small><strong>'+escape(missing(f.value)?'—':f.value)+'</strong></div>').join('');
  return '<section class="vi-spec-panel"><h3>'+escape(t.section)+'</h3><p>'+escape(t.explainer)+'</p><div class="vi-spec-grid">'+slots+extras+'</div></section>';
 }
 function metricNumber(raw,row){
  if(!row[4]||missing(raw))return null;
  const v=String(raw).trim().replace(/\u00a0/g,' '),unit=row[5];let match;
  if(unit==='speed'){
   match=/^(\d+(?:[.,]\d+)?)\s*(km\/h|mph)$/i.exec(v);
   return match?Number(match[1].replace(',','.'))*(match[2].toLowerCase()==='mph'?1.609344:1):null;
  }
  if(unit==='weight'){
   match=/^(\d+(?:[.,]\d+)?)\s*(kg|t|toneladas?)$/i.exec(v);
   return match?Number(match[1].replace(',','.'))*(match[2].toLowerCase()==='kg'?1:1000):null;
  }
  if(unit==='duration'){
   match=/^(\d+(?:[.,]\d+)?)\s*(s|seg|segundos?|min|mins?|minutos?|h|horas?)$/i.exec(v);
   if(!match)return null;
   const number=Number(match[1].replace(',','.')),type=match[2].toLowerCase();
   return /^h|^hora/.test(type)?number*3600:/^m/.test(type)?number*60:number;
  }
  if(unit==='count'){
   match=/^(\d{1,4})(?:\s*(?:balas|cartuchos|asientos|plazas|tiros|rounds))?$/i.exec(v);
   return match?Number(match[1]):null;
  }
  if(unit==='money'){
   match=/^(?:GTA\s*)?\$\s*(\d{1,3}(?:[.,]\d{3})*|\d+)$/i.exec(v);
   return match?Number(match[1].replace(/[.,]/g,'')):null;
  }
  return null;
 }
 function grades(row,items){
  const nums=items.map(item=>{const fact=fieldValue(item,row);return fact?metricNumber(fact.value,row):null;});
  const valid=nums.filter(Number.isFinite);
  if(valid.length<2||Math.max(...valid)===Math.min(...valid))return nums.map(()=>null);
  const high=Math.max(...valid),low=Math.min(...valid);
  return nums.map(v=>v===null?null:v===(row[4]==='max'?high:low)?'better':v===(row[4]==='max'?low:high)?'worse':null);
 }
 function comparePage(records,lang){
  const t=langText[lang]||langText.es,state=base.state(records),cat=state.cat,selected=state.selected;
  const choices=state.choices;
  const categoryControl='<label>'+escape(t.choose)+'<select data-vi-compare-cat>'+Object.keys(categories).map(key=>
   '<option value="'+key+'"'+(key===cat?' selected':'')+'>'+escape(categories[key][lang==='en'?1:lang==='pt'?2:0])+'</option>').join('')+'</select></label>';
  const choiceControls=[0,1,2].map(i=>'<label>'+(i+1)+'. '+escape(t.select)+'<select data-vi-compare-slot="'+i+'"><option value="">—</option>'+choices.map(item=>
   '<option value="'+escape(item.id)+'"'+(item.id===state.ids[i]?' selected':'')+'>'+escape(item.title?.[lang]||item.title?.es)+'</option>').join('')+'</select></label>').join('');
  const header='<section class="vi-compare-page"><div class="vi-compare-intro"><div class="vi-compare-title"><span class="eyebrow">GAME ATLAS · COMPARATIVAS</span><h1>'+escape(t.title)+'</h1><p>'+escape(t.intro)+'</p><div class="vi-compare-hero-tags"><span>◈ '+escape(categories.vehiculos[0])+'</span><span>◎ '+escape(categories.armas[0])+'</span><span>★ '+escape(categories.misiones[0])+'</span></div></div><div class="vi-compare-art" aria-hidden="true"><span>01</span><strong>⇄</strong><span>02</span></div></div><div class="vi-compare-controls">'+categoryControl+choiceControls+'</div>';
  if(selected.length<2)return header+'<p class="vi-compare-message">'+escape(choices.length<2?t.waiting:t.need)+'</p></section>';
  const cfg=fields[cat]||[],seen=new Set(cfg.flatMap(row=>row.slice(6).map(normalize))),extra=[];
  for(const item of selected)for(const f of facts(item))if(!seen.has(normalize(f.key))){
   seen.add(normalize(f.key));extra.push(['extra',f.key,f.key,f.key,null,null,f.key]);
  }
  const columns=selected.map(item=>'<th scope="col"><a href="#/ficha/'+encodeURIComponent(item.id)+'">'+escape(item.title?.[lang]||item.title?.es)+'</a></th>').join('');
  const tableRows=[...cfg,...extra].map(row=>{
   const score=grades(row,selected);
   const cols=selected.map((item,i)=>{
    const f=fieldValue(item,row),value=f&&!missing(f.value)?f.value:'—',status=score[i];
    return '<td'+(status?' class="vi-metric-'+status+'"':'')+'><span>'+escape(value)+'</span>'+(status?'<small class="vi-metric-badge">'+escape(status==='better'?t.green:t.red)+'</small>':'')+'</td>';
   }).join('');
   return '<tr><th scope="row">'+escape(row[position(lang)])+'</th>'+cols+'</tr>';
  }).join('');
  const legend='<div class="vi-compare-legend"><span class="vi-legend-good">● '+escape(t.green)+'</span><span class="vi-legend-bad">● '+escape(t.red)+'</span><small>'+escape(t.legend)+'</small></div>';
  const sources=selected.map(item=>{const link=item.sources?.find(src=>/^https:\/\/(?:www\.)?rockstargames\.com\//.test(src.url));return link?'<a href="'+escape(link.url)+'" target="_blank" rel="noopener noreferrer">'+escape(item.title?.[lang]||item.title?.es)+' ↗</a>':''}).join('');
  return header+legend+'<div class="vi-compare-scroll"><table><thead><tr><th scope="col">'+escape(t.facts)+'</th>'+columns+'</tr></thead><tbody>'+tableRows+'</tbody></table></div><div class="vi-compare-sources">'+sources+'</div></section>';
 }
 function compareExplore(cat,lang,records){
  if(!fields[cat])return '';
  const t=cardWording[lang]||cardWording.es;
  const ids=[...chosen(cat).keys()].slice(0,3),ready=ids.length>=2;
  const href=ready?' href="#/comparar?cat='+encodeURIComponent(cat)+'&ids='+encodeURIComponent(ids.join(','))+'"':'';
  const disabled=ready?' aria-disabled="false"':' aria-disabled="true" tabindex="-1"';
  return '<aside class="vi-explore-compare vi-compare-bar" aria-label="'+escape(t.title)+'">'
   +'<div class="vi-compare-bar-title"><span aria-hidden="true">⇄</span><strong>'+escape(t.title)+'</strong></div>'
   +'<span class="vi-compare-count" data-vi-compare-count aria-live="polite">'+ids.length+'/3 '+escape(t.count)+'</span>'
   +'<a class="vi-compare-bar-cta" data-vi-compare-open'+href+disabled+'>'+escape(t.go)+' ↗</a>'
   +'</aside>';
 }

 // Quick compare from category cards. Ephemeral UI state only: never touches
 // favorites, progress, signed catalogs or stored user data.
 const chosenByCategory=new Map();
 const cardWording={
  es:{title:'Comparar elementos',pick:'Comparar',selected:'Seleccionado',count:'seleccionados',go:'Comparar'},
  en:{title:'Compare items',pick:'Compare',selected:'Selected',count:'selected',go:'Compare'},
  pt:{title:'Comparar itens',pick:'Comparar',selected:'Selecionado',count:'selecionados',go:'Comparar'}
 };
 const getLanguage=()=>['es','en','pt'].includes(document.documentElement.lang)?document.documentElement.lang:'es';
 const activeCategory=()=>{const match=/^#\/explorar\/([^?]+)/.exec(root.location.hash||'');return match?decodeURIComponent(match[1]):null};
 const chosen=cat=>{if(!chosenByCategory.has(cat))chosenByCategory.set(cat,new Map());return chosenByCategory.get(cat)};
 const pickText=(lang,active)=>{const t=cardWording[lang]||cardWording.es;return active?t.selected:t.pick};
 function comparePickButton(item,lang){
  if(item?.status!=='verified'||item.recordType==='story_overview'||!fields[item.category])return '';
  const t=cardWording[lang]||cardWording.es;
  const active=chosen(item.category).has(item.id);
  const label=active?t.selected:t.pick;
  return '<button type="button" class="vi-compare-pick'+(active?' is-picked':'')+'" data-vi-compare-pick="'+escape(item.id)+'" data-vi-compare-category="'+escape(item.category)+'" data-vi-compare-name="'+escape(item.title?.[lang]||item.title?.es||item.id)+'" aria-pressed="'+active+'" aria-label="'+escape(label+': '+(item.title?.[lang]||item.title?.es||item.id))+'">⇄ '+escape(label)+'</button>';
 }
 function syncPickButtons(){
  if(typeof document==='undefined')return;
  const lang=getLanguage();
  for(const button of document.querySelectorAll('[data-vi-compare-pick]')){
   const active=chosen(button.dataset.viCompareCategory).has(button.dataset.viComparePick);
   button.classList.toggle('is-picked',active);
   button.setAttribute('aria-pressed',String(active));
   button.textContent='⇄ '+pickText(lang,active);
   button.setAttribute('aria-label',pickText(lang,active)+': '+(button.dataset.viCompareName||''));
  }
 }
 function syncCompareBar(){
  if(typeof document==='undefined')return;
  // The bar lives in Explorar; selection changes never rerender or navigate.
  document.getElementById('vi-compare-pick-tray')?.remove();
  const cat=activeCategory();
  const bar=document.querySelector('.vi-compare-bar');
  if(!bar||!cat||!fields[cat])return;
  const ids=[...chosen(cat).keys()].slice(0,3),ready=ids.length>=2;
  const t=cardWording[getLanguage()]||cardWording.es;
  const counter=bar.querySelector('[data-vi-compare-count]');
  if(counter)counter.textContent=ids.length+'/3 '+t.count;
  const button=bar.querySelector('[data-vi-compare-open]');
  if(!button)return;
  if(ready){
   button.setAttribute('href','#/comparar?cat='+encodeURIComponent(cat)+'&ids='+encodeURIComponent(ids.join(',')));
   button.setAttribute('aria-disabled','false');
   button.removeAttribute('tabindex');
  }else{
   button.removeAttribute('href');
   button.setAttribute('aria-disabled','true');
   button.setAttribute('tabindex','-1');
  }
 }
 if(typeof document!=='undefined'){
  document.addEventListener('click',event=>{
   const pick=event.target.closest?.('[data-vi-compare-pick]');
   if(pick){
    event.preventDefault();event.stopPropagation();
    const cat=pick.dataset.viCompareCategory,id=pick.dataset.viComparePick;
    if(!fields[cat]||!id||cat!==activeCategory())return;
    const list=chosen(cat);
    if(list.has(id))list.delete(id);
    else if(list.size<3)list.set(id,pick.dataset.viCompareName||id);
    syncPickButtons();syncCompareBar();return;
   }
   if(event.target.closest?.('[data-vi-compare-clear]')){
    event.preventDefault();
    const cat=activeCategory();if(cat)chosen(cat).clear();
    syncPickButtons();syncCompareBar();return;
   }
  });
  root.addEventListener('hashchange',()=>root.requestAnimationFrame(()=>{syncPickButtons();syncCompareBar()}));
 }

 Object.assign(base,{specGrid,comparePage,compareExplore,grades,metricNumber,fields,comparePickButton});
})(typeof window!=='undefined'?window:globalThis);
