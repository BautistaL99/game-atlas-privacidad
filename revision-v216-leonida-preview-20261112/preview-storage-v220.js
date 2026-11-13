/* V220 preview-only data isolation: this path runs on the same GitHub Pages
 * origin as /app. Never let a test click modify favorites/progress on /app.
 * No production page loads this script. */
(()=>{'use strict';
 const PREFIX='__game_atlas_v220_preview_isolated__:';
 const original={
  getItem:Storage.prototype.getItem,
  setItem:Storage.prototype.setItem,
  removeItem:Storage.prototype.removeItem,
  clear:Storage.prototype.clear,
  key:Storage.prototype.key
 };
 function isolated(storage){return storage===window.localStorage;}
 for(const method of ['getItem','setItem','removeItem']){
  Storage.prototype[method]=function(key,...other){
   const adapted=isolated(this)?PREFIX+String(key):key;
   return original[method].call(this,adapted,...other);
  };
 }
 Storage.prototype.clear=function(){
  if(!isolated(this))return original.clear.call(this);
  // Erase only this preview's own keys. Never wipe other paths' localStorage.
  const remove=[];
  for(let i=0;i<this.length;i++){
   const k=original.key.call(this,i);
   if(k?.startsWith(PREFIX))remove.push(k);
  }
  for(const key of remove)original.removeItem.call(this,key);
 };
 Storage.prototype.key=function(index){
  if(!isolated(this))return original.key.call(this,index);
  // Return a preview-only view rather than exposing another app's keys.
  const keys=[];
  for(let i=0;i<this.length;i++){
   const k=original.key.call(this,i);
   if(k?.startsWith(PREFIX))keys.push(k.slice(PREFIX.length));
  }
  return keys[Number(index)]??null;
 };
 window.viV211PreviewStorageIsolated=true;
})();
