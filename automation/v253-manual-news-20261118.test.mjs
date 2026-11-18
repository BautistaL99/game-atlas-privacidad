import test from 'node:test';
import assert from 'node:assert/strict';
import {getReviewedLaunchNews} from './v253-manual-news-20261118.mjs';
import {validatePublication,appendNews} from './v210-publisher.mjs';

test('Six independently sourced GTA VI launch-day news items are trilingual and signed-schema compatible',()=>{
 const news=getReviewedLaunchNews();
 assert.equal(news.length,6);
 assert.equal(new Set(news.map(x=>x.id)).size,6);
 assert.equal(new Set(news.map(x=>x.sourceUrl)).size,6);
 for(const row of news){
  assert.equal(row.publishedAt,'2026-11-18');
  assert.match(row.sourceUrl,/^https:\/\/rockstarintel\.com\//);
  assert.equal(row.sourceTier,'independent_reporting_not_official');
  assert.equal(row.claimStatus,'reported_not_confirmed_by_rockstar');
  for(const lang of ['es','en','pt']){assert.ok(row.title[lang]);assert.ok(row.summary[lang]);}
 }
 const prior={schema:205,mode:'INDEPENDENT_REPORTING_AND_COMMUNITY_WIKI_NOT_OFFICIAL',revision:12,news:[],fiches:[]};
 assert.equal(validatePublication({...prior,news}),true);
 const once=appendNews(prior,news,'community');
 assert.equal(once.added,6);
 assert.equal(once.next.revision,13);
 const twice=appendNews(once.next,news,'community');
 assert.equal(twice.added,0);
 assert.equal(twice.next,once.next);
});
