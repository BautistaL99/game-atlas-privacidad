/* Human-reviewed GTA VI coverage, dated 2026-11-18 (Argentina).
 * Each URL and original publication date was checked against RockstarINTEL.
 * Editorial translations are original short headlines, NOT machine translations.
 * These are independent media reports, never presented as Rockstar confirmation.
 * The normal Ed25519 signer and validatePublication() remain mandatory.
 */
import {createHash} from 'node:crypto';
const REVIEWED=[
  {
    path:'grand-theft-auto-vi-is-now-available-to-play',
    en:'Grand Theft Auto VI is now available to play',
    es:'Grand Theft Auto VI ya puede jugarse en las primeras regiones',
    pt:'Grand Theft Auto VI já pode ser jogado nas primeiras regiões'
  },
  {
    path:'gta-vi-hands-on-gameplay-impressions',
    en:'GTA VI Hands-On Gameplay Impressions',
    es:'Primeras impresiones tras jugar a GTA VI',
    pt:'Primeiras impressões após jogar GTA VI'
  },
  {
    path:'gta-vi-reviews-are-in-becomes-the-best-rated-video-game-of-all-time',
    en:'GTA VI Reviews Are In, Becomes The Best Rated Video Game of All Time',
    es:'Llegaron las reseñas de GTA VI: el medio informa puntuaciones históricas',
    pt:'Chegaram as análises de GTA VI: o veículo relata notas históricas'
  },
  {
    path:'how-to-get-the-exclusive-gta-vi-tropical-weapon-skins',
    en:'How To Get The Exclusive GTA VI Tropical Weapon Skins',
    es:'Cómo conseguir los diseños tropicales exclusivos de armas en GTA VI',
    pt:'Como obter as estampas tropicais exclusivas de armas em GTA VI'
  },
  {
    path:'all-gta-vi-rewards-for-gta-members',
    en:'All GTA VI Rewards For GTA+ Members',
    es:'Todas las recompensas de GTA VI para miembros de GTA+',
    pt:'Todas as recompensas de GTA VI para assinantes do GTA+'
  },
  {
    path:'rockstar-co-founder-sam-houser-releases-statement-on-gta-vi',
    en:'Rockstar Co-Founder Sam Houser Releases Statement On GTA VI',
    es:'Sam Houser, cofundador de Rockstar, publica un mensaje sobre GTA VI',
    pt:'Sam Houser, cofundador da Rockstar, divulga uma mensagem sobre GTA VI'
  }
];
export function getReviewedLaunchNews(){
 return REVIEWED.map(x=>{
  const url='https://rockstarintel.com/'+x.path;
  const id='community-report-'+createHash('sha256').update(url).digest('hex').slice(0,24);
  return {
   id,
   title:{en:'RockstarINTEL reports: '+x.en,es:'Según RockstarINTEL: '+x.es,pt:'Segundo a RockstarINTEL: '+x.pt},
   summary:{
    es:'El medio independiente RockstarINTEL publicó información sobre GTA VI: '+x.es+'. Consultá su artículo original para conocer los detalles.',
    en:'Independent outlet RockstarINTEL published GTA VI coverage: '+x.en+'. Read the original report for details.',
    pt:'O veículo independente RockstarINTEL publicou informações sobre GTA VI: '+x.pt+'. Consulte a fonte original.'
   },
   publishedAt:'2026-11-18',
   sourceUrl:url,sourceName:'RockstarINTEL',
   sourceTier:'independent_reporting_not_official',
   claimStatus:'reported_not_confirmed_by_rockstar'
  };
 });
}
