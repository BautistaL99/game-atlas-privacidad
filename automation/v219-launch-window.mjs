/* V219 — editorial schedule gate, not a publisher.
 * GTA VI official release date currently 2026-11-19. Window below means
 * 2026-11-19 00:00 ART through 2026-11-26 00:00 ART (end exclusive).
 * Update release date here if Rockstar changes its announced date.
 * No automatic job gets permission to change /app, Android, Firebase or user data.
 */
export const RELEASE_START_UTC='2026-11-19T03:00:00.000Z';
export const WINDOW_HOURS=7*24;
export const CRON_NEWS='29 17,23 * * *';
export const CRON_NEWS_LAUNCH='47 * * * *';
export const NEWS_LAUNCH_START_UTC='2026-11-18T15:00:00.000Z';
export const NEWS_LAUNCH_END_UTC='2026-12-03T03:00:00.000Z';
export const CRON_WIKI_DAILY='43 8 * * *';
export const CRON_WIKI_HOURLY='11 * * * *';
// Begin Wiki indexing on launch eve so available info is ready when stores approve.
export const WIKI_PRELAUNCH_START_UTC='2026-11-18T18:00:00.000Z';
export function releaseWindow(date,releaseStart=RELEASE_START_UTC){
 const now=new Date(date).getTime(),start=new Date(releaseStart).getTime();
 if(!Number.isFinite(now)||!Number.isFinite(start))throw Error('Invalid release/window date');
 return now>=start&&now<start+WINDOW_HOURS*3600000;
}
export function decide({event='schedule',schedule='',wikiScan=false,dryRun=false,now=new Date(),releaseStart=RELEASE_START_UTC}={}){
 if(event==='workflow_dispatch')return {run:true,mode:wikiScan?'wiki':'news',reason:dryRun?'manual dry-run':'manual request'};
 if(event!=='schedule')return {run:false,mode:'none',reason:'not a scheduled or manually requested publication'};
 if(schedule===CRON_NEWS)return {run:true,mode:'news',reason:'normal news twice daily'};
 if(schedule===CRON_NEWS_LAUNCH){
  const current=new Date(now).getTime();
  const active=current>=Date.parse(NEWS_LAUNCH_START_UTC)&&current<Date.parse(NEWS_LAUNCH_END_UTC);
  return {run:active,mode:'news',reason:active?'hourly launch news':'outside launch news window'};
 }
 const launch=releaseWindow(now,releaseStart);
 const start=new Date(releaseStart).getTime(),current=new Date(now).getTime();
 const prelaunch=Number.isFinite(current)&&current>=Date.parse(WIKI_PRELAUNCH_START_UTC)&&current<start;
 const wikiHourly=launch||prelaunch;
 if(schedule===CRON_WIKI_HOURLY)return {run:wikiHourly,mode:'wiki',reason:wikiHourly?'hourly launch Wiki indexing':'outside Wiki launch window'};
 if(schedule===CRON_WIKI_DAILY)return {run:!wikiHourly,mode:'wiki',reason:wikiHourly?'superseded by hourly checks':'daily maintenance'};
 return {run:false,mode:'none',reason:'unknown schedule'};
}
if(import.meta.url===new URL('file://'+process.argv[1]).href){
 const x=decide({event:process.env.GITHUB_EVENT_NAME,
   schedule:process.env.GITHUB_EVENT_SCHEDULE||'',
   wikiScan:process.env.GAME_ATLAS_WIKI_SCAN==='true',
   dryRun:process.env.GAME_ATLAS_DRY_RUN==='true',
   now:new Date(),releaseStart:process.env.GAME_ATLAS_LAUNCH_AT||RELEASE_START_UTC});
 process.stdout.write('should_run='+(x.run?'true':'false')+'\nmode='+x.mode+'\n');
 console.error('V219 scheduler:',x.reason,'start:',process.env.GAME_ATLAS_LAUNCH_AT||RELEASE_START_UTC);
}