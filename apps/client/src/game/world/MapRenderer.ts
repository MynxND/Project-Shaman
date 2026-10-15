import{isNorwayMap,preloadNorwayRegion,renderNorwayRegion}from'./NorwayRegion';
import{renderLegacyPathWear}from'./LegacyPathWear';
import{isJapanMap,preloadJapanRegion,renderJapanRegion}from'./JapanRegion';
import{preloadIndonesia,renderIndonesia,isIndonesiaMap}from'./IndonesiaRegion';
import Phaser from 'phaser';
import {renderSanctuaryCliffs} from './SanctuaryCliffs';
import { projectedY, terrainHeight, cellCorners, MAP_ASSET_SCALE, terrainVertices, WORLD_UNIT_PX, type MapDefinition } from '@shaman/shared';
import { addContactShadow, addMapLighting } from './Lighting';
import { preloadNpcs } from './NpcLayer';
import { renderMountainArt } from './MountainArt';
import {preloadTerrainQuality,qualitySets,qualityFrame,renderQualityDecoration} from './terrain-quality';
import {WaterLayer,preloadWater} from './WaterLayer';
import {addSpiritwoodAtmosphere} from './SpiritwoodAtmosphere';
import bambooPresentation from './bamboo-presentation.json';
import teaPresentation from './tea-presentation.json';
import{preloadChina,renderChinaGround,renderChinaObject,isChinaMap}from'./ChinaRegion';
import {preloadForestDressing,renderForestDressing} from './ForestDressing';

// Map sprites and ground tiles built by tools/sprites/build_umbral_assets.py.
const BASE = '/assets/umbral';
const MANIFEST_KEY = 'umbral-manifest';
// Ground textures pack many stones into 128px; at 1x one stone is about half a world unit.
const GROUND_TILE_SCALE = 1;

interface TilesetAsset { image: string; lower: string; upper: string; tiles: { x: number; y: number; size: number; corners: number[] }[] }
interface MapAssetManifest {
  objects: Record<string, { image: string; width: number; height: number; anchor: { x: number; y: number } }>;
  ground: Record<string, { image: string }>;
  decals?: Record<string, { image: string; width: number; height: number }>;
  tilesets?: Record<string, TilesetAsset>;
  npcs?: Record<string, { image: string; width: number; height: number; anchor: { x: number; y: number } }>;
}

const objectKey = (id: string) => `umbral:object:${id}`;
const groundKey = (id: string) => `umbral:ground:${id}`;
const decalKey = (id: string) => `umbral:decal:${id}`;
const tilesetKey = (id: string) => `umbral:tileset:${id}`;
const TERRAIN_KEY = 'umbral:terrain';
/** Wang tiles are 16 asset px = one world unit at MAP_ASSET_SCALE. */
const TILE_PX = 16;

export function preloadMapAssets(scene: Phaser.Scene, map?: MapDefinition) {
  preloadChina(scene,map);
  if(isNorwayMap(map))preloadNorwayRegion(scene);
  if(isJapanMap(map))preloadJapanRegion(scene);
  if(isIndonesiaMap(map))preloadIndonesia(scene);
  if(map?.id==='mountain-spirit-sanctuary'){
    scene.load.image('sanctuary:kit','/assets/umbral/sanctuary-02/kit.png');
  }
  preloadForestDressing(scene,map);
  preloadWater(scene);
  preloadTerrainQuality(scene,map);
  scene.load.once(`filecomplete-json-${MANIFEST_KEY}`, (_key: string, _type: string, manifest: MapAssetManifest) => {
    for (const [id, asset] of Object.entries(manifest.objects)) scene.load.image(objectKey(id), `${BASE}/${asset.image}`);
    for (const [id, ground] of Object.entries(manifest.ground)) scene.load.image(groundKey(id), `${BASE}/${ground.image}`);
    for (const [id, decal] of Object.entries(manifest.decals ?? {})) scene.load.image(decalKey(id), `${BASE}/${decal.image}`);
    for (const [id, set] of Object.entries(manifest.tilesets ?? {})) scene.load.image(tilesetKey(id), `${BASE}/${set.image}`);
    preloadNpcs(scene, manifest);
  });
  scene.load.json(MANIFEST_KEY, `${BASE}/manifest.json`);
}

/** Draws ground regions and objects for a map. Objects depth-sort by their base y, like characters. */
export function renderMap(scene: Phaser.Scene, map: MapDefinition) {
  if(isNorwayMap(map)){const {water}=renderNorwayRegion(scene,map);return{widthPx:map.width*WORLD_UNIT_PX,heightPx:map.height*WORLD_UNIT_PX,water};}
  if(isJapanMap(map)){const {water}=renderJapanRegion(scene,map);return{widthPx:map.width*WORLD_UNIT_PX,heightPx:map.height*WORLD_UNIT_PX,water};}
  if(isIndonesiaMap(map)){const {water}=renderIndonesia(scene,map);return{widthPx:map.width*WORLD_UNIT_PX,heightPx:map.height*WORLD_UNIT_PX,water};}
  const manifest = scene.cache.json.get(MANIFEST_KEY) as MapAssetManifest | undefined;
  if (!manifest) throw new Error('Map asset manifest not loaded; call preloadMapAssets in preload()');
  const U = WORLD_UNIT_PX;
  const ground = (material: string, x: number, y: number, w: number, h: number) => {
    const key = groundKey(material);
    scene.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
    scene.add.tileSprite(x * U, y * U, w * U, h * U, key).setOrigin(0).setTileScale(GROUND_TILE_SCALE).setDepth(-2);
  };
  ground(map.ground.base, 0, 0, map.width, map.height);
  for (const r of map.ground.regions) ground(r.material, r.x, r.y, r.w, r.h);
  const water=renderTerrain(scene, map, manifest);
  renderChinaGround(scene,map);
  if(!isChinaMap(map))renderQualityDecoration(scene,map);
  addSpiritwoodAtmosphere(scene,map,map.id==='mountain-spirit-sanctuary'?{fog:[{id:'spring-mist',x:58,y:50,w:10,h:10,alpha:.1},{id:'low-hollow-mist',x:6,y:55,w:10,h:6,alpha:.08}],graph:{edges:map.terrain?.paint.filter(p=>p.shape==='path'&&p.terrain!=='water').map(p=>({points:p.shape==='path'?p.points:[],width:p.shape==='path'?p.r*2:0}))??[]}}:undefined);
  renderForestDressing(scene,map);
  // The adopted valley uses the exact localized review atmosphere, only once per scene.
  if(map.id==='mist-bamboo')addSpiritwoodAtmosphere(scene,map,bambooPresentation);
  if(map.id==='cloud-tea-slopes')addSpiritwoodAtmosphere(scene,map,teaPresentation);
  for (const d of map.decals ?? []) {
    const decal = manifest.decals?.[d.asset];
    if (!decal) throw new Error(`Decal ${d.asset} is missing from the manifest`);
    scene.textures.get(decalKey(d.asset)).setFilter(Phaser.Textures.FilterMode.NEAREST);
    scene.add.image(d.x * U, projectedY(map,d.x,d.y), decalKey(d.asset)).setScale(MAP_ASSET_SCALE).setDepth(-1.5);
  }

  for (const object of map.objects) {
    if(renderChinaObject(scene,map,object))continue;
    const regional=['whispering-spiritwood','lantern-paddy','moon-mangrove','monsoon-marsh'].includes(map.id);
    const foliage=regional&&['jungle-tree','shade-tree'].includes(object.asset);
    const visualAsset=foliage?'village-tropical-tree':object.asset;
    const asset = manifest.objects[visualAsset];
    if (!asset) throw new Error(`Map asset ${object.asset} is missing from the manifest`);
    const image = scene.add.image(object.x * U, projectedY(map,object.x,object.y) - (object.lift ?? 0) * U, objectKey(visualAsset))
      .setOrigin((asset.anchor.x + 0.5) / asset.width, (asset.anchor.y + 1) / asset.height)
      .setScale(foliage?(object.asset==='jungle-tree'?1.44:.78):MAP_ASSET_SCALE)
      .setFlipX(object.flip ?? false)
      .setName(object.id)
      .setDepth(object.y * U);
    if (regional) image.setTint(0xb1b5a3);
    image.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
    // Shadow sized to the footprint where there is one, otherwise to the sprite base.
    const shadowWidth = object.footprint ? object.footprint.w * U * 1.15 : asset.width * MAP_ASSET_SCALE * 0.7;
    if (!object.lift) addContactShadow(scene, object.x * U, projectedY(map,object.x,object.y) - 2, shadowWidth);
  }
  if(map.elevation?.artPass) renderMountainArt(scene,map);
  else if(map.elevation) renderElevationEdges(scene,map);
  addMapLighting(scene, map);
  return { widthPx: map.width * U, heightPx: map.height * U, water };
}

/**
 * Tile ground: every cell takes the Wang tile whose corners match its four vertex terrains (see terrainVertices).
 * Cells whose corners mix terrains no tileset joins, or touch unpainted vertices, are left to the region textures
 * below. All tiles are drawn once into one texture at asset scale, then shown at MAP_ASSET_SCALE.
 */
function renderTerrain(scene: Phaser.Scene, map: MapDefinition, manifest: MapAssetManifest) {
  if (!map.terrain) return;
  const water=new WaterLayer(scene,map);
  const enhancedSets=qualitySets(scene,map);
  const sets = enhancedSets??Object.entries(manifest.tilesets ?? {}).map(([id,set])=>[tilesetKey(id),set] as const);
  // Corner key ("1001", 1 = upper terrain) -> frame name, per tileset; and where each terrain's solid tile lives.
  const pairs = new Map<string, { key: string; upper: string; frames: Map<string, string> }>();
  const solid = new Map<string, { key: string; frame: string }>();
  for (const [id, set] of sets) {
    const key = id;
    const texture = scene.textures.get(key);
    texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
    const frames = new Map<string, string>();
    set.tiles.forEach((t, i) => {
      const name = `t${i}`;
      if (!texture.has(name)) texture.add(name, 0, t.x, t.y, t.size, t.size);
      frames.set(t.corners.join(''), name);
    });
    pairs.set([set.lower, set.upper].sort().join('|'), { key, upper: set.upper, frames });
    const low = frames.get('0000'), high = frames.get('1111');
    if (low && !solid.has(set.lower)) solid.set(set.lower, { key, frame: low });
    if (high && !solid.has(set.upper)) solid.set(set.upper, { key, frame: high });
  }
  const vertices = terrainVertices(map);
  if (scene.textures.exists(TERRAIN_KEY)) scene.textures.remove(TERRAIN_KEY);
  const canvas = scene.textures.addDynamicTexture(TERRAIN_KEY, map.width * TILE_PX, map.height * TILE_PX + (map.elevation ? 48 : 0));
  if (!canvas) return;
  canvas.setFilter(Phaser.Textures.FilterMode.NEAREST);
  for (let cy = 0; cy < map.height; cy++) {
    for (let cx = 0; cx < map.width; cx++) {
      let corners = cellCorners(vertices, map.width, cx, cy);
      if (corners.includes('')) continue;
      let kinds = [...new Set(corners)];
      // Three or four terrains meet (e.g. a dirt path joining a road on grass): no Wang tile has that, so the least
      // common terrains are folded into the most common one, keeping a pair that a tileset can draw.
      if (kinds.length > 2) {
        const count = (k: string) => corners.filter((c) => c === k).length;
        const [main, second] = [...kinds].sort((a, b) => count(b) - count(a));
        corners = corners.map((c) => (c === main || c === second ? c : main!)) as typeof corners;
        kinds = [main!, second!];
        if (!pairs.has([...kinds].sort().join('|'))) { corners = corners.map(() => main!) as typeof corners; kinds = [main!]; }
      }
      let tile: { key: string; frame: string } | undefined;
      if (kinds.length === 1) tile = solid.get(kinds[0]!);
      else if (kinds.length === 2) {
        const pair = pairs.get([...kinds].sort().join('|'));
        const frame = pair?.frames.get(corners.map((c) => (c === pair.upper ? 1 : 0)).join(''));
        if (pair && frame) tile = { key: pair.key, frame };
      }
      if (tile) {water.addTile(cx,cy,corners);const selected=qualityFrame(scene,map,tile,cx,cy);canvas.drawFrame(selected.key, selected.frame, cx * TILE_PX, cy * TILE_PX + (map.elevation ? 48-terrainHeight(map,cx+.5,cy+.5)*map.elevation.risePx/2 : 0));}
    }
  }
  // PixelLab's grass is brighter than the buildings; a light tint keeps the ground behind the architecture.
  scene.add.image(0, map.elevation ? -96 : 0, TERRAIN_KEY).setOrigin(0).setScale(MAP_ASSET_SCALE).setDepth(-1.8).setTint(map.id === 'whispering-spiritwood' ? 0x9aa99f : 0xa9b39c);
  renderLegacyPathWear(scene,map,solid);
  return water.finish();
}


/** Prototype retaining faces reuse the existing road texture; no generated assets. */
function renderElevationEdges(scene:Phaser.Scene,map:MapDefinition){
 if(map.id==='mountain-spirit-sanctuary'){renderSanctuaryCliffs(scene,map);return;}
 const e=map.elevation!;
 const face=(x:number,y:number,w:number,top:number,bottom:number)=>{
   const screenY=y*32-top*e.risePx;
   scene.add.tileSprite(x*32,screenY,w*32,(top-bottom)*e.risePx,groundKey('basalt-cobble')).setOrigin(0).setTint(0x696357).setDepth(y*32-1);
   scene.add.rectangle(x*32,screenY,w*32,3,0xb2a58b).setOrigin(0).setDepth(y*32-.9);
   scene.add.rectangle(x*32,y*32-bottom*e.risePx,w*32,8,0x090e0b,.35).setOrigin(0).setDepth(-1.3);
 };
 // Cell-wise segments leave actual transition corridors open; no wall across stairs.
 for(const y of [24,44])for(let x=5;x<75;x+=.5){
   if(e.transitions.some(t=>x+.25>=t.x&&x+.25<=t.x+t.w&&y>=t.y&&y<=t.y+t.h))continue;
   const a=terrainHeight(map,x+.25,y-.01),b=terrainHeight(map,x+.25,y+.01);if(a>b)face(x,y,.5,a,b);
 }
 // Market-facing retaining wall, with the S3 ramp cut out.
 for(let y=24;y<44;y++){if(y>=31&&y<35)continue;
   const py=projectedY(map,50,y);scene.add.tileSprite(50*32,py,10,32,groundKey('basalt-cobble')).setOrigin(0).setTint(0x696357).setDepth(y*32-1);
 }
 for(const t of e.transitions){
   if(t.kind!=='stairs')continue;
   const count=Math.round(t.h*2);
   for(let i=1;i<count;i++){const y=t.y+t.h*i/count,h=terrainHeight(map,t.x+t.w/2,y);
     scene.add.tileSprite(t.x*32,y*32-h*e.risePx,t.w*32,16,groundKey('basalt-cobble')).setOrigin(0).setTint(0xaaa28d).setDepth(-1.45);
     scene.add.rectangle(t.x*32,y*32-h*e.risePx,t.w*32,3,0x342c25,.85).setOrigin(0).setDepth(-1.4);
   }
 }
}


