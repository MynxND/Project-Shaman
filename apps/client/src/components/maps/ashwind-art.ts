import Phaser from 'phaser';
import{WORLD_UNIT_PX as U,MAP_ASSET_SCALE,terrainVertices,cellCorners,type MapDefinition}from'@shaman/shared';
import{WaterLayer,preloadWater}from'../../game/world/WaterLayer';
import{addContactShadow}from'../../game/world/Lighting';
import{addSpiritwoodAtmosphere}from'../../game/world/SpiritwoodAtmosphere';
import{quiltPaint}from'../../game/world/china-quilt';
import kit from '../../../public/assets/umbral/ashwind-01/manifest.json';
import plan from './ashwind-review-plan.json';
const N=U/MAP_ASSET_SCALE,KEY='ashwind:source';type Frame=keyof typeof kit.frames;
export function preloadAshwind(scene:Phaser.Scene){preloadWater(scene);scene.load.image(KEY,'/assets/umbral/ashwind-01/source.png');}
function frame(scene:Phaser.Scene,name:Frame,width:number){const key=`ashwind:${name}:${width}`;if(scene.textures.exists(key))return key;const f=kit.frames[name],h=Math.round(width*f.h/f.w),t=scene.textures.createCanvas(key,width,h)!;t.context.imageSmoothingEnabled=false;t.context.drawImage(scene.textures.get(KEY).getSourceImage()as HTMLImageElement,f.x,f.y,f.w,f.h,0,0,width,h);t.refresh();t.setFilter(Phaser.Textures.FilterMode.NEAREST);return key;}
/** Independent preview binding: the original atlas and all live maps remain unchanged. */
export function renderAshwind(scene:Phaser.Scene,map:MapDefinition){
 const w=map.width*N,h=map.height*N,samples={}as Record<string,Uint8ClampedArray>;
 for(const[name,size,seed]of [['ash',128,301],['road',64,302]]as const){const key=frame(scene,name,size),source=scene.textures.get(key).getSourceImage()as HTMLCanvasElement;samples[name]=quiltPaint(source.getContext('2d')!.getImageData(0,0,size,size).data,size,w,h,seed);}
 const t=scene.textures.createCanvas('ashwind:ground',w,h)!,out=t.context.createImageData(w,h),vertices=terrainVertices(map),water=new WaterLayer(scene,{...map,objects:[]});
 for(let cy=0;cy<map.height;cy++)for(let cx=0;cx<map.width;cx++){const corners=cellCorners(vertices,map.width,cx,cy);water.addTile(cx,cy,corners);for(let py=0;py<N;py++)for(let px=0;px<N;px++){const u=(px+.5)/N,v=(py+.5)/N,weights=[(1-u)*(1-v),u*(1-v),(1-u)*v,u*v],road=corners.reduce((a,c,i)=>a+(c==='road'?weights[i]!:0),0),i=((cy*N+py)*w+cx*N+px)*4,s=samples[road>=.5?'road':'ash']!;out.data[i]=s[i]!;out.data[i+1]=s[i+1]!;out.data[i+2]=s[i+2]!;out.data[i+3]=255;}}
 t.context.putImageData(out,0,0);t.refresh();t.setFilter(Phaser.Textures.FilterMode.NEAREST);scene.add.image(0,0,'ashwind:ground').setOrigin(0).setScale(MAP_ASSET_SCALE).setDepth(-1.8);// This independent atlas has no legacy umbral object-reflection bindings.
 water.finish();
 for(const o of map.objects as (MapDefinition['objects'][number]&{width:number})[]){const key=frame(scene,o.asset as Frame,o.width);scene.add.image(o.x*U,o.y*U,key).setOrigin(.5,1).setScale(MAP_ASSET_SCALE).setDepth(o.y*U).setName(o.id);addContactShadow(scene,o.x*U,o.y*U,o.footprint?o.footprint.w*U:o.width*.8);}
 addSpiritwoodAtmosphere(scene,map,plan);
 for(const child of scene.children.list)if(child instanceof Phaser.GameObjects.Image&&plan.fog.some(f=>f.id===child.name))child.setScale(3,2).setTint(child.name==='sulfur-steam'?0xd1c3a4:0xb4c2bd);
 // Local geological embers and authored ash corridors are cosmetic, not skill or damage events.
 const embers=plan.vents.flatMap(([x,y],phase)=>[0,1,2].map(i=>({sprite:scene.add.rectangle(x!*U,y!*U,2,2,0xe6a25a,.5).setDepth(y!*U+1),x:x!*U,y:y!*U,phase:phase+i/3})));
 const ash=plan.wind.flatMap(([x,y],phase)=>[0,1,2,3].map(i=>({sprite:scene.add.rectangle(0,0,2,2,0xaaa79f,.25).setDepth(999999),x:(x!+i)*U,y:(y!+i*.6)*U,phase:phase+i/4})));
 scene.add.rectangle(0,0,map.width*U,map.height*U,0x10151a,.12).setOrigin(0).setDepth(1000000);
 const update=(time:number)=>{for(const e of embers){const p=(time*.0003+e.phase)%1;e.sprite.setPosition(Math.round(e.x+Math.sin(time*.002+e.phase)*8),Math.round(e.y-18-p*25)).setAlpha((1-p)*.5);}for(const e of ash){const p=(time*.0001+e.phase)%1;e.sprite.setPosition(Math.round(e.x+p*120-60),Math.round(e.y+Math.sin(p*6)*8)).setAlpha(Math.sin(p*Math.PI)*.3);}};
 scene.events.on(Phaser.Scenes.Events.UPDATE,update);scene.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>scene.events.off(Phaser.Scenes.Events.UPDATE,update));return{water};
}
