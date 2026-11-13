/* V219 unified signed-content bridge.
   Only community-v206.js can call this after Ed25519 and schema validation.
   No remote scripts, no account login, no edits to local user progress.
   The catalog's native records remain the index for all categories, global
   search, favorite IDs, item detail cards and comparison. */
(()=>{'use strict';
 let last=null,applying=false;
 const loc=['es','en','pt'];
 const valid=(o,n=250)=>o&&typeof o==='object'&&loc.every(l=>typeof o[l]==='string'&&o[l].length>0&&o[l].length<=n);
 const norm=x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
 const originalSource=(u)=>{try{const x=new URL(u);return x.protocol==='https:'&&['gta.wiki','rockstarintel.com','www.rockstarintel.com'].includes(x.hostname)}catch{return false}};
 const recordKey=r=>r.category+':'+norm(r.title?.en||r.title?.es);
 function wikiFields(fiche){
  const raw=new Map((fiche.specs||[]).map(x=>[x.key,x.value]));
  const fields=[],terms=[];
  for(const spec of fiche.specsI18n||[]){
   if(!spec||raw.get(spec.key)!==spec.sourceValue||!valid(spec.label,170)||!valid(spec.value,170))continue;
   fields.push({key:spec.label.en,value:spec.value.en,verified:true,
     keyI18n:spec.label,valueI18n:spec.value,atlasWikiSource:fiche.sourceUrl,
     wikiRevision:fiche.wikiRevision});
   terms.push(...loc.flatMap(l=>[spec.label[l],spec.value[l]]));
  }
  return {fields,terms};
 }
 function prepareRows(feed){
  const before=window.viCatalogFullSnapshot?.()||[];
  const base=new Map(before.map(r=>[r.id,r]));
  const curated=new Map();
  for(const row of before){
   if(row.facets?.trustedWiki===1||row.facets?.independentMedia===1)continue;
   curated.set(recordKey(row),row);
  }
  const mapped=new Map();
  for(const f of feed.fiches){
   if(!f||!valid(f.title,160)||!valid(f.summary,450)||!originalSource(f.sourceUrl))continue;
   if(!['vehiculos','personajes','armas','mapa-lugares'].includes(f.category))continue;
   const {fields,terms}=wikiFields(f),existing=curated.get(recordKey(f))||base.get(f.id);
   const id=existing?.id||f.id;
   const originalFacts=(existing?.facts||[]).filter(x=>!x.atlasWikiSource);
   const source={url:f.sourceUrl,label:'GTA Wiki',checkedAt:''};
   const sources=[...(existing?.sources||[]).filter(x=>x.url!==f.sourceUrl),source];
   const baseTags=existing?.tags||[];
   const sourceRecord={
     id,slug:id,category:f.category,status:'verified',trackable:existing?.trackable===undefined?false:existing.trackable,
     title:existing?.title||f.title,summary:existing?.summary||f.summary,desc:existing?.desc||f.summary,
     facts:[...originalFacts,...fields],searchTerms:[...(existing?.searchTerms||[]),...terms],
     sources,facets:{...(existing?.facets||{}),trustedWiki:1},
     wikiSourceInfo:{id:f.id,url:f.sourceUrl,revision:f.wikiRevision,localizedFields:fields.length},
     ...(existing?.lastReviewedAt?{lastReviewedAt:existing.lastReviewedAt}:{}),
     ...(!existing?{recordType:'wiki_sourced'}:{})
   };
   mapped.set(id,sourceRecord);
  }
  for(const n of feed.news){
   if(!n||!valid(n.title,180)||!valid(n.summary,450)||!originalSource(n.sourceUrl))continue;
   const old=base.get(n.id);
   mapped.set(n.id,{
     id:n.id,slug:n.id,category:'actualizaciones',status:'verified',trackable:false,
     title:n.title,summary:n.summary,desc:n.summary,publishedAt:n.publishedAt,
     sources:[{url:n.sourceUrl,label:n.sourceName||'RockstarINTEL',checkedAt:''}],
     facets:{...(old?.facets||{}),community:1,independentMedia:1,claim_status:'unconfirmed'},
     tags:old?.tags||['gta 6','noticias','independent'],
     recordType:'independent_news'
   });
  }
  return [...mapped.values()];
 }
 function apply(feed){
  if(applying||!feed||!Array.isArray(feed.fiches)||!Array.isArray(feed.news)||!window.viApplySignedCatalog)return false;
  applying=true;
  try{
   const records=prepareRows(feed);
   if(!records.length)return false;
   window.viApplySignedCatalog(records);
   window.viCommunityFeedsIntegrated=true;
   window.viV219CommunityStats={revision:feed.revision,fiches:feed.fiches.length,news:feed.news.length,integrated:records.length,
     translatedFields:records.reduce((sum,r)=>sum+(r.wikiSourceInfo?.localizedFields||0),0)};
   // This event is informational only: favorites/progress remain untouched.
   document.dispatchEvent(new CustomEvent('vi:community-index-ready',{detail:window.viV219CommunityStats}));
   return true;
  }finally{applying=false}
 }
 window.viApplyCommunityFeeds=feed=>{
  last=feed;return apply(feed);
 };
 document.addEventListener('vi:catalog-refresh',()=>{
   if(!applying&&last)apply(last);
 });
})();
