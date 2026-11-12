/* V215 – compact labels for five real map filters, without changing their behavior.
 * Preserves full accessible labels, original category IDs and desktop text.
 */
(() => {
  'use strict';
  const names = {
    es: {regiones:'Regiones',vehiculos:'Autos',misiones:'Misiones',lugares:'Lugares',personal:'Míos'},
    en: {regiones:'Regions',vehiculos:'Cars',misiones:'Missions',lugares:'Places',personal:'Mine'},
    pt: {regiones:'Regiões',vehiculos:'Carros',misiones:'Missões',lugares:'Lugares',personal:'Meus'}
  };
  let queued=false;
  function update() {
    queued=false;
    const lang=(document.documentElement.lang||'es').slice(0,2);
    const translations=names[lang]||names.es;
    for(const map of document.querySelectorAll('.atlas-v119')) {
      const compact=matchMedia('(max-width:700px)').matches&&!map.classList.contains('vi-fullscreen-map');
      const chips=map.querySelectorAll('.atlas-map .vi-map-filter-chips > button[data-value]');
      for(const chip of chips) {
        const old=chip.dataset.vi215FullLabel||chip.textContent.trim();
        const short=translations[chip.dataset.value];
        if(compact&&short) {
          if(!chip.dataset.vi215FullLabel) {
            chip.dataset.vi215FullLabel=old;
            chip.setAttribute('aria-label',old);
            chip.title=old;
          }
          if(chip.textContent!==short)chip.textContent=short;
        } else if(chip.dataset.vi215FullLabel) {
          if(chip.textContent!==old)chip.textContent=old;
          delete chip.dataset.vi215FullLabel;
          chip.removeAttribute('aria-label');
          chip.removeAttribute('title');
        }
      }
    }
  }
  const schedule=()=>{if(!queued){queued=true;requestAnimationFrame(update)}};
  const root=document.getElementById('root');
  if(root)new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
  addEventListener('resize',schedule,{passive:true});
  addEventListener('hashchange',schedule);
  schedule();
})();
