/* V161 - Preparatory GTA V-style fields and carefully qualified numeric comparisons.
 * No invented GTA VI data, no persistent changes to maps, favorites or signed catalogs.
 */
(function(root){'use strict';
 const base=root.viDetailEnhancements;if(!base)return;
 const langText={
  es:{title:'Comparar elementos',intro:'Vehículos, armas, propiedades o misiones. Elegí hasta 3 elementos y compará características verificadas.',choose:'Categoría',select:'Elegí un elemento',facts:'Características',missing:'—',need:'Elegí al menos dos elementos diferentes para empezar.',waiting:'Por ahora no hay dos elementos individuales verificados en esta categoría.',section:'Datos técnicos en preparación',explainer:'Campos posibles basados en GTA V: no implica que estas características existan en GTA VI. «—» significa que aún no conocemos el valor.',more:'Comparar elementos',cta:'Elegí dos elementos y compará sus características',green:'Valor más favorable',red:'Valor menos favorable',legend:'Solo se colorean valores numéricos verificados y comparables. Los colores indican la dirección del valor, no cuál elemento es mejor en general.',noStats:'Todavía no hay características verificadas para comparar entre estos elementos.',pending:'Ver campos técnicos pendientes'},
  en:{title:'Compare items',intro:'Vehicles, weapons, properties or missions: compare up to three items, highlighting only verified comparable values.',choose:'Category',select:'Choose an item',facts:'Specifications',missing:'—',need:'Choose at least two different items.',waiting:'Fewer than two verified individual items in this category.',section:'Technical specifications in preparation',explainer:'Potential fields based on GTA V; GTA VI mechanics are not confirmed. «—» means the value is unknown.',more:'Compare items',cta:'Compare items in this category',green:'More favorable value',red:'Less favorable value',legend:'Only compatible verified numeric values are highlighted. Color does not determine which item is best overall.',noStats:'No verified technical attributes are available for these items yet.',pending:'Show pending technical fields'},
  pt:{title:'Comparar itens',intro:'Veículos, armas, imóveis ou missões: compare até três itens com números confirmados e compatíveis.',choose:'Categoria',select:'Escolha um item',facts:'Características',missing:'—',need:'Escolha dois itens diferentes.',waiting:'Há menos de dois itens individuais verificados nesta categoria.',section:'Dados técnicos em preparação',explainer:'Campos possíveis baseados em GTA V; não confirmam mecânicas de GTA VI. «—» indica valor desconhecido.',more:'Comparar itens',cta:'Comparar itens desta categoria',green:'Valor mais favorável',red:'Valor menos favorável',legend:'Somente valores numéricos verificados e comparáveis recebem cores. A cor não determina qual item é melhor em geral.',noStats:'Ainda não há características técnicas verificadas para comparar estes itens.',pending:'Ver campos técnicos pendentes'}
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
 // Supplemental headings for categories that have no numeric comparison model.
 // They use the same responsive spec-grid cells as the Vehicle reference.
 const supplementary={
  personajes:[
   ['alias','Apodos','Aliases','Apelidos','alias','aliases','nickname','nicknames'],
   ['occupation','Ocupación','Occupation','Ocupação','occupation','job','profession','ocupación'],
   ['affiliation','Afiliaciones','Affiliations','Afiliações','affiliation','affiliations','gang','group','organization'],
   ['age','Edad','Age','Idade','age','edad'],
   ['residence','Residencia','Residence','Residência','residence','home','lives in'],
   ['voice','Actor de voz','Voice actor','Dublador','voice','voice actor','portrayed by'],
   ['status','Estado','Status','Situação','status','estado'],
   ['firstappearance','Primera aparición','First appearance','Primeira aparição','first appearance','debut']
  ],
  'mapa-lugares':[
   ['region','Región','Region','Região','region'],
   ['type','Tipo de lugar','Type','Tipo de lugar','type','location type'],
   ['county','Condado','County','Condado','county'],
   ['district','Distrito','District','Distrito','district','neighborhood','area'],
   ['services','Servicios','Services','Serviços','services','amenities'],
   ['activities','Actividades','Activities','Atividades','activities'],
   ['access','Acceso','Access','Acesso','access','availability']
  ],
  actividades:[
   ['type','Tipo','Type','Tipo','type'],
   ['location','Ubicación','Location','Localização','location'],
   ['requirements','Requisitos','Requirements','Requisitos','requirements'],
   ['reward','Recompensas','Rewards','Recompensas','rewards','reward'],
   ['availability','Disponibilidad','Availability','Disponibilidade','availability']
  ],
  mundo:[
   ['type','Tipo','Type','Tipo','type','species'],
   ['region','Región','Region','Região','region','habitat'],
   ['appearance','Aparición','Appearance','Aparição','appearance']
  ],
  economia:[
   ['price','Precio','Price','Preço','price','purchase price'],
   ['type','Tipo','Type','Tipo','type'],
   ['location','Ubicación','Location','Localização','location'],
   ['capacity','Capacidad','Capacity','Capacidade','capacity']
  ],
  coleccionables:[
   ['type','Tipo','Type','Tipo','type'],
   ['count','Cantidad','Count','Quantidade','count','number'],
   ['region','Región','Region','Região','region'],
   ['reward','Recompensa','Reward','Recompensa','reward']
  ],
  secretos:[
   ['type','Tipo','Type','Tipo','type'],
   ['conditions','Condiciones','Conditions','Condições','conditions','requirements'],
   ['region','Zona','Area','Área','area','region']
  ],
  herramientas:[['type','Tipo','Type','Tipo','type']]
 };
 const wikiAliases={
  speed:['top speed','maximum speed','max speed','max. speed','speed','velocidad maxima'],
  accel:['acceleration','0-100 km/h','0 100 km h','0 to 100'],
  seats:['seats','seating','seating capacity','passenger capacity','capacity','passengers'],
  weight:['mass','vehicle weight','curb weight'],
  drive:['drive','drive type','drivetrain','transmission'],
  handling:['handling','handling rating'],
  brake:['braking','brakes','braking rating'],
  fuel:['fuel','fuel capacity','fuel type','range'],
  price:['price','cost','purchase price'],
  damage:['damage'],
  ammo:['ammo','ammunition','ammunition type'],
  rate:['fire rate','rate of fire'],
  reload:['reload time','reload'],
  range:['range'],
  accuracy:['accuracy'],
  capacity:['capacity','magazine size','magazine capacity']
 };
 const keyName=s=>normalize(s).replace(/[_-]+/g,' ').replace(/\s+/g,' ').trim();
 const labelTranslations={
  'colors available':['Colores disponibles','Available colors','Cores disponíveis'],
  'available colors':['Colores disponibles','Available colors','Cores disponíveis'],
  'colour options':['Opciones de color','Color options','Opções de cores'],
  'colours':['Colores','Colors','Cores'],
  'colors':['Colores','Colors','Cores'],
  'color':['Color','Color','Cor'],
  'body style':['Carrocería','Body style','Carroceria'],
  'manufacturer':['Fabricante','Manufacturer','Fabricante'],
  'transmission':['Transmisión','Transmission','Transmissão'],
  'vehicle class':['Clase de vehículo','Vehicle class','Classe de veículo'],
  'variants':['Variantes','Variants','Variantes'],
  'lineup':['Variantes / gama','Lineup','Gama'],
  'price':['Precio','Price','Preço'],
  'capacity':['Capacidad','Capacity','Capacidade'],
  'type':['Tipo','Type','Tipo'],
  'gender':['Género','Gender','Gênero'],
  'occupation':['Ocupación','Occupation','Ocupação'],
  'affiliations':['Afiliaciones','Affiliations','Afiliações'],
  'aka':['También conocido como','Also known as','Também conhecido como'],
  'status':['Estado','Status','Estado'],
  'dob':['Fecha de nacimiento','Date of birth','Data de nascimento'],
  'birth date':['Fecha de nacimiento','Date of birth','Data de nascimento'],
  'voice actor':['Actor de voz','Voice actor','Dublador'],
  'first appearance':['Primera aparición','First appearance','Primeira aparição'],
  'location':['Ubicación','Location','Localização'],
  'county':['Condado','County','Condado'],
  'region':['Región','Region','Região'],
  'district':['Distrito','District','Distrito'],
  'services':['Servicios','Services','Serviços'],
  'activities':['Actividades','Activities','Atividades'],
  'ammunition':['Munición','Ammunition','Munição'],
  'range':['Alcance','Range','Alcance'],
  'firing rate':['Cadencia','Fire rate','Cadência de tiro'],
  'reload speed':['Velocidad de recarga','Reload speed','Velocidade de recarga'],
  'weight':['Peso','Weight','Peso'],
  'fuel':['Combustible','Fuel','Combustível'],
  'seats':['Plazas','Seats','Assentos'],
  'speed':['Velocidad','Speed','Velocidade'],
  'top speed':['Velocidad máxima','Top speed','Velocidade máxima'],
  'performance':['Rendimiento','Performance','Desempenho'],
  'availability':['Disponibilidad','Availability','Disponibilidade']
 };
 const localizedWikiLabel=(wiki,lang)=>{
  const row=labelTranslations[keyName(wiki.key)]||labelTranslations[keyName(wiki.label)];
  return row?row[lang==='en'?1:lang==='pt'?2:0]:(wiki.label||wiki.key);
 };

 const wikiFacts=item=>Array.isArray(item?.wikiSpecs)?item.wikiSpecs.filter(w=>
  w&&typeof w.key==='string'&&typeof w.value==='string'&&w.key.length<=70&&w.value.length<=180&&w.value.length>0):[];
 const sourceBadge=(type,url,conflict=false)=>{
  if(type==='rockstar')return '<span class="vi-spec-origin vi-spec-official">✓ Rockstar</span>'+
    (conflict?'<span class="vi-spec-conflict" title="La ficha comunitaria presenta un valor diferente">≠ Wiki difiere</span>':'');
  if(type==='wiki')return '<a class="vi-spec-origin vi-spec-wiki" href="'+escape(url||'https://gta.wiki')+
    '" target="_blank" rel="noopener noreferrer" title="Dato tomado de GTA Wiki; no confirmado por Rockstar">◇ GTA Wiki ↗</a>';
  return '';
 };
 const simpleRow=(key,es,en,pt,...aliases)=>[key,es,en,pt,null,null,...aliases];
 function specGrid(item,lang){
  const config=fields[item?.category]||(supplementary[item?.category]||[]).map(x=>simpleRow(...x));
  const wiki=wikiFacts(item),official=facts(item),t=langText[lang]||langText.es;
  const usedWiki=new Set(),usedOfficial=new Set(),cells=[];
  const resolveWiki=row=>wiki.find(w=>[row[0],...row.slice(6),...(wikiAliases[row[0]]||[])].some(x=>keyName(x)===keyName(w.key)||keyName(x)===keyName(w.label)))||null;
  const byRow=row=>{
   const original=official.find(f=>row.slice(6).some(k=>keyName(k)===keyName(f.key)))||null;
   if(original)usedOfficial.add(keyName(original.key));
   const derived=resolveWiki(row);
   if(derived)usedWiki.add(keyName(derived.key));
   const approved=original&&!missing(original.value);
   const community=derived&&!missing(derived.value);
   const val=approved?original.value:community?derived.value:'—';
   const source=approved?'rockstar':community?'wiki':null;
   const conflict=!!(approved&&community&&keyName(original.value)!==keyName(derived.value));
   cells.push('<div class="vi-spec-cell'+(val==='—'?' vi-spec-pending':'')+
     (source==='wiki'?' vi-spec-from-wiki':'')+'" data-origin="'+(source||'pending')+'">'+
     '<small>'+escape(row[position(lang)])+'</small><strong>'+escape(val)+'</strong>'+
     sourceBadge(source,item.wikiSourceUrl,conflict)+'</div>');
  };
  for(const row of config)byRow(row);
  for(const fact of official){
   if(usedOfficial.has(keyName(fact.key))||missing(fact.value))continue;
   usedOfficial.add(keyName(fact.key));
   const related=wiki.find(w=>keyName(w.key)===keyName(fact.key));
   if(related)usedWiki.add(keyName(related.key));
   cells.push('<div class="vi-spec-cell" data-origin="rockstar"><small>'+escape(fact.key)+'</small><strong>'+escape(fact.value)+'</strong>'+
    sourceBadge('rockstar',null,!!related&&keyName(related.value)!==keyName(fact.value))+'</div>');
  }
  for(const w of wiki){
   if(usedWiki.has(keyName(w.key))||missing(w.value))continue;
   usedWiki.add(keyName(w.key));
   cells.push('<div class="vi-spec-cell vi-spec-from-wiki" data-origin="wiki"><small>'+escape(localizedWikiLabel(w,lang))+
    '</small><strong>'+escape(w.value)+'</strong>'+sourceBadge('wiki',item.wikiSourceUrl)+'</div>');
  }
  if(!cells.length)return '';
  const explanation=wiki.length
   ?(lang==='en'?'✓ Rockstar = official · ◇ GTA Wiki = community data, not independently confirmed.'
     :lang==='pt'?'✓ Rockstar = oficial · ◇ GTA Wiki = dado comunitário, não confirmado pela Rockstar.'
     :'✓ Rockstar = oficial · ◇ GTA Wiki = dato comunitario, no confirmado por Rockstar.')
   :t.explainer;
  const heading=wiki.length?(lang==='en'?'Features and specifications':lang==='pt'?'Características e especificações':'Características y especificaciones'):t.section;
  return '<section class="vi-spec-panel"><h3>'+escape(heading)+'</h3>'+
   '<p>'+escape(explanation)+'</p><div class="vi-spec-grid">'+cells.join('')+'</div></section>';
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
  const header='<section class="vi-compare-page"><div class="vi-compare-intro"><div class="vi-compare-title"><span class="eyebrow">GAME ATLAS · '+escape(lang==='en'?'COMPARISONS':lang==='pt'?'COMPARAÇÕES':'COMPARATIVAS')+'</span><h1>'+escape(t.title)+'</h1><p>'+escape(t.intro)+'</p><div class="vi-compare-hero-tags"><span>◈ '+escape(categories.vehiculos[lang==='en'?1:lang==='pt'?2:0])+'</span><span>◎ '+escape(categories.armas[lang==='en'?1:lang==='pt'?2:0])+'</span><span>★ '+escape(categories.misiones[lang==='en'?1:lang==='pt'?2:0])+'</span></div></div><div class="vi-compare-art" aria-hidden="true"><span>01</span><strong>⇄</strong><span>02</span></div></div><div class="vi-compare-controls">'+categoryControl+choiceControls+'</div>';
  if(selected.length<2)return header+'<p class="vi-compare-message">'+escape(choices.length<2?t.waiting:t.need)+'</p></section>';

  const cfg=fields[cat]||[],seen=new Set(cfg.flatMap(row=>row.slice(6).map(normalize))),extra=[];
  for(const item of selected)for(const f of facts(item))if(!seen.has(normalize(f.key))){
   seen.add(normalize(f.key));extra.push(['extra',f.key,f.key,f.key,null,null,f.key]);
  }
  const rows=[...cfg,...extra];
  // Keep confirmed information prominent; optional GTA V-inspired headings remain
  // available in the collapsed section without implying GTA VI values exist.
  const available=rows.filter(row=>selected.some(item=>{const f=fieldValue(item,row);return f&&!missing(f.value)}));
  const pending=rows.filter(row=>!available.includes(row));
  const columns=selected.map(item=>'<th scope="col"><a href="#/ficha/'+encodeURIComponent(item.id)+'">'+escape(item.title?.[lang]||item.title?.es)+'</a></th>').join('');
  const tableHead='<thead><tr><th scope="col">'+escape(t.facts)+'</th>'+columns+'</tr></thead>';
  let numericHighlight=false;
  function renderRows(toRender){
   return toRender.map(row=>{
    const score=grades(row,selected);
    if(score.some(Boolean))numericHighlight=true;
    const cols=selected.map((item,i)=>{
     const f=fieldValue(item,row),value=f&&!missing(f.value)?f.value:'—',status=score[i];
     return '<td'+(status?' class="vi-metric-'+status+'"':'')+'><span>'+escape(value)+'</span>'+(status?'<small class="vi-metric-badge">'+escape(status==='better'?t.green:t.red)+'</small>':'')+'</td>';
    }).join('');
    return '<tr><th scope="row">'+escape(row[position(lang)])+'</th>'+cols+'</tr>';
   }).join('');
  }
  let visibleRows=renderRows(available);

  // Derived efficiency for missions: only calculate when BOTH individual source
  // facts are explicitly verified and parse into compatible GTA$ and seconds.
  // Do not display a derived metric when fewer than two missions qualify.
  if(cat==='misiones'){
   const rewardRow=cfg.find(row=>row[0]==='reward'),durationRow=cfg.find(row=>row[0]==='duration');
   const amounts=selected.map(item=>{
    const reward=fieldValue(item,rewardRow),duration=fieldValue(item,durationRow);
    const cash=reward?metricNumber(reward.value,rewardRow):null;
    const seconds=duration?metricNumber(duration.value,durationRow):null;
    return Number.isFinite(cash)&&Number.isFinite(seconds)&&cash>=0&&seconds>0?cash*60/seconds:null;
   });
   const valid=amounts.filter(Number.isFinite);
   if(valid.length>=2){
    const low=Math.min(...valid),high=Math.max(...valid),fmt=new Intl.NumberFormat(lang==='pt'?'pt-BR':lang==='en'?'en-US':'es-AR',{maximumFractionDigits:1});
    const rateLabel=lang==='en'?'Reward per minute':lang==='pt'?'Recompensa por minuto':'Recompensa por minuto';
    const rateNote=lang==='en'?'Calculated from verified mission reward and duration. Not an official Rockstar statistic.':lang==='pt'?'Calculada com recompensa e duração verificadas. Não é uma estatística oficial da Rockstar.':'Calculada a partir de recompensa y duración verificadas. No es una estadística oficial de Rockstar.';
    const cells=amounts.map(value=>{
     const grade=value===null||low===high?null:value===high?'better':value===low?'worse':null;
     if(grade)numericHighlight=true;
     return '<td'+(grade?' class="vi-metric-'+grade+'"':'')+'><span>'+escape(value===null?'—':'GTA$ '+fmt.format(value)+'/min')+'</span>'+(grade?'<small class="vi-metric-badge">'+escape(grade==='better'?t.green:t.red)+'</small>':'')+'</td>';
    }).join('');
    visibleRows+='<tr class="vi-derived-row"><th scope="row">'+escape(rateLabel)+'<small>'+escape(rateNote)+'</small></th>'+cells+'</tr>';
   }
  }
  const legend=numericHighlight?'<div class="vi-compare-legend"><span class="vi-legend-good">● '+escape(t.green)+'</span><span class="vi-legend-bad">● '+escape(t.red)+'</span><small>'+escape(t.legend)+'</small></div>':'';
  const visibleTable=visibleRows?'<div class="vi-compare-scroll"><table>'+tableHead+'<tbody>'+visibleRows+'</tbody></table></div>':'<p class="vi-compare-message vi-compare-no-data">'+escape(t.noStats)+'</p>';
  const pendingTable=pending.length?'<details class="vi-compare-pending"><summary>'+escape(t.pending)+' ('+pending.length+')</summary><p>'+escape(t.explainer)+'</p><div class="vi-compare-scroll"><table>'+tableHead+'<tbody>'+renderRows(pending)+'</tbody></table></div></details>':'';
  const sources=selected.map(item=>{const link=item.sources?.find(src=>/^https:\/\/(?:www\.)?rockstargames\.com\//.test(src.url));return link?'<a href="'+escape(link.url)+'" target="_blank" rel="noopener noreferrer">'+escape(item.title?.[lang]||item.title?.es)+' ↗</a>':''}).join('');
  return header+legend+visibleTable+pendingTable+'<div class="vi-compare-sources">'+sources+'</div></section>';
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
 function comparePickButton(item,lang,mode='pick'){
  if(item?.status!=='verified'||item.recordType==='story_overview'||!fields[item.category])return '';
  const t=cardWording[lang]||cardWording.es;
  const name=item.title?.[lang]||item.title?.es||item.id;
  if(mode==='open'){
   // Home and Mi partida are not a category selection workspace. Take the
   // user straight to the comparator with this individual item preselected.
   return '<a class="vi-compare-pick vi-compare-direct" href="#/comparar?cat='+encodeURIComponent(item.category)+'&ids='+encodeURIComponent(item.id)+'" aria-label="'+escape(t.pick+': '+name)+'">⇄ '+escape(t.pick)+'</a>';
  }
  const active=chosen(item.category).has(item.id);
  const label=active?t.selected:t.pick;
  return '<button type="button" class="vi-compare-pick'+(active?' is-picked':'')+'" data-vi-compare-pick="'+escape(item.id)+'" data-vi-compare-category="'+escape(item.category)+'" data-vi-compare-name="'+escape(name)+'" aria-pressed="'+active+'" aria-label="'+escape(label+': '+name)+'">⇄ '+escape(label)+'</button>';
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

 if(typeof document!=='undefined'&&typeof document.createElement==='function'&&document.head?.appendChild&&!document.getElementById?.('vi-v209-wiki-spec-style')){
  const style=document.createElement('style');
  style.id='vi-v209-wiki-spec-style';
  style.textContent=[
   '#root .vi-spec-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}',
   '#root .vi-spec-cell{min-width:0;overflow-wrap:anywhere;display:flex;flex-direction:column;align-items:flex-start;gap:7px}',
   '#root .vi-spec-cell strong{max-width:100%;white-space:normal;overflow-wrap:anywhere}',
   '#root .vi-spec-origin{display:inline-flex;align-items:center;gap:4px;font-size:.73rem;font-weight:600;max-width:100%;overflow-wrap:anywhere}',
   '#root .vi-spec-official{color:#72d7aa}',
   '#root .vi-spec-wiki{color:#83d7f2;text-decoration:underline;text-underline-offset:2px}',
   '#root .vi-spec-conflict{color:#f6ca79;font-size:.73rem}',
   '#root .vi-spec-from-wiki{border-color:#477e95}',
   '@media(max-width:650px){#root .vi-spec-grid{grid-template-columns:minmax(0,1fr)}}'
  ].join('\n');
  document.head.appendChild(style);
 }
 Object.assign(base,{specGrid,comparePage,compareExplore,grades,metricNumber,fields,comparePickButton});
})(typeof window!=='undefined'?window:globalThis);
