import type {Facing} from './character.js';
export type BossMotionAction='idle'|'walk'|'attack'|'cast'|'stagger'|'transition'|'death';
export interface BossMotionClip{
 action:BossMotionAction;facing:Facing;frames:readonly number[];sourceHashes:readonly string[];
 frameMs:number;loop:boolean;impact?:number;activeEnd?:number;stride?:number;
 support?:readonly ('left'|'right'|'both'|'air')[];
}
export const BOSS_MOTION_MIN_POSES:Record<BossMotionAction,number>={idle:8,walk:16,attack:16,cast:16,stagger:8,transition:12,death:12};
/** Structural checks cannot approve anatomy, planting or artistic continuity. */
export function validateBossMotionClip(c:BossMotionClip){
 const errors:string[]=[];const n=c.frames.length;
 if(n<BOSS_MOTION_MIN_POSES[c.action])errors.push('insufficient authored poses for action');
 if(!n||!Number.isFinite(c.frameMs)||c.frameMs<=0)errors.push('empty clip or invalid source duration');
 if(c.sourceHashes.length!==n||new Set(c.sourceHashes).size!==n)errors.push('held/duplicate artwork does not count as unique poses');
 if(['attack','cast'].includes(c.action)&&(c.impact===undefined||c.activeEnd===undefined||c.impact<1||c.activeEnd<c.impact||c.activeEnd>=n-1))errors.push('missing windup/contact/recovery boundaries');
 if(c.action==='walk'&&c.support?.length!==n)errors.push('every walk frame needs an explicit support-foot record');
 if(c.action==='walk'&&(!c.stride||c.stride<=0||!c.support?.includes('left')||!c.support.includes('right')))errors.push('grounded walk needs both support legs and a world stride');
 return errors;
}
/** Phase is distance based; a direction change never restarts support phase. */
export class BossGaitClock{
 phase=0;private last:{x:number;y:number}|undefined;
 sample(x:number,y:number,moving:boolean,stride:number){
  if(this.last&&moving&&stride>0){const distance=Math.hypot(x-this.last.x,y-this.last.y);if(distance<2)this.phase=(this.phase+distance/stride)%1;}
  this.last={x,y};return this.phase;
 }
 reset(){this.phase=0;this.last=undefined;}
}
export function sampleBossLoop(c:BossMotionClip,elapsed:number,phase?:number){
 const n=c.frames.length;if(!n)return 0;
 const index=phase!==undefined?Math.floor(((phase%1+1)%1)*n):c.loop?Math.floor(Math.max(0,elapsed)/c.frameMs)%n:Math.min(n-1,Math.floor(Math.max(0,elapsed)/c.frameMs));
 return c.frames[index]!;
}
/** Clock retiming changes pose duration, never authoritative damage or geometry. */
export function sampleBossAttack(c:BossMotionClip,now:number,clock:{warnAt:number;contactAt:number;activeEndsAt:number;recoveryEndsAt:number}){
 const n=c.frames.length,impact=c.impact??0,activeEnd=c.activeEnd??impact;
 const phase=(a:number,z:number,first:number,last:number)=>first+Math.min(last-first,Math.max(0,Math.floor((now-a)/Math.max(1,z-a)*(last-first+1))));
 const index=now<clock.contactAt?phase(clock.warnAt,clock.contactAt,0,Math.max(0,impact-1)):now<clock.activeEndsAt?phase(clock.contactAt,clock.activeEndsAt,impact,activeEnd):phase(clock.activeEndsAt,clock.recoveryEndsAt,Math.min(n-1,activeEnd+1),n-1);
 return c.frames[Math.max(0,Math.min(n-1,index))]??0;
}
