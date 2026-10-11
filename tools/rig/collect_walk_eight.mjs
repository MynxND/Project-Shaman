// Downloads the PixelLab walk frames (frame 0 = idle reference) and builds a raw review sheet; no runtime publish here.
import{writeFile,mkdir}from'node:fs/promises';import{json,save,order,sharp,rgba,bounds}from'./body-eight-lib.mjs';
const dir='docs/design/character-v3/walk-eight-02/';await mkdir(dir+'raw',{recursive:true});
const r=await json(dir+'animate-result.json'),text=r.result.content.filter(c=>c.type==='text').map(c=>c.text).join('\n');
if(!/medium-novice-walk[\s\S]*\(8\/8\)/.test(text))throw Error('Walk not complete; do not resubmit');
const count=Number(text.match(/frames: (\d+)/g).pop().split(' ')[1]),measure={},cells=[];
for(const[row,d]of order.entries()){const line=text.split('\n').find(l=>l.trim().startsWith(d+": ")&&l.includes("/animations/")),base=line?.trim().slice(d.length+2).split("{i}")[0];if(!base)throw Error('Missing '+d);measure[d]=[];
 for(let i=0;i<count;i++){const res=await fetch(base+i+'.png');if(!res.ok)throw Error('Download failed '+d+i);const b=Buffer.from(await res.arrayBuffer());const m=await sharp(b).metadata();if(m.width!==128||m.height!==128)throw Error('Wrong canvas '+d+i+' '+m.width+'x'+m.height);await writeFile(`${dir}raw/${d}-${i}.png`,b);measure[d].push(bounds(await rgba(b)));cells.push({input:b,left:i*128,top:row*128});}}
await save(dir+'raw-measurements.json',{count,source:'animate_object v3 group d18cb5d5-678b-4b67-9a5b-556fd8bdf348',frames:measure});
const sheet=await sharp({create:{width:count*128,height:8*128,channels:4,background:'#20312e'}}).composite(cells).png().toBuffer();await sharp(sheet).resize(count*128*1.5,8*128*1.5,{kernel:'nearest'}).toFile(dir+'raw-review.png');
for(const d of order)console.log(d,measure[d].map(b=>`${b.x0}-${b.x1}/${b.y0}-${b.y1}`).join(' '));
