// Verify new assets without treating technical checks as gait approval.
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {sharp,hash} from './body-eight-lib.mjs';
const root=resolve('docs/design/walk-regeneration-2026-10-14');
const manifest=JSON.parse(await readFile(resolve(root,'manifest.json')));
const source=JSON.parse(await readFile('docs/design/equipment/class-2-imagegen-detail-01/export-report.json'));
assert.equal(manifest.generated,36);assert.equal(manifest.assets.length,288);
const rows=[];
for(const clip of manifest.clips){
 assert.equal(clip.visualApproved,false);assert.equal(clip.frames.length,8);
 for(const frame of clip.frames){
  const asset=manifest.assets[frame.asset],bytes=await readFile(asset.path),meta=await sharp(bytes).metadata();
  assert.equal(hash(bytes),frame.sha256);assert.equal(meta.width,128);assert.equal(meta.height,128);assert.equal(meta.hasAlpha,true);
  const parent=source.frames.find(f=>f.sha256===frame.parentSha256);
  assert(parent);const oldBytes=await readFile(resolve('docs/design/equipment/class-2-imagegen-detail-01',parent.url));assert.equal(hash(oldBytes),parent.sha256);
  const old=await sharp(oldBytes).ensureAlpha().raw().toBuffer(),next=await sharp(bytes).ensureAlpha().raw().toBuffer();
  assert(next.subarray(0,88*128*4).equals(old.subarray(0,88*128*4)));assert(frame.lowerBottom>=88);
 }
 rows.push({key:clip.key,bottom:clip.frames.map(f=>f.lowerBottom),visualApproved:false});
}
// Six rows per class, four unique generated lower key poses. Preserve nearest scaling.
for(const id of new Set(manifest.clips.map(c=>c.id))){
 const clips=manifest.clips.filter(c=>c.id===id),tiles=[];
 for(let y=0;y<clips.length;y++)for(let x=0;x<4;x++)tiles.push({input:await readFile(manifest.assets[clips[y].frames[x*2].asset].path),left:x*128,top:y*128});
 const board=await sharp({create:{width:512,height:768,channels:4,background:'#243a34'}}).composite(tiles).png().toBuffer();
 await sharp(board).resize(1024,1536,{kernel:'nearest'}).toFile(resolve(root,id+'-review.png'));
}
await writeFile(resolve(root,'technical-check.json'),JSON.stringify({frames:288,upperPixelsExact:true,sourceHashesExact:true,visualApproved:false,rows},null,2));
console.log('PASS: 36 clips / 288 alpha frames; source hashes and upper 88 rows exact. Gait approval remains open.');
