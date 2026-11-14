/* Game Atlas V220 SEO updater. Installed as automation/v220-seo-refresh.mjs
 * in the public repository during the ONE rights-reviewed release.
 * Runs on each scheduled signed news/Wiki collection; no Firebase deployment.
 * FEED /app/ remains untouched. Only canonical guide pages and sitemap change.
 */
import {readFile,writeFile,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {verifyFeed,validatePublication} from './v210-publisher.mjs';
import {generateStaticSeo} from './seo/generate-static-seo.mjs';
import {generateCommunitySeo} from './seo/generate-community-seo-v220.mjs';

const statePath='automation/seo/last-indexed-v220.json';
const officialPath='updates/catalog-envelope.json';
const communityPath='updates/community-envelope-v205.json';
const [officialRaw,communityRaw]=await Promise.all([
 readFile(officialPath,'utf8'),readFile(communityPath,'utf8')]);
const official=verifyFeed(JSON.parse(officialRaw),1);
const community=verifyFeed(JSON.parse(communityRaw),205);
validatePublication(official);
validatePublication(community);
const sha=raw=>createHash('sha256').update(raw).digest('hex');
const state={schema:220,officialRevision:official.revision,communityRevision:community.revision,
 officialHash:sha(officialRaw),communityHash:sha(communityRaw)};
let prev=null;
try{prev=JSON.parse(await readFile(statePath,'utf8'))}
catch(e){if(e.code!=='ENOENT')throw e}
for(const key of ['official','community']){
 const old=prev?.[key+'Revision'],current=state[key+'Revision'];
 if(Number.isInteger(old)&&current<old)throw Error('SEO blocked signed feed revision rollback: '+key);
 if(old===current&&prev?.[key+'Hash']!==state[key+'Hash'])
  throw Error('SEO blocked changed signed payload without revision increase: '+key);
}
let hubExists=true;
for(const p of ['guia-gta-6/index.html','guia-gta-6/wiki/index.html','guia-gta-6/noticias/independientes/index.html','sitemap.xml'])
 try{await access(p)}catch{hubExists=false}
if(hubExists&&prev?.officialHash===state.officialHash&&prev?.communityHash===state.communityHash){
 console.log('SEO V220 unchanged: existing signed revisions are indexed');
}else{
 const pages=await generateStaticSeo(official,'.');
 const sidecar=await generateCommunitySeo(community,'.');
 // The checkpoint is committed along with all generated pages and sitemap.
 // If any validation fails, do not advance this state.
 await writeFile(statePath,JSON.stringify(state,null,2)+'\n');
 console.log('SEO V220 GENERATED',JSON.stringify({
  official:state.officialRevision,community:state.communityRevision,
  pages:pages.pageCount+sidecar.pageCount,officialArticles:pages.articleCount,
  wikiRecords:sidecar.wikiEntries,substantiveWikiPages:sidecar.indexedWikiPages,
  independentNews:sidecar.independentNews
 }));
}
