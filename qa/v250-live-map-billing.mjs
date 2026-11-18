/* Game Atlas V250: regression checks without a browser runtime or payments. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const dirs=process.argv.slice(2);
assert(dirs.length>=1,'Provide a www directory');
for(const dir of dirs){
 const read=n=>fs.readFileSync(path.join(dir,n),'utf8');
 const src=read('app-v137.js'),index=read('index.html'),money=read('monetization-v250.js'),css=read('game-atlas-v250-fixes.css');
 const code=src.slice(src.indexOf('function viRefreshMapSearchSuggestions(){'),src.indexOf('function viQueueMapSearchSuggestions(){'));
 const existing=new Map([['other',{dataset:{value:'other'},remove(){existing.delete('other')}}]]);
 const stage={dataset:{},querySelectorAll(){return [...existing.values()]},insertAdjacentHTML(_,text){let id=text.match(/data-value="([^"]+)"/)?.[1];if(id)existing.set(id,{dataset:{value:id},remove(){existing.delete(id)}})}};
 const root={querySelector(q){if(q==='#mapSearchText')return {closest(){return toolbar}};if(q==='.atlas-search-results')return null;if(q==='#mapStage')return stage;return null}};
 const toolbar={insertAdjacentHTML(){}};
 const context={document:{querySelector:q=>q==='#mapApp .atlas-v119'?root:null},mapQueryResultsHTML:()=>'',viPositionMapSuggestions:()=>{},queueMicrotask:()=>{},window:{},mapShown:()=>[{id:'gun-shop'}],mapPinMarkup:p=>`<button data-value="${p.id}"></button>`,mapRefreshClusters:()=>{context.didCluster=true}};
 vm.createContext(context);vm.runInContext(code+';globalThis.refresh=viRefreshMapSearchSuggestions',context);
 context.refresh();assert.deepEqual([...existing.keys()],['gun-shop'],dir+' did not refresh map pins with a relocated toolbar');assert(context.didCluster);
 // Also prove no abort when native layouts have temporarily moved the search toolbar entirely.
 root.querySelector=q=>q==='#mapStage'?stage:null;
 existing.clear();context.mapShown=()=>[{id:'car-shop'}];context.refresh();assert.deepEqual([...existing.keys()],['car-shop']);
 assert(src.includes("mapRouteDisplay&&!mapAdd&&viNativePlatformV249()==='ios'"));
 assert((src.includes('vi-v251-route-only-ios')&&read('game-atlas-v251-fixes.css').includes('.vi-v251-route-only-ios'))||(src.includes('vi-v250-route-only-ios')&&css.includes('.vi-v250-route-only-ios')));
 assert(src.includes('Top')&&(src.includes('No elimina publicidad')||src.includes('No elimina anuncios')));
 assert(src.includes("es:'Apoyar · Sin ads'")&&src.includes("en:'Support · No ads'")&&src.includes("pt:'Apoiar · Sem ads'"));
 assert(index.includes('monetization-v250.js')&&index.includes('game-atlas-v250-fixes.css'));
 const mctx={window:{},Date,Object};vm.runInNewContext(money,mctx);
 const m=mctx.window.viMonetizationV250;
 assert(m.products.ranking.length===8&&m.products.ranking[0].usdReference===1);
 assert(m.products.ranking.every(p=>p.kind==='consumable'&&p.adFree==='none'&&p.rankingPoints===p.usdReference));
 assert(m.products.lifetime.every(p=>p.kind==='nonconsumable'&&p.rankingPoints===0));
 assert(m.products.monthly.every(p=>p.kind==='subscription'&&p.rankingPoints===0));
 assert(!m.purchaseAvailable()&&!m.rankingSubmissionAvailable()&&!m.advertisementsAllowed());
 console.log('PASS',dir,'live generic-map refresh after relocated toolbar; native route toggle; 3 separate checkout categories safely disabled');
}
