import Phaser from 'phaser';
import { cellCorners, MAP_ASSET_SCALE, terrainVertices, WORLD_UNIT_PX, type MapDefinition } from '@shaman/shared';
import { addContactShadow, addMapLighting } from './Lighting';
import { preloadNpcs } from './NpcLayer';

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

export function preloadMapAssets(scene: Phaser.Scene) {
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
  renderTerrain(scene, map, manifest);
  for (const d of map.decals ?? []) {
    const decal = manifest.decals?.[d.asset];
    if (!decal) throw new Error(`Decal ${d.asset} is missing from the manifest`);
    scene.textures.get(decalKey(d.asset)).setFilter(Phaser.Textures.FilterMode.NEAREST);
    scene.add.image(d.x * U, d.y * U, decalKey(d.asset)).setScale(MAP_ASSET_SCALE).setDepth(-1.5);
  }

  for (const object of map.objects) {
    const asset = manifest.objects[object.asset];
    if (!asset) throw new Error(`Map asset ${object.asset} is missing from the manifest`);
    const image = scene.add.image(object.x * U, (object.y - (object.lift ?? 0)) * U, objectKey(object.asset))
      .setOrigin((asset.anchor.x + 0.5) / asset.width, (asset.anchor.y + 1) / asset.height)
      .setScale(MAP_ASSET_SCALE)
      .setFlipX(object.flip ?? false)
      .setDepth(object.y * U);
    image.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
    // Shadow sized to the footprint where there is one, otherwise to the sprite base.
    const shadowWidth = object.footprint ? object.footprint.w * U * 1.15 : asset.width * MAP_ASSET_SCALE * 0.7;
    if (!object.lift) addContactShadow(scene, object.x * U, object.y * U - 2, shadowWidth);
  }
  addMapLighting(scene, map);
  return { widthPx: map.width * U, heightPx: map.height * U };
}

/**
 * Tile ground: every cell takes the Wang tile whose corners match its four vertex terrains (see terrainVertices).
 * Cells whose corners mix terrains no tileset joins, or touch unpainted vertices, are left to the region textures
 * below. All tiles are drawn once into one texture at asset scale, then shown at MAP_ASSET_SCALE.
 */
function renderTerrain(scene: Phaser.Scene, map: MapDefinition, manifest: MapAssetManifest) {
  if (!map.terrain) return;
  const sets = Object.entries(manifest.tilesets ?? {});
  // Corner key ("1001", 1 = upper terrain) -> frame name, per tileset; and where each terrain's solid tile lives.
  const pairs = new Map<string, { key: string; upper: string; frames: Map<string, string> }>();
  const solid = new Map<string, { key: string; frame: string }>();
  for (const [id, set] of sets) {
    const key = tilesetKey(id);
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
  const canvas = scene.textures.addDynamicTexture(TERRAIN_KEY, map.width * TILE_PX, map.height * TILE_PX);
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
      if (tile) canvas.drawFrame(tile.key, tile.frame, cx * TILE_PX, cy * TILE_PX);
    }
  }
  // PixelLab's grass is brighter than the buildings; a light tint keeps the ground behind the architecture.
  scene.add.image(0, 0, TERRAIN_KEY).setOrigin(0).setScale(MAP_ASSET_SCALE).setDepth(-1.8).setTint(0xa9b39c);
}

