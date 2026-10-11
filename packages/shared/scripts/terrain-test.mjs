// Behavioural checks for the terrain vertex grid. Run after `pnpm build`.
import assert from 'node:assert/strict';
import { cellCorners, terrainVertices } from '../dist/index.js';

const map = { width: 4, height: 3, terrain: { base: 'grass', paint: [
  { terrain: 'road', shape: 'rect', x: 1, y: 0, w: 2, h: 3 },
  { terrain: 'plaza', shape: 'circle', x: 2, y: 1.5, r: 0.8 },
] } };
const v = terrainVertices(map);
assert.equal(v.length, 5 * 4, 'one entry per vertex');
assert.deepEqual(v.slice(0, 5), ['grass', 'road', 'road', 'road', 'grass'], 'rect covers its edge vertices');
assert.equal(v[1 * 5 + 2], 'plaza', 'later paint wins inside the circle');
assert.equal(v[2 * 5 + 2], 'plaza');
assert.equal(v[2 * 5 + 1], 'road', 'outside the circle radius');
assert.deepEqual(cellCorners(v, 4, 0, 0), ['grass', 'road', 'grass', 'road']);
assert.deepEqual(cellCorners(v, 4, 1, 1), ['road', 'plaza', 'road', 'plaza']);
assert.deepEqual(terrainVertices({ width: 1, height: 1 }), ['', '', '', ''], 'no terrain layer');
const bent = terrainVertices({ width: 6, height: 6, terrain: { base: 'grass', paint: [{ terrain: 'dirt', shape: 'path', points: [[0, 0], [3, 3], [6, 3]], r: 0.6 }] } });
const at = (x, y) => bent[y * 7 + x];
assert.deepEqual([at(0, 0), at(1, 1), at(2, 2), at(3, 3), at(5, 3), at(6, 3)], ['dirt', 'dirt', 'dirt', 'dirt', 'dirt', 'dirt'], 'path follows both segments');
assert.deepEqual([at(3, 0), at(0, 3), at(5, 5)], ['grass', 'grass', 'grass'], 'off the path');
console.log('terrain helpers: ok');
