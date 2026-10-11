const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {zipFiles}=require('./zip-tools.cjs');require('./check.cjs');
const project=path.resolve(__dirname,'..'),root=path.join(project,'extension'),out=path.join(project,'dist');fs.mkdirSync(out,{recursive:true});
const version=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'))).version;
// Keep packaging independent of local files and browser-generated artifacts.
const include=['background.js','content.js','download-folder.js','film-detection.js','icon-128.png','icon-16.png','icon-32.png','icon-48.png','logo.svg','manifest.json','player-clock-bridge.js','popup.css','popup.html','popup.js','sample.srt','subtitle-download.js','subtitle-search.js','subtitle-settings.js','subtitles.js','website-bridge.js','website-permission.css','website-permission.html','website-permission.js'];
include.push('player-subtitles.js','app-font.css','inter-variable.woff2','INTER-LICENSE.txt');
const source=include.map(name=>[name,fs.readFileSync(path.join(root,name))]);
const license=fs.readFileSync(path.join(project,'LICENSE'));
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
const packages=[];
packages.push(verifiedZip('subtitle-overlay-'+version+'-chrome-web-store.zip',[...source,['LICENSE',license]]));
packages.push(verifiedZip('subtitle-overlay-'+version+'-release.zip',[
 ...source.map(([name,data])=>['extension/'+name,data]),
 ['extension/README.md',fs.readFileSync(path.join(root,'README.md'))],
 ['LICENSE',license],
 ['INSTALL.md',Buffer.from('# Subtitle Overlay '+version+'\n\nExtract this ZIP. Open chrome://extensions. Turn on Developer mode. Select Load unpacked, then select the extension folder.\n\nFor an update, replace files in the same installed folder, select Reload, then refresh the film tab.\n')],
 ['PRIVACY.md',fs.readFileSync(path.join(project,'docs/PRIVACY.md'))]
]));
const allowedRoots=['extension','scripts','tests','docs','site','.github'];
const rootFiles=['.gitignore','.gitattributes','.editorconfig','package.json','package-lock.json','README.md','LICENSE','CHANGELOG.md','CONTRIBUTING.md','SECURITY.md','SUPPORT.md'];
function walk(relative){
 return fs.readdirSync(path.join(project,relative),{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name)).flatMap(entry=>{
  const name=relative+'/'+entry.name;return entry.isDirectory()?walk(name):[[name,fs.readFileSync(path.join(project,name))]];
 });
}
const publicFiles=[...rootFiles.map(name=>[name,fs.readFileSync(path.join(project,name))]),...allowedRoots.flatMap(walk)].sort(([a],[b])=>a.localeCompare(b));
packages.push(verifiedZip('subtitle-overlay-'+version+'-source.zip',publicFiles.map(([name,data])=>['subtitle-overlay/'+name,data])));
fs.writeFileSync(path.join(out,'SHA256SUMS.txt'),packages.map(([name,data])=>crypto.createHash('sha256').update(data).digest('hex')+'  '+name).join('\n')+'\n');
const manifest={version,extensionFiles:[...include,'LICENSE'],packages:packages.map(([name,bytes])=>({name,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')}))};
fs.writeFileSync(path.join(out,'build-report.json'),JSON.stringify(manifest,null,2)+'\n');
console.log('PASS verified packages, manifest at store ZIP root, and SHA-256 hashes.');
for(const [name,bytes] of packages)console.log(name+' ('+bytes.length+' bytes)');
