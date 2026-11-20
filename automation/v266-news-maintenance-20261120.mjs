/* One-time, narrowly scoped V266 official-news quality fix.
 * Requires the existing matching Ed25519 signing key in GitHub Actions.
 * Never modifies app/, maps, personal data, story sources or article dates.
 */
import {readFileSync,writeFileSync} from 'node:fs';
import {verifyFeed,signFeed,validatePublication} from './v210-publisher.mjs';

const catalog='updates/catalog-envelope.json';
const official=verifyFeed(JSON.parse(readFileSync(catalog,'utf8')),1);
const community=verifyFeed(JSON.parse(readFileSync('updates/community-envelope-v205.json','utf8')),205);
validatePublication(official);validatePublication(community);
const art=JSON.parse(readFileSync('automation/v266-news-illustrations-generated.json','utf8'));
const ARTICLES={
 'rockstar-585094a46f8882dd13607ab2':{
  date:'2026-11-20',postId:'k4a8955a93o747',art:'album',
  title:{
   es:'Grand Theft Auto VI: El álbum ya está disponible',
   en:'Grand Theft Auto VI: The Album Now Available',
   pt:'Grand Theft Auto VI: O álbum já está disponível'
  },
  summary:{
   es:'Rockstar lanzó Grand Theft Auto VI: The Album, la banda sonora oficial creada con Atlantic Records. Está disponible en las principales plataformas de streaming y también en ediciones seleccionadas de vinilo y CD.',
   en:'Rockstar released Grand Theft Auto VI: The Album, the official soundtrack created with Atlantic Records. It is available on major streaming platforms and in selected vinyl and CD editions.',
   pt:'A Rockstar lançou Grand Theft Auto VI: The Album, a trilha sonora oficial criada com a Atlantic Records. Está disponível nas principais plataformas de streaming e em edições selecionadas de vinil e CD.'
  }
 },
 'rockstar-d2760b55b1af3f1db47400ad':{
  date:'2026-11-19',postId:'39akk424a9oo53',art:'launch',
  title:{
   es:'Grand Theft Auto VI ya disponible',
   en:'Grand Theft Auto VI Now Available',
   pt:'Grand Theft Auto VI já disponível'
  },
  summary:{
   es:'Rockstar anunció el lanzamiento mundial de Grand Theft Auto VI para PlayStation 5 y Xbox Series X|S el 19 de noviembre de 2026. El artículo oficial también enlaza el póster y el mapa imprimibles de Leonida.',
   en:'Rockstar announced the worldwide release of Grand Theft Auto VI for PlayStation 5 and Xbox Series X|S on November 19, 2026. Its official article also links to the printable Leonida poster and map.',
   pt:'A Rockstar anunciou o lançamento mundial de Grand Theft Auto VI para PlayStation 5 e Xbox Series X|S em 19 de novembro de 2026. O comunicado também apresenta o pôster e o mapa de Leonida para impressão.'
  }
 },
 'rockstar-39c5133f33285dd9ad8ca922':{
  date:'2026-11-09',postId:'o39o87a435a25a',
  title:{
   es:'Grand Theft Auto VI: The Festival',
   en:'Grand Theft Auto VI: The Festival',
   pt:'Grand Theft Auto VI: The Festival'
  },
  summary:{
   es:'Rockstar anunció Grand Theft Auto VI: The Festival, un evento musical previsto para el 21 de noviembre en Mana Wynwood, Miami, con artistas vinculados a la banda sonora del juego.',
   en:'Rockstar announced Grand Theft Auto VI: The Festival, a live music event scheduled for November 21 at Mana Wynwood in Miami, featuring artists connected to the game soundtrack.',
   pt:'A Rockstar anunciou Grand Theft Auto VI: The Festival, evento musical marcado para 21 de novembro no Mana Wynwood, em Miami, com artistas ligados à trilha sonora do jogo.'
  }
 },
 'rockstar-1afda179345ac9c004a9a57d':{
  date:'2026-11-10',postId:'89834o94713o21',
  summary:{
   es:'Rockstar confirmó que ya se puede precargar Grand Theft Auto VI mediante las reservas digitales. Quienes compraron una edición con código también podrán activarlo y comenzar la precarga al recibirlo.',
   en:'Rockstar confirmed that digital pre-loading of Grand Theft Auto VI is available to players who pre-ordered. Players with a boxed edition can also activate their code and begin pre-loading when they receive it.',
   pt:'A Rockstar confirmou que o pré-carregamento digital de Grand Theft Auto VI já está disponível para quem fez a pré-venda. Quem comprou uma edição com código também pode ativá-lo e iniciar o pré-carregamento ao recebê-lo.'
  }
 }
};
function altFor(kind){
 if(kind==='album')return {es:'Ilustración editorial original de un disco de vinilo para la noticia del álbum de GTA VI. No es una foto de Rockstar.',en:'Original editorial vinyl-record artwork for the GTA VI album news; not a Rockstar photo.',pt:'Ilustração editorial original de um disco de vinil para a notícia do álbum de GTA VI; não é foto da Rockstar.'};
 return {es:'Ilustración editorial original de Leonida para la noticia del lanzamiento de GTA VI. No es una foto de Rockstar.',en:'Original editorial Leonida artwork for the GTA VI release news; not a Rockstar photo.',pt:'Ilustração editorial original de Leonida para a notícia do lançamento de GTA VI; não é foto da Rockstar.'};
}
function imageFor(kind){
 const info=art[kind];
 if(!info||!/^[a-f0-9]{64}$/.test(info.sha256)||
    info.path!=='updates/assets/'+info.sha256+'.png')throw Error('Unsafe image manifest');
 return {path:info.path,sha256:info.sha256,rights:'owned',alt:altFor(kind)};
}
function fixClipped(raw){
 const value=String(raw||'').trim();
 if(value.length<130||/[.!?…]$/.test(value))return value;
 const sentence=value.match(/^.{45,240}?[.!?](?=\s|$)/u);
 if(sentence)return sentence[0].trim();
 const at=value.lastIndexOf(' ');
 return at>75?value.slice(0,at).replace(/[\s,;:–-]+$/u,'')+'…':value;
}
const wanted=new Set(Object.keys(ARTICLES));
const beforeCount=official.items.length;
if(official.items.filter(row=>wanted.has(row.id)).length!==wanted.size)throw Error('Missing required known official stories');
let changes=0,fragmentsFixed=0;
const nextItems=official.items.map(row=>{
 if(row.category!=='actualizaciones'||row.facets?.community===1)return row;
 const edit=ARTICLES[row.id];
 if(edit){
  if(row.publishedAt!==edit.date||!row.sources?.[0]?.url?.includes('/article/'+edit.postId+'/'))
   throw Error('Story identity/source/date mismatch: '+row.id);
  const next={...row,title:edit.title||row.title,summary:edit.summary,image:edit.art?imageFor(edit.art):row.image};
  if(JSON.stringify(next)!==JSON.stringify(row))changes++;
  return next;
 }
 const summary=Object.fromEntries(['es','en','pt'].map(l=>{
  const fixed=fixClipped(row.summary[l]);if(fixed!==row.summary[l])fragmentsFixed++;
  return [l,fixed];
 }));
 const next={...row,summary};
 if(JSON.stringify(next)!==JSON.stringify(row))changes++;
 return next;
});
const next={...official,revision:official.revision+1,items:nextItems};
validatePublication(next);
if(next.items.length!==beforeCount)throw Error('Existing news deleted or added');
for(let i=0;i<beforeCount;i++){
 const a=official.items[i],b=next.items[i];
 const {title:t1,summary:s1,image:i1,...stableA}=a;
 const {title:t2,summary:s2,image:i2,...stableB}=b;
 if(JSON.stringify(stableA)!==JSON.stringify(stableB))throw Error('Unexpected change outside editorial data: '+a.id);
 if(!wanted.has(a.id)&&JSON.stringify(t1)!==JSON.stringify(t2))throw Error('Unreviewed historical title change');
}
if(changes){
 const envelope=signFeed(next,process.env.CATALOG_SIGNING_KEY_PEM_BASE64);
 const check=verifyFeed(envelope,1);
 if(check.revision!==next.revision||check.items.length!==official.items.length)
  throw Error('Signed catalog re-verification failed');
 writeFileSync(catalog,JSON.stringify(envelope)+'\n');
}
const report={
 checkedAt:new Date().toISOString(),
 oldRevision:official.revision,newRevision:changes?next.revision:official.revision,
 officialCount:next.items.filter(x=>x.category==='actualizaciones'&&x.facets?.community!==1).length,
 newestOfficialDate:next.items.filter(x=>x.category==='actualizaciones'&&x.facets?.community!==1)
   .map(x=>x.publishedAt).sort().at(-1),
 independentCount:community.news.length,
 newestIndependentDate:community.news.map(x=>x.publishedAt).filter(Boolean).sort().at(-1),
 itemsEdited:changes,existingFragmentsFixed:fragmentsFixed,
 releaseBuildChanged:false,
};
writeFileSync('automation/v266-news-quality-report.json',JSON.stringify(report,null,2)+'\n');
console.log('V266_NEWS_QUALITY',JSON.stringify(report));
