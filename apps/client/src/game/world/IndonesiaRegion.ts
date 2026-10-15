import Phaser from 'phaser';
import{WORLD_UNIT_PX as U,MAP_ASSET_SCALE,type MapDefinition}from'@shaman/shared';
import{WaterLayer}from'./WaterLayer';
import{addContactShadow}from'./Lighting';
import{addSpiritwoodAtmosphere}from'./SpiritwoodAtmosphere';
import{quiltPaint}from'./china-quilt';
import{rasterNativeTerrain}from'./native-terrain';
import kit from '../../../public/assets/umbral/ashwind-01/manifest.json';
import profiles from './indonesia-presentation.json';
const plan=profiles['ashwind-volcano'];
const N=U/MAP_ASSET_SCALE,KEY='ashwind:source';type Frame=keyof typeof kit.frames;
export const isIndonesiaMap=(map?:MapDefinition)=>!!map&&Object.hasOwn(profiles,map.id);
export function preloadIndonesia(scene:Phaser.Scene){scene.load.image(KEY,'/assets/umbral/ashwind-01/source.png');}
function frame(scene:Phaser.Scene,name:Frame,width:number){const key=`ashwind:${name}:${width}`;if(scene.textures.exists(key))return key;const f=kit.frames[name],h=Math.round(width*f.h/f.w),t=scene.textures.createCanvas(key,width,h)!;t.context.imageSmoothingEnabled=false;t.context.drawImage(scene.textures.get(KEY).getSourceImage()as HTMLImageElement,f.x,f.y,f.w,f.h,0,0,width,h);t.refresh();t.setFilter(Phaser.Textures.FilterMode.NEAREST);return key;}
/** Shared regional binding: gameplay and preview render the same owned atlas and atmosphere. */
export function renderIndonesia(scene:Phaser.Scene,map:MapDefinition,profile:Pick<typeof plan,'fog'|'graph'|'vents'|'wind'>=(profiles as Record<string,Pick<typeof plan,'fog'|'graph'|'vents'|'wind'>>)[map.id]??plan){
 // Ground retains one painted pixel per world pixel. Props/water keep their original asset scale.
 // Double the samples AND quilt dimensions so stones retain their physical size, with finer cracks/grain.
 const w=map.width*U,h=map.height*U;
 const groundKey=`indonesia:ground:${map.id}`;
 // Canvas textures outlive Phaser scene restarts unless explicitly released.
 if(scene.textures.exists(groundKey))scene.textures.remove(groundKey);
 const t=scene.textures.createCanvas(groundKey,w,h)!,out=t.context.createImageData(w,h),raster=rasterNativeTerrain(map,U),water=new WaterLayer(scene,{...map,objects:[]});
 water.setNativeCoverage(rasterNativeTerrain(map,N).water);
 // Composite one material at a time instead of retaining two full-size painted planes.
 for(const[name,size,seed]of [['ash',256,301],['road',128,302]]as const){
  const key=frame(scene,name,size),source=scene.textures.get(key).getSourceImage()as HTMLCanvasElement,s=quiltPaint(source.getContext('2d')!.getImageData(0,0,size,size).data,size,w,h,seed,2);
  for(let cell=0;cell<raster.materials.length;cell++)if((raster.materials[cell]===1)===(name==='road')){const i=cell*4;out.data[i]=s[i]!;out.data[i+1]=s[i+1]!;out.data[i+2]=s[i+2]!;out.data[i+3]=255;}
 }
 t.context.putImageData(out,0,0);t.refresh();t.setFilter(Phaser.Textures.FilterMode.NEAREST);scene.add.image(0,0,groundKey).setOrigin(0).setDepth(-1.8);// This independent atlas has no legacy umbral object-reflection bindings.
 scene.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>scene.textures.remove(groundKey));
 water.finish();
 for(const o of map.objects as (MapDefinition['objects'][number]&{width:number})[]){const key=frame(scene,o.asset as Frame,o.width);scene.add.image(o.x*U,o.y*U,key).setOrigin(.5,1).setScale(MAP_ASSET_SCALE).setDepth(o.y*U).setName(o.id);addContactShadow(scene,o.x*U,o.y*U,o.footprint?o.footprint.w*U:o.width*.8);}
 addSpiritwoodAtmosphere(scene,map,profile);
 for(const child of scene.children.list)if(child instanceof Phaser.GameObjects.Image&&profile.fog.some(f=>f.id===child.name))child.setScale(3,2).setTint(child.name==='sulfur-steam'?0xd1c3a4:0xb4c2bd);
 // Local geological embers and authored ash corridors are cosmetic, not skill or damage events.
 const embers=profile.vents.flatMap(([x,y],phase)=>[0,1,2].map(i=>({sprite:scene.add.rectangle(x!*U,y!*U,2,2,0xe6a25a,.5).setDepth(y!*U+1),x:x!*U,y:y!*U,phase:phase+i/3})));
 const ash=profile.wind.flatMap(([x,y],phase)=>[0,1,2,3].map(i=>({sprite:scene.add.rectangle(0,0,2,2,0xaaa79f,.25).setDepth(999999),x:(x!+i)*U,y:(y!+i*.6)*U,phase:phase+i/4})));
 scene.add.rectangle(0,0,map.width*U,map.height*U,0x10151a,.12).setOrigin(0).setDepth(1000000);
 const update=(time:number)=>{for(const e of embers){const p=(time*.0003+e.phase)%1;e.sprite.setPosition(Math.round(e.x+Math.sin(time*.002+e.phase)*8),Math.round(e.y-18-p*25)).setAlpha((1-p)*.5);}for(const e of ash){const p=(time*.0001+e.phase)%1;e.sprite.setPosition(Math.round(e.x+p*120-60),Math.round(e.y+Math.sin(p*6)*8)).setAlpha(Math.sin(p*Math.PI)*.3);}};
 scene.events.on(Phaser.Scenes.Events.UPDATE,update);scene.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>scene.events.off(Phaser.Scenes.Events.UPDATE,update));return{water};
}
