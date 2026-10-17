import {sharp,hash} from '../../../../tools/rig/body-eight-lib.mjs';
import {readFile,writeFile} from 'node:fs/promises';
const dir='docs/design/equipment/class-2-first-pair-03/';
const source=await readFile('apps/client/public/assets/character-v3/body-eight-02/south.png');
const head=await readFile('apps/client/public/assets/character-v3/head-eight-01/south.png');
const src=await sharp(source).ensureAlpha().raw().toBuffer();
const cells=[],report={baseSha256:hash(source),headSha256:hash(head),headOffset:{x:0,y:-1},note:'Static composite uses existing idle neck minus head pivot. Head unchanged; not runtime clothing integration.',outputs:{}};
for(const [i,id] of ['medium','achan','juggernaut'].entries()){
 const bytes=id==='medium'?source:await readFile(dir+id+'-raw.png');
 const meta=await sharp(bytes).metadata();
 if(meta.width!==128||meta.height!==128)throw Error(id+' dimensions');
 const raw=await sharp(bytes).ensureAlpha().raw().toBuffer();
 let outsideChanged=0; for(let y=0;y<128;y++)for(let x=0;x<128;x++)if(y<47||y>112){const p=(y*128+x)*4;if(!raw.subarray(p,p+4).equals(src.subarray(p,p+4)))outsideChanged++;}
 const h=await sharp(head).extract({left:0,top:1,width:128,height:127}).png().toBuffer();
 const composite=await sharp(bytes).composite([{input:h,left:0,top:0}]).png().toBuffer();
 await writeFile(dir+id+'-with-head.png',composite);
 await sharp(composite).resize(512,512,{kernel:'nearest'}).toFile(dir+id+'-review-4x.png');
 cells.push({input:composite,left:i*128,top:0});
 report.outputs[id]={sha256:hash(bytes),width:meta.width,height:meta.height,outsideBodyBandChangedPixels:outsideChanged};
}
const sheet=await sharp({create:{width:384,height:128,channels:4,background:'#263b35'}}).composite(cells).png().toBuffer();
await sharp(sheet).resize(1536,512,{kernel:'nearest'}).toFile(dir+'comparison-4x.png');
await writeFile(dir+'checks.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));


