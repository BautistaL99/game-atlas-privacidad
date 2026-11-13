/* V219 — editorial schedule gate, not a publisher.
 * GTA VI official release date currently 2026-11-19. Window below means
 * 2026-11-19 00:00 ART through 2026-11-26 00:00 ART (end exclusive).
 * Update release date here if Rockstar changes its announced date.
 * No automatic job gets permission to change /app, Android, Firebase or user data.
 */
export const RELEASE_START_UTC='2026-11-19T03:00:00.000Z';
export const WINDOW_HOURS=7*24;
export const CRON_NEWS='29 17,23 * * *';
export const CRON_WIKI_DAILY='43 8 * * *';
export const CRON_WIKI_HOURLY='11 * * * *';
export function releaseWindow(date,releaseStart=RELEASE_START_UTC){
 const now=new Date(date).getTime(),start=new Date(releaseStart).getTime();
 if(!Number.isFinite(now)||!Number.isFinite(start))throw Error('Invalid release/window date');
 return now>=start&&now<start+WINDOW_HOURS*3600000;
}
export function decide({event='schedule',schedule='',wikiScan=false,dryRun=false,now=new Date(),releaseStart=RELEASE_START_UTC}={}){
 if(event==='workflow_dispatch')return {run:true,mode:wikiScan?'wiki':'news',reason:dryRun?'manual dry-run':'manual request'};
 if(event!=='schedule')return {run:false,mode:'none',reason:'not a scheduled or manually requested publication'};
 if(schedule===CRON_NEWS)return {run:true,mode:'news',reason:'approved twice daily'};
 const launch=releaseWindow(now,releaseStart);
 if(schedule===CRON_WIKI_HOURLY)return {run:launch,mode:'wiki',reason:launch?'hourly 7-day launch window':'outside launch window'};
 if(schedule===CRON_WIKI_DAILY)return {run:!launch,mode:'wiki',reason:launch?'superseded by hourly checks':'daily maintenance'};
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