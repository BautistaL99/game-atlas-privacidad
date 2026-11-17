/* Game Atlas V248 — source-derived, deterministic map state regressions.
   Runs on Node 22 before Android or iOS consumes paid macOS build minutes. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const root=process.cwd();
const app=fs.readFileSync(path.join(root,process.argv.includes('--ios')?'www/app-v137.js':'app/app-v137.js'),'utf8');
const css=fs.readFileSync(path.join(root,process.argv.includes('--ios')?'www/map-v248-focus-search.css':'app/map-v248-focus-search.css'),'utf8');
function section(start,end){
 const p=app.indexOf(start),q=app.indexOf(end,p+start.length);
 assert(p>=0&&q>p,'Missing '+start+' / '+end);
 return app.slice(p,q);
}
const norm=v=>String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
const stop=new Set('donde dónde encontrar where to find onde procurar de do da las los el la the un una uno en at near'.split(' '));
const ctx={
 normalizeSearch:norm,viMapNormalized:norm,
 viMapQueryWords:q=>norm(q).split(' ').filter(v=>v&&!stop.has(v)),
 mapFilterCategories:[
  {id:'tiendas-armas',name:'Tiendas de armas'},
  {id:'armas',name:'Armas'}, {id:'vehiculos',name:'Vehículos'},
  {id:'misiones',name:'Misiones'}, {id:'garajes',name:'Garajes'},
  {id:'lugares',name:'Lugares'}, {id:'economia',name:'Negocios'}
 ],
 mapCategoryNames:{
  en:{'tiendas-armas':'Gun stores',armas:'Weapons',vehiculos:'Vehicles',garajes:'Garages',lugares:'Places'},
  pt:{'tiendas-armas':'Lojas de armas',armas:'Armas',vehiculos:'Veículos',garajes:'Oficinas',lugares:'Lugares'}
 },
 mapItem:()=>null,
 viMapNouns:new Set(),
 phrase:(s,q)=>s.includes(q),
 store:()=>[],
 mapCatalogMatches:()=>new Set(),
 mapQuery:'',mapCategories:[],mapSpotlightId:null,mapSpotlightHidden:false,
 mapPopupOpen:true,mapActive:null,mapMissing:false,mapCompleted:false,mapFavOnly:false,
 allMapPins:()=>[],mapUpdate:()=>{},
 mapResults:()=>[]
};
vm.createContext(ctx);
vm.runInContext(section('function viMapCategoryIntent(raw){','function mapMatches(p,q,linkedIds){'),ctx);
const ids=q=>Array.from(ctx.viMapCategoryIntent(q));
assert.deepEqual(ids('armas'),['tiendas-armas','armas']);
assert.deepEqual(ids('weapons'),['tiendas-armas','armas']);
assert.deepEqual(ids('armas de fuego'),['tiendas-armas','armas']);
assert.deepEqual(ids('tiendas de armas'),['tiendas-armas']);
assert.deepEqual(ids('lojas de armas'),['tiendas-armas']);
assert.deepEqual(ids('gun shops'),['tiendas-armas']);
assert.deepEqual(ids('vehículos'),['vehiculos']);
assert.deepEqual(ids('vehicles'),['vehiculos']);
assert.deepEqual(ids('veículos'),['vehiculos']);
assert.deepEqual(ids('donde encontrar autos'),['vehiculos']);
assert.deepEqual(ids('where to find cars'),['vehiculos']);
assert.deepEqual(ids('onde encontrar carros'),['vehiculos']);
assert.deepEqual(ids('PTT YOUNGINS Illegal Goods Store'),[]);
vm.runInContext(section('function mapMatches(p,q,linkedIds){','function mapCatalogMatches(q){'),ctx);
assert(ctx.mapMatches({category:'tiendas-armas',title:'Gun Shop'},'armas',new Set()),'Armas must include existing gun-store pins');
assert(!ctx.mapMatches({category:'misiones',title:'Mission A'},'armas',new Set()),'Armas must not display missions');
assert(ctx.mapMatches({category:'vehiculos',title:'Mapped Vehicle'},'vehicles',new Set()),'Vehicle filters must show existing mapped cars');
const pins=[
 {id:'gun1',category:'tiendas-armas',title:'Gun Shop'},
 {id:'gun2',category:'tiendas-armas',title:'Store B'},
 {id:'mission',category:'misiones',title:'Mission'},
 {id:'car1',category:'vehiculos',title:'Vehicle'}
];
ctx.allMapPins=()=>pins;
ctx.mapCategories=[];
ctx.mapResults=()=>pins.filter(p=>p.category==='tiendas-armas');
ctx.mapQuery='armas';
vm.runInContext('viMapPrepareSearch(mapQuery);',ctx);
assert.deepEqual(Array.from(ctx.mapCategories),['tiendas-armas','armas'],'Armas resets unrelated categories');
ctx.mapCategories=[];
ctx.mapQuery='PTT YOUNGINS Illegal Goods Store';
vm.runInContext('viMapPrepareSearch(mapQuery);',ctx);
assert.deepEqual(Array.from(ctx.mapCategories),['tiendas-armas'],'Searching a specific place after Clear re-enables its category');
vm.runInContext(section('const mapShown=()=>{','let mobileMapFiltersOpen=')+';globalThis.mapShown=mapShown;',ctx);
ctx.mapQuery='';ctx.mapCategories=[];ctx.mapSpotlightId='gun1';ctx.mapSpotlightHidden=false;
assert.deepEqual(Array.from(ctx.mapShown(),p=>p.id),['gun1'],'Bright spotlight isolates the selected pin');
ctx.mapSpotlightHidden=true;
assert.deepEqual(Array.from(ctx.mapShown(),p=>p.id),['gun1'],'Pale highlighted pin persists even with filters cleared');
ctx.mapCategories=['tiendas-armas','vehiculos'];
assert.deepEqual(Array.from(ctx.mapShown(),p=>p.id),['gun1','gun2','car1'],'Nearby pins return while remembered pin stays');
let updates=0;ctx.mapUpdate=()=>updates++;ctx.mapDX=117;ctx.mapDY=-91;ctx.mapZoom=4.6;
vm.runInContext(section('function viDismissMapBackdrop(){','function mapBind(){'),ctx);
ctx.mapSpotlightId='gun1';ctx.mapSpotlightHidden=false;ctx.mapActive='gun1';ctx.mapPopupOpen=true;ctx.mapQuery='Gun Shop';
ctx.viDismissMapBackdrop();
assert.equal(ctx.mapSpotlightHidden,true);assert.equal(ctx.mapPopupOpen,false);
assert.equal(ctx.mapSpotlightId,'gun1');assert.equal(ctx.mapQuery,'');
assert.equal(ctx.mapDX,117);assert.equal(ctx.mapDY,-91);assert.equal(ctx.mapZoom,4.6);
ctx.viDismissMapBackdrop();
assert.equal(ctx.mapSpotlightId,null);assert.equal(ctx.mapActive,null);
assert.equal(ctx.mapDX,117);assert.equal(ctx.mapDY,-91);assert.equal(updates,2);
assert(app.includes("for(const pin of wanted)if(!existing.has(pin.id))stage.insertAdjacentHTML('beforeend',mapPinMarkup(pin))"),'Live search does not regenerate missing pin DOM');
assert(app.includes("if(!root||viMapFullscreen||"),'Fullscreen desktop search still docks into a narrow sidebar');
assert(app.includes("if(a==='clear'){mapSpotlightId=null;mapSpotlightHidden=false;mapPopupOpen=true;mapActive=null;mapQuery='';mapCategories=[];}"),'Clear must remove stale search and pins');
assert(app.includes("mapCategories=mapCategories.length===mapFilterCategories.length?[]:"),'Hide all toggle must be available');
assert(app.includes("if(mapSpotlightId)mapPopupOpen=false;else mapActive=null;"),'Popup X must not delete highlighted pin');
assert(css.includes('vi-map-spotlight-muted')&&css.includes('vi-v241-options'),'Pale pin and fullscreen suggestion CSS not present');
console.log('PASS V248: generic map categories ES/EN/PT and no invented locations');
console.log('PASS V248: Clear -> specific search reactivates matching markers');
console.log('PASS V248: pale spotlight, two-stage dismissal, positions preserved');
console.log('PASS V248: filters, popup close and desktop map search source checks');