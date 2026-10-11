import assert from 'node:assert/strict';
import { FACINGS } from '../dist/character.js';
import { CHARACTER_LAYERS, CHARACTER_STATES, CharacterPoseClock, modularEquipmentLook, replaceModularLayer, validateModularAsset } from '../dist/modular-character.js';

const frame = { durationMs: 100, anchors: { foot: { x: 64, y: 124 }, head: { x: 64, y: 20 }, mainHand: { x: 40, y: 80 }, offHand: { x: 80, y: 80 } }, order: CHARACTER_LAYERS };
const template = { id: 'test', width: 128, height: 128, foot: frame.anchors.foot, clips: Object.fromEntries(CHARACTER_STATES.map(state => [state, Object.fromEntries(FACINGS.map(facing => [facing, { loop: state === 'idle' || state === 'walk' || state === 'cast', frames: [frame, frame, frame] }]))])) };
const clock = new CharacterPoseClock(template);
clock.select('walk', 'east');
clock.advance(150);
const before = clock.sample();
const defaults = { body: 'body', hair: 'hair', outfit: 'outfit-a' };
let look = { ...defaults, mainHand: 'weapon-a', headgear: 'hat-a' };
look = replaceModularLayer(look, 'outfit', 'outfit-b', defaults);
assert.deepEqual(clock.sample(), before, 'equipment does not restart pose time');
assert.equal(look.mainHand, 'weapon-a');
look = replaceModularLayer(look, 'outfit', null, defaults);
assert.equal(look.outfit, 'outfit-a', 'unequip restores default clothing');
look = replaceModularLayer(look, 'mainHand', null, defaults);
assert.equal(look.mainHand, undefined);
clock.select('walk', 'north');
assert.equal(clock.sample().elapsedMs, 150, 'turning preserves clock');
assert.equal(clock.advance(200).frame, 0, 'walk loops');
clock.select('death', 'south');
assert.equal(clock.advance(500).frame, 2);
assert.equal(clock.sample().complete, true, 'death holds final frame');
assert.throws(() => clock.advance(NaN));
assert.throws(() => clock.advance(-1));
assert.equal(clock.seek(-1), null);
for (const state of CHARACTER_STATES) for (const facing of FACINGS) {
  assert.equal(clock.select(state, facing, true), true);
  assert.equal(clock.advance(101).frame, 1);
}
const asset = { id: 'outfit-a', layer: 'outfit', templateId: 'test', width: 128, height: 128, foot: template.foot, sheets: Object.fromEntries(CHARACTER_STATES.map(state => [state, Object.fromEntries(FACINGS.map(facing => [facing, { url: 'fixture.png', count: 3 }]))])) };
assert.deepEqual(validateModularAsset(template, asset), []);
assert.ok(validateModularAsset(template, { ...asset, width: 64 }).includes('Incompatible canvas'));
assert.ok(validateModularAsset(template, { ...asset, sheets: {} }).length === 48);
const incomplete = new CharacterPoseClock({ ...template, clips: { idle: template.clips.idle } });
assert.equal(incomplete.select('hurt', 'east'), false, 'missing art is not silently replaced with idle');
const bindings = { 'robe-a': { slot: 'body', layer: 'outfit', assetId: 'outfit-a' }, 'staff-a': { slot: 'weapon', layer: 'mainHand', assetId: 'weapon-a' } };
assert.deepEqual(modularEquipmentLook({ body: 'robe-a', weapon: 'staff-a' }, bindings, defaults), { ...defaults, mainHand: 'weapon-a' });
assert.deepEqual(modularEquipmentLook({ head: 'staff-a', body: 'unknown' }, bindings, defaults), defaults, 'unknown and wrong-slot bindings cannot change appearance');
assert.deepEqual(modularEquipmentLook({}, bindings, defaults), defaults, 'removed equipment restores defaults');
for (const outfit of ['outfit-a', 'outfit-b']) for (const mainHand of ['weapon-a', 'weapon-b']) for (const headgear of ['hat-a', 'hat-b']) {
  const loadout = { ...defaults, outfit, mainHand, headgear };
  assert.equal(replaceModularLayer(loadout, 'mainHand', null, defaults).outfit, outfit);
}
console.log('modular pose clock, 48 state/direction contracts and 8 loadouts: ok');