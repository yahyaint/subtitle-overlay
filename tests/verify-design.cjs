const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const project=path.resolve(__dirname,'..'),artifacts=path.join(project,'.test-artifacts'),root=path.join(artifacts,'design-extension');fs.mkdirSync(root,{recursive:true});
 for(const name of fs.readdirSync(path.join(project,'extension')))fs.copyFileSync(path.join(project,'extension',name),path.join(root,name));
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json')));manifest.host_permissions=['http://127.0.0.1/*'];fs.writeFileSync(path.join(root,'manifest.json'),JSON.stringify(manifest));
 const server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html'});res.end('<!doctype html><title>Harbor Lights</title><style>body{margin:0;background:#122c42}video{width:100vw;height:100vh}</style><video controls muted></video>');});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let context;
 try{
  context=await chromium.launchPersistentContext(path.join(artifacts,'design-profile-'+Date.now()),{channel:'chromium',headless:true,args:[`--disable-extensions-except=${root}`,`--load-extension=${root}`],viewport:{width:1360,height:900}});
  const worker=context.serviceWorkers()[0]||await context.waitForEvent('serviceworker'),id=new URL(worker.url()).hostname,video=await context.newPage(),errors=[];
  const migration=await worker.evaluate(async()=>{
   await chrome.storage.local.set({dubProviders:[{id:'retired'}],dubPreferences:{language:'ar'},apiKey:'subtitle-fixture-key','subtitleFile:migration':{text:'Keep subtitle'}});
   await chrome.storage.session.set({'dubToken:retired':'remove-fixture-token',token:'keep-subtitle-token'});
   await restrictStorage();const local=await chrome.storage.local.get(null),session=await chrome.storage.session.get(null);
   const result={removed:!('dubProviders' in local)&&!('dubPreferences' in local)&&!('dubToken:retired' in session),kept:local.apiKey==='subtitle-fixture-key' && local['subtitleFile:migration'].text==='Keep subtitle' && session.token==='keep-subtitle-token',identity:normalizeFilmTitle('Amélie'),fraction:normalizeFilmTitle('Film ½')};
   await chrome.storage.local.remove(['apiKey','subtitleFile:migration']);await chrome.storage.session.remove('token');return result;
  });assert.deepEqual(migration,{removed:true,kept:true,identity:'amelie',fraction:'film 1 2'});
  video.on('pageerror',error=>errors.push(error.message));await video.goto('http://127.0.0.1:'+server.address().port);
  const popup=await context.newPage();popup.on('pageerror',error=>errors.push(error.message));await popup.goto(`chrome-extension://${id}/popup.html`);
  const tabId=await popup.evaluate(async url=>(await chrome.tabs.query({})).find(tab=>tab.url===url).id,video.url());
  await popup.evaluate(tabId=>chrome.scripting.executeScript({target:{tabId},files:['subtitles.js','subtitle-settings.js','film-detection.js','player-subtitles.js','content.js']}),tabId);
  const ui=name=>video.locator('#subtitle-overlay-root #'+name);
  await popup.evaluate(()=>document.fonts.ready);assert(await popup.evaluate(()=>[...document.fonts].some(f=>f.family==='SubtitleOverlayInter' && f.status==='loaded')));
  await video.waitForFunction(()=>[...document.fonts].some(f=>f.family==='SubtitleOverlayInter' && f.status==='loaded'));assert.match(await ui('panel').evaluate(e=>getComputedStyle(e).fontFamily),/SubtitleOverlayInter/);

  await popup.locator('#tab-find').focus();await popup.keyboard.press('ArrowDown');assert.equal(await popup.locator('#tab-saved').getAttribute('aria-selected'),'true');await popup.keyboard.press('ArrowDown');assert.equal(await popup.locator('#tab-settings').getAttribute('aria-selected'),'true');await popup.keyboard.press('Home');assert.equal(await popup.locator('#tab-find').getAttribute('aria-selected'),'true');
  for(const width of [392,320]){
   await popup.setViewportSize({width,height:600});assert(await popup.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   for(const name of ['find','saved','settings']){await popup.locator('#tab-'+name).click();assert(await popup.locator('#attach').isVisible());assert(await popup.locator('#file').isVisible());const dock=await popup.locator('.action-dock').boundingBox();assert(dock.y+dock.height<=600);}
  }
  await popup.locator('#tab-find').click();await popup.setViewportSize({width:392,height:600});await popup.locator('body').screenshot({path:path.join(artifacts,'new-design-popup.png')});
  await ui('tab-controls').click();await ui('tab-controls').focus();await video.keyboard.press('ArrowDown');assert.equal(await ui('tab-find').getAttribute('aria-selected'),'true');await video.keyboard.press('ArrowDown');assert.equal(await ui('tab-saved').getAttribute('aria-selected'),'true');await video.keyboard.press('Home');assert.equal(await ui('tab-controls').getAttribute('aria-selected'),'true');
  await ui('syncSettings').locator('summary').click();await ui('syncMode').selectOption('three');assert(await ui('markFirst').isVisible());assert(await ui('syncThird').isVisible());
  await ui('textSettings').locator(':scope > summary').click();await ui('shadowSettings').locator('summary').click();assert(await ui('shadowBlur').isVisible());await ui('positionSettings').locator('summary').click();assert(await ui('avoidControls').isVisible());assert(await ui('restorePlayerStyle').isVisible());
  await ui('textSettings').locator(':scope > summary').click();await video.screenshot({path:path.join(artifacts,'new-design-controller.png')});
  await video.setViewportSize({width:390,height:600});await ui('textSettings').locator(':scope > summary').click();await ui('shadowBlur').scrollIntoViewIfNeeded();
  const panel=await ui('panel').boundingBox();assert(panel.x>=0 && panel.x+panel.width<=390 && panel.y+panel.height<=600);assert(await ui('panel').evaluate(e=>e.scrollHeight===e.clientHeight));assert(await ui('panel').evaluate(e=>e.scrollWidth===e.clientWidth));
  await ui('tab-find').click();assert.equal(await ui('view-find').evaluate(e=>e.parentElement.scrollTop),0);await ui('overlaySearchButton').scrollIntoViewIfNeeded();assert(await ui('overlaySearchButton').isVisible());await ui('playerTracksSettings').locator('summary').click();await ui('refreshPlayerTracks').click();
  await video.screenshot({path:path.join(artifacts,'new-design-controller-compact.png')});await ui('tab-controls').click();await ui('advancedSettings').locator('summary').click();await ui('file').scrollIntoViewIfNeeded();assert(await ui('file').isVisible());await ui('close').click();assert.equal(await ui('panel').isVisible(),false);await ui('toggle').click();assert(await ui('panel').isVisible());
  await popup.locator('#query').focus();assert.equal(await popup.locator('#query').evaluate(e=>getComputedStyle(e).outlineStyle),'solid');
  const contrast=await popup.locator('#searchButton').evaluate(e=>{
   const c=getComputedStyle(e),lum=value=>{const rgb=value.match(/[\d.]+/g).slice(0,3).map(n=>Number(n)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;};const values=[lum(c.color),lum(c.backgroundColor)].sort((a,b)=>a-b);return (values[1]+.05)/(values[0]+.05);
  });assert(contrast>=4.5,'Primary action text contrast');
  assert.equal(await popup.locator('#dubLibrary').count(),0);const retired=await popup.evaluate(()=>chrome.runtime.sendMessage({type:'DUB_SETTINGS'}));assert.equal(retired.ok,false);assert.match(retired.error,/Unknown request/);await ui('tab-controls').click();if(!await ui('advancedSettings').evaluate(e=>e.open))await ui('advancedSettings').locator('summary').click();await ui('remove').click();assert.equal(await video.evaluate(()=>[...document.fonts].some(f=>f.family==='SubtitleOverlayInter')),false);
  assert.deepEqual(errors,[]);console.log('PASS New Design: vertical keyboard tabs, fixed file dock, 320px popup, compact controller, sync/style/import/file paths, visible focus, and no script errors.');
 }finally{if(context)await context.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
