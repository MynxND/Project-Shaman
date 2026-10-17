import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {sharp,hash} from './body-eight-lib.mjs';
const root='docs/design/equipment/class-2-imagegen-motion-01';
const ids={santet:'attack-cast-wand',keris:'attack-dagger',onmyoji:'attack-cast-fan',miko:'attack-cast-gohei','rune-seer':'attack-cast-rune','ullr-hunter':'attack-bow'};
const order=['south','south-east','east','north-east','north','north-west','west','south-west'];
await mkdir(`${root}/references`,{recursive:true});
const clips={};
for(const action of ['walk','cast',...Object.values(ids)]){
 const folder=action==='walk'?'walk-eight-02':`actions-eight-02/${action}`;
 const manifest=JSON.parse(await readFile(`apps/client/public/assets/character-v3/${folder}/manifest.json`,'utf8'));
 const images=[],frames=[];
 for(const [row,d]of order.entries())for(let k=0;k<8;k++){
  const dir=manifest.directions.find(x=>x.direction===d),index=action==='cast'?Math.round(k*11/7):k,f=dir.frames[index];
  const bytes=await readFile(`apps/client/public${f.url}`);
  if(hash(bytes)!==f.sha256)throw Error(`Source hash:${f.url}`);
  images.push({input:await sharp(bytes).resize(256,256,{kernel:'nearest'}).png().toBuffer(),left:k*256,top:row*256});
  frames.push({direction:d,index:k,sourceIndex:index,...f});
 }
 await sharp({create:{width:2048,height:2048,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(images).png().toFile(`${root}/references/${action}.png`);
 clips[action]={frames,sourceFolder:folder};
}
await writeFile(`${root}/source-lock.json`,JSON.stringify({ids,order,clips,cell:256,width:2048,height:2048,pixelLabCredits:0},null,2));
for(const id of Object.keys(ids))await mkdir(`${root}/${id}`,{recursive:true});
console.log('8 real source clip atlases prepared: walk/cast +6 class attacks, each64 pose cells.');
