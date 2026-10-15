import Phaser from'phaser';
import{WORLD_UNIT_PX as U,MAP_ASSET_SCALE,projectedY,type MapDefinition}from'@shaman/shared';
import{weatherGroundEdges}from'./weathered-ground';
import{planEdgeEcology}from'./edge-ecology-model';
import japan from'../../../public/assets/umbral/japan-01/manifest.json';
import snow from'../../../public/assets/umbral/japan-snow-01/manifest.json';
import china from'../../../public/assets/umbral/china-01/manifest.json';
import indo from'../../../public/assets/umbral/ashwind-01/manifest.json';
import ruins from'../../../public/assets/umbral/violet-war-01/manifest.json';
import norway from'../../../public/assets/umbral/norway-01/manifest.json';

import ireland from'../../../public/assets/umbral/ireland-01/manifest.json';
import russia from'../../../public/assets/umbral/russia-01/manifest.json';

type Frame={x:number;y:number;w:number;h:number};
export function preloadEdgeEcology(scene:Phaser.Scene){for(const[id,path]of Object.entries({grass:'terrain-quality/decorations.png',fern:'objects/fern.png',rock:'objects/mossy-rock.png',bamboo:'objects/bamboo.png',base:'ground/dark-grass.png',soil:'ground/dark-earth.png'}))scene.load.image('edge:'+id,'/assets/umbral/'+path);}
function region(map:MapDefinition){if(['frost-pine','taiga-blood-trail','winter-seal-kremlin'].includes(map.id))return{key:'russia:source',frames:russia.frames as Record<string,Frame>,base:map.id==='taiga-blood-trail'?'peat':'moss',tree:map.id==='taiga-blood-trail'?'darkpine':'pine',plant:''};if(['golden-spiritwood','stone-oath-moor','willow-wake-village'].includes(map.id))return{key:'ireland:source',frames:ireland.frames as Record<string,Frame>,base:'moss',tree:'willow',plant:''};if(['storm-fjord','spirit-timber-harbor','aurora-pass'].includes(map.id))return{key:'norway:source',frames:norway.frames as Record<string,Frame>,base:'moss',tree:'pine',plant:''};if(map.id==='snowbound-torii')return{key:'japan:snow-source',frames:snow.frames as Record<string,Frame>,base:'moss',tree:'cedar',plant:''};if(['cedar-torii-shrine','spirit-waterfall','monsoon-ruins'].includes(map.id))return{key:'japan:source',frames:japan.frames as Record<string,Frame>,base:'moss',tree:'cedar',plant:''};if(['mist-bamboo','cloud-tea-slopes'].includes(map.id))return{key:'china:original-kit',frames:china.frames as Record<string,Frame>,base:'grass',tree:'bamboo',plant:'tea'};if(['ashwind-volcano','ember-caldera','obsidian-estuary'].includes(map.id))return{key:'ashwind:source',frames:indo.frames as Record<string,Frame>,base:'ash',tree:'tree',plant:'fern'};if(map.id==='violet-war-city')return{key:'ruins:source',frames:ruins.frames as Record<string,Frame>,base:'ash',tree:'tree',plant:''};return null;}
function cropped(scene:Phaser.Scene,key:string,f:Frame){const name=`edge:crop:${key}:${f.x}:${f.y}`;if(!scene.textures.exists(name)){const t=scene.textures.createCanvas(name,f.w,f.h)!;t.context.imageSmoothingEnabled=false;t.context.drawImage(scene.textures.get(key).getSourceImage()as HTMLImageElement,f.x,f.y,f.w,f.h,0,0,f.w,f.h);t.refresh();t.setFilter(Phaser.Textures.FilterMode.NEAREST);}return name;}
/** Shared native bank silhouette. Only old wet samples are covered; logical water and all dry decks stay exact. */
export function finishBankEcology(scene:Phaser.Scene,map:MapDefinition,pixels:Uint8ClampedArray,width:number,height:number,margin:number){
 const mask=new Uint8Array(width*height);for(let i=0;i<mask.length;i++)mask[i]=pixels[i*4]?3:0;
 const worn=weatherGroundEdges(mask,width,height,true,1),r=region(map),key=r&&scene.textures.exists(r.key)?cropped(scene,r.key,r.frames[r.base]!):'edge:base';
 const image=scene.textures.get(key).getSourceImage()as HTMLImageElement,c=document.createElement('canvas');c.width=image.width;c.height=image.height;const ctx=c.getContext('2d')!;ctx.fillStyle=map.id==='snowbound-torii'?'#b1bcca':'#293b30';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(image,0,0);const source=ctx.getImageData(0,0,c.width,c.height).data,bank=new Uint8ClampedArray(width*height*4);let count=0;
 for(let i=0;i<mask.length;i++)if(mask[i]===3&&worn[i]!==3){pixels.fill(0,i*4,i*4+4);const x=i%width,y=Math.floor(i/width),s=((y%c.height)*c.width+x%c.width)*4;bank.set(source.subarray(s,s+4),i*4);bank[i*4+3]=255;count++;}
 if(count){const k=`edge:bank:${scene.sys.settings.key}:${map.id}`;if(scene.textures.exists(k))scene.textures.remove(k);const t=scene.textures.createCanvas(k,width,height)!,d=t.context.createImageData(width,height);d.data.set(bank);t.context.putImageData(d,0,0);t.refresh();t.setFilter(Phaser.Textures.FilterMode.NEAREST);scene.add.image(0,-margin*MAP_ASSET_SCALE,k).setOrigin(0).setScale(MAP_ASSET_SCALE).setDepth(-1.64).setName('ecology:bank');scene.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>scene.textures.remove(k));}
 const planned=planEdgeEcology(map);
 for(const[pIndex,p]of planned.items.entries()){
  let k='edge:rock',f:Frame|undefined,target=p.kind==='sapling'?36:p.kind==='grass'?22:18;
  if(p.kind==='sapling'){if(r){k=r.key;f=r.frames[r.tree];}else k='edge:bamboo';}
  else if(p.kind==='grass'){if(r?.plant){k=r.key;f=r.frames[r.plant];}else{k='edge:grass';f={x:(map.id==='snowbound-torii'?3:p.variant%3)*16,y:0,w:16,h:16};}}
  else if(r){k=r.key;f=r.frames.rock??r.frames.debris??undefined;if(!f)k='edge:rock';}
  if(!scene.textures.exists(k))continue;if(f)k=cropped(scene,k,f);const t=scene.textures.get(k),source=t.getSourceImage()as HTMLImageElement;
  t.setFilter(Phaser.Textures.FilterMode.NEAREST);const sprite=scene.add.image(p.x*U,projectedY(map,p.x,p.y),k).setOrigin(.5,1).setDisplaySize(target,target*source.height/source.width).setDepth(p.y*U).setName(`ecology:${map.id}:${p.kind}:${pIndex}`);if(p.kind==='grass'&&map.id==='snowbound-torii')sprite.setTint(0xb7b29c);
 }
 return{bankPixels:count,decorations:planned.items.length,rejected:planned.rejected};
}
