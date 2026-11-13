/* V1.43 - signed structured catalogue for web and Android.
   No remote JavaScript/CSS/HTML is loaded; no user progress is sent to this service.
   After validation, the app derives search, cards, progress and map pins from the same records array.
 */
(()=>{'use strict';
 const LANG=['es','en','pt'];
 // V219: source-approved map points/routes must match the actual Yanis V17 basemap.
 const CURRENT_MAP_VERSION='map-v216-yanis17';
 const CATEGORIES=new Set(['personajes','vehiculos','armas','misiones','economia','mapa-lugares','coleccionables','secretos','actividades','mundo','actualizaciones','herramientas']);
 const MAPPABLE=new Set(['personajes','vehiculos','armas','misiones','economia','mapa-lugares','coleccionables','secretos','actividades','mundo']);
 const ID=/^[a-z0-9][a-z0-9_-]{0,119}$/;
 const LAST='vi-signed-catalog-v143';
 const MAX=2_000_000, IMAGE_MAX=600_000, TIMEOUT=12000;
 let cfg=null,busy=false,prevCheck=0,lastRevision=-1,periodicTimer=null;
 const VERIFIED_IMAGES='vi-verified-images-v143',KEEP_DAYS=90,MAX_CACHED_IMAGES=24;
 const liveImageURLs=new Map();let imageRun=0;
 const decodeB64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
 const string=(v,n=1300)=>typeof v==='string'&&v.trim().length>0&&v.length<=n&&!/[<>\x00-\x1f]/.test(v);
 const translated=(t,n=1300)=>t&&typeof t==='object'&&LANG.every(l=>string(t[l],n));
 const safeUrl=(raw,host)=>{const u=new URL(raw);if(u.protocol!=='https:'||u.username||u.password||u.port||u.hostname!==host||u.hash)throw Error('Host not allowed');return u;};
 const rockstar=(raw)=>{const u=new URL(raw);if(u.protocol!=='https:'||u.username||u.password||u.port||!['www.rockstargames.com','rockstargames.com'].includes(u.hostname))throw Error('Untrusted source');return u.href;};
 function galleryPhotoAllowed(raw){
  if(typeof raw!=='string'||raw.length>550)return false;
  if(/^\.\/assets\/original\/[a-z-]+\.svg$/.test(raw))return true;
  let u;try{u=new URL(raw)}catch{return false}
  if(u.protocol!=='https:'||u.username||u.password||u.port||u.hash)return false;
  if(u.hostname==='media-rockstargames-com.akamaized.net')
   return /^\/tina-uploads\/posts\/[a-z0-9_-]+\/[a-f0-9]{40}\.(?:jpe?g|png|webp)$/.test(u.pathname)&&!u.search;
  return u.hostname==='www.rockstargames.com'&&
   /^\/VI\/_next\/static\/media\/[a-zA-Z0-9._~%-]+\.(?:jpe?g|png|webp)$/.test(u.pathname)&&
   (!u.search||u.search==='?akim=1&imdensity=1&imwidth=1280');
 }
 function validate(o,host){
  if(!o||o.schema!==1||!Number.isSafeInteger(o.revision)||o.revision<0||!Array.isArray(o.items)||o.items.length>1000)throw Error('Catalog schema');
  const seen=new Set(),items=[];let imageCount=0;
  for(const r of o.items){
   if(!r||!ID.test(r.id)||seen.has(r.id)||!CATEGORIES.has(r.category)||r.status!=='verified')throw Error('Invalid record');seen.add(r.id);
   if(!translated(r.title,180)||!translated(r.summary,1300))throw Error('Missing translations');
   if(!Array.isArray(r.sources)||r.sources.length<1||r.sources.length>5)throw Error('Missing source');
   // A community source is verified as a source, never as a Rockstar-confirmed fact.
   // Keep signed and browser validation consistent so one rumor cannot reject the whole feed.
   const community=r.category==='actualizaciones'&&r.facets?.community===1;
   if(community&&(r.facets?.claim_status!=='unconfirmed'||
     !/^rumor(?:es)?\b/i.test(r.title.es)||!/^rumou?r(?:s)?\b/i.test(r.title.en)||
     !/^rumor(?:es)?\b/i.test(r.title.pt)))throw Error('Rumor must be marked as unconfirmed');
   const sources=r.sources.map(x=>{
    if(!community)return {url:rockstar(x.url),type:'official',label:'Rockstar Games'};
    const u=new URL(x.url);
    if(u.protocol!=='https:'||u.username||u.password||u.port||u.search||u.hash||
       !((u.hostname==='gta.wiki'&&u.pathname.startsWith('/w/'))||
         (u.hostname==='www.grandtheftwiki.com'&&u.pathname.startsWith('/'))))throw Error('Untrusted community source');
    return {url:u.href,type:'community',label:u.hostname==='gta.wiki'?'GTA Wiki':'Grand Theft Wiki'};
   });
   let facets={};
   if(r.facets!==undefined){if(!r.facets||typeof r.facets!=='object'||Array.isArray(r.facets)||Object.keys(r.facets).length>35)throw Error('Facets');
    for(const [k,v] of Object.entries(r.facets)){if(!/^[a-z0-9_-]{1,60}$/.test(k)||!(typeof v==='number'&&Number.isFinite(v)||string(v,180)))throw Error('Facet value');facets[k]=v}}
   const facts=r.facts===undefined?[]:r.facts;
   if(!Array.isArray(facts)||facts.length>48)throw Error('Invalid facts');
   const factKeys=new Set();
   for(const f of facts){
    if(!f||f.verified!==true||!string(f.key,80)||!string(f.value,200)||
       factKeys.has(f.key.toLocaleLowerCase('es')))throw Error('Unreviewed or duplicate fact');
    factKeys.add(f.key.toLocaleLowerCase('es'));
   }
   const tags=Array.isArray(r.tags)?r.tags:[];
   if(tags.length>20||tags.some(t=>!string(t,55)))throw Error('Tags');
   let mapPoint;
   if(r.mapPoint!==undefined){const m=r.mapPoint;if(!MAPPABLE.has(r.category)||!m||m.mapVersion!==CURRENT_MAP_VERSION||!Number.isFinite(m.x)||!Number.isFinite(m.y)||m.x<0||m.x>100||m.y<0||m.y>100)throw Error('Map calibration');mapPoint={mapVersion:m.mapVersion,x:m.x,y:m.y}}
   const publishedAt=r.publishedAt===undefined?undefined:r.publishedAt;
   if(publishedAt!==undefined&&!/^\d{4}-\d{2}-\d{2}$/.test(publishedAt))throw Error('Bad publication date');
   let gallery;
   if(r.gallery!==undefined){
    if(!['vehiculos','armas','economia','mapa-lugares','personajes'].includes(r.category)||
       !Array.isArray(r.gallery)||r.gallery.length>10)throw Error('Invalid gallery');
    gallery=[];const used=new Set();
    for(const p of r.gallery){
     if(!p||!galleryPhotoAllowed(p.src)||used.has(p.src)||!translated(p.caption,180)||
        typeof p.sourceUrl!=='string')throw Error('Untrusted gallery image');
     rockstar(p.sourceUrl);
     used.add(p.src);
     gallery.push({src:p.src,caption:p.caption,sourceUrl:p.sourceUrl});
    }
   }
   // Optional licensed image. Image bytes are verified separately before becoming an object URL.
   let photo,officialPhoto;
   if(r.image!==undefined){
    imageCount++;const i=r.image;
    if(i?.type==='official'&&r.category==='actualizaciones'){
     const path=new URL(sources[0].url).pathname,postId=path.match(/\/article\/([a-z0-9_-]+)\//i)?.[1];
     const mediaRe=new RegExp('^https://media-rockstargames-com\\.akamaized\\.net/tina-uploads/posts/'+postId+'/[a-f0-9]{40}\\.(?:jpe?g|png|webp)$');
     if(!postId||!mediaRe.test(i.remote)||i.officialPage!==sources[0].url||!translated(i.caption,180))throw Error('Untrusted Rockstar cover');
     officialPhoto={type:'official',remote:i.remote,caption:i.caption,officialPage:i.officialPage};
    }else{
     if(!i||!/^updates\/assets\/[a-f0-9]{64}\.(?:webp|png|jpe?g)$/.test(i.path)||!/[a-f0-9]{64}/.test(i.sha256)||i.path.split('/').pop().split('.')[0]!==i.sha256||!translated(i.alt,180)||!['owned','permission'].includes(i.rights))throw Error('Image asset');
     photo={path:i.path,sha256:i.sha256,alt:i.alt,rights:i.rights};
    }
   }
   items.push({id:r.id,slug:r.id,category:r.category,status:'verified',title:r.title,summary:r.summary,desc:r.summary,facets,tags,sources,mapPoint,
      trackable:typeof r.trackable==='boolean'?r.trackable:undefined,publishedAt,spoilerLevel:0,facts,gallery,image:officialPhoto,__signedPhoto:photo});
  }
  const routes=o.routes===undefined?[]:o.routes;
  if(!Array.isArray(routes)||routes.length>80)throw Error('Routes');
  const seenRoute=new Set();
  for(const r of routes){if(!r||!/^official-[a-z0-9_-]{1,90}$/.test(r.id)||seenRoute.has(r.id)||!translated(r.title,180)||!translated(r.summary,1300)||r.mapVersion!==CURRENT_MAP_VERSION||!Array.isArray(r.stops)||r.stops.length<2||r.stops.length>20||r.stops.some(x=>typeof x!=='string'||!/^(?:catalog-)?[a-z0-9_-]{1,120}$/.test(x))||new Set(r.stops).size!==r.stops.length)throw Error('Bad route');seenRoute.add(r.id)}
  const rankings=o.rankings===undefined?{donations:[],speedruns:[]}:o.rankings;
  if(!rankings||!Array.isArray(rankings.donations)||!Array.isArray(rankings.speedruns)||rankings.donations.length>100||rankings.speedruns.length>100)throw Error('Rankings');
  const seenRank=new Set(),currencies=new Set();
  for(const d of rankings.donations){if(!d||!/^don-[a-z0-9_-]{1,85}$/.test(d.id)||seenRank.has(d.id)||!string(d.alias,90)||d.publicAliasConsent!==true||d.verifiedStatus!=='verified'||!Number.isFinite(d.amount)||d.amount<=0||d.amount>100000000||Math.abs(Math.round(d.amount*100)-d.amount*100)>1e-7||!/^[A-Z]{3}$/.test(d.currency)||d.country!==undefined&&!/^[A-Z]{2}$/.test(d.country)||d.publicCountryConsent!==undefined&&typeof d.publicCountryConsent!=='boolean')throw Error('Donation ranking');seenRank.add(d.id);currencies.add(d.currency)}
  if(currencies.size>1)throw Error('Mixed donation currencies');
  for(const r of rankings.speedruns){if(!r||!/^run-[a-z0-9_-]{1,85}$/.test(r.id)||seenRank.has(r.id)||!string(r.player,90)||!string(r.category,95)||!string(r.categoryId,65)||!string(r.time,30)||r.verifiedStatus!=='verified'||!Number.isInteger(r.place)||r.place<1||r.place>100||typeof r.sourceUrl!=='string')throw Error('Run');const u=new URL(r.sourceUrl);if(u.protocol!=='https:'||u.username||u.password||u.port||!['www.speedrun.com','speedrun.com','www.youtube.com','youtube.com','youtu.be'].includes(u.hostname))throw Error('Run proof');seenRank.add(r.id)}
  if(imageCount>80)throw Error('Too many image assets');
  return {revision:o.revision,items,routes,rankings};
 }
 async function verify(env,key,host){
  if(!env||env.schema!==1||typeof env.payload!=='string'||typeof env.signature!=='string'||env.payload.length>MAX||!/^[a-zA-Z0-9+/=]+$/.test(env.payload))throw Error('Invalid envelope');
  const raw=decodeB64(key),sig=decodeB64(env.signature);
  if(raw.length!==32||sig.length!==64)throw Error('Key lengths');
  const pub=await crypto.subtle.importKey('raw',raw,'Ed25519',false,['verify']);
  if(!await crypto.subtle.verify('Ed25519',pub,sig,new TextEncoder().encode(env.payload)))throw Error('Invalid signature');
  const body=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(decodeB64(env.payload)));
  return validate(body,host);
 }
 async function readConfig(){
  const r=await fetch('./online-config.json',{cache:'no-store'});if(!r.ok)throw Error('Missing config');const x=await r.json();if(x.enabled!==true)return null;
  const u=new URL(x.manifestUrl);if(u.protocol!=='https:'||u.username||u.password||u.port||u.hash||x.publicKeyEd25519Base64?.length>90||x.publicKeyEd25519Base64?.length<40)throw Error('Unsafe configuration');
  return {url:u.href,host:u.hostname,key:x.publicKeyEd25519Base64,interval:Math.max(10,Math.min(1440,Number(x.minCheckMinutes)||30))*60000};
 }
 function commit(result){
  // The core keeps its own catalog as the single source for EVERY component.
  if(!window.viApplySignedCatalog)throw Error('Catalog bridge missing');
  window.viApplySignedCatalog(result.items.map(({__signedPhoto,...rest})=>rest));
  window.viApplySignedRoutes?.(result.routes);
  window.viApplySignedRankings?.(result.rankings);
 }
 const toHex=a=>Array.from(new Uint8Array(a),v=>v.toString(16).padStart(2,'0')).join('');
 async function imageFor(record,endpoint){
  const info=record.__signedPhoto;if(!info)return;
  const url=new URL(info.path.replace(/^updates\//,''),endpoint);safeUrl(url.href,endpoint.hostname);
  const controller=new AbortController(),time=setTimeout(()=>controller.abort(),TIMEOUT);
  try{
   // CORS required for Android's local origin. No external image is trusted without hash check.
   const cache=typeof caches!=='undefined'?await caches.open(VERIFIED_IMAGES):null;
   let response;try{response=await fetch(url,{redirect:'error',signal:controller.signal,cache:'no-store'})}catch(err){response=cache?await cache.match(url.href):null;if(!response)throw err}
   if(!response.ok||Number(response.headers.get('content-length')||0)>IMAGE_MAX)throw Error('Image unavailable/oversized');
   const bytes=await response.arrayBuffer();if(bytes.byteLength>IMAGE_MAX)throw Error('Large image');
   if(toHex(await crypto.subtle.digest('SHA-256',bytes))!==info.sha256)throw Error('Image digest mismatch');
   const type=info.path.endsWith('.png')?'image/png':info.path.match(/jpe?g$/)?'image/jpeg':'image/webp';
   // Validate magic bytes to avoid SVG/HTML disguised as bitmap.
   const a=new Uint8Array(bytes),h=String.fromCharCode(...a.slice(0,12));
   if(type==='image/png'&&!(a[0]===137&&h.slice(1,4)==='PNG'))throw Error('Bad PNG');
   if(type==='image/jpeg'&&!(a[0]===255&&a[1]===216))throw Error('Bad JPEG');
   if(type==='image/webp'&&!(h.slice(0,4)==='RIFF'&&h.slice(8,12)==='WEBP'))throw Error('Bad WEBP');
   if(cache)void cache.put(url.href,new Response(bytes.slice(0),{status:200,headers:{'Content-Type':type,'X-VI-Saved-At':String(Date.now())}})).catch(()=>{});
   return URL.createObjectURL(new Blob([bytes],{type}));
  }finally{clearTimeout(time)}
 }
 // Retain images referenced by the CURRENT signed catalog, remove expired orphan
 // downloads, and limit retained orphan downloads to the last 24. We never touch
 // the app's offline static cache, external Rockstar images or user localStorage.
 async function trimVerifiedImageCache(activePaths){
  if(typeof caches==='undefined')return;
  try{
   const cache=await caches.open(VERIFIED_IMAGES),keys=await cache.keys(),stale=[],now=Date.now();
   for(const request of keys){
    if(activePaths.has(request.url))continue;
    const response=await cache.match(request);
    const saved=Number(response?.headers?.get('X-VI-Saved-At')||0);
    if(!saved||now-saved>KEEP_DAYS*86400000){await cache.delete(request);continue}
    stale.push({request,saved});
   }
   stale.sort((a,b)=>b.saved-a.saved);
   const room=Math.max(0,MAX_CACHED_IMAGES-activePaths.size);
   for(const old of stale.slice(room))await cache.delete(old.request);
  }catch(e){console.warn('Verified image cleanup skipped:',e.message)}
 }
 async function photos(result){
  const run=++imageRun,active=[],paths=new Set();
  const endpoint=new URL(cfg.url);
  for(const rec of result.items){if(!rec.__signedPhoto)continue;
   try{
    const photoPath=rec.__signedPhoto.path;
    const source=new URL(photoPath.startsWith('updates/')?photoPath.slice(8):photoPath,endpoint);
    paths.add(source.href);
    const url=await imageFor(rec,endpoint);if(url)active.push({id:rec.id,url});
   }catch(e){console.warn('Signed image skipped',rec.id,e.message)}
  }
  // Never overwrite image URLs from a newer update with a slower previous fetch.
  if(run!==imageRun){for(const item of active)URL.revokeObjectURL?.(item.url);return}
  // New URLs become active before the old ones are released.
  if(active.length&&window.viUpdateSignedImages){
   window.viUpdateSignedImages(active);
   for(const item of active){
    const old=liveImageURLs.get(item.id);
    liveImageURLs.set(item.id,item.url);
    if(old&&old!==item.url)URL.revokeObjectURL?.(old);
   }
  }else for(const item of active)URL.revokeObjectURL?.(item.url);
  await trimVerifiedImageCache(paths);
 }
 async function refresh(force=false){
  if(!cfg||busy||!navigator.onLine||!force&&Date.now()-prevCheck<cfg.interval)return;
  busy=true;prevCheck=Date.now();const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),TIMEOUT);
  try{
   const r=await fetch(cfg.url,{cache:'no-store',headers:{Accept:'application/json'},redirect:'error',signal:ctrl.signal});
   if(!r.ok||Number(r.headers.get('content-length')||0)>MAX)throw Error('Feed unavailable/large');
   const raw=await r.text();if(raw.length>MAX)throw Error('Large feed');
   const env=JSON.parse(raw),parsed=await verify(env,cfg.key,cfg.host);
   if(parsed.revision<lastRevision)throw Error('Rollback blocked');
   if(parsed.revision===lastRevision)return;
   commit(parsed);localStorage.setItem(LAST,JSON.stringify(env));lastRevision=parsed.revision;
   void photos(parsed);
   dispatchEvent(new CustomEvent('vi:signed-catalog-updated',{detail:{revision:lastRevision,count:parsed.items.length}}));
  }catch(e){console.warn('Update rejected, kept previous catalog:',e.message)}finally{clearTimeout(timer);busy=false}
 }
 async function start(){try{
  cfg=await readConfig();if(!cfg)return;
  const saved=localStorage.getItem(LAST);
  if(saved){try{const parsed=await verify(JSON.parse(saved),cfg.key,cfg.host);commit(parsed);lastRevision=parsed.revision;void photos(parsed)}catch(e){localStorage.removeItem(LAST);console.warn('Rejected cached update:',e.message)}}
  void refresh();
  // Consult updates while app remains open; do not use the timer in background.
  // Browser throttling may delay this, so visibility/online handlers remain necessary.
  if(!periodicTimer)periodicTimer=setInterval(()=>{if(!document.hidden)void refresh();},cfg.interval);
 }catch(e){console.warn('Signed updater disabled:',e.message)}}
 addEventListener('online',()=>void refresh());document.addEventListener('visibilitychange',()=>{if(!document.hidden)void refresh()});
 window.viRefreshSignedContent=()=>refresh(true);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else void start();
})();
