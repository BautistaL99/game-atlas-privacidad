/* V160 - optional curated gallery and verified, same-category comparison.
 * No external APIs, generative AI, user progress writes or map updates.
 * Only explicitly reviewed gallery images; never infer extra screenshots.
 */
(function(root){'use strict';
 const supported=['vehiculos','armas','economia','mapa-lugares','misiones'];
 const names={es:{title:'Comparar elementos',intro:'Compará hasta tres elementos de la misma categoría. Solo se muestran datos publicados y verificados: no se inventan estadísticas.',choose:'Elegí una categoría',item:'Elegí un elemento',missing:'Sin datos verificados',notEnough:'Elegí al menos dos elementos distintos para comparar.',facts:'Características verificadas',gallery:'Imágenes de la ficha',photo:'Imagen',caption:'Imagen ilustrativa',compare:'⇄ Comparar con otro',source:'Consultar fuente',none:'Todavía no hay parámetros técnicos comparables para estos elementos.',available:'La galería tendrá más imágenes cuando se verifiquen fotografías adicionales del mismo elemento.'},en:{title:'Compare items',intro:'Compare up to three entries from the same category. Only published, verified data is shown.',choose:'Choose a category',item:'Choose an item',missing:'No verified data',notEnough:'Choose at least two different entries.',facts:'Verified specifications',gallery:'Entry images',photo:'Image',caption:'Illustrative image',compare:'⇄ Compare with another',source:'View source',none:'No verified comparable specifications yet.',available:'More images appear when additional pictures of this exact item are reviewed.'},pt:{title:'Comparar itens',intro:'Compare até três itens da mesma categoria. Somente dados publicados e verificados são exibidos.',choose:'Escolha uma categoria',item:'Escolha um item',missing:'Dados não verificados',notEnough:'Escolha dois itens diferentes.',facts:'Características verificadas',gallery:'Imagens da ficha',photo:'Imagem',caption:'Imagem ilustrativa',compare:'⇄ Comparar com outro',source:'Ver fonte',none:'Ainda não há informações técnicas verificadas para comparar.',available:'Novas imagens aparecerão quando fotos do mesmo item forem verificadas.'}};
 const cats={misiones:{es:'Misiones',en:'Missions',pt:'Missões'},vehiculos:{es:'Vehículos',en:'Vehicles',pt:'Veículos'},armas:{es:'Armas',en:'Weapons',pt:'Armas'},economia:{es:'Propiedades y negocios',en:'Properties and businesses',pt:'Imóveis e negócios'},'mapa-lugares':{es:'Lugares y edificios',en:'Places and buildings',pt:'Lugares e edifícios'}};
 const safe=s=>String(s===undefined||s===null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const tr=(obj,lang)=>typeof obj==='string'?obj:obj&&typeof obj==='object'?(obj[lang]||obj.es||obj.en||''):'';
 const validSource=url=>{try{const u=new URL(url);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&!u.hash&&['www.rockstargames.com','rockstargames.com'].includes(u.hostname)}catch{return false}};
 function safePhoto(url){
  if(typeof url!=='string'||url.length>550)return false;
  if(/^\.\/assets\/original\/[a-z-]+\.svg$/.test(url))return true;
  try{
   const u=new URL(url);
   if(u.protocol!=='https:'||u.username||u.password||u.port||u.hash)return false;
   if(u.hostname==='media-rockstargames-com.akamaized.net')
    return /^\/tina-uploads\/posts\/[a-z0-9_-]+\/[a-f0-9]{40}\.(?:jpe?g|png|webp)$/.test(u.pathname)&&!u.search;
   if(u.hostname==='www.rockstargames.com')
    return /^\/VI\/_next\/static\/media\/[a-zA-Z0-9._~%-]+\.(?:jpe?g|png|webp)$/.test(u.pathname)&&(!u.search||u.search==='?akim=1&imdensity=1&imwidth=1280');
  }catch{}
  return false;
 }
 function photos(item){
  const list=[],seen=new Set(),push=(src,caption,source)=>{
   if(!safePhoto(src)||seen.has(src)||list.length>=10)return;
   if(source&&!validSource(source))return;
   seen.add(src);list.push({src,caption:caption||{},source:source||''});
  };
  const main=item?.image;
  if(main&&main.type!=='concept'&&safePhoto(main.remote))push(main.remote,main.caption,main.officialPage);
  else if(main&&main.type!=='concept'&&safePhoto(main.data))push(main.data,main.caption,main.officialPage);
  // No external wiki imagery is trusted; a curated gallery is opt-in per item.
  for(const p of Array.isArray(item?.gallery)?item.gallery.slice(0,10):[]){
   if(!p||typeof p!=='object')continue;
   if(!p.caption||!['es','en','pt'].every(l=>typeof p.caption[l]==='string'&&p.caption[l].length>0))continue;
   push(p.src,p.caption,p.sourceUrl);
  }
  return list;
 }
 function gallery(item,lang,original){
  const pics=photos(item),t=names[lang]||names.es;
  if(pics.length===0)return original;
  if(pics.length===1){
   if(!Array.isArray(item.gallery)||item.gallery.length===0)return original;
   const p=pics[0];
   return '<div class="vi-reviewed-single-photo"><img class="detail-thumb" src="'+safe(p.src)+'" alt="'+safe(tr(p.caption,lang)||tr(item.title,lang))+'" loading="lazy" referrerpolicy="no-referrer"><small>'+safe(tr(p.caption,lang))+'</small></div>';
  }
  const slides=pics.map((p,i)=>'<div class="vi-gallery-slide" data-vi-gallery-slide="'+i+'"'+(i?' hidden':'')+'><img class="detail-thumb" src="'+safe(p.src)+'" alt="'+safe(tr(p.caption,lang)||tr(item.title,lang))+'" loading="'+(i?'lazy':'eager')+'" referrerpolicy="no-referrer"><div class="vi-gallery-slide-caption">'+safe(tr(p.caption,lang))+(p.source?'<a href="'+safe(p.source)+'" target="_blank" rel="noopener noreferrer">↗</a>':'')+'</div></div>').join('');
  const thumbs=pics.map((p,i)=>'<button type="button" data-vi-gallery-index="'+i+'" aria-label="'+safe(t.photo)+' '+(i+1)+'" aria-pressed="'+(!i)+'"><img src="'+safe(p.src)+'" loading="lazy" alt=""></button>').join('');
  return '<section class="vi-gallery" aria-label="'+safe(t.gallery)+'" data-active="0"><div class="vi-gallery-stage">'+slides+'<button type="button" class="vi-gallery-nav vi-prev" data-vi-gallery-arrow="-1" aria-label="Anterior">‹</button><button type="button" class="vi-gallery-nav vi-next" data-vi-gallery-arrow="1" aria-label="Siguiente">›</button><span class="vi-gallery-counter" aria-live="polite">1 / '+pics.length+'</span></div><div class="vi-gallery-thumbs">'+thumbs+'</div></section>';
 }
 function compareLink(item,lang){
  if(!item||!supported.includes(item.category))return '';
  const t=names[lang]||names.es;
  return '<a class="vi-detail-compare" href="#/comparar?cat='+encodeURIComponent(item.category)+'&ids='+encodeURIComponent(item.id)+'">'+safe(t.compare)+'</a>';
 }
 function params(){
  let q='';try{q=(root.location?.hash||'').split('?')[1]||''}catch{}
  return new URLSearchParams(q);
 }
 function state(records){
  const query=params();const requested=query.get('cat');const cat=supported.includes(requested)?requested:'vehiculos';
  const choices=records.filter(r=>r.status==='verified'&&r.category===cat&&r.recordType!=='story_overview').sort((a,b)=>tr(a.title,'es').localeCompare(tr(b.title,'es')));
  const raw=(query.get('ids')||'').split(',').filter(Boolean).slice(0,3);
  const allowed=new Set(choices.map(r=>r.id));const ids=[];
  for(const id of raw){if(allowed.has(id)&&!ids.includes(id))ids.push(id)}
  return {cat,choices,ids,selected:ids.map(id=>choices.find(r=>r.id===id))};
 }
 function comparePage(records,lang){
  const t=names[lang]||names.es,s=state(records);
  const categorySelect='<label>'+safe(t.choose)+'<select data-vi-compare-cat>'+supported.map(cat=>'<option value="'+cat+'"'+(cat===s.cat?' selected':'')+'>'+safe(cats[cat][lang]||cats[cat].es)+'</option>').join('')+'</select></label>';
  const selectors=[0,1,2].map(slot=>'<label>'+(slot+1)+'. '+safe(t.item)+'<select data-vi-compare-slot="'+slot+'"><option value="">—</option>'+s.choices.map(r=>'<option value="'+safe(r.id)+'"'+(s.ids[slot]===r.id?' selected':'')+'>'+safe(tr(r.title,lang))+'</option>').join('')+'</select></label>').join('');
  const header='<section class="vi-compare-page"><div class="vi-compare-intro"><span class="eyebrow">GAME ATLAS · V160</span><h1>'+safe(t.title)+'</h1><p>'+safe(t.intro)+'</p></div><div class="vi-compare-controls">'+categorySelect+selectors+'</div>';
  if(s.selected.length<2)return header+'<p class="vi-compare-message">'+safe(t.notEnough)+'</p></section>';
  const items=s.selected,labels=[],labelSet=new Set();
  for(const r of items)for(const f of r.facts||[]){
   if(f?.verified!==true||!f.key||!f.value)continue;
   const key=String(f.key).trim().toLocaleLowerCase('es');
   if(!labelSet.has(key)){labelSet.add(key);labels.push(f.key)}
  }
  const cards=items.map(r=>'<th scope="col"><a href="#/ficha/'+encodeURIComponent(r.id)+'">'+safe(tr(r.title,lang))+'</a></th>').join('');
  const rows=labels.map(key=>'<tr><th scope="row">'+safe(key)+'</th>'+items.map(r=>{
    const f=(r.facts||[]).find(f=>f?.verified===true&&String(f.key).toLocaleLowerCase('es')===key.toLocaleLowerCase('es'));
    return '<td>'+safe(f?f.value:t.missing)+'</td>';
  }).join('')+'</tr>').join('');
  const table=labels.length?'<div class="vi-compare-scroll"><table><thead><tr><th scope="col">'+safe(t.facts)+'</th>'+cards+'</tr></thead><tbody>'+rows+'</tbody></table></div>':'<p class="vi-compare-message">'+safe(t.none)+'</p>';
  const sources='<div class="vi-compare-sources">'+items.map(r=>{
   const src=(r.sources||[]).find(x=>validSource(x.url));
   return src?'<a href="'+safe(src.url)+'" target="_blank" rel="noopener noreferrer">'+safe(tr(r.title,lang))+' ↗ '+safe(t.source)+'</a>':'';
  }).join('')+'</div>';
  return header+table+sources+'</section>';
 }
 function setSlide(box,index){
  const slides=[...box.querySelectorAll('[data-vi-gallery-slide]')],n=slides.length;
  if(!n)return;
  const next=(index+n)%n;box.dataset.active=String(next);
  for(const slide of slides)slide.hidden=Number(slide.dataset.viGallerySlide)!==next;
  for(const thumb of box.querySelectorAll('[data-vi-gallery-index]'))thumb.setAttribute('aria-pressed',String(Number(thumb.dataset.viGalleryIndex)===next));
  const counter=box.querySelector('.vi-gallery-counter');if(counter)counter.textContent=(next+1)+' / '+n;
 }
 // A comparison filter is local UI state, not a new page navigation.
 // replaceState avoids hashchange, which globally resets scroll and the whole viewport.
 function updateCompare(e){
  const cat=e.target.closest?.('[data-vi-compare-cat]');
  const select=e.target.closest?.('[data-vi-compare-slot]');
  if(!cat&&!select)return;
  if(!root.location.hash.startsWith('#/comparar'))return;
  const controls=document.querySelector('.vi-compare-controls');
  const before=controls?.getBoundingClientRect().top;
  const previousY=root.scrollY;
  const catVal=cat?.value||document.querySelector('[data-vi-compare-cat]')?.value||'vehiculos';
  const ids=cat?[]:[...new Set([...document.querySelectorAll('[data-vi-compare-slot]')].map(x=>x.value).filter(Boolean))].slice(0,3);
  const next='#/comparar?cat='+encodeURIComponent(catVal)+(ids.length?'&ids='+encodeURIComponent(ids.join(',')):'');
  root.history.replaceState(root.history.state,'',next);
  if(!root.viRefreshComparison?.())root.viRefreshApp?.();
  const restore=()=>{
   const replacement=document.querySelector('.vi-compare-controls');
   const target=before!=null&&replacement?root.scrollY+replacement.getBoundingClientRect().top-before:previousY;
   root.scrollTo({top:Math.max(0,target),behavior:'instant'});
  };
  restore();
  root.requestAnimationFrame(restore);
 }
 if(typeof document!=='undefined'){
  document.addEventListener('change',updateCompare);
  document.addEventListener('click',e=>{
   const arrow=e.target.closest?.('[data-vi-gallery-arrow]');
   const dot=e.target.closest?.('[data-vi-gallery-index]');
   if(!arrow&&!dot)return;
   const box=(arrow||dot).closest('.vi-gallery');if(!box)return;
   e.preventDefault();
   setSlide(box,arrow?Number(box.dataset.active||0)+Number(arrow.dataset.viGalleryArrow):Number(dot.dataset.viGalleryIndex));
  });
  const touches=new WeakMap();
  document.addEventListener('touchstart',e=>{const box=e.target.closest?.('.vi-gallery-stage');if(box&&e.touches.length===1)touches.set(box,{x:e.touches[0].clientX,y:e.touches[0].clientY})},{passive:true});
  document.addEventListener('touchend',e=>{
   const box=e.target.closest?.('.vi-gallery-stage'),start=box&&touches.get(box);
   if(!start||!e.changedTouches.length)return;touches.delete(box);
   const dx=e.changedTouches[0].clientX-start.x,dy=e.changedTouches[0].clientY-start.y;
   if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.3)setSlide(box,Number(box.dataset.active||0)+(dx<0?1:-1));
  },{passive:true});
 }
 root.viDetailEnhancements={photos,gallery,compareLink,comparePage,safePhoto,state};
})(typeof window!=='undefined'?window:globalThis);
