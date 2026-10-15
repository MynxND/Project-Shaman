import assert from'node:assert/strict';
import{readFile}from'node:fs/promises';
import{stripTypeScriptTypes}from'node:module';
import{createHash}from'node:crypto';
const code=stripTypeScriptTypes(await readFile('apps/client/src/game/world/china-quilt.ts','utf8'));
const{quiltPaint}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const fixture=size=>{const pixels=new Uint8ClampedArray(size*size*4);for(let y=0;y<size;y++)for(let x=0;x<size;x++)pixels.set([x*2,y*2,(x+y)%256,255],(y*size+x)*4);return pixels;};
// A fixed pre-change byte fingerprint protects other countries' default quilting.
const oldFixture=new Uint8ClampedArray(64*64*4);for(let y=0;y<64;y++)for(let x=0;x<64;x++)oldFixture.set([x*4,y*4,(x+y)*2,255],(y*64+x)*4);
const fingerprint=createHash('sha256').update(quiltPaint(oldFixture,64,128,96,123)).digest('hex');
assert.equal(fingerprint,'7b6aba16b1a2f13712bc43b9048afabd2120ddc79a3a0368e5d99d414bb3efc7');
const source=fixture(128),paint=quiltPaint(source,128,256,192,301,2),colors=new Set();
for(let i=0;i<source.length;i+=4)colors.add(`${source[i]},${source[i+1]},${source[i+2]}`);
assert.deepEqual(paint,quiltPaint(source,128,256,192,301,2));assert.notDeepEqual(paint,quiltPaint(source,128,256,192,302,2));
for(let i=0;i<paint.length;i+=4){assert.equal(paint[i+3],255);assert(colors.has(`${paint[i]},${paint[i+1]},${paint[i+2]}`));}
assert.throws(()=>quiltPaint(source,128,256,192,301,0));
console.log('PASS unchanged legacy quilt fingerprint; deterministic high-density ground retains only painted source colors and full opacity.');
