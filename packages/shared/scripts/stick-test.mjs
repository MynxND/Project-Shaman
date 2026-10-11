// Behavioural checks for the virtual joystick mapping. Run after `pnpm build`.
import assert from 'node:assert/strict';
import { clampStick, stickDirection } from '../dist/index.js';

const R = 50;
assert.deepEqual(stickDirection(0, 0, R), { x: 0, y: 0 });
assert.deepEqual(stickDirection(10, 0, R), { x: 0, y: 0 }, 'inside the dead zone');
assert.deepEqual(stickDirection(40, 0, R), { x: 1, y: 0 });
assert.deepEqual(stickDirection(0, 40, R), { x: 0, y: 1 }, 'down is +y');
assert.deepEqual(stickDirection(-40, 0, R), { x: -1, y: 0 });
assert.deepEqual(stickDirection(0, -40, R), { x: 0, y: -1 });
assert.deepEqual(stickDirection(30, 30, R), { x: 1, y: 1 });
assert.deepEqual(stickDirection(-30, -30, R), { x: -1, y: -1 });
assert.deepEqual(stickDirection(40, 15, R), { x: 1, y: 0 }, '20° snaps to east');
assert.deepEqual(stickDirection(40, 20, R), { x: 1, y: 1 }, '27° snaps to south-east');
assert.deepEqual(stickDirection(-40, 1, R), { x: -1, y: 0 }, 'near 180° is west on both sides');
assert.deepEqual(stickDirection(-40, -1, R), { x: -1, y: 0 });
assert.deepEqual(stickDirection(40, 0, 0), { x: 0, y: 0 }, 'zero radius is no input');
assert.deepEqual(clampStick(30, 40, 25), { dx: 15, dy: 20 });
assert.deepEqual(clampStick(3, 4, 25), { dx: 3, dy: 4 });
console.log('joystick helpers: ok');
