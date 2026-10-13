/* Read selected-player caption APIs and metadata. Never fetch files or change a player choice. */
(() => {
  const key='__subtitleOverlaySourcesBridge';
  if(globalThis[key]){globalThis[key].emit();return;}
  let stopped=false,observed=null,reactCache=null;
  const captionNames=new Set(['en','ar','bn','bg','zh','hr','cs','da','nl','et','fi','fr','de','el','he','hi','hu','is','id','it','ja','ko','lv','lt','mk','ms','no','fa','pl','pt','ro','ru','sr','sk','sl','es','sv','ta','th','tr','uk','ur','vi'].map(code=>new Intl.DisplayNames(['en'],{type:'language'}).of(code).toLowerCase()));
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
      tracks.push({src,label:String(item.label || item.name || item.language || 'Subtitles').slice(0,150),language:String(item.srclang || item.lang || item.language || '').slice(0,40)});
    };
    // Resolve only players whose public container contains the selected video.
    try{for(const player of Object.values(globalThis.videojs?.getPlayers?.() || {}).slice(0,30))if(player?.el?.()?.contains(video))for(const track of Array.from(player.remoteTextTrackEls?.() || player.remoteTextTracks?.() || []).slice(0,100))add(track);}catch{/* A disposed player may reject access. */}
    try{const container=video.closest('.jwplayer');if(container && typeof globalThis.jwplayer==='function'){const player=globalThis.jwplayer(container.id);if(player.getContainer?.()?.contains(video))for(const track of Array.from(player.getPlaylistItem?.()?.tracks || []).slice(0,100))add(track);}}catch{/* Player not ready. */}
    try{for(const player of (globalThis.Artplayer?.instances || []).slice(0,30))if(player.video===video)add({...player.option?.subtitle,url:player.subtitle?.url || player.option?.subtitle?.url});}catch{/* Player not ready. */}
    // Some React players draw captions themselves and never create TextTracks.
    // Read only caption descriptors near the selected video, never callbacks,
    // arbitrary app stores, response interception, or unrelated player state.
    const identity=[video.currentSrc || video.src,location.href,video.getAttribute('data-subtitle-overlay-clock')].join('|');
    if(reactCache?.video!==video || reactCache.identity!==identity)reactCache={video,identity,tracks:[]};
    try{
      let scope=video.parentElement;
      for(let depth=0;scope && depth<5;depth++,scope=scope.parentElement){
        if(scope===document.body || scope.querySelectorAll('video').length!==1)break;
        if(scope.matches('.vp-container,[data-player],.video-js,.jwplayer,.artplayer-app,.plyr'))break;
      }
      if(scope && scope!==document.body && scope.querySelectorAll('video').length===1){
        const nodes=[video,...Array.from(scope.querySelectorAll('.lp-subtitle,[data-subtitle-cue]')).slice(0,4),...Array.from(scope.querySelectorAll('button')).filter(node=>captionNames.has((node.querySelector('img[alt]')?.alt || '').toLowerCase()) || /subtitles|captions/i.test(node.getAttribute('aria-label') || node.textContent)).slice(0,6)];
        const found=[],seen=new Set();
        const caption=item=>item && typeof item==='object' && !Array.isArray(item) &&
          (!item.kind || ['subtitles','captions'].includes(item.kind)) &&
          (!item.type || !/audio|video|image|thumbnail/i.test(item.type)) &&
          typeof (item.file || item.src || item.url)==='string' &&
          (['subtitles','captions'].includes(item.kind) || /^[a-z]{2,3}(?:[-_][a-z0-9]{2,8})*$/i.test(item.srclang || item.lang || '') && typeof (item.label || item.name || item.language)==='string');
        const list=items=>{if(Array.isArray(items))for(const item of items.slice(0,100))if(caption(item) && found.length<100)found.push(item);};
        const descriptors=value=>{if(!value || typeof value!=='object')return;for(const name of ['subtitles','subtitleTracks','captions','textTracks'])list(value[name]);};
        for(const node of nodes){
          const name=Object.getOwnPropertyNames(node).find(name=>name.startsWith('__reactFiber$'));let fiber=name && node[name];
          // DOM fibers can point to the previous render. Follow the current root.
          let root=fiber;for(let depth=0;root?.return && depth<80;depth++)root=root.return;
          if(root?.stateNode?.current && root.stateNode.current!==root)fiber=fiber?.alternate || fiber;
          for(let depth=0;fiber && depth<24;depth++,fiber=fiber.return){
            if(seen.has(fiber))break;seen.add(fiber);descriptors(fiber.memoizedProps);
            let hook=fiber.memoizedState;
            for(let index=0;hook && index<50;index++,hook=hook.next){
              const value=hook.memoizedState;descriptors(value);
              // Query results are considered only within caption menu nodes.
              if(node!==video)list(value?.data);
              if(Array.isArray(value))for(const part of value.slice(0,3))descriptors(part);
            }
          }
        }
        if(found.length){const files=new Map(reactCache.tracks.map(item=>[item.src,item]));for(const item of found){const src=item.file || item.src || item.url;files.set(src,{src,label:item.label || item.name || item.language,lang:item.srclang || item.lang});}reactCache.tracks=Array.from(files.values()).slice(0,100);}
      }
      for(const item of reactCache.tracks)add(item);
    }catch{/* A changing React tree is retried on the next refresh. */}
    document.dispatchEvent(new CustomEvent('subtitle-overlay-player-sources',{detail:JSON.stringify({token:video.getAttribute('data-subtitle-overlay-clock'),tracks})}));
  }
  const timer=setInterval(emit,500);
  function stop(){stopped=true;clearInterval(timer);document.removeEventListener('subtitle-overlay-sources-refresh',emit);document.removeEventListener('subtitle-overlay-sources-stop',stop);delete globalThis[key];}
  document.addEventListener('subtitle-overlay-sources-refresh',emit);
  document.addEventListener('subtitle-overlay-sources-stop',stop);
  globalThis[key]={emit};emit();
})();
