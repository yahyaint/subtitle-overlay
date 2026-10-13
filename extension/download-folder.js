// Relative paths resolve inside the browser's configured download directory on every OS.
const SubtitleFolder = (()=>{
  const extensionApi=globalThis.browser || globalThis.chrome;
  function filename(value){return String(value).split(/[\\/]/).pop().replace(/[<>:"|?*\u0000-\u001f]/g,'_').replace(/[. ]+$/,'').slice(0,180) || 'subtitles.srt';}
  async function write(name,bytes,type='application/octet-stream'){
    if(!extensionApi.downloads)return null;
    let url,blob=false;
    if(typeof URL.createObjectURL==='function'){
      url=URL.createObjectURL(new Blob([bytes],{type}));blob=true;
    }else{
      let binary='';for(let at=0;at<bytes.length;at+=8192)binary+=String.fromCharCode(...bytes.subarray(at,at+8192));
      url='data:'+type+';base64,'+btoa(binary);
    }
    let id;
    try{id=await extensionApi.downloads.download({url,filename:'Subtitle Overlay/'+filename(name),saveAs:false,conflictAction:'uniquify'});}
    catch(error){if(blob)URL.revokeObjectURL(url);throw error;}
    if(blob){
      // Retain the URL until Firefox has consumed it; tolerate completion before registration.
      const release=delta=>{if(delta.id===id && ['complete','interrupted'].includes(delta.state?.current)){
        extensionApi.downloads.onChanged.removeListener(release);clearTimeout(timer);URL.revokeObjectURL(url);
      }};
      const timer=setTimeout(()=>release({id,state:{current:'interrupted'}}),120000);
      extensionApi.downloads.onChanged.addListener(release);
      extensionApi.downloads.search({id}).then(([item])=>{if(item)release({id,state:{current:item.state}});}).catch(()=>{});
    }
    return id;
  }
  return {filename,write};
})();
