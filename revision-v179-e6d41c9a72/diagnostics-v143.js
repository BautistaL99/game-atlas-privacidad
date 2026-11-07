/* Privacy-preserving optional user report, no telemetry and no network transmissions. */
(()=>{'use strict';
 document.addEventListener('click',async e=>{
  const button=e.target.closest('[data-vi-report]');if(!button)return;
  const lang=localStorage.getItem('vi_demo_locale')||'es';
  const info=['Game Atlas Companion V1.43','Fecha: '+new Date().toISOString(),
   'Pantalla: '+(location.hash||'#/'),'Idioma: '+lang,
   'Red: '+(navigator.onLine?'conectado':'sin conexión'),
   'Resolución: '+innerWidth+'x'+innerHeight,
   'Plataforma: '+(window.Capacitor?.getPlatform?.()||'web'),
   'Descripción del problema: [escribir aquí]'].join('\n');
  const out=document.getElementById('vi-report-output');if(!out)return;
  out.value=info;out.hidden=false;
  try{await navigator.clipboard.writeText(info);button.textContent=lang==='en'?'Copied':lang==='pt'?'Copiado':'Copiado';}
  catch{out.focus();out.select();button.textContent=lang==='en'?'Select and copy the text':lang==='pt'?'Selecione e copie o texto':'Seleccioná y copiá el texto';}
 });
})();
