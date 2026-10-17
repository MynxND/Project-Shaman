import {readFile} from 'node:fs/promises';
import {sharp} from './body-eight-lib.mjs';
import {frameKey} from './armed-head-offsets.mjs';
const root='docs/design/equipment/class-2-imagegen-detail-01',pub='apps/client/public';
const report=JSON.parse(await readFile(root+'/export-report.json'));
const fits=JSON.parse(await readFile(root+'/head-fit/proposals.json'));
const base=JSON.parse(await readFile(pub+'/assets/character-v3/body-eight-02/manifest.json'));
const manifest=JSON.parse(await readFile(pub+'/assets/character-v3/class-outfits/manifest-imagegen-detail-draft.json'));
for(const id of ['santet','keris','onmyoji','miko','rune-seer','ullr-hunter']){
 const layers=[];
 for(const [row,action] of ['walk','attack','cast'].entries())for(let index=0;index<8;index++){
  const f=report.frames.find(f=>f.id===id&&f.action===action&&f.direction==='south'&&f.index===index);
  const b=base.frames.find(b=>b.direction===f.direction),d=manifest.outfits.find(o=>o.branch===id).directions[f.direction];
  const p=fits.proposals.find(p=>p.key===frameKey(f));
  for(let after=0;after<2;after++){
   const dx=after?(p.dx??0):0,dy=after?(p.dy??0):0;
   const x=f.neck.x-b.neckPivot.x+d.headOffset.x-(b.neckPivot.x-b.headPivot.x)+dx;
   const y=f.neck.y-b.neckPivot.y+d.headOffset.y-(b.neckPivot.y-b.headPivot.y)+dy;
   const padded=await sharp({create:{width:176,height:176,channels:4,background:'#00000000'}}).composite([{input:pub+b.headUrl,left:24+x,top:24+y}]).png().toBuffer();
   const head=await sharp(padded).extract({left:24,top:24,width:128,height:128}).png().toBuffer();
   const tile=await sharp(root+'/'+f.url).composite([{input:head}]).resize(256,256,{kernel:'nearest'}).png().toBuffer();
   layers.push({input:tile,left:index*256,top:(row*2+after)*256});
  }
 }
 await sharp({create:{width:2048,height:1536,channels:4,background:'#243a34'}}).composite(layers).png().toFile(root+'/head-fit/'+id+'-south-before-after.png');
}

