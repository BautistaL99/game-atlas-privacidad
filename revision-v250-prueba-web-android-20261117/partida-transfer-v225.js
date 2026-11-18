/* Game Atlas · transfer of an existing Mi partida backup, no cloud account.
   Website: exports the same schema-2 JSON when opening a verified store link,
   plus a visible backup button. Android: one-time first-use restore prompt.
   Installation from Play / App Store cannot silently access browser storage. */
(()=>{'use strict';
 const root=document.getElementById('root');if(!root)return;
 const native=()=>!!(window.Capacitor?.isNativePlatform?.()||window.Capacitor?.getPlatform?.()==='android'||window.Capacitor?.getPlatform?.()==='ios');
 const tr={
  es:{title:'Llevá tu partida a la app',web:'Antes de instalar, guardá una copia de tus favoritos, progreso, marcadores y rutas. Después, al abrir Game Atlas, entrá en Mi partida y recuperá ese archivo una sola vez.',save:'Guardar mi partida para la app',webNote:'La copia es privada y queda en Descargas. No se envía a ningún servidor.',appTitle:'¿Tenés una partida guardada en la web?',appNote:'Si descargaste una copia, podés recuperarla cuando quieras desde Mi partida. El selector de Archivos se abre solo cuando tocás «Elegir copia»; no pedimos permiso al iniciar.',restore:'Elegir copia',skip:'Ahora no',newFile:'El navegador intentará descargar tu copia. Guardala para seleccionarla después en la app.'},
  en:{title:'Bring your progress to the app',web:'Before installing, download a backup of your favorites, progress, pins and routes. Then open My Game in the app and restore that file once.',save:'Save my progress for the app',webNote:'Your backup stays in Downloads; it is not uploaded to a server.',appTitle:'Have a saved game from the website?',appNote:'You can restore a backup any time in My Game. The Files picker opens only when you tap Choose backup; no file permission is requested at launch.',restore:'Choose backup',skip:'Not now',newFile:'Your browser will try to download a backup. Keep it for importing in the app.'},
  pt:{title:'Leve seu progresso ao aplicativo',web:'Antes de instalar, salve uma cópia dos favoritos, progresso, marcadores e rotas. Depois abra Meu Jogo no aplicativo e restaure esse arquivo uma vez.',save:'Salvar meu progresso para o app',webNote:'Sua cópia fica em Downloads; nada é enviado a um servidor.',appTitle:'Tem um progresso salvo do site?',appNote:'Você pode restaurar a cópia em Minha partida quando quiser. O seletor Arquivos abre só ao tocar em Escolher cópia; não pedimos acesso ao iniciar.',restore:'Escolher cópia',skip:'Agora não',newFile:'O navegador tentará baixar sua cópia. Guarde-a para usar no aplicativo.'}
 };
 const L=()=>tr[(document.documentElement.lang||'es').slice(0,2)]||tr.es;
 const DONE='vi-v225-onboarding-done';
 const HINT_DISMISSED='vi-v227-transfer-home-hint-dismissed';
 const welcome={
  es:{note:'¿Venís de la web? Podés recuperar tu partida guardada cuando quieras.',open:'Ir a Mi partida',close:'Ocultar este aviso'},
  en:{note:'Coming from the website? You can restore your saved progress whenever you like.',open:'Go to My Game',close:'Dismiss this tip'},
  pt:{note:'Veio do site? Você pode recuperar seu progresso salvo quando quiser.',open:'Ir para Minha partida',close:'Ocultar este aviso'}
 };

 const hasSavedData=()=>{
  try{for(const name of ['completed','favorites','read','recent','map-pins','routes','route-progress']){
   const raw=localStorage.getItem('gta6-assistant:v1:'+name);
   if(!raw)continue;
   const val=JSON.parse(raw);
   if(Array.isArray(val)&&val.length>0)return true;
   if(val&&typeof val==='object'&&!Array.isArray(val)&&Object.keys(val).length>0)return true;
  }}catch{return true}return false;
 };
 const note=()=>root.querySelector('.vi-partida-transfer-message');
 function sync(){
  const t=L();
  if(native()){
   root.querySelector('.vi-partida-transfer-web')?.remove();
   // Small inline first-use tip, not a permission dialogue or blocking modal.
   const home=root.querySelector('.container-home-v111');
   const tip=root.querySelector('.vi-v227-transfer-welcome');
   const needTip=!!home&&!hasSavedData()&&localStorage.getItem(DONE)!=='1'&&localStorage.getItem(HINT_DISMISSED)!=='1';
   if(!needTip)tip?.remove();
   else if(!tip){
    const w=welcome[(document.documentElement.lang||'es').slice(0,2)]||welcome.es;
    const bar=document.createElement('aside');bar.className='vi-v227-transfer-welcome';bar.setAttribute('aria-label',w.note);
    bar.innerHTML='<span class="vi-v227-transfer-welcome-text">'+w.note+'</span><a href="#/partida">'+w.open+'</a><button type="button" data-vi-v227-tip-dismiss aria-label="'+w.close+'" title="'+w.close+'">×</button>';
    home.prepend(bar);
   } else if(tip.dataset.lang!==(document.documentElement.lang||'es')){
    // Locale changes without forcing a re-opened notice.
    tip.dataset.lang=document.documentElement.lang||'es';
    const w=welcome[(document.documentElement.lang||'es').slice(0,2)]||welcome.es;
    tip.querySelector('.vi-v227-transfer-welcome-text').textContent=w.note;
    tip.querySelector('a').textContent=w.open;
    tip.querySelector('button').setAttribute('aria-label',w.close);
   }

   const backups=root.querySelector('.guest-backup');
   const existing=root.querySelector('.vi-partida-transfer-onboarding');
   const show=!!backups&&!hasSavedData()&&localStorage.getItem(DONE)!=='1';
   if(!show){existing?.remove();return}
   if(existing){if(existing.dataset.lang===document.documentElement.lang)return;existing.remove()}
   const card=document.createElement('section');card.className='vi-partida-transfer-onboarding';card.dataset.lang=document.documentElement.lang;
   card.innerHTML='<h3>'+t.appTitle+'</h3><p>'+t.appNote+'</p><div class="vi-partida-transfer-actions"><button type="button" data-vi-transfer-select>'+t.restore+'</button><button type="button" data-vi-transfer-dismiss>'+t.skip+'</button></div>';
   backups.before(card);
   return;
  }
  root.querySelector('.vi-partida-transfer-onboarding')?.remove();
  const downloads=root.querySelector('.atlas-downloads-page');
  const existing=root.querySelector('.vi-partida-transfer-web');
  if(!downloads){existing?.remove();return}
  if(existing){if(existing.dataset.lang===document.documentElement.lang)return;existing.remove()}
  const card=document.createElement('section');card.className='vi-partida-transfer-web';card.dataset.lang=document.documentElement.lang;
  card.innerHTML='<h3>'+t.title+'</h3><p>'+t.web+'</p><div class="vi-partida-transfer-actions"><button type="button" data-guest-export data-vi-transfer-export>'+t.save+'</button></div><small>'+t.webNote+'</small><p class="vi-partida-transfer-message" aria-live="polite"></p>';
  downloads.querySelector('.atlas-install-panel')?.insertAdjacentElement('afterend',card);
 }
 // Only genuine verified storefront actions trigger an export, NOT the header
 // navigation to /descargas or the "Coming soon" placeholder.
 document.addEventListener('click',event=>{
  if(native()){
   if(event.target.closest('[data-vi-v227-tip-dismiss]')){event.preventDefault();event.stopImmediatePropagation();localStorage.setItem(HINT_DISMISSED,'1');sync();return;}
   if(event.target.closest('.vi-v227-transfer-welcome a'))localStorage.setItem(HINT_DISMISSED,'1');
   if(event.target.closest('[data-vi-transfer-dismiss]')){event.preventDefault();event.stopImmediatePropagation();localStorage.setItem(DONE,'1');sync();return}
   if(event.target.closest('[data-vi-transfer-select]')){
    event.preventDefault();event.stopImmediatePropagation();
    root.querySelector('.guest-backup input[data-guest-import]')?.click();return;
   }
   return;
  }
  const store=event.target.closest('a.atlas-store-ready[href]');
  if(store){
   // Reuse the existing schema-2 export/validation; no new backup format.
   if(typeof exportGuest==='function')exportGuest();
  }
  if(event.target.closest('[data-vi-transfer-export]')){
   // Core app-v137.js already handles data-guest-export.
   queueMicrotask(()=>{const out=note();if(out)out.textContent=L().newFile});
  }
 },true);
 // The existing importer validates schema, asks before replacement and uses a
 // rollback journal. Mark onboarding done only once it reports success.
 const observer=new MutationObserver(()=>{
  if(native() && root.querySelector('#guestBackupStatus')?.textContent?.includes('Copia recuperada.')){
   localStorage.setItem(DONE,'1');
  }
  schedule();
 });
 let scheduled=false;
 function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;sync()})}
 observer.observe(root,{childList:true,subtree:true,characterData:true});
 addEventListener('hashchange',schedule);document.addEventListener('DOMContentLoaded',schedule,{once:true});schedule();
})();
