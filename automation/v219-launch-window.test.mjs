import test from 'node:test';
import assert from 'node:assert/strict';
import {decide,releaseWindow,CRON_NEWS,CRON_WIKI_DAILY,CRON_WIKI_HOURLY,RELEASE_START_UTC} from './v219-launch-window.mjs';
const at='2026-11-19T03:00:00.000Z';
const end='2026-11-26T03:00:00.000Z';
test('news always checks twice daily including first seven days',()=>{
 for(const now of ['2026-11-18T03:00:00Z',at,'2026-11-23T18:00:00Z',end])
  assert.deepEqual(decide({now,event:'schedule',schedule:CRON_NEWS}).mode,'news');
});
test('hourly only during seven full days starting at midnight Argentina',()=>{
 assert.equal(RELEASE_START_UTC,at);
 for(const now of ['2026-11-18T23:59:59Z','2026-11-19T02:59:59Z',end,'2026-11-27T00:00:00Z']){
  assert.equal(releaseWindow(now),false);
  assert.equal(decide({now,event:'schedule',schedule:CRON_WIKI_HOURLY}).run,false);
 }
 for(const now of [at,'2026-11-20T05:11:00Z','2026-11-25T23:11:00Z','2026-11-26T02:59:59Z']){
  assert.equal(releaseWindow(now),true);
  assert.equal(decide({now,event:'schedule',schedule:CRON_WIKI_HOURLY}).run,true);
 }
});
test('daily wiki resumes after launch window and never duplicates hourly scan',()=>{
 for(const now of ['2026-11-18T08:43:00Z',end])assert.equal(decide({now,event:'schedule',schedule:CRON_WIKI_DAILY}).run,true);
 for(const now of [at,'2026-11-20T08:43:00Z'])assert.equal(decide({now,event:'schedule',schedule:CRON_WIKI_DAILY}).run,false);
});
test('no accidental automatic publishing from unknown events or schedules',()=>{
 assert.equal(decide({event:'push',now:at,schedule:CRON_WIKI_HOURLY}).run,false);
 assert.equal(decide({event:'schedule',now:at,schedule:'0 * * * *'}).run,false);
 assert.equal(decide({event:'workflow_dispatch',wikiScan:true,dryRun:true,now:'2026-11-10T00:00:00Z'}).mode,'wiki');
});
test('launch date can be moved by explicit documented configuration',()=>{
 assert.equal(releaseWindow(at,'2026-12-01T03:00:00Z'),false);
 assert.equal(releaseWindow('2026-12-01T03:00:00Z','2026-12-01T03:00:00Z'),true);
});
