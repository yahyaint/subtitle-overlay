(() => {
  const extensionApi=globalThis.browser || globalThis.chrome;
  if(globalThis.__subtitleDownloadBridge)return;globalThis.__subtitleDownloadBridge=true;
  const downloadPath=path=>/\.(?:srt|vtt|sub|ass|ssa|zip|gz)(?:$|\/)|\/(?:download|subtitleserve)\/(?:sub|file|vrf)(?:\/|$)|\/subtitles\/(?:legacy\/)?\d+\/download(?:\/|$)/i.test(path);
  const providerUrl=value=>{
    try{const url=new URL(value,location.href);return url.protocol==='https:' && !url.username && !url.password && ['opensubtitles.org','opensubtitles.com'].some(host=>url.hostname===host||url.hostname.endsWith('.'+host)) ? url : null;}
    catch{return null;}
  };
  function pageFps(){
    const declared=document.querySelector('[itemprop="frameRate"], [data-fps]');
    const values=[declared?.getAttribute('content') || declared?.getAttribute('data-fps') || declared?.textContent];
    for(const cell of document.querySelectorAll('td,th,dt,label'))if(/^FPS:?$/i.test(cell.textContent.trim()))values.push(cell.nextElementSibling?.textContent);
    // Classic detail pages also show “24.000 FPS” beside the film title.
    for(const element of document.querySelectorAll('span,b,strong'))if(element.getClientRects().length && /^\d+(?:\.\d+)?\s*FPS$/i.test(element.textContent.trim()))values.push(element.textContent);
    for(const value of values){const match=String(value || '').trim().match(/^(\d+(?:\.\d+)?)(?:\s*FPS)?$/i);if(match && Number(match[1])>=1 && Number(match[1])<=120)return Number(match[1]);}
  }
  const intent=url=>extensionApi.runtime.sendMessage({type:'WEBSITE_DOWNLOAD_INTENT',fps:pageFps(),url}).then(reply=>{if(reply?.ok)startWatch();return reply;}).catch(()=>{});
  let lastDownload=null,subtitlePage=null,watchTimer=null,checking=false,shownProgress='';
  function startWatch(){if(!watchTimer)watchTimer=setInterval(()=>refreshWatch(false),2000);}
  function stopWatch(){clearInterval(watchTimer);watchTimer=null;}
  async function refreshWatch(initial){
    if(checking)return;checking=true;
    try{
      const reply=await extensionApi.runtime.sendMessage({type:'WEBSITE_WATCH_STATUS'});
      lastDownload=providerUrl(reply?.downloadUrl) || lastDownload;subtitlePage=providerUrl(reply?.subtitlePage) || subtitlePage;
      if(reply?.watching)startWatch();else stopWatch();
      const progress=JSON.stringify(reply?.progress || null);
      if(reply?.progress && (initial || progress!==shownProgress))notice(null,reply.progress);
      else if(initial && reply?.watching)notice(null,{watching:true});
      shownProgress=progress;
    }catch{stopWatch();}finally{checking=false;}
  }
  async function capture(url){
    lastDownload=url;notice(url,{loading:true});await intent(url.href);
    try{
      const reply=await extensionApi.runtime.sendMessage({type:'WEBSITE_CAPTURE',url:url.href,fps:pageFps()});
      if(reply?.code==='WEBSITE_STEP_REQUIRED'){
        const next=providerUrl(reply.nextPage || url.href);if(next){location.assign(next.href);return;}
      }
      notice(url,reply);
    }catch{notice(url,{error:'Loading stopped. Retry the file.'});}
  }
  function notice(url,reply){
    document.getElementById('subtitle-overlay-download-notice')?.remove();
    const blank=!document.body?.innerText.trim(),target=url || providerUrl(reply?.url) || lastDownload;
    const box=document.createElement('div');box.id='subtitle-overlay-download-notice';box.style.cssText='position:fixed;bottom:20px;left:20px;right:20px;padding:16px;background:#121820;color:#edf1f7;border:1px solid #216aa3;border-radius:12px;z-index:2147483647;font:14px system-ui;direction:ltr;text-align:left;';
    box.textContent=reply?.loading ? 'Loading subtitle file…' : reply?.downloading ? 'Downloading subtitle file. It will load when the download ends.' : reply?.watching ? (blank ? 'This download page has no content. Waiting for a subtitle file. You can retry or return to the subtitle page.' : 'Waiting for the subtitle file. Continue on this page. Tracking stops when a file loads or you close this window.') : reply?.ok ? (reply.count>1 ? reply.count+' subtitle files saved. Select one in Saved.' : (reply.converted ? 'Converted to SRT. ' : '')+'Subtitles saved in Downloads / Subtitle Overlay and loaded into your film.') : reply?.error || 'Download failed. Try again.';
    if(reply?.ok && reply.plainAss)box.textContent+=' ASS/SSA text and timing only. File styles and effects are not used.';
    if(reply?.code==='FRAME_RATE_REQUIRED'){
      const label=document.createElement('label');label.textContent=' Subtitle FPS ';const input=document.createElement('input');input.type='number';input.min='1';input.max='120';input.step='.001';input.placeholder='23.976';input.id='subtitle-overlay-fps';input.style.cssText='width:90px;margin:0 8px';label.append(input);box.append(label);
      const retry=document.createElement('button');retry.textContent='Load subtitles';retry.id='subtitle-overlay-fps-retry';retry.onclick=()=>{const fps=Number(input.value);if(!fps || !input.checkValidity()){input.reportValidity();return;}retry.disabled=true;extensionApi.runtime.sendMessage({type:'WEBSITE_CAPTURE',url:url.href,fps}).then(result=>notice(url,result)).catch(()=>{retry.disabled=false;});};box.append(retry);
    }
    if(target && (reply?.watching && blank || reply?.error)){
      const retry=document.createElement('button');retry.textContent='Retry file';retry.id='subtitle-overlay-retry';retry.style.cssText='margin-left:12px;padding:6px 12px;cursor:pointer';retry.onclick=event=>{if(event.isTrusted)capture(target);};box.append(retry);
    }
    if(subtitlePage && (blank || reply?.error)){
      const back=document.createElement('a');back.href=subtitlePage.href;back.textContent='Subtitle page';back.id='subtitle-overlay-back';back.style.cssText='margin-left:12px;color:#79bce9';box.append(back);
    }
    if(target && !reply?.ok && !reply?.watching && !reply?.loading && !reply?.downloading){const native=document.createElement('a');native.href=target.href;native.dataset.subtitleNativeDownload='true';native.textContent='Download file';native.style.cssText='margin-left:12px;color:#79bce9';box.append(native);}
    if(reply?.watching || reply?.error){
      const check=document.createElement('button');check.textContent='Check download';check.id='subtitle-overlay-check-download';check.style.cssText='margin-left:12px;padding:6px 12px;cursor:pointer';
      check.onclick=async event=>{if(!event.isTrusted)return;check.disabled=true;try{const result=await extensionApi.runtime.sendMessage({type:'WEBSITE_CHECK_DOWNLOAD'});if(!result?.ok)notice(target,{error:result?.error || 'Download check failed.'});else await refreshWatch(false);}catch{notice(target,{error:'Reload the extension and reopen the search window.'});}finally{check.disabled=false;}};box.append(check);
    }
    const close=document.createElement('button');close.textContent='Close';close.style.cssText='margin-left:12px;padding:6px 12px;cursor:pointer';close.onclick=()=>box.remove();box.append(close);document.body.append(box);
  }
  document.addEventListener('submit',event=>{
    if(!event.isTrusted)return;
    const url=providerUrl(event.submitter?.formAction || event.target.action);
    if(url && downloadPath(url.pathname))intent(url.href);
  },true);
  document.addEventListener('click',event=>{
    if(!event.isTrusted || event.button!==0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)return;
    const link=event.target.closest?.('a[href]');
    if(!link){
      const button=event.target.closest?.('button,input[type="submit"],input[type="button"]');
      const label=(button?.textContent || button?.value || '').trim();
      if(button && /^(?:download|download subtitles)(?:\s*\(beta\))?$/i.test(label))intent();
      return;
    }
    const url=providerUrl(link.href);if(!url || !downloadPath(url.pathname))return;
    event.preventDefault();event.stopImmediatePropagation();
    if(link.dataset.subtitleNativeDownload==='true'){intent(url.href).then(()=>location.assign(url.href));return;}
    capture(url);
  },true);
  extensionApi.runtime.onMessage.addListener((message,sender)=>{
    if(sender.id!==extensionApi.runtime.id || !sender.url?.startsWith(extensionApi.runtime.getURL('')))return;
    if(message?.type==='WEBSITE_FILE_FOUND'){stopWatch();notice(null,{ok:true,count:message.count,converted:message.converted,plainAss:message.plainAss});}
    if(message?.type==='WEBSITE_DOWNLOAD_STATUS'){shownProgress=JSON.stringify(message.progress);if(message.progress?.ok)stopWatch();notice(null,message.progress);}
  });
  refreshWatch(true);
  window.addEventListener('pagehide',stopWatch,{once:true});
  window.addEventListener('pageshow',event=>{if(event.persisted)refreshWatch(true);});
})();
