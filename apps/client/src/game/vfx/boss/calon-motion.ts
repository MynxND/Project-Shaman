import {CALON_SKILLS,type CalonSkill} from '@shaman/shared';
export const CALON_FACES=['south','south-west','west','north-west','north','north-east','east','south-east'] as const;
interface Cue{skill:string;warnAt:number;startsAt:number;endsAt:number;actor:string}
/** Gait advances by ground travel, not wall time; direction switches retain support phase. */
export class CalonMotion {
  phase=0;private last:{x:number;y:number}|null=null;
  sample(x:number,y:number,moving:boolean){if(this.last&&moving){const d=Math.hypot(x-this.last.x,y-this.last.y);if(d<2)this.phase=(this.phase+d/1.2)%1;}this.last={x,y};return Math.floor(this.phase*16)%16;}
  reset(){this.last=null;this.phase=0;}
}
export function calonActorFrame(mode:string,skill:string,actionAt:number,now:number,facing:string,cues:Iterable<Cue>,walkFrame=0){
  const face=Math.max(0,(CALON_FACES as readonly string[]).indexOf(facing)),data=CALON_SKILLS[skill as CalonSkill];
  if(mode==='reposition')return 8+face*16+walkFrame;
  if(mode==='transition')return 136+face*16+Math.min(15,Math.max(0,Math.floor((now-actionAt)/2600*16)));
  if(!data||!['windup','active','ultimate','recovery'].includes(mode))return face;
  const a=[...cues].filter(h=>h.skill===skill&&h.warnAt>=actionAt&&now>=h.warnAt);
  const endOf=(h:Cue)=>h.actor==='spore'?Math.min(h.endsAt,h.startsAt+500):h.endsAt;
  const next=a.filter(h=>now<endOf(h)).sort((a,b)=>a.startsAt-b.startsAt)[0];
  let frame=0;
  if(mode==='ultimate')frame=4+Math.floor(now/110)%6;
  if(next&&now<next.startsAt)frame=Math.min(9,Math.floor((now-next.warnAt)/Math.max(1,next.startsAt-next.warnAt)*10));
  else if(next)frame=10+Math.min(2,Math.floor((now-next.startsAt)/Math.max(1,next.endsAt-next.startsAt)*3));
  else if(mode==='windup')frame=Math.min(9,Math.floor((now-actionAt)/Math.max(1,data.tell)*10));
  else if(mode==='active'&&!a.length)frame=10+Math.min(2,Math.max(0,Math.floor((now-actionAt-data.tell)/Math.max(1,data.active)*3)));
  else if(mode==='active'&&a.length){const last=Math.max(...a.map(h=>h.endsAt));frame=13+Math.min(2,Math.max(0,Math.floor((now-last)/200*3)));}
  else if(mode==='recovery'){const end=a.length?Math.max(...a.map(endOf)):actionAt+data.tell+data.active;frame=13+Math.min(2,Math.max(0,Math.floor((now-end)/data.recovery*3)));}
  return 136+face*16+frame;
}
