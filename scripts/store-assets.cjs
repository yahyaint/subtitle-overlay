const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const project=path.resolve(__dirname,'..'),root=path.join(project,'extension'),artifacts=path.join(project,'.test-artifacts'),assets=path.join(project,'docs/store/assets');
fs.mkdirSync(artifacts,{recursive:true});fs.mkdirSync(assets,{recursive:true});
const testRoot=path.join(artifacts,'store-extension');fs.mkdirSync(testRoot,{recursive:true});
for(const name of fs.readdirSync(root))fs.copyFileSync(path.join(root,name),path.join(testRoot,name));
const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json')));manifest.host_permissions=['http://127.0.0.1/*'];fs.writeFileSync(path.join(testRoot,'manifest.json'),JSON.stringify(manifest));
const fixture=`<!doctype html><html lang="en"><meta charset="utf-8"><title>Harbor Lights — local demo</title><style>
*{box-sizing:border-box}body{margin:0;background:#08121e;color:#f2f8fc;font-family:system-ui,sans-serif}main{padding:38px 24px;width:944px}.eyebrow{color:#79bce9;font-size:13px;font-weight:650;letter-spacing:1.8px;margin:0 0 12px}h1{font-size:37px;letter-spacing:-1.1px;line-height:1.2;margin:0 0 10px}p{color:#a8bfd1;font-size:15px;margin:0 0 25px}.video-player{overflow:hidden;border:1px solid #30485d;border-radius:16px;background:#132c43;position:relative}video{width:894px;height:504px;display:block}.film-title{position:absolute;top:20px;left:22px;pointer-events:none;font-size:16px;font-weight:650}.footer{font-size:12px;margin:16px 0 0;color:#8ba7bc}
</style><main><div class="eyebrow">SUBTITLE OVERLAY</div><h1>Your subtitles. Your settings.</h1><p>Load a file. Set the timing. Save it for the next viewing.</p><div class="video-player"><video controls muted></video><div class="film-title">Harbor Lights</div></div><p class="footer">Local demo video • Sample subtitles • No streaming account needed</p></main></html>`;
const server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html'});res.end(fixture);});
function escape(text){return text.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');}
function inline(text){return escape(text).replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\[([^\]]+)\]\((https:\/\/[^)]+)\)/g,'<a href="$2">$1</a>');}
const privacy=fs.readFileSync(path.join(project,'docs/PRIVACY.md'),'utf8').trim().split(/\n\n+/).map(block=>{
 const heading=block.match(/^(#{1,3}) (.*)$/);return heading?'<h'+heading[1].length+'>'+inline(heading[2])+'</h'+heading[1].length+'>':'<p>'+inline(block.replaceAll('\n',' '))+'</p>';
}).join('\n');
const siteStyle='body{font:17px/1.65 system-ui,sans-serif;color:#173148;background:#f6f9fc;margin:0}main{max-width:800px;margin:0 auto;padding:48px 24px}h1{font-size:36px;line-height:1.2}h2{font-size:23px;margin-top:34px}a{color:#216aa3}code{font-size:.9em;background:#e8eff5;padding:2px 4px;border-radius:3px}';
fs.writeFileSync(path.join(project,'site/privacy.html'),'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Subtitle Overlay privacy</title><style>'+siteStyle+'</style></head><body><main>'+privacy+'</main></body></html>\n');
fs.writeFileSync(path.join(project,'site/index.html'),'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Subtitle Overlay</title><style>'+siteStyle+'</style></head><body><main><h1>Subtitle Overlay</h1><p>Read. Sync. Watch.</p><p>Find, save, style, and sync external subtitles over browser video.</p><p>Version 0.7.17 is a preview.</p><p><a href="privacy.html">Privacy notice</a> · <a href="https://github.com/yahyaint/subtitle-overlay">Source code</a> · <a href="https://github.com/yahyaint/subtitle-overlay/issues">Support</a></p></main></body></html>\n');
fs.writeFileSync(path.join(project,'site/.nojekyll'),'');
fs.copyFileSync(path.join(root,'icon-128.png'),path.join(assets,'store-icon-128.png'));
(async()=>{
 let context;
 try{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  context=await chromium.launchPersistentContext(path.join(artifacts,'store-profile-'+Date.now()),{channel:'chromium',headless:true,args:[`--disable-extensions-except=${testRoot}`,`--load-extension=${testRoot}`],viewport:{width:1280,height:800},deviceScaleFactor:1});
  const worker=context.serviceWorkers()[0]||await context.waitForEvent('serviceworker'),id=new URL(worker.url()).hostname,page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));await page.goto('http://127.0.0.1:'+server.address().port);
  // Render original geometric scenery into a real browser-decodable local video.
  await page.evaluate(async()=>{
   const canvas=document.createElement('canvas');canvas.width=960;canvas.height=540;const c=canvas.getContext('2d');
   const draw=()=>{
    const sky=c.createLinearGradient(0,0,0,540);sky.addColorStop(0,'#183b5c');sky.addColorStop(.54,'#507893');sky.addColorStop(.55,'#224963');sky.addColorStop(1,'#0c283f');c.fillStyle=sky;c.fillRect(0,0,960,540);
    c.fillStyle='#f6ce97';c.beginPath();c.arc(420,213,46,0,Math.PI*2);c.fill();
    c.fillStyle='#193b50';c.beginPath();c.moveTo(0,292);c.lineTo(130,203);c.lineTo(260,260);c.lineTo(350,230);c.lineTo(500,299);c.lineTo(960,299);c.lineTo(960,338);c.lineTo(0,338);c.fill();
    c.fillStyle='#133148';c.beginPath();c.moveTo(960,290);c.lineTo(830,184);c.lineTo(660,286);c.lineTo(540,320);c.lineTo(960,360);c.fill();
    c.fillStyle='#e3b984';for(let i=0;i<9;i++){c.globalAlpha=.32-i*.025;c.fillRect(395-i*4,324+i*14,48+i*8,3);}c.globalAlpha=1;
    c.fillStyle='#112d42';c.fillRect(84,263,16,71);c.fillStyle='#f8e0a9';c.fillRect(84,263,16,8);c.fillStyle='#17374c';c.beginPath();c.moveTo(80,263);c.lineTo(92,245);c.lineTo(104,263);c.fill();
    c.strokeStyle='#4d7691';c.globalAlpha=.5;for(let i=0;i<7;i++){c.beginPath();c.moveTo(50+i*105,386+i%3*17);c.lineTo(113+i*105,386+i%3*17);c.stroke();}c.globalAlpha=1;
   };draw();const stream=canvas.captureStream(10),recorder=new MediaRecorder(stream,{mimeType:'video/webm'}),chunks=[];recorder.ondataavailable=event=>chunks.push(event.data);const stopped=new Promise(resolve=>recorder.onstop=resolve);recorder.start();const timer=setInterval(draw,90);await new Promise(resolve=>setTimeout(resolve,1500));recorder.stop();await stopped;clearInterval(timer);stream.getTracks().forEach(track=>track.stop());
   const video=document.querySelector('video');video.src=URL.createObjectURL(new Blob(chunks,{type:'video/webm'}));await new Promise(resolve=>video.onloadeddata=resolve);video.currentTime=.4;video.pause();navigator.mediaSession.metadata=new MediaMetadata({title:'Harbor Lights'});
  });
  const popup=await context.newPage();await popup.goto('chrome-extension://'+id+'/popup.html');
  const tabId=await popup.evaluate(async url=>(await chrome.tabs.query({})).find(tab=>tab.url===url).id,page.url());
  await popup.evaluate(tabId=>chrome.scripting.executeScript({target:{tabId},files:['subtitles.js','subtitle-settings.js','film-detection.js','player-subtitles.js','content.js']}),tabId);
  const ui=name=>page.locator('#subtitle-overlay-root #'+name);await ui('tab-controls').click();await ui('advancedSettings').locator('summary').click();
  await ui('file').setInputFiles({name:'harbor-lights-en.srt',mimeType:'text/plain',buffer:Buffer.from('1\n00:00:00,000 --> 00:00:01,300\nThe lights will guide us home.\n\n2\n00:00:01,300 --> 00:00:02,600\nWe will reach the harbor soon.')});
  await page.waitForFunction(()=>document.querySelector('#subtitle-overlay-root').shadowRoot.querySelector('#text').textContent==='The lights will guide us home.');
  await ui('syncSettings').locator('summary').click();await page.bringToFront();await page.screenshot({path:path.join(assets,'01-controls.png')});
  await ui('textSettings').locator(':scope > summary').click();await ui('font').selectOption('Verdana, sans-serif');await ui('backgroundColor').fill('#102c42');await ui('backgroundColor').dispatchEvent('input');
  await page.screenshot({path:path.join(assets,'02-text-style.png')});
  await ui('saveSubtitle').click();await page.waitForFunction(()=>document.querySelector('#subtitle-overlay-root').shadowRoot.querySelector('#saveSubtitle').getAttribute('aria-pressed')==='true');await ui('tab-saved').click();
  await page.waitForFunction(()=>document.querySelector('#subtitle-overlay-root').shadowRoot.querySelector('#overlayLibrary').textContent.includes('harbor-lights-en.srt'));
  await page.screenshot({path:path.join(assets,'03-saved.png')});
  await page.evaluate(()=>{const video=document.querySelector('video');for(const [label,language,text] of [['English','en','The lights will guide us home.'],['English SDH','en','[Waves]'],['Arabic','ar','مرحبا']]){const track=video.addTextTrack('subtitles',label,language);track.addCue(new VTTCue(0,2,text));track.mode='hidden';}});
  await ui('tab-find').click();await ui('playerTracksSettings').locator('summary').click();await page.waitForFunction(()=>document.querySelector('#subtitle-overlay-root').shadowRoot.querySelector('#playerTrackCount').textContent==='3');await ui('playerLanguage').selectOption('en');await page.screenshot({path:path.join(assets,'04-player-languages.png')});assert.deepEqual(errors,[]);
  const tile=await context.newPage();await tile.setViewportSize({width:440,height:280});
  const logo=fs.readFileSync(path.join(root,'logo.svg'),'utf8');
  await tile.setContent('<!doctype html><html lang="en"><style>*{box-sizing:border-box}body{margin:0;width:440px;height:280px;background:linear-gradient(130deg,#08121e,#153b5b);color:#f2f8fc;font-family:system-ui,sans-serif;padding:29px 30px}svg{width:55px;height:55px}h1{font-size:29px;line-height:1.15;letter-spacing:-.7px;margin:18px 0 10px}p{font-size:16px;color:#bad6e9;margin:0}small{display:block;font-size:12px;color:#79bce9;margin-top:21px;letter-spacing:.2px}</style>'+logo+'<h1>Subtitle Overlay</h1><p>Read. Sync. Watch.</p><small>Find • Save • Set your text style</small></html>');
  await tile.screenshot({path:path.join(assets,'small-promo-440x280.png')});
  for(const name of ['01-controls.png','02-text-style.png','03-saved.png','04-player-languages.png']){const bytes=fs.readFileSync(path.join(assets,name));assert.equal(bytes.readUInt32BE(16),1280);assert.equal(bytes.readUInt32BE(20),800);}
  fs.writeFileSync(path.join(assets,'README.md'),'# Store images\n\nFour 1280 × 800 screenshots show the real version 0.7.17 extension on an original local demo video. The scene, film title, and subtitle lines are samples. No streaming footage or user report is included.\n\n`small-promo-440x280.png` is the promotional tile. `store-icon-128.png` is the extension icon. Rebuild with `npm run store:assets`.\n');
  console.log('PASS four real-UI screenshots, 440x280 promotional tile, icon, and privacy HTML.');
 }finally{if(context)await context.close();server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
