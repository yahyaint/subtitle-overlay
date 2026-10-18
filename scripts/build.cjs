const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {zipFiles}=require('./zip-tools.cjs');require('./check.cjs');
const project=path.resolve(__dirname,'..'),root=path.join(project,'extension');
const version=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'))).version;
const args=process.argv.slice(2);
assert(args.length===0 || args.length===2 && args[0]==='--out','Usage: npm run build -- --out <folder>');
const out=args.length ? path.resolve(args[1]) : path.resolve(project,'../releases/builds',version);
function outsideRepo(directory){const relative=path.relative(fs.realpathSync(project),directory);return relative==='..' || relative.startsWith('..'+path.sep) || path.isAbsolute(relative);}
assert(outsideRepo(out),'Release packages must be written outside the repository.');
let existing=out;while(!fs.existsSync(existing))existing=path.dirname(existing);
assert(outsideRepo(fs.realpathSync(existing)),'Release output resolves inside the repository.');
fs.mkdirSync(out,{recursive:true});
// Keep packaging independent of local files and browser-generated artifacts.
const include=['background.js','content.js','download-folder.js','film-detection.js','icon-128.png','icon-16.png','icon-32.png','icon-48.png','logo.svg','manifest.json','player-clock-bridge.js','popup.css','popup.html','popup.js','sample.srt','subtitle-download.js','subtitle-search.js','subtitle-settings.js','subtitles.js','website-bridge.js','website-permission.css','website-permission.html','website-permission.js'];
include.push('private-storage.js','saved-library.js','player-sources-bridge.js','player-subtitles.js','app-font.css','inter-variable.woff2','INTER-LICENSE.txt');
const source=include.map(name=>[name,fs.readFileSync(path.join(root,name))]);
const licenseFiles=['LICENSE','NOTICE'];
const licenses=licenseFiles.map(name=>[name,fs.readFileSync(path.join(project,name))]);
function verifiedZip(filename,entries){
 const bytes=zipFiles(entries),end=bytes.length-22;
 assert.equal(bytes.readUInt32LE(end),0x06054b50);assert.equal(bytes.readUInt16LE(end+10),entries.length);
 let at=bytes.readUInt32LE(end+16);
 for(const [name,expected] of entries){
  assert.equal(bytes.readUInt32LE(at),0x02014b50);
  const len=bytes.readUInt16LE(at+28),length=bytes.readUInt32LE(at+20),offset=bytes.readUInt32LE(at+42);
  assert.equal(bytes.subarray(at+46,at+46+len).toString(),name);
  assert(!name.startsWith('/') && !name.split('/').includes('..'));
  const start=offset+30+bytes.readUInt16LE(offset+26)+bytes.readUInt16LE(offset+28);
  assert(zlib.inflateRawSync(bytes.subarray(start,start+length)).equals(expected),'ZIP content mismatch: '+name);
  at+=46+len+bytes.readUInt16LE(at+30)+bytes.readUInt16LE(at+32);
 }
 fs.writeFileSync(path.join(out,filename),bytes);return [filename,bytes];
}
const {browserManifest}=require('./browser-targets.cjs');
const packages=[];
for(const target of ['firefox','safari']){
 const targetSource=source.map(([name,data])=>[name,name==='manifest.json' ? Buffer.from(JSON.stringify(browserManifest(JSON.parse(data),target),null,2)+'\n') : data]);
 if(target==='firefox')packages.push(verifiedZip('subtitle-overlay-'+version+'-firefox-unsigned.xpi',[...targetSource,...licenses]));
 if(target==='safari')packages.push(verifiedZip('subtitle-overlay-'+version+'-safari-source.zip',[
  ...targetSource.map(([name,data])=>['extension/'+name,data]),...licenses,
  ['BROWSERS.md',fs.readFileSync(path.join(project,'docs/BROWSERS.md'))]
 ]));
}
// Chromium distributable: manifest and every included file share the archive root.
// Wrapping extension/ with sibling documents causes package-upload rejection.
const chromiumFiles=[...source,...licenses];
assert(chromiumFiles.some(([name])=>name==='manifest.json'),'Missing root manifest');
assert(chromiumFiles.every(([name])=>!name.includes('/')),'Chromium files must share the manifest root');
packages.push(verifiedZip('subtitle-overlay-'+version+'-release.zip',chromiumFiles));
const allowedRoots=['extension','scripts','tests','docs','site','.github'];
const rootFiles=['.gitignore','.gitattributes','.editorconfig','package.json','package-lock.json','README.md','INSTALL.md',...licenseFiles,'CHANGELOG.md','CONTRIBUTING.md','SECURITY.md','SUPPORT.md'];
function walk(relative){
 return fs.readdirSync(path.join(project,relative),{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name)).flatMap(entry=>{
  const name=relative+'/'+entry.name;return entry.isDirectory()?walk(name):[[name,fs.readFileSync(path.join(project,name))]];
 });
}
const publicFiles=[...rootFiles.map(name=>[name,fs.readFileSync(path.join(project,name))]),...allowedRoots.flatMap(walk)].sort(([a],[b])=>a.localeCompare(b));
packages.push(verifiedZip('subtitle-overlay-'+version+'-source.zip',publicFiles.map(([name,data])=>['subtitle-overlay/'+name,data])));
fs.writeFileSync(path.join(out,'SHA256SUMS.txt'),packages.map(([name,data])=>crypto.createHash('sha256').update(data).digest('hex')+'  '+name).join('\n')+'\n');
const manifest={version,extensionFiles:[...include,...licenseFiles],packages:packages.map(([name,bytes])=>({name,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')}))};
fs.writeFileSync(path.join(out,'build-report.json'),JSON.stringify(manifest,null,2)+'\n');
console.log('PASS verified packages, Chromium, Firefox, Safari source and source ZIPs and SHA-256 hashes.');
console.log('Output: '+out);
for(const [name,bytes] of packages)console.log(name+' ('+bytes.length+' bytes)');
