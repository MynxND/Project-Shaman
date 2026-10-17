import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {sharp,hash} from '../../../../tools/rig/body-eight-lib.mjs';
const root='docs/design/equipment/class-2-eight-01/';
const facings=['south','south-east','east','north-east','north','north-west','west','south-west'];
const jobs={achan:['walk','attack-cast-staff','cast'],juggernaut:['walk','attack-axe-shield','cast']};
const checked=new Map(),result={scope:'Original novice motion source inventory only; no class outfit clips generated',classes:{},uniqueSourceFrames:0,paidGenerations:0,runtimeCompatible:false};
for(const [id,actions] of Object.entries(jobs)){
 const out=result.classes[id]={requiredCandidateFrames:0,availableCandidateFrames:0,actions:{}};
 for(const action of actions){
  const path=action==='walk'?'apps/client/public/assets/character-v3/walk-eight-02/manifest.json':`apps/client/public/assets/character-v3/actions-eight-02/${action}/manifest.json`;
  const raw=await readFile(path),manifest=JSON.parse(raw.toString('utf8'));
  assert.equal(manifest.directions.length,8);
  const entry=out.actions[action]={sourceManifest:path,sha256:hash(raw),manifestFps:manifest.fps,loop:manifest.loop,facings:{}};
  for(const direction of facings){const d=manifest.directions.find(d=>d.direction===direction);assert.ok(d);assert.ok(d.frames.length>0);
   for(const frame of d.frames){const p='apps/client/public'+frame.url;if(!checked.has(p)){const b=await readFile(p);assert.equal(hash(b),frame.sha256);const m=await sharp(b).metadata();assert.equal(m.width,128);assert.equal(m.height,128);checked.set(p,true);}assert.ok(Number.isFinite(frame.bodyOrigin.x)&&Number.isFinite(frame.bodyOrigin.y));assert.ok(Number.isFinite(frame.neckPivot.x)&&Number.isFinite(frame.neckPivot.y));}
   entry.facings[direction]={sourceFrameCount:d.frames.length,candidateFrameCount:0,status:'source verified; outfit frames missing'};out.requiredCandidateFrames+=d.frames.length;
  }
 }
}
result.uniqueSourceFrames=checked.size;
await writeFile(root+'motion-preflight.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({sourceFramesVerified:checked.size,classes:Object.fromEntries(Object.entries(result.classes).map(([k,v])=>[k,{required:v.requiredCandidateFrames,available:v.availableCandidateFrames}]))}));
