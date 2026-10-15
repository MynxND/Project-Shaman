/** Visual clock only. Neither speed nor pause reaches shared movement/gameplay state. */
export interface WaterClock { seconds:number }
export type WaterMode='river'|'pond'|'swamp'|'waterfall';
export interface WaterControls {mode:WaterMode|'map';speed:number;rates:[number,number,number,number];ripple:number;color:[number,number,number];shore:boolean;paused:boolean;before:boolean;step:number;flow:[number,number]}
// River/fall native pixels per second; pond/swamp oscillator rates. Independently configurable.
export const waterDefaults=():WaterControls=>({mode:'map',speed:1,rates:[8,.14,.07,40],ripple:.55,color:[.10,.24,.25],shore:true,paused:false,before:false,step:0,flow:[0,0]});
export function advanceWater(clock:WaterClock,deltaMs:number,paused:boolean,speed:number,step=0){
 if(!paused)clock.seconds+=Math.max(0,deltaMs)/1000*Math.max(0,speed);
 clock.seconds+=Math.max(0,step);
 return clock.seconds;
}
export function coverZoom(viewW:number,viewH:number,mapW:number,mapH:number){return Math.max(viewW/mapW,viewH/mapH);}
/** Stable ripple phases, independent of camera, gameplay RNG and render FPS. */
export function waterSeed(mapId:string,x:number,y:number){let n=2166136261;for(const c of `${mapId}:${x}:${y}`)n=Math.imul(n^c.charCodeAt(0),16777619);return(n>>>0)/4294967296;}
