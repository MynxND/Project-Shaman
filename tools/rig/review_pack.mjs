// Review of packed results on the real body: default head row, the new hairstyle row (8 directions), expression rows.
import{readFile}from'node:fs/promises';import{order,sharp,json}from'./body-eight-lib.mjs';
const d='docs/design/character-v3/head-layers-03/',P='apps/client/public',style=process.argv[2]||'side-sweep',faces=(process.argv[3]||'cold,sad').split(',');
const body=await json(P+'/assets/character-v3/body-eight-02/manifest.json'),heads=await json(P+'/assets/character-v3/head-eight-01/manifest.json');
async function cellHead(tag,dir){const L=await json(`${d}pack-${tag}-layout.json`),c=L.layout.find(x=>x.direction===dir);if(!c)return null;
 const cell=await sharp(`${d}pack-${tag}-raw.png`).extract({left:c.cell.x,top:c.cell.y,width:L.CELL,height:L.CELL}).png().toBuffer();
 return sharp({create:{width:128,height:128,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:cell,left:c.crop.x,top:c.crop.y}]).png().toBuffer();}
const rows=[['default',null],[style,'hair-'+style],...faces.map(f=>[f,'face-'+f])],cells=[],W=72,H=100;
for(const[c,dir]of order.entries()){const b=body.frames[c],h=heads.frames[c];
 for(const[r,[,tag]]of rows.entries()){const head=tag?await cellHead(tag,dir):await readFile(P+h.url);if(!head)continue;
  const img=await sharp(await readFile(P+b.url)).composite([{input:head,left:b.neckPivot.x-h.headPivot.x,top:b.neckPivot.y-h.headPivot.y}]).png().toBuffer();
  cells.push({input:await sharp(img).extract({left:28,top:10,width:W,height:H}).png().toBuffer(),left:c*W,top:r*H});}}
const out=`${d}review-${style}-${faces.join('-')}.png`;const x=await sharp({create:{width:8*W,height:rows.length*H,channels:4,background:'#3c3a3a'}}).composite(cells).png().toBuffer();await sharp(x).resize(8*W*2,rows.length*H*2,{kernel:'nearest'}).toFile(out);console.log(out);
