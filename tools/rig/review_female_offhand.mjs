import {sharp,order} from './body-eight-lib.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root='docs/design/female-offhand-2026-10-12';
await mkdir(root,{recursive:true});
const skeleton=JSON.parse(await readFile('docs/design/rig/skeletons.json','utf8'));
const cells=[];
for(const [i,dir] of order.entries()){
 const img=await sharp(await readFile(`apps/client/public/assets/rig-v2/female/base/idle-${dir}.png`)).extract({left:0,top:0,width:128,height:128}).png().toBuffer();
 const k=skeleton.bodies.female[dir].idle[0],p=k.find(p=>p.label==='LEFT ARM');
 const overlay=Buffer.from(`<svg width="128" height="128"><circle cx="${p.x*128}" cy="${p.y*128}" r="2" fill="none" stroke="cyan" stroke-width="1"/><text x="5" y="12" fill="white" font-size="9">${dir}</text></svg>`);
 const cell=await sharp({create:{width:128,height:128,channels:4,background:'#263b35'}}).composite([{input:img},{input:overlay}]).png().toBuffer();
 cells.push({input:cell,left:(i%4)*128,top:Math.floor(i/4)*128});
}
const sheet=await sharp({create:{width:512,height:256,channels:4,background:'#263b35'}}).composite(cells).png().toBuffer();
await sharp(sheet).resize(1536,768,{kernel:'nearest'}).png().toFile(`${root}/idle-source-skeleton.png`);

// Human-measured left palm on the owned SOUTH idle image, not the drifting requested skeleton.
// Only these four actual frames are in scope; missing directions/actions deliberately have no anchors.
const source='apps/client/public/assets/rig-v2/female/base/idle-south.png';
const bytes=await readFile(source),grips=[[80,72],[80,72],[80,72],[80,72]];
const evidence=[];
for(let i=0;i<4;i++){
 const raw=await sharp(bytes).extract({left:i*128,top:0,width:128,height:128}).ensureAlpha().raw().toBuffer();
 const [x,y]=grips[i],rgba=[...raw.subarray((y*128+x)*4,(y*128+x)*4+4)];
 if(rgba[3]!==255)throw Error(`measured palm is transparent at frame ${i}`);
 evidence.push({frame:i,grip:grips[i],rgba,sourceFrameSha256:createHash('sha256').update(raw).digest('hex')});
}
const candidate={version:'legacy-offhand-review/1',body:'female',visualApproved:false,productionReady:false,
 source:{path:source,sha256:createHash('sha256').update(bytes).digest('hex'),method:'manual visible left-palm measurement; no V3 coordinates or automatic nearest-pixel attachment'},
 frames:{idle:{south:grips.map(grip=>({grip,tip:[grip[0],grip[1]-12],front:true}))}},
 unavailable:{directions:order.filter(d=>d!=='south'),actions:['walk','attack','cast'],reason:'not measured/reviewed; source skeleton drifts from actual palms'},evidence};
await mkdir('apps/client/public/assets/rig-v2/candidates',{recursive:true});
await writeFile('apps/client/public/assets/rig-v2/candidates/female-offhand-01.json',JSON.stringify(candidate,null,2)+'\n');
await writeFile(`${root}/candidate.json`,JSON.stringify(candidate,null,2)+'\n');
console.log('female off-hand proof: SOUTH idle 4 real frames, source hash and opaque grip pixels checked; other directions/actions absent');
