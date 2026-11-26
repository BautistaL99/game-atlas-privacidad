/* GAME ATLAS V265 - shared validator for owner-approved DATA ONLY. Browser + Node.
   This file is part of the reviewed application bundle; remote feeds are JSON, never executable code. */
(function(root){'use strict';
 const LANG=['es','en','pt'];
 const CATEGORIES=new Set(['personajes','vehiculos','armas','misiones','economia','mapa-lugares','coleccionables','secretos','actividades','mundo','flora-fauna','musica','actualizaciones']);
 const MAPPABLE=new Set(['personajes','vehiculos','armas','misiones','economia','mapa-lugares','coleccionables','secretos','actividades','mundo']);
 const MAP_ID=/^map-[a-z0-9][a-z0-9-]{4,55}$/;
 const ID=/^[a-z0-9][a-z0-9_-]{1,119}$/;
 const ALLOWED_KEY=/^[a-z0-9_-]{1,50}$/;
 const plain=(s,max=1000)=>typeof s==='string'&&s.length>0&&s.length<=max&&!/[<>\x00-\x1f]/.test(s);
 const loc=(v,max=1000)=>v&&typeof v==='object'&&!Array.isArray(v)&&LANG.every(l=>plain(v[l],max));
 const str=(v,context,max)=>{if(!plain(v,max))throw Error(context+' invalid');return v};
 const url=v=>{
   if(typeof v!=='string'||v.length>500)throw Error('Unacceptable URL');
   const u=new URL(v);if(u.protocol!=='https:'||u.username||u.password||u.port||u.hash||u.hostname==='localhost'||u.hostname.endsWith('.local')||u.hostname==='127.0.0.1'||u.hostname.endsWith('.internal'))throw Error('URL must be public HTTPS');
   return u.href;
 };
 const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
 function validate(payload){
  if(!payload||payload.schema!==265||payload.mode!=='owner-approved-data'||!Number.isSafeInteger(payload.revision)||payload.revision<1||!Array.isArray(payload.changes)||payload.changes.length>1000||(!payload.changes.length&&(payload.revision!==1||payload.reviewId!=='bootstrap-v267-empty')))throw Error('Approved feed schema or revision');
  if(typeof payload.mapVersion!=='string'||!MAP_ID.test(payload.mapVersion))throw Error('Map version mismatch');
  if(!plain(payload.approvedAt,32)||!/^\d{4}-\d\d-\d\dT/.test(payload.approvedAt)||!plain(payload.reviewId,90))throw Error('Review metadata required');
  const seen=new Set(),changes=[];
  for(const c of payload.changes){
   if(!c||!ID.test(c.id)||seen.has(c.id)||!['add','patch'].includes(c.op)||!CATEGORIES.has(c.category))throw Error('Duplicate/invalid ID or category');seen.add(c.id);
   if(c.status!=='reviewed')throw Error('Not owner reviewed');
   if(!loc(c.title,180)||!loc(c.summary,1250))throw Error('All three title/summary translations required');
   if(!Array.isArray(c.sources)||c.sources.length<1||c.sources.length>8)throw Error('Evidence URL required');
   const sources=c.sources.map(src=>({url:url(src?.url),label:str(src?.label,'source label',110),checkedAt:str(src?.checkedAt,'review date',32)}));
   const terms=c.searchTerms||[];
   if(!Array.isArray(terms)||terms.length>60||terms.some(x=>!plain(x,80)))throw Error('Bad search terms');
   const facts=c.facts||[];if(!Array.isArray(facts)||facts.length>55)throw Error('Bad facts');
   const factIDs=new Set();const reviewedFacts=facts.map(f=>{
    if(!f||f.verified!==true||!plain(f.key,70)||!loc(f.value,220)||!f.sourceUrl||factIDs.has(norm(f.key)))throw Error('Unverified or duplicate fact');
    factIDs.add(norm(f.key));const evidence=url(f.sourceUrl);
    if(!sources.some(src=>src.url===evidence))throw Error('Fact evidence must be among sources');
    if(f.label!==undefined&&!loc(f.label,75))throw Error('Fact label untranslated');
    return {key:f.key,label:f.label,value:f.value,verified:true,sourceUrl:evidence};
   });
   const facets=c.facets||{};if(!facets||typeof facets!=='object'||Array.isArray(facets)||Object.keys(facets).length>45)throw Error('Facets');
   for(const [k,v] of Object.entries(facets))if(!ALLOWED_KEY.test(k)||!((typeof v==='string'&&plain(v,180))||(typeof v==='number'&&Number.isFinite(v))))throw Error('Bad facet');
   let mapPoint;
   if(c.mapPoint!==undefined){const m=c.mapPoint;
    if(!MAPPABLE.has(c.category)||typeof m?.mapVersion!=='string'||!MAP_ID.test(m.mapVersion)||!['verified-in-game','community-corroborated'].includes(m.reviewStatus)||!Number.isFinite(m.x)||!Number.isFinite(m.y)||m.x<0||m.x>100||m.y<0||m.y>100||!m.evidenceUrl||!m.sourcePinId)throw Error('Map coordinate lacks reviewed provenance');
    const evidence=url(m.evidenceUrl);if(!sources.some(src=>src.url===evidence))throw Error('Map coordinate source not reviewed');
    if(m.reviewStatus==='community-corroborated'){
     const independentHosts=new Set(sources.map(src=>new URL(src.url).hostname.replace(/^www\./,'')));
     if(independentHosts.size<2)throw Error('Community map point requires two independent source domains');
    }
    mapPoint={mapVersion:m.mapVersion,x:m.x,y:m.y,sourcePinId:String(m.sourcePinId),evidenceUrl:evidence,reviewStatus:m.reviewStatus};
   }
   const stats={};const statNotes={};
   if(c.stats!==undefined){
    if(!['vehiculos','armas'].includes(c.category)||!c.stats||typeof c.stats!=='object'||Array.isArray(c.stats)||Object.keys(c.stats).length>18)throw Error('Invalid numeric specs');
    for(const [key,spec] of Object.entries(c.stats)){
     if(!ALLOWED_KEY.test(key)||!spec||typeof spec.value!=='number'||!Number.isFinite(spec.value)||spec.value<0||spec.value>1000000||!plain(spec.unit,15)||!plain(spec.method,150)||!spec.sourceUrl)throw Error('Invalid numeric stat');
     const evidence=url(spec.sourceUrl);if(!sources.some(src=>src.url===evidence))throw Error('Stat evidence source not approved');
     if(spec.unit==='unknown'||spec.method.toLowerCase().includes('guess'))throw Error('Numeric stat method unverified');
     stats[key]=spec.value;statNotes[key]={unit:spec.unit,method:spec.method,sourceUrl:evidence};
    }
   }
   let image;
   if(c.image!==undefined){const m=c.image;
    if(!m||!/^updates\/assets\/[a-f0-9]{64}\.(?:png|jpe?g|webp)$/.test(m.path)||m.sha256!==m.path.match(/[a-f0-9]{64}/)[0]||!['owned','licensed'].includes(m.rights)||!loc(m.alt,180)||!plain(m.rightsEvidence,300))throw Error('Image rights and SHA-256 required');
    image={...m};
   }
   let missionGuide;
   if(c.missionGuide!==undefined){if(c.category!=='misiones')throw Error('Guide outside mission');const g=c.missionGuide;if(!g||!loc(g.teaser,800)||!Array.isArray(g.steps)||g.steps.length>36||g.steps.some(x=>!loc(x,400))||!loc(g.requirements,500)||!loc(g.reward,500)||!plain(g.sourceUrl,500))throw Error('Incomplete translated mission guide');const evidence=url(g.sourceUrl);if(!sources.some(src=>src.url===evidence))throw Error('Guide source not reviewed');missionGuide={...g,url:evidence};}
   changes.push({op:c.op,id:c.id,slug:c.id,category:c.category,status:'verified',title:c.title,summary:c.summary,desc:c.summary,trackable:typeof c.trackable==='boolean'?c.trackable:undefined,tags:terms,searchTerms:terms,facets,facts:reviewedFacts,sources,stats,statNotes,image,mapPoint,missionGuide,reviewedAt:payload.approvedAt,reviewId:payload.reviewId,spoilerLevel:c.category==='misiones'?2:0});
  }
  return {revision:payload.revision,mapVersion:payload.mapVersion,approvedAt:payload.approvedAt,reviewId:payload.reviewId,changes};
 }
 // V267 R3: signed index authorizes content-addressed, bounded JSON parts.
 const INDEX_MODE='owner-approved-index-v267',MAX_TOTAL=20000,MAX_PARTS=128,MAX_PART_BYTES=1500000,MAX_TOTAL_BYTES=32000000;
 function validateIndex(p){
  if(!p||p.schema!==265||p.mode!==INDEX_MODE||!Number.isSafeInteger(p.revision)||p.revision<2||(typeof p.mapVersion!=='string'||!MAP_ID.test(p.mapVersion))||!plain(p.approvedAt,32)||!/^\d{4}-\d\d-\d\dT/.test(p.approvedAt)||!plain(p.reviewId,90)||!Number.isSafeInteger(p.count)||p.count<1||p.count>MAX_TOTAL||!Array.isArray(p.parts)||!p.parts.length||p.parts.length>MAX_PARTS)throw Error('Invalid approved index');
  let count=0,bytes=0;const seen=new Set();
  for(const x of p.parts){if(!x||typeof x.sha256!=='string'||! /^[a-f0-9]{64}$/.test(x.sha256)||x.path!=='updates/approved-parts/'+x.sha256+'.json'||seen.has(x.sha256)||!Number.isSafeInteger(x.count)||x.count<1||x.count>1000||!Number.isSafeInteger(x.bytes)||x.bytes<1||x.bytes>MAX_PART_BYTES)throw Error('Invalid approved part descriptor');seen.add(x.sha256);count+=x.count;bytes+=x.bytes;}
  if(count!==p.count||bytes>MAX_TOTAL_BYTES)throw Error('Approved index size/count mismatch');return p;
 }
 function combineIndex(index,parts){validateIndex(index);if(!Array.isArray(parts)||parts.length!==index.parts.length)throw Error('Approved index incomplete');const seen=new Set(),changes=[];
  for(let i=0;i<parts.length;i++){const p=parts[i];if(p.revision!==index.revision||p.mapVersion!==index.mapVersion||p.approvedAt!==index.approvedAt||p.reviewId!==index.reviewId||!Array.isArray(p.changes)||p.changes.length!==index.parts[i].count)throw Error('Approved part revision/count mismatch');const validated=validate(p);for(const c of validated.changes){if(seen.has(c.id))throw Error('Duplicate approved ID across parts');seen.add(c.id);changes.push(c);}}
  return {revision:index.revision,mapVersion:index.mapVersion,approvedAt:index.approvedAt,reviewId:index.reviewId,changes};
 }
 const api={validate,validateIndex,combineIndex,INDEX_MODE,MAX_TOTAL,MAX_PARTS,MAX_PART_BYTES,MAX_TOTAL_BYTES,normalize:norm,categories:[...CATEGORIES]};
 root.viApprovedSchemaV265=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
