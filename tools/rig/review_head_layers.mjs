// Review sheet: for each hairstyle row, every direction as [original rotation | base+hair composite], plus a face row.
import{readFile}from'node:fs/promises';import{order,sharp,json}from'./body-eight-lib.mjs';
const src='docs/design/character-v3/head-layers-01/',pub='apps/client/public/assets/character-v3/head-layers-01/',m=await json(pub+'manifest.json');
const HAIR=['natural-short','side-sweep','spiky-up','high-topknot'],crop=b=>sharp(b).extract({left:36,top:4,width:56,height:52}).png().toBuffer(),cells=[];
const stack=async files=>{let img=sharp({create:{width:128,height:128,channels:4,background:{r:0,g:0,b:0,alpha:0}}});return img.composite(await Promise.all(files.map(async f=>({input:await readFile(f)})))).png().toBuffer();};
for(const[r,h]of HAIR.entries())for(const[i,d]of order.entries()){cells.push({input:await crop(await readFile(`${src}rot-${h}/${d}.png`)),left:i*112,top:r*52},{input:await crop(await stack([pub+`base-${h}-${d}.png`,pub+`hair-${h}-${d}.png`])),left:i*112+56,top:r*52});}
const FACES=['smile','angry','sad','surprised','closed'],FD=['south','south-east','east','west','south-west'];
for(const[r,f]of FACES.entries())for(const[i,d]of FD.entries())cells.push({input:await crop(await stack([pub+`base-natural-short-${d}.png`,pub+`face-${f}-${d}.png`,pub+`hair-natural-short-${d}.png`])),left:i*56,top:(4+r)*52});
const b=await sharp({create:{width:896,height:9*52,channels:4,background:'#20312e'}}).composite(cells).png().toBuffer();await sharp(b).resize(1792,936,{kernel:'nearest'}).toFile(src+'layers-review.png');
