/* Read public tracks and their selected subtitle file. No network interception. */
(() => {
  function languageName(code) {
    if(!code || code==='und')return 'Unknown language';
    try{return new Intl.DisplayNames(['en'],{type:'language'}).of(code) || code;}catch{return code;}
  }
  function groupTracks(tracks) {
    const groups=new Map();
    for(const track of tracks){const raw=String(track.language || '').toLowerCase().replaceAll('_','-'),code=/^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/.test(raw) ? raw : 'und';if(!groups.has(code))groups.set(code,{code,name:languageName(code),tracks:[]});groups.get(code).tracks.push(track);}
    return Array.from(groups.values()).sort((a,b)=>a.code==='und' ? 1 : b.code==='und' ? -1 : a.name.localeCompare(b.name));
  }
  function renderOptions(tracks,select,languages) {
    const doc=select.ownerDocument,groups=groupTracks(tracks),filter=languages.value,previous=select.value;
    const option=(value,label)=>{const node=doc.createElement('option');node.value=value;node.textContent=label;return node;};
    languages.replaceChildren(option('*','All languages ('+tracks.length+')'),...groups.map(group=>option(group.code,group.name+' ('+group.tracks.length+')')));
    languages.value=groups.some(group=>group.code===filter) ? filter : '*';languages.disabled=!tracks.length;
    const shown=groups.filter(group=>languages.value==='*' || group.code===languages.value);select.replaceChildren();
    for(const group of shown){const section=doc.createElement('optgroup');section.label=group.name+' ('+group.tracks.length+')';for(const track of group.tracks)section.append(option(track.id,track.label+(track.language && track.language!==track.label ? ' · '+track.language : '')+' · '+(track.count===null ? 'not loaded' : track.count+' lines')));select.append(section);}
    const visible=shown.flatMap(group=>group.tracks);select.value=visible.some(track=>track.id===previous) ? previous : (visible.find(track=>track.mode==='showing') || visible[0])?.id || '';select.disabled=!visible.length;
    return {visible,languages:groups.length};
  }
  function create({getVideo,getTime,core}) {
    let video=null,revision=0,nextId=0,pending=null,lastCaption=null;
    const hiddenCaptions=new Map();
    const ids=new WeakMap(),counts=new WeakMap(),owned=new Map(),files=new WeakMap();
    function restore() {
      revision++;
      pending?.abort();pending=null;
      for(const [track,item] of owned){try{if(track.mode===item.expected)track.mode=item.original;}catch{/* Removed tracks need no restoration. */}}
      owned.clear();
      for(const [caption,item] of hiddenCaptions){if(caption.style.getPropertyValue('visibility')==='hidden' && caption.style.getPropertyPriority('visibility')==='important'){if(item.value)caption.style.setProperty('visibility',item.value,item.priority);else caption.style.removeProperty('visibility');}}
      hiddenCaptions.clear();
    }
    function selected() {
      const current=getVideo();
      if(current!==video){restore();lastCaption=null;video=current;}
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
    function hide() {for(const track of selected())if(track.mode==='showing')mode(track,'hidden');
      const caption=lastCaption?.video===video && lastCaption.node.isConnected ? lastCaption.node : null;
      if(caption && !hiddenCaptions.has(caption)){hiddenCaptions.set(caption,{value:caption.style.getPropertyValue('visibility'),priority:caption.style.getPropertyPriority('visibility')});caption.style.setProperty('visibility','hidden','important');}
    }
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
    function playerStyle(target,track) {
      const settings=globalThis.SubtitleSettings,rect=target.getBoundingClientRect();
      if(!settings || !rect.width || !rect.height)return {style:null,styleSource:''};
      const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
      const color=value=>{const parts=String(value).match(/^rgba?\(\s*([\d.]+)[, ]+([\d.]+)[, ]+([\d.]+)(?:\s*[,/]\s*([\d.]+))?\s*\)$/);return parts ? {hex:'#'+parts.slice(1,4).map(n=>Math.round(clamp(Number(n),0,255)).toString(16).padStart(2,'0')).join(''),alpha:parts[4]===undefined ? 1 : Number(parts[4])} : null;};
      // Read known caption renderers near this video. Never read extension UI.
      const selector='.lp-subtitle,.vjs-text-track-cue,.shaka-text-container,.jw-text-track-cue,[data-subtitle-cue]';
      let caption=null,parent=target.parentElement;
      for(let depth=0;parent && depth<4;depth++,parent=parent.parentElement){
        if(parent.querySelectorAll('video').length!==1)break;
        const matches=Array.from(parent.querySelectorAll(selector)).filter(node=>!node.closest('#subtitle-overlay-root'));
        caption=matches.find(node=>node.getClientRects().length && getComputedStyle(node).display!=='none');if(caption)break;
      }
      if(caption){
        const css=getComputedStyle(caption),box=caption.getBoundingClientRect(),container=caption.parentElement,bounds=container.getBoundingClientRect();
        const style=settings.appearance(settings.defaults),foreground=color(css.color),background=color(css.backgroundColor);
        style.font=css.fontFamily;style.size=clamp(parseFloat(css.fontSize)||30,12,96);style.weight=clamp(parseFloat(css.fontWeight)||400,100,900);style.italic=css.fontStyle!=='normal';style.align=['left','center','right','start','end'].includes(css.textAlign) ? css.textAlign : 'center';
        style.lineHeight=clamp((parseFloat(css.lineHeight)||style.size*1.35)/style.size,.5,4);
        style.paddingX=clamp(parseFloat(css.paddingLeft)||0,0,96);style.paddingY=clamp(parseFloat(css.paddingTop)||0,0,96);style.radius=clamp(parseFloat(css.borderTopLeftRadius)||0,0,96);
        if(foreground)style.color=foreground.hex;if(background){style.background=background.hex;style.opacity=Math.round(clamp(background.alpha,0,1)*100);}
        // Opacity zero can mean no current line. Do not hide the imported track.
        style.shadow=css.textShadow!=='none';
        const shade=css.textShadow.match(/rgba?\([^)]*\)/),numbers=css.textShadow.replace(/rgba?\([^)]*\)/g,'').match(/-?[\d.]+px/g),shadeColor=shade && color(shade[0]);
        if(shadeColor){style.shadowColor=shadeColor.hex;style.shadowOpacity=Math.round(shadeColor.alpha*100);}
        if(numbers?.length>=2){style.shadowX=clamp(parseFloat(numbers[0]),-20,20);style.shadowOffset=clamp(parseFloat(numbers[1]),-20,20);style.shadowBlur=clamp(parseFloat(numbers[2])||0,0,20);}
        const positioned=css.position==='absolute' || css.position==='fixed',area=positioned ? box : bounds;
        const inline=(positioned ? caption : container).style,topGap=area.top-rect.top,bottomGap=rect.bottom-area.bottom;
        style.positionEdge=inline.top && inline.top!=='auto' && inline.bottom==='auto' || !(inline.bottom && inline.bottom!=='auto') && topGap<bottomGap ? 'top' : 'bottom';
        const y=style.positionEdge==='top' ? area.top-rect.top : rect.bottom-area.bottom;
        style.bottom=clamp(y/rect.height*100,0,100);
        style.horizontal=clamp(((box.width ? box.left+box.width/2 : bounds.left+bounds.width/2)-rect.left)/rect.width*100,0,100);
        // Caption boxes shrink with the current sentence. Keep their wrapping limit.
        const parentCss=getComputedStyle(container),available=Math.max(1,(bounds.width || rect.width)-(parseFloat(parentCss.paddingLeft)||0)-(parseFloat(parentCss.paddingRight)||0)),max=parseFloat(css.maxWidth);
        const limit=Number.isFinite(max) ? css.maxWidth.endsWith('%') ? available*max/100 : max : available;
        style.width=clamp(limit/rect.width*100,1,100);
        try{return {style:settings.appearance(style),styleSource:'player',caption};}catch{return {style:null,styleSource:''};}
      }
      // Native WebVTT exposes position, but browsers do not expose its drawn font.
      const cue=Array.from(track.activeCues?.length ? track.activeCues : track.cues || []).find(cue=>typeof cue.position==='number');
      if(cue){
        const style=settings.appearance(settings.defaults);style.horizontal=clamp(cue.position,0,100);style.width=clamp(cue.size || 94,1,100);style.align=['left','center','right','start','end'].includes(cue.align) ? cue.align : 'center';
        if(cue.snapToLines===false && Number.isFinite(cue.line)){style.positionEdge='top';style.bottom=clamp(cue.line,0,100);}
        return {style:Object.fromEntries(['horizontal','width','align','positionEdge','bottom'].map(key=>[key,style[key]])),styleSource:'position'};
      }
      return {style:null,styleSource:''};
    }
    async function read(id) {
      const track=find(id),target=video,request=revision,href=location.href,src=source(track);
      const check=()=>{if(revision!==request || target!==getVideo() || !target.isConnected || location.href!==href || !Array.from(target.textTracks).includes(track) || source(track)!==src)throw new Error('The video or track changed. Select a track again.');};
      let capturedStyle=playerStyle(target,track);
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
        if(!capturedStyle.style)capturedStyle=playerStyle(target,track);
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
        lastCaption=capturedStyle.caption ? {node:capturedStyle.caption,video:target} : null;
        const {style,styleSource}=capturedStyle;
        return {text,name,language:String(track.language || '').slice(0,40),count:lines.length,style,styleSource};
      } finally {
        const item=owned.get(track);
        if(temporary && revision===request && item && track.mode===item.expected){track.mode=item.original;owned.delete(track);}
      }
    }
    return {list,use,hide,read,restore};
  }
  globalThis.SubtitlePlayerTracks={create,groupTracks,renderOptions,languageName};
})();
