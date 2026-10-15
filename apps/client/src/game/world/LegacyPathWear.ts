import Phaser from'phaser';
import{terrainVertices,cellCorners,terrainHeight,type MapDefinition}from'@shaman/shared';
import{weatherGroundEdges}from'./weathered-ground';
/** Legacy Wang maps retain their painted tiles; only small broken lips use the adjacent solid tile pixels. */
export function renderLegacyPathWear(scene:Phaser.Scene,map:MapDefinition,solid:Map<string,{key:string;frame:string}>){
 const w=map.width*16,h=map.height*16,labels=new Uint8Array(w*h),v=terrainVertices(map);
 for(let cy=0;cy<map.height;cy++)for(let cx=0;cx<map.width;cx++){const c=cellCorners(v,map.width,cx,cy);for(let py=0;py<16;py++)for(let px=0;px<16;px++){const u=(px+.5)/16,t=(py+.5)/16,a=[(1-u)*(1-t),u*(1-t),(1-u)*t,u*t],s=[0,0,0,0];c.forEach((k,i)=>{s[k==='water'?3:k==='road'?2:k==='dirt'?1:0]!+=a[i]!;});let best=0;for(let j=1;j<4;j++)if(s[j]!>s[best]!)best=j;labels[(cy*16+py)*w+cx*16+px]=best;}}
 const worn=weatherGroundEdges(labels,w,h,false,1),swatches=new Map<number,Uint8ClampedArray>();
 for(const[i,name]of ['grass','dirt','road'].entries()){const a=solid.get(name);if(!a)continue;const frame=scene.textures.getFrame(a.key,a.frame),c=document.createElement('canvas');c.width=c.height=16;const ctx=c.getContext('2d')!;ctx.imageSmoothingEnabled=false;ctx.drawImage(frame.source.image as HTMLImageElement,frame.cutX,frame.cutY,frame.cutWidth,frame.cutHeight,0,0,16,16);swatches.set(i,ctx.getImageData(0,0,16,16).data);}
 const margin=map.elevation?48:0,key=`edge:path:${map.id}`;if(scene.textures.exists(key))scene.textures.remove(key);const t=scene.textures.createCanvas(key,w,h+margin)!,out=t.context.createImageData(w,h+margin);
 for(let i=0;i<labels.length;i++){if(labels[i]===worn[i]||labels[i]===3)continue;const x=i%w,y=Math.floor(i/w),wx=(x+.5)/16,wy=(y+.5)/16;if(map.elevation?.transitions.some(r=>wx>r.x-.5&&wy>r.y-.5&&wx<r.x+r.w+.5&&wy<r.y+r.h+.5))continue;const s=swatches.get(worn[i]!);if(!s)continue;const yy=Math.round(y+margin-terrainHeight(map,wx,wy)*(map.elevation?.risePx??0)/2);if(yy<0||yy>=h+margin)continue;const si=((y%16)*16+x%16)*4;out.data.set(s.subarray(si,si+4),(yy*w+x)*4);}
 t.context.putImageData(out,0,0);t.refresh();t.setFilter(Phaser.Textures.FilterMode.NEAREST);scene.add.image(0,-margin*2,key).setOrigin(0).setScale(2).setDepth(-1.76).setTint(map.id==='whispering-spiritwood'?0x9aa99f:0xa9b39c);scene.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>scene.textures.remove(key));
}
