import type {MapDefinition} from '@shaman/shared';

/** Flat-map semantic coverage at asset resolution. Later strokes (including dry fords) win.
 * Scanline spans preserve authored coasts without quantizing them to Wang tile corners. */
export function rasterNativeTerrain(map:MapDefinition,scale=16){
 if(!Number.isInteger(scale)||scale<1)throw new Error('Invalid terrain raster scale');
 const width=map.width*scale,height=map.height*scale,materials=new Uint8Array(width*height);
 const code=(terrain:string)=>terrain==='road'?1:terrain==='water'?2:0;
 materials.fill(code(map.terrain?.base??'dirt'));
 const span=(y:number,left:number,right:number,value:number)=>{if(y<0||y>=height)return;const a=Math.max(0,Math.ceil(left*scale-.5)),b=Math.min(width,Math.ceil(right*scale-.5));if(b>a)materials.fill(value,y*width+a,y*width+b);};
 for(const paint of map.terrain?.paint??[]){
  const value=paint.terrain==='water'&&(paint.shape==='circle'||(paint as typeof paint&{waterMode?:string}).waterMode==='pond')?3:code(paint.terrain);
  if(paint.shape==='rect'){for(let y=Math.max(0,Math.ceil(paint.y*scale-.5));y<Math.min(height,Math.ceil((paint.y+paint.h)*scale-.5));y++)span(y,paint.x,paint.x+paint.w,value);}
  else if(paint.shape==='circle'){
   for(let y=Math.max(0,Math.ceil((paint.y-paint.r)*scale-.5));y<Math.min(height,Math.ceil((paint.y+paint.r)*scale-.5));y++){const dy=(y+.5)/scale-paint.y,dx=Math.sqrt(Math.max(0,paint.r**2-dy**2));span(y,paint.x-dx,paint.x+dx,value);}
  }else if(paint.shape==='polygon'){
   const points=paint.points,ys=points.map(p=>p[1]);
   for(let y=Math.max(0,Math.ceil(Math.min(...ys)*scale-.5));y<Math.min(height,Math.ceil(Math.max(...ys)*scale-.5));y++){
    const py=(y+.5)/scale,crossings:number[]=[];
    for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i]!,b=points[j]!;if((a[1]>py)!==(b[1]>py))crossings.push(a[0]+(py-a[1])*(b[0]-a[0])/(b[1]-a[1]));}
    crossings.sort((a,b)=>a-b);for(let i=0;i+1<crossings.length;i+=2)span(y,crossings[i]!,crossings[i+1]!,value);
   }
  }else{
   for(let s=1;s<paint.points.length;s++){
    const a=paint.points[s-1]!,b=paint.points[s]!,dx=b[0]-a[0],dy=b[1]-a[1],length=dx*dx+dy*dy;
    for(let y=Math.max(0,Math.ceil((Math.min(a[1],b[1])-paint.r)*scale-.5));y<Math.min(height,Math.ceil((Math.max(a[1],b[1])+paint.r)*scale-.5));y++)
     for(let x=Math.max(0,Math.ceil((Math.min(a[0],b[0])-paint.r)*scale-.5));x<Math.min(width,Math.ceil((Math.max(a[0],b[0])+paint.r)*scale-.5));x++){
      const px=(x+.5)/scale,py=(y+.5)/scale,t=length?Math.max(0,Math.min(1,((px-a[0])*dx+(py-a[1])*dy)/length)):0;
      if((px-a[0]-t*dx)**2+(py-a[1]-t*dy)**2<=paint.r**2)materials[y*width+x]=value;
     }
   }
  }
 }
 const water=new Uint8Array(materials.length);for(let i=0;i<water.length;i++)water[i]=materials[i]!>=2?materials[i]!-1:0;
 return{width,height,materials,water};
}
