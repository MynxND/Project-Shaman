import assert from 'node:assert/strict';
import { HEAD_PROOF_VIEWS, HEAD_PROOF_LAYERS, headProofLayers, recolorHeadHair, validateHeadProof } from '../dist/head-rig.js';

const manifest = { version: 1, id: 'test-head', canvas: { width: 128, height: 128, foot: { x: 64, y: 124 } }, review: { approved: false, stage: 'three-view', limitations: [] }, views: Object.fromEntries(HEAD_PROOF_VIEWS.map(view => [view, { neck: { x: 64, y: 36 }, crownSeat: { x: 64, y: 15 }, body: '/assets/body.png', head: '/assets/head.png', source: '/assets/source.png', faceMask: '/assets/face-mask.png', crown: '/assets/crown.png', order: HEAD_PROOF_LAYERS }])), hairstyles: ['original', 'short'].map(id => ({ id, name: id, views: Object.fromEntries(HEAD_PROOF_VIEWS.map(view => [view, { front: `/assets/${id}-front.png`, back: `/assets/${id}-back.png` }])) })), palettes: ['silver', 'black', 'brown'].map(id => ({ id, name: id, colors: ['#111111', '#444444', '#888888', '#eeeeee'] })) };
assert.deepEqual(validateHeadProof(manifest), []);
for (const view of HEAD_PROOF_VIEWS) for (const hairstyle of ['original', 'short']) for (const palette of ['silver', 'black', 'brown']) for (const crown of [true, false]) {
  const layers = headProofLayers(manifest, view, { hairstyle, palette, crown });
  assert.equal(layers.length, crown ? 5 : 4);
  assert.equal(layers.find(part => part.layer === 'head').url, '/assets/head.png');
  assert.equal(layers.find(part => part.layer === 'body').url, '/assets/body.png');
  assert.equal(layers.some(part => part.layer === 'crown'), crown);
}
assert.throws(() => headProofLayers(manifest, 'south', { hairstyle: 'bad', palette: 'silver', crown: false }));
assert.throws(() => headProofLayers(manifest, 'south', { hairstyle: 'original', palette: 'bad', crown: false }));
assert.ok(validateHeadProof({ ...manifest, canvas: { ...manifest.canvas, width: 256 } }).length);
assert.ok(validateHeadProof({ ...manifest, review: { ...manifest.review, approved: true } }).length);
const pixels = new Uint8ClampedArray([48,48,48,255,104,104,104,255,168,168,168,255,232,232,232,255,180,50,60,255,48,48,48,0]);
recolorHeadHair(pixels, manifest.palettes[0]);
assert.deepEqual([...pixels], [17,17,17,255,68,68,68,255,136,136,136,255,238,238,238,255,180,50,60,255,48,48,48,0], 'only neutral hair shades change; fixed ribbons and alpha remain');
console.log('PASS head rig: 36 view/style/palette/crown combinations; body and head stable, approval gate closed');