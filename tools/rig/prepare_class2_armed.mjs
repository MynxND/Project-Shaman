import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {sharp,hash} from './body-eight-lib.mjs';
import {BRANCH_WEAPONS} from '../../packages/shared/dist/index.js';
const root='docs/design/equipment/class-2-imagegen-armed-01';
const ids=['santet','keris','onmyoji','miko','rune-seer','ullr-hunter'];
const dirs=['south','south-east','east','north-east','north','north-west','west','south-west'];
const inventory={pixelLabCredits:0,scope:'User explicitly requests weapons drawn with gripping hands, male six-class draft only',jobs:[],weapons:[]};
await mkdir(root,{recursive:true});
for(const id of ids){
 await mkdir(`${root}/${id}`,{recursive:true});const weapon=BRANCH_WEAPONS[id],parts=[];
 for(const [i,d]of dirs.entries()){
  const path=`apps/client/public/assets/equipment/${weapon}/${d}.png`,bytes=await readFile(path),m=await sharp(bytes).metadata();
  const s=Math.min(180/m.height,180/m.width),width=Math.round(m.width*s),height=Math.round(m.height*s);
  parts.push({input:await sharp(bytes).resize(width,height,{kernel:'nearest'}).png().toBuffer(),left:(i%4)*256+Math.round((256-width)/2),top:Math.floor(i/4)*256+Math.round((256-height)/2)});
  inventory.weapons.push({id,weapon,direction:d,path,sha256:hash(bytes),width:m.width,height:m.height});
 }
 await sharp({create:{width:1024,height:512,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(parts).png().toFile(`${root}/${id}/weapon-eight-reference.png`);
 for(const action of ['idle','walk','attack','cast'])inventory.jobs.push({id,weapon,action,frames:action==='idle'?8:64,status:'not-generated'});
}
await writeFile(`${root}/inventory.json`,JSON.stringify(inventory,null,2));
console.log('24 armed-art jobs; original item references locked; no generation or gameplay publication.');
