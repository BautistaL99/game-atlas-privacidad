/** iOS V243 regression: marker selection must not be consumed by a map gesture.
 * Extract and exercise the ACTUAL mapBind event handlers without native tooling.
 * No network, Apple credentials, or source rewrites in this test. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
const code=fs.readFileSync(path.resolve('app/app-v137.js'),'utf8');
const a=code.indexOf('function mapBind(){');
const b=code.indexOf('/* V233: focus',a);
assert(a>=0&&b>a,'No se encontró el controlador real del mapa');
const beginDismiss=code.indexOf('function viDismissMapBackdrop(){');
assert(beginDismiss>0&&beginDismiss<a,'V248 backdrop dismissal helper must be defined before mapBind');
const handler=code.slice(beginDismiss,b);
function scenario(eventType,pointType){
 let updateCount=0;const events={};
 const marker={closest:q=>q==='.atlas-pin,.atlas-cluster'?{dataset:{map:'pin',value:'pin-B'}}:null};
 const background={closest:()=>null};
 const map={
  addEventListener:(ev,fn)=>(events[ev]??=[]).push(fn),
  querySelector:()=>null,getBoundingClientRect:()=>({left:0,top:0}),
  clientWidth:390,clientHeight:600,setPointerCapture:()=>{}
 };
 const scope={
  document:{getElementById:()=>map},
  mapDockSearch(){},mapTransform(){},viPositionMapSuggestions(){},viAlignLandscapeFilters(){},
  requestAnimationFrame(){},mapPanEnabled:true,
  mapAdd:false,mapActive:'pin-A',mapSpotlightId:null,mapSpotlightHidden:false,mapPopupOpen:true,mapQuery:'',mapDX:0,mapDY:0,
  mapUpdate(){updateCount++},Date,Math,
  viMapFit(){return 1},MAP_WIDTH:1200,MAP_HEIGHT:1600,
 };
 vm.createContext(scope);vm.runInContext(handler+'; mapBind();',scope);
 assert(events.touchstart?.length&&events.touchend?.length&&events.pointerdown?.length&&events.pointerup?.length,'Manejadores no registrados');
 if(eventType==='touch'){
  const point={clientX:100,clientY:100};
  events.touchstart[0]({touches:[point],target:pointType==='pin'?marker:background,cancelable:true,preventDefault(){}});
  events.touchend[0]({touches:[],changedTouches:[point],target:pointType==='pin'?marker:background});
 }else{
  const t=pointType==='pin'?marker:background;
  events.pointerdown[0]({pointerType:'mouse',button:0,target:t,clientX:100,clientY:100,pointerId:9});
  events.pointerup[0]({pointerType:'mouse',button:0,target:t,clientX:100,clientY:100,pointerId:9});
 }
 return {updateCount,active:scope.mapActive};
}
for(const type of ['touch','pointer']){
 const pin=scenario(type,'pin');
 assert.equal(pin.updateCount,0,type+': el gesto sobre un segundo marcador cerró la ficha anterior');
 assert.equal(pin.active,'pin-A',type+': la ficha activa se borró antes del click del nuevo marcador');
 const bg=scenario(type,'background');
 assert.equal(bg.updateCount,1,type+': tocar el fondo no cerró la ficha');
 assert.equal(bg.active,null,type+': la ficha siguió abierta al tocar el fondo');
 console.log('OK '+type+': segundo marcador conserva click; fondo cierra ficha');
}
assert(code.includes("else if(a==='pin'){"),'El controlador principal de pin desapareció');
console.log('PASSED: marcador A → B con un toque, y cierre al tocar el fondo (touch/mouse)');