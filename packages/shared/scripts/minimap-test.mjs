// Behavioural checks for the map view geometry. Run after `pnpm build`.
import assert from 'node:assert/strict';
import { coverZoom, facingAngle, mapViewRect, stepZoom, UMBRAL_CAPITAL, viewToWorld, worldToView } from '../dist/index.js';

const map = { width: 80, height: 60 };
assert.deepEqual(mapViewRect(map, { x: 0, y: 0 }, 1, 4 / 3), { x: 0, y: 0, w: 80, h: 60 }, 'zoom 1 shows the whole 4:3 map');
assert.deepEqual(mapViewRect(map, { x: 40, y: 30 }, 2, 4 / 3), { x: 20, y: 15, w: 40, h: 30 }, 'zoom 2 halves the area around the centre');
assert.deepEqual(mapViewRect(map, { x: 2, y: 58 }, 2, 4 / 3), { x: 0, y: 30, w: 40, h: 30 }, 'clamped at the map edge');
const wide = mapViewRect(map, { x: 10, y: 10 }, 1, 2);
assert.deepEqual([wide.w, wide.h, wide.x, wide.y], [120, 60, -20, 0], 'a wider view letterboxes and centres the map');
assert.equal(coverZoom(map, 4 / 3), 1, 'a 4:3 view already fits the 4:3 map');
assert.equal(coverZoom(map, 2), 1.5, 'a wide view zooms until the width fills');
const tall = mapViewRect(map, { x: 40, y: 30 }, coverZoom(map, 0.5), 0.5);
assert.ok(Math.abs(tall.h - 60) < 1e-9 && tall.y === 0, 'a tall view zooms until the height fills');
assert.equal(stepZoom(1, 1), 1.5);
assert.equal(stepZoom(4, 1), 4, 'cannot zoom in past the last step');
assert.equal(stepZoom(1, -1), 1, 'cannot zoom out past the whole map');
assert.equal(stepZoom(2.2, -1), 1.5, 'off-list zoom snaps first');
const r = { x: 20, y: 15, w: 40, h: 30 };
assert.deepEqual(worldToView(r, { x: 40, y: 30 }, 200, 150), { x: 100, y: 75 });
assert.deepEqual(viewToWorld(r, { x: 100, y: 75 }, 200, 150), { x: 40, y: 30 });
assert.equal(facingAngle('north-west'), 225);
assert.ok(UMBRAL_CAPITAL.landmarks?.every((l) => l.x >= 0 && l.x <= 80 && l.y >= 0 && l.y <= 60), 'landmarks inside the map');
console.log('minimap helpers: ok');
