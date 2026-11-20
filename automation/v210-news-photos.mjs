/* Safe matching for official Rockstar Newswire images.
 * Never guess a cover from another post or embed third-party media.
 * This module only produces structured catalog data, not client code. */
import {boundedText} from './v210-sources.mjs';
const NEWSWIRE=/^https:\/\/www\.rockstargames\.com\/newswire\/article\/([a-z0-9_-]+)\/[a-z0-9_-]+\/?$/i;
function metadata(html,name){
 for(const found of String(html).matchAll(/<meta\b[^>]{0,2000}>/gi)){
  const attrs={};
  for(const part of found[0].matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/g))attrs[part[1].toLowerCase()]=part[3];
  if((attrs.property||attrs.name)?.toLowerCase()===name)return attrs.content||'';
 }
 return '';
}
export function matchRockstarArticleImage(article,raw){
 const found=typeof article==='string'&&article.match(NEWSWIRE);
 if(!found||typeof raw!=='string'||raw.length>600)return null;
 let image;try{image=new URL(raw.replaceAll('&amp;','&'));}catch{return null;}
 if(image.origin!=='https://media-rockstargames-com.akamaized.net'||image.search||image.hash||image.username||image.password||image.port)return null;
 const path=new RegExp('^/tina-uploads/posts/'+found[1]+'/[a-f0-9]{40}\\.(?:jpe?g|png|webp)$','i');
 if(!path.test(image.pathname))return null;
 return {type:'official',remote:image.href,officialPage:article,caption:{
  es:'Imagen oficial: Rockstar Games',en:'Official image: Rockstar Games',pt:'Imagem oficial: Rockstar Games'
 }};
}
export async function getPhotoForOfficialArticle(article,fetchFn=fetch){
 if(typeof article!=='string'||!NEWSWIRE.test(article))return null;
 try{
  const html=await boundedText(article,fetchFn,{max:1800000,headers:{Accept:'text/html'}});
  for(const key of ['og:image','og:image:url','twitter:image']){
   const image=matchRockstarArticleImage(article,metadata(html,key));
   if(image)return image;
  }
 }catch{} // A failed source must never poison the previously signed catalog.
 return null;
}
