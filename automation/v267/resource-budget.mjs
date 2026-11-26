/* Conservative release budget for V267 installed clients.
 * They retain immutable parts/images, and prefetch approved images. Do not equate
 * wire bytes with decoded RAM or claim these are measured device limits. */
import fs from 'node:fs';import path from 'node:path';
export const LIMITS=Object.freeze({batch:6,newImages:2,newMapPoints:2,activeRecords:400,activeParts:4,activePartBytes:768*1024,activeImages:24,imageBytes:256*1024,imagePixels:600000,imageEdge:1024,activeImageBytes:4*1024*1024,activePixels:8*1024*1024,historicalParts:12*1024*1024,historicalImages:8*1024*1024});
const stop=what=>{throw Error('V267 resource budget: '+what+'; keep previous revision and review before increasing limits')};
export function checkDelta(prev,delta){
 if(!Array.isArray(delta.changes)||delta.changes.length>LIMITS.batch)stop('max six changed records');
 const old=new Map(prev.changes.map(c=>[c.id,c]));
 let images=0,pins=0;
 for(const c of delta.changes){const o=old.get(c.id);if(c.image&&c.image.sha256!==o?.image?.sha256)images++;if(c.mapPoint&&JSON.stringify(c.mapPoint)!==JSON.stringify(o?.mapPoint))pins++;}
 if(images>LIMITS.newImages)stop('max two new or replaced images');if(pins>LIMITS.newMapPoints)stop('max two new or changed map points');
}
export function checkCatalog(next,parts){if(next.changes.length>LIMITS.activeRecords)stop('active record count');if(parts.size>LIMITS.activeParts||[...parts.values()].reduce((s,b)=>s+b.length,0)>LIMITS.activePartBytes)stop('active catalog bytes/parts');if(next.changes.some(c=>c.mapPoint&&c.mapPoint.mapVersion!==next.mapVersion))stop('map version mismatch');}
export function imageDimensions(b,ext){
 if(ext==='png'){if(b.length<33||b.toString('ascii',12,16)!=='IHDR')stop('invalid PNG header');let i=8;while(i+12<=b.length){const n=b.readUInt32BE(i),tag=b.toString('ascii',i+4,i+8);if(n>b.length-i-12)stop('truncated PNG');if(tag==='acTL')stop('animated PNG');i+=12+n;if(tag==='IEND')break;}return [b.readUInt32BE(16),b.readUInt32BE(20)];}
 if(ext==='jpg'||ext==='jpeg'){let i=2;while(i+4<=b.length){if(b[i++]!==255)stop('invalid JPEG marker');while(b[i]===255)i++;const m=b[i++];if(m===0xd9||m===0xda)break;if(m===0x01||m>=0xd0&&m<=0xd7)continue;if(i+2>b.length)break;const n=b.readUInt16BE(i);if(n<2||i+n>b.length)stop('truncated JPEG');if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(m)){if(n<8)stop('invalid JPEG frame');return [b.readUInt16BE(i+5),b.readUInt16BE(i+3)];}i+=n;}stop('missing JPEG frame');}
 if(ext==='webp'){if(b.length<30)stop('invalid WebP header');const tag=b.toString('ascii',12,16);if(tag==='VP8X'){if(b[20]&2)stop('animated WebP');return [1+b.readUIntLE(24,3),1+b.readUIntLE(27,3)];}if(tag==='VP8L'&&b[20]===47){const v=b.readUInt32LE(21);return [1+(v&16383),1+((v>>>14)&16383)];}if(tag==='VP8 '&&b[23]===157&&b[24]===1&&b[25]===42)return [b.readUInt16LE(26)&16383,b.readUInt16LE(28)&16383];}
 stop('unsupported image frame');
}
export function checkImages(images){let bytes=0,pixels=0;for(const [rel,b] of images){if(b.length>LIMITS.imageBytes)stop('image compressed bytes');const [w,h]=imageDimensions(b,rel.split('.').pop());if(!w||!h||w>LIMITS.imageEdge||h>LIMITS.imageEdge||w*h>LIMITS.imagePixels)stop('image dimensions');bytes+=b.length;pixels+=w*h;}if(images.length>LIMITS.activeImages||bytes>LIMITS.activeImageBytes||pixels>LIMITS.activePixels)stop('active image cache or decoded pixel budget');return {imageBytes:bytes,decodedPixelBytes:pixels*4};}
function history(root,dir,pattern,added){const folder=path.join(root,dir),existing=new Set();let bytes=0;if(fs.existsSync(folder))for(const e of fs.readdirSync(folder,{withFileTypes:true})){if(!pattern.test(e.name))continue;if(!e.isFile())stop('nonregular history asset');existing.add(dir+'/'+e.name);bytes+=fs.statSync(path.join(folder,e.name)).size;}for(const [rel,b] of added)if(!existing.has(rel))bytes+=b.length;return bytes;}
export function checkHistory(root,parts,images){const partHistory=history(root,'updates/approved-parts',/^[a-f0-9]{64}\.json$/,parts),imageHistory=history(root,'updates/assets',/^[a-f0-9]{64}\.(png|jpe?g|webp)$/,images);if(partHistory>LIMITS.historicalParts||imageHistory>LIMITS.historicalImages)stop('retained history bytes');return {partHistory,imageHistory};}
