import {BODY_DIRECTIONS,type NativePoint} from './body-eight-model';
export type WalkFrame={url:string;sha256:string;neckPivot:NativePoint;bodyOrigin:NativePoint};
export type WalkDirection={direction:string;headUrl:string;headSha256:string;headPivot:NativePoint;frames:WalkFrame[]};
export type WalkEightManifest={version:'walk-eight/1';name:string;bodySet:string;fps:number;loop:true;directions:WalkDirection[];credits:{spent:number;cap:number};sheet:{url:string;sha256:string;frameWidth:128;frameHeight:128}};
/** One-shot V3 action (attack, cast) in the same per-frame neck-pivot format as the walk. */
export type ActionEightManifest={version:'action-eight/1';action:'attack'|'cast';name:string;bodySet:string;fps:number;loop:false;directions:WalkDirection[];credits:{spent:number;cap:number};sheet:{url:string;sha256:string;frameWidth:128;frameHeight:128}};
const point=(p:NativePoint)=>p&&Number.isInteger(p.x)&&Number.isInteger(p.y)&&p.x>=0&&p.x<128&&p.y>=0&&p.y<128;
const sha=(h:string)=>/^[a-f0-9]{64}$/.test(h);
function checkDirections(directions:WalkDirection[],prefix:string){
 const count=directions[0]!.frames.length;
 for(const[i,d]of directions.entries()){
  if(d.direction!==BODY_DIRECTIONS[i]||d.headUrl!==`/assets/character-v3/head-eight-01/${d.direction}.png`||!sha(d.headSha256)||!point(d.headPivot)||d.frames.length!==count||count<4)throw Error('ข้อมูลทิศของท่าไม่ถูกต้อง');
  for(const f of d.frames)if(!f.url.startsWith(`${prefix}${d.direction}-`)||!sha(f.sha256)||!point(f.neckPivot)||!point(f.bodyOrigin))throw Error('ข้อมูลเฟรมท่าไม่ถูกต้อง');
 }
}
export function parseWalkEight(value:unknown):WalkEightManifest{
 const m=value as WalkEightManifest;
 if(!m||m.version!=='walk-eight/1'||m.directions?.length!==8||m.loop!==true||!(m.fps>0&&m.fps<=24)||!sha(m.sheet?.sha256))throw Error('ท่าเดินแปดทิศไม่ตรงสเปก');
 checkDirections(m.directions,'/assets/character-v3/walk-eight-02/');
 return m;
}
export function parseActionEight(value:unknown,action:'attack'|'cast'):ActionEightManifest{
 const m=value as ActionEightManifest;
 if(!m||m.version!=='action-eight/1'||m.action!==action||m.directions?.length!==8||m.loop!==false||!(m.fps>0&&m.fps<=24)||!sha(m.sheet?.sha256))throw Error('ท่าแปดทิศไม่ตรงสเปก');
 checkDirections(m.directions,`/assets/character-v3/actions-eight-02/${action}/`);
 return m;
}
/** Head follows the frame's neck pivot; body never moves when the head offset changes. */
export function walkHeadPosition(d:WalkDirection,frame:number,offset:NativePoint={x:0,y:0}):NativePoint{
 const f=d.frames[frame%d.frames.length]!;
 return{x:f.neckPivot.x-d.headPivot.x+Math.round(offset.x),y:f.neckPivot.y-d.headPivot.y+Math.round(offset.y)};
}
