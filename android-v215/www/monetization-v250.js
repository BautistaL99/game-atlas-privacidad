/* Game Atlas V250 — product definitions for native stores; no active checkout.
   No payment, ad-free entitlement, public ranking or refund state is ever faked.
   Aportes al Top are independent optional consumable tips, NOT a charitable donation. */
(function(){'use strict';
 const amounts=Object.freeze({lifetime:[10,20,50,100],monthly:[1,2,3,5,10,20,50,100],ranking:[1,2,3,5,10,20,50,100]});
 const products=Object.freeze({
  lifetime:amounts.lifetime.map(n=>Object.freeze({id:`adfree_lifetime_${n}`,kind:'nonconsumable',usdReference:n,adFree:'lifetime',rankingPoints:0})),
  monthly:amounts.monthly.map(n=>Object.freeze({id:`adfree_month_${n}`,kind:'subscription',usdReference:n,adFree:'while_active',rankingPoints:0})),
  ranking:amounts.ranking.map(n=>Object.freeze({id:`support_rank_${n}`,kind:'consumable',usdReference:n,adFree:'none',rankingPoints:n}))
 });
 const state=Object.freeze({billingEnabled:false,advertisingEnabled:false,launchDate:null,adDelayDays:5,platformCurrency:'store-defined',receiptValidation:'server-required',rankingPayments:'consumables-only',consentForRanking:'explicit',refundPolicy:'reverse-ranking-points-on-refund'});
 function advertisementsAllowed(now=new Date()){
  if(!state.advertisingEnabled||!state.launchDate)return false;
  const launch=new Date(state.launchDate);
  return !Number.isNaN(launch.getTime())&&now.getTime()>=launch.getTime()+state.adDelayDays*86400000;
 }
 function purchaseAvailable(){return false;}
 function rankingSubmissionAvailable(){return false;}
 window.viMonetizationV250=Object.freeze({plans:amounts,products,settings:state,advertisementsAllowed,purchaseAvailable,rankingSubmissionAvailable});
 // Legacy reference for existing UI only. No product ID or receipt is a valid entitlement locally.
 window.viMonetizationV249=window.viMonetizationV250;
})();
