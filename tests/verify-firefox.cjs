// Real Firefox extension runtime; isolated profile, local fixture only.
const fs=require('node:fs'),path=require('node:path'),net=require('node:net'),assert=require('node:assert/strict');
const {firefox}=require('playwright');const http=require('node:http');
const {browserManifest}=require('../scripts/browser-targets.cjs');const {zipFiles}=require('../scripts/zip-tools.cjs');
const root=path.resolve(__dirname,'../extension'),out=path.resolve(__dirname,'../.test-artifacts/firefox-extension');
fs.mkdirSync(out,{recursive:true});
for(const name of fs.readdirSync(root))fs.copyFileSync(path.join(root,name),path.join(out,name));
const manifest=browserManifest(JSON.parse(fs.readFileSync(path.join(root,'manifest.json'))),'firefox');
manifest.host_permissions=['http://*/*'];
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest));
function connect(port){return new Promise((resolve,reject)=>{
 const socket=net.createConnection({port,host:'127.0.0.1'});socket.once('error',reject);
 let data=Buffer.alloc(0);const waiting=[];
 function send(to,type,args={}){return new Promise((done,fail)=>{
  const timer=setTimeout(()=>fail(new Error('Firefox debugger timeout: '+type)),15000);
  waiting.push({to,done:value=>{clearTimeout(timer);done(value);}});
  const payload=Buffer.from(JSON.stringify({to,type,...args}));socket.write(Buffer.concat([Buffer.from(payload.length+':'),payload]));
 });}
 socket.on('data',chunk=>{
  data=Buffer.concat([data,chunk]);
  while(true){const colon=data.indexOf(':');if(colon<0)return;const size=Number(data.subarray(0,colon));if(data.length<colon+1+size)return;
   const packet=JSON.parse(data.subarray(colon+1,colon+1+size));data=data.subarray(colon+1+size);
   if(packet.applicationType){resolve({send,close:()=>socket.destroy()});continue;}
   const index=waiting.findIndex(item=>item.to===packet.from);if(index>=0)waiting.splice(index,1)[0].done(packet);
  }
 });
});}
(async()=>{
 const listener=net.createServer();await new Promise(resolve=>listener.listen(0,'127.0.0.1',resolve));const port=listener.address().port;await new Promise(resolve=>listener.close(resolve));
 let complete;const result=new Promise(resolve=>complete=resolve);
 const server=http.createServer((req,res)=>{
  if(req.url==='/result'){let data='';req.on('data',chunk=>data+=chunk);req.on('end',()=>{complete(JSON.parse(data));res.end('ok');});return;}
  res.setHeader('content-type','text/html');res.end('<!doctype html><title>Test Film</title><video style="width:900px;height:500px"></video>');
 });await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin='http://127.0.0.1:'+server.address().port;
 manifest.host_permissions=['http://*/*'];
 fs.writeFileSync(path.join(out,'firefox-test.html'),'<script src="firefox-test-driver.js"></script>');
 fs.writeFileSync(path.join(out,'firefox-test-driver.js'),'const TEST_ORIGIN='+JSON.stringify(origin)+';\nconst TEST_ZIP_DATA='+JSON.stringify(zipFiles([['test.srt','1\n00:00:08,000 --> 00:00:14,000\nZip line']]).toString('base64'))+';\n'+fs.readFileSync(path.join(__dirname,'firefox-driver.js'),'utf8'));
 fs.writeFileSync(path.join(out,'firefox-test-bootstrap.js'),"browser.tabs.create({url:browser.runtime.getURL('firefox-test.html')});");
 manifest.background.scripts.push('firefox-test-bootstrap.js');fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest));
 const profile=path.resolve(__dirname,'../.test-artifacts/firefox-profile-'+Date.now());
 // Fixture-only HTTP grant substitutes for a real toolbar activeTab gesture. No Internet pages are opened.
 fs.mkdirSync(profile,{recursive:true});
 fs.writeFileSync(path.join(profile,'extension-preferences.json'),JSON.stringify({[manifest.browser_specific_settings.gecko.id]:{permissions:[],origins:['http://*/*'],data_collection:manifest.browser_specific_settings.gecko.data_collection_permissions.required}}));
 const downloads=path.resolve(__dirname,'../.test-artifacts/firefox-downloads');fs.mkdirSync(downloads,{recursive:true});
 const context=await firefox.launchPersistentContext(profile,{headless:true,args:['--start-debugger-server',String(port)],firefoxUserPrefs:{'extensions.originControls.grantByDefault':true,'devtools.debugger.force-local':true,'devtools.debugger.remote-enabled':true,'devtools.debugger.prompt-connection':false,'browser.download.folderList':2,'browser.download.dir':downloads,'browser.download.useDownloadDir':true}});
 let remote,timer;
 try{
  for(let n=0;n<40;n++){try{remote=await connect(port);break;}catch{await new Promise(resolve=>setTimeout(resolve,100));}}
  assert(remote,'Firefox debugging connection');
  const actors=await remote.send('root','getRoot');assert(actors.addonsActor,JSON.stringify(actors));
  const installed=await remote.send(actors.addonsActor,'installTemporaryAddon',{addonPath:out});assert(!installed.error,JSON.stringify(installed));
  const addons=await remote.send('root','listAddons');const addon=addons.addons.find(item=>item.id===manifest.browser_specific_settings.gecko.id);assert(addon);assert.deepEqual(addon.warnings,[]);

  const report=await Promise.race([result,new Promise((_,reject)=>timer=setTimeout(()=>reject(new Error('Firefox test driver timeout')),90000))]);
  assert(report.ok,JSON.stringify(report));for(const check of report.checks)console.log('PASS Firefox '+check);
  fs.writeFileSync(path.resolve(__dirname,'../.test-artifacts/firefox-report.json'),JSON.stringify({version:manifest.version,browser:context.browser().version(),...report},null,2));
 }finally{clearTimeout(timer);remote?.close();await context.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
