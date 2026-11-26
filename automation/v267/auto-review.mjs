// Policy review of existing community identities only. No new IDs, no inferred gameplay facts.
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';
import {decodeCommunity} from './draft-proposals.mjs';import {categories,wikiUrl} from '../v267-review-discovery.mjs';import schema from './content-schema-v265.cjs';
const hash=s=>createHash('sha256').update(s).digest('hex');
const text=(v,n)=>typeof v==='string'&&v.length>0&&v.length<=n&&!/[<>\x00-\x1f]/.test(v);
const langs=['es','en','pt'];
const validLoc=(v,n)=>v&&langs.every(l=>text(v[l],n));
const imgURL=u=>{try{const x=new URL(u);return x.origin==='https://gta.wiki'&&!x.search&&!x.hash&&/^\/images\/[a-z0-9_/%().,\-]+\.(png|jpe?g|webp)$/i.test(x.pathname)}catch{return false}};
const filePage=u=>{try{const x=new URL(u);return x.origin==='https://gta.wiki'&&!x.search&&!x.hash&&x.pathname.startsWith('/w/File:')}catch{return false}};
const externalEvidence=u=>{try{const x=new URL(u);return x.protocol==='https:'&&!x.username&&!x.password&&!x.port&&!x.hash&&x.hostname.includes('.')&&!x.hostname.endsWith('.local')}catch{return false}};
export function validGrant(g){return g&&g.permission==='commercial-redistribution-explicit'&&g.rightsHolderConfirmed===true&&text(g.author,70)&&externalEvidence(g.evidenceUrl)&&filePage(g.filePage)&&imgURL(g.url)&&/^[a-f0-9]{64}$/.test(g.sha256)&&validLoc(g.alt,180)&&text(g.fileTitle,220)&&g.fileTitle.startsWith('File:')&&g.license==='explicit-permission';}
export async function api(params,fetchFn=fetch){const u='https://gta.wiki/api.php?'+new URLSearchParams({format:'json',formatversion:'2',...params});const r=await fetchFn(u,{redirect:'error',signal:AbortSignal.timeout(18000),headers:{Accept:'application/json','User-Agent':'GameAtlasPolicyReview/1.0'}});if(!r.ok)throw Error('HTTP '+r.status);if(Number(r.headers.get('content-length')||0)>2000000)throw Error('oversized');const raw=await r.text();if(raw.length>2000000)throw Error('oversized');const d=JSON.parse(raw);if(d.error)throw Error('API error');return d;}
function eligible(c){return categories[c.category]&&c.sourceName==='GTA Wiki'&&c.sourceTier==='community_indexed_not_rockstar_confirmed'&&wikiUrl(c.title?.en)===c.sourceUrl&&c.id==='wiki-community-'+hash(c.sourceUrl).slice(0,24)&&Number.isSafeInteger(c.wikiRevision)&&validLoc(c.title,180)&&validLoc(c.summary,1250)&&/no está confirmada por Rockstar/i.test(c.summary.es)&&/not confirmed by Rockstar/i.test(c.summary.en)&&/não é confirmada pela Rockstar/i.test(c.summary.pt);}
function verified(c,p){return p&&!p.missing&&p.ns===0&&wikiUrl(p.title)===c.sourceUrl&&p.revisions?.[0]?.revid===c.wikiRevision&&p.categories?.some(x=>categories[c.category].some(a=>x.title==='Category:'+a));}
export async function review({community,previous,grants={},now=new Date().toISOString(),query=api,maxChecks=24,maxChanges=6,maxImageChecks=8}){
 const old=new Map(previous.changes.map(c=>[c.id,c])),ids=new Map(),sourceCounts=new Map();for(const c of community.fiches){ids.set(c.id,(ids.get(c.id)||0)+1);sourceCounts.set(c.sourceUrl,(sourceCounts.get(c.sourceUrl)||0)+1);}
 const report={schema:1,policy:'auto-policy-v1',communityRevision:community.revision,baseRevision:previous.revision,checked:0,eligible:0,imagesAuthorized:0,imagesPending:0,imageCandidates:[],decisions:[],remaining:0};
 const changes=[],imageDownloads={};let imageBudget=maxImageChecks;const pool=community.fiches.filter(c=>eligible(c)&&ids.get(c.id)===1&&sourceCounts.get(c.sourceUrl)===1&&(!old.get(c.id)?.image)).sort((a,b)=>a.id.localeCompare(b.id));
 report.remaining=pool.length;const day=Math.floor(Date.parse(now)/86400000);const offset=pool.length?(day*maxChecks)%pool.length:0;const candidates=[...pool.slice(offset),...pool.slice(0,offset)].slice(0,maxChecks);
 for(const c of candidates){if(changes.length>=maxChanges)break;report.checked++;const prior=old.get(c.id);
 try{const result=await query({action:'query',titles:c.title.en,prop:'revisions|categories|images',imlimit:'10',rvprop:'ids',clcategories:categories[c.category].map(x=>'Category:'+x).join('|'),cllimit:'max'});
 const p=result.query?.pages?.[0];if(!verified(c,p)){report.decisions.push({id:c.id,status:'pending-source-or-revision'});continue;}report.eligible++;
 const sources=[{url:c.sourceUrl,label:'GTA Wiki - referencia comunitaria',checkedAt:now.slice(0,10)}];
 const next=prior?structuredClone(prior):{op:'patch',id:c.id,category:c.category,status:'reviewed',title:c.title,summary:c.summary,sources,searchTerms:[c.title.en].filter(x=>text(x,80))};
 // Existing owner-reviewed descriptions, facts, coordinates and images are never replaced.
 const g=grants[c.id];let imageOK=false;
 if(imageBudget>0&&!validGrant(g)){imageBudget--;const names=(p.images||[]).map(x=>x.title).filter(x=>text(x,220)&&x.startsWith('File:')).slice(0,4);if(names.length){try{const meta=await query({action:'query',titles:names.join('|'),prop:'imageinfo',iiprop:'url|mime|size|extmetadata'});for(const f of meta.query?.pages||[]){const i=f.imageinfo?.[0];if(!names.includes(f.title)||!i||!filePage(i.descriptionurl)||!imgURL(i.url))continue;const license=i.extmetadata?.LicenseShortName?.value;report.imageCandidates.push({id:c.id,fileTitle:f.title,filePage:i.descriptionurl,claimedLicense:text(license,100)?license:null,status:'permission-not-established'});}}catch(e){report.decisions.push({id:c.id,status:'image-discovery-deferred'});}}}

 if(validGrant(g)&&!prior?.image&&(prior||(g.installedBaseConfirmed===true&&g.category===c.category))){
 const list=await query({action:'query',titles:c.title.en,prop:'images',imlimit:'max'});
 if(list.query?.pages?.[0]?.images?.some(x=>x.title===g.fileTitle)){
 const meta=await query({action:'query',titles:g.fileTitle,prop:'imageinfo',iiprop:'url|mime|size'});
 const i=meta.query?.pages?.[0]?.imageinfo?.[0];if(i&&i.url===g.url&&i.descriptionurl===g.filePage&&['image/png','image/jpeg','image/webp'].includes(i.mime)&&Number.isSafeInteger(i.size)&&i.size>0&&i.size<=900000){
 const ext=new URL(g.url).pathname.split('.').pop().toLowerCase();const credit='Autor: '+g.author+'; permiso comercial documentado';const evidence=[{url:g.filePage,label:credit,checkedAt:now.slice(0,10)},{url:g.evidenceUrl,label:'Permiso de redistribución comercial',checkedAt:now.slice(0,10)}];
 const all=[...new Map([...next.sources,...evidence].map(s=>[s.url,s])).values()];if(all.length<=8&&text(credit,110)){
 next.sources=all;next.image={path:'updates/assets/'+g.sha256+'.'+ext,sha256:g.sha256,rights:'licensed',rightsEvidence:'Permiso comercial: '+g.evidenceUrl,alt:g.alt};if(text(next.image.rightsEvidence,300)){imageDownloads[c.id]={url:g.url,sha256:g.sha256};imageOK=true;report.imagesAuthorized++;}else delete next.image;
 }}}}
 if(!imageOK){report.imagesPending++;report.decisions.push({id:c.id,status:'policy-pass-community-source-only',publication:'unchanged; no new verified data or authorized image',factsPending:(c.specs||[]).length});continue;}
 schema.validate({schema:265,mode:'owner-approved-data',revision:previous.revision+1,mapVersion:previous.mapVersion,approvedAt:now,reviewId:'auto-policy-v1-check',changes:[next]});
 changes.push(next);report.decisions.push({id:c.id,status:'policy-pass-image-and-source'});
 }catch(e){delete imageDownloads[c.id];report.decisions.push({id:c.id,status:'deferred',reason:String(e.message).slice(0,150)});}
 }
 const batch=changes.length?{ownerDecision:'APPROVED_BY_OWNER',baseRevision:previous.revision,mapVersion:previous.mapVersion,reviewId:'auto-policy-v1-'+hash(JSON.stringify(changes)).slice(0,20),changes,imageDownloads}:null;return {report,batch};
}
function previousData(){const e=JSON.parse(fs.readFileSync('updates/approved-content-v265.json','utf8'));const d=JSON.parse(Buffer.from(e.payload,'base64'));if(d.mode===schema.INDEX_MODE){schema.validateIndex(d);const parts=d.parts.map(x=>{const b=fs.readFileSync(x.path);if(b.length!==x.bytes||hash(b)!==x.sha256)throw Error('part integrity');return JSON.parse(b)});schema.combineIndex(d,parts);return {...d,changes:parts.flatMap(p=>p.changes)}}schema.validate(d);return d;}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){const community=decodeCommunity(fs.readFileSync('updates/community-envelope-v205.json','utf8'));const previous=previousData();const grants=JSON.parse(fs.readFileSync('automation/v267/image-permissions.json','utf8'));if(grants.schema!==1||!grants.files||Array.isArray(grants.files))throw Error('Invalid permission register');const {report,batch}=await review({community,previous,grants:grants.files});fs.mkdirSync('review-queue',{recursive:true});fs.writeFileSync('review-queue/auto-review-report.json',JSON.stringify(report,null,2)+'\n');if(batch)fs.writeFileSync('review-queue/auto-batch.json',JSON.stringify(batch,null,2)+'\n');console.log(JSON.stringify({...report,decisions:undefined,imageCandidates:report.imageCandidates.length,proposed:batch?.changes.length||0}));}
