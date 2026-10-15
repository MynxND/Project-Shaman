import {FACINGS, type Facing} from '@shaman/shared';

export type MonsterAction='idle'|'move'|'attack'|'hurt'|'death';
export interface MonsterClip {row:number;frames:number;fps:number;loop:boolean;indices?:number[];reusedFrom?:string}
export interface MonsterSheet {
 image:string;frameWidth:number;frameHeight:number;columns:number;anchor:{x:number;y:number};
 animations:Record<MonsterAction,MonsterClip>;
 directions?:Record<Facing,Record<MonsterAction,MonsterClip>>;
 scale?:number;
 /** Zero-based visual impact pose, independent of recovery length. */
 attackImpactFrame?:number;
}
export const monsterFacing=(value:string):Facing=>(FACINGS as readonly string[]).includes(value)?value as Facing:'east';
export const legacyMonsterFlip=(value:string)=>value==='west'||value==='south-west'||value==='north-west';
export function monsterClip(sheet:MonsterSheet,action:MonsterAction,facing:Facing){return sheet.directions?.[facing]?.[action]??sheet.animations[action];}
export function monsterFrames(sheet:MonsterSheet,clip:MonsterClip){return clip.indices??Array.from({length:clip.frames},(_,i)=>clip.row*sheet.columns+i);}
export function monsterAnimationKey(kind:string,action:MonsterAction,sheet:MonsterSheet,facing:Facing){return `monster:${kind}:${action}${sheet.directions?':'+facing:''}`;}
/** Validate all eight real views; incomplete directional art never falls back to a mirrored front. */
export function validateMonsterSheet(sheet:MonsterSheet,totalFrames?:number){
 if(!sheet.image||!Number.isInteger(sheet.frameWidth)||sheet.frameWidth<1||!Number.isInteger(sheet.frameHeight)||sheet.frameHeight<1||!Number.isInteger(sheet.columns)||sheet.columns<1)throw Error('Invalid monster sheet dimensions');
 if(sheet.anchor.x<0||sheet.anchor.y<0||sheet.anchor.x>=sheet.frameWidth||sheet.anchor.y>=sheet.frameHeight)throw Error('Invalid monster anchor');
 for(const facing of sheet.directions?FACINGS:['east'] as const){
  const clips=sheet.directions?sheet.directions[facing]:sheet.animations;if(!clips)throw Error('Missing monster direction '+facing);
  for(const action of ['idle','move','attack','hurt','death'] as const){
   const clip=clips[action];if(!clip||!Number.isInteger(clip.frames)||clip.frames<1||!Number.isFinite(clip.fps)||clip.fps<=0)throw Error('Missing monster action '+facing+':'+action);
   const frames=monsterFrames(sheet,clip);if(frames.length!==clip.frames||frames.some(f=>!Number.isInteger(f)||f<0||(totalFrames!==undefined&&f>=totalFrames)))throw Error('Invalid monster frame indices');
   if((action==='attack'||action==='death')&&clip.loop)throw Error('Monster attack/death must finish');
  }
 }
}
