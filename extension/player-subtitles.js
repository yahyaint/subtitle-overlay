/* Read public tracks and their selected subtitle file. No network interception. */
(() => {
  function create({getVideo,getTime,core}) {
    let video=null,revision=0,nextId=0,pending=null;
    const ids=new WeakMap(),counts=new WeakMap(),owned=new Map(),files=new WeakMap();
    function restore() {
      revision++;
      pending?.abort();pending=null;
      for(const [track,item] of owned){try{if(track.mode===item.expected)track.mode=item.original;}catch{/* Removed tracks need no restoration. */}}
      owned.clear();
    }
    function selected() {
      const current=getVideo();
      if(current!==video){restore();video=current;}
      if(!video?.isConnected)return [];
      return Array.from(video.textTracks || []).filter(track=>['subtitles','captions'].includes(track.kind)).slice(0,100);
    }
    function idOf(track){if(!ids.has(track))ids.set(track,String(++nextId));return ids.get(track);}
    function source(track) {
      const element=Array.from(video?.querySelectorAll('track') || []).find(item=>item.track===track);
      if(!element?.getAttribute('src'))return '';
      try{
        const url=new URL(element.src,location.href);
        // Cross-origin files use HTTPS. Local HTTP and page-owned blobs also work.
        if(url.username || url.password || !(url.protocol==='https:' || url.protocol==='http:' && url.origin===location.origin || url.protocol==='blob:' && url.origin===location.origin))return '';
        return url.href;
      }catch{return '';}
    }
    function list() {
      return selected().map(track=>{const cached=files.get(track),src=source(track),count=cached?.src===src ? cached.cues.length : track.cues?.length;if(count)counts.set(track,count);return {id:idOf(track),label:String(track.label || track.language || 'Subtitles').slice(0,150),language:String(track.language || '').slice(0,40),kind:track.kind,mode:track.mode,count:count || (src ? null : counts.get(track) ?? null)};});
    }
    function find(id) {
      const track=selected().find(track=>idOf(track)===id);
      if(!track)throw new Error('The player track changed. Select it again.');
      return track;
    }
    function mode(track,value) {
      const item=owned.get(track) || {original:track.mode};
      // Preserve a new choice made through the site's own caption controls.
      if(item.expected!==undefined && track.mode!==item.expected)item.original=track.mode;
      track.mode=value;item.expected=value;owned.set(track,item);
    }
    function use(id) {
      const track=find(id);restore();
      for(const other of selected())if(other!==track && other.mode==='showing')mode(other,'hidden');
      mode(track,'showing');return list();
    }
    function hide() {for(const track of selected())if(track.mode==='showing')mode(track,'hidden');}
    const stamp=value=>{let ms=Math.max(0,Math.round(value*1000));const h=Math.floor(ms/3600000);ms%=3600000;const m=Math.floor(ms/60000);ms%=60000;return [h,m,Math.floor(ms/1000)].map(n=>String(n).padStart(2,'0')).join(':')+','+String(ms%1000).padStart(3,'0');};
    const escape=value=>value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    async function fileCues(track,src,check) {
      const cached=files.get(track);if(cached?.src===src)return cached.cues;
      const controller=new AbortController();pending=controller;
      const timer=setTimeout(()=>controller.abort(),20000);
      try {
        // Fetch only after Import, using normal page CORS access and no credentials.
        const response=await fetch(src,{credentials:'omit',signal:controller.signal});check();
        if(!response.ok)throw new Error('Player subtitle file failed (HTTP '+response.status+'). Try another track.');
        if(Number(response.headers.get('Content-Length'))>2000000)throw new Error('This track is too large to import.');
        const reader=response.body.getReader(),chunks=[];let size=0;
        try{for(;;){const item=await reader.read();check();if(item.done)break;size+=item.value.length;if(size>2000000)throw new Error('This track is too large to import.');chunks.push(item.value);}}catch(error){await reader.cancel().catch(()=>{});throw error;}
        const bytes=new Uint8Array(size);let at=0;for(const chunk of chunks){bytes.set(chunk,at);at+=chunk.length;}
        const cues=core.parse(core.prepare(core.decode(bytes)).text);check();
        files.set(track,{src,cues});return cues;
      } catch(error) {
        check();
        if(error.name==='AbortError')throw new Error('Player subtitle file timed out. Try again.');
        if(error instanceof TypeError)throw new Error('The player subtitle file could not load. Select this language in the player or try another track.');
        throw error;
      } finally {controller.abort();clearTimeout(timer);if(pending===controller)pending=null;}
    }
    async function read(id) {
      const track=find(id),target=video,request=revision,href=location.href,src=source(track);
      const check=()=>{if(revision!==request || target!==getVideo() || !target.isConnected || location.href!==href || !Array.from(target.textTracks).includes(track) || source(track)!==src)throw new Error('The video or track changed. Select a track again.');};
      const temporary=track.mode==='disabled';
      // Disabled HTML tracks may not be loaded yet. Hidden loads without display.
      if(temporary)mode(track,'hidden');
      try {
        const cached=files.get(track);
        let sourceCues=cached?.src===src ? cached.cues : null;
        if(!sourceCues && !track.cues?.length && src)sourceCues=await fileCues(track,src,check);
        const deadline=performance.now()+8000;
        while(!sourceCues && !track.cues?.length && performance.now()<deadline){
          check();
          await new Promise(resolve=>setTimeout(resolve,100));
        }
        check();
        if(target.seeking)throw new Error('Wait for the seek to finish, then import again.');
        const filmTime=getTime(),nativeTime=target.currentTime;
        if(!Number.isFinite(filmTime) || !Number.isFinite(nativeTime))throw new Error('Show video controls to read time, then import again.');
        const cues=sourceCues || Array.from(track.cues || []);
        if(!cues.length)throw new Error('No readable lines yet. Enable this language in the player, then try again.');
        if(cues.length>20000)throw new Error('This track is too large to import.');
        // Full subtitle files keep their film timestamps, like Load file. Only
        // cues read from the live browser track need the native-clock mapping.
        const offset=sourceCues ? 0 : filmTime-nativeTime,lines=[];
        let size=0;
        for(const cue of cues) {
          const cueStart=sourceCues ? cue.start : cue.startTime,cueEnd=sourceCues ? cue.end : cue.endTime;
          if(typeof cue.text!=='string' || !Number.isFinite(cueStart) || !Number.isFinite(cueEnd))continue;
          const start=Math.max(0,cueStart+offset),end=cueEnd+offset;
          if(end<=start || end>864000 || Math.round(end*1000)<=Math.round(start*1000))continue;
          const text=(sourceCues ? cue.text : typeof cue.getCueAsHTML==='function' ? cue.getCueAsHTML().textContent : core.plainText(cue.text)).replace(/\r\n?/g,'\n').replace(/\n[ \t]*\n+/g,'\n').trim();
          if(!text)continue;
          const block=(lines.length+1)+'\n'+stamp(start)+' --> '+stamp(end)+'\n'+escape(text)+'\n';
          size+=block.length+1;if(size>2000000)throw new Error('This track is too large to import.');lines.push(block);
        }
        const text=lines.join('\n');core.parse(text);
        const name=('Player - '+String(track.label || track.language || 'Subtitles')).replace(/[\\/:*?"<>|]/g,'_').slice(0,180)+'.srt';
        return {text,name,language:String(track.language || '').slice(0,40),count:lines.length};
      } finally {
        const item=owned.get(track);
        if(temporary && revision===request && item && track.mode===item.expected){track.mode=item.original;owned.delete(track);}
      }
    }
    return {list,use,hide,read,restore};
  }
  globalThis.SubtitlePlayerTracks={create};
})();
