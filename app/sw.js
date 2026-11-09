/* Web-only offline fallback. JavaScript, CSS and HTML are network-first so new releases propagate. */
const CACHE='game-atlas-safe-v196';
const OLD_PREFIXES=['vi-game-assistant-','game-atlas-safe-'];
const OFFLINE=['./assets/original/community-coast-v193.webp','./','./index.html','./privacy.html','./news-v155.js','./guest-import-safe.js','./info-v158.js','./detail-enhancements-v160.js','./compare-metrics-v161.js','./info-v158.css','./app-v155.css','./desktop-fixes-v156.css','./desktop-fixes-v157.css','./app-v137.js','./app-v137.css','./mobile-v137.css','./mobile-v140.css','./mobile-v141.css','./mobile-v142.css','./mobile-v143.css','./mobile-v144.css','./routes-v145.css','./routes-v145.js','./vi-i18n.js','./diagnostics-v143.js','./online-updates.js','./online-config.json','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./icons/vi-logo.svg','./visual-web-v148.css','./visual-gallery-v149.js'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(OFFLINE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE&&OLD_PREFIXES.some(p=>key.startsWith(p))).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
async function networkFirst(request){
 const cache=await caches.open(CACHE);
 try{
  const response=await fetch(request,{cache:'no-cache'});
  if(response.ok)await cache.put(request,response.clone());
  return response;
 }catch(err){
  let saved=await cache.match(request);
  // Versioned JS/CSS (?rev=...) must fall back to their precached path on a first offline load.
  if(!saved){
    const url=new URL(request.url);
    if(url.origin===self.location.origin && /\.(?:html|js|css)$/.test(url.pathname) && url.search){
      const bare=new Request(url.origin+url.pathname,{method:'GET'});
      saved=await cache.match(bare);
    }
  }
  if(saved)return saved;
  throw err;
 }
}
async function cacheFirstImage(request){
 const cache=await caches.open(CACHE);
 const hit=await cache.match(request);
 if(hit)return hit;
 const response=await fetch(request);
 if(response.ok)await cache.put(request,response.clone());
 return response;
}
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET')return;
 const url=new URL(request.url);
 if(url.origin!==self.location.origin)return;
 if(request.mode==='navigate'||url.pathname.endsWith('/')||/\.(?:html|js|css|json|webmanifest)$/.test(url.pathname)){
  event.respondWith(networkFirst(request));return;
 }
 if(/\.(?:png|svg|webp|jpe?g)$/.test(url.pathname)){
  event.respondWith(cacheFirstImage(request));
 }
});

