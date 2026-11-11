import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {publicationDate,extractRockstarGraph,extractRockstarIntelRSS,wikiFiche,sha,parseWikiInfobox} from './v210-sources.mjs';
import {verifyFeed,validatePublication,appendNews,mergeWiki} from './v210-publisher.mjs';
test('V210 verify old Ed25519 feeds with the existing client public key',async()=>{
 const a=JSON.parse(await readFile('updates/catalog-envelope.json','utf8'));
 const b=JSON.parse(await readFile('updates/community-envelope-v205.json','utf8'));
 const official=verifyFeed(a,1),community=verifyFeed(b,205);
 assert(validatePublication(official)&&validatePublication(community));
 assert(official.items.some(x=>x.category==='actualizaciones'));
 assert(community.news.some(x=>x.sourceTier==='independent_reporting_not_official'));
 assert(community.fiches.length>10);
});
test('V210 publication dates are ORIGINAL source dates, never scan dates',()=>{
 assert.equal(publicationDate('Wed, 04 Nov 2026 12:31:00 GMT'),'2026-11-04');
 assert.equal(publicationDate('2026-11-10T18:00:00Z'),'2026-11-10');
 assert.equal(publicationDate(''),null);
 assert.equal(publicationDate('nonsense'),null);
 assert.equal(publicationDate('2027-01-01T00:00:00Z'),null);
});
test('V210 detects unique allowed Rockstar articles; excludes GTA Online and unrelated',()=>{
 const graph={data:{posts:{results:[
  {title:'GTA 6 Official News',url:'https://www.rockstargames.com/newswire/article/aaa/bbb',created:'2026-11-05T17:00:00Z'},
  {title:'GTA 6 Official News',url:'https://www.rockstargames.com/newswire/article/aaa/bbb',created:'2026-11-05T17:00:00Z'},
  {title:'GTA Online bonuses',url:'https://www.rockstargames.com/newswire/article/bbb/ccc',created:'2026-11-05T17:00:00Z'},
  {title:'GTA 6 Fake',url:'https://fake.example/newswire/article/aaa/bbb',created:'2026-11-05T17:00:00Z'}
 ]}}};
 const rows=extractRockstarGraph(graph);
 assert.equal(rows.length,1);
 assert.equal(rows[0].publishedAt,'2026-11-05');
});
test('V210 RSS deduplicates identical URLs; excludes stale/future dates and unrelated franchises',()=>{
 const item=(title,link,day)=>'<item><title>'+title+'</title><link>'+link+'</link><pubDate>'+day+'</pubDate></item>';
 const rss='<rss><channel>'+item('GTA 6 gameplay details','https://rockstarintel.com/gta-6-gameplay-details/','Wed, 04 Nov 2026 12:00:00 GMT')
 +item('GTA 6 gameplay details','https://rockstarintel.com/gta-6-gameplay-details/','Wed, 04 Nov 2026 12:00:00 GMT')
 +item('GTA Online new week','https://rockstarintel.com/gta-online-new-week/','Wed, 04 Nov 2026 12:00:00 GMT')
 +item('GTA 6 old rumor','https://rockstarintel.com/gta-6-old-rumor/','Mon, 01 Jan 2024 12:00:00 GMT')
 +'</channel></rss>';
 const entries=extractRockstarIntelRSS(rss);
 assert.equal(entries.length,2,'Past reporting can be backfilled with ORIGINAL dates');
 assert.equal(entries[0].publishedAt,'2026-11-04');
});
test('V210 idempotently appends new official records and NEVER republishes old entries as new',async()=>{
 const current=verifyFeed(JSON.parse(await readFile('updates/catalog-envelope.json','utf8')),1);
 const source='https://www.rockstargames.com/newswire/article/testing-only/sample';
 const row={id:'rockstar-'+sha(source).slice(0,24),category:'actualizaciones',status:'verified',
  title:{en:'GTA 6 Historical Story',es:'GTA 6 historia anterior',pt:'GTA 6 história anterior'},
  summary:{en:'Rockstar Games published GTA 6 in January 2026.',es:'Rockstar Games publicó GTA 6 en enero de 2026.',pt:'A Rockstar Games publicou GTA 6 em janeiro de 2026.'},
  publishedAt:'2026-01-10',trackable:false,sources:[{url:source}]};
 const first=appendNews(current,[row],'official');
 assert.equal(first.added,1);
 assert.equal(first.next.revision,current.revision+1);
 assert.equal(first.next.items.at(-1).publishedAt,'2026-01-10');
 const second=appendNews(first.next,[row],'official');
 assert.equal(second.added,0);
 assert.equal(second.next.revision,first.next.revision);
});
test('V210 never removes community wiki records on partial source scan',async()=>{
 const current=verifyFeed(JSON.parse(await readFile('updates/community-envelope-v205.json','utf8')),205);
 const original=current.fiches.length;
 const unchanged=mergeWiki(current,[]);
 assert.equal(unchanged.next.fiches.length,original);
 assert.equal(unchanged.next.revision,current.revision);
 const existing=current.fiches[0],newer={...existing,wikiRevision:existing.wikiRevision+1};
 const changed=mergeWiki(current,[newer]);
 assert.equal(changed.next.fiches.length,original);
 assert.equal(changed.next.fiches.find(x=>x.id===existing.id).wikiRevision,newer.wikiRevision);
});
test('V210 invalid new entries cannot poison the previously signed feed',async()=>{
 const current=verifyFeed(JSON.parse(await readFile('updates/community-envelope-v205.json','utf8')),205);
 const malicious={id:'community-report-'+'f'.repeat(24),title:{es:'Bad<script>',en:'Bad',pt:'Bad'},summary:{es:'Bad',en:'Bad',pt:'Bad'},publishedAt:'2026-11-12',
 sourceUrl:'https://evil.example/post',sourceName:'RockstarINTEL',sourceTier:'independent_reporting_not_official',claimStatus:'reported_not_confirmed_by_rockstar'};
 assert.throws(()=>appendNews(current,[malicious],'community'));
 assert.equal(current.news.length,8);
});

test('V210 safely adds unforeseen Wiki infobox cells but excludes nested templates and images',()=>{
 const wiki=['{{Infobox vehicle',
 '| image = Example.png',
 '| front_image2 = picture.jpg',
 '| top_speed = 230 km/h',
 '| available_colors = Black, Red, White',
 '| engine = V8',
 '| infobox_style = fancy',
 '| danger = {{malicious template|text}}',
 '| label1 = Rear window material',
 '| data1 = Reinforced glass',
 '}}'].join('\n');
 const fields=parseWikiInfobox(wiki);
 assert(fields.some(x=>x.key==='available colors'&&x.value==='Black, Red, White'));
 assert(fields.some(x=>x.key==='top speed'&&x.value==='230 km/h'));
 assert(fields.some(x=>x.key==='rear window material'&&x.value==='Reinforced glass'));
 assert(fields.every(x=>!/image|style|danger/.test(x.key)));
 assert(fields.length<=18);
});
test('V210 Wiki updates preserve attributes at the same revision but purge stale specs after revision change',async()=>{
 const current=verifyFeed(JSON.parse(await readFile('updates/community-envelope-v205.json','utf8')),205);
 const old=current.fiches[0],sp=[{key:'available colors',label:'available colors',value:'Red'}];
 const withSpec=mergeWiki(current,[{...old,wikiPageId:10,specs:sp}]);
 assert.equal(withSpec.changed,1);
 assert.equal(withSpec.next.fiches.length,current.fiches.length);
 assert.equal(withSpec.next.fiches.find(x=>x.id===old.id)?.specs?.[0]?.value,'Red');
 assert(!('wikiPageId' in withSpec.next.fiches.find(x=>x.id===old.id)));
 const unchanged=mergeWiki(withSpec.next,[{...old,wikiPageId:10}]);
 assert.equal(unchanged.changed,0);
 assert.equal(unchanged.next.fiches.find(x=>x.id===old.id).specs[0].value,'Red');
 const newer=mergeWiki(withSpec.next,[{...old,wikiPageId:10,wikiRevision:old.wikiRevision+1}]);
 assert.equal(newer.changed,1);
 assert.equal(newer.next.fiches.find(x=>x.id===old.id).specs,undefined);
});
