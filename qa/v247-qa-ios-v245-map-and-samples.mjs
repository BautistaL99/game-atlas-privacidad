// iOS-only V245 regression: neutral search examples and route-only map view.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const js=readFileSync(resolve('app/app-v137.js'),'utf8');
const start=js.indexOf('const homeSearchCopy={'),end=js.indexOf('function homeSearch()',start);
assert(start>=0&&end>start,'Home search copy missing');
const home=js.slice(start,end);
const routeStart=js.indexOf("if(route==='/buscar')"),routeEnd=js.indexOf("if(route==='/mapa')",routeStart);
assert(routeStart>=0&&routeEnd>routeStart,'Universal search view missing');
const universal=js.slice(routeStart,routeEnd);
const blocked=[
 'personaje negro','personaje empresario negro','black character',
 'black business owner character','personagem negro','personagem empresário negro'
];
for(const sample of blocked){
 assert(!home.includes(sample),'Sensitive example in Home: '+sample);
 assert(!universal.includes(sample),'Sensitive example in Search: '+sample);
}
for(const sample of ['personaje con pelo largo','character with long hair','personagem com cabelo comprido']){
 assert(home.includes(sample),'Missing neutral Home example: '+sample);
 assert(universal.includes(sample),'Missing neutral Search example: '+sample);
}
const emptyCondition='pins.length===0&&!mapAdd&&mapCategories.length>0?';
assert(js.includes(emptyCondition),'Map empty-state must honor intentional zero filters');
const show=(pins,adding,selected)=>pins.length===0&&!adding&&selected.length>0;
assert.equal(show([],false,[]),false,'Route-only mode must not show the notice');
assert.equal(show([],false,['regiones']),true,'Filtered empty state should be informative');
assert.equal(show([{id:'A'}],false,['regiones']),false,'No notice with visible pins');
assert.equal(show([],true,['regiones']),false,'No notice while placing marker');
assert(!js.includes('Abrí los filtros para mostrar puntos.'),'Old intrusive notice remains');
assert(js.includes('mapRouteMarkup()}')&&js.includes('pins.map(p=>'),'Route overlay must be independent of filtered pins');
console.log('PASS V245: sample chips in Spanish, English, Portuguese are neutral');
console.log('PASS V245: no empty-state overlay when categories are intentionally disabled');
console.log('PASS V245: route overlay renders independently of the visible pin list');
