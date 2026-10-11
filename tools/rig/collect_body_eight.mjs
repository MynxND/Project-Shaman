import{readFile,writeFile,mkdir}from'node:fs/promises';
import{dir,json,save,order,sharp,rgba,bounds}from'./body-eight-lib.mjs';
const result=await json(dir+'rotation-result.json'),text=result.result.content.filter(c=>c.type==='text').map(c=>c.text).join('\n');if(!text.includes('status: completed'))throw Error('Not completed; do not resubmit');
const composites=[],measurements={};
for(const[i,d]of order.entries()){
 const u=text.match(new RegExp('(?:^|\\n)\\s*'+d+': (https://[^\\s]+)'))?.[1];if(!u)throw Error('Missing '+d);const r=await fetch(u);if(!r.ok)throw Error('Download failed');const b=Buffer.from(await r.arrayBuffer());const m=await sharp(b).metadata();if(m.width!==128||m.height!==128)throw Error('Wrong canvas');await writeFile(dir+d+'-raw.png',b);measurements[d]={...bounds(await rgba(b)),sourceUrl:u};composites.push({input:b,left:(i%4)*128,top:Math.floor(i/4)*128});
}
await save(dir+'measurements.json',measurements);
const preview=await sharp({create:{width:512,height:256,channels:4,background:'#20312e'}}).composite(composites).png().toBuffer();await sharp(preview).resize(1536,768,{kernel:'nearest'}).toFile(dir+'raw-review-3x.png');console.log(measurements);
