import type { MapDefinition, MapObject, Rect } from '../world.js';
import type { NpcDefinition } from '../npc.js';

// Whispering Spiritwood / ชายป่าวิญญาณ — first hunting zone outside Umbral Capital (2026-10-09). Hand-authored:
// safe arrival village in the south, beginner training forest to the west (Lv 1-4), cursed forest to the east
// (Lv 5-10), abandoned spirit shrine to the north (mini boss). Layout, names and lines are PROVISIONAL;
// see docs/design/spiritwood/README.md. Coordinates are world units; an object's (x, y) is the centre of its base.

const obj = (id: string, asset: string, x: number, y: number, w: number, h: number, flip?: boolean): MapObject =>
  ({ id, asset, x, y, footprint: { w, h }, ...(flip ? { flip } : {}) });
const deco = (id: string, asset: string, x: number, y: number, flip?: boolean): MapObject =>
  ({ id, asset, x, y, footprint: null, ...(flip ? { flip } : {}) });
const bigTree = (id: string, x: number, y: number, flip?: boolean) => obj(id, 'jungle-tree', x, y, 1.8, 0.9, flip);
const tree = (id: string, x: number, y: number, flip?: boolean) => obj(id, 'shade-tree', x, y, 0.8, 0.5, flip);
const bamboo = (id: string, x: number, y: number, flip?: boolean) => obj(id, 'bamboo', x, y, 1.4, 0.6, flip);
const rock = (id: string, x: number, y: number, flip?: boolean) => obj(id, 'mossy-rock', x, y, 1.8, 0.7, flip);
const fern = (id: string, x: number, y: number, flip?: boolean) => deco(id, 'fern', x, y, flip);

export const SPIRITWOOD_SAFE_VILLAGE: Rect = { x: 28, y: 46, w: 24, h: 18 };
const WEST_POND = { x: 19, y: 54, r: 3.2 };
const NORTH_POND = { x: 58, y: 14, r: 2.6 };

// ---- South: arrival village (safe zone) ----
const VILLAGE: MapObject[] = [
  // Return portal: a jade ritual circle (drawn by the client) between two ritual pillars and spirit stones.
  obj('portal-pillar-w', 'ritual-pillar', 37.6, 61.8, 0.8, 0.5),
  obj('portal-pillar-e', 'ritual-pillar', 42.4, 61.8, 0.8, 0.5),
  obj('portal-stone-w', 'spirit-lantern', 36.0, 60.6, 0.9, 0.5),
  obj('portal-stone-e', 'spirit-lantern', 44.0, 60.6, 0.9, 0.5),
  obj('village-house-w', 'stilt-house', 31.5, 52.0, 4.8, 2.0),
  obj('village-house-e', 'stilt-house', 48.5, 52.0, 4.8, 2.0, true),
  obj('village-board', 'noticeboard', 36.4, 56.2, 1.6, 0.5),
  obj('village-well', 'well', 46.8, 55.6, 1.1, 0.8),
  obj('village-stall', 'market-stall', 33.4, 59.4, 3.0, 1.2),
  obj('village-spirit-house', 'spirit-house', 34.6, 48.6, 0.6, 0.4),
  obj('village-lantern-w', 'talisman-lantern', 38.0, 46.8, 0.8, 0.5),
  obj('village-lantern-e', 'talisman-lantern', 42.2, 46.8, 0.8, 0.5),
  obj('village-fence-e1', 'teak-fence', 48.0, 58.6, 2.6, 0.5),
  obj('village-fence-e2', 'teak-fence', 50.6, 58.6, 2.6, 0.5),
  deco('village-pots-w', 'clay-pots', 29.4, 54.8),
  deco('village-pots-e', 'clay-pots', 51.2, 54.6, true),
  tree('village-tree-w', 28.6, 48.2), tree('village-tree-e', 51.6, 48.6, true),
  deco('village-flowers', 'flower-bush', 44.6, 49.6),
];

// ---- West: beginner training forest (Leaf Wisps) ----
const WEST: MapObject[] = [
  obj('west-dummy-a', 'training-dummy', 14.0, 33.4, 0.7, 0.4),
  obj('west-dummy-b', 'training-dummy', 17.6, 32.6, 0.7, 0.4),
  obj('west-spirit-house', 'spirit-house', 17.0, 28.4, 0.6, 0.4),
  rock('west-rock-a', 22.6, 35.0), rock('west-rock-b', 10.2, 41.6, true),
  fern('west-fern-a', 11.0, 34.2), fern('west-fern-b', 20.4, 40.2, true), fern('west-fern-c', 15.2, 41.2),
  bigTree('west-big-a', 6.0, 27.2), bigTree('west-big-b', 24.4, 27.6, true), bigTree('west-big-c', 5.2, 45.4),
  tree('west-tree-a', 9.4, 26.4), tree('west-tree-b', 21.2, 25.8, true), tree('west-tree-c', 26.6, 31.4),
  tree('west-tree-d', 26.2, 44.2, true), tree('west-tree-e', 12.4, 46.2), tree('west-tree-f', 7.6, 36.6, true),
  bamboo('west-bamboo-a', 3.4, 31.2), bamboo('west-bamboo-b', 3.8, 33.4, true), bamboo('west-bamboo-c', 27.6, 37.2), bamboo('west-bamboo-d', 28.4, 39.2, true),
  // Lotus pond south-west of the village.
  deco('pond-lotus-a', 'lotus-pads', 18.0, 53.4), deco('pond-lotus-b', 'lotus-pads', 20.4, 55.2, true),
  deco('pond-reeds-a', 'reed-planter', 15.6, 52.6), deco('pond-reeds-b', 'reed-planter', 22.4, 56.6, true),
  tree('pond-tree', 23.4, 51.0),
];

// ---- East: cursed forest (future Lv 5-10 spawns) ----
const EAST: MapObject[] = [
  obj('east-cursed-a', 'cursed-tree', 58.0, 25.0, 1.2, 0.6), obj('east-cursed-b', 'cursed-tree', 70.2, 27.0, 1.2, 0.6, true),
  obj('east-cursed-c', 'cursed-tree', 74.0, 40.2, 1.2, 0.6), obj('east-cursed-d', 'cursed-tree', 60.4, 44.2, 1.2, 0.6, true),
  obj('east-dead-a', 'dead-tree', 63.2, 23.2, 1.0, 0.5), obj('east-dead-b', 'dead-tree', 67.0, 44.6, 1.0, 0.5, true),
  obj('east-dead-c', 'dead-tree', 55.8, 31.2, 1.0, 0.5), obj('east-dead-d', 'dead-tree', 76.4, 31.4, 1.0, 0.5, true),
  obj('east-dead-e', 'dead-tree', 72.0, 35.6, 1.0, 0.5),
  bigTree('east-big-a', 53.6, 22.2), bigTree('east-big-b', 77.0, 46.6, true),
  obj('east-totem-a', 'bone-totem', 64.0, 30.0, 0.6, 0.4), obj('east-totem-b', 'bone-totem', 68.2, 38.4, 0.6, 0.4),
  obj('east-skull-a', 'skull-lantern', 59.2, 36.2, 0.6, 0.4), obj('east-skull-b', 'skull-lantern', 70.4, 32.6, 0.6, 0.4),
  rock('east-rock-a', 61.2, 40.0), rock('east-rock-b', 73.0, 25.2, true),
  fern('east-fern-a', 57.0, 40.4), fern('east-fern-b', 65.2, 26.2, true), fern('east-fern-c', 74.2, 36.2),
];

// ---- North: abandoned spirit shrine ----
const NORTH: MapObject[] = [
  obj('shrine', 'ruined-shrine', 40.0, 9.4, 5.0, 2.2),
  obj('shrine-stele-w', 'stele', 35.6, 14.0, 0.5, 0.3), obj('shrine-stele-e', 'stele', 44.4, 14.0, 0.5, 0.3),
  obj('shrine-stone-w', 'spirit-lantern', 36.8, 16.6, 0.9, 0.5), obj('shrine-stone-e', 'spirit-lantern', 43.2, 16.6, 0.9, 0.5),
  obj('shrine-urn', 'incense-urn', 37.4, 12.4, 0.7, 0.4),
  obj('shrine-cursed', 'cursed-tree', 33.8, 18.6, 1.2, 0.6),
  bigTree('shrine-big-a', 30.0, 6.0), bigTree('shrine-big-b', 50.2, 7.0, true), bigTree('shrine-big-c', 28.2, 15.2, true), bigTree('shrine-big-d', 52.0, 16.4),
  obj('shrine-sacred', 'sacred-tree', 46.6, 4.4, 2.4, 1.2, true),
  bamboo('shrine-bamboo-a', 31.0, 10.2), bamboo('shrine-bamboo-b', 49.4, 11.2, true),
  deco('north-pond-lotus', 'lotus-pads', 57.6, 13.6), deco('north-pond-reeds', 'reed-planter', 60.6, 15.6, true),
  rock('north-rock', 54.4, 18.2),
];

// ---- North-west: haunted grove of the Spirit Flames (Lv 3-5) ----
const NORTH_WEST: MapObject[] = [
  bigTree('nw-big-a', 9.6, 11.4), bigTree('nw-big-b', 22.4, 10.6, true),
  obj('nw-dead-a', 'dead-tree', 15.8, 12.4, 1.0, 0.5), obj('nw-dead-b', 'dead-tree', 23.6, 19.6, 1.0, 0.5, true),
  tree('nw-tree-a', 13.2, 20.6, true), bamboo('nw-bamboo', 7.6, 17.0),
  rock('nw-rock-a', 18.8, 16.2), obj('nw-totem', 'bone-totem', 11.6, 15.6, 0.6, 0.4),
  obj('nw-skull', 'skull-lantern', 20.6, 13.8, 0.6, 0.4),
  fern('nw-fern-a', 12.8, 13.4), fern('nw-fern-b', 17.2, 20.2, true), fern('nw-fern-c', 21.8, 16.4),
];

// ---- Forest edge: dense, irregular tree line so the map reads as a clearing inside a forest ----
const EDGE: MapObject[] = [
  ...[3, 9.4, 15.2, 21.6, 27.0].map((x, i) => (i % 2 ? bamboo : bigTree)(`edge-n-w${i}`, x, 1.8 + (i % 3) * 0.6, i % 2 === 1)),
  ...[55.0, 61.0, 66.8, 72.4, 77.6].map((x, i) => (i % 2 ? bigTree : bamboo)(`edge-n-e${i}`, x, 1.6 + (i % 2) * 0.8, i % 2 === 0)),
  ...[7.0, 12.6, 18.4, 23.2].map((y, i) => (i % 2 ? tree : bigTree)(`edge-w${i}`, 1.6 + (i % 2) * 0.6, y, i === 2)),
  ...[49.6, 58.4, 62.6].map((y, i) => (i % 2 ? bamboo : bigTree)(`edge-sw${i}`, 2.0 + i * 0.4, y, i === 1)),
  ...[6.4, 12.0, 18.2, 52.0, 57.2, 62.4].map((y, i) => (i % 2 ? bigTree : tree)(`edge-e${i}`, 78.2 - (i % 3) * 0.5, y, i % 2 === 0)),
  ...[5.0, 10.8, 25.8].map((x, i) => (i % 2 ? bamboo : bigTree)(`edge-s-w${i}`, x, 62.8, i === 2)),
  ...[55.6, 62.0, 68.4, 74.0].map((x, i) => (i % 2 ? bigTree : bamboo)(`edge-s-e${i}`, x, 62.6 + (i % 2) * 0.4, i % 2 === 1)),
];

const NPCS: NpcDefinition[] = [
  { id: 'sw-hunter', sprite: 'npc-guard', role: 'quest', x: 37.4, y: 53.6, name: { th: 'พรานเดช', en: 'Hunter Det' }, title: 'พรานนำทางชายป่า',
    greeting: 'ป่าแถบนี้มีภูตใบไม้ลอยวนอยู่ทางตะวันตก ถ้ายังใหม่ เริ่มฝึกล่าที่นั่นก่อน ระวังป่าทางตะวันออกให้ดี' },
  { id: 'sw-healer', sprite: 'npc-herbalist', role: 'healer', x: 43.8, y: 53.4, name: { th: 'ยายบัว', en: 'Grandma Bua' }, title: 'หมอยาประจำหมู่บ้าน',
    greeting: 'บาดเจ็บมาหรือหลาน มาให้ยายเป่ามนต์ให้ เดี๋ยวก็หาย' },
  { id: 'sw-merchant', sprite: 'npc-trader', role: 'shop-consumable', x: 33.4, y: 57.6, name: { th: 'นายเพิ่ม', en: 'Mr. Perm' }, title: 'แผงเสบียงชายป่า',
    greeting: 'ยาสมุนไพรกับน้ำมนต์ครบ ก่อนเข้าป่าแวะซื้อติดตัวไว้หน่อย' },
];

export const WHISPERING_SPIRITWOOD: MapDefinition = {
  id: 'whispering-spiritwood',
  name: 'ชายป่าวิญญาณ',
  nameEn: 'Whispering Spiritwood',
  width: 80,
  height: 64,
  spawn: { x: 40, y: 57.6 },
  ground: { base: 'dark-grass', regions: [] },
  terrain: {
    base: 'grass',
    paint: [
      { terrain: 'water', shape: 'circle', ...WEST_POND },
      { terrain: 'water', shape: 'circle', ...NORTH_POND },
      // Village yard and the winding dirt trails to the three areas.
      { terrain: 'dirt', shape: 'rect', x: 34, y: 49, w: 12, h: 9 },
      { terrain: 'dirt', shape: 'path', points: [[40, 63], [40, 52], [41, 44], [39, 36], [40, 28], [41, 21], [40, 16]], r: 1.3 },
      { terrain: 'dirt', shape: 'path', points: [[40.6, 44], [33, 42.4], [26, 40.2], [19, 37.6], [13, 37]], r: 1.1 },
      { terrain: 'dirt', shape: 'path', points: [[40, 39], [47, 37.6], [55, 36.4], [63, 34.4], [70, 33.6]], r: 1.1 },
      // Shrine forecourt: old stone paving.
      { terrain: 'road', shape: 'circle', x: 40, y: 13.6, r: 3.6 },
    ],
  },
  npcs: NPCS,
  objects: [...VILLAGE, ...WEST, ...NORTH_WEST, ...EAST, ...NORTH, ...EDGE],
  blockers: [
    { x: WEST_POND.x - 2.2, y: WEST_POND.y - 2.2, w: 4.4, h: 4.4 },
    { x: NORTH_POND.x - 1.8, y: NORTH_POND.y - 1.8, w: 3.6, h: 3.6 },
  ],
  landmarks: [
    { id: 'sw-village', name: { th: 'หมู่บ้านชายป่า', en: 'Edge Village' }, x: 40, y: 50, kind: 'village' },
    { id: 'sw-training', name: { th: 'ป่าฝึกล่า', en: 'Training Forest' }, x: 15, y: 30, kind: 'forest' },
    { id: 'sw-cursed', name: { th: 'ป่าต้องสาป', en: 'Cursed Forest' }, x: 66, y: 29, kind: 'forest' },
    { id: 'sw-shrine', name: { th: 'ศาลวิญญาณร้าง', en: 'Abandoned Spirit Shrine' }, x: 40, y: 5, kind: 'shrine' },
    { id: 'sw-portal', name: { th: 'ประตูสู่นครมนตร์ทมิฬ', en: 'To Umbral Capital' }, x: 40, y: 60.6, kind: 'gate' },
  ],
  portals: [{
    id: 'village-gate', area: { x: 38.6, y: 62.2, w: 2.8, h: 1.3 }, to: { mapId: 'umbral-capital', portalId: 'south-gate' },
    arrival: { x: 40, y: 58.6 }, label: { th: 'กลับนครมนตร์ทมิฬ', en: 'Back to Umbral Capital' },
  }],
  safeZones: [SPIRITWOOD_SAFE_VILLAGE],
  spawnRegions: [
    // West training forest (Lv 1-4).
    { id: 'west-wisps', area: { x: 8, y: 29, w: 17, h: 13 }, monsters: [{ kind: 'leaf-wisp', count: 7 }], respawnMs: 9000 },
    // Strawlings have their own clearing south of the wisps, so a level-1 player is never mobbed while learning.
    { id: 'west-strawlings', area: { x: 6, y: 43, w: 15, h: 6 }, monsters: [{ kind: 'cursed-strawling', count: 4 }], respawnMs: 12000 },
    // North-west woods between the training forest and the shrine (Lv 3-5).
    { id: 'nw-flames', area: { x: 8, y: 10, w: 16, h: 11 }, monsters: [{ kind: 'spirit-flame', count: 4 }], respawnMs: 15000 },
    // East cursed forest (Lv 5-8).
    { id: 'east-macaques', area: { x: 56, y: 24, w: 18, h: 9 }, monsters: [{ kind: 'shadow-macaque', count: 4 }], respawnMs: 14000 },
    { id: 'east-guardians', area: { x: 57, y: 36, w: 16, h: 8 }, monsters: [{ kind: 'clay-guardian', count: 3 }], respawnMs: 20000 },
    // North: the abandoned shrine's mini boss (Lv 10), long respawn.
    { id: 'shrine-boss', area: { x: 37.5, y: 16, w: 5, h: 2.5 }, monsters: [{ kind: 'cursed-rootkeeper', count: 1 }], respawnMs: 120000 },
  ],
};
