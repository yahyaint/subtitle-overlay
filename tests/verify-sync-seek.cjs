// Run from the repository root. Profiles and reports stay in ignored test storage.
require('node:fs').mkdirSync('.test-artifacts',{recursive:true});
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../extension'),testRoot=path.resolve(__dirname,'../.test-artifacts/sync-test-extension');
fs.mkdirSync(testRoot,{recursive:true});for(const file of fs.readdirSync(root))fs.copyFileSync(path.join(root,file),path.join(testRoot,file));
const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json')));manifest.host_permissions=['http://127.0.0.1/*'];fs.writeFileSync(path.join(testRoot,'manifest.json'),JSON.stringify(manifest));
const checks=[],pass=name=>{checks.push(name);console.log('PASS',name);};
const fixture='<!doctype html><title>Old Page Film | Disney+</title><style>video{width:900px;height:500px}</style><video controls></video>';
const server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html'});res.end(fixture);});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const context=await chromium.launchPersistentContext(path.resolve(__dirname,'../.test-artifacts/sync-test-profile-'+Date.now()),{channel:'chromium',headless:true,args:[`--disable-extensions-except=${testRoot}`,`--load-extension=${testRoot}`],viewport:{width:1360,height:900}});
 try{
  const worker=context.serviceWorkers()[0]||await context.waitForEvent('serviceworker'),extensionId=new URL(worker.url()).hostname;
  const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.evaluate(()=>{navigator.mediaSession.metadata=new MediaMetadata({title:'Current Film (2024)'});const v=document.querySelector('video');for(const [key,value] of Object.entries({currentTime:10,paused:true,seeking:false}))Object.defineProperty(v,key,{value,writable:true,configurable:true});});
  const popup=await context.newPage();await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  const tabId=await popup.evaluate(async url=>(await chrome.tabs.query({})).find(tab=>tab.url===url).id,page.url());
  await context.grantPermissions(['clipboard-read','clipboard-write'],{origin:new URL(page.url()).origin});
  // Ordinary video clocks agree in both worlds. Separate-world disagreements
  // are covered by verify-clock-bridge.cjs rather than accidental fixture drift.
  const setPlayer=values=>popup.evaluate(async({id,values})=>{
   const func=values=>{const video=document.querySelector('video');for(const [key,value] of Object.entries(values))if(key!=='seeked')Object.defineProperty(video,key,{value,writable:true,configurable:true});if(values.seeked)video.dispatchEvent(new Event('seeked'));};
   for(const world of ['MAIN','ISOLATED'])await chrome.scripting.executeScript({target:{tabId:id},world,func,args:[values]});
  },{id:tabId,values});
  await setPlayer({currentTime:10,paused:true,seeking:false});
  await popup.evaluate(id=>chrome.scripting.executeScript({target:{tabId:id},files:['subtitles.js','subtitle-settings.js','film-detection.js','player-subtitles.js','saved-library.js','content.js']}),tabId);
  const ui=id=>page.locator('#subtitle-overlay-root #'+id);await ui('tab-controls').click();await ui('advancedSettings').locator('summary').click();
  const srt=Array.from({length:20000},(_,i)=>`${i+1}\n${clock(i*2)} --> ${clock(i*2+1)}\nLine ${i}`).join('\n\n');
  await ui('file').setInputFiles({name:'large.srt',mimeType:'text/plain',buffer:Buffer.from(srt)});await ui('syncSettings').locator('summary').click();
  await ui('delay').fill('2');
  // Player metadata can disappear while its seek controls replace/update the player.
  await page.evaluate(()=>navigator.mediaSession.metadata=null);await setPlayer({seeking:true,currentTime:100});
  await page.waitForTimeout(2700);
  assert.equal(await ui('filename').textContent(),'large.srt','Transient metadata during seek must not clear loaded subtitles');assert.equal(await ui('delay').inputValue(),'2');
  await page.evaluate(()=>navigator.mediaSession.metadata=new MediaMetadata({title:'Current Film (2024)'}));await setPlayer({seeking:false,seeked:true});
  await page.waitForTimeout(1500);assert.equal(await ui('filename').textContent(),'large.srt');
  pass('20,000-cue track and timing survive seek-time player metadata loss/restoration');
  // A lower-priority stale page title must not discard a loaded track after seeking either.
  await page.evaluate(()=>navigator.mediaSession.metadata=null);await page.waitForTimeout(2700);assert.equal(await ui('filename').textContent(),'large.srt');
  await page.evaluate(()=>navigator.mediaSession.metadata=new MediaMetadata({title:'Current Film (2024)'}));await page.waitForTimeout(1500);
  pass('Stale page fallback after a seek preserves active player film and timing');
  await ui('reset').click();await ui('syncMode').selectOption('three');
  for(const [id,time,index] of [['markFirst',13,5],['syncSecond',123,55],['syncThird',233,105]]){
   await setPlayer({currentTime:time,seeked:true});
   await page.waitForTimeout(160);
   assert.equal(await ui('time').textContent(),clock(time).slice(0,-4));
   await page.waitForTimeout(160);await ui('filter').fill('Line '+index);await ui('cues').selectOption(String(index));await ui(id).click();
  }
  assert(Math.abs(Number(await ui('rate').inputValue())-110)<.0001);assert.equal(await ui('delay').inputValue(),'2');assert.match(await ui('anchorStatus').textContent(),/3:/);
  await ui('saveSubtitle').click();await page.waitForFunction(()=>document.querySelector('#subtitle-overlay-root').shadowRoot.querySelector('#saveSubtitle').getAttribute('aria-pressed')==='true');
  const library=await popup.evaluate(()=>chrome.runtime.sendMessage({type:'LIBRARY_LIST'})),entry=library.entries[0];assert.equal(entry.settings.syncMode,'three');assert.equal(entry.settings.anchors.length,3);
  await ui('reset').click();assert.equal((await popup.evaluate(({id,tabId})=>chrome.runtime.sendMessage({type:'LIBRARY_LOAD',id,tabId}),{id:entry.id,tabId})).ok,true);assert.equal(await ui('syncMode').inputValue(),'three');assert.equal(await ui('delay').inputValue(),'2');assert.match(await ui('anchorStatus').textContent(),/3:/);
  pass('Three UI points solve delay/drift; Save and offline reload preserve all three points');
  await setPlayer({currentTime:NaN,seeking:true});await page.waitForTimeout(300);assert.equal(await ui('markFirst').isDisabled(),true);assert.equal(await ui('syncThird').isDisabled(),true);
  await setPlayer({currentTime:112,seeking:false,seeked:true});
  await page.waitForFunction(()=>document.querySelector('#subtitle-overlay-root').shadowRoot.querySelector('#cues').value==='50');assert.equal(await ui('markFirst').isDisabled(),false);
  // Scrubbing repeatedly must preserve fitted settings and settle on the final current sentence.
  await popup.evaluate(id=>chrome.scripting.executeScript({target:{tabId:id},func:async()=>{const v=document.querySelector('video');v.seeking=true;for(let i=0;i<100;i++){v.currentTime=i%2?25000-i*13:100+i*31;await new Promise(resolve=>setTimeout(resolve,12));}v.currentTime=222;v.seeking=false;v.dispatchEvent(new Event('seeked'));}}),tabId);
  await setPlayer({currentTime:222,seeking:false,seeked:true});
  await page.waitForFunction(()=>document.querySelector('#subtitle-overlay-root').shadowRoot.querySelector('#cues').value==='100');assert.equal(await ui('delay').inputValue(),'2');assert(Math.abs(Number(await ui('rate').inputValue())-110)<.0001);
  assert.deepEqual(errors,[]);pass('Invalid/transient clocks disable sync safely; rapid backward/forward scrubs recover current sentence with timing intact and no JS errors');
  await ui('reset').click();
  await page.evaluate(()=>{const video=document.querySelector('video');video.id='real';video.style.position='relative';const stale=video.cloneNode();stale.id='stale';stale.style.cssText='position:absolute;left:8px;top:8px;width:900px;height:500px';document.body.prepend(stale);});
  await popup.evaluate(id=>chrome.scripting.executeScript({target:{tabId:id},func:()=>{const stale=document.querySelector('#stale');for(const [key,value] of Object.entries({currentTime:20,paused:false,seeking:false}))Object.defineProperty(stale,key,{value,writable:true,configurable:true});}}),tabId);
  await page.waitForTimeout(1500);assert.equal(await ui('time').textContent(),'00:03:42');
  pass('Equal-size stale playing video behind the paused film cannot steal its clock');
  await page.evaluate(()=>{document.querySelector('#stale').remove();const timeline=document.createElement('div');timeline.id='timeline';timeline.setAttribute('role','slider');timeline.setAttribute('aria-label','Playback progress');timeline.setAttribute('aria-valuemin','0');timeline.setAttribute('aria-valuemax','6690');timeline.setAttribute('aria-valuenow','3300');timeline.setAttribute('aria-valuetext','00:55:00 of 01:51:30');document.body.append(timeline);});
  await setPlayer({currentTime:20,seeking:false,seeked:true});
  await page.waitForFunction(()=>document.querySelector('#subtitle-overlay-root').shadowRoot.querySelector('#time').textContent==='00:55:00');
  await page.waitForFunction(()=>document.querySelector('#subtitle-overlay-root').shadowRoot.querySelector('#cues').value==='1650');
  assert.equal(await ui('text').textContent(),'Line 1650');await ui('markFirst').click();assert.match(await ui('anchorStatus').textContent(),/00:55:00/);assert.equal(await ui('delay').inputValue(),'0');
  await setPlayer({currentTime:25,paused:false});await page.waitForFunction(()=>document.querySelector('#subtitle-overlay-root').shadowRoot.querySelector('#time').textContent==='00:55:05');
  await setPlayer({currentTime:25.4,paused:true});await page.waitForTimeout(150);assert.equal(await ui('time').textContent(),'00:55:05');
  // The media segment clock can restart near 20 after each seek; film time comes
  // from its labelled public timeline, never the remaining-duration display.
  for(const time of [4000,1000,3500]){
   await page.evaluate(time=>{const slider=document.querySelector('#timeline');slider.setAttribute('aria-valuenow',String(time));slider.removeAttribute('aria-valuetext');},time);
   await setPlayer({currentTime:20,seeked:true});await page.waitForFunction(expected=>document.querySelector('#subtitle-overlay-root').shadowRoot.querySelector('#time').textContent===expected,clock(time).slice(0,-4));
   await page.waitForFunction(expected=>document.querySelector('#subtitle-overlay-root').shadowRoot.querySelector('#cues').value===expected,String(time/2));
  }
  await page.evaluate(()=>document.querySelector('#timeline').setAttribute('aria-label','Volume'));await setPlayer({currentTime:25,seeked:true});await page.waitForFunction(()=>document.querySelector('#subtitle-overlay-root').shadowRoot.querySelector('#time').textContent==='00:00:25');
  await page.evaluate(()=>{const slider=document.querySelector('#timeline');slider.setAttribute('aria-label','Playback progress');slider.setAttribute('aria-valuemax','100');slider.setAttribute('aria-valuenow','75');slider.setAttribute('aria-valuetext','01:01:44 remaining');});await setPlayer({seeked:true});await page.waitForTimeout(300);assert.equal(await ui('time').textContent(),'00:00:25');
  pass('Film clock, captions, picker and sync use public timeline when segment time resets to 20; volume/percent-only/remaining-time controls never become film time');
  const filmClock=async time=>{await page.evaluate(time=>{const slider=document.querySelector('#timeline');slider.setAttribute('aria-label','Playback progress');slider.setAttribute('aria-valuemax','6690');slider.setAttribute('aria-valuenow',String(time));slider.removeAttribute('aria-valuetext');},time);await setPlayer({currentTime:20,paused:true,seeked:true});await page.waitForFunction(expected=>document.querySelector('#subtitle-overlay-root').shadowRoot.querySelector('#time').textContent===expected,clock(time).slice(0,-4));};
  await ui('reset').click();await ui('syncMode').selectOption('one');await filmClock(3310);await ui('filter').fill('Line 1500');await ui('cues').selectOption('1500');await ui('sync').click();assert.equal(await ui('delay').inputValue(),'310');
  await ui('reset').click();await ui('syncMode').selectOption('two');
  for(const [id,time,index] of [['markFirst',3310,1500],['syncSecond',4410,2000]]){await filmClock(time);await ui('filter').fill('Line '+index);await ui('cues').selectOption(String(index));await ui(id).click();}
  assert(Math.abs(Number(await ui('rate').inputValue())-110)<1e-6,JSON.stringify({rate:await ui('rate').inputValue(),delay:await ui('delay').inputValue(),points:await ui('anchorStatus').textContent(),message:await ui('message').textContent()}));assert.equal(await ui('delay').inputValue(),'10');
  await ui('syncMode').selectOption('three');await filmClock(5510);await ui('filter').fill('Line 2500');await ui('cues').selectOption('2500');await ui('syncThird').click();assert(Math.abs(Number(await ui('rate').inputValue())-110)<1e-6);assert.equal(await ui('delay').inputValue(),'10');
  await ui('saveSubtitle').click();await page.waitForFunction(()=>document.querySelector('#subtitle-overlay-root').shadowRoot.querySelector('#saveSubtitle').getAttribute('aria-pressed')==='true');
  const logicalEntry=(await popup.evaluate(()=>chrome.runtime.sendMessage({type:'LIBRARY_LIST'}))).entries.find(item=>item.id===entry.id);assert.deepEqual(logicalEntry.settings.anchors.map(point=>point.videoTime),[3310,4410,5510]);
  await ui('reset').click();await popup.evaluate(({id,tabId})=>chrome.runtime.sendMessage({type:'LIBRARY_LOAD',id,tabId}),{id:entry.id,tabId});assert.equal(await ui('delay').inputValue(),'10');assert.equal(await ui('syncMode').inputValue(),'three');
  pass('One/two/three-sentence sync captures film times 3310/4410/5510 instead of segment time 20; fitted delay/scale and all anchors survive Save and offline reload');
  await ui('advancedSettings').locator('summary').click();await ui('copyPlayerInfo').click();await page.waitForTimeout(100);
  const info=await page.evaluate(async()=>{const field=document.querySelector('#subtitle-overlay-root').shadowRoot.querySelector('#playerInfoText');return field ? field.value : await navigator.clipboard.readText();});assert.equal(JSON.parse(info).selectedVideo,0);assert(!info.includes('http'));pass('Copy player info captures clocks and control values without media URLs or account data');
  await page.evaluate(()=>navigator.mediaSession.metadata=new MediaMetadata({title:'New Film (2025)'}));await page.waitForFunction(()=>document.querySelector('#subtitle-overlay-root').shadowRoot.querySelector('#filename').textContent==='No subtitle file');assert.equal(await ui('view-find').isVisible(),true);pass('Stable new player film still clears old track and opens Find');
  fs.writeFileSync(path.resolve(__dirname,'../.test-artifacts/sync-seek-verification.txt'),checks.map(name=>'PASS '+name).join('\n')+'\nIsolated Chromium extension fixture; 20,000 cues, simulated player metadata/clock changes. Actual media pause/seek/playback covered by verification.txt. Live Disney+ seek UI remains unverified.\n');
 }finally{await context.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
function clock(seconds){return [Math.floor(seconds/3600),Math.floor(seconds/60)%60,seconds%60].map(n=>String(n).padStart(2,'0')).join(':')+',000';}
