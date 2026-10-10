/* Validate per-file timing and appearance before storing or restoring a preset. */
(() => {
  const defaults={delay:0,rate:1,size:30,font:'system-ui, sans-serif',color:'#edf0fb',background:'#000000',opacity:72,bottom:10,horizontal:50,width:94,positionEdge:'bottom',align:'center',weight:600,italic:false,lineHeight:1.35,paddingX:12,paddingY:3.6,radius:5,shadowX:0,originalStyle:null,enabled:true,shadow:true,shadowColor:'#000000',shadowOpacity:100,shadowBlur:3,shadowOffset:2,encoding:'utf-8',syncMode:'one',anchors:[]};
  const appearanceKeys=['size','font','color','background','opacity','bottom','horizontal','width','positionEdge','align','weight','italic','lineHeight','paddingX','paddingY','radius','shadow','shadowColor','shadowOpacity','shadowBlur','shadowOffset','shadowX'];
  function appearance(value) {
    if(!value || typeof value!=='object' || Array.isArray(value))throw new Error('Invalid player text style.');
    const result=validate({...Object.fromEntries(appearanceKeys.filter(key=>key in value).map(key=>[key,value[key]])),originalStyle:null});
    return Object.fromEntries(appearanceKeys.map(key=>[key,result[key]]));
  }
  function validate(value, cues) {
    if(!value || typeof value!=='object' || Array.isArray(value))throw new Error('Invalid subtitle settings.');
    const result={...defaults,...Object.fromEntries(Object.keys(defaults).filter(key=>key in value).map(key=>[key,value[key]]))};
    for(const [key,min,max] of [['delay',-86400,86400],['rate',.5,2],['size',12,96],['opacity',0,100],['bottom',0,100],['horizontal',0,100],['width',1,100],['weight',100,900],['lineHeight',.5,4],['paddingX',0,96],['paddingY',0,96],['radius',0,96],['shadowX',-20,20],['shadowOpacity',0,100],['shadowBlur',0,20],['shadowOffset',-20,20]])
      if(!Number.isFinite(result[key]) || result[key]<min || result[key]>max)throw new Error('Invalid subtitle '+key+'.');
    for(const key of ['color','background','shadowColor'])if(typeof result[key]!=='string' || !/^#[a-f\d]{6}$/i.test(result[key]))throw new Error('Invalid subtitle color.');
    for(const key of ['enabled','shadow','italic'])if(typeof result[key]!=='boolean')throw new Error('Invalid subtitle setting.');
    if(typeof result.font!=='string' || result.font.length>200 || !/^[a-zA-Z0-9 ,"'_-]+$/.test(result.font))throw new Error('Invalid subtitle font.');
    if(!['bottom','top'].includes(result.positionEdge) || !['left','center','right','start','end'].includes(result.align))throw new Error('Invalid subtitle position.');
    result.originalStyle=result.originalStyle===null ? null : appearance(result.originalStyle);
    if(!['utf-8','windows-1256','windows-1252','utf-16le'].includes(result.encoding) || !['one','two','three'].includes(result.syncMode))throw new Error('Invalid subtitle option.');
    if(!Array.isArray(result.anchors) || result.anchors.length>3)throw new Error('Invalid sync points.');
    result.anchors=result.anchors.map(point=>{
      if(!point || !Number.isSafeInteger(point.cueIndex) || point.cueIndex<0 || !Number.isFinite(point.subtitleTime) || point.subtitleTime<0 || !Number.isFinite(point.videoTime) || point.videoTime<0 || point.videoTime>864000)throw new Error('Invalid sync point.');
      if(cues && (!cues[point.cueIndex] || Math.abs(cues[point.cueIndex].start-point.subtitleTime)>0.000001))throw new Error('Sync point does not match this subtitle.');
      return {cueIndex:point.cueIndex,subtitleTime:point.subtitleTime,videoTime:point.videoTime};
    });
    return result;
  }
  globalThis.SubtitleSettings={defaults,validate,appearance,appearanceKeys};
  if(typeof module!=='undefined')module.exports=globalThis.SubtitleSettings;
})();
