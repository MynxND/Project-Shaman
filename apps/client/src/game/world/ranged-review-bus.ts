import type{Facing}from'@shaman/shared';
export const rangedReviewBus=new EventTarget();
export interface RangedCase{kind:string;facing:Facing;outcome:'hit'|'dodge'|'outside'}
export interface RangedResult extends RangedCase{caseId:string;ok:boolean;issues:string[];range:number;flightMs:number;facingSeen?:string;frame?:number;launchDelay?:number;damageDelay?:number;arrivalDelta?:number;travelled?:number;image?:string}
export function reviewEmit(type:string,detail:unknown){rangedReviewBus.dispatchEvent(new CustomEvent(type,{detail}));}
