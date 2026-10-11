import assert from 'node:assert/strict';
import { SSR_ACTIONS, SSR_DIRECTIONS, ssrClipId, validateSsrPart, ssrAttachOffset, ssrPartFrame } from '../dist/sprite-rig.js';

// Synthetic parts only (no art): exercise the contract rules.
const img = { id: 'i', url: '/x.png', sha256: 'a'.repeat(64), width: 128, height: 128 };
const frame = (neck = { x: 62, y: 48 }, events) => ({ layers: [{ image: 'i', x: 0, y: 0 }], anchors: { origin: { x: 62, y: 112 }, neck }, ...(events ? { events } : {}) });
function body(mut = () => {}) {
  const clips = {};
  for (const action of Object.keys(SSR_ACTIONS)) for (const direction of SSR_DIRECTIONS)
    clips[ssrClipId(action, direction)] = { action, direction, intervalMs: 100, frames: Array.from({ length: SSR_ACTIONS[action].frames }, (_, i) => frame(undefined, action === 'attack' && i === 4 ? ['hit'] : undefined)) };
  const p = { version: 'ssr/1', id: 'body.test', kind: 'body', variant: 'test', canvas: { width: 128, height: 128 }, asymmetric: true, images: [img], clips };
  mut(p); return p;
}
assert.equal(ssrClipId('idle', 'south'), 0);
assert.equal(ssrClipId('walk', 'west'), 10);
assert.deepEqual(validateSsrPart(body()), []);
assert.ok(validateSsrPart(body((p) => { delete p.clips[ssrClipId('walk', 'north')]; })).some((i) => i.code === 'missing-clip'));
assert.ok(validateSsrPart(body((p) => { p.clips[ssrClipId('walk', 'north')].frames.pop(); })).some((i) => i.code === 'frame-count'));
assert.ok(validateSsrPart(body((p) => { p.clips[ssrClipId('walk', 'east')].frames[3] = frame({ x: 62, y: 56 }); })).some((i) => i.code === 'anchor-jump' && i.severity === 'error'));
assert.ok(validateSsrPart(body((p) => { p.clips[ssrClipId('walk', 'east')].frames[3] = frame({ x: 62, y: 51 }); })).some((i) => i.code === 'anchor-jump' && i.severity === 'warn'));
assert.ok(!validateSsrPart(body((p) => { p.clips[ssrClipId('attack', 'east')].frames[3] = frame({ x: 62, y: 56 }); })).some((i) => i.code === 'anchor-jump' && i.severity === 'error'), 'one-shot jumps are warnings');
assert.ok(validateSsrPart(body((p) => { delete p.clips[ssrClipId('walk', 'east')].frames[2].anchors.neck; })).some((i) => i.code === 'missing-anchor'));
assert.ok(validateSsrPart(body((p) => { p.clips[ssrClipId('attack', 'south')].frames.forEach((f) => delete f.events); })).some((i) => i.code === 'missing-event'));
assert.ok(validateSsrPart(body((p) => { const c = p.clips[ssrClipId('idle', 'west')]; delete c.frames; c.mirrorOf = ssrClipId('idle', 'east'); })).some((i) => i.code === 'mirror-asymmetric'));
assert.ok(validateSsrPart(body((p) => { p.clips[ssrClipId('idle', 'south')].frames[0].layers[0].x = 0.5; })).some((i) => i.code === 'subpixel'));
assert.ok(validateSsrPart(body((p) => { p.clips[ssrClipId('idle', 'south')].frames[0].layers[0].image = 'nope'; })).some((i) => i.code === 'missing-image'));
// Static head part: idle only, frame 0 reused for every body frame; attach offset = parent anchor - child anchor.
const head = { version: 'ssr/1', id: 'head.test', kind: 'headBase', variant: 't', canvas: { width: 128, height: 128 }, asymmetric: false, images: [img], clips: {} };
for (const direction of SSR_DIRECTIONS) head.clips[ssrClipId('idle', direction)] = { action: 'idle', direction, intervalMs: 100, frames: [{ layers: [{ image: 'i', x: 0, y: 0 }], anchors: { neck: { x: 63, y: 49 } } }] };
assert.deepEqual(validateSsrPart(head), []);
assert.equal(ssrPartFrame(head, 'walk', 'east', 5).frame, head.clips[ssrClipId('idle', 'east')].frames[0]);
assert.deepEqual(ssrAttachOffset(frame({ x: 59, y: 50 }), 'neck', head.clips[0].frames[0], 'neck'), { x: -4, y: 1 });
console.log('sprite-rig: clip ids, action table, missing clip/frame/anchor/image/event, anchor jump warn+error, subpixel, mirror rules, static head reuse and attach offset passed');
// Composer: head placed by anchors, sorted by draw order (fringe over face).
import { ssrCompose, ssrDrawOrder } from '../dist/sprite-rig.js';
const b2 = body(), list = ssrCompose(b2, [head], 'walk', 'east', 2);
assert.deepEqual(list.map((i) => i.kind), ['body', 'headBase']);
assert.deepEqual([list[1].x, list[1].y], [62 - 63, 48 - 49]);
assert.ok(ssrDrawOrder('hairFront', 'south') > ssrDrawOrder('face', 'south'));
assert.ok(ssrDrawOrder('hairBack', 'south') < ssrDrawOrder('body', 'south') && ssrDrawOrder('hairBack', 'north') > ssrDrawOrder('body', 'north'));
console.log('sprite-rig composer: anchor placement and draw order passed');
// Mirrored static part: layers and anchors flip about the canvas, so the attach offset mirrors too.
const hm = structuredClone(head); hm.id = 'head.mirror';
hm.clips[ssrClipId('idle', 'east')].frames[0].anchors.neck = { x: 60, y: 49 };
hm.clips[ssrClipId('idle', 'west')] = { action: 'idle', direction: 'west', intervalMs: 100, mirrorOf: ssrClipId('idle', 'east') };
assert.deepEqual(validateSsrPart(hm), []);
const mf = ssrPartFrame(hm, 'idle', 'west', 0);
assert.equal(mf.mirrored, true); assert.deepEqual(mf.frame.anchors.neck, { x: 67, y: 49 }); assert.equal(mf.frame.layers[0].mirror, true); assert.equal(mf.frame.layers[0].x, 0);
console.log('sprite-rig mirror: flipped layers and anchors passed');
