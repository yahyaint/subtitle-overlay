/* Public playback clocks only. No stream buffers, account state or network calls. */
(() => {
  const key='__subtitleOverlayClockBridge';
  if(globalThis[key]){globalThis[key].emit();return;}
  const proto=globalThis.MediaSession?.prototype,descriptor=proto && Object.getOwnPropertyDescriptor(proto,'setPositionState');
  let position=null,stopped=false,observed=null,token='',lastNative=null;
  const events=['timeupdate','seeked','pause','play','ratechange'];
  function find(root){
    const video=root.querySelector('video[data-subtitle-overlay-clock]');if(video)return video;
    for(const element of root.querySelectorAll('*'))if(element.shadowRoot){const nested=find(element.shadowRoot);if(nested)return nested;}
    return null;
  }
  function invalidate(){position=null;}
  function selected(){
    const video=observed?.isConnected && observed.hasAttribute('data-subtitle-overlay-clock') ? observed : find(document);
    const nextToken=video?.getAttribute('data-subtitle-overlay-clock') || '';
    if(video!==observed){
      for(const name of events)observed?.removeEventListener(name,emit);
      observed?.removeEventListener('seeking',invalidate);observed?.removeEventListener('emptied',invalidate);
      observed=video;
      for(const name of events)observed?.addEventListener(name,emit);
      observed?.addEventListener('seeking',invalidate);observed?.addEventListener('emptied',invalidate);
    }
    if(nextToken!==token){position=null;lastNative=null;token=nextToken;}
    return video;
  }
  const number=value=>Number.isFinite(value) && value>=0 && value<=864000;
  function wrapper(state){
    // Keep the native method's receiver, arguments, return value and errors.
    const result=Reflect.apply(descriptor.value,this,arguments);
    try{
      const video=selected(),time=state && Object.getOwnPropertyDescriptor(state,'position')?.value,duration=state && Object.getOwnPropertyDescriptor(state,'duration')?.value;
      const matchesVideo=video && (!Number.isFinite(video.duration) || Math.abs(video.duration-duration)<=2);
      position=matchesVideo && number(time) && number(duration) && duration>0 && time<=duration ? {token:video.getAttribute('data-subtitle-overlay-clock'),time,duration,native:video.currentTime} : null;
      if(position)lastNative=position.native;
    }catch{position=null;}
    emit();return result;
  }
  function emit(){
    if(stopped)return;
    try{
      const video=selected();if(!video)return;
      const token=video.getAttribute('data-subtitle-overlay-clock'),time=video.currentTime,duration=video.duration;
      // A segment may restart without firing a native seeking event. Once its
      // clock moves backward, an old position must not revive on the next loop.
      if(number(time) && number(lastNative) && time<lastNative-.001)position=null;
      lastNative=number(time) ? time : null;
      let mediaTime=null;
      if(position?.token===token && number(time) && number(position.native) && time>=position.native && !video.seeking)mediaTime=Math.min(position.duration,position.time+time-position.native);
      const detail=JSON.stringify({token,time:number(time) ? time : null,duration:number(duration) ? duration : null,durationKind:Number.isFinite(duration) ? 'finite' : duration===Infinity ? 'infinite' : 'unknown',mediaTime,mediaDuration:mediaTime===null ? null : position.duration});
      document.dispatchEvent(new CustomEvent('subtitle-overlay-player-clock',{detail}));
    }catch{/* A page getter may disappear during a player replacement. */}
  }
  if(typeof descriptor?.value==='function' && descriptor.writable){try{Object.defineProperty(proto,'setPositionState',{...descriptor,value:wrapper});}catch{/* Page-side video clocks still work when the method cannot be wrapped. */}}
  const timer=setInterval(emit,100);
  function stop(){
    stopped=true;clearInterval(timer);document.removeEventListener('subtitle-overlay-clock-stop',stop);
    for(const name of events)observed?.removeEventListener(name,emit);
    observed?.removeEventListener('seeking',invalidate);observed?.removeEventListener('emptied',invalidate);
    try{if(proto && Object.getOwnPropertyDescriptor(proto,'setPositionState')?.value===wrapper)Object.defineProperty(proto,'setPositionState',descriptor);}catch{/* Another page script may have locked this method. */}
    delete globalThis[key];
  }
  document.addEventListener('subtitle-overlay-clock-stop',stop);
  globalThis[key]={emit,stop};emit();
})();
