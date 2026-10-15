import{FACINGS,type Facing}from'@shaman/shared';
export const MONSTER_ART_VFX:Readonly<Record<string,string>>={'yuki-onna':'frost',vodyanoy:'water',sending:'curse',"phi-krasue":"phi-krasue","ubume":"ubume","cheonyeo-gwishin":"cheonyeo-gwishin","mulgwishin":"mulgwishin","gumiho":"gumiho","chonggak-gwishin":"chonggak-gwishin","rusalka":"rusalka","utburdur":"utburdur","nu-gui":"nu-gui","shui-gui":"shui-gui","huli-jing":"huli-jing","nokken":"nokken","fossegrim":"fossegrim","mare":"mare"};
export function artFlightTip(face:Facing,style?:string){const a=(2-FACINGS.indexOf(face))*Math.PI/4;const r=style&&!['frost','water','curse'].includes(style)?56:64;return{x:80+r*Math.cos(a),y:80+r*Math.sin(a)};}
export function artFrame(face:Facing,elapsedMs:number,impact=false){return FACINGS.indexOf(face)*8+(impact?4+Math.min(3,Math.floor(Math.max(0,elapsedMs)/70)):Math.floor(Math.max(0,elapsedMs)/80)%4);}

export function monsterArtVfxUrl(style:string){return '/assets/monsters/'+(['frost','water','curse'].includes(style)?'vfx-07/':'vfx-08/')+style+'.png';}
