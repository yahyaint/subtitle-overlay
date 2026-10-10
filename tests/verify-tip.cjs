const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const project=path.resolve(__dirname,'..'),root=path.join(project,'extension'),artifacts=path.join(project,'.test-artifacts');fs.mkdirSync(artifacts,{recursive:true});
 const context=await chromium.launchPersistentContext(path.join(artifacts,'tip-profile-'+Date.now()),{channel:'chromium',headless:true,timeout:30000,args:[`--disable-extensions-except=${root}`,`--load-extension=${root}`],viewport:{width:370,height:700}});
 try{
  const worker=context.serviceWorkers()[0]||await context.waitForEvent('serviceworker'),id=new URL(worker.url()).hostname,page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));await page.goto(`chrome-extension://${id}/popup.html`);
  const link=page.locator('#tipLink');assert(await link.isVisible());assert.equal(await link.textContent(),'Tip ↗');
  assert.equal(await link.getAttribute('href'),'https://yahyanabil.com/support');
  const received=[];await context.route('https://yahyanabil.com/support',async route=>{received.push({url:route.request().url(),headers:await route.request().allHeaders()});await route.fulfill({contentType:'text/html',body:'<title>Support development</title>'});});
  const [destination]=await Promise.all([context.waitForEvent('page'),link.click()]);await destination.waitForURL('https://yahyanabil.com/support');
  assert.equal(await destination.evaluate(()=>window.opener===null),true);assert.equal(received.length,1);assert.equal(received[0].headers.referer,undefined);assert.equal(received[0].headers.authorization,undefined);
  assert.deepEqual((await page.evaluate(()=>chrome.runtime.getManifest())).permissions,['activeTab','scripting','storage','downloads']);
  assert(await page.locator('body').evaluate(body=>body.scrollHeight<600));assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await destination.close();await page.bringToFront();await page.locator('body').screenshot({path:path.join(artifacts,'tip-popup.png')});assert.deepEqual(errors,[]);
  console.log('PASS Tip opens exact support URL in a new tab without opener, referrer, credentials, or extra permissions; popup fits.');
 }finally{await context.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
