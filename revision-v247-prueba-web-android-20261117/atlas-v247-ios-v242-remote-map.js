/* Game Atlas iOS V242: opt-in signed remote map manifest.
 * Uses the SAME Ed25519 trust root configured for the independent catalog.
 * The packaged map remains authoritative until an authenticated new release exists.
 * No URL can execute JavaScript; only validated image bytes and structured pins.
 */
(()=>{'use strict';
 /* Shared cross-platform implementation: no iOS-only gate. */
 const CACHE_KEY='vi-ios-map-v242-signed',MAX_ENVELOPE=1050000,MAX_MAP_BYTES=24*1024*1024;
 let latestRevision=0,activeVersion='',checking=false,baseUrl='',publicKey='',cachedEnvelope=null;
 const b64=s=>Uint8Array.from(atob(s),ch=>ch.charCodeAt(0));
 const clean=s=>typeof s==='string'&&s.length>0&&s.length<=260&&!/[<>\x00-\x1f]/.test(s);
 const isFinitePercent=v=>Number.isFinite(v)&&v>=0&&v<=100;
 const allowedCategories=new Set(['regiones','tiendas-armas','garajes','vehiculos','armas','misiones','economia','coleccionables','secretos','actividades','lugares','personajes']);
 function validateMap(data){
  if(data?.schema!==242||data?.type!=='GAME_ATLAS_MAP_DATA' || !Number.isSafeInteger(data.revision)||data.revision<1||!data.basemap||!Array.isArray(data.pins)||data.pins.length>5000)throw Error('Mapa remoto: estructura inválida');
  const map=data.basemap;
  if(!/^map-[a-z0-9][a-z0-9-]{4,55}$/.test(map.id)||!Number.isSafeInteger(map.width)||!Number.isSafeInteger(map.height)||map.width<200||map.width>12000||map.height<200||map.height>12000)throw Error('Mapa remoto: dimensiones no válidas');
  if(!clean(map.attribution)||!clean(map.license)||!clean(map.sourceUrl)||!clean(map.imageUrl)||!/^[a-f0-9]{64}$/.test(map.sha256))throw Error('Mapa remoto: faltan créditos, licencia o SHA-256');
  // Host and prefix come from a bundled trusted endpoint, NOT from manifest.
  const imageUrl=new URL(map.imageUrl),root=new URL(baseUrl);
  if(imageUrl.protocol!=='https:'||imageUrl.hostname!==root.hostname||!imageUrl.pathname.startsWith(root.pathname+'maps/')||
    imageUrl.search||imageUrl.hash||imageUrl.username||imageUrl.password||imageUrl.port||!(/\.(webp|png)$/i.test(imageUrl.pathname)))throw Error('Mapa remoto: imagen de origen no aprobado');
  const source=new URL(map.sourceUrl);
  if(source.protocol!=='https:'||source.username||source.password||source.hash||source.port)throw Error('Mapa remoto: fuente sin HTTPS válido');
  const seen=new Set();
  for(const p of data.pins){
   if(!p||typeof p.id!=='string'||!/^[a-z0-9][a-z0-9-]{2,85}$/.test(p.id)||seen.has(p.id)||
    !allowedCategories.has(p.category)||!clean(p.title)||p.title.length>120||
    !isFinitePercent(p.x)||!isFinitePercent(p.y)||
    (p.itemId!==undefined&&!/^[a-z0-9][a-z0-9-]{1,90}$/.test(p.itemId))||
    (p.note!==undefined&&(!clean(p.note)||p.note.length>260))||
    (p.tags!==undefined&&(!Array.isArray(p.tags)||p.tags.length>10||p.tags.some(t=>!clean(t)||t.length>60))))throw Error('Mapa remoto: ubicación inválida');
   seen.add(p.id);
  }
  return data;
 }
 async function decodeEnvelope(env){
  if(!env||env.schema!==242||typeof env.payload!=='string'||env.payload.length>MAX_ENVELOPE||
    typeof env.signature!=='string'||env.signature.length>120||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(env.payload))throw Error('Mapa no firmado o demasiado grande');
  const key=b64(publicKey),sig=b64(env.signature);
  if(key.length!==32||sig.length!==64)throw Error('Firma del mapa inválida');
  const imported=await crypto.subtle.importKey('raw',key,'Ed25519',false,['verify']);
  if(!await crypto.subtle.verify('Ed25519',imported,sig,new TextEncoder().encode(env.payload)))throw Error('Firma del mapa no coincide');
  const payload=new TextDecoder('utf-8',{fatal:true}).decode(b64(env.payload));
  return validateMap(JSON.parse(payload));
 }
 async function imageFor(map){
  const url=new URL(map.imageUrl);
  const response=await fetch(url.href,{cache:'force-cache',redirect:'error',credentials:'omit',signal:AbortSignal.timeout(19000)});
  if(!response.ok||Number(response.headers.get('content-length')||0)>MAX_MAP_BYTES)throw Error('Imagen de mapa no disponible');
  const mime=String(response.headers.get('content-type')||'').split(';')[0].trim();
  if(!['image/webp','image/png','application/octet-stream'].includes(mime))throw Error('Formato de imagen rechazado');
  const bytes=await response.arrayBuffer();if(!bytes.byteLength||bytes.byteLength>MAX_MAP_BYTES)throw Error('Imagen del mapa supera el límite');
  const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(b=>b.toString(16).padStart(2,'0')).join('');
  if(digest!==map.sha256)throw Error('El mapa publicado no coincide con el SHA-256 firmado');
  const blob=new Blob([bytes],{type:url.pathname.endsWith('.png')?'image/png':'image/webp'});
  if(typeof createImageBitmap==='function'){
   const img=await createImageBitmap(blob);
   const matches=img.width===map.width&&img.height===map.height;img.close?.();
   if(!matches)throw Error('Dimensiones reales de mapa no coinciden');
  }
  return URL.createObjectURL(blob);
 }
 async function apply(env){
  const data=await decodeEnvelope(env);
  if(data.revision<latestRevision)throw Error('Revisión del mapa inferior a la activa');
  if(data.revision===latestRevision&&data.basemap.id===activeVersion)return true;
  if(data.revision===latestRevision&&activeVersion)throw Error('Revisión repetida con datos diferentes');
  const url=await imageFor(data.basemap);
  const result=window.viIosApplyRemoteMap?.(data,url);
  if(!result){URL.revokeObjectURL(url);return false;}
  latestRevision=data.revision;activeVersion=data.basemap.id;cachedEnvelope=env;
  try{localStorage.setItem(CACHE_KEY,JSON.stringify(env))}catch{}
  return true;
 }
 async function check(force=false){
  if(checking||!baseUrl||navigator.onLine===false)return;
  checking=true;
  try{
   const response=await fetch(baseUrl+'map-envelope-v242.json',{cache:'no-store',redirect:'error',credentials:'omit',signal:AbortSignal.timeout(11000)});
   if(!response.ok||Number(response.headers.get('content-length')||0)>MAX_ENVELOPE*2)throw Error('No hay actualización de mapa publicada');
   const text=await response.text();if(text.length>MAX_ENVELOPE*2)throw Error('Mapa remoto demasiado grande');
   await apply(JSON.parse(text));
  }catch(err){console.info('[Game Atlas map] Retained packaged map:',err.message)}finally{checking=false}
 }
 async function start(){
  try{
   const response=await fetch('./online-config.json',{cache:'no-store'});
   if(!response.ok)throw Error('Sin configuración confiable');
   const config=await response.json(),url=new URL(config.manifestUrl);
   if(config.enabled!==true||url.protocol!=='https:'||url.hostname!=='bautistal99.github.io'||
     !url.pathname.endsWith('/updates/catalog-envelope.json')||url.search||url.hash||
     typeof config.publicKeyEd25519Base64!=='string')throw Error('Servidor de mapas no aprobado');
   baseUrl=url.href.slice(0,-'catalog-envelope.json'.length);
   publicKey=config.publicKeyEd25519Base64;
   try{const cached=localStorage.getItem(CACHE_KEY);if(cached)await apply(JSON.parse(cached))}catch(error){console.info('[Game Atlas map] Cached map unavailable:',error.message)}
   await check(true);
   setInterval(()=>{if(document.visibilityState==='visible')void check()},Math.max(10,Number(config.minCheckMinutes)||30)*60000);
  }catch(err){console.info('[Game Atlas map] Using bundled map:',err.message)}
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>void start(),{once:true});
 else void start();
 window.viMapRemoteCheck=()=>check(true);
})();