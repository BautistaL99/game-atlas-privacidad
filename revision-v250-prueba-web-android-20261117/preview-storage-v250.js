/* Preview V250 only. Same GitHub Pages domain, separate localStorage namespace.
   This code must run before app-v137.js and is NEVER used by /app/. */
(()=>{'use strict';
 const prefix='__game_atlas_v250_20261117_test__:';
 const methods={get:Storage.prototype.getItem,set:Storage.prototype.setItem,remove:Storage.prototype.removeItem,clear:Storage.prototype.clear,key:Storage.prototype.key};
 const previewStore=storage=>storage===window.localStorage;
 for(const name of [['getItem','get'],['setItem','set'],['removeItem','remove']]){
   Storage.prototype[name[0]]=function(key,...args){
     return methods[name[1]].call(this,previewStore(this)?prefix+String(key):key,...args);
   };
 }
 Storage.prototype.clear=function(){
   if(!previewStore(this))return methods.clear.call(this);
   const list=[];for(let k=0;k<this.length;k++){const key=methods.key.call(this,k);if(key?.startsWith(prefix))list.push(key)}
   for(const key of list)methods.remove.call(this,key);
 };
 Storage.prototype.key=function(index){
   if(!previewStore(this))return methods.key.call(this,index);
   const list=[];for(let k=0;k<this.length;k++){const key=methods.key.call(this,k);if(key?.startsWith(prefix))list.push(key.slice(prefix.length))}
   return list[Number(index)]??null;
 };
 Object.defineProperty(window,'viAtlasPreviewStorageIsolated',{value:true,writable:false});
})();
