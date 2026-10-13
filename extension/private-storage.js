// Background-only credential store. Never inject this file or expose it as a web resource.
// IndexedDB at the extension origin is unavailable to website content scripts.
const SubtitlePrivateStorage=(()=>{
  let opening;
  function database(){
    if(!opening)opening=new Promise((resolve,reject)=>{
      const request=indexedDB.open('subtitle-overlay-private',1);
      request.onupgradeneeded=()=>request.result.createObjectStore('credentials');
      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>{opening=null;reject(new Error('Private credential storage is unavailable.'));};
    });
    return opening;
  }
  async function access(value){
    const db=await database();
    return new Promise((resolve,reject)=>{
      const transaction=db.transaction('credentials',value===undefined ? 'readonly' : 'readwrite');
      const store=transaction.objectStore('credentials');
      const request=value===undefined ? store.get('apiKey') : value ? store.put(value,'apiKey') : store.delete('apiKey');
      transaction.oncomplete=()=>resolve(value===undefined ? request.result || '' : undefined);
      transaction.onabort=transaction.onerror=()=>reject(new Error('Private credential storage failed.'));
    });
  }
  return {get:()=>access(),set:value=>access(value)};
})();
