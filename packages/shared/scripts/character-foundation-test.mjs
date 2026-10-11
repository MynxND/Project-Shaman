import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { CHARACTER_STATES } from '../dist/modular-character.js';
import { FOUNDATION_VIEWS, FOUNDATION_PARTS, validateCharacterFoundation, foundationAnimation } from '../dist/character-foundation.js';

const asset = { url: '/assets/test.png', rgbaSha256: 'a'.repeat(64) };
const point = { x: 64, y: 24 };
const manifest = { version: 1, id: 'test-foundation', canvas: { width: 128, height: 128, foot: { x: 64, y: 124 } }, productionReady: false, layerSemantics: 'visible-source-partition-not-clean-anatomy',
  views: Object.fromEntries(FOUNDATION_VIEWS.map(view => [view, { source: asset, sourceKind: view === 'south' ? 'approved-front' : view === 'east' ? 'manual-hair-draft' : 'owned-rig-reference', approved: view === 'south', anchorStatus: 'provisional-native-pixel', anchors: { foot: { x: 64, y: 124 }, neck: point, hairRoot: point, headgearSeat: point }, parts: Object.fromEntries(FOUNDATION_PARTS.map(part => [part, asset])), ownershipMask: '/assets/mask.png', reconstructionRequired: ['Occluded body and scalp'] }])),
  clips: CHARACTER_STATES.flatMap(state => FOUNDATION_VIEWS.map(view => ({ state, view, sourceUrl: state === 'idle' ? '/assets/old.png' : null, sourceFrames: state === 'idle' ? 1 : 0, sourceSha256: state === 'idle' ? 'b'.repeat(64) : null, anchors: state === 'idle' ? [{ head: point, headgearSeat: point }] : [], newBaseUrl: null, newBaseFrames: 0, approved: false }))) };
assert.deepEqual(validateCharacterFoundation(manifest), []);
for (const state of CHARACTER_STATES) for (const view of FOUNDATION_VIEWS) assert.equal(foundationAnimation(manifest, state, view), null);
const invalid = mutate => { const draft = structuredClone(manifest); mutate(draft); assert.ok(validateCharacterFoundation(draft).length); assert.equal(foundationAnimation(draft, 'idle', 'south'), null); };
invalid(draft => { draft.productionReady = true; });
invalid(draft => { draft.views.west.approved = true; });
invalid(draft => { delete draft.views.north; });
invalid(draft => { draft.views.east.anchors.hairRoot.x = NaN; });
invalid(draft => { draft.views.north.reconstructionRequired = []; });
invalid(draft => { draft.views.south.anchors.foot.y = 123; });
invalid(draft => { draft.clips[0].newBaseUrl = '/assets/old.png'; draft.clips[0].newBaseFrames = 1; draft.clips[0].approved = true; });
invalid(draft => { draft.clips[0].anchors = []; });
invalid(draft => { draft.clips.push(draft.clips[0]); });
invalid(draft => { draft.views.east.parts.outfitVisible.rgbaSha256 = 'missing'; });
if (process.argv.includes('--assets')) {
  const actual = JSON.parse(await readFile(new URL('../../../apps/client/public/assets/character-turnaround/foundation-01/manifest.json', import.meta.url), 'utf8'));
  assert.deepEqual(validateCharacterFoundation(actual), []);
  for (const state of CHARACTER_STATES) for (const view of FOUNDATION_VIEWS) assert.equal(foundationAnimation(actual, state, view), null);
}
console.log('PASS foundation contract: four views, 24 explicit coverage records, invalid claims rejected, no archived-animation fallback.');