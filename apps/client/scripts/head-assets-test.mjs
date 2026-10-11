import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { HEAD_PROOF_VIEWS, recolorHeadHair, validateHeadProof } from '../../../packages/shared/dist/index.js';

const require = createRequire(import.meta.url);
const sharp = createRequire(require.resolve('next'))('sharp');
const publicRoot = new URL('../public/', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('assets/head-proof/manifest.json', publicRoot), 'utf8'));
const coverage = JSON.parse(await readFile(new URL('assets/head-proof/coverage.json', publicRoot), 'utf8'));
assert.deepEqual(validateHeadProof(manifest), []);
assert.equal(coverage.complete, true, 'three-view files must be complete before inspection');
assert.deepEqual(coverage.missingAssets, []);
assert.equal(manifest.review.approved, false, 'file coverage cannot approve art');
const rgba = async url => {
  const image = await sharp(fileURLToPath(new URL(url.slice(1), publicRoot))).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  assert.equal(image.info.width, 128);
  assert.equal(image.info.height, 128);
  assert.equal(image.info.channels, 4);
  assert.ok(image.data.some((value, index) => index % 4 === 3 && value === 0), 'native transparent canvas');
  return image.data;
};
let protectedPixels = 0, combinations = 0;
for (const view of HEAD_PROOF_VIEWS) {
  const urls = manifest.views[view];
  const [source, body, head, face, crown] = await Promise.all([urls.source, urls.body, urls.head, urls.faceMask, urls.crown].map(rgba));
  assert.ok(body.some((value, index) => index % 4 === 3 && value > 0));
  assert.ok(head.some((value, index) => index % 4 === 3 && value > 0));
  assert.ok(coverage.views[view].neckContactPixels >= 3);
  for (let offset = 0; offset < source.length; offset += 4) if (face[offset + 3]) {
    assert.deepEqual(head.subarray(offset, offset + 4), source.subarray(offset, offset + 4), `${view}: original face bytes preserved`);
    assert.equal(body[offset + 3], 0, 'headless body contains no protected face');
    assert.equal(crown[offset + 3], 0, 'crown cannot obscure protected face');
    protectedPixels++;
  }
  const silhouettes = [];
  for (const hairstyle of manifest.hairstyles) {
    const parts = await Promise.all([hairstyle.views[view].front, hairstyle.views[view].back].map(rgba));
    if (view === 'north' && hairstyle.id === 'original') {
      assert.ok(urls.order.indexOf('hairFront') > urls.order.indexOf('body'), 'rear tail must be above torso');
      let visibleTailPixels = 0;
      for (let row = 45; row <= 84; row++) for (let column = 53; column <= 72; column++) {
        const offset = (row * 128 + column) * 4;
        if (parts[0][offset + 3] && body[offset + 3]) visibleTailPixels++;
      }
      assert.ok(visibleTailPixels > 50, 'long rear tail must remain visible over the class outfit, not hidden beneath it');
    }
    const silhouette = [];
    for (let offset = 0; offset < source.length; offset += 4) silhouette.push(Number(parts.some(part => part[offset + 3] > 0)));
    silhouettes.push(silhouette);
    for (const palette of manifest.palettes) {
      for (const pixels of parts) {
        const changed = new Uint8ClampedArray(pixels);
        recolorHeadHair(changed, palette);
        for (let offset = 0; offset < pixels.length; offset += 4) {
          assert.equal(changed[offset + 3], pixels[offset + 3], 'palette preserves alpha');
          if (face[offset + 3]) assert.equal(pixels[offset + 3], 0, 'hairstyle cannot contain protected face');
          const neutral = pixels[offset] === pixels[offset + 1] && pixels[offset] === pixels[offset + 2] && [48,104,168,232].includes(pixels[offset]);
          if (!neutral) assert.deepEqual([...changed.subarray(offset, offset + 4)], [...pixels.subarray(offset, offset + 4)], 'fixed material cannot be recolored');
        }
      }
      combinations += 2;
    }
  }
  assert.notDeepEqual(silhouettes[0], silhouettes[1], 'two actual silhouettes, not two palette variants');
}
assert.equal(protectedPixels, 320);
console.log(`PASS head assets: native128 three views, ${protectedPixels} protected face pixels, ${combinations} combinations, distinct hair, fixed materials, no crown/face overlap; visual approval pending`);