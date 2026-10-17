import assert from 'node:assert/strict';
import {FACINGS,directionFor,normalizedMovement,advancePhase,phaseFrames} from './lib/gait.mjs';
for(let i=0;i<8;i++)assert.equal(directionFor(Math.cos(i*Math.PI/4),Math.sin(i*Math.PI/4)),FACINGS[i]);
assert.equal(directionFor(0,0),null);assert.ok(Math.abs(Math.hypot(...Object.values(normalizedMovement(1,1)))-1)<1e-12);
let phase=.35;for(let i=0;i<80;i++){directionFor(Math.cos(i),Math.sin(i));phase=advancePhase(phase,0,100,100);}assert.ok(Math.abs(phase-.35)<1e-12);
assert.ok(Math.abs(advancePhase(.9,.2,100,100)-.1)<1e-12);
assert.deepEqual(phaseFrames([0,.1,.2,.3,.4,.5,.6,.7],{frameCount:24}),[0,2,5,7,10,12,14,17]);
assert.throws(()=>phaseFrames([0,0,0,0,0,0,0,0],{frameCount:24}));console.log('Eight facings, diagonal normalization, phase continuity and gait timestamp guards pass.');
