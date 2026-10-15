import {VFX_FAMILIES,type VfxFamily}from'@shaman/shared';
/** Shared pixel geometry for the world and review. Colours reuse the central three VFX families. */
export const ORB_PIXELS:readonly(readonly[number,number,number,number,'rim'|'body'|'core'|'spark'])[]=[
 [-3,-6,6,2,'rim'],[-5,-4,10,8,'rim'],[-3,4,6,2,'rim'],
 [-3,-4,6,8,'body'],[-4,-2,8,4,'body'],[-2,-3,4,5,'core'],
 [-3,-2,2,2,'core'],[1,1,2,2,'spark'],[-6,-5,2,2,'spark'],
];
export function orbPalette(family:VfxFamily){return{rim:0x18312e,body:VFX_FAMILIES[family].color,core:0xece3bf,spark:0xd6b46c};}
export const FOLKLORE_MOTIFS=['krasue-embers','frost-breath','shroud-leaves','mourning-hair','drowned-hand','nine-fox-flames','sleeve-knot','river-tresses','river-surge','shroud-wail','sent-curse','crimson-silk','drowning-grasp','fox-mirage','reed-lure','fiddle-wave','nightmare-claw'] as const;
export type ShotPixel=readonly[number,number,number,number,'rim'|'body'|'core'|'spark'];
/** Authored material silhouettes, not sacred glyphs. x points forward, y across the shot. */
export function folkloreShotPixels(motif:string|undefined,phase:number):readonly ShotPixel[]{
 if(!motif||!FOLKLORE_MOTIFS.some(m=>m===motif))return ORB_PIXELS;
 const out:ShotPixel[]=[],beat=Math.floor(phase*8),dot=(x:number,y:number,size=2,c:ShotPixel[4]='body')=>{out.push([Math.round(x),Math.round(y),size,size,c]);};
 const strand=(offset:number,length:number,amplitude:number,c:ShotPixel[4]='body')=>{for(let x=-length;x<=5;x+=2)dot(x,offset+Math.sin(x*.35+beat)*amplitude,2,c);};
 const arc=(x:number,r:number,c:ShotPixel[4]='core')=>{for(let y=-r;y<=r;y+=2)dot(x+Math.sqrt(Math.max(0,r*r-y*y))*.45,y,2,c);};
 switch(motif){
  case'krasue-embers':for(let i=0;i<5;i++){const x=-i*5;dot(x,Math.sin(i+beat)*4,3,i===0?'core':'body');dot(x-2,Math.sin(i+beat)*4-3,2,'spark');}break;
  case'frost-breath':for(let i=0;i<5;i++)for(let j=-i;j<=i;j+=2){dot(-16+i*5,j*3+beat%2,2,'core');if(i>1)dot(-18+i*5,j*3+2,2);}break;
  case'shroud-leaves':strand(-3,16,2,'core');strand(3,16,2,'core');for(let i=0;i<4;i++){dot(-18+i*6,Math.sin(i+beat)*9,3);dot(-16+i*6,Math.sin(i+beat)*9-2,2,'spark');}break;
  case'mourning-hair':for(let i=-2;i<=2;i++){strand(i*3,23,2,'rim');dot(4+i, i*3,2,'core');}break;
  case'drowned-hand':for(let i=0;i<5;i++){const y=(i-2)*4;for(let x=-8;x<=8-Math.abs(i-2)*3;x+=2)dot(x,y,3);}strand(0,22,2,'rim');dot(-4,-3,4,'core');break;
  case'nine-fox-flames':for(let i=0;i<9;i++){const y=(i-4)*3,x=-Math.abs(i-4)*3;dot(x,y,3,'spark');dot(x+1,y-2,2,'core');dot(x-4,y+Math.sin(beat+i)*2,2);}break;
  case'sleeve-knot':for(let i=-1;i<=1;i++)strand(i*4,14,1,'core');for(let i=0;i<6;i++)dot(Math.cos(i)*5,Math.sin(i)*5,3);break;
  case'river-tresses':for(let i=-1;i<=1;i++){strand(i*5,25,4);dot(-22+i*3, i*7,2,'core');}break;
  case'river-surge':arc(-7,12,'body');arc(-3,10);arc(2,7,'body');for(let i=0;i<6;i++)dot(-15+i*4,Math.sin(i+beat)*11,2,'core');break;
  case'shroud-wail':arc(-16,4);arc(-8,7);arc(0,11);strand(0,20,1,'rim');break;
  case'sent-curse':strand(0,28,1);for(let x=-24;x<=4;x+=7){dot(x,-3,4,'rim');dot(x+1,-2,2,'body');}dot(7,0,2,'spark');break;
  case'crimson-silk':for(let i of[-1,1]){strand(i*5,26,3);strand(i*5+2,26,3,'core');}break;
  case'drowning-grasp':for(let i=-1;i<=1;i++){strand(i*6,14,2);dot(5,i*6-2,4,'core');dot(8,i*6,2);}break;
  case'fox-mirage':for(let x=-4;x<=6;x+=2){const h=Math.max(1,7-Math.abs(x));dot(x,-h,2,'spark');dot(x,h,2,'spark');}dot(-4,-10,3,'core');dot(-4,8,3,'core');dot(3,-3,2,'rim');dot(3,3,2,'rim');for(let i=-1;i<=1;i++)strand(i*7,22,3,'spark');break;
  case'reed-lure':for(let i=-1;i<=1;i++){strand(i*5,28,1);for(let y=0;y<6;y+=2)dot(5-y,i*5-y,2,'spark');}arc(-14,10,'rim');break;
  case'fiddle-wave':for(let x of[-18,-8,2])arc(x,11,'core');strand(-13,23,1);strand(13,23,1);break;
  case'nightmare-claw':for(let i=-1;i<=1;i++){for(let x=-22;x<=5;x+=2)dot(x,i*6+Math.sin((x+22)/27*Math.PI)*4,3,'rim');dot(6,i*6,3,'body');dot(9,i*6-2,2,'core');}break;
 }
 return out;
}
/** Bake direction into integer pixel squares; never rotate the canvas or blur the motif. */
export function orientedShotPixels(motif:string|undefined,phase:number,dx:number,dy:number):readonly ShotPixel[]{
 const length=Math.hypot(dx,dy)||1,ux=dx/length,uy=dy/length;
 return folkloreShotPixels(motif,phase).map(([x,y,w,h,c])=>[Math.round(x*ux-y*uy),Math.round(x*uy+y*ux),w,h,c] as const);
}
/** Linear travel to the server's aimed position; no homing, collision or client damage authority. */
export function orbTravel(from:{x:number;y:number},to:{x:number;y:number},elapsedMs:number,flightMs:number){
 const progress=Math.max(0,Math.min(1,elapsedMs/Math.max(1,flightMs)));
 return{x:Math.round(from.x+(to.x-from.x)*progress),y:Math.round(from.y+(to.y-from.y)*progress),progress,visible:elapsedMs>=0&&elapsedMs<Math.max(1,flightMs)};
}
