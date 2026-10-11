// Downloads one PixelLab animation group (by display name) for the V3 body into actions-eight-02/raw/<out>/ and builds a review sheet.
// Usage: node tools/rig/collect_action_eight.mjs <out-folder> <display-name> [dir1,dir2 for a partial fix group]   (frame 0 = echoed idle reference)
import{writeFile,mkdir}from'node:fs/promises';import{json,save,order,sharp,rgba,bounds}from'./body-eight-lib.mjs';
const[action,name,only]=process.argv.slice(2);if(!action||!name)throw Error('usage: <out-folder> <display-name> [directions]');
const dirs=only?only.split(','):order;
const dir='docs/design/character-v3/actions-eight-02/',out=`${dir}raw/${action}/`;await mkdir(out,{recursive:true});
const r=await json(dir+'object-result.json'),text=r.result.content.filter(c=>c.type==='text').map(c=>c.text).join('\n');
const block=text.split(/\n {2}(?=\S)/).find(b=>b.startsWith(name+' ['));if(!block||!block.includes(`(${dirs.length}/8)`))throw Error(name+' not complete; do not resubmit');
const count=Number(block.match(/frames: (\d+)/)[1]),measure={},cells=[];
for(const[row,d]of dirs.entries()){const line=block.split('\n').find(l=>l.trim().startsWith(d+': ')),base=line?.trim().slice(d.length+2).split('{i}')[0];if(!base)throw Error('Missing '+d);measure[d]=[];
 for(let i=0;i<count;i++){const res=await fetch(base+i+'.png');if(!res.ok)throw Error('Download failed '+d+i);const b=Buffer.from(await res.arrayBuffer());const m=await sharp(b).metadata();if(m.width!==128||m.height!==128)throw Error(`Wrong canvas ${d}${i} ${m.width}x${m.height}`);await writeFile(`${out}${d}-${i}.png`,b);measure[d].push(bounds(await rgba(b)));cells.push({input:await sharp(b).extract({left:20,top:36,width:88,height:84}).png().toBuffer(),left:i*88,top:row*84});}}
await save(`${dir}${action}-raw-measurements.json`,{action,group:block.match(/group: ([\w-]+)/)[1],count,frames:measure});
const sheet=await sharp({create:{width:count*88,height:dirs.length*84,channels:4,background:'#20312e'}}).composite(cells).png().toBuffer();await sharp(sheet).resize(count*88*2,dirs.length*84*2,{kernel:'nearest'}).toFile(`${dir}${action}-raw-review.png`);
for(const d of dirs)console.log(d,measure[d].map(b=>b.y0).join(' '));
