// Small test/archive writer using Node's bundled zlib. No runtime extension dependency.
const zlib=require('node:zlib');
function crc32(bytes){let crc=0xffffffff;for(const byte of bytes){crc^=byte;for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return (crc^0xffffffff)>>>0;}
function zipFiles(files,deflate=true){
  const locals=[],central=[];let offset=0;
  for(const [filename,value] of files){
    const name=Buffer.from(filename),bytes=Buffer.from(value),compressed=deflate ? zlib.deflateRawSync(bytes) : bytes,method=deflate ? 8 : 0,crc=crc32(bytes);
    const local=Buffer.alloc(30);local.writeUInt32LE(0x04034b50);local.writeUInt16LE(20,4);local.writeUInt16LE(0x800,6);local.writeUInt16LE(method,8);local.writeUInt32LE(crc,14);local.writeUInt32LE(compressed.length,18);local.writeUInt32LE(bytes.length,22);local.writeUInt16LE(name.length,26);
    locals.push(local,name,compressed);
    const entry=Buffer.alloc(46);entry.writeUInt32LE(0x02014b50);entry.writeUInt16LE(20,4);entry.writeUInt16LE(20,6);entry.writeUInt16LE(0x800,8);entry.writeUInt16LE(method,10);entry.writeUInt32LE(crc,16);entry.writeUInt32LE(compressed.length,20);entry.writeUInt32LE(bytes.length,24);entry.writeUInt16LE(name.length,28);entry.writeUInt32LE(offset,42);central.push(entry,name);
    offset+=local.length+name.length+compressed.length;
  }
  const directory=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(files.length,8);end.writeUInt16LE(files.length,10);end.writeUInt32LE(directory.length,12);end.writeUInt32LE(offset,16);
  return Buffer.concat([...locals,directory,end]);
}
module.exports={zipFiles};
