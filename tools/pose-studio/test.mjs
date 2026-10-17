#!/usr/bin/env node
// GPU-free behavioural test: fake an H3 render from the idle sprite (upscale, key background,
// sway the body, move the head, add model-style noise) and run the real processing + QA.
// node tools/pose-studio/test.mjs
import assert from 'node:assert/strict';
import {mkdir,writeFile,rm} from 'node:fs/promises';
import {resolve} from 'node:path';
import {sharp,jobsDir,load,blank,SIZE,bounds,character} from './lib/common.mjs';
import {keyframe,keyColor,buildPrompt} from './lib/prepare.mjs';
import {extractHead,pickFrames,diff} from './lib/process.mjs';
import {createJob,processJob,setSelection,getJob,removeJob} from './lib/jobs.mjs';
import {buildGraph,alignLength} from './lib/workflow.mjs';

assert.equal(alignLength(30),39);assert.equal(alignLength(22),22);assert.equal(alignLength(1),5);
assert.deepEqual(pickFrames(39,8,true),[0,5,10,14,19,24,29,33]);
assert.deepEqual(pickFrames(22,4,false),[0,7,14,21]);
const g=buildGraph({prompt:'x',firstImage:'a.png',lastImage:'a.png',length:30,seed:3,prefix:'p'});
assert.equal(g.i2v.inputs.length,39);assert.deepEqual(g.i2v.inputs.last_frame,['last',0]);assert.equal(g.sched.inputs.steps,8);assert.deepEqual(g.guider.inputs.model,['lora',0]);
assert.match(buildPrompt({character:character('santet'),direction:'east',action:'walk',loop:true}),/side profile facing the right/);

const c=character('santet'),dir='south',canvas=768,s=canvas/SIZE;
const kf=await keyframe(c,dir,canvas);
assert.equal(kf.withHead.w,128);const key=keyColor(kf.withHead);
const {head,box}=extractHead(await load(kf.paths.withHead),kf.body);
assert.ok(box&&box.h>10,'head extracted from with-head minus headless idle');

const job=await createJob({character:c.id,direction:dir,action:'walk',seed:1,requestedBy:'test'});
try{
  const raw=resolve(jobsDir,job.id,'raw');await mkdir(raw,{recursive:true});
  const N=22,headMoves=[];
  for(let f=0;f<N;f++){
    const ph=Math.sin(2*Math.PI*f/(N-1)),bx=Math.round(ph*2),hx=Math.round(ph*3),hy=Math.round(Math.abs(ph));headMoves.push({dx:hx,dy:hy});
    const small=blank(SIZE,SIZE);
    for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){const i=(y*SIZE+x)*4;if(kf.body.d[i+3]>127){const tx=x+bx;if(tx>=0&&tx<SIZE)kf.body.d.copy(small.d,(y*SIZE+tx)*4,i,i+4);}}
    for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){const i=(y*SIZE+x)*4;if(head.d[i+3]>127){const tx=x+hx,ty=y+hy;if(tx>=0&&ty>=0&&tx<SIZE&&ty<SIZE)head.d.copy(small.d,(ty*SIZE+tx)*4,i,i+4);}}
    const big=Buffer.alloc(canvas*canvas*3);
    for(let y=0;y<canvas;y++)for(let x=0;x<canvas;x++){const i=((y/s|0)*SIZE+(x/s|0))*4,o=(y*canvas+x)*3,n=((x*7+y*13+f)%9)-4;
      if(small.d[i+3]>127){big[o]=Math.max(0,Math.min(255,small.d[i]+n));big[o+1]=Math.max(0,Math.min(255,small.d[i+1]+n));big[o+2]=Math.max(0,Math.min(255,small.d[i+2]+n));}
      else{big[o]=Math.max(0,Math.min(255,key[0]-6+n));big[o+1]=Math.max(0,Math.min(255,key[1]-10+n));big[o+2]=Math.max(0,Math.min(255,key[2]+n));}}
    await writeFile(resolve(raw,`${String(f).padStart(3,'0')}.png`),await sharp(big,{raw:{width:canvas,height:canvas,channels:3}}).png().toBuffer());
  }
  job.keyColor=key;
  const done=await processJob(job);
  assert.equal(done.status,'review');assert.equal(done.frameCount,N);assert.equal(done.selected.length,8);
  const byId=Object.fromEntries(done.qa.checks.map(k=>[k.id,k]));
  for(const id of['complete','empty','start','loop','palette','head','scale'])assert.equal(byId[id].status,'pass',`${id}: ${byId[id].detail}`);
  // frame 0 must reproduce the idle (with original head) almost exactly
  const f0=await load(resolve(jobsDir,job.id,'native','000.png'));assert.ok(diff(f0,kf.withHead)<4,`frame0 diff ${diff(f0,kf.withHead)}`);
  // original head pixels are restamped exactly at the tracked offset
  const fm=8,img=await load(resolve(jobsDir,job.id,'native',`${String(fm).padStart(3,'0')}.png`)),fj=(await import('./lib/common.mjs')).readJson;
  const meta=(await fj(resolve(jobsDir,job.id,'frames.json'))).frames[fm];
  assert.deepEqual(meta.headOffset,headMoves[fm],'head tracked to synthetic offset');
  let same=0,tot=0;for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){const i=(y*SIZE+x)*4;if(head.d[i+3]<128)continue;tot++;const tx=x+meta.headOffset.dx,ty=y+meta.headOffset.dy,o=(ty*SIZE+tx)*4;if(img.d[o]===head.d[i]&&img.d[o+1]===head.d[i+1]&&img.d[o+2]===head.d[i+2]&&img.d[o+3]>127)same++;}
  assert.equal(same,tot,'every original head pixel present');
  assert.ok(bounds(img).y1===bounds(kf.withHead).y1,'ground locked to idle baseline');
  const again=await setSelection(job.id,[0,3,6,9,12,15]);assert.equal((await getJob(job.id)).selected.length,6);assert.equal(again.status,'review');
  await assert.rejects(()=>setSelection(job.id,[0,1]),/at least 4/);
  console.log(`pose-studio test passed: ${N} synthetic frames, QA ${done.qa.status}`);
}finally{if(!process.env.KEEP)await removeJob(job.id);}
