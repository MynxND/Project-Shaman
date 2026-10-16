import {writeFileSync} from 'node:fs';
import {CalonInfectionState} from '../../../packages/schema/dist/index.js';
import {CALON_SKILLS,FACINGS} from '../../../packages/shared/dist/index.js';
import {fixture} from './party-test.mjs';
const clips=[];
for(const[skill,rule]of Object.entries(CALON_SKILLS))for(const face of FACINGS){
 const f=fixture();if(rule.phase>1){f.e.review('p2',{action:'phase',phase:rule.phase});f.run(3650);}
 const p=f.state.players.get('p2'),a=Math.PI/2-FACINGS.indexOf(face)*Math.PI/4;p.x=24+Math.cos(a)*6;p.y=20+Math.sin(a)*6;
 if(skill==='soul-harvest'){const n=new CalonInfectionState();n.stacks=1;n.until=f.now()+14000;f.e.state.infections.set('p2',n);}
 f.e.review('p2',{action:'skill',skill});const start=f.now(),duration=skill==='night-of-a-thousand-curses'?50000:12000,actor=[],cues=new Map(),samples=[];
 for(let at=0;at<=duration;at+=50){const hazards=[...f.e.state.hazards.values()].map(h=>({...h.toJSON(),warnAt:h.warnAt-start,startsAt:h.startsAt-start,endsAt:h.endsAt-start}));for(const h of hazards)cues.set(h.id,h);
  samples.push({at,cues:hazards,connections:[...f.e.state.connections.values()].map(n=>({id:n.id,broken:n.broken})),players:[...f.state.players.entries()].map(([id,p])=>({id,x:p.x,y:p.y,infected:f.e.state.infections.has(id)}))});
  actor.push({at,x:f.e.body.x,y:f.e.body.y,facing:f.e.body.facing,mode:f.e.state.mode,stage:f.e.state.ultimateStage});f.step();
 }
 clips.push({skill,face,duration,cues:[...cues.values()],actor,samples});
}
writeFileSync('apps/client/public/boss-review/calon-arang/clips-v2.json',JSON.stringify(clips));console.log('Recorded v2',clips.length,'timelines, sampled moving geometry');
