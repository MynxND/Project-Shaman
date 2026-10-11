// Umbral Capital layout checks (docs/design/UMBRAL_CAPITAL_REDESIGN.md). Run after `pnpm build`.
import assert from 'node:assert/strict';
import { footprintRect, isBlocked, terrainVertices, UMBRAL_CAPITAL as MAP } from '../dist/index.js';

// Walkable grid at 0.5 units, flood-filled from spawn with the same collision the server uses.
const STEP = 0.5;
const W = Math.round(MAP.width / STEP), H = Math.round(MAP.height / STEP);
const seen = new Uint8Array(W * H);
const cell = (x, y) => [Math.round(x / STEP), Math.round(y / STEP)];
const [sx, sy] = cell(MAP.spawn.x, MAP.spawn.y);
const queue = [[sx, sy]];
seen[sy * W + sx] = 1;
while (queue.length) {
  const [x, y] = queue.pop();
  for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
    if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen[ny * W + nx]) continue;
    if (isBlocked(MAP, nx * STEP, ny * STEP)) continue;
    seen[ny * W + nx] = 1;
    queue.push([nx, ny]);
  }
}
const reachable = (x, y, radius = 1.5) => {
  for (let dy = -radius; dy <= radius; dy += STEP) for (let dx = -radius; dx <= radius; dx += STEP) {
    const [cx, cy] = cell(x + dx, y + dy);
    if (seen[cy * W + cx]) return true;
  }
  return false;
};

assert.equal(isBlocked(MAP, MAP.spawn.x, MAP.spawn.y), false, 'spawn is walkable');
for (let dy = -2; dy <= 2; dy += 0.5) for (let dx = -2; dx <= 2; dx += 0.5)
  assert.equal(isBlocked(MAP, MAP.spawn.x + dx, MAP.spawn.y + dy), false, 'spawn has 2 units of clearance');
for (const l of MAP.landmarks ?? []) assert.ok(reachable(l.x, l.y, 3), `landmark ${l.id} reachable from spawn`);
// Reserved NPC / interaction spots from the blueprint.
const SPOTS = { 'temple quest NPC': [43, 18.5], instructor: [12, 37.5], 'herbal merchant': [56.4, 30.5], 'talisman merchant': [67, 30.5], trader: [64, 40], 'gate portal': [40, 59.2], 'shaman houses': [16, 50], community: [62, 52] };
for (const [name, [x, y]] of Object.entries(SPOTS)) assert.ok(reachable(x, y, 1), `${name} spot reachable`);

// No two solid footprints overlap; nothing solid stands in water; walkable share is sane.
const solids = MAP.objects.map((o) => [o.id, footprintRect(o)]).filter(([, r]) => r);
for (let i = 0; i < solids.length; i++) for (let j = i + 1; j < solids.length; j++) {
  const [a, ra] = solids[i], [b, rb] = solids[j];
  const e = 0.05; // fence and wall runs touch end to end
  assert.ok(!(ra.x + e < rb.x + rb.w && rb.x + e < ra.x + ra.w && ra.y + e < rb.y + rb.h && rb.y + e < ra.y + ra.h), `${a} overlaps ${b}`);
}
const vertices = terrainVertices(MAP);
for (const [id, r] of solids) {
  const vx = Math.round(r.x + r.w / 2), vy = Math.round(r.y + r.h);
  assert.notEqual(vertices[vy * (MAP.width + 1) + vx], 'water', `${id} stands in water`);
}
for (const n of MAP.npcs ?? []) {
  const r = { x: n.x - 0.4, y: n.y - 0.5, w: 0.8, h: 0.5 };
  for (const [id, o] of solids) assert.ok(!(r.x < o.x + o.w && o.x < r.x + r.w && r.y < o.y + o.h && o.y < r.y + r.h), `npc ${n.id} overlaps ${id}`);
  assert.ok(reachable(n.x, n.y + 1, 1.2), `npc ${n.id} can be talked to`);
  for (let dy = -2; dy <= 2; dy += 0.5) for (let dx = -2; dx <= 2; dx += 0.5)
    assert.ok(Math.abs(n.x - (MAP.spawn.x + dx)) > 0.4 || Math.abs(n.y - (MAP.spawn.y + dy)) > 0.5 || false, `npc ${n.id} on spawn`);
}
const walkable = seen.reduce((n, v) => n + v, 0) / (W * H);
assert.ok(walkable > 0.5 && walkable < 0.9, `walkable share ${walkable.toFixed(2)}`);
const ids = new Set(MAP.objects.map((o) => o.id));
assert.equal(ids.size, MAP.objects.length, 'object ids are unique');
console.log(`city layout: ok (${MAP.objects.length} objects, ${(walkable * 100).toFixed(0)}% reachable)`);
