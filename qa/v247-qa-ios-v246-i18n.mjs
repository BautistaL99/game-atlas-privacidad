// Game Atlas iOS V246: repeatable localization regressions without Apple credentials.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const app=readFileSync('app/app-v137.js','utf8');
const dictionary=readFileSync('app/vi-i18n.js','utf8');
const html=readFileSync('app/index.html','utf8');
function sourceLine(name){
 const line=app.split('\n').find(x=>x.startsWith('function '+name+'('));
 assert(line,'Missing '+name);
 return line;
}
const statusSource=sourceLine('itemStatusLabel');
function status(lang,category,done){
 return vm.runInNewContext(statusSource+'; itemStatusLabel({id:"sample",category:"'+category+'"})',{
   locale:lang,checked:()=>done
 });
}
assert.equal(status('es','vehiculos',true),'Descubierto');
assert.equal(status('en','vehiculos',true),'Discovered');
assert.equal(status('pt','vehiculos',true),'Descoberto');
assert.equal(status('en','armas',true),'Registered');
assert.equal(status('pt','armas',false),'Não registrada');
assert.equal(status('en','misiones',false),'Pending');
const categorySource=sourceLine('categoryList');
function category(lang){
 const ctx={
   locale:lang,location:{hash:'#/explorar/armas'},
   tr:values=>values[lang]||values.es,
   trackable:()=>true,checked:()=>false,store:()=>[],
   href:route=>'href="#'+route+'"',
   card:()=>'<article class="content-card">sample</article>',
   esc:value=>String(value)
 };
 return vm.runInNewContext(categorySource+';categoryList("armas",[{id:"sample"}])',ctx);
}
const en=category('en'),pt=category('pt'),es=category('es');
for(const word of ['All','Missing','Registered','Favorites','personal progress'])assert(en.includes(word),'English category label: '+word);
for(const word of ['Todos','Faltam','Registrados','Favoritos','progresso pessoal'])assert(pt.includes(word),'Portuguese category label: '+word);
for(const word of ['Todos','Me faltan','Registrados','Favoritos','seguimiento personal'])assert(es.includes(word),'Spanish category label: '+word);
assert(!en.includes('seguimiento personal')&&!en.includes('Me faltan'),'Spanish leaked into English category');
assert(!pt.includes('seguimiento personal')&&!pt.includes('Me faltan'),'Spanish leaked into Portuguese category');
const required=[
  "en:'MY PROGRESS'", "pt:'MEU PROGRESSO'",
  "en:'Remove from progress'", "pt:'Remover do progresso'",
  "en:'MISSION PROGRESS'", "pt:'PROGRESSO DA MISSÃO'",
  "en:'Personal status'", "pt:'Estado pessoal'",
  "en:'Mark as completed'", "pt:'Marcar como concluída'",
  "en:'Add to favorites'", "pt:'Adicionar aos favoritos'"
];
for(const word of required)assert(app.includes(word)||dictionary.includes(word),'Missing translation: '+word);
assert(app.includes("mapCategories.length>0?"),'V245 empty-map-filter correction lost');
assert(app.includes('viIosRankingAvailability'),'V244 ranking safety lost');
assert(html.includes('atlas-v247-ios-v240-qa.css'),'V246 iOS status bar CSS not loaded');
assert(dictionary.indexOf('iOS V246: remaining static labels')<dictionary.indexOf('(function(){'),'V246 dictionary must load before translation bridge');
console.log('PASS iOS V246: ES EN PT vehicle, weapon and mission status semantics');
console.log('PASS iOS V246: category navigation/filters and progress translations');
console.log('PASS iOS V246: detail, accessibility and favorites text available');
console.log('PASS iOS V246: map and verified ranking safeguards still included');

/* First launch must follow the device language; never override a saved choice. */
const boot=app.slice(app.indexOf('// Native iOS/WebView V246:'),app.indexOf("let searchText="));
function initialLocale(languages,language,saved){
 const stored={getItem:()=>saved};
 const ctx={localStorage:stored,navigator:{languages,language},window:{},document:{documentElement:{}},strings:{es:{},en:{},pt:{}}};
 vm.runInNewContext(boot,ctx);
 return {locale:ctx.window.viAppLocale,html:ctx.document.documentElement.lang};
}
assert.equal(initialLocale(['en-US','es-AR'],'en-US',null).locale,'en');
assert.equal(initialLocale(['es-AR','en-US'],'es-AR',null).locale,'es');
assert.equal(initialLocale(['pt-BR','en-US'],'pt-BR',null).locale,'pt');
assert.equal(initialLocale(['fr-FR'],'fr-FR',null).locale,'en');
assert.equal(initialLocale(['en-US'],'en-US','es').locale,'es');
assert.equal(initialLocale(['es-AR'],'es-AR','pt').html,'pt');
assert(dictionary.includes("const selected=window.viAppLocale||localStorage.getItem('vi_demo_locale')||'en';"),'Translation bridge uses first-launch locale');
console.log('PASS iOS V246: first launch device language and preserved user choice');
