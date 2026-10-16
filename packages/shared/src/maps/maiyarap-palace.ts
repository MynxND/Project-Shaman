import type { MapDefinition } from '../world.js';
/** Provisional review arena; authored clearance: docs/design/maps/maiyarap-palace/layout.md. */
export const MAIYARAP_PALACE: MapDefinition = {
  id: 'maiyarap-palace', name: 'ปราสาทบาดาลแห่งไมยราพ', nameEn: 'Maiyarap Underworld Palace',
  width: 48, height: 48, spawn: { x: 24, y: 42 }, ground: { base: 'dark-grass', regions: [] },
  terrain: { base: 'grass', paint: [
    { terrain: 'road', shape: 'rect', x: 6, y: 10, w: 36, h: 30 },
    { terrain: 'road', shape: 'path', points: [[24, 47], [24, 39]], r: 3 },
    { terrain: 'water', shape: 'path', points: [[3, 11], [2, 20], [4, 29], [3, 37]], r: 1.5 },
    { terrain: 'water', shape: 'path', points: [[45, 11], [46, 20], [44, 29], [45, 37]], r: 1.5 },
  ] }, objects: [], blockers: [{ x: 0, y: 0, w: 48, h: 10 }, { x: 0, y: 10, w: 6, h: 38 }, { x: 42, y: 10, w: 6, h: 38 }],
  safeZones: [{ x: 20, y: 39, w: 8, h: 9 }],
  landmarks: [{ id: 'dream-throne', name: { th: 'บัลลังก์นิทรา', en: 'Dream Throne' }, x: 24, y: 11, kind: 'temple' }],
  spawnRegions: [{ id: 'dream-king', area: { x: 23.95, y: 21.95, w: .1, h: .1 }, monsters: [{ kind: 'maiyarap', count: 1 }], respawnMs: 180000 }],
};
