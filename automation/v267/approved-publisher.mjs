/* Owner-reviewed batches only. No executable content, no automatic rights claims. */
import fs from 'node:fs';
import path from 'node:path';
import {createHash,createPrivateKey,createPublicKey,sign,verify} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import schema from './content-schema-v265.cjs';
export const hash=b=>createHash('sha256').update(b).digest('hex');
const rootPath='updates/approved-content-v265.json';
const imagePath=/^updates\/assets\/[a-f0-9]{64}\.(?:png|jpe?g|webp)$/;
function read(root,rel,max){const full=path.join(root,rel);if(!fs.lstatSync(full).isFile()||fs.realpathSync(full)!==path.resolve(full))throw Error('Unsafe file '+rel);const s=fs.statSync(full);if(s.size>max)throw Error('Oversized file '+rel);return fs.readFileSync(full)}
function write(root,rel,bytes){const full=path.join(root,rel);fs.mkdirSync(path.dirname(full),{recursive:true});if(fs.existsSync(full)&&rel!==rootPath){if(!read(root,rel,bytes.length).equals(bytes))throw Error('Content-addressed collision '+rel);return;}fs.writeFileSync(full,bytes)}
function signedRoot(data,key){const payload=Buffer.from(JSON.stringify(data)).toString('base64');return Buffer.from(JSON.stringify({schema:265,payload,signature:sign(null,Buffer.from(payload),key).toString('base64')})+'\n')}
export function load(root,pub){const e=JSON.parse(read(root,rootPath,2500000));if(e.schema!==265||typeof e.payload!=='string'||! /^[A-Za-z0-9+/]+={0,2}$/.test(e.payload)||typeof e.signature!=='string'||Buffer.from(e.signature,'base64').length!==64||!verify(null,Buffer.from(e.payload),pub,Buffer.from(e.signature,'base64')))throw Error('Existing approved feed signature mismatch; wrong key or damaged feed');
 const d=JSON.parse(Buffer.from(e.payload,'base64'));if(d.mode!==schema.INDEX_MODE){schema.validate(d);return d}
 schema.validateIndex(d);const parts=d.parts.map(x=>{const raw=read(root,x.path,x.bytes);if(raw.length!==x.bytes||hash(raw)!==x.sha256)throw Error('Previous part integrity '+x.path);return JSON.parse(raw)});schema.combineIndex(d,parts);
 return {...d,mode:'owner-approved-data',changes:parts.flatMap(x=>x.changes)};
}
export function merge(prev,delta,now=new Date().toISOString()){
 if(!delta||delta.ownerDecision!=='APPROVED_BY_OWNER'||delta.baseRevision!==prev.revision||!Array.isArray(delta.changes)||!delta.changes.length||typeof delta.reviewId!=='string'||!delta.reviewId.trim())throw Error('Explicit approved batch with matching base revision required');
 if(delta.mapVersion&&delta.mapVersion!==prev.mapVersion)throw Error('Map replacement must be reviewed separately');
 const byId=new Map(prev.changes.map(x=>[x.id,structuredClone(x)])),seen=new Set();
 if(byId.size!==prev.changes.length)throw Error('Duplicate previous ID');
 for(const raw of delta.changes){if(!raw||raw.status!=='reviewed'||typeof raw.id!=='string'||seen.has(raw.id))throw Error('Unreviewed/duplicate change');seen.add(raw.id);const old=byId.get(raw.id);
 if(old&&(old.category!==raw.category||old.op!==raw.op))throw Error('Stable ID/category/operation violation '+raw.id);
 const next={...(old||{}),...structuredClone(raw)};
 if(old){next.sources=[...new Map([...(old.sources||[]),...(raw.sources||[])].map(s=>[new URL(s.url).href,s])).values()];next.facts=[...new Map([...(old.facts||[]),...(raw.facts||[])].map(f=>[schema.normalize(f.key),f])).values()];for(const k of ['stats','facets']){if(old[k]||raw[k])next[k]={...(old[k]||{}),...(raw[k]||{})};}for(const k of ['image','mapPoint','missionGuide'])if(old[k]&&!raw[k])next[k]=old[k];next.searchTerms=[...new Set([...(old.searchTerms||[]),...(raw.searchTerms||[])])];}
 byId.set(raw.id,next);
 }
 const out={schema:265,mode:'owner-approved-data',revision:prev.revision+1,mapVersion:prev.mapVersion,approvedAt:now,reviewId:delta.reviewId,changes:[...byId.values()]};if(out.changes.length>schema.MAX_TOTAL)throw Error('Catalog capacity');
 for(let i=0;i<out.changes.length;i+=500)schema.validate({...out,changes:out.changes.slice(i,i+500)});return out;
}
export function pack(d,key){
 const meta={schema:265,mode:'owner-approved-data',revision:d.revision,mapVersion:d.mapVersion,approvedAt:d.approvedAt,reviewId:d.reviewId};let batch=[],parts=[],descs=[],files=new Map();
 const emit=()=>{if(!batch.length)return;const part={...meta,changes:batch};schema.validate(part);const raw=Buffer.from(JSON.stringify(part)),sha256=hash(raw),rel='updates/approved-parts/'+sha256+'.json';files.set(rel,raw);descs.push({path:rel,sha256,count:batch.length,bytes:raw.length});parts.push(part);batch=[];};
 for(const c of [...d.changes].sort((a,b)=>a.id.localeCompare(b.id))){if(batch.length>=500||Buffer.byteLength(JSON.stringify({...meta,changes:[...batch,c]}))>schema.MAX_PART_BYTES)emit();batch.push(c)}emit();
 const index={...meta,mode:schema.INDEX_MODE,count:d.changes.length,parts:descs};schema.combineIndex(index,parts);return {root:signedRoot(index,key),files};
}
function mediaOK(b,rel){const ext=rel.split('.').pop();if(ext==='png')return b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));if(ext==='jpg'||ext==='jpeg')return b[0]===255&&b[1]===216&&b[2]===255;return b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP';}
export async function publish({root,delta,key,dryRun=true,fetchFn=fetch,now}){
 const prev=load(root,createPublicKey(key));
 if(delta.baseRevision<prev.revision){if(delta.reviewId===prev.reviewId)return {status:'already-published',revision:prev.revision};throw Error('Stale batch; rebase and review again');}
 const next=merge(prev,delta,now);const downloaded=new Map(),approvedDownloads=delta.imageDownloads||{};
 for(const c of next.changes){if(!c.image)continue;const m=c.image;if(!imagePath.test(m.path))throw Error('Unsafe image path');
 let bytes;
 if(fs.existsSync(path.join(root,m.path)))bytes=read(root,m.path,900000);
 else{const request=approvedDownloads[c.id];if(!request||request.sha256!==m.sha256||m.rights!=='licensed')throw Error('Missing approved image '+c.id);const u=new URL(request.url);if(u.origin!=='https://gta.wiki'||!/^\/images\/[a-z0-9_/%().,\-]+\.(?:png|jpe?g|webp)$/i.test(u.pathname)||u.search||u.hash)throw Error('Image origin not allowlisted');const r=await fetchFn(u,{redirect:'error',signal:AbortSignal.timeout(20000)});if(!r.ok||!/^image\/(?:png|jpeg|webp)(?:;|$)/i.test(r.headers.get('content-type')||'')||Number(r.headers.get('content-length')||0)>900000)throw Error('Image response not allowed');const chunks=[];let size=0;for await(const chunk of r.body){size+=chunk.length;if(size>900000)throw Error('Image oversized');chunks.push(chunk)}bytes=Buffer.concat(chunks);downloaded.set(m.path,bytes)}
 if(hash(bytes)!==m.sha256||!mediaOK(bytes,m.path))throw Error('Image integrity mismatch '+c.id);
 }
 const result=pack(next,key);
 if(!dryRun){for(const [rel,bytes] of downloaded)write(root,rel,bytes);for(const [rel,bytes] of result.files)write(root,rel,bytes);write(root,rootPath,result.root);const check=load(root,createPublicKey(key));if(check.revision!==next.revision||check.changes.length!==next.changes.length)throw Error('Post-write verification failed');}
 return {status:dryRun?'validated-no-write':'signed-and-verified',revision:next.revision,changes:next.changes.length,parts:result.files.size,images:next.changes.filter(c=>c.image).length};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const root=process.cwd(),batch='automation/approved-batches/pending.json';
 if(!fs.existsSync(batch)){console.log('NO_APPROVED_BATCH: no publication, no signer needed');process.exit(0)}
 if(!process.env.ATLAS_V265_SIGNING_KEY){console.log('SIGNER_SETUP_REQUIRED: no publication');process.exit(1)}
 const key=createPrivateKey(Buffer.from(process.env.ATLAS_V265_SIGNING_KEY,'base64'));if(key.asymmetricKeyType!=='ed25519')throw Error('Wrong key type');
 const delta=JSON.parse(read(root,batch,2500000));const r=await publish({root,delta,key,dryRun:process.env.ATLAS_APPLY!=='true'});console.log(JSON.stringify(r));}
