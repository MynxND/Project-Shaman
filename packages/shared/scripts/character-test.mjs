// Behavioural checks for the character appearance helpers. Run after `pnpm build`.
import assert from 'node:assert/strict';
import { FacingTracker, acceptStopAt, isMovementInput, MAX_STOP_CORRECTION, recolorSkin, facingFromVector, parseBodyType, stepMovement, isBlocked, footprintRect, UMBRAL_CAPITAL, WALK_SPEED, FACINGS, SKIN_TONES, SKIN_SHADE_STEPS, SKIN_TONE_IDS } from '../dist/index.js';

// Two skin pixels (dark, light), one masked-out pixel, one transparent masked pixel.
const pixels = new Uint8ClampedArray([
  120, 60, 40, 255,
  250, 210, 180, 255,
  90, 90, 90, 255,
  250, 210, 180, 0,
]);
const mask = new Uint8ClampedArray([255, 255, 255, 255, 255, 255, 255, 255, 0, 0, 0, 0, 255, 255, 255, 255]);
const ramp = SKIN_TONES.deep;
recolorSkin(pixels, mask, ramp, [0.3, 0.9]);
assert.deepEqual([...pixels.slice(0, 3)], [...ramp[0]], 'darkest skin maps to the shadow stop');
assert.deepEqual([...pixels.slice(4, 7)], [...ramp[2]], 'lightest skin maps to the light stop');
assert.deepEqual([...pixels.slice(8, 12)], [90, 90, 90, 255], 'unmasked pixels are untouched');
assert.deepEqual([...pixels.slice(12, 16)], [250, 210, 180, 0], 'transparent pixels are untouched');
assert.equal(pixels[3], 255, 'alpha is preserved');

// Quantisation keeps the palette small: a gradient yields at most SKIN_SHADE_STEPS colours.
const n = 64, grad = new Uint8ClampedArray(n * 4), full = new Uint8ClampedArray(n * 4).fill(255);
for (let i = 0; i < n; i++) grad.set([64 + i * 3, 40 + i * 3, 30 + i * 3, 255], i * 4);
recolorSkin(grad, full, SKIN_TONES.tan, [0.15, 0.85]);
const colours = new Set();
for (let i = 0; i < n; i++) colours.add(grad.slice(i * 4, i * 4 + 3).join(','));
assert.ok(colours.size <= SKIN_SHADE_STEPS, `expected <= ${SKIN_SHADE_STEPS} colours, got ${colours.size}`);

assert.throws(() => recolorSkin(new Uint8ClampedArray(4), new Uint8ClampedArray(8), ramp, [0, 1]));
assert.equal(FACINGS.length, 8);
assert.equal(facingFromVector(0, 1), 'south', '+y is down the screen');
assert.equal(facingFromVector(0, -1), 'north');
assert.equal(facingFromVector(1, 0), 'east');
assert.equal(facingFromVector(-1, 0), 'west');
assert.equal(facingFromVector(1, 1), 'south-east');
assert.equal(facingFromVector(-1, -1), 'north-west');
assert.equal(facingFromVector(-0.9, 0.1), 'west', 'snaps to the nearest octant');
assert.equal(facingFromVector(0, 0), null, 'no movement keeps the current facing');
assert.equal(SKIN_TONE_IDS.length, 5);
assert.equal(parseBodyType('female'), 'female');
assert.equal(parseBodyType({}), 'male', 'untrusted join options fall back to male');

// Movement: straight speed, normalised diagonals, idle input, collision.
const MAP = UMBRAL_CAPITAL;
const start = { ...MAP.spawn };
assert.equal(isBlocked(MAP, start.x, start.y), false, 'spawn is walkable');
const east = stepMovement(start, { x: 1, y: 0, sequence: 1 }, 0.5, MAP);
assert.ok(Math.abs(east.position.x - (start.x + WALK_SPEED * 0.5)) < 1e-9);
assert.equal(east.facing, 'east');
const diag = stepMovement(start, { x: 1, y: 1, sequence: 1 }, 0.5, MAP);
const moved = Math.hypot(diag.position.x - start.x, diag.position.y - start.y);
assert.ok(Math.abs(moved - WALK_SPEED * 0.5) < 1e-9, 'diagonal is not faster than straight');
assert.equal(diag.facing, 'south-east');
const idle = stepMovement(start, { x: 0, y: 0, sequence: 1 }, 1, MAP);
assert.deepEqual(idle.position, start);
assert.equal(idle.facing, null);

// Walking north from spawn stops at the plaza's spirit pillar base (v2 plaza), with open ground before it.
let q = { ...start };
for (let i = 0; i < 300; i++) q = stepMovement(q, { x: 0, y: -1, sequence: i }, 1 / 30, MAP).position;
const pillar = footprintRect(MAP.objects.find((o) => o.id === 'plaza-spirit-pillar'));
assert.ok(q.y >= pillar.y + pillar.h && q.y < pillar.y + pillar.h + 0.2, 'stopped at the spirit pillar base');
assert.ok(start.y - q.y > 3, 'spawn has at least 3 units of open ground before the pillar');
// Walking north up the avenue (beside the pillar) stops at the temple footprint instead of passing through.
let p = { x: 42, y: 26 };
for (let i = 0; i < 300; i++) p = stepMovement(p, { x: 0, y: -1, sequence: i }, 1 / 30, MAP).position;
const temple = footprintRect(MAP.objects.find((o) => o.id === 'temple'));
assert.ok(p.y >= temple.y + temple.h && p.y < temple.y + temple.h + 0.2, 'stopped at the temple base');
// Diagonal into the temple slides along it (x keeps changing) instead of sticking.
const slide = stepMovement(p, { x: 1, y: -1, sequence: 1 }, 1 / 30, MAP).position;
assert.ok(slide.x > p.x && slide.y >= temple.y + temple.h, 'slides along the obstacle without entering it');
// Schema-like positions (x/y as prototype getters) keep their coordinates when idle or blocked.
class SchemaLike { constructor(x, y) { this._x = x; this._y = y; } get x() { return this._x; } get y() { return this._y; } }
const schemaPos = new SchemaLike(start.x, start.y);
assert.deepEqual(stepMovement(schemaPos, { x: 0, y: 0, sequence: 1 }, 1 / 30, MAP).position, start, 'idle keeps x/y');
const blocked = new SchemaLike(p.x, p.y);
assert.deepEqual(stepMovement(blocked, { x: 0, y: -1, sequence: 1 }, 1 / 30, MAP).position, { x: p.x, y: p.y }, 'blocked keeps x/y');
// Map edge blocks; the city gate passage is open but its pillars block.
assert.equal(isBlocked(MAP, 0.2, 30), true);
assert.equal(isBlocked(MAP, 40, 57.5), false, 'gate passage is open');
assert.equal(isBlocked(MAP, 37.6, 57.8), true, 'gate pillar blocks');
// Every object sits inside the map.
for (const o of MAP.objects) assert.ok(o.x > 0 && o.x < MAP.width && o.y > 0 && o.y <= MAP.height, o.id);
// Stop resting point: only with a zero vector, within latency range, on walkable ground.
assert.equal(isMovementInput({ x: 0, y: 0, sequence: 1, stopAt: { x: 1, y: 2 } }), true);
assert.equal(isMovementInput({ x: 1, y: 0, sequence: 1, stopAt: { x: 1, y: 2 } }), false, 'stopAt only on stops');
assert.equal(isMovementInput({ x: 0, y: 0, sequence: 1, stopAt: { x: Infinity, y: 2 } }), false);
const sp = UMBRAL_CAPITAL.spawn;
assert.deepEqual(acceptStopAt(sp, { x: sp.x + 0.3, y: sp.y }, UMBRAL_CAPITAL), { x: sp.x + 0.3, y: sp.y }, 'close stop accepted');
assert.deepEqual(acceptStopAt(sp, { x: sp.x + MAX_STOP_CORRECTION + 0.1, y: sp.y }, UMBRAL_CAPITAL), sp, 'far stop rejected (no teleport)');
const templeBase = UMBRAL_CAPITAL.objects.find((o) => o.id === 'temple');
assert.deepEqual(acceptStopAt({ x: templeBase.x, y: templeBase.y + 0.5 }, { x: templeBase.x, y: templeBase.y - 0.5 }, UMBRAL_CAPITAL), { x: templeBase.x, y: templeBase.y + 0.5 }, 'blocked stop rejected');
assert.deepEqual(acceptStopAt(sp, undefined, UMBRAL_CAPITAL), sp);

// Facing smoothing: a diagonal pressed/released one key at a time does not flash a cardinal facing.
const ft = new FacingTracker('south');
assert.equal(ft.update('east', 0), 'east', 'starting from idle turns at once');
assert.equal(ft.update('south-east', 30), 'east', 'new facing waits to settle');
assert.equal(ft.update('south-east', 110), 'south-east', 'settled facing shows');
assert.equal(ft.update('east', 120), 'south-east', 'releasing one key first keeps the diagonal');
assert.equal(ft.update(null, 140), 'south-east', 'stopping keeps the walked facing');
assert.equal(ft.update('north', 500), 'north');
console.log('character, movement and facing helpers: ok');
