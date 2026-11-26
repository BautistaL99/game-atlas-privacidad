// Read-only health audit of the exact signed feeds used by V267. No private key.
import fs from 'node:fs';import path from 'node:path';
import {createPublicKey} from 'node:crypto';import {fileURLToPath} from 'node:url';
import {load,hash} from './approved-publisher.mjs';
import {LIMITS,checkCatalog,checkImages,checkHistory} from './resource-budget.mjs';
import {verifyFeed,validatePublication} from '../v210-publisher.mjs';
const KEY='HIJf+oyNe/PVOwDqWBlCC9SGWiQ88DzTVbYk44VBiX4=';
const warn=(rows,name,value,limit)=>{if(!Number.isSafeInteger(value)||value<0||value>limit)throw Error('Health budget exceeded: '+name);rows.push({name,value,limit,percent:Math.round(value/limit*1000)/10,warning:value>=limit*.8});};
export function usageReport({community,communityBytes,approved,partBytes,partCount,imageCount,imageBytes,decodedPixelBytes,partHistory,imageHistory,officialCount}){
 const rows=[];for(const [name,value,limit] of [
 ['community records',community.fiches.length,1000],['community news',community.news.length,220],['community envelope bytes',communityBytes,2200000],['official records',officialCount,1500],
 ['approved records',approved.changes.length,LIMITS.activeRecords],['approved parts',partCount,LIMITS.activeParts],['approved part bytes',partBytes,LIMITS.activePartBytes],['approved images',imageCount,LIMITS.activeImages],['approved compressed image bytes',imageBytes,LIMITS.activeImageBytes],['nominal decoded RGBA bytes',decodedPixelBytes,LIMITS.activePixels*4],['historical part bytes',partHistory,LIMITS.historicalParts],['historical image bytes',imageHistory,LIMITS.historicalImages]])warn(rows,name,value,limit);
 const ids=new Map(community.fiches.map(x=>[x.id,x.category]));
 for(const c of approved.changes){if(c.id.startsWith('wiki-community-')&&(c.op!=='patch'||ids.get(c.id)!==c.category))throw Error('Missing or incompatible community base: '+c.id);}
 return {status:'verified-local-feeds',communityRevision:community.revision,approvedRevision:approved.revision,rows,warnings:rows.filter(x=>x.warning).map(x=>x.name)};
}
function read(root,rel,max){const f=path.join(root,rel);const s=fs.lstatSync(f);if(!s.isFile()||s.size>max||fs.realpathSync(f)!==path.resolve(f))throw Error('Unsafe health audit file '+rel);return fs.readFileSync(f);}
export function audit(root=process.cwd()){
 const communityRaw=read(root,'updates/community-envelope-v205.json',2200000),community=verifyFeed(JSON.parse(communityRaw),205);validatePublication(community);
 const official=verifyFeed(JSON.parse(read(root,'updates/catalog-envelope.json',4000000)),1);validatePublication(official);
 const pub=createPublicKey({key:Buffer.concat([Buffer.from('302a300506032b6570032100','hex'),Buffer.from(KEY,'base64')]),format:'der',type:'spki'});
 const approved=load(root,pub);
 const e=JSON.parse(read(root,'updates/approved-content-v265.json',2500000)),d=JSON.parse(Buffer.from(e.payload,'base64'));
 const parts=new Map((d.parts||[]).map(x=>[x.path,read(root,x.path,x.bytes)]));checkCatalog(approved,parts);
 const images=[];for(const c of approved.changes){if(!c.image)continue;const bytes=read(root,c.image.path,LIMITS.imageBytes);if(hash(bytes)!==c.image.sha256)throw Error('Image hash mismatch: '+c.id);images.push([c.image.path,bytes]);}
 const media=checkImages(images),history=checkHistory(root,parts,new Map());
 return usageReport({community,communityBytes:communityRaw.length,approved,partBytes:[...parts.values()].reduce((s,b)=>s+b.length,0),partCount:parts.size,imageCount:images.length,...media,...history,officialCount:official.items.length});
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){const report=audit();console.log(JSON.stringify(report,null,2));for(const w of report.warnings)console.log('::warning::V267 resource usage at or above 80%: '+w);}
