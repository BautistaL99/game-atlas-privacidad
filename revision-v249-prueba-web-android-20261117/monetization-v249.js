/* V249 — configuration + safe gating only. NO mock payments or ad entitlement. */
(function(){'use strict';
 const offers=Object.freeze({lifetime:Object.freeze([10,20,50,100]),monthly:Object.freeze([1,2,3,5,10,20,50,100])});
 const state=Object.freeze({billingEnabled:false,advertisingEnabled:false,launchDate:null,adDelayDays:5,platformCurrency:'store-defined',receiptValidation:'server-required',consentForRanking:'explicit'});
 function advertisementsAllowed(now=new Date()){
  if(!state.advertisingEnabled||!state.launchDate)return false;
  const launch=new Date(state.launchDate);return !Number.isNaN(launch.getTime())&&now.getTime()>=launch.getTime()+state.adDelayDays*86400000;
 }
 function purchaseAvailable(){return false;} // Require native billing, product catalog + server receipt validation; never grant ad-free locally.
 window.viMonetizationV249=Object.freeze({plans:offers,settings:state,advertisementsAllowed,purchaseAvailable});
})();