import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { HAIR_COLLECTION_VIEWS, hairCollectionLayers, hairCollectionReady, validateHairCollection } from '../dist/index.js';

const manifest = JSON.parse(await readFile(new URL('../../../apps/client/public/assets/hair-collection/manifest.json', import.meta.url), 'utf8'));
assert.deepEqual(validateHairCollection(manifest), []);
const ready = manifest.hairstyles.filter(hairCollectionReady);
assert.equal(ready.length, 4);
let combinations = 0;
for (const style of manifest.hairstyles) {
  for (const view of HAIR_COLLECTION_VIEWS) {
    if (!hairCollectionReady(style)) {
      assert.throws(() => hairCollectionLayers(manifest, view, { hairstyle: style.id, palette: 'ink', crown: false }), /not ready/);
      continue;
    }
    for (const palette of manifest.palettes) for (const crown of [false, true]) {
      const layers = hairCollectionLayers(manifest, view, { hairstyle: style.id, palette: palette.id, crown });
      assert.equal(layers.length, crown ? 5 : 4);
      assert.equal(layers.find(part => part.layer === 'body').url, manifest.views[view].body);
      assert.equal(layers.find(part => part.layer === 'head').url, manifest.views[view].head);
      assert.ok(layers.every(part => part.url.startsWith('/assets/')));
      combinations++;
    }
  }
}
const incomplete = structuredClone(manifest);
incomplete.hairstyles.find(style => style.status !== 'complete-candidate').status = 'complete-candidate';
assert.ok(validateHairCollection(incomplete).some(error => error.includes('incomplete selectable')));
console.log(`PASS hair collection contract: ${combinations} combinations, stable base, ten pending designs blocked, approval unchanged`);