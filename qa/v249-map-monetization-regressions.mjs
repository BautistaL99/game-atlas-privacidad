/* Game Atlas V249 — deterministic cross-platform regressions; NO fake IAP/ads. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const cwd=process.cwd();
const sub=process.argv.includes('--ios')?'www': 'app';
const read=f=>fs.readFileSync(path.join(cwd,sub,f),'utf8');
const app=read('app-v137.js'),suggest=read('atlas-v247-ios-v241-qa.js'),mon=read('monetization-v249.js'),css=read('game-atlas-v249-fixes.css');
function section(start,end){const a=app.indexOf(start),b=app.indexOf(end,a+start.length);assert(a>=0&&b>a,'Missing '+start);return app.slice(a,b)}
const norm=v=>String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
const stop=new Set('donde dónde encontrar where to find onde procurar de do da las los el la the un una uno en at near'.split(' '));
const ctx={normalizeSearch:norm,viMapNormalized:norm,viMapQueryWords:q=>norm(q).split(' ').filter(v=>v&&!stop.has(v)),mapFilterCategories:[
 {id:'tiendas-armas',name:'Tiendas de armas'},{id:'armas',name:'Armas'},{id:'vehiculos',name:'Vehículos'},
 {id:'misiones',name:'Misiones'},{id:'garajes',name:'Garajes'}, {id:'lugares',name:'Lugares'}, {id:'economia',name:'Negocios'}],
 mapCategoryNames:{en:{'tiendas-armas':'Gun stores',armas:'Weapons',vehiculos:'Vehicles',garajes:'Garages',lugares:'Places'},pt:{'tiendas-armas':'Lojas de armas',armas:'Armas',vehiculos:'Veículos',garajes:'Oficinas',lugares:'Lugares'}},
 mapItem:()=>null,viMapNouns:new Set(),phrase:(s,q)=>s.includes(q),store:()=>[],mapCatalogMatches:()=>new Set(),mapQuery:'',mapCategories:[],mapSpotlightId:null,mapSpotlightHidden:false,
 mapPopupOpen:true,mapActive:null,mapMissing:false,mapCompleted:false,mapFavOnly:false,mapRouteOnly:false,mapRouteDisplay:null,allMapPins:()=>[],mapUpdate:()=>{},mapResults:()=>[]};
vm.createContext(ctx);
vm.runInContext(section('function viMapDerivedCategories(p){','function viMapCategoryIntent(raw){'),ctx);
const orig=JSON.parse(read('assets/leonida-landmarks-v216.json')).items.filter(p=>p.kind==='community');
const guns=orig.filter(p=>ctx.viMapDerivedCategories(p).includes('tiendas-armas'));
const cars=orig.filter(p=>ctx.viMapDerivedCategories(p).includes('vehiculos'));
assert.equal(guns.length,3,'Expected actual gun stores in original data');
assert.equal(cars.length,18,'Expected actual vehicle service POIs');
assert(guns.some(p=>p.title.includes('Pawn & Gun')));
vm.runInContext(section('function viMapCategoryIntent(raw){','function mapMatches(p,q,linkedIds){'),ctx);
for(const q of ['armas','weapons','armas de fuego'])assert.deepEqual(Array.from(ctx.viMapCategoryIntent(q)),['tiendas-armas','armas'],q);
for(const q of ['vehiculos','vehicles','veículos'])assert.deepEqual(Array.from(ctx.viMapCategoryIntent(q)),['vehiculos'],q);
vm.runInContext(section('function mapMatches(p,q,linkedIds){','function mapCatalogMatches(q){'),ctx);
assert(ctx.mapMatches(guns[0],'armas',new Set()));assert(ctx.mapMatches(cars[0],'vehicles',new Set()));
const pins=[{id:'gun1',category:'tiendas-armas',title:'Gun Shop'}, {id:'gun2',category:'tiendas-armas',title:'Store B'},{id:'mission',category:'misiones',title:'Mission'},{id:'car1',category:'vehiculos',title:'Vehicle'}];
ctx.allMapPins=()=>pins;ctx.mapCategories=[];ctx.mapQuery='armas';ctx.mapResults=()=>pins.filter(p=>p.category==='tiendas-armas');
vm.runInContext('viMapPrepareSearch(mapQuery);',ctx);assert.deepEqual(Array.from(ctx.mapCategories),['tiendas-armas','armas']);
vm.runInContext(section('const mapShown=()=>{','let mobileMapFiltersOpen=')+';globalThis.mapShown=mapShown;',ctx);
ctx.mapQuery='';ctx.mapCategories=[];ctx.mapSpotlightId='gun1';ctx.mapSpotlightHidden=false;
assert.deepEqual(Array.from(ctx.mapShown(),p=>p.id),['gun1']);
ctx.mapSpotlightHidden=true;assert.deepEqual(Array.from(ctx.mapShown(),p=>p.id),['gun1']);
ctx.mapCategories=['tiendas-armas','vehiculos'];assert.deepEqual(Array.from(ctx.mapShown(),p=>p.id),['gun1','gun2','car1']);
ctx.mapRouteDisplay={id:'r1'};ctx.mapRouteOnly=true;
assert.deepEqual(Array.from(ctx.mapShown(),p=>p.id),[],'Only route should hide all map POI pins');
ctx.mapRouteOnly=false;
let updates=0;ctx.mapUpdate=()=>updates++;ctx.mapDX=15;ctx.mapDY=-33;ctx.mapZoom=2.4;
vm.runInContext(section('function viDismissMapBackdrop(){','function mapBind(){'),ctx);
ctx.mapSpotlightHidden=false;ctx.mapActive='gun1';ctx.mapPopupOpen=true;ctx.mapQuery='';
ctx.viDismissMapBackdrop();assert.equal(ctx.mapSpotlightId,'gun1');assert.equal(ctx.mapSpotlightHidden,true);assert.equal(ctx.mapPopupOpen,false);
ctx.viDismissMapBackdrop();assert.equal(ctx.mapSpotlightId,'gun1','Keep remembered pin on second tap');
assert.equal(ctx.mapDX,15);assert.equal(ctx.mapDY,-33);assert.equal(updates,2);
assert(app.includes("if(a==='route-only')"),'Route-only toggle is wired');
assert(app.includes('vi-v249-route-only'),'Route-only button renders');
assert(app.includes("if(mapSpotlightId)mapSpotlightHidden=true;mapPopupOpen=true;mapActive=v"),'Pin selection retains remembered location');
assert(app.includes('vi:map-pins-ready'),'Async map data load signals suggestion refresh');
assert(suggest.includes('window.viIosMapSuggestionsRefresh')&&suggest.includes("'vi:map-pins-ready'"),'Autocomplete refetch after async POIs');
assert(css.includes('grid-template-columns:minmax(0,1fr)')&&css.includes('vi-v249-route-only'));
assert(app.includes("if(route==='/pagos')return billingPageV249()"),'Native payments route');
assert(app.includes('viNativePlatformV249()!==\'web\''),'Native-only payments navigation');
assert(mon.includes('billingEnabled:false')&&mon.includes('advertisingEnabled:false')&&mon.includes('purchaseAvailable(){return false;}'),'Never simulate payment or ad-free status');
assert((read('index.html').includes('monetization-v249.js')||read('index.html').includes('monetization-v250.js'))&&(read('index.html').includes('game-atlas-v249-fixes.css')||read('index.html').includes('game-atlas-v250-fixes.css')));
console.log('PASS V249: 3 real gun-store POIs, 18 vehicle POIs, ES/EN/PT intents');
console.log('PASS V249: remembered map spotlight remains through filters and backdrop, route-only hides POIs');
console.log('PASS V249: late results refresh, layout, store-facing payment prep, no fake entitlement, ads gated');
