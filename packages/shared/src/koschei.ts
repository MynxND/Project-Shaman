import type { Position } from './world.js';
/** Boss5 original game adaptation; all balance and relic geography are provisional. */
export const KOSCHEI_HP=21000;
export const KOSCHEI_CONTACT=.28;
export const KOSCHEI_RING_START=1.2;
export const KOSCHEI_RELICS=[
  {id:'oak',name:'โอ๊กผนึก',x:16,y:27}, {id:'chest',name:'หีบความตาย',x:20,y:30},
  {id:'hare',name:'กระต่ายวิญญาณ',x:24,y:31}, {id:'duck',name:'เป็ดวิญญาณ',x:28,y:30},
  {id:'egg',name:'ไข่ซ่อนมรณะ',x:32,y:27},
] as const;
export const KOSCHEI_NEEDLE={x:24,y:25};
const skill=(name:string,phase:number,intent:string,target:string,shape:string,tell:number,active:number,recovery:number,cooldown:number,damage:number,counter:string,status='')=>({name,phase,intent,target,shape,tell,active,recovery,cooldown,damage,status,counter,animation:'cast',audio:'cold-bell',layers:['ground','charge','main','trail','contact','secondary','aftermath'],cancel:'phase/death/wipe; relic opening interrupts rebirth; needle interrupts ultimate',ai:'ready cooldown deterministic phase deck, living target in court'});
export const KOSCHEI_SKILLS={
  'gravefrost-spear':skill('หอกเหมันต์สุสาน',1,'staggered spear fan','three locked lanes','capsule',1400,400,1200,8000,65,'move between spear lanes'),
  'deathly-chains':skill('โซ่มรณะเยือกแข็ง',1,'curse bound to current death vessel','current relic to marked player','capsule',1300,800,1400,9000,60,'open the current relic to cancel its chain; otherwise sidestep'),
  'necropolis-guard':skill('องครักษ์สุสาน',1,'independent spectral guards','two flank sources','charge',1500,450,1500,11000,70,'sidestep each spectral guard'),
  'soul-lance':skill('ทวนวิญญาณ',1,'long narrow staff ray','nearest locked target','capsule',1200,350,1300,7500,80,'move sideways from the staff line'),
  'immortal-rebirth':skill('คืนชีพอมตะ',2,'bounded healing and relic interrupt','non-damaging healing channel','ritual',1600,900,1600,15000,0,'open next relic to stop rebirth','heal channel'),
  'cursed-needle':skill('เข็มคำสาป',2,'needles from current death vessel','target locked before each tell','capsule',1200,300,1400,10000,55,'sidestep every separately aimed needle'),
  'royal-necromancy':skill('บัญชาราชันอสุภ',2,'delayed tomb eruptions','opened relic sites','disk',1500,600,1500,12000,75,'leave opened tomb sites toward the next relic'),
  'deathstorm':skill('พายุมรณะ',3,'remaining death vessels project frost lanes','relic sources to marked target','capsule',1500,600,1500,13000,80,'open current relic to cancel its lane; cross between separate releases'),
  'throne-of-bones':skill('บัลลังก์กระดูก',3,'remaining vessels defend their sealed death','short source-centered sectors','sector',1600,500,1600,14000,85,'open the next vessel to remove its short sector'),
  'soul-severance':skill('สะบั้นดวงวิญญาณ',3,'one committed defense of next relic','current death vessel','charge',2000,700,1600,12000,85,'open the threatened relic before contact to interrupt; avoid committed path'),
  'the-last-needle':skill('เข็มสุดท้ายแห่งมรณะ',3,'five-stage nested death counter','remaining nested death vessels','disk',1600,800,2000,48000,190,'open oak/chest/hare/duck/egg and destroy needle; unfinished vessels erupt sequentially'),
} as const;
export type KoscheiSkill=keyof typeof KOSCHEI_SKILLS;
export const inKoscheiCourt=(p:Position)=>p.x>=7&&p.x<=41&&p.y>=11&&p.y<=38;
export const koscheiClamp=(p:Position):Position=>({x:Math.max(10,Math.min(38,p.x)),y:Math.max(14,Math.min(35,p.y))});
export interface KoscheiHazard {shape:string;x:number;y:number;toX:number;toY:number;radius:number;width:number;angle:number;arc:number;startsAt:number;endsAt:number}
export const koscheiProgress=(h:KoscheiHazard,t:number)=>Math.max(0,Math.min(1,(t-h.startsAt)/Math.max(1,h.endsAt-h.startsAt)));
export function koscheiSegment(p:Position,a:Position,b:Position){const x=b.x-a.x,y=b.y-a.y,q=Math.max(0,Math.min(1,((p.x-a.x)*x+(p.y-a.y)*y)/(x*x+y*y||1)));return Math.hypot(p.x-a.x-x*q,p.y-a.y-y*q);}
export function koscheiHit(h:KoscheiHazard,p:Position,now:number,previous=now){
  if(h.shape==='ritual')return false;
  const r=h.radius+KOSCHEI_CONTACT,d=Math.hypot(p.x-h.x,p.y-h.y);
  if(h.shape==='finale')return d<=r&&Math.hypot(p.x-24,p.y-35)>2.8+KOSCHEI_CONTACT;
  if(h.shape==='capsule')return koscheiSegment(p,h,{x:h.toX,y:h.toY})<=h.width+KOSCHEI_CONTACT;
  if(h.shape==='charge'){const at=(t:number)=>({x:h.x+(h.toX-h.x)*koscheiProgress(h,t),y:h.y+(h.toY-h.y)*koscheiProgress(h,t)});return koscheiSegment(p,at(previous),at(now))<=h.width+KOSCHEI_CONTACT;}
  if(h.shape==='ring')return d>=Math.max(0,KOSCHEI_RING_START+koscheiProgress(h,previous)*(h.radius-KOSCHEI_RING_START)-h.width-KOSCHEI_CONTACT)&&d<=KOSCHEI_RING_START+koscheiProgress(h,now)*(h.radius-KOSCHEI_RING_START)+h.width+KOSCHEI_CONTACT;
  return d<=r&&(h.shape!=='sector'||Math.abs(Math.atan2(Math.sin(Math.atan2(p.y-h.y,p.x-h.x)-h.angle),Math.cos(Math.atan2(p.y-h.y,p.x-h.x)-h.angle)))<=h.arc/2);
}
