import Phaser from 'phaser';
import{terrainVertices,WORLD_UNIT_PX,MAP_ASSET_SCALE,type MapDefinition}from'@shaman/shared';
import{terrainHash,terrainVariant}from'./terrain-variation';
export interface QualitySet{image:string;lower:string;upper:string;variantStride:number;variantCount:number;weights:number[];tiles:{x:number;y:number;size:number;corners:number[]}[]}
interface QualityManifest{seed:number;tilesets:Record<string,QualitySet>;decorations:{image:string;cell:number;columns:number;count:number}}
const BASE='/assets/umbral/terrain-quality',JSON_KEY='terrain-quality:manifest';
const enabled=(map?:MapDefinition)=>['whispering-spiritwood','lantern-paddy','moon-mangrove','monsoon-marsh','cloud-tea-slopes'].includes(map?.id??'')||map?.objects.some(o=>o.asset==='village-sacred-totem')||(process.env.NODE_ENV==='development'&&typeof window!=='undefined'&&new URLSearchParams(window.location.search).get('terrainQuality')==='1');
export function preloadTerrainQuality(scene:Phaser.Scene,map?:MapDefinition){if(!enabled(map))return;scene.load.once(`filecomplete-json-${JSON_KEY}`,(_key:string,_type:string,m:QualityManifest)=>{for(const[id,s]of Object.entries(m.tilesets))scene.load.image('terrain-quality:'+id,BASE+'/'+s.image);scene.load.image('terrain-quality:decor',BASE+'/'+m.decorations.image);});scene.load.json(JSON_KEY,BASE+'/manifest.json');}
export function qualitySets(scene:Phaser.Scene,map?:MapDefinition):[string,QualitySet][]|null{const m=scene.cache.json.get(JSON_KEY)as QualityManifest|undefined;if(!m||!enabled(map))return null;return Object.entries(m.tilesets).map(([id,s])=>['terrain-quality:'+id,s]);}
export function qualityFrame(scene:Phaser.Scene,map:MapDefinition,tile:{key:string;frame:string},x:number,y:number):{key:string;frame:string}{
 if(!tile.key.startsWith('terrain-quality:'))return tile;const m=scene.cache.json.get(JSON_KEY)as QualityManifest,s=m.tilesets[tile.key.slice('terrain-quality:'.length)]!,index=Number(tile.frame.slice(1)),t=s.tiles[index]!,variant=terrainVariant(map.id,x,y,s.weights,m.seed),frame=tile.frame+':'+variant,texture=scene.textures.get(tile.key);if(!texture.has(frame))texture.add(frame,0,t.x+variant*s.variantStride,t.y,t.size,t.size);return{key:tile.key,frame};
}
// Low ground detail never becomes MapObject/footprint or changes terrain vertices.
// Elevation decoration needs authored projected masks and is deliberately deferred.
export function renderQualityDecoration(scene:Phaser.Scene,map:MapDefinition){const m=scene.cache.json.get(JSON_KEY)as QualityManifest|undefined;if(!m||!enabled(map)||!map.terrain||map.elevation)return;
 const key='terrain-quality:detail:'+map.id;if(scene.textures.exists(key))scene.textures.remove(key);const texture=scene.textures.createCanvas(key,map.width*16,map.height*16);if(!texture)return;const ctx=texture.context,image=scene.textures.get('terrain-quality:decor').getSourceImage()as HTMLImageElement,vertices=terrainVertices(map),at=(x:number,y:number)=>vertices[Math.round(y)*(map.width+1)+Math.round(x)];
 for(const o of map.objects){if(o.footprint){ctx.fillStyle='rgba(4,13,10,.12)';ctx.fillRect(Math.round((o.x-o.footprint.w*.7)*16),Math.round((o.y-.3)*16),Math.round(o.footprint.w*22),9);}
 if(!/tree|bamboo|rock|shrine|house/.test(o.asset))continue;
 for(const[i,[dx,dy]]of [[-2,.5],[-1.2,1.1],[1.5,.8],[2.2,.2]].entries()){const x=o.x+dx!,y=o.y+dy!,hash=terrainHash(map.id,Math.round(x*10),Math.round(y*10),m.seed);if(x<1||y<1||x>=map.width-1||y>=map.height-1||at(x,y)!=='grass'||hash%5===0)continue;const frame=hash%m.decorations.count;ctx.drawImage(image,frame%m.decorations.columns*16,Math.floor(frame/m.decorations.columns)*16,16,16,Math.round(x*16)-8,Math.round(y*16)-8,16,16);}}
 texture.refresh();texture.setFilter(Phaser.Textures.FilterMode.NEAREST);scene.add.image(0,0,key).setOrigin(0).setScale(MAP_ASSET_SCALE).setDepth(-1.6);
}
