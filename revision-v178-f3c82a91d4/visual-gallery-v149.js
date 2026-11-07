/* GTA VI web gallery mapping — every built-in catalogue record has its own contextually relevant
   Rockstar Games official screenshot. Images load FROM Rockstar, not copied to our host.
   Origin: https://www.rockstargames.com/VI/media/screenshots
   This is an independent companion, not Rockstar's official app.
   Web-only presentation: do not change Play Store Android bundles with this skin. */
(() => {
 'use strict';
 if(window.Capacitor?.isNativePlatform?.() || document.documentElement.classList.contains('vi-native-app')) return;
 const base='https://www.rockstargames.com/VI/_next/static/media/';
 const assets={
 "vice-1": "Vice_City_01.135x56yoeu.6t.jpg",
 "vice-2": "Vice_City_02.0c5.7qx17u9kl.jpg",
 "vice-3": "Vice_City_03.0nqz~lrqdmlze.jpg",
 "vice-4": "Vice_City_04.06evqutgh7624.jpg",
 "vice-5": "Vice_City_05.0~r~o0jzpp4a-.jpg",
 "vice-6": "Vice_City_06.0_tdmr3u9w84x.jpg",
 "vice-7": "Vice_City_07.0b3mhak4k78oh.jpg",
 "vice-8": "Vice_City_08.0bbg_xp4hqdvz.jpg",
 "vice-9": "Vice_City_09.0~ng.c8ack3fp.jpg",
 "vice-10": "Vice_City_10.0f1q-xa_4q8r2.jpg",
 "vice-11": "Vice_City_11.09paum3g942sc.jpg",
 "keys-1": "Leonida_Keys_01.0zgz7tveur6y8.jpg",
 "keys-2": "Leonida_Keys_02.0~ptk-53gl0lq.jpg",
 "keys-3": "Leonida_Keys_03.0v_3~-9ceyixc.jpg",
 "keys-4": "Leonida_Keys_04.0hce1rw1s8pd9.jpg",
 "port-1": "Port_Gellhorn_01.0fmisvza-5-cq.jpg",
 "port-2": "Port_Gellhorn_02.00e7cz6lwrup-.jpg",
 "port-3": "Port_Gellhorn_03.00c2b0eh7sm~q.jpg",
 "port-4": "Port_Gellhorn_04.0hd-7kzfi51q..jpg",
 "amb-1": "Ambrosia_01.0rqphs0gazkm..jpg",
 "amb-2": "Ambrosia_02.0wtqs05ozl.ym.jpg",
 "amb-3": "Ambrosia_03.0vt46a.1s.7-y.jpg",
 "amb-4": "Ambrosia_04.0.2cefoguu-tt.jpg",
 "grass-1": "Grassrivers_01.1096rw4lbjur_.jpg",
 "grass-2": "Grassrivers_02.0teqs5xe2pem1.jpg",
 "grass-3": "Grassrivers_03.14cuv-vg9orw4.jpg",
 "kalaga-1": "Mount_Kalaga_National_Park_01.0v5fl0f83hjv_.jpg",
 "kalaga-2": "Mount_Kalaga_National_Park_02.0f24dhopdprvx.jpg",
 "kalaga-3": "Mount_Kalaga_National_Park_03.037k2s87rwuxc.jpg",
 "jasonlucia": "Jason_and_Lucia_01.0naeahss9-1x6.jpg",
 "jason-1": "Jason_Duval_01.07m377xeb6jhq.jpg",
 "jason-2": "Jason_Duval_02.1486~7_v40cn..jpg",
 "lucia-1": "Lucia_Caminos_01.0a7yqvewctkfp.jpg",
 "lucia-2": "Lucia_Caminos_02.16n.5umvlu_48.jpg",
 "cal": "Cal_Hampton_01.0xlil231_osh4.jpg",
 "boobie": "Boobie_Ike_01.0-wji2pg5anfs.jpg",
 "dre": "DreQuan_Priest_01.0_0~wi-ipdj35.jpg",
 "dimez": "Real_Dimez_01.0djwwboo8-glx.jpg",
 "raul": "Raul_Bautista_01.0md1ii-yrn96r.jpg",
 "brian": "Brian_Heder_01.0r.ute88os9k-.jpg",
 "cheetah": "ULTIMATE_EDITION_GROTTI_CHEETAH_01.0a.wy3s_ogjey.jpg",
 "cheetah-2": "ULTIMATE_EDITION_GROTTI_CHEETAH_02.0rkrlsu_dg~ww.jpg",
 "guns": "ULTIMATE_EDITION_HAWK_AND_LITTLE_MORGAN_REVOLVERS_01.0~3pdc~~sing4.jpg",
 "gun-variants": "ULTIMATE_EDITION_WEAPON_VARIANTS_01.12licq0_o7mb5.jpg",
 "safehouse-1": "ULTIMATE_EDITION_SAFEHOUSE_VEHICLES_01.0wv6pw3t-mky3.jpg",
 "safehouse-2": "ULTIMATE_EDITION_SAFEHOUSE_VEHICLES_02.0-2n5rm9n8.rq.jpg",
 "ganado": "ULTIMATE_EDITION_VAPID_GANADO_RETRO_BUILD_01.062dgvkwdynw5.jpg",
 "rideout": "ULTIMATE_EDITION_RIDEOUT_CUSTOMS_01.065-ms8~k8vbq.jpg",
 "rideout-2": "ULTIMATE_EDITION_RIDEOUT_CUSTOMS_02.0u9jg4xxbm_yd.jpg",
 "salon": "ULTIMATE_EDITION_SARAS_SALON_01.0gn7dwlvcgz17.jpg",
 "squalo": "ULTIMATE_EDITION_SQUALO_01.0cim7hj58ypb1.jpg",
 "buggy": "ULTIMATE_EDITION_VAPID_BUGGY_01.0jxfiql~371ik.jpg",
 "buggy-2": "ULTIMATE_EDITION_VAPID_BUGGY_02.0tf15jp~61bkj.jpg",
 "stanier": "VINTAGE_VICE_CITY_PACK_VAPID_STANIER_01.004m_8d1~qngy.jpg",
 "collection": "ULTIMATE_EDITION_WYMAN_CAR_COLLECTION_01.0swhrm__iu~6b.jpg",
 "vintage": "VINTAGE_VICE_CITY_PACK_01.05zaof7o1uz.3.jpg",
 "stock": "ULTIMATE_EDITION_STOCK_305_01.0vuq0m5_1j-17.jpg",
 "tattoo": "ULTIMATE_EDITION_ELECTRIC_FANG_01.04tsytu7qp2b-.jpg",
 "one-eyed": "ULTIMATE_EDITION_ONE_EYED_WILLIE_01.0n7-__or5f.b6.jpg"
};
 const cards={
 "personalizacion-estetica": "salon",
 "personalizacion-vehiculos": "rideout",
 "anuncio-ediciones": "cheetah-2",
 "anuncio-radio-octubre": "vice-7",
 "fecha-lanzamiento": "jasonlucia",
 "trailer-extendido": "vice-4",
 "trailer-lanzamiento-2026": "jason-2",
 "hawk-little-morgan-revolvers": "guns",
 "variantes-personalizadas-armas": "gun-variants",
 "classic-car-collection": "collection",
 "vintage-vice-city-pack": "vintage",
 "negocios-boobie-ike": "boobie",
 "only-raw-records": "dre",
 "ambrosia": "amb-1",
 "electric-fang-tattoo": "tattoo",
 "grassrivers": "grass-1",
 "leonida-keys": "keys-1",
 "mount-kalaga": "kalaga-1",
 "one-eyed-willies": "one-eyed",
 "port-gellhorn": "port-1",
 "ptt-youngins": "port-4",
 "rideout-customs": "rideout-2",
 "saras-unisex-salon": "salon",
 "stock-305": "stock",
 "vice-city": "vice-11",
 "premisa-jason-lucia": "jasonlucia",
 "afro-bank-fm": "vice-1",
 "back-country-radio": "kalaga-2",
 "cocoteo": "vice-3",
 "dirty-south-classics": "amb-2",
 "flash-fm": "vice-5",
 "gta-vi-the-album": "vice-6",
 "original-score-justice": "vice-8",
 "radio-gta6": "vice-9",
 "the-chamber": "vice-10",
 "boobie-ike": "boobie",
 "brian-heder": "brian",
 "cal-hampton": "cal",
 "dre-quan-priest": "dre",
 "jason-duval": "jason-1",
 "lucia-caminos": "lucia-1",
 "raul-bautista": "raul",
 "real-dimez": "dimez",
 "55-vapid-stanier": "stanier",
 "67-vapid-dominator-buggy": "buggy",
 "95-grotti-cheetah": "cheetah",
 "crest-kayak": "keys-3",
 "dinka-enduro": "safehouse-2",
 "ganado-retro-build": "ganado",
 "shitzu-squalo": "squalo"
};
 const categories={
 "vehiculos": "cheetah",
 "armas": "guns",
 "misiones": "jasonlucia",
 "mapa-lugares": "vice-11",
 "coleccionables": "collection",
 "secretos": "grass-3",
 "economia": "amb-4",
 "personajes": "lucia-2",
 "actividades": "rideout",
 "mundo": "keys-4",
 "actualizaciones": "vice-2",
 "herramientas": "safehouse-1"
};
 const hero=["vice-11","vice-9","jasonlucia","cheetah-2","lucia-1"], showcase=["vice-4","jason-2","keys-1","gun-variants","cheetah"], community=["vice-3","vice-5","jason-2","vice-7"], editorial=["vice-11","grass-2"],rankings=["buggy-2","vice-6"];
 const photo=k=>assets[k]?base+assets[k]+'?akim=1&imdensity=1&imwidth=1280':null;
 const imageBackground=(element,k,overlay='linear-gradient(0deg,#041326a3,transparent 75%)')=>{
   if(!element || !photo(k) || element.dataset.viPhoto===k)return;
   const old=element.style.backgroundImage||"url('./assets/original/scene.svg')";
   element.dataset.viPhoto=k;
   element.style.setProperty('background-image',overlay+',url("'+photo(k)+'"),'+old,'important');
   element.style.backgroundSize='cover';
   element.style.backgroundPosition='center';
 };
 const imageSource=(img,k)=>{
   if(!img||!photo(k)||img.dataset.viPhoto===k)return;
   // An explicitly reviewed official Newswire image is the source image.
   // Never silently replace it with a context photo from this presentation map.
   const actual=img.getAttribute('src')||'';
   if(/^https:\/\/media-rockstargames-com\.akamaized\.net\/tina-uploads\/posts\//i.test(actual))return;
   img.dataset.viPhoto=k;
   const fallback=img.getAttribute('src')||'./assets/original/scene.svg';
   img.addEventListener('error',function onFail(){
     if(img.dataset.viPhoto===k){img.dataset.viPhoto='failed:'+k;img.src=fallback}
   },{once:true});
   img.src=photo(k);
   img.referrerPolicy='strict-origin-when-cross-origin';
   img.loading='lazy';
 };
 // Safety net for previous releases: remove generic landscape thumbnails
 // from unconfirmed community stories, even if an old catalog script was cached.
 // Uses no remote media and does not mutate the catalog or user data.
 function repairCommunityRumorCovers(){
  const lang=['es','en','pt'].includes(document.documentElement.lang)?document.documentElement.lang:'es';
  const labels={
   es:{domains:['🌐','Rumor sobre dominios','Sin imagen verificada'],devkit:['⚙','Rumor sobre desarrollo','Sin imagen verificada'],general:['✦','Rumor de la comunidad','Sin imagen verificada']},
   en:{domains:['🌐','Domain rumour','No verified image'],devkit:['⚙','Development rumour','No verified image'],general:['✦','Community rumour','No verified image']},
   pt:{domains:['🌐','Rumor sobre domínios','Sem imagem verificada'],devkit:['⚙','Rumor sobre desenvolvimento','Sem imagem verificada'],general:['✦','Rumor da comunidade','Sem imagem verificada']}
  };
  function replaceCover(host,id){
   const current=host.querySelector('.thumb,.search-thumb,.detail-thumb,.vi-news-image');
   if(!current||current.querySelector?.('.vi-community-art-icon'))return;
   const group=/domains?/.test(id)?'domains':/devkit|development/.test(id)?'devkit':'general';
   const [icon,label,note]=labels[lang][group];
   const span=document.createElement('span');
   span.className=[...current.classList].filter(c=>c!=='vi-news-rumor-photo').join(' ')+' vi-community-art vi-community-art-'+group;
   span.setAttribute('role','img');
   span.setAttribute('aria-label',label+' — '+note);
   const symbol=document.createElement('span');symbol.className='vi-community-art-icon';symbol.setAttribute('aria-hidden','true');symbol.textContent=icon;
   const caption=document.createElement('span');caption.className='vi-community-art-caption';
   const strong=document.createElement('strong');strong.textContent=label;
   const small=document.createElement('small');small.textContent=note;
   caption.append(strong,small);span.append(symbol,caption);
   current.replaceWith(span);
  }
  const visited=new Set();
  for(const link of document.querySelectorAll('a[href*="/ficha/community-"]')){
   const host=link.closest('.content-card,.search-result,.vi-news-card,.detail-card');
   if(!host||visited.has(host))continue;
   const id=(link.getAttribute('href')||'').match(/\/ficha\/(community-[a-z0-9_-]+)/)?.[1];
   if(!id)continue;
   visited.add(host);replaceCover(host,id);
  }
  const detail=location.hash.match(/^#\/ficha\/(community-[a-z0-9_-]+)/)?.[1];
  if(detail)for(const host of document.querySelectorAll('.detail-card'))replaceCover(host,detail);
 }
 function apply(){
   if(window.Capacitor?.isNativePlatform?.())return;
   document.documentElement.classList.add('vi-real-gallery');
   for(const el of document.querySelectorAll('a.category-tile')){
     const href=el.getAttribute('href')||'';
     const category=href.match(/\/explorar\/([a-z-]+)/)?.[1];
     if(category && categories[category])imageBackground(el.querySelector('.category-art'),categories[category]);
     else if(href.includes('/rankings/speedruns'))imageBackground(el.querySelector('.ranking-tile-art'),rankings[0]);
     else if(href.includes('/rankings/donaciones'))imageBackground(el.querySelector('.ranking-tile-art'),rankings[1]);
   }
   for(const el of document.querySelectorAll('.category-cover')){
     const id=(location.hash.match(/\/explorar\/([a-z-]+)/)||[])[1];
     if(id && categories[id])imageBackground(el,categories[id],'linear-gradient(90deg,#071222f2,#071222b3 50%,#07122238)');
   }
   for(const img of document.querySelectorAll('img.thumb,img.search-thumb,img.detail-thumb')){
     const host=img.closest('article,.detail-card,.search-result')||img.parentElement;
     const url=img.closest('a[href*="/ficha/"]')?.getAttribute('href')||host?.querySelector('a[href*="/ficha/"]')?.getAttribute('href')||'';
     const current=img.matches('.detail-thumb') ? (location.hash.match(/\/ficha\/([a-z0-9_-]+)/)||[])[1] : null;
     const id=(url.match(/\/ficha\/([a-z0-9_-]+)/)||[])[1]||current;
     if(id && cards[id])imageSource(img,cards[id]);
   }
   document.querySelectorAll('.home-permanent-art').forEach((el,i)=>imageBackground(el,hero[i%hero.length],'linear-gradient(90deg,#081629bd,#07152733 75%,transparent)'));
   document.querySelectorAll('.v18-slide-photo').forEach((el,i)=>imageBackground(el,showcase[i%showcase.length],'linear-gradient(90deg,#08172de8,#07152633 80%,transparent)'));
   document.querySelectorAll('.youtube-tile-art').forEach((el,i)=>imageBackground(el,community[i%community.length]));
   document.querySelectorAll('.news-panel .news-story img').forEach((el,i)=>{if(!el.getAttribute('src')?.startsWith('https://media-rockstargames-com.akamaized.net/'))imageSource(el,editorial[i%editorial.length]);});
   document.querySelectorAll('.ranking-hero-art').forEach(el=>imageBackground(el,location.hash.includes('donaciones')?rankings[1]:rankings[0]));
   repairCommunityRumorCovers();
   // Web-only My Game HUD: preserve native layout, local progress and all buttons.
   for(const row of document.querySelectorAll('.v120-progress-row,.progress-tile')){
     const link=row.getAttribute('href')||'';
     const cat=link.match(/\/explorar\/([a-z-]+)/)?.[1];
     const key=categories[cat];
     if(key&&photo(key))row.style.setProperty('--progress-image','url("'+photo(key)+'")','important');
   }
   const sidebar=document.querySelector('.sidebar');
   if(sidebar&&photo('vice-6'))sidebar.style.setProperty('--vi-sidebar-photo','url("'+photo('vice-6')+'")');

   const credit=document.querySelector('.v18-showcase-note');
   if(credit)credit.textContent=document.documentElement.lang==='en'?'Official promotional screenshots © Rockstar Games / Take-Two. Independent companion, not affiliated.':document.documentElement.lang==='pt'?'Capturas promocionais oficiais © Rockstar Games / Take-Two. Guia independente, não afiliado.':'Imágenes promocionales oficiales © Rockstar Games / Take-Two. Guía independiente, no afiliada.';
 }
 let queued=false;
 function schedule(){
  if(queued)return;
  queued=true;
  requestAnimationFrame(()=>{queued=false;apply()});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
 const observer=new MutationObserver(mutations=>{if(mutations.some(m=>m.addedNodes.length||m.removedNodes.length))schedule()});
 observer.observe(document.body,{subtree:true,childList:true});
 addEventListener('hashchange',schedule);
 document.addEventListener('vi:catalog-refresh',schedule);
 window.viGalleryPhotoMap=()=>({records:Object.keys(cards).length,categories:Object.keys(categories).length,officialImages:Object.keys(assets).length});
})();
