/* Shared pure subtitle parsing and clock mapping. No HTML is rendered from files. */
(() => {
  function timestamp(value) {
    const match = value.trim().match(/^(?:(\d+):)?(\d{2}):(\d{2})[.,](\d{1,3})$/);
    if (!match || Number(match[2]) > 59 || Number(match[3]) > 59) return NaN;
    return Number(match[1] || 0) * 3600 + Number(match[2]) * 60 + Number(match[3]) + Number(match[4].padEnd(3, '0')) / 1000;
  }
  function plainText(value) {
    return value.replace(/<[^>]*>/g, '').replace(/\{\\[^}]*\}/g, '')
      .replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&quot;/gi, '"')
      .replace(/&apos;|&#39;/gi, "'").replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').trim();
  }
  function parse(source) {
    if (typeof source !== 'string' || source.length > 2_000_000) throw new Error('Choose an SRT/VTT file smaller than 2 MB.');
    const blocks = source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').split(/\n[ \t]*\n+/);
    const cues = [];
    for (const block of blocks) {
      const lines = block.trim().split('\n');
      if (/^(?:WEBVTT|NOTE|STYLE|REGION)(?:\s|$)/.test(lines[0])) continue;
      const index = lines.findIndex(line => line.includes('-->'));
      if (index < 0 || index > 1) continue;
      const match = lines[index].match(/^\s*(\S+)\s*-->\s*(\S+)(?:\s.*)?$/);
      if (!match) continue;
      const start = timestamp(match[1]), end = timestamp(match[2]);
      const text = plainText(lines.slice(index + 1).join('\n'));
      if (Number.isFinite(start) && Number.isFinite(end) && end > start && text) cues.push({start, end, text});
    }
    if (!cues.length) throw new Error('No valid subtitle lines found in this file.');
    cues.sort((a, b) => a.start - b.start || a.end - b.end);
    return cues;
  }
  function createIndex(cues) {
    let maximum = -Infinity;
    return cues.map(cue => maximum = Math.max(maximum, cue.end));
  }
  function srtText(cues) {
    const time=value=>{let ms=Math.round(value*1000);const hours=Math.floor(ms/3600000);ms%=3600000;const minutes=Math.floor(ms/60000);ms%=60000;const seconds=Math.floor(ms/1000);return [hours,minutes,seconds].map(n=>String(n).padStart(2,'0')).join(':')+','+String(ms%1000).padStart(3,'0');};
    return cues.map((cue,index)=>(index+1)+'\n'+time(cue.start)+' --> '+time(cue.end)+'\n'+cue.text).join('\n\n')+'\n';
  }
  function decode(bytes, fallback='windows-1252') {
    let encoding;
    if(bytes[0]===0xff && bytes[1]===0xfe)encoding='utf-16le';
    else if(bytes[0]===0xfe && bytes[1]===0xff)encoding='utf-16be';
    else if(bytes.length>6 && bytes[1]===0 && bytes[3]===0 && bytes[5]===0)encoding='utf-16le';
    else if(bytes.length>6 && bytes[0]===0 && bytes[2]===0 && bytes[4]===0)encoding='utf-16be';
    if(encoding)return new TextDecoder(encoding).decode(bytes);
    try{return new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{return new TextDecoder(fallback).decode(bytes);}
  }
  function assText(value,wrapStyle){
    let drawing=false,text='',wrap=wrapStyle;
    // Drawing commands are not captions. Keep text after drawing mode ends.
    for(const part of value.match(/\{[^}]*\}|[^{}]+|[{}]/g) || []){
      if(part.startsWith('{') && part.endsWith('}')){
        for(const tag of part.matchAll(/\\(p(\d+)|q([0-3])|r[^\\}]*)/g)){
          if(tag[2]!==undefined)drawing=Number(tag[2])>0;
          else if(tag[3]!==undefined)wrap=Number(tag[3]);
          else{drawing=false;wrap=wrapStyle;}
        }
      }else if(!drawing)text+=part.replace(/\\N/g,'\n').replace(/\\n/g,wrap===2 ? '\n' : ' ').replace(/\\h/g,'\u00a0');
    }
    return plainText(text).replace(/\n[ \t\u00a0]*\n+/g,'\n');
  }
  function assCues(lines,source){
    let events=false,fields=['layer','start','end','style','name','marginl','marginr','marginv','effect','text'];const cues=[];
    const wrap=Number(source.match(/^\s*WrapStyle\s*:\s*([0-3])\s*$/im)?.[1] || 0);
    for(const line of lines){
      const section=line.trim().match(/^\[([^\]]+)\]$/);if(section){events=section[1].toLowerCase()==='events';continue;}
      if(!events)continue;
      const format=line.match(/^\s*Format\s*:\s*(.*)$/i);
      if(format){
        fields=format[1].split(',').map(value=>value.trim().toLowerCase());
        if(fields.length>32 || fields.at(-1)!=='text' || ['start','end','text'].some(name=>fields.filter(field=>field===name).length!==1))throw new Error('This ASS/SSA file has an unsupported event format.');
        continue;
      }
      const dialogue=line.match(/^\s*Dialogue\s*:\s*(.*)$/i);if(!dialogue)continue;
      const values=[];let remaining=dialogue[1];
      for(let i=0;i<fields.length-1;i++){const comma=remaining.indexOf(',');if(comma<0)break;values.push(remaining.slice(0,comma));remaining=remaining.slice(comma+1);}
      if(values.length!==fields.length-1)continue;values.push(remaining);
      const start=timestamp(values[fields.indexOf('start')]),end=timestamp(values[fields.indexOf('end')]),text=assText(values.at(-1),wrap);
      if(Number.isFinite(start) && Number.isFinite(end) && end>start && text)cues.push({start,end,text});
    }
    if(!cues.length)throw new Error('No readable text lines found in this ASS/SSA file. Drawing-only captions need an ASS renderer.');
    return cues;
  }
  function prepare(source, fps) {
    if(typeof source!=='string' || source.length>2000000)throw new Error('Choose a subtitle file smaller than 2 MB.');
    if(/<!doctype\s+html|<html(?:\s|>)|<head(?:\s|>)|<body(?:\s|>)/i.test(source.slice(0,2000))){const error=new Error('The website returned a page instead of subtitles. Continue on the download page.');error.code='WEBSITE_STEP_REQUIRED';throw error;}
    if(source.includes('\0'))throw new Error('This file contains image or binary captions. Choose a text subtitle file.');
    try{parse(source);return {text:source,converted:false};}catch{/* Try supported text SUB formats below. */}
    const lines=source.replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n').split('\n'),frames=[];
    if(lines.some(line=>/^\s*\[Events\]\s*$/i.test(line))){
      const cues=assCues(lines,source),text=srtText(cues);parse(text);
      return {text,converted:true,format:/^\s*(?:ScriptType\s*:\s*v4\.00\s*$|\[V4 Styles\])/im.test(source) ? 'SSA' : 'ASS'};
    }
    let declaredFps;
    for(const line of lines){
      const match=line.match(/^\s*\{(\d+)\}\{(\d+)\}(.*)$/);if(!match)continue;
      const start=Number(match[1]),end=Number(match[2]),payload=match[3].trim();
      if(!frames.length && start===end && /^(?:\d+(?:\.\d+)?)$/.test(payload) && Number(payload)>=1 && Number(payload)<=120){declaredFps=Number(payload);continue;}
      const text=plainText(payload.replace(/\{[yfsco]:[^}]*\}/gi,'').replace(/\|/g,'\n'));
      if(Number.isSafeInteger(start) && Number.isSafeInteger(end) && end>start && text)frames.push({start,end,text});
    }
    if(frames.length){
      const rate=declaredFps || Number(fps);
      if(!Number.isFinite(rate) || rate<1 || rate>120){const error=new Error('This SUB file uses frame numbers. Enter its FPS to load it.');error.code='FRAME_RATE_REQUIRED';throw error;}
      const cues=frames.map(cue=>({...cue,start:cue.start/rate,end:cue.end/rate}));const text=srtText(cues);parse(text);return {text,converted:true,format:'MicroDVD',fps:rate};
    }
    const cues=[];
    for(let i=0;i<lines.length;i++){
      const match=lines[i].trim().match(/^(\d{2}:\d{2}:\d{2}[.,]\d{1,3})\s*,\s*(\d{2}:\d{2}:\d{2}[.,]\d{1,3})$/);if(!match)continue;
      const start=timestamp(match[1]),end=timestamp(match[2]),body=[];
      while(i+1<lines.length && lines[i+1].trim() && !/^\[END SUBTITLE\]/i.test(lines[i+1]))body.push(lines[++i]);
      const text=plainText(body.join('\n').replace(/\[br\]/gi,'\n'));
      if(Number.isFinite(start) && Number.isFinite(end) && end>start && text)cues.push({start,end,text});
    }
    if(cues.length){const text=srtText(cues);parse(text);return {text,converted:true,format:'SubViewer'};}
    throw new Error('No readable subtitle lines found. Use SRT, VTT, ASS, SSA, or text SUB.');
  }
  function active(cues, ends, videoTime, delay = 0, rate = 1) {
    if(!Number.isFinite(videoTime) || !Number.isFinite(delay) || !Number.isFinite(rate) || rate<=0)return '';
    const time = (videoTime - delay) / rate;
    let low = 0, high = cues.length;
    while (low < high) {
      const mid = (low + high) >>> 1;
      if (cues[mid].start <= time) low = mid + 1;
      else high = mid;
    }
    const lines = [];
    for (let i = low - 1; i >= 0 && ends[i] > time; i--) {
      if (cues[i].end > time) lines.push(cues[i].text);
    }
    return lines.reverse().join('\n');
  }
  function clock(value) {
    const seconds = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
    return [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60].map(n => String(n).padStart(2, '0')).join(':');
  }
  function currentIndex(cues, ends, videoTime, delay=0, rate=1) {
    if(!cues.length || !Number.isFinite(videoTime) || !Number.isFinite(delay) || !Number.isFinite(rate) || rate<=0)return -1;
    const time=(videoTime-delay)/rate;let low=0,high=cues.length;
    while(low<high){const mid=(low+high)>>>1;if(cues[mid].start<=time)low=mid+1;else high=mid;}
    for(let i=low-1;i>=0 && ends[i]>time;i--)if(cues[i].end>time)return i;
    if(low===0)return 0;if(low===cues.length)return low-1;
    return time-cues[low-1].start<=cues[low].start-time ? low-1 : low;
  }
  function syncPair(first, second) {
    if(![first?.subtitleTime,first?.videoTime,second?.subtitleTime,second?.videoTime].every(Number.isFinite))throw new Error('Set two sync points first.');
    const subtitleGap=second.subtitleTime-first.subtitleTime,videoGap=second.videoTime-first.videoTime;
    if(subtitleGap<1 || videoGap<1)throw new Error('Choose a different line later in the film. Keep the points at least one second apart.');
    const rate=videoGap/subtitleGap,delay=first.videoTime-first.subtitleTime*rate;
    if(rate<.5 || rate>2 || Math.abs(delay)>86400)throw new Error('These points do not match. Check both lines and try again.');
    return {rate,delay};
  }
  function syncTriple(first,second,third){
    // Check each adjacent interval before fitting one clock scale to all three lines.
    syncPair(first,second);syncPair(second,third);
    const points=[first,second,third],x=points.reduce((sum,p)=>sum+p.subtitleTime,0)/3,y=points.reduce((sum,p)=>sum+p.videoTime,0)/3;
    const rate=points.reduce((sum,p)=>sum+(p.subtitleTime-x)*(p.videoTime-y),0)/points.reduce((sum,p)=>sum+(p.subtitleTime-x)**2,0),delay=y-rate*x;
    if(!Number.isFinite(rate) || !Number.isFinite(delay) || rate<.5 || rate>2 || Math.abs(delay)>86400)throw new Error('These points do not match. Check all three lines and try again.');
    return {rate,delay};
  }
  globalThis.SubtitleCore = {timestamp, plainText, parse, createIndex, prepare, decode, active, currentIndex, syncPair, syncTriple, clock};
  if (typeof module !== 'undefined') module.exports = globalThis.SubtitleCore;
})();
