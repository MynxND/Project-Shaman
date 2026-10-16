import Phaser from 'phaser';
import {CALON_CONTACT as P,CALON_RING_START,calonProgress,WORLD_UNIT_PX as U,type CalonHazard} from '@shaman/shared';
import {sweptRingRadii} from './boss-contact-footprint';
type Point={x:number;y:number};
/** Clip authored ground material, never organic geometry or gameplay. Court clipping keeps arrival clear. */
export function drawCalonMaterialMask(g:Phaser.GameObjects.Graphics,h:CalonHazard,now:number,warning:boolean,step:number){
  g.clear().fillStyle(0xffffff,1);
  const clip=(poly:Point[])=>{
    for(const [axis,bound,sign]of[['x',7*U,1],['x',41*U,-1],['y',11*U,1],['y',38*U,-1]]as const){
      const out:Point[]=[];for(let i=0;i<poly.length;i++){const a=poly[i]!,b=poly[(i+1)%poly.length]!,ia=(a[axis]-bound)*sign>=0,ib=(b[axis]-bound)*sign>=0;
        if(ia)out.push(a);if(ia!==ib){const t=(bound-a[axis])/(b[axis]-a[axis]);out.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});}}
      poly=out;if(!poly.length)return;
    }
    for(let i=1;i<poly.length-1;i++)g.fillTriangle(poly[0]!.x,poly[0]!.y,poly[i]!.x,poly[i]!.y,poly[i+1]!.x,poly[i+1]!.y);
  };
  const circle=(x:number,y:number,r:number)=>Array.from({length:64},(_,i)=>({x:x+Math.cos(i*Math.PI/32)*r,y:y+Math.sin(i*Math.PI/32)*r}));
  const x=h.x*U,y=h.y*U,r=(h.radius+P)*U,w=(h.width+P)*U;
  if(h.shape==='ring'){
    const band=warning?{inner:Math.max(0,CALON_RING_START-h.width-P),outer:h.radius+h.width+P}:sweptRingRadii(h,now,CALON_RING_START,P,step);
    const outer=circle(x,y,band.outer*U),inner=circle(x,y,band.inner*U);
    for(let i=0;i<64;i++){const n=(i+1)%64;clip([outer[i]!,outer[n]!,inner[n]!,inner[i]!]);}return;
  }
  let poly:Point[];
  if(h.shape==='capsule'||h.shape==='charge'){
    const q=h.shape==='charge'&&!warning?calonProgress(h,now-step):0,t=h.shape==='charge'&&!warning?calonProgress(h,now):1;
    const sx=x+(h.toX*U-x)*q,sy=y+(h.toY*U-y)*q,ex=x+(h.toX*U-x)*t,ey=y+(h.toY*U-y)*t,a=Math.atan2(ey-sy,ex-sx);poly=[];
    for(let i=0;i<=24;i++){const z=a-Math.PI/2+Math.PI*i/24;poly.push({x:ex+Math.cos(z)*w,y:ey+Math.sin(z)*w});}
    for(let i=0;i<=24;i++){const z=a+Math.PI/2+Math.PI*i/24;poly.push({x:sx+Math.cos(z)*w,y:sy+Math.sin(z)*w});}
  }else if(h.shape==='sector')poly=[{x,y},...Array.from({length:49},(_,i)=>{const a=h.angle-h.arc/2+h.arc*i/48;return{x:x+Math.cos(a)*r,y:y+Math.sin(a)*r};})];
  else poly=circle(x,y,r);
  const data=poly.flatMap(p=>[p.x,p.y]),holes:number[]=[];
  if(h.shape==='finale'){holes.push(poly.length);data.push(...circle(24*U,35*U,(2.8+P)*U).flatMap(p=>[p.x,p.y]));}
  const ix=Phaser.Geom.Polygon.Earcut(data,holes,2);
  for(let i=0;i<ix.length;i+=3)clip(ix.slice(i,i+3).map(k=>({x:data[k*2]!,y:data[k*2+1]!})));
}
