/* Read public player caption APIs. Never load files or change a player choice. */
(() => {
  const key='__subtitleOverlaySourcesBridge';
  if(globalThis[key]){globalThis[key].emit();return;}
  let stopped=false,observed=null;
  function find(root){
    const video=root.querySelector('video[data-subtitle-overlay-clock]');if(video)return video;
    for(const node of root.querySelectorAll('*'))if(node.shadowRoot){const video=find(node.shadowRoot);if(video)return video;}
    return null;
  }
  function emit(){
    if(stopped)return;const video=observed?.isConnected && observed.hasAttribute('data-subtitle-overlay-clock') ? observed : find(document);observed=video;if(!video)return;
    const tracks=[];
    const add=item=>{
      if(!item || tracks.length>=100 || item.kind && !['subtitles','captions'].includes(item.kind))return;
      const src=item.file || item.src || item.url;if(typeof src!=='string' || src.length>4000)return;
      tracks.push({src,label:String(item.label || item.name || item.language || 'Subtitles').slice(0,150),language:String(item.srclang || item.language || item.lang || '').slice(0,40)});
    };
    // Resolve only players whose public container contains the selected video.
    try{for(const player of Object.values(globalThis.videojs?.getPlayers?.() || {}).slice(0,30))if(player?.el?.()?.contains(video))for(const track of Array.from(player.remoteTextTrackEls?.() || player.remoteTextTracks?.() || []).slice(0,100))add(track);}catch{/* A disposed player may reject access. */}
    try{const container=video.closest('.jwplayer');if(container && typeof globalThis.jwplayer==='function'){const player=globalThis.jwplayer(container.id);if(player.getContainer?.()?.contains(video))for(const track of Array.from(player.getPlaylistItem?.()?.tracks || []).slice(0,100))add(track);}}catch{/* Player not ready. */}
    try{for(const player of (globalThis.Artplayer?.instances || []).slice(0,30))if(player.video===video)add({...player.option?.subtitle,url:player.subtitle?.url || player.option?.subtitle?.url});}catch{/* Player not ready. */}
    document.dispatchEvent(new CustomEvent('subtitle-overlay-player-sources',{detail:JSON.stringify({token:video.getAttribute('data-subtitle-overlay-clock'),tracks})}));
  }
  const timer=setInterval(emit,500);
  function stop(){stopped=true;clearInterval(timer);document.removeEventListener('subtitle-overlay-sources-refresh',emit);document.removeEventListener('subtitle-overlay-sources-stop',stop);delete globalThis[key];}
  document.addEventListener('subtitle-overlay-sources-refresh',emit);
  document.addEventListener('subtitle-overlay-sources-stop',stop);
  globalThis[key]={emit};emit();
})();
