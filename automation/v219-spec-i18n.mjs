/* Game Atlas V219: translate source-revision-bound wiki infobox fields.
 * Safe offline glossary first; otherwise validated translations are cached.
 * Never publish untranslated unknown specs as though they were localized.
 * This module contains no signing key and never edits user profiles.
 */
const KEY_LABELS={
 type:['Tipo','Type','Tipo'], 'body style':['Carrocería','Body style','Carroceria'],
 manufacturer:['Fabricante','Manufacturer','Fabricante'],gender:['Género','Gender','Gênero'],
 voice:['Voz','Voice','Voz'],affiliations:['Afiliaciones','Affiliations','Afiliações'],
 home:['Residencia','Home','Residência'],status:['Estado','Status','Estado'],
 occupation:['Ocupación','Occupation','Ocupação'],variants:['Variantes','Variants','Variantes'],
 'spawn traffic':['Aparición en tráfico','Traffic spawn','Aparecimento no tráfego'],
 'spawn cargen':['Aparición programada','Scripted spawn','Aparecimento programado'],
 'spawn scenarios':['Escenarios de aparición','Spawn scenarios','Cenários de aparecimento'],
 'spawn specific':['Aparición específica','Specific spawn','Aparecimento específico'],
 lineup:['Gama','Lineup','Linha'],basevariant:['Variante base','Base variant','Variante-base'],
 purpose:['Uso','Purpose','Finalidade'],slot:['Ranura','Slot','Espaço'],
 spawn:['Aparición','Spawn','Aparecimento'],vehicles:['Vehículos','Vehicles','Veículos'],
 aka:['También conocido como','Also known as','Também conhecido como'],
 spawnmap:['Mapa de apariciones','Spawn map','Mapa de aparecimentos'],
 dob:['Nacimiento','Born','Nascimento'],firemode:['Modo de disparo','Fire mode','Modo de disparo'],
 nationality:['Nacionalidad','Nationality','Nacionalidade'],reticle:['Retícula','Reticle','Retícula'],
 'make year':['Año de fabricación','Model year','Ano de fabricação'],
 related:['Relacionado','Related','Relacionado'],anim:['Animación','Animation','Animação'],
 pob:['Lugar de nacimiento','Place of birth','Local de nascimento'],
 'sold in':['Disponible en','Sold in','Vendido em'],price:['Precio','Price','Preço'],
 'weapon style':['Tipo de arma','Weapon style','Tipo de arma'],
 games:['Juegos','Games','Jogos'],ammo:['Munición','Ammo','Munição'],
 modelname:['Modelo','Model name','Nome do modelo'],unlock:['Desbloqueo','Unlock','Desbloqueio'],
 'trade price':['Precio de intercambio','Trade price','Preço de troca'],
 dod:['Fallecimiento','Died','Falecimento']
};
const VALUES={
 yes:['Sí','Yes','Sim'],no:['No','No','Não'],unknown:['Desconocido','Unknown','Desconhecido'],
 alive:['Vivo/a','Alive','Vivo/a'],active:['Activo/a','Active','Ativo/a'],none:['Ninguno','None','Nenhum'],
 male:['Masculino','Male','Masculino'],female:['Femenino','Female','Feminino'],
 m:['Masculino','Male','Masculino'],f:['Femenino','Female','Feminino'],
 'law enforcement vehicle':['Vehículo policial','Law enforcement vehicle','Veículo policial'],
 'tv show character':['Personaje de televisión','TV show character','Personagem de televisão'],
 lighttruck:['Camioneta ligera','Light truck','Caminhonete leve'],
 heavytruck:['Camión pesado','Heavy truck','Caminhão pesado'],
 fullsize:['Tamaño completo','Full-size','Tamanho completo'],
 '4-door sedan':['Sedán de 4 puertas','4-door sedan','Sedã de 4 portas'],
 '4-door suv':['SUV de 4 puertas','4-door SUV','SUV de 4 portas'],
 'crew cab pickup truck':['Camioneta de cabina doble','Crew cab pickup truck','Picape de cabine dupla'],
 sports:['Deportivo','Sports','Esportivo'],streetbike:['Moto de calle','Street bike','Moto de rua'],
 motorboat:['Lancha motorizada','Motorboat','Lancha motorizada'],
 singleheli:['Helicóptero','Helicopter','Helicóptero'],
 buggy:['Buggy','Buggy','Buggy'],melee:['Cuerpo a cuerpo','Melee','Corpo a corpo'],
 throwable:['Arrojadiza','Throwable','Arremessável'],
 'golf cart':['Carrito de golf','Golf cart','Carrinho de golfe'],
 '4-door sedan ':['Sedán de 4 puertas','4-door sedan','Sedã de 4 portas']
};
const LANGS=['es','en','pt'];
export const sourceKey=x=>String(x||'').toLocaleLowerCase('en').replace(/[_-]+/g,' ').replace(/\s+/g,' ').trim();
const sameNumbers=(en,v)=>JSON.stringify(en.match(/\d+/g)||[])===JSON.stringify(v.match(/\d+/g)||[]);
const safe=x=>typeof x==='string'&&x.length>0&&x.length<=170&&!/[<>{}\u0000-\u001f]/.test(x);
const proper=(x)=>/^[\w .,'’\-()/]{1,170}$/.test(x)&&
  (/^\d+(?:[.,]\d+)?(?:\s*(?:\$|%|km\/h|mph))?$/.test(x)
    ||/^(?:[A-Z][\p{L}'’-]+)(?:\s+[A-Z][\p{L}'’-]+){0,5}$/u.test(x));
export function knownLabel(label){
 const key=sourceKey(label),v=KEY_LABELS[key];
 return v?{es:v[0],en:v[1],pt:v[2]}:null;
}
export function knownValue(value){
 const v=Object.entries(VALUES).find(([name])=>sourceKey(name)===sourceKey(value))?.[1];
 if(v)return {es:v[0],en:v[1],pt:v[2]};
 if(proper(value))return {es:value,en:value,pt:value};
 return null;
}
async function requestTranslation(input,lang,fetchFn=fetch){
 const u=new URL('https://api.mymemory.translated.net/get');
 u.searchParams.set('q',input);u.searchParams.set('langpair','en|'+(lang==='pt'?'pt-BR':'es'));u.searchParams.set('mt','1');
 const response=await fetchFn(u.toString(),{headers:{Accept:'application/json'},signal:AbortSignal.timeout(12000)});
 if(!response.ok)throw Error('Wiki translation service unavailable');
 const j=await response.json(),v=String(j.responseData?.translatedText||'').trim();
 if(Number(j.responseStatus)!==200||!safe(v)||!sameNumbers(input,v)||/quota exceeded|invalid request|mymemory warning/i.test(v))
  throw Error('Unsafe Wiki translation response');
 if(v.toLocaleLowerCase()===input.toLocaleLowerCase()&&!proper(input))throw Error('Wiki translation unchanged');
 return v;
}
export async function localizeCommunity(community,{
 cache={},limit=36,translate=requestTranslation,fetchFn=fetch
}={}){
 if(!community||!Array.isArray(community.fiches))throw Error('Missing wiki catalogue');
 const results={fiches:[],requests:0,added:0,complete:0,pending:0,rejected:[],cache};
 const labelCache={...cache};
 async function lookup(x,lang){
  const token=lang+':'+x;
  if(safe(labelCache[token]))return labelCache[token];
  if(results.requests>=limit)throw Error('Translation budget exhausted');
  results.requests++;
  const translated=await translate(x,lang,fetchFn);
  if(!safe(translated)||!sameNumbers(x,translated))throw Error('Unsafe translated Wiki fact');
  labelCache[token]=translated;
  return translated;
 }
 for(const row of community.fiches){
  const rawSpecs=Array.isArray(row.specs)?row.specs:[];
  if(!rawSpecs.length){results.fiches.push(row);continue}
  const previous=new Map((row.specsI18n||[]).map(v=>[v.key+'\0'+v.sourceValue,v]));
  const localized=[];
  for(const s of rawSpecs){
   if(!safe(s.key)||!safe(s.label)||!safe(s.value))continue;
   const prev=previous.get(s.key+'\0'+s.value);
   if(prev&&LANGS.every(l=>safe(prev.label?.[l])&&safe(prev.value?.[l]))){
    localized.push(prev);continue;
   }
   try{
    const labels=knownLabel(s.label)||{en:s.label,es:await lookup(s.label,'es'),pt:await lookup(s.label,'pt')};
    const values=knownValue(s.value)||{en:s.value,es:await lookup(s.value,'es'),pt:await lookup(s.value,'pt')};
    localized.push({key:s.key,sourceValue:s.value,label:labels,value:values});
    results.added++;
   }catch(err){
    results.pending++;
    if(results.rejected.length<25)results.rejected.push({id:row.id,key:s.key,reason:String(err.message).slice(0,80)});
   }
  }
  if(localized.length)results.complete+=localized.length;
  // The unlocalized raw fields remain private to the signed data pipeline;
  // renderers must display only localized specsI18n.
  results.fiches.push({...row,specsI18n:localized});
 }
 results.cache=labelCache;
 const next={...community,fiches:results.fiches};
 const changed=JSON.stringify(community.fiches)!==JSON.stringify(results.fiches);
 if(changed)next.revision=community.revision+1;
 return {next,changed,report:results};
}
