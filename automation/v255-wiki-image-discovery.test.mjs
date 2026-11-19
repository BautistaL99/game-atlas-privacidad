import test from 'node:test';
import assert from 'node:assert/strict';
import {wikiPhotoCandidate,licensedWikiPhoto,enrichWikiImageBatch} from './v255-wiki-image-discovery.mjs';
import {wikiFiche,parseWikiInfobox,sha} from './v210-sources.mjs';
import {validatePublication,mergeWiki} from './v210-publisher.mjs';

const file='Mule-GTAVI-AnExtendedLook-AztecaGold.png';
const source='https://gta.wiki/w/Mule';
const photo={title:'File:'+file,imageinfo:[{url:'https://gta.wiki/images/a/ab/'+file,
 mime:'image/png',size:120000,extmetadata:{LicenseShortName:{value:'CC BY-SA 4.0'}}}]};
const old=()=>({schema:205,mode:'INDEPENDENT_REPORTING_AND_COMMUNITY_WIKI_NOT_OFFICIAL',
 revision:1,news:[],fiches:[]});
test('V255 selects the GTA VI photo instead of older GTA V views',()=>{
 const wiki='{{Infobox\n|panel_image2=Mule-GTAVee-FrontQuarter.png\n|panel_image='+file+'\n|data4=Commercial\n}}';
 assert.equal(wikiPhotoCandidate(wiki),file);
 assert.equal(wikiPhotoCandidate('{{Infobox|panel_image=Mule-GTAVee-FrontQuarter.png}}'),null);
});
test('V255 checks independent file-level rights and exact source identity',()=>{
 const accepted=licensedWikiPhoto(photo,file,source);
 assert.equal(accepted.type,'wiki-licensed');
 assert.equal(accepted.remote,photo.imageinfo[0].url);
 assert.deepEqual(Object.keys(accepted.caption).sort(),['en','es','pt']);
 assert.equal(licensedWikiPhoto({...photo,imageinfo:[{...photo.imageinfo[0],extmetadata:{LicenseShortName:{value:'Fair Use'}}}]},file,source),null);
 assert.equal(licensedWikiPhoto({...photo,imageinfo:[{...photo.imageinfo[0],url:'https://evil.example/picture.png'}]},file,source),null);
 assert.equal(licensedWikiPhoto(photo,'Something-GTAVI.png',source),null);
});
test('V255 signs a valid exact-game image for a real wiki identity; never republishes unrelated rights',async()=>{
 const row=wikiFiche('Mule','vehiculos',4523,123);
 const wiki='{{Infobox Vehicle\n|panel_image='+file+'\n|type=Medium truck\n}}';
 const requests=[];
 const fetchText=async(url)=>{requests.push(url);return JSON.stringify({query:{pages:[photo]}})};
 const res=await enrichWikiImageBatch([row],new Map([[row.id,wiki]]),fetchText);
 assert.equal(res.checked,1);assert.equal(res.accepted,1);assert.equal(res.items[0].image.remote,photo.imageinfo[0].url);
 const state=mergeWiki(old(),res.items).next;
 assert.equal(validatePublication(state),true);
 assert.equal(mergeWiki(state,res.items).changed,0,'a second scan is idempotent');
 assert(requests[0].includes('prop=imageinfo'));
 assert.equal(parseWikiInfobox(wiki)[0].value,'Medium truck');
});
test('V255 fallback leaves the existing image-free data intact if all rights are unknown',async()=>{
 const row=wikiFiche('Mule','vehiculos',4523,123);
 const r=await enrichWikiImageBatch([row],new Map([[row.id,'{{Infobox\n|panel_image='+file+'\n}}']]),
  async()=>JSON.stringify({query:{pages:[{...photo,imageinfo:[{...photo.imageinfo[0],extmetadata:{LicenseShortName:{value:'Copyrighted'}}}]}]}}));
 assert.equal(r.checked,1);assert.equal(r.accepted,0);assert.equal(r.items[0].image,undefined);
 assert.equal(validatePublication(mergeWiki(old(),r.items).next),true);
});
