// Conservative identity guard for the submitted V267 clients. Never changes IDs.
import fs from 'node:fs';
import path from 'node:path';
import {verifyFeed,validatePublication} from '../v210-publisher.mjs';
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const source=u=>String(u||'').replace(/\/$/,'');
const title=r=>typeof r.title==='string'?r.title:r.title?.en||r.title?.es;
const key=r=>r.category+':'+norm(title(r));
const effective=r=>r.category==='mundo'?(/\b(?:radio|soundtrack|album|song|music|música|musica|station|emisora|artista)\b/i.test(Object.values(r.title||{}).join(' '))?'musica':/\b(?:flora|fauna|animal|species|habitat|wildlife|fish|bird|plant|flower|reptile)\b/i.test(Object.values(r.title||{}).join(' '))?'flora-fauna':'mundo'):r.category;
const crosswalk=new Set(['https://gta.wiki/w/Enduro','https://gta.wiki/w/Stanier_(1955)','https://gta.wiki/w/Dominator_Buggy','https://gta.wiki/w/Squalo']);
const reject=(id,why)=>{throw Error('V267 prospective identity: '+id+' '+why+'; hold batch for review');};
export function checkIdentities({previous,delta,community,official,inventory}){
 if(inventory?.schema!==1||!Array.isArray(inventory.rows)||!inventory.excluded)throw Error('Missing installed identity inventory');
 const fixed=[...inventory.rows,...official.items],wiki=community.fiches.map(r=>({...r,category:effective(r)})),all=[...fixed,...wiki,...community.news.map(r=>({...r,category:'actualizaciones'}))];
 const old=new Map(previous.changes.map(r=>[r.id,r]));
 const added=[];
 for(const row of delta.changes){
  if(Object.hasOwn(inventory.excluded,row.id))reject(row.id,'quarantined identity');
  const prior=old.get(row.id);
  if(prior){if(prior.category!==row.category||prior.op!==row.op)reject(row.id,'changed existing identity');continue;}
  const matches=all.filter(r=>r.id===row.id);
  if(row.op==='patch'){
   if(row.id.startsWith('wiki-community-')){
    const w=wiki.find(r=>r.id===row.id);
    if(!w||w.category!==row.category||matches.length!==1)reject(row.id,'missing or incompatible community record');
    if(crosswalk.has(source(w.sourceUrl))||fixed.some(r=>key(r)===key(w)||(r.sources||[]).some(s=>source(typeof s==='string'?s:s.url)===source(w.sourceUrl)))||wiki.some(r=>r.id!==w.id&&source(r.sourceUrl)===source(w.sourceUrl)))reject(row.id,'may be merged into another client identity');
   }else if(!inventory.rows.some(r=>r.id===row.id&&r.category===row.category)||matches.some(r=>r.category!==row.category)){
    reject(row.id,'not a stable bundled identity');
   }
  }else if(row.op==='add'){
   if(matches.length||old.has(row.id)||[...all,...previous.changes,...added].some(r=>key(r)===key(row)))reject(row.id,'duplicate ID or title');
   if(/^(wiki-community-|community-report-)/.test(row.id))reject(row.id,'reserved automatic ID');
   added.push(row);
  }else reject(row.id,'unsupported operation');
 }
}
export function preflight(root,previous,delta){
 const read=(f,max)=>{const p=path.join(root,f),st=fs.lstatSync(p);if(!st.isFile()||st.size>max||fs.realpathSync(p)!==path.resolve(p))throw Error('Unsafe identity input '+f);return JSON.parse(fs.readFileSync(p,'utf8'));};
 const community=verifyFeed(read('updates/community-envelope-v205.json',2200000),205),official=verifyFeed(read('updates/catalog-envelope.json',4000000),1);validatePublication(community);validatePublication(official);
 return checkIdentities({previous,delta,community,official,inventory:read('automation/v267/installed-identities.json',250000)});
}
