import assert from 'node:assert/strict';
import { getMap, projectedY, terrainHeight } from '@shaman/shared';
import { renderMountainArt } from '../src/game/world/MountainArt.ts';

const drawings = [];
class GraphicsProbe {
  name = '';
  depth = 0;
  color = 0;
  shapes = [];
  setDepth(depth) { this.depth = depth; return this; }
  setName(name) { this.name = name; return this; }
  fillStyle(color) { this.color = color; return this; }
  fillRect(x, y, width, height) {
    assert(Number.isFinite(x + y + width + height));
    assert(width > 0 && height > 0, 'no negative/empty placeholder geometry');
    this.shapes.push({ color: this.color, x, y, width, height });
    return this;
  }
  fillTriangle() { return this; }
  fillPoints() { return this; }
  fillEllipse() { return this; }
}
const map = getMap('umbral-elevation-lab');
const original = getMap('umbral-capital');
assert.deepEqual(map.objects, original.objects, 'no rejected decoration or production object changes');
assert.deepEqual(map.terrain, original.terrain, 'no decorative soil paint');
assert.equal(map.elevation.risePx, 176);
renderMountainArt({ add: { graphics() { const graphics = new GraphicsProbe(); drawings.push(graphics); return graphics; } } }, map);
const fronts = drawings.filter(graphics => graphics.name === 'cliff-face');
let boundaries = 0;
for (let y = 1; y < map.height; y++) for (let x = 0; x < map.width; x += .5) {
  const high = terrainHeight(map, x + .25, y - .001);
  const low = terrainHeight(map, x + .25, y + .001);
  if (high - low <= .9) continue;
  const screenX = (x + .25) * 32;
  const match = fronts.find(graphics => {
    const face = graphics.shapes[1];
    return graphics.depth === y * 32 - .5 && screenX >= face.x && screenX < face.x + face.width;
  });
  assert(match, `continuous wall at ${x},${y}`);
  assert.equal(match.shapes[1].y, y * 32 - high * 176);
  assert.equal(match.shapes[1].height, (high - low) * 176);
  boundaries++;
}
for (const transition of map.elevation.transitions) {
  const steps = drawings.filter(graphics => graphics.name.startsWith(`terrain-${transition.id}-step-`));
  const count = Math.ceil((transition.axis === 'y' ? transition.h : transition.w) * 4);
  assert.equal(steps.length, count, transition.id);
  for (const [index, graphics] of steps.entries()) {
    const x = transition.axis === 'y' ? transition.x + transition.w / 2 : transition.x + transition.w * index / count;
    const y = transition.axis === 'y' ? transition.y + transition.h * index / count : transition.y + transition.h / 2;
    assert.equal(graphics.shapes[0].y, projectedY(map, x, y), 'tread on synchronized elevation');
    if (transition.axis === 'y') assert.equal(graphics.depth, y * 32 - .25, 'stairs occlude behind and allow actors in front');
  }
  if (transition.axis === 'y') for (const front of fronts) {
    const face = front.shapes[1];
    const y = (front.depth + .5) / 32;
    if (y < transition.y || y > transition.y + transition.h) continue;
    assert(face.x + face.width <= transition.x * 32 || face.x >= (transition.x + transition.w) * 32, 'wall must leave stair cut open');
  }
}
assert(drawings.some(graphics => graphics.name === 'cliff-side'), 'thickness and return faces');
assert.equal(drawings.filter(graphics => graphics.name === 'descending-waterfall').length, 3, 'upper-middle-lower west cascade and upper-lower east fall');
assert.equal(projectedY(map, 40, 36), 36 * 32 - 176);
assert.equal(projectedY(map, 40, 19), 19 * 32 - 352);
console.log(`PASS cliff geometry: ${boundaries} edge samples covered by ${fronts.length} merged faces; S1-S6 projection/depth/cutouts; thickness/waterfalls; no new decoration`);