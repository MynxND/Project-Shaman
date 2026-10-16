import type { Position } from './world.js';
/** Boss15: provisional original game choreography, not canonical folklore. */
export const CALON_HP=22000, CALON_CONTACT=.28, CALON_RING_START=1.2;
export const CALON_SOURCE={x:24,y:26};
export const CALON_WELLS=[{id:'west',x:12,y:33},{id:'east',x:36,y:33}] as const;
export const CALON_CONNECTIONS=[{id:'west',x:18.5,y:21,from:{x:15,y:24},to:{x:22,y:18}},{id:'north',x:27,y:21,from:{x:22,y:18},to:{x:32,y:24}},{id:'east',x:28.5,y:27.5,from:{x:32,y:24},to:{x:25,y:31}},{id:'south',x:20,y:27.5,from:{x:25,y:31},to:{x:15,y:24}}] as const;
const skill=(name:string,phase:number,shape:string,target:string,tell:number,active:number,recovery:number,cooldown:number,damage:number)=>({name,phase,shape,target,tell,active,recovery,cooldown,damage,intent:target,status:'bounded infection on bloom/swarm/siphon',animation:'cast',audio:'plague-chime',counter:'leave locked footprint; sever network; cleanse at quarantine wells',layers:['ground','charge','main','trail','contact','secondary','aftermath'],cancel:'phase/death/wipe and purified ultimate',ai:'ready cooldown deterministic phase deck, living target in court'});
export const CALON_SKILLS={
 'plague-bloom':skill('ดอกโรคระบาด',1,'disk','locked target bloom',1400,500,1200,8000,55),
 'cursed-effigy':skill('หุ่นสาปแช่ง',1,'capsule','crossed effigy threads',1400,500,1400,9000,60),
 'spirit-swarm':skill('ฝูงผีเสื้อวิญญาณ',1,'capsule','three staggered moth lanes',1500,400,1500,11000,60),
 'black-ritual':skill('พิธีดำ',1,'ring','body ash annulus',1600,900,1500,12000,65),
 'graveyard-procession':skill('ขบวนสุสาน',2,'charge','two independently moving funeral spirits',1500,600,1600,12000,70),
 'soul-withering':skill('วิญญาณเหี่ยวเฉา',2,'capsule','locked siphon ray',1500,600,1400,10000,70),
 'cursed-altar':skill('แท่นคำสาป',2,'disk','target offsets spare quarantine routes',1600,600,1500,12000,75),
 'thousand-cursed-hands':skill('พันมืออาถรรพ์',3,'sector','ordered hand quadrants',1600,500,1600,14000,80),
 'plague-eclipse':skill('คราสโรคระบาด',3,'ring','three expanding moth bands',1600,900,1600,14000,80),
 'soul-harvest':skill('เก็บเกี่ยววิญญาณ',3,'charge','three separately locked harvest rushes',1500,500,1600,12000,85),
 'night-of-a-thousand-curses':skill('ราตรีพันคำสาป',3,'finale','five stages and live sever/purify challenge',1600,800,2000,48000,180),
} as const;
export type CalonSkill=keyof typeof CALON_SKILLS;
export const inCalonCourt=(p:Position)=>p.x>=7&&p.x<=41&&p.y>=11&&p.y<=38;
export const calonClamp=(p:Position):Position=>({x:Math.max(10,Math.min(38,p.x)),y:Math.max(14,Math.min(35,p.y))});
export interface CalonHazard {shape:string;x:number;y:number;toX:number;toY:number;radius:number;width:number;angle:number;arc:number;startsAt:number;endsAt:number}
export const calonProgress=(h:CalonHazard,t:number)=>Math.max(0,Math.min(1,(t-h.startsAt)/Math.max(1,h.endsAt-h.startsAt)));
export function calonSegment(p:Position,a:Position,b:Position){const x=b.x-a.x,y=b.y-a.y,q=Math.max(0,Math.min(1,((p.x-a.x)*x+(p.y-a.y)*y)/(x*x+y*y||1)));return Math.hypot(p.x-a.x-x*q,p.y-a.y-y*q);}
export function calonHit(h:CalonHazard,p:Position,now:number,previous=now){
  const r=h.radius+CALON_CONTACT,d=Math.hypot(p.x-h.x,p.y-h.y);
  if(h.shape==='finale')return d<=r&&Math.hypot(p.x-24,p.y-35)>2.8+CALON_CONTACT;
  if(h.shape==='capsule')return calonSegment(p,h,{x:h.toX,y:h.toY})<=h.width+CALON_CONTACT;
  if(h.shape==='charge'){const at=(t:number)=>({x:h.x+(h.toX-h.x)*calonProgress(h,t),y:h.y+(h.toY-h.y)*calonProgress(h,t)});return calonSegment(p,at(previous),at(now))<=h.width+CALON_CONTACT;}
  if(h.shape==='ring')return d>=Math.max(0,CALON_RING_START+calonProgress(h,previous)*(h.radius-CALON_RING_START)-h.width-CALON_CONTACT)&&d<=CALON_RING_START+calonProgress(h,now)*(h.radius-CALON_RING_START)+h.width+CALON_CONTACT;
  return d<=r&&(h.shape!=='sector'||Math.abs(Math.atan2(Math.sin(Math.atan2(p.y-h.y,p.x-h.x)-h.angle),Math.cos(Math.atan2(p.y-h.y,p.x-h.x)-h.angle)))<=h.arc/2);
}
