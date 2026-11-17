// Cross-platform V247 source checks. Run with: node qa/v247-public-client.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const dir=path.resolve('app');
const read=file=>fs.readFileSync(path.join(dir,file),'utf8');
const app=read('app-v137.js'),index=read('index.html'),sw=read('sw.js'),online=read('online-config.json');
for(const match of index.matchAll(/(?:src|href)="\.\/([^"?#]+)[^"]*"/g)){
 const asset=path.join(dir,match[1]);
 assert(fs.existsSync(asset),'Missing linked web asset '+match[1]);
}
const assets=[...new Set([...sw.matchAll(/'\.\/([^']+)'/g)].map(m=>m[1]))];
for(const f of assets)assert(fs.existsSync(path.join(dir,f)),'Offline cache missing '+f);
for(const file of fs.readdirSync(dir).filter(n=>n.endsWith('.js'))){
 const check=spawnSync(process.execPath,['--check',path.join(dir,file)],{encoding:'utf8'});
 assert.equal(check.status,0,'JS syntax '+file+' '+check.stderr);
}
for(const key of ['atlas-v247-ios-v240-qa.js','atlas-v247-ios-v241-qa.js','atlas-v247-ios-v242-qa.js','atlas-v247-ios-v242-remote-map.js']){
 const content=read(key);
 assert(!content.includes("if(window.Capacitor?.getPlatform?.()!=='ios')return"),'iOS-only guard '+key);
}
assert(index.includes('atlas-v247-ios-v240-qa.js'),'Cross-platform search enhancements not loaded');
assert(index.includes('mobile-v224-native.js'),'Nested Android back navigation not loaded');
assert(index.includes('partida-transfer-v225.js'),'Save import not loaded');
assert(index.includes('atlas-v247-ios-v242-remote-map.js'),'Signed map channel not loaded');
assert(index.includes('atlas-v247-ios-v241-qa.css'),'Keyboard-safe marker editor CSS not loaded');
assert(!index.includes('mobile-v226-ios.js')&&!index.includes('ios-v246-safe-area.css'),'Native iOS styles leaked into web/Android');
assert(app.includes('mapSpotlightHidden=true;mapPopupOpen=false;mapQuery=\'\''),'V248 backdrop must remember the selected pin');
assert(app.includes('const pins=mapAdd?[]:mapShown()'),'Pale spotlight must not suppress nearby markers');
assert(app.includes('function viDismissMapBackdrop()'),'Two-stage background dismissal is missing');
assert(app.includes("mapCategories.length>0?"),'Empty filters warning not suppressed');
assert(app.includes('viIosRankingAvailability'),'Verified numerical ranking missing');
assert(app.includes("const viDetectedLocale=")&&app.includes("||'en'"),'Initial device language fallback missing');
assert(app.includes("localStorage.setItem('vi_demo_locale',locale)"),'Manual language preference persistence missing');
assert(JSON.parse(online).enabled===true,'Signed news/wiki updates disabled');
assert(index.includes('community-v206.js')&&index.includes('online-updates.js'),'Automatic news/wiki client missing');
console.log('PASS V247: linked files, offline cache, JavaScript syntax, responsive UI, search/map state and signed updates');
