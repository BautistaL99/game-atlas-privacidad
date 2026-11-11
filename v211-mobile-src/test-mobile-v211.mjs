/* V211 mobile preview real browser tests (public Pages only).
 * Android Chrome + iPhone-sized touch browser emulation; does not claim a
 * physical iPhone / Safari test. No production user state is changed.
 */
import {chromium} from 'playwright-core';
import {mkdirSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const site='https://bautistal99.github.io/game-atlas-privacidad/';
const preview=site+'revision-v211-web-movil-android-ios-20261111/';
const reports=[],failures=[];
mkdirSync('qa/v211', {recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
function check(condition,message){if(!condition)throw Error(message)}
async function inspect(page,route,dev){
 const stats=await page.evaluate(()=>{
  const box=selector=>{
   const element=document.querySelector(selector);
   if(!element)return null;
   const r=element.getBoundingClientRect();
   return {x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)};
  };
  return {
   ww:document.documentElement.scrollWidth,vw:window.innerWidth,
   route:location.hash,heading:document.querySelector('h1')?.innerText?.slice(0,80),
   topbar:box('.topbar'),nav:box('.bottom-nav'),
   links:[...document.querySelectorAll('.bottom-nav>a,.bottom-nav>.mobile-more>summary')].map(e=>{
    const b=e.getBoundingClientRect();
    return {h:Math.round(b.height),w:Math.round(b.width),svg:!!e.querySelector('svg[data-vi-mobile-icon]'),label:e.innerText.trim().slice(0,24)}
   }),
   newsFilters:[...document.querySelectorAll('.vi-news-tabs>a')].map(e=>{
    const b=e.getBoundingClientRect();return {h:Math.round(b.height),w:Math.round(b.width),whiteSpace:getComputedStyle(e).whiteSpace}
   }),
   newsScroll:document.querySelector('.vi-news-tabs')?.scrollWidth||0,
   newsClient:document.querySelector('.vi-news-tabs')?.clientWidth||0,
   map:box('.atlas-map'),searchFont:getComputedStyle(document.querySelector('#headerSearchInput')||document.body).fontSize,
   previewIsolated:window.viV211PreviewStorageIsolated===true,
   desktopVisible:getComputedStyle(document.querySelector('.sidebar')||document.body).display!=='none'
  };
 });
 check(stats.vw>0&&stats.ww<=stats.vw+1,dev+' '+route+' horizontal overflow '+stats.ww+'/'+stats.vw);
 check(stats.previewIsolated,dev+' '+route+' storage not isolated');
 check(stats.links.length===6,dev+' '+route+' missing navigation');
 check(stats.links.every(x=>x.h>=44&&x.svg),dev+' '+route+' nav icon or touch size missing');
 check(stats.nav?.w>=stats.vw-2,dev+' '+route+' nav not full width');
 if(route==='news'){
  check(stats.newsFilters.length===4,dev+' missing news tabs');
  check(stats.newsFilters.every(x=>x.h>=42&&x.whiteSpace==='nowrap'),dev+' clipped news tabs');
  check(stats.newsScroll>stats.newsClient,'News filter carousel not swipeable');
 }
 if(route==='map')check((stats.map?.w||0)>240,dev+' map missing');
 reports.push({device:dev,route,...stats});
}
try{
 const cfg=[
  {name:'android-small',width:320,height:700},
  {name:'android',width:360,height:800},
  {name:'iphone',width:393,height:852},
  {name:'iphone-large',width:430,height:932}
 ];
 for(const device of cfg){
  const context=await browser.newContext({viewport:{width:device.width,height:device.height},
   isMobile:true,hasTouch:true,deviceScaleFactor:1,
   userAgent:device.name.includes('iphone')
    ?'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    :'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36'});
  const production=await context.newPage();
  await production.goto(site+'app/',{waitUntil:'domcontentloaded',timeout:50000});
  await production.evaluate(()=>localStorage.setItem('gta6-assistant:v1:favorites','["V211_TEST_SENTINEL"]'));
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(String(error.message).slice(0,180)));
  for(const [name,route] of Object.entries({home:'/',explore:'/explorar/vehiculos',news:'/noticias',map:'/mapa',library:'/partida',search:'/buscar'})){
   await page.goto(preview+'#'+route,{waitUntil:'domcontentloaded',timeout:60000});
   await page.waitForTimeout(1600);
   await inspect(page,name,device.name);
   if(['home','explore','news','map'].includes(name)&&['android','iphone'].includes(device.name))
    await page.screenshot({path:'qa/v211/'+device.name+'-'+name+'-after.png',fullPage:false});
  }
  // Follow existing SPA navigation rather than replacing its handlers.
  await page.locator('.bottom-nav>a[href="#/noticias"]').click();
  await page.waitForTimeout(500);
  check(page.url().includes('#/noticias'),device.name+' news route not reachable');
  await page.locator('.mobile-more>summary').click();
  check(await page.locator('.mobile-more').evaluate(el=>el.open),device.name+' More menu not open');
  await page.locator('.mobile-more-panel a[href="#/comparar"]').click();
  await page.waitForTimeout(450);
  check(page.url().includes('#/comparar'),device.name+' compare route not reachable');
  await page.goto(preview+'#/explorar/vehiculos',{waitUntil:'domcontentloaded',timeout:40000});
  await page.waitForTimeout(900);
  const fav=page.locator('button.quick-fav').first();
  if(await fav.count()){
   await fav.click({timeout:10000});
   await page.waitForTimeout(250);
  }
  check(await production.evaluate(()=>localStorage.getItem('gta6-assistant:v1:favorites'))==='["V211_TEST_SENTINEL"]',
   device.name+' touched real Pages favorites');
  check(errors.length===0,device.name+' JavaScript errors: '+errors.join('; '));
  await context.close();
 }
 // Desktop must remain the original V209 design; new mobile CSS has no
 // rule outside its <=700px media queries.
 const d=await browser.newPage({viewport:{width:1365,height:850}});
 await d.goto(preview+'#/',{waitUntil:'domcontentloaded',timeout:50000});
 await d.waitForTimeout(600);
 const desktop=await d.evaluate(()=>({
  sidebar:getComputedStyle(document.querySelector('.sidebar')).display,
  bottom:getComputedStyle(document.querySelector('.bottom-nav')).display,
  width:document.documentElement.scrollWidth,viewport:innerWidth,
  css:[...document.styleSheets].some(s=>s.href?.includes('mobile-v211.css'))
 }));
 check(desktop.sidebar!=='none'&&desktop.bottom==='none'&&desktop.css&&desktop.width<=desktop.viewport+1,'Desktop layout mutated');
 reports.push({device:'desktop-preserved',...desktop});
 await d.close();
 console.log('V211 MOBILE WEB PASS',JSON.stringify({devices:cfg.map(x=>x.name),screens:reports.length,errors:failures,desktop}));
}catch(error){
 failures.push(error.message);
 console.error('V211 MOBILE WEB FAILURE',error.stack);
 process.exitCode=1;
}finally{
 await browser.close();
 writeFileSync('qa/v211/mobile-after-results.json',JSON.stringify({reports,failures},null,2));
}
