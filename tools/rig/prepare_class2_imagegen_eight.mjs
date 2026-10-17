import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {sharp,hash} from './body-eight-lib.mjs';
const root='docs/design/equipment/class-2-imagegen-eight-01';
const fit='docs/design/equipment/class-2-imagegen-fit-01';
const base='apps/client/public/assets/character-v3/body-eight-02';
const manifest=JSON.parse(await readFile(`${base}/manifest.json`,'utf8'));
const ids=['santet','onmyoji','rune-seer','keris','miko','ullr-hunter'];
const order=['south','south-east','east','north-east','north','north-west','west','south-west'];
await mkdir(root,{recursive:true});
const parts=[],sources=[];
for(const [i,d] of order.entries()){
 const b=await readFile(`${base}/${d}.png`);
 parts.push({input:await sharp(b).resize(384,384,{kernel:'nearest'}).png().toBuffer(),left:(i%4)*384,top:Math.floor(i/4)*384});
 sources.push({direction:d,sha256:hash(b),...manifest.frames.find(f=>f.direction===d)});
}
await sharp({create:{width:1536,height:768,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(parts).png().toFile(`${root}/original-body-eight-template.png`);
const raw=await readFile(`${fit}/south-six-raw01.png`);
for(const [i,id] of ids.entries()){
 await mkdir(`${root}/${id}`,{recursive:true});
 await sharp(raw).extract({left:(i%3)*512,top:Math.floor(i/3)*512,width:512,height:512}).png().toFile(`${root}/${id}/south-design-reference.png`);
}
await writeFile(`${root}/source-lock.json`,JSON.stringify({order,ids,sources,template:{width:1536,height:768,columns:4,rows:2,cell:384,magnification:3},pixelLabCredits:0},null,2));
console.log('Eight-direction source template and6 independent costume references prepared.');
