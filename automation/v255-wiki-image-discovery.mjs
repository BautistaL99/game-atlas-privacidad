/* V255: inspect an exact GTA VI wiki infobox photo and its file-level rights.
 * The source page alone does NOT confer image reuse rights.
 * No image is fetched or copied by this module; only strictly licensed URLs
 * may be carried into the independently signed community catalog.
 */
const clean=s=>String(s||'').trim();
const IMAGE_NAME=/^[^<>[\]{}|:/\\\r\n]{3,145}\.(?:png|jpe?g|webp)$/i;
const VI_IMAGE=/(?:^|[-_. ])(?:GTAVI|GTA[-_ ]?VI|GTA6)(?:[-_. ]|$)/i;
const LICENSE=/^(?:CC0(?: 1\.0)?|Public Domain|CC BY(?:-SA)? [234]\.0)$/i;

export function wikiPhotoCandidate(wikitext=''){
 if(typeof wikitext!=='string'||wikitext.length>130000)return null;
 const rows=[...wikitext.matchAll(/^\s*\|\s*(panel_image|front_image[1-6]?|rear_image[1-6]?|side_image[1-6]?|image[1-6]?)\s*=\s*([^\r\n]{1,180})/gmi)];
 const candidates=[];
 for(const m of rows){
  let filename=m[2].trim().replace(/^File:/i,'').replace(/^\[\[\s*File:/i,'').replace(/\]\].*$/,'').trim();
  filename=filename.split('|')[0].trim();
  if(IMAGE_NAME.test(filename)&&VI_IMAGE.test(filename))candidates.push({filename,priority:/^panel_image$/i.test(m[1])?0:1});
 }
 candidates.sort((a,b)=>a.priority-b.priority);
 return candidates[0]?.filename||null;
}

function safeMediaUrl(url){
 try{
  const u=new URL(url);
  return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&!u.hash&&
    u.hostname==='gta.wiki'&&/^\/images\/[a-z0-9_/%().,-]+\.(?:png|jpe?g|webp)$/i.test(u.pathname)&&
    !u.search?u.href:null;
 }catch{return null}
}
function readable(s){return clean(String(s||'').replace(/<[^>]*>/g,'')).slice(0,180)}
export function licensedWikiPhoto(page,filename,sourceUrl){
 const info=page?.imageinfo?.[0];
 if(!info||page?.missing===true||!IMAGE_NAME.test(filename)||!VI_IMAGE.test(filename))return null;
 const actual=String(page.title||'').replace(/^File:/i,'').replace(/_/g,' ');
 if(actual.toLowerCase()!==filename.replace(/_/g,' ').toLowerCase())return null;
 const license=readable(info.extmetadata?.LicenseShortName?.value);
 if(!LICENSE.test(license))return null;
 const remote=safeMediaUrl(info.url);
 if(!remote||!['image/png','image/jpeg','image/webp'].includes(info.mime)||
    !Number.isSafeInteger(info.size)||info.size<1000||info.size>600000)return null;
 let filePage;
 try{filePage=new URL('https://gta.wiki/w/File:'+encodeURIComponent(filename.replace(/ /g,'_'))).href}catch{return null}
 if(!/^https:\/\/gta\.wiki\/w\/[a-z0-9%_.-]+/i.test(sourceUrl))return null;
 return {type:'wiki-licensed',remote,license,sourcePage:filePage,
  caption:{es:'Imagen de la ficha original en GTA Wiki · '+license,
           en:'Original entry image on GTA Wiki · '+license,
           pt:'Imagem da ficha original no GTA Wiki · '+license}};
}
export async function enrichWikiImageBatch(rows,contentById,requestText,{max=60}={}){
 if(!Array.isArray(rows)||!(contentById instanceof Map)||typeof requestText!=='function')return {items:rows,checked:0,accepted:0,errors:[]};
 const candidates=rows.map(row=>({row,filename:wikiPhotoCandidate(contentById.get(row.id))}))
  .filter(x=>x.filename).slice(0,max);
 const byId=new Map(),errors=[];let checked=0,accepted=0;
 for(let offset=0;offset<candidates.length;offset+=8){
  const slice=candidates.slice(offset,offset+8);
  const titles=slice.map(x=>'File:'+x.filename).join('|');
  const params=new URLSearchParams({action:'query',prop:'imageinfo',iiprop:'url|size|mime|extmetadata',
   titles,format:'json',formatversion:'2'});
  try{
   const data=JSON.parse(await requestText('https://gta.wiki/api.php?'+params));
   const pages=Array.isArray(data.query?.pages)?data.query.pages:[];
   const pagesByTitle=new Map(pages.map(x=>[String(x.title||'').replace(/_/g,' ').toLowerCase(),x]));
   for(const c of slice){
    checked++;
    const page=pagesByTitle.get(('File:'+c.filename).replace(/_/g,' ').toLowerCase());
    const image=licensedWikiPhoto(page,c.filename,c.row.sourceUrl);
    if(image){byId.set(c.row.id,{...c.row,image});accepted++}
   }
  }catch(e){errors.push('Wiki image batch skipped: '+String(e.message).slice(0,120))}
 }
 return {items:rows.map(r=>byId.get(r.id)||r),checked,accepted,errors};
}
