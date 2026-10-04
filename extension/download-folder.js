// Relative paths resolve inside the browser's configured download directory on every OS.
const SubtitleFolder = (()=>{
  function filename(value){return String(value).split(/[\\/]/).pop().replace(/[<>:"|?*\u0000-\u001f]/g,'_').replace(/[. ]+$/,'').slice(0,180) || 'subtitles.srt';}
  async function write(name,bytes){let binary='';for(let at=0;at<bytes.length;at+=8192)binary+=String.fromCharCode(...bytes.subarray(at,at+8192));return chrome.downloads.download({url:'data:application/octet-stream;base64,'+btoa(binary),filename:'Subtitle Overlay/'+filename(name),saveAs:false,conflictAction:'uniquify'});}
  return {filename,write};
})();
