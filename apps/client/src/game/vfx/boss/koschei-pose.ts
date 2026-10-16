import { KOSCHEI_SKILLS, type KoscheiSkill } from '@shaman/shared';
export const KOSCHEI_FACING_ORDER = ['south','south-west','west','north-west','north','north-east','east','south-east'] as const;
interface Cue { skill:string; warnAt:number; startsAt:number; endsAt:number }
/** Real scene and recorded preview use the same pose/contact mapping, including each hunt rush. */
export function koscheiPose(mode:string,skill:string,actionAt:number,now:number,facing:string,hazards:Iterable<Cue>){
  let age=now-actionAt,tell=KOSCHEI_SKILLS[skill as KoscheiSkill]?.tell??1400;
  if(skill==='soul-severance'){
    const charge=[...hazards].filter(h=>h.skill===skill&&now>=h.warnAt&&now<=h.endsAt).sort((a,b)=>a.startsAt-b.startsAt)[0];
    if(charge){age=now-charge.warnAt;tell=charge.startsAt-charge.warnAt;mode=now<charge.startsAt?'windup':'active';}
  }
  const index=Math.max(0,(KOSCHEI_FACING_ORDER as readonly string[]).indexOf(facing));
  const casting=['windup','active','ultimate','recovery'].includes(mode);
  const beat=mode==='windup'?Math.min(1,Math.floor(Math.max(0,age)/Math.max(1,tell/2))):mode==='active'||mode==='ultimate'?2:3;
  return {casting,actorFrame:casting?8+index*4+beat:index,previewFrame:casting?index*4+beat:index};
}
