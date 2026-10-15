import{FACINGS,type Facing}from'@shaman/shared';
export const MONSTER_ART_VFX:Readonly<Record<string,'frost'|'water'|'curse'>>={'yuki-onna':'frost',vodyanoy:'water',sending:'curse'};
export function artFlightTip(face:Facing){const a=(2-FACINGS.indexOf(face))*Math.PI/4;return{x:80+64*Math.cos(a),y:80+64*Math.sin(a)};}
export function artFrame(face:Facing,elapsedMs:number,impact=false){return FACINGS.indexOf(face)*8+(impact?4+Math.min(3,Math.floor(Math.max(0,elapsedMs)/70)):Math.floor(Math.max(0,elapsedMs)/80)%4);}
