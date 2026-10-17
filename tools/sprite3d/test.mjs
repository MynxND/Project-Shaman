// Actual export, evaluated bone contacts, gait symmetry and runtime phase tests.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {SpriteClock,PhaserSpritePlayer} from './playback.mjs';
const root=resolve(import.meta.dirname,'../..');
const c=JSON.parse(await readFile(resolve(import.meta.dirname,'config.json')));
const out=resolve(root,c.output);
const m=JSON.parse(await readFile(resolve(out,'manifest.json')));
const g=JSON.parse(await readFile(resolve(out,'gait.json')));
const saved=JSON.parse(await readFile(resolve(out,'saved-animation-qa.json')));
assert(saved.savedAnimationPassed);assert(saved.maxSkinnedSoleGroundError<1e-5);
const distance=(a,b)=>Math.hypot(...a.map((n,i)=>n-b[i]));
assert.equal(m.frames.length,96);assert.equal(m.framesPerDirection,12);assert.equal(m.directions.length,8);
const png=await readFile(resolve(out,m.image));assert.equal(png.readUInt32BE(16),1536);assert.equal(png.readUInt32BE(20),1024);assert.equal(png[25],6);
let maxContactError=0,maxSlide=0,maxSymmetryError=0;
for(let i=0;i<12;i++){
  const left=g[i].feet.L,right=g[(i+6)%12].feet.R;
  maxSymmetryError=Math.max(maxSymmetryError,Math.abs(left.actual[1]-right.actual[1]),Math.abs(left.actual[2]-right.actual[2]));
  for(const side of ['L','R']){
    const f=g[i].feet[side];maxContactError=Math.max(maxContactError,distance(f.target,f.actual));
    if(f.stance){assert(Math.abs(f.actual[2]-.08)<1e-5);const next=g[i+1].feet[side];
      if(next.stance)maxSlide=Math.max(maxSlide,Math.abs(next.actual[1]-f.actual[1]-2*c.stride/12));}
  }
}
assert(maxContactError<1e-5);assert(maxSlide<1e-5);assert(maxSymmetryError<1e-5);
for(const side of ['L','R'])assert(distance(g[0].feet[side].actual,g[12].feet[side].actual)<1e-5);
for(const d of m.directions){const frames=m.frames.filter(f=>f.direction===d);assert.equal(frames.length,12);assert(Math.abs(frames.reduce((n,f)=>n+f.durationMs,0)-1000)<1e-6);
  for(const f of frames){const bytes=await readFile(resolve(out,f.file));assert.equal(bytes.readUInt32BE(16),128);assert.equal(bytes.readUInt32BE(20),128);assert(f.bounds[0]>0&&f.bounds[1]>0&&f.bounds[2]<128&&f.bounds[3]<128);assert.deepEqual(f.groundAnchor,frames[0].groundAnchor);}}
const clock=new SpriteClock(m);clock.advance(437);const index=clock.frame().index;for(const d of m.directions){clock.setDirection(d);assert.equal(clock.frame().index,index);assert.equal(clock.elapsedMs,437);}
clock.seek(1000);assert.equal(clock.frame().index,0);assert.throws(()=>clock.setDirection('bad'));assert.throws(()=>clock.advance(-1));
const sprite={setTexture(k,f){this.texture=k;this.frame=f;},setOrigin(x,y){this.origin=[x,y];}};
const player=new PhaserSpritePlayer(sprite,m,'test');player.tick(437);player.face('north');assert.equal(sprite.frame,4*12+index);assert.deepEqual(sprite.origin,m.frames[48].groundAnchor.map(x=>x/128));
const once=new SpriteClock({...m,loop:false});once.advance(2000);assert.equal(once.frame().index,11);
const report={technicalPassed:true,frames:96,directions:8,maxContactError,maxTreadmillSlide:maxSlide,maxLeftRightError:maxSymmetryError,
  savedAnimationPassed:true,maxSkinnedSoleGroundError:saved.maxSkinnedSoleGroundError,
  endpointPoseContinuous:true,phasePreserved:true,visualApproved:false,
  warnings:['Placeholder uses rigid skin segments; no production costume fidelity claim.','Rendered loop and low-resolution foot readability need human review.',`Foot contact is valid at matched travel speed ${2*c.stride} model units/second.`,'Imported skeleton retargeting requires normalized proportions/orientations; arbitrary rigs are not automatically compatible.']};
await writeFile(resolve(out,'qa.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
