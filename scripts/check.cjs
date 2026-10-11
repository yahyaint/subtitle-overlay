const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const project=path.resolve(__dirname,'..'),root=path.join(project,'extension');
const files=fs.readdirSync(root).sort();
const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
const pkg=JSON.parse(fs.readFileSync(path.join(project,'package.json'),'utf8'));
assert.equal(manifest.manifest_version,3);assert.equal(manifest.version,pkg.version);
assert.match(fs.readFileSync(path.join(root,'background.js'),'utf8'),new RegExp('SubtitleOverlay v'+pkg.version.replaceAll('.','\\.')));
assert.deepEqual(manifest.permissions,['activeTab','scripting','storage','downloads']);
assert.equal(manifest.host_permissions,undefined);assert.equal(manifest.content_scripts,undefined);
assert.deepEqual(manifest.web_accessible_resources,[{resources:['inter-variable.woff2'],matches:['<all_urls>'],use_dynamic_url:true}]);
assert.equal(fs.readFileSync(path.join(root,'inter-variable.woff2')).subarray(0,4).toString(),'wOF2');
assert(fs.existsSync(path.join(root,'INTER-LICENSE.txt')));
assert(manifest.description.length<=132);
for(const name of files){
 const filepath=path.join(root,name);assert(fs.statSync(filepath).isFile(),'Unexpected directory: '+name);
 if(name.endsWith('.json'))JSON.parse(fs.readFileSync(filepath,'utf8'));
 if(name.endsWith('.js')){
  const source=fs.readFileSync(filepath,'utf8');new vm.Script(source,{filename:name});
  assert(!/\beval\s*\(|new\s+Function\s*\(|importScripts\s*\([^)]*https?:\/\//.test(source),'Unexpected executable code path: '+name);
 }
 if(name.endsWith('.html')){
  const html=fs.readFileSync(filepath,'utf8');
  for(const match of html.matchAll(/<(?:script|link)\b[^>]*(?:src|href)="([^"]+)"/g)){
   assert(!/^https?:/.test(match[1]),'Remote script or stylesheet: '+name);
   assert(fs.existsSync(path.join(root,match[1])),'Missing resource '+match[1]);
  }
 }
}
for(const size of [16,32,48,128]){
 const icon=fs.readFileSync(path.join(root,manifest.icons[size]));
 assert.equal(icon.subarray(1,4).toString(),'PNG');assert.equal(icon.readUInt32BE(16),size);assert.equal(icon.readUInt32BE(20),size);
}
assert(fs.existsSync(path.join(root,manifest.background.service_worker)));
assert(fs.existsSync(path.join(root,manifest.action.default_popup)));
console.log('PASS manifest, version, local resources, JavaScript syntax, packaged-code checks, and icon dimensions.');
