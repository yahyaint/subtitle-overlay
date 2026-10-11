const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const library=require('../extension/saved-library.js');
const srt='1\n00:00:00,000 --> 00:00:10,000\nSaved library fixture';
const fixtureEntries=[
 {id:'film',filmKey:'film:2020',title:'Harbor Lights',year:'2020',name:'film.srt',language:'en'},
 {id:'ep4',filmKey:'show:1:4:2024',title:"X-Men '97 S01E04",year:'2024',showTitle:"X-Men '97",season:1,episode:4,name:'ep4.srt',language:'en'},
 {id:'ep4ar',filmKey:'show:1:4:2025',title:"X-Men '97 S01E04 - Motendo",year:'2025',name:'ep4-ar.srt',language:'ar'},
 {id:'ep5',filmKey:'show:1:5:2024',title:"X-Men '97 S01E05 - Remember It",year:'2024',name:'ep5.srt',language:'en'},
 {id:'season2',filmKey:'show:2:1',title:"X-Men '97 S02E01",year:'2025',name:'s2e1.srt'},
 {id:'special',filmKey:'show:0:1',title:"X-Men '97 S00E01 - Special",year:'2024',name:'special.srt'},
 {id:'bear',filmKey:'bear:3:4',title:'The Bear S03E04 - Violet',year:'2024',name:'bear.srt'}
];
const groups=library.group(fixtureEntries);assert.equal(groups.films.size,1);assert.equal(groups.shows.size,2);
const xmen=groups.shows.get('x men 97');assert.equal(xmen.seasons.size,3);assert.equal(xmen.seasons.get(1).get(4).entries.length,2);assert.equal(xmen.seasons.get(1).get(4).title,'Motendo');
assert.equal(library.episodeInfo({title:'Film S01E00'}),null);assert.equal(library.episodeInfo({title:'A normal film'}),null);
(async()=>{
 const artifacts=path.resolve('.test-artifacts'),root=path.join(artifacts,'saved-library-extension');fs.mkdirSync(root,{recursive:true});
 for(const name of fs.readdirSync('extension'))fs.copyFileSync(path.join('extension',name),path.join(root,name));
 const popupSource=fs.readFileSync(path.join(root,'popup.js'),'utf8'),initAt=popupSource.lastIndexOf('(async () => {');
 // Start the unchanged popup initializer after the film tab becomes active.
 fs.writeFileSync(path.join(root,'popup.js'),popupSource.slice(0,initAt)+'globalThis.initializeFixturePopup=()=>'+popupSource.slice(initAt));
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json')));manifest.host_permissions=['http://127.0.0.1/*'];fs.writeFileSync(path.join(root,'manifest.json'),JSON.stringify(manifest));
 const context=await chromium.launchPersistentContext(path.join(artifacts,'saved-library-profile-'+Date.now()),{channel:'chromium',headless:true,args:[`--disable-extensions-except=${root}`,`--load-extension=${root}`],viewport:{width:1280,height:850}});
 context.setDefaultTimeout(15000);
 try{
  await context.route('http://127.0.0.1/**',route=>route.fulfill({contentType:'text/html',body:'<title>X-Men 97</title><video style="width:960px;height:540px"></video>'}));
  const worker=context.serviceWorkers()[0]||await context.waitForEvent('serviceworker'),id=new URL(worker.url()).hostname,film=await context.newPage(),errors=[];
  film.on('pageerror',e=>errors.push(e.message));await film.goto('http://127.0.0.1/episode');
  await film.evaluate(()=>{navigator.mediaSession.metadata=new MediaMetadata({title:"X-Men '97 S01E04"});});
  await worker.evaluate(({entries,srt})=>chrome.storage.local.set({subtitleLibrary:entries,...Object.fromEntries(entries.map(e=>['subtitleFile:'+e.id,{text:srt}]))}),{entries:fixtureEntries,srt});
  const popup=await context.newPage();popup.on('pageerror',e=>errors.push(e.message));await popup.goto('chrome-extension://'+id+'/popup.html');
  const tabId=await popup.evaluate(async url=>(await chrome.tabs.query({})).find(tab=>tab.url===url).id,film.url());
  await film.bringToFront();await popup.evaluate(()=>globalThis.initializeFixturePopup());
  const ui=name=>film.locator('#subtitle-overlay-root #'+name);
  await popup.waitForFunction(()=>document.querySelector('#savedEpisode').value==='4');
  await film.waitForFunction(()=>document.querySelector('#subtitle-overlay-root')?.shadowRoot.querySelector('#overlaySavedEpisode').value==='4');
  await popup.locator('#tab-saved').click();await ui('toggle').click();await ui('tab-saved').click();
  for(const [page,prefix] of [[popup,'saved'],[film,'overlaySaved']]){
   const loc=suffix=>page.locator((page===film ? '#subtitle-overlay-root ' : '')+'#'+prefix+suffix);
   assert.equal(await loc('Shows').getAttribute('aria-pressed'),'true');assert.equal(await loc('FilmField').isHidden(),true);
   assert.equal(await loc('Show option:checked').textContent(),"X-Men '97");assert.equal(await loc('Season').inputValue(),'1');assert.equal(await loc('Episode option:checked').textContent(),'Episode 4 — Motendo');
   assert.deepEqual(await loc('Season option').allTextContents(),['Specials','Season 1','Season 2']);
   assert.deepEqual(await loc('Episode option').allTextContents(),['Episode 4 — Motendo','Episode 5 — Remember It']);
   assert.equal(await page.locator(page===film ? '#subtitle-overlay-root .saved-name' : '.saved-name').count(),2);
   await loc('Episode').selectOption('5');assert.equal(await page.locator(page===film ? '#subtitle-overlay-root .saved-name' : '.saved-name').count(),1);
   assert.match(await page.locator(page===film ? '#subtitle-overlay-root .saved-name' : '.saved-name').textContent(),/ep5/);
   await loc('Season').selectOption('2');assert.equal(await loc('Episode').inputValue(),'1');
   await loc('Season').selectOption('0');assert.equal(await loc('Episode option:checked').textContent(),'Episode 1 — Special');
   await loc('Films').click();assert.equal(await loc('ShowFields').isHidden(),true);assert.deepEqual(await loc('Film option').allTextContents(),['Harbor Lights (2020)']);
   await loc('Shows').click();await loc('Show').selectOption({label:'The Bear'});assert.equal(await loc('Season').inputValue(),'3');assert.equal(await loc('Episode option:checked').textContent(),'Episode 4 — Violet');
  }
  await ui('refreshSaved').click();assert.equal(await ui('overlaySavedShow option:checked').textContent(),'The Bear');
  await film.screenshot({path:path.join(artifacts,'saved-shows-controller.png')});await popup.locator('body').screenshot({path:path.join(artifacts,'saved-shows-popup.png')});
  await film.locator('#subtitle-overlay-root .saved-name').click();await ui('view-controls').waitFor();assert.equal(await ui('filename').textContent(),'bear.srt');
  await ui('delay').fill('7');await ui('saveSubtitle').click();
  await film.waitForFunction(()=>document.querySelector('#subtitle-overlay-root').shadowRoot.querySelector('#saveSubtitle').getAttribute('aria-pressed')==='true');
  const saved=await worker.evaluate(async()=> (await chrome.storage.local.get('subtitleLibrary')).subtitleLibrary.find(e=>e.id==='bear'));assert.equal(saved.settings.delay,7);
  await ui('tab-saved').click();await film.locator('#subtitle-overlay-root .saved-track .rating').last().click();
  await film.waitForFunction(()=>document.querySelector('#subtitle-overlay-root').shadowRoot.querySelector('#overlaySavedShow').options.length===1);
  assert.equal(await ui('overlaySavedShow option:checked').textContent(),"X-Men '97");
  assert.equal((await worker.evaluate(async()=> (await chrome.storage.local.get('subtitleLibrary')).subtitleLibrary)).some(e=>e.id==='ep4'),true);
  const before=await worker.evaluate(async()=> (await chrome.storage.local.get('subtitleLibrary')).subtitleLibrary);
  await worker.evaluate(async()=>{const {subtitleLibrary}=await chrome.storage.local.get('subtitleLibrary');await chrome.storage.local.set({subtitleLibrary:subtitleLibrary.filter(e=>!e.title.startsWith('X-Men'))});});
  await popup.waitForFunction(()=>document.querySelector('#savedShow').options.length===0);await popup.locator('#savedShows').click();assert.match(await popup.locator('#libraryHint').textContent(),/No saved shows/);assert.equal(await popup.locator('#savedShow').isDisabled(),true);await popup.locator('#savedFilms').click();assert.equal(await popup.locator('.saved-name').count(),1);
  assert(before.some(e=>e.id==='film'));assert.deepEqual(errors,[]);
  console.log('PASS Saved films/shows in popup and controller: automatic episode selection, legacy titles, names, numeric season/episode order, specials, combined language/release variants, refresh, load/save/delete, and empty categories.');
 }finally{await context.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
