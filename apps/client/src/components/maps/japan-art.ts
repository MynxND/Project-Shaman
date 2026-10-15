import Phaser from'phaser';
import{WORLD_UNIT_PX as U,MAP_ASSET_SCALE,type MapDefinition}from'@shaman/shared';
import{WaterLayer,preloadWater}from'../../game/world/WaterLayer';
import{rasterNativeTerrain}from'../../game/world/native-terrain';
import{quiltPaint}from'../../game/world/china-quilt';
import{weatherGroundEdges}from'../../game/world/weathered-ground';
import{addContactShadow}from'../../game/world/Lighting';
import{addSpiritwoodAtmosphere}from'../../game/world/SpiritwoodAtmosphere';
import kit from'../../../public/assets/umbral/japan-01/manifest.json';
import type{japanMaps}from'./japan-review-data';
import snowKit from'../../../public/assets/umbral/japan-snow-01/manifest.json';
const KEY='japan:source';type Frame=keyof typeof kit.frames;
export function preloadJapan(scene:Phaser.Scene){preloadWater(scene);scene.load.image(KEY,'/assets/umbral/japan-01/source.png');scene.load.image('japan:snow-source','/assets/umbral/japan-snow-01/source.png');}
function frame(scene:Phaser.Scene,name:Frame,width:number,square=false,snow=false){const key=`japan:${snow}:${name}:${width}:${square}`;if(scene.textures.exists(key))return key;const f=snow&&name in snowKit.frames?snowKit.frames[name as keyof typeof snowKit.frames]:kit.frames[name],height=square?width:Math.round(width*f.h/f.w),t=scene.textures.createCanvas(key,width,height)!;t.context.imageSmoothingEnabled=false;if(square){t.context.fillStyle=snow?'#aebdc9':name==='moss'?'#2b3d32':name==='soil'?'#39352f':'#4b5048';t.context.fillRect(0,0,width,height);}t.context.globalAlpha=square&&name==='moss'&&!snow?.58:1;t.context.drawImage(scene.textures.get(snow?'japan:snow-source':KEY).getSourceImage()as HTMLImageElement,f.x,f.y,f.w,f.h,0,0,width,height);t.refresh();t.setFilter(Phaser.Textures.FilterMode.NEAREST);return key;}
/** Isolated Japanese preview binding. Original eleven live maps and country kits are untouched. */
export function renderJapan(scene:Phaser.Scene,map:MapDefinition,plan:(typeof japanMaps)['cedar-torii-shrine']['plan']){
 const snow=map.id==='snowbound-torii';
 const w=map.width*U,h=map.height*U,key=`japan:ground:${map.id}`;
 if(scene.textures.exists(key))scene.textures.remove(key);
 const canvas=scene.textures.createCanvas(key,w,h)!,out=canvas.context.createImageData(w,h),raster=rasterNativeTerrain(map,U);
 // A second semantic view identifies dirt without changing the authoritative material geometry.
 const soil=rasterNativeTerrain({...map,terrain:{base:map.terrain?.base==='dirt'?'road':'grass',paint:(map.terrain?.paint??[]).map(p=>({...p,terrain:p.terrain==='dirt'?'road':p.terrain==='road'?'grass':p.terrain}))}},U);
 const groundMaterials=new Uint8Array(raster.materials.length);for(let i=0;i<groundMaterials.length;i++)groundMaterials[i]=raster.water[i]?3:raster.materials[i]===1?2:soil.materials[i]===1?1:0;
 // Broken material lips are visual only; authoritative terrain and native water coverage remain exact.
 const worn=weatherGroundEdges(groundMaterials,w,h);
 for(const[name,size,seed]of[['moss',256,711],['soil',256,712],['road',128,713]]as const){const source=scene.textures.get(frame(scene,name,size,true,snow)).getSourceImage()as HTMLCanvasElement,pixels=quiltPaint(source.getContext('2d')!.getImageData(0,0,size,size).data,size,w,h,seed,2);for(let cell=0;cell<raster.materials.length;cell++){const material=worn[cell]===2?'road':worn[cell]===1?'soil':'moss';if(material!==name)continue;const i=cell*4;out.data[i]=pixels[i]!;out.data[i+1]=pixels[i+1]!;out.data[i+2]=pixels[i+2]!;out.data[i+3]=255;}}
 canvas.context.putImageData(out,0,0);canvas.refresh();canvas.setFilter(Phaser.Textures.FilterMode.NEAREST);scene.add.image(0,0,key).setOrigin(0).setDepth(-1.8);scene.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>scene.textures.remove(key));
 const water=new WaterLayer(scene,{...map,objects:[]},map),coverage=rasterNativeTerrain(map,U/MAP_ASSET_SCALE).water,nativeWidth=w/MAP_ASSET_SCALE;
 // Shared WaterLayer now owns the common bank edge and ecology pass.
 // Historical bank policy, now implemented centrally:
 // Copy the decorative bank toe into the water mask at exactly the same native samples.
 // Logical wet blockers remain unchanged; the narrow painted lip is non-walkable bank, not new land.
 water.setNativeCoverage(coverage);water.finish();
 for(const o of map.objects as(MapDefinition['objects'][number]&{width:number})[]){const image=scene.add.image(o.x*U,o.y*U,frame(scene,o.asset as Frame,o.width,false,snow)).setOrigin(.5,1).setScale(MAP_ASSET_SCALE).setName(o.id).setDepth(o.asset==='bridge'?-1.3:o.y*U);if(o.flip)image.setFlipX(true);if(o.asset!=='bridge')addContactShadow(scene,o.x*U,o.y*U,o.footprint?o.footprint.w*U:o.width*.65);}
 addSpiritwoodAtmosphere(scene,map,plan);
 for(const child of scene.children.list)if(child instanceof Phaser.GameObjects.Image&&plan.fog.some(f=>f.id===child.name))child.setScale(3,2).setTint(0xb2c6d0);
 // Scenic water ribbon reuses the existing animated-water artwork; it grants no climbable elevation.
 const falls=plan.falls.map(f=>scene.add.image(f.x*U,f.y*U,'water:fall').setOrigin(.5,0).setDisplaySize(f.w*U,f.h*U).setDepth(-1.5).setAlpha(.8));
 // Bounded camera-relative snowfall, independent of authority/collision, one allocation per scene.
 const flakes=snow?Array.from({length:96},(_,i)=>scene.add.rectangle(0,0,i%5===0?3:2,2,0xe4edf0,.5).setScrollFactor(0).setDepth(1000002)):[];
 const update=(time:number)=>{for(const[i,f]of flakes.entries()){const c=scene.cameras.main,ww=c.width,hh=c.height,sx=((i*97+Math.sin(time*.0004+i)*18+time*.006)%ww+ww)%ww,sy=(i*61+time*(.018+i%3*.004))%hh;f.setPosition(ww/2+(sx-ww/2)/c.zoom,hh/2+(sy-hh/2)/c.zoom).setScale(1/c.zoom).setAlpha(.25+(i%4)*.12);}for(const[i,fall]of falls.entries())fall.setAlpha(.77+Math.sin(time*.004+i)*.05);};scene.events.on(Phaser.Scenes.Events.UPDATE,update);scene.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>scene.events.off(Phaser.Scenes.Events.UPDATE,update));
 scene.add.rectangle(0,0,w,h,0x0d1723,map.id==='monsoon-ruins'?.17:.1).setOrigin(0).setDepth(1000000);
 return{water};
}
