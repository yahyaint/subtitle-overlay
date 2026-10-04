/* Validate per-file timing and appearance before storing or restoring a preset. */
(() => {
  const defaults={delay:0,rate:1,size:30,font:'system-ui, sans-serif',color:'#edf0fb',background:'#000000',opacity:72,bottom:10,enabled:true,shadow:true,shadowColor:'#000000',shadowOpacity:100,shadowBlur:3,shadowOffset:2,encoding:'utf-8',syncMode:'one',anchors:[]};
  function validate(value, cues) {
    if(!value || typeof value!=='object' || Array.isArray(value))throw new Error('Invalid subtitle settings.');
    const result={...defaults,...Object.fromEntries(Object.keys(defaults).filter(key=>key in value).map(key=>[key,value[key]]))};
    for(const [key,min,max] of [['delay',-86400,86400],['rate',.5,2],['size',12,96],['opacity',0,100],['bottom',2,65],['shadowOpacity',0,100],['shadowBlur',0,20],['shadowOffset',0,20]])
      if(!Number.isFinite(result[key]) || result[key]<min || result[key]>max)throw new Error('Invalid subtitle '+key+'.');
    for(const key of ['color','background','shadowColor'])if(typeof result[key]!=='string' || !/^#[a-f\d]{6}$/i.test(result[key]))throw new Error('Invalid subtitle color.');
    for(const key of ['enabled','shadow'])if(typeof result[key]!=='boolean')throw new Error('Invalid subtitle setting.');
    if(!['system-ui, sans-serif','Arial, sans-serif','Verdana, sans-serif','Tahoma, sans-serif','Georgia, serif',"'Courier New', monospace"].includes(result.font))throw new Error('Invalid subtitle font.');
    if(!['utf-8','windows-1256','windows-1252','utf-16le'].includes(result.encoding) || !['one','two','three'].includes(result.syncMode))throw new Error('Invalid subtitle option.');
    if(!Array.isArray(result.anchors) || result.anchors.length>3)throw new Error('Invalid sync points.');
    result.anchors=result.anchors.map(point=>{
      if(!point || !Number.isSafeInteger(point.cueIndex) || point.cueIndex<0 || !Number.isFinite(point.subtitleTime) || point.subtitleTime<0 || !Number.isFinite(point.videoTime) || point.videoTime<0 || point.videoTime>864000)throw new Error('Invalid sync point.');
      if(cues && (!cues[point.cueIndex] || Math.abs(cues[point.cueIndex].start-point.subtitleTime)>0.000001))throw new Error('Sync point does not match this subtitle.');
      return {cueIndex:point.cueIndex,subtitleTime:point.subtitleTime,videoTime:point.videoTime};
    });
    return result;
  }
  globalThis.SubtitleSettings={defaults,validate};
  if(typeof module!=='undefined')module.exports=globalThis.SubtitleSettings;
})();
