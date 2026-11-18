import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const dirs=process.argv.slice(2);assert.ok(dirs.length>0);
for(const dir of dirs){
 const js=readFileSync(dir+'/mobile-v221-polish.js','utf8');
 const monet=readFileSync(dir+'/monetization-v250.js','utf8');
 const html=readFileSync(dir+'/index.html','utf8');
 assert.ok(js.includes('vi-support-v253-disabled'));
 assert.ok(js.includes("support.removeAttribute('href')"));
 assert.ok(js.includes('event.preventDefault();event.stopImmediatePropagation()'));
 assert.ok(js.includes("location.replace('#/informacion')"));
 assert.ok(html.includes('mobile-v221-polish.js'));
 assert.match(monet,/billingEnabled:false/);
 assert.match(monet,/advertisingEnabled:false/);
 if(dir.includes('ios')||dir==='www'){
   assert.ok(js.includes("label:'Valorar'"),'iOS rating button missing');
   assert.ok(js.includes("label:'Rate app'"),'English rating missing');
   assert.ok(js.includes("label:'Avaliar'"),'Portuguese rating missing');
 }
}
console.log('PASS V253 controls disabled / Apple rating / existing billing off');
