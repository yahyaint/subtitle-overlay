// Test-only extension page. Bundled exclusively into the isolated fixture add-on.
(async()=>{
 const checks=[],assert=(condition,message)=>{if(!condition)throw new Error(message);};
 const api=async(type,args={})=>{const result=await browser.runtime.sendMessage({type,...args});assert(result?.ok,JSON.stringify(result));return result;};
 const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 try{
  await api('SAVE_KEY',{apiKey:'firefox-test-key'});
  assert((await api('GET_SETTINGS')).apiKey==='firefox-test-key','Key retrieval');
  assert(!('apiKey' in await browser.storage.local.get(null)),'Key leaked into local storage');
  await api('LIBRARY_LIST');
  await browser.storage.local.set({apiKey:'legacy-test-key'});
  const background=await browser.runtime.getBackgroundPage();await background.restrictStorage();
  assert((await api('GET_SETTINGS')).apiKey==='legacy-test-key','Legacy credential migration');
  assert(!('apiKey' in await browser.storage.local.get(null)),'Migrated key remains visible');
  checks.push('event background, Promise messaging and private credential vault');
  
  const film=await browser.tabs.create({url:TEST_ORIGIN});
  const tabId=film.id;
  for(let n=0;n<50;n++){const tab=await browser.tabs.get(tabId);if(tab.status==='complete' && tab.url?.startsWith(TEST_ORIGIN))break;await sleep(100);}
  assert(await browser.permissions.contains({origins:['http://*/*']}),'Fixture grant');
  const run=async(func,args=[])=>{const [result]=await browser.scripting.executeScript({target:{tabId},func,args});return result.result;};
  await browser.scripting.executeScript({target:{tabId},files:['subtitles.js','subtitle-settings.js','film-detection.js','player-subtitles.js','saved-library.js','content.js']});
  await run(()=>{const video=document.querySelector('video');for(const [key,value] of Object.entries({currentTime:10,duration:1000,paused:true,seeking:false,readyState:4}))Object.defineProperty(video,key,{value,writable:true,configurable:true});const track=video.addTextTrack('subtitles','English','en');track.addCue(new VTTCue(8,14,'Player line'));track.mode='hidden';});
  await browser.scripting.executeScript({target:{tabId},world:'MAIN',func:()=>{const video=document.querySelector('video');for(const [key,value] of Object.entries({currentTime:10,duration:1000,paused:true,seeking:false,readyState:4}))Object.defineProperty(video,key,{value,writable:true,configurable:true});}});
  assert((await api('IMPORT_LOCAL_SUBTITLE',{tabId,name:'test.zip',data:TEST_ZIP_DATA})).count===1,'ZIP import');
  const privateResult=await run(async()=>{const local=await browser.storage.local.get(null);const settings=await browser.runtime.sendMessage({type:'GET_SETTINGS'}).catch(()=>null);return {key:local.apiKey,privileged:settings?.apiKey,session:typeof browser.storage.session};});
  assert(!privateResult.key && !privateResult.privileged && privateResult.session==='undefined','Content credential boundary');
  checks.push('DEFLATE ZIP import, legacy key migration and content credential boundary');
  const srt='1\n00:00:08,000 --> 00:00:14,000\nFirst line\n\n2\n00:00:20,000 --> 00:00:24,000\nSecond line\n\n3\n00:00:30,000 --> 00:00:34,000\nThird line';
  assert((await api('IMPORT_LOCAL_SUBTITLE',{tabId,name:'test.srt',data:btoa(srt)})).count===3,'SRT import');
  await sleep(500);
  await run(()=>{const root=document.querySelector('#subtitle-overlay-root').shadowRoot;root.querySelector('#syncMode').value='three';root.querySelector('#syncMode').dispatchEvent(new Event('change'));});
  for(const [time,index,id] of [[10,0,'markFirst'],[22,1,'syncSecond'],[32,2,'syncThird']]){
   await browser.scripting.executeScript({target:{tabId},world:'MAIN',func:time=>{document.querySelector('video').currentTime=time;},args:[time]});
   await run(time=>{const video=document.querySelector('video');video.currentTime=time;video.dispatchEvent(new Event('seeked'));},[time]);await sleep(400);
   await run((index,id)=>{const root=document.querySelector('#subtitle-overlay-root').shadowRoot;root.querySelector('#cues').value=String(index);root.querySelector('#cues').dispatchEvent(new Event('change'));root.querySelector('#'+id).click();},[index,id]);
  }
  assert(await run(()=>document.querySelector('#subtitle-overlay-root').shadowRoot.querySelector('#delay').value)==='2','Three-point sync: '+JSON.stringify(await browser.tabs.sendMessage(tabId,{type:'GET_PLAYER_INFO'})));
  await browser.scripting.executeScript({target:{tabId},world:'MAIN',func:()=>{document.querySelector('video').currentTime=22;}});
  await run(()=>{document.querySelector('video').currentTime=22;document.querySelector('video').dispatchEvent(new Event('seeked'));});await sleep(500);
  assert(await run(()=>document.querySelector('#subtitle-overlay-root').shadowRoot.querySelector('#text').textContent)==='Second line','Seek recovery');
  const tracks=await browser.tabs.sendMessage(tabId,{type:'GET_PLAYER_TRACKS'});assert(tracks.tracks?.length,'Native caption discovery');
  const report=await browser.tabs.sendMessage(tabId,{type:'GET_PLAYER_INFO'});assert(report.report.clockBridgeError==='','MAIN bridge error');assert(report.report.pageClock,'MAIN page clock');
  const saved=await api('SAVE_ACTIVE_SUBTITLE',{tabId});assert(saved.libraryId,'Saving current settings');
  assert((await api('LIBRARY_LIST')).entries.length===1,'Saved library');
  await api('LIBRARY_LOAD',{id:saved.libraryId,tabId});
  assert(await run(()=>document.querySelector('#subtitle-overlay-root').shadowRoot.querySelector('#delay').value)==='2','Saved sync reload');
  await run(()=>{document.querySelector('#subtitle-overlay-root').shadowRoot.querySelector('#close').click();});
  assert(await run(()=>{const root=document.querySelector('#subtitle-overlay-root').shadowRoot;return root.querySelector('#panel').hidden && getComputedStyle(root.querySelector('#toggle')).display!=='none';}),'Header hide keeps icon');
  await run(()=>{document.querySelector('#subtitle-overlay-root').shadowRoot.querySelector('#toggle').click();});
  assert(await run(()=>!document.querySelector('#subtitle-overlay-root').shadowRoot.querySelector('#panel').hidden),'Reopen');
  checks.push('MAIN bridge, native captions, SRT import, three-sentence sync, seek recovery, save and hide/reopen');
  const {downloadId}=await api('EXPORT_PLAYER_REPORT',{tabId});
  let item;for(let n=0;n<50;n++){[item]=await browser.downloads.search({id:downloadId});if(item.state==='complete')break;await sleep(100);}
  assert(item.state==='complete' && /Subtitle Overlay[\\/]player-info.json$/.test(item.filename),'Download subfolder');
  await browser.downloads.removeFile(downloadId);await browser.downloads.erase({id:downloadId});
  await api('FORGET');assert((await api('GET_SETTINGS')).apiKey==='','Account removal');
  checks.push('download API, portable Downloads subfolder and account removal');
  await fetch(TEST_ORIGIN+'/result',{method:'POST',body:JSON.stringify({ok:true,checks})});
 }catch(error){await fetch(TEST_ORIGIN+'/result',{method:'POST',body:JSON.stringify({ok:false,checks,error:error.message+'\n'+error.stack})});}
})();
