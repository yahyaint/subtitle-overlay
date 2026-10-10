const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve('extension'),testRoot=path.resolve('.test-artifacts/player-tracks-extension');
fs.mkdirSync(testRoot,{recursive:true});for(const name of fs.readdirSync(root))fs.copyFileSync(path.join(root,name),path.join(testRoot,name));
const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json')));manifest.host_permissions=['http://127.0.0.1/*'];fs.writeFileSync(path.join(testRoot,'manifest.json'),JSON.stringify(manifest));
const vtt='WEBVTT\n\n00:00:01.000 --> 00:00:05.000\n<i>مرحبا</i> &amp; أهلا\n\n00:00:11.000 --> 00:00:15.000\nالسطر الثاني\n\n00:00:21.000 --> 00:00:25.000\nالسطر الثالث';
let requests=0;const server=http.createServer((req,res)=>{if(req.url==='/ar.vtt'){requests++;res.writeHead(200,{'Content-Type':'text/vtt'});res.end(vtt);return;}res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end('<title>Player track test</title><style>video{width:900px;height:500px}#decoy{display:none}</style><video id="film" muted controls><track kind="subtitles" label="العربية" srclang="ar" src="/ar.vtt"></video><video id="decoy"></video><div role="slider" aria-label="Timeline" aria-valuenow="101" aria-valuemax="1000" style="width:900px;height:20px"></div>');});
const checks=[],pass=text=>{checks.push(text);console.log('PASS '+text);};
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const context=await chromium.launchPersistentContext(path.resolve('.test-artifacts/player-tracks-profile-'+Date.now()),{channel:'chromium',headless:true,args:[`--disable-extensions-except=${testRoot}`,`--load-extension=${testRoot}`],viewport:{width:1360,height:900}});
 context.setDefaultTimeout(20000);context.setDefaultNavigationTimeout(10000);
 try {
  const worker=context.serviceWorkers()[0]||await context.waitForEvent('serviceworker',{timeout:20000}),id=new URL(worker.url()).hostname,film=await context.newPage(),errors=[];
  console.log('Connected extension and local fixture.');
  film.on('pageerror',error=>errors.push(error.message));await film.goto(`http://127.0.0.1:${server.address().port}`);
  await film.evaluate(async()=>{
   const video=document.querySelector('#film'),canvas=document.createElement('canvas');canvas.width=960;canvas.height=540;canvas.getContext('2d').fillRect(0,0,960,540);
   const stream=canvas.captureStream(10),recorder=new MediaRecorder(stream,{mimeType:'video/webm'}),chunks=[];recorder.ondataavailable=event=>chunks.push(event.data);const done=new Promise(resolve=>recorder.onstop=resolve);recorder.start();const timer=setInterval(()=>{canvas.getContext('2d').fillStyle='#216aa3';canvas.getContext('2d').fillRect(0,0,960,540);},50);await new Promise(resolve=>setTimeout(resolve,1200));recorder.stop();await done;clearInterval(timer);stream.getTracks().forEach(track=>track.stop());
   const ready=new Promise((resolve,reject)=>{video.onloadedmetadata=resolve;video.onerror=()=>reject(new Error('Local video decode failed'));setTimeout(()=>reject(new Error('Local video metadata did not load')),10000);});video.src=URL.createObjectURL(new Blob(chunks,{type:'video/webm'}));await ready;video.pause();
   globalThis.english=video.addTextTrack('captions','English','en');english.addCue(new VTTCue(1,5,'English line'));english.mode='showing';
   const metadata=video.addTextTrack('metadata','Metadata','');metadata.addCue(new VTTCue(1,5,'Never import metadata'));metadata.mode='hidden';
   const decoy=document.querySelector('#decoy').addTextTrack('subtitles','Ad subtitles','en');decoy.addCue(new VTTCue(0,5,'Ad line'));decoy.mode='showing';
   for(const [key,value] of Object.entries({currentTime:2,duration:Infinity,paused:true,readyState:4}))Object.defineProperty(video,key,{value,writable:true,configurable:true});
   navigator.mediaSession.metadata=new MediaMetadata({title:'Track Test Film'});
  });
  const popup=await context.newPage();await popup.goto(`chrome-extension://${id}/popup.html`);const tabId=await popup.evaluate(async url=>(await chrome.tabs.query({})).find(tab=>tab.url===url).id,film.url());
  await popup.evaluate(id=>chrome.scripting.executeScript({target:{tabId:id},func:()=>{const video=document.querySelector('#film');for(const [key,value] of Object.entries({currentTime:2,duration:Infinity,paused:true,readyState:4}))Object.defineProperty(video,key,{value,writable:true,configurable:true});}}),tabId);
  await popup.evaluate(id=>{tabId=id;},tabId);await popup.locator('#playerTracksSettings').locator('summary').click();await popup.locator('#refreshPlayerTracks').click();
  await popup.waitForFunction(()=>document.querySelector('#playerTrackCount').textContent==='2');assert.equal(await popup.locator('#playerTracks option').count(),2);
  assert.deepEqual(await film.evaluate(()=>Array.from(document.querySelector('#film').textTracks).map(t=>[t.label,t.mode])),[['العربية','disabled'],['English','showing'],['Metadata','hidden']]);assert.equal(requests,0);
  const ui=id=>film.locator('#subtitle-overlay-root #'+id);assert(await ui('panel').isHidden());
  pass('Automatic discovery uses the selected film only, excludes metadata/ad tracks, and leaves caption modes and lazy track loading unchanged');
  const arabic=(await popup.locator('#playerTracks option').allTextContents()).findIndex(text=>text.startsWith('العربية'));
  await popup.locator('#playerTracks').selectOption({index:arabic});await popup.locator('#usePlayerTrack').click();await film.waitForFunction(()=>document.querySelector('#film').textTracks[0].mode==='showing');
  assert.equal(await film.evaluate(()=>english.mode),'hidden');assert(await ui('delay').isDisabled());assert.equal(await ui('text').textContent(),'');assert.equal(await ui('filename').textContent(),'Player: العربية');
  pass('Use player selects original native captions and disables overlay timing/style controls without changing cue text or times');
  await popup.locator('#importPlayerTrack').click();await popup.waitForFunction(()=>document.querySelector('#status').textContent.includes('3 loaded lines imported'));
  assert.notEqual(await film.evaluate(()=>document.querySelector('#film').textTracks[0].mode),'showing');assert.equal(await ui('text').textContent(),'مرحبا & أهلا');assert(await ui('delay').isEnabled());
  const snapshot=await popup.evaluate(id=>chrome.tabs.sendMessage(id,{type:'GET_SUBTITLE_SNAPSHOT'}),tabId);assert.match(snapshot.text,/00:01:40,000 --> 00:01:44,000/);assert.match(snapshot.text,/مرحبا &amp; أهلا/);assert.equal(snapshot.language,'ar');
  pass('Import reads real WebVTT cues, preserves Arabic/plain text, maps native time 2 to film time 101, and exposes all overlay adjustments');
  await ui('syncSettings').locator('summary').click();await ui('sync').click();assert.equal(await ui('delay').inputValue(),'1');await ui('reset').click();await ui('syncMode').selectOption('three');
  for(const [button,time,text] of [['markFirst',101,'مرحبا'],['syncSecond',113,'السطر الثاني'],['syncThird',125,'السطر الثالث']]){
   await film.evaluate(time=>document.querySelector('[role=slider]').setAttribute('aria-valuenow',String(time)),time);await film.waitForFunction(value=>document.querySelector('#subtitle-overlay-root').shadowRoot.querySelector('#time').textContent===value,'00:'+String(Math.floor(time/60)).padStart(2,'0')+':'+String(time%60).padStart(2,'0'));
   await ui('filter').fill(text);await ui('cues').selectOption({index:0});await ui(button).click();
  }
  assert(Math.abs(Number(await ui('rate').inputValue())-120)<1e-6);assert(Math.abs(Number(await ui('delay').inputValue())+19)<1e-6);
  await ui('textSettings').locator('summary').first().click();await ui('sizeNumber').fill('42');await ui('color').fill('#79bce9');await ui('saveSubtitle').click();await film.waitForFunction(()=>document.querySelector('#subtitle-overlay-root').shadowRoot.querySelector('#saveSubtitle').getAttribute('aria-pressed')==='true');
  const library=await popup.evaluate(()=>chrome.runtime.sendMessage({type:'LIBRARY_LIST'})),entry=library.entries[0];assert.equal(entry.settings.size,42);assert.equal(entry.settings.color,'#79bce9');assert.equal(entry.settings.anchors.length,3);
  await ui('delay').fill('0');const loaded=await popup.evaluate(({id,tabId})=>chrome.runtime.sendMessage({type:'LIBRARY_LOAD',id,tabId}),{id:entry.id,tabId});assert(loaded.ok);assert.equal(await ui('delay').inputValue(),'-19');
  pass('Imported player cues support one/three-sentence sync and save/reload fitted timing, text style, and anchors');
  await ui('tab-find').click();await ui('playerTracksSettings').locator('summary').click();await ui('restorePlayerTracks').click();assert.equal(await film.evaluate(()=>english.mode),'showing');assert.equal(await film.evaluate(()=>document.querySelector('#film').textTracks[0].mode),'disabled');
  await ui('usePlayerTrack').click();await film.evaluate(()=>english.mode='disabled');await ui('tab-find').click();await ui('restorePlayerTracks').click();assert.equal(await film.evaluate(()=>english.mode),'disabled');
  await film.evaluate(()=>{const track=document.querySelector('#film').addTextTrack('subtitles','Late language','fr');track.mode='hidden';track.addCue(new VTTCue(3,7,'Late line'));});await film.waitForFunction(()=>document.querySelector('#subtitle-overlay-root').shadowRoot.querySelector('#playerTrackCount').textContent==='3');
  pass('Restoration preserves later site choices; newly added tracks appear automatically');
  const before=await popup.evaluate(id=>chrome.tabs.sendMessage(id,{type:'GET_SUBTITLE_SNAPSHOT'}),tabId);
  await film.evaluate(()=>document.querySelector('#film').addTextTrack('subtitles','Unavailable','de').mode='disabled');
  await film.waitForFunction(()=>document.querySelector('#subtitle-overlay-root').shadowRoot.querySelector('#playerTrackCount').textContent==='4');
  await ui('playerTracks').selectOption({label:'Unavailable · de · not loaded'});await ui('importPlayerTrack').click();
  await film.waitForFunction(()=>document.querySelector('#subtitle-overlay-root').shadowRoot.querySelector('#message').textContent.includes('No readable lines yet'));
  assert.equal(await film.evaluate(()=>Array.from(document.querySelector('#film').textTracks).find(track=>track.label==='Unavailable').mode),'disabled');
  const after=await popup.evaluate(id=>chrome.tabs.sendMessage(id,{type:'GET_SUBTITLE_SNAPSHOT'}),tabId);assert.equal(after.text,before.text);assert.deepEqual(after.settings,before.settings);
  pass('An unavailable track restores its temporary mode and preserves the current subtitle and saved adjustments');
  let fileRequests=0,blockFile=false;
  await film.route('https://subtitle-fixture.test/*',async route=>{
   if(route.request().resourceType()!=='fetch'){await route.abort();return;}
   fileRequests++;const url=route.request().url();
   const body=url.endsWith('/bad.srt') ? '<html>Download page</html>' : url.endsWith('/style.ass') ? '[Script Info]\nScriptType: v4.00+\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\nDialogue: 0,0:00:01.00,0:00:05.00,Default,,0,0,0,,{\\b1}مرحبا\\NASS line' : '1\n00:01:40,000 --> 00:01:44,000\nمرحبا &amp; أهلا\n\n2\n00:01:50,000 --> 00:01:54,000\nالسطر الثاني\n\n3\n00:02:00,000 --> 00:02:04,000\nالسطر الثالث';
   if(blockFile)await new Promise(resolve=>setTimeout(resolve,700));
   await route.fulfill({status:200,headers:{'Content-Type':'text/plain; charset=utf-8','Access-Control-Allow-Origin':'*'},body});
  });
  await film.evaluate(()=>{const element=document.createElement('track');element.kind='subtitles';element.label='Lazy SRT';element.srclang='ar';element.src='https://subtitle-fixture.test/lazy.srt';document.querySelector('#film').append(element);globalThis.lazyElement=element;document.querySelector('[role=slider]').setAttribute('aria-valuenow','101');});
  await film.waitForFunction(()=>document.querySelector('#subtitle-overlay-root').shadowRoot.querySelector('#playerTrackCount').textContent==='5');assert.equal(fileRequests,0);
  await ui('playerTracks').selectOption({label:'Lazy SRT · ar · not loaded'});await ui('importPlayerTrack').click();await film.waitForFunction(()=>document.querySelector('#subtitle-overlay-root').shadowRoot.querySelector('#message').textContent.includes('3 loaded lines imported'));
  assert.equal(fileRequests,1);assert.equal(await film.evaluate(()=>lazyElement.track.cues?.length || 0),0);
  const lazySnapshot=await popup.evaluate(id=>chrome.tabs.sendMessage(id,{type:'GET_SUBTITLE_SNAPSHOT'}),tabId);assert.match(lazySnapshot.text,/00:01:40,000 --> 00:01:44,000/);assert.match(lazySnapshot.text,/مرحبا &amp; أهلا/);assert.equal(await ui('text').textContent(),'مرحبا & أهلا');
  await ui('tab-find').click();await ui('importPlayerTrack').click();await film.waitForFunction(()=>document.querySelector('#subtitle-overlay-root').shadowRoot.querySelector('#tab-controls').getAttribute('aria-selected')==='true');assert.equal(fileRequests,1);
  pass('Empty HTML SRT tracks fetch only the selected file on Import, cache parsed lines, preserve Arabic, and keep full-file film timestamps while the native clock is segmented');
  await ui('syncSettings').locator('summary').click();await ui('syncMode').selectOption('three');
  for(const [button,time,text] of [['markFirst',101,'مرحبا'],['syncSecond',113,'السطر الثاني'],['syncThird',125,'السطر الثالث']]){
   await film.evaluate(time=>document.querySelector('[role=slider]').setAttribute('aria-valuenow',String(time)),time);await film.waitForFunction(value=>document.querySelector('#subtitle-overlay-root').shadowRoot.querySelector('#time').textContent===value,'00:'+String(Math.floor(time/60)).padStart(2,'0')+':'+String(time%60).padStart(2,'0'));await ui('filter').fill(text);await ui('cues').selectOption({index:0});await ui(button).click();
  }
  assert.equal(Number(await ui('rate').inputValue()),120);await ui('saveSubtitle').click();await film.waitForFunction(()=>document.querySelector('#subtitle-overlay-root').shadowRoot.querySelector('#saveSubtitle').getAttribute('aria-pressed')==='true');
  const sourceSaved=await popup.evaluate(()=>chrome.runtime.sendMessage({type:'LIBRARY_LIST'}));assert.equal(sourceSaved.entries[0].settings.anchors.length,3);
  pass('Source-file imports support three-sentence sync and Save through the same overlay path');
  const stable=await popup.evaluate(id=>chrome.tabs.sendMessage(id,{type:'GET_SUBTITLE_SNAPSHOT'}),tabId);
  await film.evaluate(()=>lazyElement.src='https://subtitle-fixture.test/bad.srt');await ui('tab-find').click();await ui('importPlayerTrack').click();await film.waitForFunction(()=>document.querySelector('#subtitle-overlay-root').shadowRoot.querySelector('#message').textContent.includes('page instead of subtitles'));
  const failed=await popup.evaluate(id=>chrome.tabs.sendMessage(id,{type:'GET_SUBTITLE_SNAPSHOT'}),tabId);assert.equal(failed.text,stable.text);assert.deepEqual(failed.settings,stable.settings);assert.equal(await film.evaluate(()=>lazyElement.track.mode),'disabled');
  blockFile=true;await film.evaluate(()=>lazyElement.src='https://subtitle-fixture.test/change.srt');await ui('importPlayerTrack').click();await film.waitForFunction(()=>lazyElement.track.mode==='hidden');await film.evaluate(()=>lazyElement.src='https://subtitle-fixture.test/style.ass');await film.waitForFunction(()=>document.querySelector('#subtitle-overlay-root').shadowRoot.querySelector('#message').textContent.includes('track changed'));blockFile=false;
  assert.equal((await popup.evaluate(id=>chrome.tabs.sendMessage(id,{type:'GET_SUBTITLE_SNAPSHOT'}),tabId)).text,stable.text);
  await ui('importPlayerTrack').click();await film.waitForFunction(()=>document.querySelector('#subtitle-overlay-root').shadowRoot.querySelector('#message').textContent.includes('1 loaded lines imported'));assert.match((await popup.evaluate(id=>chrome.tabs.sendMessage(id,{type:'GET_SUBTITLE_SNAPSHOT'}),tabId)).text,/مرحبا\nASS line/);
  pass('Bad responses and changed sources preserve current subtitles/settings; changed URLs reload and ASS text imports correctly');
  await ui('tab-controls').click();await ui('advancedSettings').locator('summary').click();await ui('remove').click();assert(!await film.locator('#subtitle-overlay-root').count());assert.equal(await film.evaluate(()=>english.mode),'disabled');assert.deepEqual(errors,[]);
  pass('Removing the overlay restores owned caption modes and causes no page errors');
  await popup.locator('body').screenshot({path:path.resolve('.test-artifacts/player-tracks-popup.png')});
 }finally{await context.close();server.close();}
 fs.writeFileSync(path.resolve('.test-artifacts/player-tracks-verification.txt'),checks.map(text=>'PASS '+text).join('\n')+'\n');
})().catch(error=>{server.close();console.error(error);process.exitCode=1;});
