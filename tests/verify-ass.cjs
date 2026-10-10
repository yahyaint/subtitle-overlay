// Run from the repository root. Profiles and reports stay in ignored test storage.
require('node:fs').mkdirSync('.test-artifacts',{recursive:true});
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),{zipFiles}=require('../scripts/zip-tools.cjs'),zlib=require('node:zlib');
const root=path.resolve('extension'),core=require(path.join(root,'subtitles.js'));
const ass=String.raw`[Script Info]
ScriptType: v4.00+
WrapStyle: 0
[V4+ Styles]
Format: Name, Fontname, Fontsize
Style: Default,Arial,40
[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Comment: 0,0:00:00.00,0:00:05.00,Default,,0,0,0,,Do not show this
Dialogue: 0,0:00:01.23,0:00:03.45,Default,,0,0,0,,{\i1}Hello, world!\Nمرحبا{\i0}
Dialogue: 1,0:00:02.00,0:00:05.00,Default,,0,0,0,,{\p1}m 0 0 l 20 20{\p0}Visible text
Dialogue: 0,0:00:06.00,0:00:07.00,Default,,0,0,0,,{\p1}m 0 0 l 30 40
Dialogue: 0,0:99:00.00,0:99:05.00,Default,,0,0,0,,Bad time
Dialogue: 0,0:00:04.00,0:00:03.00,Default,,0,0,0,,Reversed
Dialogue: 0,0:00:05.00,0:00:06.00,Default,,0,0,0,,After{an inline comment}\N\Nparagraph\nsoft\hspace
[Fonts]
Dialogue: 0,0:00:00.00,0:00:10.00,Default,,0,0,0,,Ignore attachment section
`;
const ssa=String.raw`[Script Info]
ScriptType: v4.00
[V4 Styles]
[Events]
Format: Marked, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: Marked=0,0:00:00.10,0:00:01.20,Default,,0,0,0,,SSA line, with comma
`;
const checks=[],pass=value=>{checks.push(value);console.log('PASS',value);};
const result=core.prepare(ass),cues=core.parse(result.text);assert.equal(result.format,'ASS');assert.equal(cues.length,3);
assert.deepEqual(cues[0],{start:1.23,end:3.45,text:'Hello, world!\nمرحبا'});assert.equal(cues[1].text,'Visible text');assert.equal(cues[2].text,'After\nparagraph soft\u00a0space');
assert.equal(core.active(cues,core.createIndex(cues),2.1),'Hello, world!\nمرحبا\nVisible text');
assert.equal(core.prepare(ssa).format,'SSA');assert.equal(core.parse(core.prepare(ssa).text)[0].text,'SSA line, with comma');
assert.equal(core.parse(core.prepare('[Events]\nFormat: End, Start, Layer, Text\nDialogue: 0:00:02.00,0:00:01.00,0,Comma, stays').text)[0].start,1);
assert.equal(core.parse(core.prepare(String.raw`[Script Info]
WrapStyle: 2
[Events]
Dialogue: 0,0:00:01.00,0:00:02.00,Default,,0,0,0,,a\nb{\q0}c\nd`).text)[0].text,'a\nbc d');
assert.throws(()=>core.prepare('[Events]\nFormat: Text, Start, End\nDialogue: a,0:00:01.00,0:00:02.00'),/unsupported event format/);
assert.throws(()=>core.prepare(String.raw`[Events]
Dialogue: 0,0:00:01.00,0:00:02.00,Default,,0,0,0,,{\p1}m 0 0 l 10 10`),/Drawing-only/);
pass('ASS/SSA timing, Arabic, commas, overlaps, hard/soft breaks and comments; drawings/attachments/invalid times are excluded; unsupported event formats reject safely');
const testRoot=path.resolve('.test-artifacts/ass-test-extension');fs.mkdirSync(testRoot,{recursive:true});for(const name of fs.readdirSync(root))fs.copyFileSync(path.join(root,name),path.join(testRoot,name));
const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json')));manifest.host_permissions=['http://127.0.0.1/*','https://*.opensubtitles.org/*','https://*.opensubtitles.com/*'];fs.writeFileSync(path.join(testRoot,'manifest.json'),JSON.stringify(manifest));
(async()=>{
  const browser=await chromium.launchPersistentContext(path.resolve('.test-artifacts/ass-test-profile-'+Date.now()),{channel:'chromium',headless:true,args:[`--disable-extensions-except=${testRoot}`,`--load-extension=${testRoot}`],viewport:{width:1100,height:850}});
  try{
    await browser.route('http://127.0.0.1/**',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>ASS Test Film</title><video style="width:960px;height:540px"></video>'}));
    await browser.route('https://www.opensubtitles.org/**',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>ASS download fixture</title><a id="ass" href="https://dl.opensubtitles.org/captions.ass">Download ASS</a><a id="zip" href="https://dl.opensubtitles.org/captions.zip">Download ZIP</a>'}));
    const worker=browser.serviceWorkers()[0] || await browser.waitForEvent('serviceworker'),id=new URL(worker.url()).hostname;
    const popup=await browser.newPage();await popup.goto('chrome-extension://'+id+'/popup.html');
    const film=await browser.newPage();await film.goto('http://127.0.0.1/ass');
    const tabId=await popup.evaluate(async url=>(await chrome.tabs.query({})).find(tab=>tab.url===url).id,film.url());
    await popup.evaluate(id=>chrome.scripting.executeScript({target:{tabId:id},files:['subtitles.js','subtitle-settings.js','film-detection.js','player-subtitles.js','content.js']}),tabId);
    await film.waitForFunction(()=>!document.querySelector('#subtitle-overlay-root').shadowRoot.querySelector('#view-find').hidden);
    await film.locator('#subtitle-overlay-root #tab-controls').click();await film.locator('#subtitle-overlay-root #advancedSettings summary').click();
    assert.match(await popup.locator('#file').getAttribute('accept'),/\.ass,\.ssa/);
    await film.locator('#subtitle-overlay-root #file').setInputFiles({name:'arabic.ass',mimeType:'text/x-ass',buffer:Buffer.from(ass)});
    await film.waitForFunction(()=>document.querySelector('#subtitle-overlay-root').shadowRoot.querySelector('#filename').textContent==='arabic.srt');
    assert.match(await film.locator('#subtitle-overlay-root #message').textContent(),/File styles and effects are not used/);
    await film.locator('#subtitle-overlay-root #delay').fill('2');await film.locator('#subtitle-overlay-root #saveSubtitle').click();
    await film.waitForFunction(()=>document.querySelector('#subtitle-overlay-root').shadowRoot.querySelector('#saveSubtitle').getAttribute('aria-pressed')==='true');
    const library=await popup.evaluate(()=>chrome.runtime.sendMessage({type:'LIBRARY_LIST'}));assert.equal(library.entries[0].settings.delay,2);const savedId=library.entries[0].id;
    const mixed=zipFiles([['nested/main.ass',Buffer.concat([Buffer.from([255,254]),Buffer.from(ass,'utf16le')])],['other.ssa',ssa]]);
    await film.locator('#subtitle-overlay-root #file').setInputFiles({name:'mixed.zip',mimeType:'application/zip',buffer:mixed});
    await film.locator('#subtitle-overlay-root #localTracks').waitFor();assert.equal(await film.locator('#subtitle-overlay-root #localTracks option').count(),2);
    await film.locator('#subtitle-overlay-root #localTracks').selectOption('1');assert.equal(await film.locator('#subtitle-overlay-root #filename').textContent(),'other.srt');
    assert.match(await film.locator('#subtitle-overlay-root #message').textContent(),/ASS\/SSA text and timing loaded/);
    await popup.evaluate(({id,tabId})=>chrome.runtime.sendMessage({type:'LIBRARY_LOAD',id,tabId}),{id:savedId,tabId});assert.equal(await film.locator('#subtitle-overlay-root #delay').inputValue(),'2');
    pass('Overlay imports ASS, mixed UTF-16 ASS/SSA ZIP, switches tracks, explains style limits, and restores saved subtitle timing');
    await film.bringToFront();await popup.evaluate(id=>{tabId=id;},tabId);await popup.locator('#file').setInputFiles({name:'popup.ssa',mimeType:'text/x-ssa',buffer:Buffer.from(ssa)});
    await popup.waitForFunction(()=>document.querySelector('#status').textContent.includes('ASS/SSA text and timing loaded'));
    assert.equal(await film.locator('#subtitle-overlay-root #filename').textContent(),'popup.srt');
    pass('Popup file picker imports SSA through the real local import pipeline');
    await worker.evaluate(({ass,ssa,mixed})=>{
      globalThis.realFetch=fetch;globalThis.realDownload=chrome.downloads.download;globalThis.written=[];
      globalThis.realWindow=chrome.windows.create;chrome.windows.create=async options=>{globalThis.fixtureWebsiteUrl=options.url;return realWindow({...options,url:'about:blank'});};
      fetch=async url=>{const bytes=String(url).endsWith('.zip') ? new Uint8Array(mixed) : new TextEncoder().encode(ass);const response=new Response(bytes,{headers:{'Content-Type':'application/octet-stream','Content-Disposition':'attachment; filename="'+(String(url).endsWith('.zip') ? 'captions.zip' : 'captions.ass')+'"'}});Object.defineProperty(response,'url',{value:String(url)});return response;};
      chrome.downloads.download=async options=>{written.push(options.filename);return written.length;};
    },{ass,ssa,mixed:[...mixed]});
    await film.locator('#subtitle-overlay-root #tab-find').click();const opened=browser.waitForEvent('page');await film.locator('#subtitle-overlay-root #overlaySearchButton').click();const website=await opened;await website.goto(await worker.evaluate(()=>fixtureWebsiteUrl));
    await website.locator('#ass').click();await website.waitForFunction(()=>document.querySelector('#subtitle-overlay-download-notice')?.textContent.includes('ASS/SSA text and timing only'));
    assert.equal(await film.locator('#subtitle-overlay-root #filename').textContent(),'captions.srt');assert.deepEqual(await worker.evaluate(()=>written),['Subtitle Overlay/captions.srt']);
    await website.locator('#zip').click();await website.waitForFunction(()=>document.querySelector('#subtitle-overlay-download-notice')?.textContent.includes('2 subtitle files saved'));
    await film.locator('#subtitle-overlay-root #view-saved').waitFor();
    assert.equal(await worker.evaluate(()=>subtitleDownloadItem({filename:'captions.ass'})),true);assert.equal(await worker.evaluate(()=>subtitleDownloadItem({url:'https://dl.opensubtitles.org/captions.ssa?token=fixture'})),true);
    for(const mime of ['text/x-ass','text/x-ssa','application/x-ass','application/x-ssa'])assert.equal(await worker.evaluate(mime=>subtitleDownloadItem({mime}),mime),true);
    const gzip=zlib.gzipSync(Buffer.from(ass));
    const gzipResult=await worker.evaluate(async bytes=>{const files=await SubtitleDownload.extract(new Uint8Array(bytes),'captions.ass.gz');return SubtitleCore.parse(SubtitleCore.prepare(SubtitleCore.decode(files[0].bytes)).text).length;},[...gzip]);assert.equal(gzipResult,3);
    pass('Website ASS and mixed ZIP save SRT and load/list tracks; native ASS/SSA detection and gzip ASS extraction work');
    await worker.evaluate(()=>{fetch=realFetch;chrome.downloads.download=realDownload;chrome.windows.create=realWindow;});
  }finally{await browser.close();}
  fs.writeFileSync(path.resolve('.test-artifacts/ass-verification.txt'),checks.map(value=>'PASS '+value).join('\n')+'\n\nBrowser tests use local fixtures and mock provider/disk transport. ASS/SSA support converts text/timing to SRT; it does not render original ASS styles, effects, positions, fonts or vector drawings.\n');
})().catch(error=>{console.error(error);process.exitCode=1;});
