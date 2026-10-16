import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {CalonMotion,calonActorFrame,CALON_FACES} from '../../../apps/client/src/game/vfx/boss/calon-motion.ts';
const m=new CalonMotion();let checks=0;const check=(v,s)=>{assert(v,s);checks++;};
m.sample(0,0,true);check(m.sample(.3,0,true)===4,'quarter stride by travel');const phase=m.phase;
for(const face of CALON_FACES){const f=calonActorFrame('reposition','',0,0,face,[],4);check(f===8+CALON_FACES.indexOf(face)*16+4,'direction retains support pose');check(m.phase===phase,'facing does not reset gait');}
check(m.sample(.3,0,false)===4,'stopping freezes gait');check(m.sample(30,30,true)===4,'teleport does not animate huge stride');m.reset();check(m.phase===0,'reset clears gait');
const cue={actor:'body',skill:'plague-bloom',warnAt:1000,startsAt:2400,endsAt:2900};
for(const face of CALON_FACES){const start=136+CALON_FACES.indexOf(face)*16;check(calonActorFrame('windup','plague-bloom',1000,1000,face,[cue])===start,'cast begins at0');check(calonActorFrame('windup','plague-bloom',1000,2399,face,[cue])===start+9,'no early release');check(calonActorFrame('active','plague-bloom',1000,2400,face,[cue])===start+10,'release is hit start');check(calonActorFrame('recovery','plague-bloom',1000,4100,face,[cue])===start+15,'recovery completes');}
writeFileSync('docs/design/bosses/calon-arang/evidence/motion.json',JSON.stringify({checks,status:'pass',strideWorldUnits:1.2,releaseFrame:10},null,2));console.log('PASS',checks,'motion checks');
