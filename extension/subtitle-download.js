const SubtitleDownload=(()=>{
  const limit=2000000;
  function safeUrl(value){const url=new URL(value);if(url.protocol!=='https:' || url.username || url.password || !['opensubtitles.org','opensubtitles.com'].some(host=>url.hostname===host || url.hostname.endsWith('.'+host)))throw new Error('Use an OpenSubtitles download link.');return url.href;}
  function subtitleId(value){
    try{
      const url=new URL(safeUrl(value));
      if(url.hostname!=='opensubtitles.org' && !url.hostname.endsWith('.opensubtitles.org'))return null;
      return url.pathname.match(/\/(?:subtitleserve\/sub|download\/sub|subtitles)\/(\d+)(?:\/|$)/i)?.[1] || null;
    }catch{return null;}
  }
  async function bytes(response){if(!response.ok)throw new Error('Subtitle download failed (HTTP '+response.status+').');if(Number(response.headers.get('Content-Length'))>limit)throw new Error('Subtitle file is too large.');const reader=response.body.getReader(),chunks=[];let length=0;for(;;){const item=await reader.read();if(item.done)break;length+=item.value.length;if(length>limit){await reader.cancel();throw new Error('Subtitle file is too large.');}chunks.push(item.value);}const data=new Uint8Array(length);let at=0;for(const chunk of chunks){data.set(chunk,at);at+=chunk.length;}return data;}
  async function inflate(data){const stream=new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));return bytes(new Response(stream));}
  async function extract(data,name){
    if(data.length>limit)throw new Error('Subtitle file is too large.');
    if(data[0]===0x1f && data[1]===0x8b){data=await bytes(new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('gzip'))));name=name.replace(/\.gz$/i,'');if(data[0]===0x1f && data[1]===0x8b)throw new Error('Nested gzip files are not supported.');}
    if(data[0]===0x52 && data[1]===0x61 && data[2]===0x72)throw new Error('This is a RAR archive. Extract it first, or choose a ZIP download.');
    if(data[0]!==0x50 || data[1]!==0x4b)return [{name:SubtitleFolder.filename(name),bytes:data}];
    const view=new DataView(data.buffer,data.byteOffset,data.byteLength);let end=-1;
    for(let at=data.length-22;at>=Math.max(0,data.length-65557);at--)if(view.getUint32(at,true)===0x06054b50){end=at;break;}
    if(end<0)throw new Error('Invalid ZIP file.');
    const count=view.getUint16(end+10,true);let at=view.getUint32(end+16,true);if(count>100)throw new Error('ZIP contains too many files.');const files=[];let total=0;
    for(let i=0;i<count;i++){
      if(at+46>data.length||view.getUint32(at,true)!==0x02014b50)throw new Error('Invalid ZIP file.');
      const flags=view.getUint16(at+8,true),method=view.getUint16(at+10,true),size=view.getUint32(at+20,true),unpacked=view.getUint32(at+24,true),nl=view.getUint16(at+28,true),extra=view.getUint16(at+30,true),comment=view.getUint16(at+32,true),offset=view.getUint32(at+42,true);
      if(at+46+nl+extra+comment>data.length)throw new Error('Invalid ZIP directory.');
      const filename=new TextDecoder().decode(data.slice(at+46,at+46+nl));at+=46+nl+extra+comment;
      if(!/\.(srt|vtt|sub|ass|ssa)$/i.test(filename))continue;
      if(flags&1)throw new Error('Encrypted ZIP files are not supported.');if(unpacked>limit||(total+=unpacked)>limit)throw new Error('Unpacked subtitles are too large.');
      if(offset+30>data.length||view.getUint32(offset,true)!==0x04034b50)throw new Error('Invalid ZIP entry.');const start=offset+30+view.getUint16(offset+26,true)+view.getUint16(offset+28,true);
      if(start+size>data.length)throw new Error('Invalid ZIP entry.');const compressed=data.slice(start,start+size),raw=method===0?compressed:method===8?await inflate(compressed):null;
      if(!raw || raw.length!==unpacked)throw new Error('Unsupported ZIP entry.');files.push({name:SubtitleFolder.filename(filename),bytes:raw});if(files.length>20)throw new Error('ZIP contains too many subtitle files.');
    }
    if(!files.length)throw new Error('ZIP contains no SRT, VTT, ASS, SSA, or text SUB files.');return files;
  }
  return {safeUrl,subtitleId,bytes,extract};
})();
