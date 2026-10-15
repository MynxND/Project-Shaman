import Phaser from 'phaser';
import{WORLD_UNIT_PX as U,MAP_ASSET_SCALE,terrainVertices,cellCorners,type MapDefinition}from'@shaman/shared';
import{WaterLayer,preloadWater}from'../../game/world/WaterLayer';
import{addContactShadow}from'../../game/world/Lighting';
import{addSpiritwoodAtmosphere}from'../../game/world/SpiritwoodAtmosphere';
import{quiltPaint}from'../../game/world/china-quilt';
import kit from '../../../public/assets/umbral/violet-war-01/manifest.json';
import plan from './ruins-review-plan.json';
const N=U/MAP_ASSET_SCALE,KEY='ruins:source';type Frame=keyof typeof kit.frames;
export function preloadRuins(scene:Phaser.Scene){preloadWater(scene);scene.load.image(KEY,'/assets/umbral/violet-war-01/source.png');}
function frame(scene:Phaser.Scene,name:Frame,width:number){const key=`ruins:${name}:${width}`;if(scene.textures.exists(key))return key;const f=kit.frames[name],h=Math.round(width*f.h/f.w),t=scene.textures.createCanvas(key,width,h)!;t.context.imageSmoothingEnabled=false;t.context.drawImage(scene.textures.get(KEY).getSourceImage()as HTMLImageElement,f.x,f.y,f.w,f.h,0,0,width,h);t.refresh();t.setFilter(Phaser.Textures.FilterMode.NEAREST);return key;}
/** Independent preview binding: the original atlas and all live maps remain unchanged. */
export function renderRuins(scene:Phaser.Scene,map:MapDefinition){
 const w=map.width*N,h=map.height*N,samples={}as Record<string,Uint8ClampedArray>;
 for(const[name,size,seed]of [['ash',128,301],['road',64,302]]as const){const key=frame(scene,name,size),source=scene.textures.get(key).getSourceImage()as HTMLCanvasElement;samples[name]=quiltPaint(source.getContext('2d')!.getImageData(0,0,size,size).data,size,w,h,seed);}
 const t=scene.textures.createCanvas('ruins:ground',w,h)!,out=t.context.createImageData(w,h),vertices=terrainVertices(map),water=new WaterLayer(scene,{...map,objects:[]});
 for(let cy=0;cy<map.height;cy++)for(let cx=0;cx<map.width;cx++){const corners=cellCorners(vertices,map.width,cx,cy);water.addTile(cx,cy,corners);for(let py=0;py<N;py++)for(let px=0;px<N;px++){const u=(px+.5)/N,v=(py+.5)/N,weights=[(1-u)*(1-v),u*(1-v),(1-u)*v,u*v],road=corners.reduce((a,c,i)=>a+(c==='road'?weights[i]!:0),0),i=((cy*N+py)*w+cx*N+px)*4,s=samples[road>=.5?'road':'ash']!;out.data[i]=s[i]!;out.data[i+1]=s[i+1]!;out.data[i+2]=s[i+2]!;out.data[i+3]=255;}}
 t.context.putImageData(out,0,0);t.refresh();t.setFilter(Phaser.Textures.FilterMode.NEAREST);scene.add.image(0,0,'ruins:ground').setOrigin(0).setScale(MAP_ASSET_SCALE).setDepth(-1.8);// This independent atlas has no legacy umbral object-reflection bindings.
 water.finish();
 for(const o of map.objects as (MapDefinition['objects'][number]&{width:number})[]){const key=frame(scene,o.asset as Frame,o.width);scene.add.image(o.x*U,o.y*U,key).setOrigin(.5,1).setScale(MAP_ASSET_SCALE).setDepth(o.y*U).setName(o.id);addContactShadow(scene,o.x*U,o.y*U,o.footprint?o.footprint.w*U:o.width*.8);}
 addSpiritwoodAtmosphere(scene,map,plan);
 for(const child of scene.children.list)if(child instanceof Phaser.GameObjects.Image&&plan.fog.some(f=>f.id===child.name))child.setScale(3,2).setTint(child.name==='east-corruption'?0xb9a3d3:0xb4c2c2);
 // User-requested violet is environmental war residue, not a change to semantic skill colors.
 const flames=plan.fires.map(([x,y],i)=>{const image=scene.add.image(x!*U,y!*U,frame(scene,'fire',32+(i%3)*4)).setOrigin(.5,1).setScale(MAP_ASSET_SCALE).setDepth(y!*U+1);scene.add.ellipse(x!*U,y!*U-2,65,20,0x9c57d9,.14).setDepth(-1.2).setBlendMode(Phaser.BlendModes.ADD);const embers=[0,1,2].map(()=>scene.add.rectangle(0,0,2,3,0xc49bf4,.7).setDepth(y!*U+2));return{image,embers,x:x!*U,y:y!*U,phase:i};});
 scene.add.rectangle(0,0,map.width*U,map.height*U,0x100e24,.15).setOrigin(0).setDepth(1000000);
 const update=(time:number)=>{for(const f of flames){const phase=time*.003+f.phase;f.image.setScale(MAP_ASSET_SCALE,MAP_ASSET_SCALE*(.96+Math.sin(phase)*.04)).setAlpha(.88+Math.sin(phase*1.7)*.1);for(const[e,i]of f.embers.map((e,i)=>[e,i]as const)){const p=(time*.00035+i/3+f.phase*.13)%1;e.setPosition(Math.round(f.x+Math.sin(phase+i)*9),Math.round(f.y-10-p*40)).setAlpha((1-p)*.65);}}};
 scene.events.on(Phaser.Scenes.Events.UPDATE,update);scene.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>scene.events.off(Phaser.Scenes.Events.UPDATE,update));return{water};
}
