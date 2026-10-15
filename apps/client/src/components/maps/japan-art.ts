import Phaser from'phaser';
import{WORLD_UNIT_PX as U,MAP_ASSET_SCALE,type MapDefinition}from'@shaman/shared';
import{WaterLayer,preloadWater}from'../../game/world/WaterLayer';
import{rasterNativeTerrain}from'../../game/world/native-terrain';
import{quiltPaint}from'../../game/world/china-quilt';
import{addContactShadow}from'../../game/world/Lighting';
import{addSpiritwoodAtmosphere}from'../../game/world/SpiritwoodAtmosphere';
import kit from'../../../public/assets/umbral/japan-01/manifest.json';
import type{japanMaps}from'./japan-review-data';
const KEY='japan:source';type Frame=keyof typeof kit.frames;
export function preloadJapan(scene:Phaser.Scene){preloadWater(scene);scene.load.image(KEY,'/assets/umbral/japan-01/source.png');}
function frame(scene:Phaser.Scene,name:Frame,width:number,square=false){const key=`japan:${name}:${width}:${square}`;if(scene.textures.exists(key))return key;const f=kit.frames[name],height=square?width:Math.round(width*f.h/f.w),t=scene.textures.createCanvas(key,width,height)!;t.context.imageSmoothingEnabled=false;if(square){t.context.fillStyle=name==='moss'?'#2b3d32':name==='soil'?'#39352f':'#4b5048';t.context.fillRect(0,0,width,height);}t.context.globalAlpha=square&&name==='moss'?.58:1;t.context.drawImage(scene.textures.get(KEY).getSourceImage()as HTMLImageElement,f.x,f.y,f.w,f.h,0,0,width,height);t.refresh();t.setFilter(Phaser.Textures.FilterMode.NEAREST);return key;}
/** Isolated Japanese preview binding. Original eleven live maps and country kits are untouched. */
export function renderJapan(scene:Phaser.Scene,map:MapDefinition,plan:(typeof japanMaps)['cedar-torii-shrine']['plan']){
 const w=map.width*U,h=map.height*U,key=`japan:ground:${map.id}`;
 if(scene.textures.exists(key))scene.textures.remove(key);
 const canvas=scene.textures.createCanvas(key,w,h)!,out=canvas.context.createImageData(w,h),raster=rasterNativeTerrain(map,U);
 // A second semantic view identifies dirt without changing the authoritative material geometry.
 const soil=rasterNativeTerrain({...map,terrain:{base:map.terrain?.base==='dirt'?'road':'grass',paint:(map.terrain?.paint??[]).map(p=>({...p,terrain:p.terrain==='dirt'?'road':p.terrain==='road'?'grass':p.terrain}))}},U);
 for(const[name,size,seed]of[['moss',256,711],['soil',256,712],['road',128,713]]as const){const source=scene.textures.get(frame(scene,name,size,true)).getSourceImage()as HTMLCanvasElement,pixels=quiltPaint(source.getContext('2d')!.getImageData(0,0,size,size).data,size,w,h,seed,2);for(let cell=0;cell<raster.materials.length;cell++){const material=raster.materials[cell]===1?'road':soil.materials[cell]===1?'soil':'moss';if(material!==name)continue;const i=cell*4;out.data[i]=pixels[i]!;out.data[i+1]=pixels[i+1]!;out.data[i+2]=pixels[i+2]!;out.data[i+3]=255;}}
 canvas.context.putImageData(out,0,0);canvas.refresh();canvas.setFilter(Phaser.Textures.FilterMode.NEAREST);scene.add.image(0,0,key).setOrigin(0).setDepth(-1.8);scene.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>scene.textures.remove(key));
 const water=new WaterLayer(scene,{...map,objects:[]});water.setNativeCoverage(rasterNativeTerrain(map,U/MAP_ASSET_SCALE).water);water.finish();
 for(const o of map.objects as(MapDefinition['objects'][number]&{width:number})[]){const image=scene.add.image(o.x*U,o.y*U,frame(scene,o.asset as Frame,o.width)).setOrigin(.5,1).setScale(MAP_ASSET_SCALE).setName(o.id).setDepth(o.asset==='bridge'?-1.3:o.y*U);if(o.flip)image.setFlipX(true);if(o.asset!=='bridge')addContactShadow(scene,o.x*U,o.y*U,o.footprint?o.footprint.w*U:o.width*.65);}
 addSpiritwoodAtmosphere(scene,map,plan);
 for(const child of scene.children.list)if(child instanceof Phaser.GameObjects.Image&&plan.fog.some(f=>f.id===child.name))child.setScale(3,2).setTint(0xb2c6d0);
 // Scenic water ribbon reuses the existing animated-water artwork; it grants no climbable elevation.
 const falls=plan.falls.map(f=>scene.add.image(f.x*U,f.y*U,'water:fall').setOrigin(.5,0).setDisplaySize(f.w*U,f.h*U).setDepth(-1.5).setAlpha(.8));
 const update=(time:number)=>{for(const[i,fall]of falls.entries())fall.setAlpha(.77+Math.sin(time*.004+i)*.05);};scene.events.on(Phaser.Scenes.Events.UPDATE,update);scene.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>scene.events.off(Phaser.Scenes.Events.UPDATE,update));
 scene.add.rectangle(0,0,w,h,0x0d1723,map.id==='monsoon-ruins'?.17:.1).setOrigin(0).setDepth(1000000);
 return{water};
}
