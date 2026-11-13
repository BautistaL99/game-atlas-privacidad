/* V220 signed Wiki facts internationalization.
 * Bound per scheduled run: incremental, source-bound, no user data or UI writes.
 * Preserve source language, source revision and prior successful translations.
 * Never publish an English-only fact under the Spanish/Portuguese label.
 */
const LANGS=['es','en','pt'];
const SAFE=x=>typeof x==='string'&&x.trim().length>0&&x.length<=190&&!/[<>\x00-\x1f]/.test(x);
const KEY_NAMES={
 'type':['Tipo','Type','Tipo'],'body style':['Carrocería','Body style','Carroceria'],
 'manufacturer':['Fabricante','Manufacturer','Fabricante'],'gender':['Género','Gender','Gênero'],
 'voice':['Voz','Voice','Voz'],'affiliations':['Afiliaciones','Affiliations','Afiliações'],
 'home':['Residencia','Home','Residência'],'status':['Estado','Status','Estado'],
 'occupation':['Ocupación','Occupation','Ocupação'],'variants':['Variantes','Variants','Variantes'],
 'spawn traffic':['Aparición en tráfico','Traffic spawns','Aparição no trânsito'],
 'spawn cargen':['Generación del vehículo','Vehicle spawns','Geração de veículo'],
 'spawn scenarios':['Escenarios de aparición','Spawn scenarios','Cenários de aparição'],
 'spawn specific':['Apariciones específicas','Specific spawns','Aparições específicas'],
 'lineup':['Gama','Lineup','Linha'],'basevariant':['Variante base','Base variant','Variante base'],
 'purpose':['Propósito','Purpose','Finalidade'],'slot':['Ranura','Slot','Posição'],
 'spawn':['Aparición','Spawn','Aparição'],'vehicles':['Vehículos','Vehicles','Veículos'],
 'aka':['También conocido como','Also known as','Também conhecido como'],
 'spawnmap':['Mapa de apariciones','Spawn map','Mapa de aparições'],
 'dob':['Fecha de nacimiento','Date of birth','Data de nascimento'],
 'firemode':['Modo de disparo','Fire mode','Modo de disparo'],
 'nationality':['Nacionalidad','Nationality','Nacionalidade'],
 'reticle':['Retícula','Reticle','Retícula'],'make year':['Año de fabricación','Year made','Ano de fabricação'],
 'related':['Relacionado','Related','Relacionado'],'anim':['Animación','Animation','Animação'],
 'pob':['Lugar de nacimiento','Place of birth','Local de nascimento'],
 'sold in':['Disponible en','Sold in','Vendido em'],'price':['Precio','Price','Preço'],
 'weapon style':['Tipo de arma','Weapon style','Tipo de arma'],
 'games':['Juegos','Games','Jogos'],'ammo':['Munición','Ammunition','Munição'],
 'modelname':['Nombre del modelo','Model name','Nome do modelo'],
 'unlock':['Desbloqueo','Unlock','Desbloqueio'],
 'trade price':['Precio de intercambio','Trade price','Preço de troca'],
 'dod':['Fecha de fallecimiento','Date of death','Data de falecimento']
};
const VALUES={
 'yes':['Sí','Yes','Sim'],'no':['No','No','Não'],
 'unknown':['Desconocido','Unknown','Desconhecido'],
 'alive':['Vivo','Alive','Vivo'],'active':['Activo','Active','Ativo'],
 'dead':['Fallecido','Dead','Falecido'],
 'm':['Masculino','Male','Masculino'],'f':['Femenino','Female','Feminino'],
 'none':['Ninguno','None','Nenhum'],
 'throwable':['Arrojadiza','Throwable','Arremessável'],
 'melee':['Cuerpo a cuerpo','Melee','Corpo a corpo'],
 'law enforcement vehicle':['Vehículo policial','Law enforcement vehicle','Veículo policial'],
 'tv show character':['Personaje televisivo','TV show character','Personagem de série de TV'],
 '4-door sedan':['Sedán de 4 puertas','4-door sedan','Sedã de 4 portas'],
 '4-door suv':['SUV de 4 puertas','4-door SUV','SUV de 4 portas'],
 '4-door pickup':['Camioneta de 4 puertas','4-door pickup','Caminhonete de 4 portas'],
 'motorboat':['Lancha a motor','Motorboat','Lancha a motor'],
 'streetbike':['Motocicleta de calle','Streetbike','Motocicleta de rua'],
 'golf cart':['Carrito de golf','Golf cart','Carrinho de golfe'],
 'crew cab pickup truck':['Camioneta de doble cabina','Crew cab pickup truck','Caminhonete de cabine dupla'],
 'lighttruck':['Camión ligero','Light truck','Caminhão leve'],
 'heavytruck':['Camión pesado','Heavy truck','Caminhão pesado'],
 'fullsize':['Tamaño completo','Full size','Tamanho grande'],
 'singleheli':['Helicóptero','Helicopter','Helicóptero'],
 'sports':['Deportivo','Sports','Esportivo'],
 'buggy':['Buggy','Buggy','Buggy']
};
function langs(v){return {es:v[0],en:v[1],pt:v[2]}}
function special(value,mode){
 const v=value.trim(),key=v.toLowerCase();
 if(!SAFE(v))return null;
 if(mode==='label'&&KEY_NAMES[key])return langs(KEY_NAMES[key]);
 if(mode==='value'&&VALUES[key])return langs(VALUES[key]);
 if(/^[\d\s.,+/%$€£:-]+$/.test(v))return {es:v,en:v,pt:v};
 // A name (not a descriptive phrase) is unchanged in all three languages.
 if(mode==='value'&&/^[A-Z][\p{L}\p{N}'-]*(?:\s+[A-Z][\p{L}\p{N}'-]*){0,3}$/u.test(v)&&
    !/\b(?:County|City|Vehicle|Weapon|Truck|Sedan|Character|Street|Boat|Road)\b/i.test(v))
   return {es:v,en:v,pt:v};
 return null;
}
async function translateRemote(en,lang,fetchFn){
 const q=new URLSearchParams({q:en,langpair:'en|'+(lang==='pt'?'pt-BR':'es'),mt:'1'});
 const response=await fetchFn('https://api.mymemory.translated.net/get?'+q,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(16000)});
 if(!response.ok)throw Error('Translation service '+response.status);
 const raw=await response.text();
 if(raw.length>50000)throw Error('Translation reply too large');
 const answer=JSON.parse(raw),value=answer?.responseData?.translatedText?.trim();
 if(Number(answer.responseStatus)!==200||!SAFE(value)||/translation quota|invalid request|warning|rate limit/i.test(value))
  throw Error('Untrusted translation response');
 if((en.match(/\d+/g)||[]).some(n=>!value.includes(n)))throw Error('Translation lost numerical fact');
 if(value.toLocaleLowerCase()===en.toLocaleLowerCase()&&en.trim().split(/\s+/).length>1)
  throw Error('Description not translated; retry later instead of mislabeling language');
 return value;
}
export async function translateFacts(data,{fetchFn=fetch,maxRequests=24,maxSpecs=14}={}){
 if(!Array.isArray(data?.fiches))throw Error('Missing signed wiki fiches');
 const clone={...data,fiches:data.fiches.slice()};
 let requests=0,translated=0,pending=0,errors=[],changed=false,cache=new Map();
 let completed=0;
 for(let i=0;i<clone.fiches.length;i++){
  const row=clone.fiches[i],specs=row.specs;
  if(!Array.isArray(specs)||!specs.length)continue;
  const next=specs.slice(),updated={...row,specs:next};
  let rowChanged=false;
  for(let j=0;j<next.length;j++){
   const spec=next[j];
   if(!spec||!SAFE(spec.label)||!SAFE(spec.value))continue;
   if(LANGS.every(lang=>SAFE(spec.labelI18n?.[lang])&&SAFE(spec.valueI18n?.[lang])))continue;
   if(completed>=maxSpecs){pending++;continue}
   const dataByKind={};
   let failed=false;
   for(const kind of ['label','value']){
    const en=spec[kind],already=spec[kind+'I18n'];
    if(LANGS.every(lang=>SAFE(already?.[lang]))){dataByKind[kind]=already;continue}
    const easy=special(en,kind);
    if(easy){dataByKind[kind]=easy;continue}
    const value={en},fallback={...already};
    for(const lang of ['es','pt']){
     if(SAFE(fallback[lang])){value[lang]=fallback[lang];continue}
     const cacheKey=lang+'|'+en;
     if(cache.has(cacheKey)){value[lang]=cache.get(cacheKey);continue}
     if(requests>=maxRequests){failed=true;break}
     requests++;
     try{const translated=await translateRemote(en,lang,fetchFn);value[lang]=translated;cache.set(cacheKey,translated)}
     catch(e){errors.push({id:row.id,key:spec.key,lang,reason:String(e.message).slice(0,120)});failed=true;break}
    }
    if(failed)break;
    dataByKind[kind]={es:value.es,en,pt:value.pt};
   }
   if(failed){pending++;continue}
   if(!LANGS.every(lang=>SAFE(dataByKind.label?.[lang])&&dataByKind.label[lang].length<=80&&SAFE(dataByKind.value?.[lang]))){pending++;continue}
   next[j]={...spec,labelI18n:dataByKind.label,valueI18n:dataByKind.value};
   rowChanged=true;translated++;completed++;
  }
  if(rowChanged){clone.fiches[i]=updated;changed=true}
 }
 if(changed)clone.revision=data.revision+1;
 return {next:changed?clone:data,translated,pending,requests,errors};
}
