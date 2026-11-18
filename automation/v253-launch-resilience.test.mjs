import test from 'node:test';
import assert from 'node:assert/strict';
import {getIndependent,extractRockstarIntelRSS} from './v210-sources.mjs';
import {independentEntry,officialEntry,appendNews,validatePublication} from './v210-publisher.mjs';

test('V253 falls back to publisher GTA VI category RSS and keeps original dates',async()=>{
 const rss='<rss><channel>'+
 '<item><title>GTA VI launches with new vehicles</title>'+
 '<link>https://rockstarintel.com/gta-vi-launches-with-new-vehicles/</link>'+
 '<pubDate>Wed, 18 Nov 2026 16:00:00 GMT</pubDate></item></channel></rss>';
 const requests=[];
 const fake=async(url)=>{
  requests.push(String(url));
  if(String(url).endsWith('/feed/')&&!String(url).includes('/category/'))return new Response('Down',{status:429});
  return new Response(rss,{status:200});
 };
 const rows=await getIndependent(fake,Date.parse('2026-11-18T18:00:00Z'));
 assert.equal(rows.length,1);
 assert.equal(rows[0].publishedAt,'2026-11-18');
 assert.ok(requests.some(u=>u.includes('/category/gta/gta-6/feed/')));
});
test('V253 signed independent article survives a 503 translator outage with transparent EN headline',async()=>{
 const fetchFn=async()=>new Response('Temporarily unavailable',{status:503});
 const source={url:'https://rockstarintel.com/gta-vi-launch-dated-2026/',title:'GTA VI launch review and new features',publishedAt:'2026-11-18'};
 const article=await independentEntry(source,fetchFn);
 assert.equal(article.translationPending,true);
 assert.match(article.title.es,/\(EN\)/);
 assert.match(article.title.pt,/\(EN\)/);
 assert.match(article.summary.es,/título original|titular original/i);
 assert.equal(article.publishedAt,'2026-11-18');
 assert.equal(article.sourceTier,'independent_reporting_not_official');
 const old={schema:205,mode:'INDEPENDENT_REPORTING_AND_COMMUNITY_WIKI_NOT_OFFICIAL',revision:2,news:[],fiches:[]};
 assert.equal(validatePublication({...old,news:[article]}),true);
 const first=appendNews(old,[article],'community');
 assert.equal(first.added,1);
 const improved={...article,
  translationPending:undefined,
  title:{es:'Según RockstarINTEL: reseña de GTA VI y novedades',
   en:article.title.en,pt:'Segundo a RockstarINTEL: análise de GTA VI e novidades'}};
 delete improved.translationPending;
 const second=appendNews(first.next,[improved],'community');
 assert.equal(second.updated,1);
 assert.equal(second.added,0);
 assert.equal(second.next.news.length,1);
 assert.equal(second.next.news[0].title.es,improved.title.es);
 const third=appendNews(second.next,[improved],'community');
 assert.equal(third.added,0);
 assert.equal(third.updated,0);
});
test('V253 official news also keeps the original source if translation is down',async()=>{
 const source={url:'https://www.rockstargames.com/newswire/article/abcdef12/official-gta-vi-launch',
 title:'Grand Theft Auto VI launch is here',publishedAt:'2026-11-18'};
 const article=await officialEntry(source,async()=>new Response('Down',{status:503}));
 assert.equal(article.translationPending,true);
 assert.equal(article.category,'actualizaciones');
 assert.match(article.title.es,/titular EN/);
 assert.equal(article.sources[0].url,source.url);
 assert.equal(article.publishedAt,'2026-11-18');
});
