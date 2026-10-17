import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {sharp,hash} from './body-eight-lib.mjs';
const root='docs/design/equipment/class-2-imagegen-detail-01',old='docs/design/equipment/class-2-imagegen-armed-01';
const report=JSON.parse(await readFile(`${root}/export-report.json`)),prior=JSON.parse(await readFile(`${old}/export-report.json`));
const result={clips:report.clips.length,motionFrames:0,preservedIdleFrames:0,missing:report.missing.length,lowResolution:[],blank:[],pixelLabCredits:0,visualApproved:false};
for(const f of report.frames){
 const bytes=await readFile(`${root}/${f.url}`),m=await sharp(bytes).metadata();assert.equal(m.width,128);assert.equal(m.height,128);assert.equal(hash(bytes),f.sha256);
 const px=await sharp(bytes).ensureAlpha().raw().toBuffer();let opaque=0;for(let i=3;i<px.length;i+=4)if(px[i]>127)opaque++;if(opaque<100)result.blank.push(f.url);
 if(f.action==='idle'){const p=prior.frames.find(p=>p.id===f.id&&p.action==='idle'&&p.direction===f.direction);assert.equal(f.sha256,p.sha256);result.preservedIdleFrames++;}else result.motionFrames++;
}
for(const c of report.clips){
 if(c.sourceCell.width*c.sourceCell.height<Math.floor(c.idleReferenceCell.width)*Math.floor(c.idleReferenceCell.height))result.lowResolution.push(c);
 const frames=report.frames.filter(f=>f.id===c.id&&f.action===c.action&&f.direction===c.direction);assert.equal(frames.length,8);
 assert.equal(new Set(frames.map(f=>JSON.stringify(f.sourceRegistration))).size,1,'whole clip uses one registration');
}
const dirs=['south','south-east','east','north-east','north','north-west','west','south-west'];
for(const id of ['santet','keris','onmyoji','miko','rune-seer','ullr-hunter']){
 if(report.clips.filter(c=>c.id===id).length!==24)continue;
 const cells=[];
 for(const [r,d]of dirs.entries())for(const [col,[a,k]]of [['idle',0],['walk',0],['attack',3],['cast',3]].entries()){
  const f=report.frames.find(f=>f.id===id&&f.action===a&&f.direction===d&&f.index===k);cells.push({input:await readFile(`${root}/${f.url}`),left:col*128,top:r*128});
 }
 await sharp({create:{width:512,height:1024,channels:4,background:{r:36,g:58,b:52,alpha:1}}}).composite(cells).png().toFile(`${root}/${id}/idle-walk-attack-cast-native.png`);
}
assert.equal(result.preservedIdleFrames,48);assert.deepEqual(result.blank,[]);assert.deepEqual(result.lowResolution,[],'source cell detail resolution must match idle');
if(process.argv.includes('--complete')){assert.equal(result.clips,144);assert.equal(result.motionFrames,1152);assert.equal(result.missing,0);}
await writeFile(`${root}/detail-quality-verification.json`,JSON.stringify(result,null,2));console.log(JSON.stringify(result));
