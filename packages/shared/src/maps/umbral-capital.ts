import type { MapDefinition, MapObject, Rect } from '../world.js';
import { UMBRAL_NPCS } from './umbral-npcs.js';

// Umbral Capital / นครมนตร์ทมิฬ — hand-authored layout (level design pass 2026-10-09, following the user's city
// prototype: walled city, canals with bridges, temple to the north, Great Yantra Plaza in the centre, districts
// around it). Blueprint and reasoning: docs/design/UMBRAL_CAPITAL_REDESIGN.md. Every object below is placed by hand;
// nothing is generated or scattered.
// Coordinates are world units (x right, y down); an object's (x, y) is the centre of its base.

/** Object with a collision footprint centred on x and extending h units up from y. */
const obj = (id: string, asset: string, x: number, y: number, w: number, h: number, flip?: boolean): MapObject =>
  ({ id, asset, x, y, footprint: { w, h }, ...(flip ? { flip } : {}) });
/** Walk-through dressing (flowers, lotus pads, bridges): drawn, never blocks. */
const deco = (id: string, asset: string, x: number, y: number, flip?: boolean): MapObject =>
  ({ id, asset, x, y, footprint: null, ...(flip ? { flip } : {}) });

// Lighting (redesign 2026-10-09): each light type has one job, see docs/design/UMBRAL_CAPITAL_REDESIGN.md.
/** Amber talisman post: road junctions, bridge heads and district entrances only; never in rows. */
const lantern = (id: string, x: number, y: number) => obj(id, 'talisman-lantern', x, y, 0.8, 0.5);
/** Jade spirit stone: sacred places only (plaza mouths, spirit garden). */
const spiritLantern = (id: string, x: number, y: number) => obj(id, 'spirit-lantern', x, y, 0.9, 0.5);
/** Bronze ritual fire: ceremonial entrances (temple stairs, gate, training yard). */
const ritualFire = (id: string, x: number, y: number) => obj(id, 'ritual-fire', x, y, 1.2, 0.6);
/** Paper lantern hung from a building's eave or a stall awning: drawn `lift` units up, never blocks. */
const hanging = (id: string, x: number, y: number, lift: number): MapObject => ({ id, asset: 'hanging-lantern', x, y, footprint: null, lift });
const blossom = (id: string, x: number, y: number, flip?: boolean) => obj(id, 'blossom-tree', x, y, 1.6, 0.9, flip);
const fence = (id: string, x: number, y: number) => obj(id, 'teak-fence', x, y, 2.6, 0.5);
const wall = (id: string, x: number) => obj(id, 'city-wall', x, 3.4, 7.4, 1.2);
const southWall = (id: string, x: number) => obj(id, 'city-wall', x, 59.6, 7.4, 1.2);

// ---- Water (also collision, see BLOCKERS) ----
const WEST_CANAL: Rect = { x: 2, y: 6, w: 3, h: 50 };
const EAST_CANAL: Rect = { x: 75, y: 6, w: 3, h: 50 };
const SW_CANAL: Rect = { x: 5, y: 44, w: 28, h: 2 };
const SE_CANAL: Rect = { x: 47, y: 44, w: 28, h: 2 };
const SPIRIT_POND = { x: 15, y: 13, r: 3 };
/** Bridge decks across the south canals (walkable gaps in the canal blockers). */
const SW_BRIDGE_X = 16, SE_BRIDGE_X = 64, BRIDGE_HALF = 1.2;

// ---- Great Yantra Plaza: the one place laid out symmetrically ----
const PLAZA: MapObject[] = [
  obj('plaza-spirit-pillar', 'spirit-pillar', 40, 31, 1.6, 0.9),
  obj('plaza-incense-w', 'incense-urn', 38.2, 31.4, 0.7, 0.4),
  obj('plaza-incense-e', 'incense-urn', 41.8, 31.4, 0.7, 0.4),
  obj('plaza-pillar-nw', 'ritual-pillar', 35.6, 27.6, 0.8, 0.5),
  obj('plaza-pillar-ne', 'ritual-pillar', 44.4, 27.6, 0.8, 0.5),
  obj('plaza-pillar-sw', 'ritual-pillar', 35.6, 36.4, 0.8, 0.5),
  obj('plaza-pillar-se', 'ritual-pillar', 44.4, 36.4, 0.8, 0.5),
  // Four fire bowls on the ring between the disc and the road mouths.
  obj('plaza-brazier-nw', 'bronze-brazier', 32.4, 26.4, 1.0, 0.6),
  obj('plaza-brazier-ne', 'bronze-brazier', 47.6, 26.4, 1.0, 0.6),
  obj('plaza-brazier-sw', 'bronze-brazier', 32.4, 38.4, 1.0, 0.6),
  obj('plaza-brazier-se', 'bronze-brazier', 47.6, 38.4, 1.0, 0.6),
  // Guardians face the gate road; jade spirit stones mark the west and east road mouths (one each, diagonal).
  obj('plaza-guardian-w', 'yak-guardian', 36.2, 42.2, 1.6, 0.7),
  obj('plaza-guardian-e', 'yak-guardian', 43.8, 42.2, 1.6, 0.7, true),
  spiritLantern('plaza-spirit-w', 29.4, 29.4),
  spiritLantern('plaza-spirit-e', 50.6, 35.4),
];

// ---- North: Black Spirit Temple on its forecourt, against the north wall ----
const TEMPLE: MapObject[] = [
  obj('temple', 'thai-temple', 40, 13.5, 9.2, 4.2),
  obj('temple-guardian-w', 'yak-guardian', 34.8, 15.8, 1.6, 0.7),
  obj('temple-guardian-e', 'yak-guardian', 45.2, 15.8, 1.6, 0.7, true),
  obj('temple-banner-w', 'talisman-banner', 33.2, 12.8, 0.6, 0.4),
  obj('temple-banner-e', 'talisman-banner', 46.8, 12.8, 0.6, 0.4),
  // Ceremonial fire pair at the foot of the stairs (the only paired lights outside the plaza and gate).
  ritualFire('temple-fire-w', 37.0, 18.6),
  ritualFire('temple-fire-e', 43.0, 18.6),
  // Spirit altar off the axis, where the quest NPC will stand.
  obj('temple-altar', 'incense-urn', 47.2, 18.4, 0.7, 0.4),
];

// ---- North-west: spirit garden (สวนศิรวิญญาณ) round a lotus pond ----
const SPIRIT_GARDEN: MapObject[] = [
  obj('garden-sacred-tree', 'sacred-tree', 23.6, 16.4, 2.4, 1.2),
  deco('garden-lotus-1', 'lotus-pads', 13.6, 12.4),
  deco('garden-lotus-2', 'lotus-pads', 16.8, 14.2),
  deco('garden-lotus-3', 'lotus-pads', 14.4, 15.0),
  obj('garden-incense', 'incense-urn', 26.9, 19.5, 0.7, 0.4),
  spiritLantern('garden-spirit', 18.8, 13.2),
  obj('garden-stilt-house', 'stilt-house', 11.0, 22.6, 4.8, 2.0),
];

// ---- West: training quarter (สำนักฝึกคาถา): hall on the street, practice yard to the south ----
const TRAINING: MapObject[] = [
  obj('training-hall', 'training-hall', 19.6, 28.6, 7.6, 3.0),
  obj('training-dorm', 'stilt-house', 10.8, 28.2, 4.8, 2.0),
  obj('training-banner', 'talisman-banner', 25.2, 28.8, 0.6, 0.4),
  lantern('training-lantern-2', 24.0, 35.6),
  // Practice yard: dummies in a row, spell-target steles opposite, a fire bowl for the instructor.
  obj('training-dummy-1', 'training-dummy', 13.2, 38.8, 0.7, 0.4),
  obj('training-dummy-2', 'training-dummy', 15.6, 38.8, 0.7, 0.4),
  obj('training-dummy-3', 'training-dummy', 18.0, 38.8, 0.7, 0.4),
  // Spell targets: ritual pillars (the v1 gothic steles were off-theme).
  obj('training-target-1', 'ritual-pillar', 21.6, 40.6, 0.8, 0.5),
  obj('training-target-2', 'ritual-pillar', 23.8, 40.6, 0.8, 0.5),
  ritualFire('training-fire', 10.4, 37.4),
  // Fence on the yard's south edge with a gap for the path to the south bridge.
  fence('training-fence-1', 10.4, 43.0), fence('training-fence-2', 13.0, 43.0),
  fence('training-fence-3', 19.2, 43.0), fence('training-fence-4', 21.8, 43.0), fence('training-fence-5', 24.4, 43.0),
];

// ---- East: talisman market (ตลาดเครื่องราง) and herbal brewery (โรงต้มสมุนไพร) ----
const MARKET: MapObject[] = [
  // Shopfronts on the north side of the market street.
  obj('herbal-brewery', 'teak-house', 56.4, 28.8, 7.0, 2.6),
  obj('herbal-cauldron', 'cauldron', 60.8, 29.4, 1.0, 0.6),
  obj('talisman-shop', 'row-house', 67.2, 29.0, 8.6, 2.4),
  obj('talisman-sign', 'talisman-banner', 72.4, 29.6, 0.6, 0.4),
  lantern('market-lantern-1', 52.6, 29.4),
  // Hanging lanterns on shop eaves and stall awnings, unevenly spread.
  hanging('herbal-hanging', 53.4, 29.0, 2.6),
  hanging('talisman-hanging', 71.6, 29.2, 2.4),
  hanging('stall-hanging-1', 58.2, 38.6, 2.0),
  hanging('stall-hanging-2', 71.9, 42.0, 2.0),
  // More hanging lanterns (user 2026-10-09): stall awnings and the talisman shop's west eave, spaced unevenly.
  hanging('stall-hanging-3', 54.6, 38.6, 2.0),
  hanging('stall-hanging-4', 67.8, 37.8, 2.0),
  hanging('talisman-hanging-2', 63.4, 29.2, 2.4),
  hanging('herbal-hanging-2', 59.6, 29.0, 2.4),
  // Storage behind the shops (the alley at x ~62 leads north).
  obj('market-crates-1', 'crates', 52.8, 24.6, 1.8, 1.0),
  obj('market-barrels-1', 'barrels', 71.6, 25.0, 1.6, 0.9),
  // Market square south of the street: stalls round a shared open space, trader in the middle.
  obj('market-stall-1', 'market-stall', 56.0, 38.4, 3.0, 1.2),
  obj('market-stall-2', 'market-stall', 60.4, 38.4, 3.0, 1.2),
  obj('market-stall-3', 'market-stall', 69.2, 37.6, 3.0, 1.2),
  obj('market-stall-4', 'market-stall', 70.6, 41.8, 3.0, 1.2),
  obj('market-crates-2', 'crates', 53.6, 41.6, 1.8, 1.0),
  obj('market-barrels-2', 'barrels', 58.4, 42.2, 1.6, 0.9),
];

// ---- North-east: brahmin lane (เรือนพราหมณ์), houses round a small well courtyard ----
const NORTH_EAST: MapObject[] = [
  obj('brahmin-house', 'teak-house', 68.8, 15.4, 7.0, 2.6),
  obj('brahmin-stilt', 'stilt-house', 58.6, 13.8, 4.8, 2.0),
  obj('ne-well', 'well', 63.8, 18.4, 1.1, 0.8),
  fence('ne-fence-1', 56.2, 18.6), fence('ne-fence-2', 72.0, 19.6),
  lantern('ne-lantern', 63.6, 22.4),
  hanging('brahmin-hanging', 65.0, 15.6, 2.6),
];

// ---- South-west: shaman houses (เรือนหมอผี) beyond the canal ----
const SOUTH_WEST: MapObject[] = [
  obj('sw-stilt-1', 'stilt-house', 11.2, 52.6, 4.8, 2.0),
  obj('sw-row', 'row-house', 24.6, 53.8, 8.6, 2.4),
  obj('sw-stilt-2', 'stilt-house', 30.8, 50.2, 4.8, 2.0),
  fence('sw-fence-1', 8.2, 55.6), fence('sw-fence-2', 14.4, 55.6),
  obj('sw-incense', 'incense-urn', 16.4, 52.2, 0.7, 0.4),
  lantern('sw-lantern-1', 17.6, 48.0),
  hanging('sw-hanging', 20.0, 54.0, 2.2),
  obj('sw-barrels', 'barrels', 20.2, 55.6, 1.6, 0.9),
];

// ---- South-east: community quarter (ชุมชนชาวเมือง) beyond the canal ----
const SOUTH_EAST: MapObject[] = [
  obj('se-row', 'row-house', 55.2, 52.6, 8.6, 2.4),
  obj('se-stilt-1', 'stilt-house', 66.6, 50.8, 4.8, 2.0),
  obj('se-stilt-2', 'stilt-house', 71.0, 55.8, 4.8, 2.0),
  obj('se-well', 'well', 62.4, 54.4, 1.1, 0.8),
  obj('se-crates', 'crates', 50.2, 55.4, 1.8, 1.0),
  fence('se-fence-1', 58.8, 56.4), fence('se-fence-2', 66.0, 57.0),
  lantern('se-lantern-1', 62.0, 48.2),
  hanging('se-hanging', 64.0, 51.0, 2.2),
];

// ---- South: city gate in the south wall ----
const GATE: MapObject[] = [
  // The gate sprite has no footprint of its own; its two pillars are blockers so the passage stays open.
  // Thai gate (PixelLab, 8.4 x 9.4 units); its pillars (measured from the sprite) are blockers, the passage between
  // them (x 38.6-41.4) stays open.
  { id: 'city-gate', asset: 'thai-gate', x: 40, y: 58.5, footprint: null },
  obj('gate-guardian-w', 'yak-guardian', 33.8, 56.6, 1.6, 0.7),
  obj('gate-guardian-e', 'yak-guardian', 46.2, 56.6, 1.6, 0.7, true),
  obj('gate-banner-w', 'talisman-banner', 35.8, 52.6, 0.6, 0.4),
  obj('gate-banner-e', 'talisman-banner', 44.2, 52.6, 0.6, 0.4),
  ritualFire('gate-fire-w', 36.8, 54.8),
  ritualFire('gate-fire-e', 43.2, 54.8),
  // Avenue junctions with the south-west and south-east paths, deliberately not opposite each other.
  lantern('avenue-lantern-sw', 35.6, 48.6),
  lantern('avenue-lantern-se', 44.6, 50.8),
];

// ---- Walls, towers and the bridges ----
const WALLS: MapObject[] = [
  ...[10.6, 18.0, 25.4, 54.6, 62.0, 69.4].map((x, i) => wall(`north-wall-${i}`, x)),
  ...[10.6, 18.0, 25.4, 54.6, 62.0, 69.4].map((x, i) => southWall(`south-wall-${i}`, x)),
  // The north wall stops at the temple's blossom trees; the temple itself backs onto the city's edge.
  obj('north-wall-w', 'city-wall', 32.2, 3.4, 5.0, 1.2),
  obj('north-wall-e', 'city-wall', 47.8, 3.4, 5.0, 1.2),
  // East and west walls: 8-unit segments of the side-view wall stacked end to end along the map edge (outside the
  // canals, so no footprint is needed); flipped on the east so the stone face looks into the city.
  // Corner fillers close the gap between each corner tower and the first north/south wall section (drawn only; the
  // neighbouring sections already carry the footprints).
  deco('north-wall-fill-w', 'city-wall', 7.0, 3.4), deco('north-wall-fill-e', 'city-wall', 73.0, 3.4),
  deco('south-wall-fill-w', 'city-wall', 8.0, 59.6), deco('south-wall-fill-e', 'city-wall', 72.0, 59.6),
  // Every other section carries a red banner; the two sides are offset by one so the pattern does not mirror.
  ...[10, 18, 26, 34, 42, 50, 58].map((y, i) => deco(`west-wall-${i}`, i % 2 ? 'city-wall-side-banner' : 'city-wall-side', 1.3, y)),
  ...[10, 18, 26, 34, 42, 50, 58].map((y, i) => deco(`east-wall-${i}`, i % 2 ? 'city-wall-side' : 'city-wall-side-banner', 78.7, y, true)),
  obj('tower-nw', 'wall-tower', 3.6, 5.0, 2.6, 1.4),
  obj('tower-ne', 'wall-tower', 76.4, 5.0, 2.6, 1.4),
  obj('tower-sw', 'wall-tower', 3.6, 59.4, 2.6, 1.4),
  obj('tower-se', 'wall-tower', 76.4, 59.4, 2.6, 1.4),
  obj('tower-gate-w', 'wall-tower', 31.0, 59.4, 2.6, 1.4),
  obj('tower-gate-e', 'wall-tower', 49.0, 59.4, 2.6, 1.4),
  deco('sw-bridge', 'bridge-v', SW_BRIDGE_X, 46.6),
  deco('se-bridge', 'bridge-v', SE_BRIDGE_X, 46.6),
  // Lotus on the long canals.
  deco('canal-lotus-w1', 'lotus-pads', 3.4, 18.6), deco('canal-lotus-w2', 'lotus-pads', 3.8, 38.2),
  deco('canal-lotus-e1', 'lotus-pads', 76.4, 26.4), deco('canal-lotus-e2', 'lotus-pads', 76.0, 47.8),
];

// ---- Corrective landscape proposal: northwest garden only ----
// Exact boundaries and clearance: LANDSCAPE_LAYOUT_PLAN.md. The failed planter/sapling pass has been removed.
// Mature blossoms predating that pass survive; no new gardens elsewhere until visual approval.
const LANDSCAPE: MapObject[] = [
  blossom('garden-blossom', 9.6, 11.2),
  // Three low connected planting masses frame ONE open garden, never three tree enclosures.
  deco('garden-bank-west', 'garden-understory', 9.5, 17.7),
  deco('garden-bank-north', 'garden-understory', 16.4, 8.2, true),
  deco('garden-tree-shoulder', 'garden-understory', 24.9, 13.4),
  obj('garden-shrine', 'garden-shrine', 25.8, 18.9, 1.2, 0.6),
  blossom('temple-blossom-w', 29.8, 11.6), blossom('temple-blossom-e', 50.2, 11.6, true),
  blossom('sw-blossom', 18.2, 50.2),
];

export const UMBRAL_CAPITAL: MapDefinition = {
  id: 'umbral-capital',
  name: 'นครมนตร์ทมิฬ',
  nameEn: 'Umbral Capital',
  // District names follow the user's city prototype (2026-10-09); provisional.
  landmarks: [
    { id: 'temple', name: { th: 'วิหารวิญญาณดำ', en: 'Temple of the Black Spirit' }, x: 40, y: 4.6, kind: 'temple' },
    { id: 'plaza', name: { th: 'ลานมหายันต์', en: 'Great Yantra Plaza' }, x: 40, y: 40.4, kind: 'plaza' },
    { id: 'spirit-garden', name: { th: 'สวนศิรวิญญาณ', en: 'Spirit Garden' }, x: 18, y: 9.6, kind: 'garden' },
    { id: 'training', name: { th: 'สำนักฝึกคาถา', en: 'Incantation School' }, x: 19.6, y: 20.6, kind: 'school' },
    { id: 'herbal', name: { th: 'โรงต้มสมุนไพร', en: 'Herbal Brewery' }, x: 56.4, y: 21.4, kind: 'shop' },
    { id: 'market', name: { th: 'ตลาดเครื่องราง', en: 'Talisman Market' }, x: 64, y: 40.4, kind: 'market' },
    { id: 'brahmin', name: { th: 'เรือนพราหมณ์', en: 'Brahmin Lane' }, x: 66, y: 9.4, kind: 'quarter' },
    { id: 'shaman-houses', name: { th: 'เรือนหมอผี', en: 'Shaman Houses' }, x: 20, y: 48.4, kind: 'quarter' },
    { id: 'community', name: { th: 'ชุมชนชาวเมือง', en: 'Community Quarter' }, x: 59, y: 48.6, kind: 'quarter' },
    { id: 'city-gate', name: { th: 'ประตูเมือง', en: 'City Gate' }, x: 40, y: 52.6, kind: 'gate' },
  ],
  width: 80,
  height: 60,
  // Spawn on the open south side of the plaza, facing the spirit pillar (nearest collision 4.5 units away).
  spawn: { x: 40, y: 36 },
  // v1 region textures stay as the fallback under the tile terrain.
  ground: { base: 'dark-grass', regions: [] },
  terrain: {
    base: 'grass',
    paint: [
      // Water.
      { terrain: 'water', shape: 'rect', ...WEST_CANAL },
      { terrain: 'water', shape: 'rect', ...EAST_CANAL },
      { terrain: 'water', shape: 'rect', ...SW_CANAL },
      { terrain: 'water', shape: 'rect', ...SE_CANAL },
      { terrain: 'water', shape: 'circle', ...SPIRIT_POND },
      // Earth: yards, courtyards and winding secondary paths.
      { terrain: 'dirt', shape: 'rect', x: 9, y: 36, w: 17, h: 6 },

      { terrain: 'dirt', shape: 'path', points: [[16, 42], [16, 49], [12, 50], [8, 49]], r: 1.1 },
      { terrain: 'dirt', shape: 'path', points: [[37, 49], [32, 48], [25, 50], [19, 50], [16, 49]], r: 1.1 },
      { terrain: 'dirt', shape: 'path', points: [[62, 30], [62, 24], [63, 20], [66, 17], [70, 17]], r: 1.1 },
      { terrain: 'dirt', shape: 'path', points: [[63, 20], [59, 17], [57, 16]], r: 1.0 },
      { terrain: 'dirt', shape: 'path', points: [[64, 42], [64, 49], [60, 50.5], [52, 50], [44, 49.5]], r: 1.1 },
      { terrain: 'dirt', shape: 'path', points: [[64, 49], [68, 53], [70, 53]], r: 1.0 },
      // Sacred garden: rounded stone route joins pond, sacred tree steps and the city entrance.
      { terrain: 'road', shape: 'path', points: [[33, 23], [28, 21], [24, 19.3], [21, 18.4], [18.5, 17.1], [15.4, 16.9], [12, 18]], r: 1.1 },
      { terrain: 'road', shape: 'path', points: [[24, 19.3], [24.7, 17.8], [24.9, 16.8]], r: 0.9 },
      // Stone roads: avenue gate -> plaza -> temple forecourt; narrower west street; market street and square.
      { terrain: 'road', shape: 'rect', x: 37, y: 21, w: 6, h: 39 },
      // Forecourt reaches the temple stairs; a paved apron fronts the training hall.
      { terrain: 'road', shape: 'rect', x: 32, y: 13, w: 16, h: 9 },
      { terrain: 'road', shape: 'rect', x: 15, y: 28, w: 10, h: 2 },
      { terrain: 'road', shape: 'rect', x: 9, y: 30, w: 21, h: 4 },
      { terrain: 'road', shape: 'rect', x: 50, y: 30, w: 23, h: 5 },
      { terrain: 'road', shape: 'rect', x: 54, y: 35, w: 18, h: 7 },
      { terrain: 'road', shape: 'circle', x: 40, y: 32, r: 11 },
    ],
  },
  // Engraved yantra platform (14.5 units across) at the plaza centre; walkable.
  decals: [{ id: 'plaza-yantra', asset: 'yantra-disc', x: 40, y: 32 }],
  npcs: UMBRAL_NPCS,
  // Southern gate portal to Whispering Spiritwood (2026-10-09): the passage between the gate pillars. Players coming
  // back arrive inside the gate, north of the trigger, so they never bounce straight back.
  portals: [{
    id: 'south-gate', area: { x: 38.6, y: 58.6, w: 2.8, h: 1.0 }, to: { mapId: 'whispering-spiritwood', portalId: 'village-gate' },
    arrival: { x: 40, y: 55.6 }, label: { th: 'ทางไปชายป่าวิญญาณ', en: 'To Whispering Spiritwood' },
  }],
  // The whole city is a safe zone.
  safeZones: [{ x: 0, y: 0, w: 80, h: 60 }],
  objects: [...PLAZA, ...TEMPLE, ...SPIRIT_GARDEN, ...TRAINING, ...MARKET, ...NORTH_EAST, ...SOUTH_WEST, ...SOUTH_EAST, ...GATE, ...WALLS, ...LANDSCAPE],
  blockers: [
    // Gate pillars.
    { x: 36.6, y: 57.4, w: 2.0, h: 1.1 },
    { x: 41.4, y: 57.4, w: 2.0, h: 1.1 },
    // Canals (water cannot be walked on), split where the bridges cross the south canals.
    WEST_CANAL,
    EAST_CANAL,
    { x: SW_CANAL.x, y: SW_CANAL.y, w: SW_BRIDGE_X - BRIDGE_HALF - SW_CANAL.x, h: SW_CANAL.h },
    { x: SW_BRIDGE_X + BRIDGE_HALF, y: SW_CANAL.y, w: SW_CANAL.x + SW_CANAL.w - SW_BRIDGE_X - BRIDGE_HALF, h: SW_CANAL.h },
    { x: SE_CANAL.x, y: SE_CANAL.y, w: SE_BRIDGE_X - BRIDGE_HALF - SE_CANAL.x, h: SE_CANAL.h },
    { x: SE_BRIDGE_X + BRIDGE_HALF, y: SE_CANAL.y, w: SE_CANAL.x + SE_CANAL.w - SE_BRIDGE_X - BRIDGE_HALF, h: SE_CANAL.h },
    // Spirit pond (square inside the circle so its banks stay walkable).
    { x: SPIRIT_POND.x - 2.1, y: SPIRIT_POND.y - 2.1, w: 4.2, h: 4.2 },
  ],
};
