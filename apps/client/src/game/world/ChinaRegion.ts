import Phaser from 'phaser';
import{terrainVertices,cellCorners,WORLD_UNIT_PX,type MapDefinition,type MapObject}from'@shaman/shared';
import{addContactShadow}from'./Lighting';
import kit from '../../../public/assets/umbral/china-01/manifest.json';
import{quiltPaint}from'./china-quilt';
export const isChinaMap=(map:MapDefinition)=>['mist-bamboo','cloud-tea-slopes'].includes(map.id);
const KEY='china:original-kit';
export function preloadChina(scene:Phaser.Scene,map?:MapDefinition){if(map&&isChinaMap(map)){scene.load.image(KEY,'/assets/umbral/china-01/source.png');scene.load.image('china:tea-hall','/assets/umbral/cloud-tea-01/tea-hall.png');}}
type Frame=keyof typeof kit.frames;
function nativeFrame(scene:Phaser.Scene,name:Frame,width:number){const key=`china:${name}:${width}`;if(scene.textures.exists(key))return key;const f=kit.frames[name],height=Math.round(width*f.h/f.w),texture=scene.textures.createCanvas(key,width,height)!;texture.context.imageSmoothingEnabled=false;texture.context.drawImage(scene.textures.get(KEY).getSourceImage()as HTMLImageElement,f.x,f.y,f.w,f.h,0,0,width,height);texture.refresh();texture.setFilter(Phaser.Textures.FilterMode.NEAREST);return key;}
/** New painted regional materials; world UVs and corner geometry never enter collision or gameplay RNG. */
export function renderChinaGround(scene:Phaser.Scene,map:MapDefinition){if(!isChinaMap(map))return;
 const w=map.width*16,h=map.height*16,key='china:ground:'+map.id;if(scene.textures.exists(key))scene.textures.remove(key);
 const texture=scene.textures.createCanvas(key,w,h)!;const samples={}as Record<string,Uint8ClampedArray>;
 const sizes={grass:128,dirt:128,road:64}as const;
 for(const[name,index]of (['grass','dirt','road']as const).map((name,index)=>[name,index]as const)){const size=sizes[name],k=nativeFrame(scene,name,size),source=scene.textures.get(k).getSourceImage()as HTMLCanvasElement;samples[name]=quiltPaint(source.getContext('2d')!.getImageData(0,0,size,size).data,size,w,h,31415+index*97+(map.id==='mist-bamboo'?11:23));}
 const vertices=terrainVertices(map),out=texture.context.createImageData(w,h);
 for(let cy=0;cy<map.height;cy++)for(let cx=0;cx<map.width;cx++){const corners=cellCorners(vertices,map.width,cx,cy);for(let py=0;py<16;py++)for(let px=0;px<16;px++){
  const u=(px+.5)/16,v=(py+.5)/16,weights=[(1-u)*(1-v),u*(1-v),(1-u)*v,u*v],totals:{[name:string]:number}={};
  corners.forEach((c,i)=>{const material=c==='water'?'grass':c;totals[material]=(totals[material]??0)+weights[i]!;});
  const material=Object.keys(totals).reduce((a,b)=>totals[a]!>=totals[b]!?a:b),x=cx*16+px,y=cy*16+py,s=samples[material]??samples.grass!,di=(y*w+x)*4,si=di;
  out.data[di]=s[si]!;out.data[di+1]=s[si+1]!;out.data[di+2]=s[si+2]!;out.data[di+3]=255;
 }}
 texture.context.putImageData(out,0,0);texture.refresh();texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
 // Existing WaterLayer(-1.7) retains its exact reviewed Wang mask over this ground.
 scene.add.image(0,0,key).setOrigin(0).setScale(2).setDepth(-1.75);
}
/** Original IDs, anchors and blocking footprints are retained; only regional visual prefabs change. */
export function renderChinaObject(scene:Phaser.Scene,map:MapDefinition,o:MapObject){if(!isChinaMap(map))return false;const U=WORLD_UNIT_PX;
 const image=(frame:Frame,width:number,x=o.x)=>{const k=nativeFrame(scene,frame,width);return scene.add.image(x*U,o.y*U,k).setOrigin(.5,1).setScale(2).setDepth(o.y*U).setName(o.id);};
 if(o.asset==='garden-understory'){
  if(o.id.startsWith('tea-band'))for(const dx of[-2,0,2])image('tea',32,o.x+dx);else image('tea',44);
 }else if(o.asset==='bamboo'||o.asset==='village-tropical-tree')image(o.id.startsWith('windbreak')||o.id.startsWith('northRim')?'pine':'bamboo',o.id.startsWith('windbreak')||o.id.startsWith('northRim')?64:48);
 else if(o.asset==='mossy-rock')image('rock',44);
 else if(o.asset==='village-sacred-totem'||o.asset==='ruined-shrine')image('stele',o.asset==='village-sacred-totem'?64:48);
 else if(o.asset==='talisman-lantern')image('stele',20);
 else if(o.asset==='village-thatched-hut'||o.asset==='village-thatched-lodge')scene.add.image(o.x*U,o.y*U,'china:tea-hall').setOrigin(.5,1).setScale((o.footprint?.w??6)*U/96).setDepth(o.y*U).setName(o.id);
 else return false;
 addContactShadow(scene,o.x*U,o.y*U-1,(o.footprint?.w??1.5)*U);return true;
}
