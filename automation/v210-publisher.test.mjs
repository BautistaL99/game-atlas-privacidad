import test from 'node:test';
import {createHash} from 'node:crypto';
import {renderOwnedNewsArt,ownedNewsImageRecord} from './v266-owned-news-art.mjs';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {publicationDate,extractRockstarGraph,extractRockstarIntelRSS,wikiFiche,sha,parseWikiInfobox,getOfficial,officialLinksFromHtml} from './v210-sources.mjs';
import {verifyFeed,validatePublication,appendNews,mergeWiki} from './v210-publisher.mjs';
import {getPhotoForOfficialArticle,matchRockstarArticleImage} from './v210-news-photos.mjs';
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
 assert(current.news.length>=8,'Existing signed history must remain intact');
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
 // Use a record without prior infobox specs: the live catalog now includes
 // enriched records, which must NOT be clobbered by a same-revision rescan.
 const old=current.fiches.find(x=>!Array.isArray(x.specs)||!x.specs.length);
 assert.ok(old,'Expected a blank Wiki record for the first-time infobox test');
 const sp=[{key:'available colors',label:'available colors',value:'Red'}];
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

test('V210 detects a fresh Rockstar source even when GraphQL temporarily fails, without trusting fake hosts',async()=>{
 const page='<a href="/newswire/article/abc123/gta-6-launch-new-details">News</a>'+
  '<a href="https://evil.example/newswire/article/abc123/fake">Fake</a>';
 const links=officialLinksFromHtml(page);
 assert.deepEqual(links,['https://www.rockstargames.com/newswire/article/abc123/gta-6-launch-new-details']);
 const fetchFn=async raw=>{
  const url=String(raw);
  if(url.includes('graph.rockstargames.com'))throw Error('503');
  if(url.includes('/newswire/article/'))
   return new Response('<meta property="og:title" content="GTA 6 Launch Details">'+
     '<meta property="article:published_time" content="2026-11-10T13:30:00Z">',{status:200});
  if(url.includes('/newswire?'))return new Response(page,{status:200});
  return new Response('<html>no links</html>',{status:200});
 };
 const rows=await getOfficial(fetchFn);
 assert.equal(rows.length,1);
 assert.equal(rows[0].publishedAt,'2026-11-10');
});

test('V210 normalizes Rockstar GraphQL relative Newswire URLs without accepting different hosts',()=>{
 const doc={data:{posts:{results:[
  {title:'Grand Theft Auto VI Launch Information',url:'/newswire/article/a123456/new-grand-theft-auto-vi-information',created:'11/10/26, 3:00 PM'},
  {title:'Grand Theft Auto VI Fake',url:'//evil.example/newswire/article/a123456/fake',created:'11/10/26, 3:00 PM'}
 ]}}};
 const entries=extractRockstarGraph(doc);
 assert.equal(entries.length,1);
 assert.equal(entries[0].url,'https://www.rockstargames.com/newswire/article/a123456/new-grand-theft-auto-vi-information');
 assert.equal(entries[0].publishedAt,'2026-11-10');
});

test('V253 keeps translated facts across a newer Wiki revision only when raw source fact is unchanged',async()=>{
 const current=verifyFeed(JSON.parse(await readFile('updates/community-envelope-v205.json','utf8')),205);
 const original=current.fiches[0];
 const spec={key:'type',label:'type',value:'sports',
  labelI18n:{es:'Tipo',en:'Type',pt:'Tipo'},
  valueI18n:{es:'Deportivo',en:'Sports',pt:'Esportivo'}};
 const x={...original,specs:[spec]};
 const source={...current,revision:current.revision+1,fiches:current.fiches.map(f=>f.id===x.id?x:f)};
 const same=mergeWiki(source,[{...original,wikiPageId:999,
  wikiRevision:original.wikiRevision+1,
  specs:[{key:'type',label:'type',value:'sports'}]}]);
 assert.equal(same.changed,1);
 assert.equal(same.next.fiches.find(f=>f.id===x.id).specs[0].valueI18n.es,'Deportivo');
 const changed=mergeWiki(source,[{...original,wikiPageId:999,
  wikiRevision:original.wikiRevision+1,
  specs:[{key:'type',label:'type',value:'truck'}]}]);
 assert.equal(changed.next.fiches.find(f=>f.id===x.id).specs[0].valueI18n,undefined);
});


test('V266 R18 remote Rockstar news-photo backfill is source-exact, signed-feed compatible and idempotent',async()=>{
 const url='https://www.rockstargames.com/newswire/article/k4a8955a93o747/grand-theft-auto-vi-the-album-now-available';
 const src='https://media-rockstargames-com.akamaized.net/tina-uploads/posts/k4a8955a93o747/'+'a'.repeat(40)+'.jpg';
 const cover=await getPhotoForOfficialArticle(url,async()=>new Response('<meta content="'+src+'" property="og:image">'));
 assert.equal(cover.remote,src);
 assert.equal(cover.officialPage,url);
 assert.deepEqual(Object.keys(cover.caption),['es','en','pt']);
 assert.equal(matchRockstarArticleImage(url,src.replace('k4a8955a93o747','7599a881942544')),null,'wrong Newswire post');
 assert.equal(matchRockstarArticleImage(url,src.replace('media-rockstargames-com.akamaized.net','other.example')),null,'wrong origin');
 const feed=verifyFeed(JSON.parse(await readFile('updates/catalog-envelope.json','utf8')),1);
 const row={id:'rockstar-'+sha(url).slice(0,24),category:'actualizaciones',status:'verified',
  title:{es:'GTA 6 álbum',en:'GTA 6 Album',pt:'GTA 6 álbum disponível'},
  summary:{es:'Novedad oficial',en:'Official news',pt:'Notícia oficial'},
  sources:[{url}],publishedAt:'2026-11-20',trackable:false};
 // If real signed feed already contains this id, keep its original text/date.
 const without=feed.items.find(x=>x.id===row.id);
 const baseline=without?{...feed,items:feed.items.map(x=>{if(x.id!==row.id)return x;const {image,...withoutPhoto}=x;return withoutPhoto})}:appendNews(feed,[row],'official').next;
 const original=baseline.items.find(x=>x.id===row.id);
 const input={...original,image:cover};
 const result=appendNews(baseline,[input],'official');
 assert.equal(result.next.items.length,baseline.items.length,'no new card or duplicate');
 assert.equal(result.next.items.find(x=>x.id===row.id).image.remote,src);
 assert.deepEqual(result.next.items.find(x=>x.id===row.id).title,original.title);
 assert.equal(result.next.items.find(x=>x.id===row.id).publishedAt,original.publishedAt);
 assert.deepEqual(result.next.items.find(x=>x.id===row.id).sources,original.sources);
 assert.equal(appendNews(result.next,[input],'official').next.revision,result.next.revision,'no repeat');
});
test('V266 R18 missing or unrelated official photos never change an existing signed article',async()=>{
 const url='https://www.rockstargames.com/newswire/article/k4a8955a93o747/grand-theft-auto-vi-the-album-now-available';
 assert.equal(await getPhotoForOfficialArticle(url,async()=>{throw Error('offline')}),null);
 assert.equal(await getPhotoForOfficialArticle(url,async()=>new Response('<meta property="og:image" content="https://example.org/test.jpg">')),null);
});

test('V266 R18 retrieves exact Rockstar post art from localized page HTML without relying on og:image',async()=>{
 const article='https://www.rockstargames.com/newswire/article/k4a8955a93o747/grand-theft-auto-vi-the-album-now-available';
 const art='https://media-rockstargames-com.akamaized.net/tina-uploads/posts/k4a8955a93o747/'+'b'.repeat(40)+'.png';
 const fake='https://media-rockstargames-com.akamaized.net/tina-uploads/posts/wrongpost/'+'c'.repeat(40)+'.jpg';
 const visited=[];
 const result=await getPhotoForOfficialArticle(article,async url=>{
  visited.push(url);
  if(url.includes('/es/newswire/'))return new Response('<script>const photo="'+fake+'";const official="'+art.replaceAll('/','\\/')+'"</script>');
  return new Response('<html><head></head><body>no meta</body></html>');
 });
 assert.equal(result.remote,art);
 assert.equal(result.officialPage,article);
 assert.equal(visited.length,2,'stops after a valid matching image');
});


test('V266 R18 own-art remote fallback is deterministic, client-compatible and under signed image cap',async()=>{
 const png=renderOwnedNewsArt(),again=renderOwnedNewsArt();
 assert.deepEqual(png,again,'deterministic PNG for signed digest');
 assert(png.length>2000&&png.length<500000,'APK verified asset size cap');
 assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a','actual PNG magic bytes');
 assert.equal(png.readUInt32BE(16),960);
 assert.equal(png.readUInt32BE(20),540);
 const digest=createHash('sha256').update(png).digest('hex');
 const img=ownedNewsImageRecord(digest);
 assert.equal(img.path,'updates/assets/'+digest+'.png');
 assert.equal(img.rights,'owned');
 assert.deepEqual(Object.keys(img.alt),['es','en','pt']);
 assert(img.alt.es.includes('genérica')&&!img.alt.es.includes('fotografía oficial'));
 const live=verifyFeed(JSON.parse(await readFile('updates/catalog-envelope.json','utf8')),1);
 const old=live.items.find(x=>x.id==='rockstar-585094a46f8882dd13607ab2');
 assert(old,'20 November album report exists');
 const next={...live,revision:live.revision+1,items:live.items.map(x=>x.id===old.id?{...x,image:img}:x)};
 assert(validatePublication(next),'signed catalog allows owned artwork');
 assert.equal(next.items.length,live.items.length,'no new news added');
 assert.deepEqual(next.items.find(x=>x.id===old.id).sources,old.sources,'source stays Rockstar');
 assert.deepEqual(next.items.find(x=>x.id===old.id).title,old.title,'translations preserved');
});
