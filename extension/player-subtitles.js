/* Read public text tracks from the selected video. No network interception. */
(() => {
  function create({getVideo,getTime,core}) {
    let video=null,revision=0,nextId=0;
    const ids=new WeakMap(),counts=new WeakMap(),owned=new Map();
    function restore() {
      revision++;
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
    function list() {
      return selected().map(track=>{const count=track.cues?.length;if(count!==undefined)counts.set(track,count);return {id:idOf(track),label:String(track.label || track.language || 'Subtitles').slice(0,150),language:String(track.language || '').slice(0,40),kind:track.kind,mode:track.mode,count:count ?? counts.get(track) ?? null};});
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
    async function read(id) {
      const track=find(id),target=video,request=revision,href=location.href;
      const temporary=track.mode==='disabled';
      // Disabled HTML tracks may not be loaded yet. Hidden loads without display.
      if(temporary)mode(track,'hidden');
      try {
        const deadline=performance.now()+8000;
        while(!track.cues?.length && performance.now()<deadline){
          if(revision!==request || target!==getVideo() || !target.isConnected || location.href!==href)throw new Error('The video changed. Select a track again.');
          await new Promise(resolve=>setTimeout(resolve,100));
        }
        if(revision!==request || target!==getVideo() || !target.isConnected || location.href!==href || !Array.from(target.textTracks).includes(track))throw new Error('The video changed. Select a track again.');
        if(target.seeking)throw new Error('Wait for the seek to finish, then import again.');
        const filmTime=getTime(),nativeTime=target.currentTime;
        if(!Number.isFinite(filmTime) || !Number.isFinite(nativeTime))throw new Error('Show video controls to read time, then import again.');
        if(!track.cues?.length)throw new Error('No readable lines yet. Enable this language in the player, then try again.');
        if(track.cues.length>20000)throw new Error('This track is too large to import.');
        const offset=filmTime-nativeTime,lines=[];
        let size=0;
        for(const cue of Array.from(track.cues)) {
          if(typeof cue.text!=='string' || !Number.isFinite(cue.startTime) || !Number.isFinite(cue.endTime))continue;
          const start=Math.max(0,cue.startTime+offset),end=cue.endTime+offset;
          if(end<=start || end>864000 || Math.round(end*1000)<=Math.round(start*1000))continue;
          const text=(typeof cue.getCueAsHTML==='function' ? cue.getCueAsHTML().textContent : core.plainText(cue.text)).replace(/\r\n?/g,'\n').replace(/\n[ \t]*\n+/g,'\n').trim();
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
