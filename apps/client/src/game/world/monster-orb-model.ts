import {VFX_FAMILIES,type VfxFamily}from'@shaman/shared';
/** Shared pixel geometry for the world and review. Colours reuse the central three VFX families. */
export const ORB_PIXELS:readonly(readonly[number,number,number,number,'rim'|'body'|'core'|'spark'])[]=[
 [-3,-6,6,2,'rim'],[-5,-4,10,8,'rim'],[-3,4,6,2,'rim'],
 [-3,-4,6,8,'body'],[-4,-2,8,4,'body'],[-2,-3,4,5,'core'],
 [-3,-2,2,2,'core'],[1,1,2,2,'spark'],[-6,-5,2,2,'spark'],
];
export function orbPalette(family:VfxFamily){return{rim:0x18312e,body:VFX_FAMILIES[family].color,core:0xece3bf,spark:0xd6b46c};}
/** Linear travel to the server's aimed position; no homing, collision or client damage authority. */
export function orbTravel(from:{x:number;y:number},to:{x:number;y:number},elapsedMs:number,flightMs:number){
 const progress=Math.max(0,Math.min(1,elapsedMs/Math.max(1,flightMs)));
 return{x:Math.round(from.x+(to.x-from.x)*progress),y:Math.round(from.y+(to.y-from.y)*progress),progress,visible:elapsedMs>=0&&elapsedMs<Math.max(1,flightMs)};
}
