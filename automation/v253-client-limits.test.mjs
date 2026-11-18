import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyFeed,validatePublication,appendNews,mergeWiki} from './v210-publisher.mjs';
import {readFile} from 'node:fs/promises';

const live=async()=>verifyFeed(JSON.parse(await readFile('updates/community-envelope-v205.json','utf8')),205);
test('V253 never grows to a signed sidecar with more than 1000 Wiki fiches',async()=>{
 const original=await live();
 const prototype=original.fiches.find(x=>x.wikiRevision>0);
 const fiches=Array.from({length:1000},(_,i)=>({...prototype,
  id:'wiki-community-'+String(i).padStart(24,'0'),
  title:{es:'Ejemplo '+i,en:'Example '+i,pt:'Exemplo '+i},
  sourceUrl:'https://gta.wiki/w/Example_'+i,
  specs:undefined
 }));
 const full={...original,fiches};
 assert.equal(validatePublication(full),true);
 const next={...prototype,id:'wiki-community-aaaaaaaaaaaaaaaaaaaaaaaa',
  sourceUrl:'https://gta.wiki/w/Unlisted_New_Entry'};
 const blocked=mergeWiki(full,[next]);
 assert.equal(blocked.changed,0);
 assert.equal(blocked.next.fiches.length,1000);
 const revised={...fiches[0],wikiRevision:fiches[0].wikiRevision+1};
 const updated=mergeWiki(full,[revised]);
 assert.equal(updated.changed,1);
 assert.equal(updated.next.fiches.length,1000);
});
test('V253 news capacity never exceeds 220 while existing stories can be corrected',async()=>{
 const original=await live();
 const prototype=original.news[0];
 const news=Array.from({length:220},(_,i)=>({...prototype,
  id:'community-report-'+String(i).padStart(24,'0'),
  title:{es:'Noticia '+i,en:'News '+i,pt:'Notícia '+i},
  sourceUrl:'https://rockstarintel.com/gta-vi-news-'+i,
  publishedAt:'2026-11-18'
 }));
 const full={...original,news};
 assert.equal(validatePublication(full),true);
 const extra={...prototype,id:'community-report-aaaaaaaaaaaaaaaaaaaaaaaa',sourceUrl:'https://rockstarintel.com/gta-vi-extra-story'};
 const merged=appendNews(full,[extra],'community');
 assert.equal(merged.added,0);
 assert.equal(merged.next.news.length,220);
 assert.throws(()=>validatePublication({...full,news:[...news,extra]}),/cap/);
});
test('V253 rejects oversized signed feed BEFORE clients see it',async()=>{
 const original=await live(),wiki=original.fiches.find(x=>x.wikiRevision>0);
 const gigantic={...original,fiches:Array.from({length:1000},(_,i)=>({
  ...wiki,id:'wiki-community-'+String(i).padStart(24,'0'),
  title:{es:'Elemento '+i,en:'Item '+i,pt:'Item '+i},
  sourceUrl:'https://gta.wiki/w/Huge_Test_'+i,
  specs:Array.from({length:18},(_,j)=>({
   key:'key'+j,label:'Label '+j,value:'X'.repeat(145)+j,
   labelI18n:{es:'Atributo '+j,en:'Attribute '+j,pt:'Atributo '+j},
   valueI18n:{es:'E'.repeat(150),en:'F'.repeat(150),pt:'G'.repeat(150)}
  }))
 }))};
 assert.throws(()=>validatePublication(gigantic),/payload limit/);
});
