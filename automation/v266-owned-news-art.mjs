/* Game Atlas owned artwork fallback for the signed catalog used by V266 R18.
 * Never claims to be an actual Rockstar screenshot. No third-party artwork.
 * The bytes are deterministic so the Ed25519 client can verify SHA-256.
 */
import {createHash} from 'node:crypto';
import {deflateSync} from 'node:zlib';
import {mkdirSync,writeFileSync} from 'node:fs';
const W=960,H=540;
const clamp=v=>Math.min(255,Math.max(0,Math.round(v)));
function crc(buf){
 let c=0xffffffff;
 for(const b of buf){c^=b;for(let i=0;i<8;i++)c=(c>>>1)^(0xedb88320&-(c&1));}
 return (c^0xffffffff)>>>0;
}
function chunk(tag,data){
 const tagBytes=Buffer.from(tag),size=Buffer.alloc(4),check=Buffer.alloc(4);
 size.writeUInt32BE(data.length);
 check.writeUInt32BE(crc(Buffer.concat([tagBytes,data])));
 return Buffer.concat([size,tagBytes,data,check]);
}
const FONT={
 'A':['01110','10001','10001','11111','10001','10001','10001'],
 'E':['11111','10000','10000','11110','10000','10000','11111'],
 'G':['01111','10000','10000','10111','10001','10001','01110'],
 'I':['11111','00100','00100','00100','00100','00100','11111'],
 'L':['10000','10000','10000','10000','10000','10000','11111'],
 'M':['10001','11011','10101','10101','10001','10001','10001'],
 'N':['10001','11001','10101','10011','10001','10001','10001'],
 'R':['11110','10001','10001','11110','10100','10010','10001'],
 'S':['01111','10000','10000','01110','00001','00001','11110'],
 'T':['11111','00100','00100','00100','00100','00100','00100'],
 'W':['10001','10001','10001','10101','10101','10101','01010'],
 ' ':['00000','00000','00000','00000','00000','00000','00000']
};
function pixel(buf,x,y,r,g,b,a=1){
 if(x<0||x>=W||y<0||y>=H)return;
 const i=(y*W+x)*3,inv=1-a;
 buf[i]=clamp(buf[i]*inv+r*a);
 buf[i+1]=clamp(buf[i+1]*inv+g*a);
 buf[i+2]=clamp(buf[i+2]*inv+b*a);
}
function drawText(buf,value,x,y,scale,r,g,b){
 for(const ch of value){const glyph=FONT[ch];if(glyph){
  for(let cy=0;cy<7;cy++)for(let cx=0;cx<5;cx++)if(glyph[cy][cx]==='1')
   for(let yy=0;yy<scale;yy++)for(let xx=0;xx<scale;xx++)pixel(buf,x+cx*scale+xx,y+cy*scale+yy,r,g,b,1);
 }x+=scale*6;}
}
export function renderOwnedNewsArt(){
 const rgb=Buffer.alloc(W*H*3);
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  const u=x/W,v=y/H;
  const glow=Math.max(0,1-Math.hypot((u-.79)*1.3,(v-.28)*1.75));
  const teal=Math.max(0,1-Math.hypot((u-.12)*1.1,(v-1)*1.8));
  const wave=Math.sin(x*.019+y*.028)*.5+.5;
  const i=(y*W+x)*3;
  rgb[i]=clamp(8+20*u+14*v+54*glow+6*wave);
  rgb[i+1]=clamp(18+19*u+18*v+54*teal+30*glow);
  rgb[i+2]=clamp(37+38*u-7*v+29*glow+22*teal);
 }
 // Abstract light halo, not a GTA screenshot.
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  const dx=(x-756)/170,dy=(y-212)/170,d=Math.hypot(dx,dy);
  if(d<1){const fog=Math.max(0,1-d*d);pixel(rgb,x,y,73,179,187,.16*fog)}
  if(d>.73&&d<.76)pixel(rgb,x,y,89,216,199,.34);
 }
 // Graphic lines evoke an atlas map without implying real locations.
 for(let y=336;y<540;y++){
  const base=366+28*Math.sin((y-320)*.016);
  for(let x=0;x<W;x++)if(Math.abs(y-(base+44*Math.sin(x*.006+y*.008)))<1.1)
   pixel(rgb,x,y,57,219,206,.34);
 }
 for(let x=72;x<892;x++)for(let y=360;y<364;y++)pixel(rgb,x,y,105,221,208,.56);
 for(let x=72;x<208;x++)for(let y=99;y<106;y++)pixel(rgb,x,y,110,233,222,.92);
 drawText(rgb,'GAME ATLAS',72,145,11,235,247,249);
 drawText(rgb,'NEWSWIRE',74,293,6,112,233,216);
 // Native PNG without dependencies, deterministic for a stable signed SHA-256.
 const raw=Buffer.alloc(H*(W*3+1));
 for(let y=0;y<H;y++){const offset=y*(W*3+1);raw[offset]=0;rgb.copy(raw,offset+1,y*W*3,(y+1)*W*3)}
 const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(W,0);ihdr.writeUInt32BE(H,4);ihdr[8]=8;ihdr[9]=2;
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))]);
}
export function ownedNewsImageRecord(digest){
 if(!/^[a-f0-9]{64}$/.test(digest))throw Error('Bad owned art digest');
 return {path:'updates/assets/'+digest+'.png',sha256:digest,rights:'owned',alt:{
  es:'Ilustración genérica original de Game Atlas para noticias oficiales; no es una foto del artículo.',
  en:'Original generic Game Atlas artwork for official news; not an article photograph.',
  pt:'Ilustração genérica original do Game Atlas para notícias oficiais; não é foto da notícia.'
 }};
}
export function ensureOwnedNewsAsset(){
 const data=renderOwnedNewsArt();
 if(data.length>500000)throw Error('Original art too large for V266 Android signed asset reader');
 const sha=createHash('sha256').update(data).digest('hex');
 mkdirSync('updates/assets',{recursive:true});
 writeFileSync('updates/assets/'+sha+'.png',data);
 return {sha,size:data.length,record:ownedNewsImageRecord(sha)};
}
if(import.meta.url===new URL('file://'+process.argv[1]).href){
 const result=ensureOwnedNewsAsset();console.log('OWNED_ART_READY',result.sha,result.size,result.record.path);
}
