import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { validateModularAsset, validatePoseTemplate, FACINGS } from '../../../packages/shared/dist/index.js';

const require = createRequire(import.meta.url);
const sharp = createRequire(require.resolve('next'))('sharp');
const publicRoot = new URL('../public/', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('assets/modular-proof/manifest.json', publicRoot), 'utf8'));
assert.equal(manifest.review.approved, false, 'unreviewed art must never imply a migration approval');
assert.deepEqual(validatePoseTemplate(manifest.template), []);
let sheets = 0, frames = 0;
for (const asset of manifest.assets) {
  assert.deepEqual(validateModularAsset(manifest.template, asset), []);
  for (const [state, directions] of Object.entries(asset.sheets)) for (const [facing, sheet] of Object.entries(directions)) {
    const metadata = await sharp(fileURLToPath(new URL(sheet.url.slice(1), publicRoot))).metadata();
    assert.equal(metadata.width, sheet.count * manifest.template.width, `${asset.id}/${state}/${facing}: width`);
    assert.equal(metadata.height, manifest.template.height);
    assert.equal(metadata.hasAlpha, true);
    sheets++;
  }
}
const rgba = async filename => sharp(filename).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
for (const state of ['idle', 'walk', 'attack', 'cast']) for (const facing of FACINGS) {
  const clip = manifest.template.clips[state][facing];
  const source = await rgba(fileURLToPath(new URL(`assets/rig-v2/male/base/${state}-${facing}.png`, publicRoot)));
  const layers = Object.fromEntries(await Promise.all(['body-residual', 'hair-fragment', 'cloth-original', 'cloth-jade'].map(async id => [id, await rgba(fileURLToPath(new URL(`assets/modular-proof/${id}/${state}-${facing}.png`, publicRoot)))])));
  const mask = await rgba(fileURLToPath(new URL(`../../../docs/design/modular-character/masks/draft/${state}-${facing}.png`, import.meta.url)));
  for (let frame = 0; frame < clip.frames.length; frame++) for (let row = 0; row < 128; row++) for (let column = 0; column < 128; column++) {
    const sourceIndex = (row * source.info.width + frame * 128 + column) * 4;
    const layerIndex = ((row + 44) * layers['body-residual'].info.width + frame * 192 + column + 32) * 4;
    const parts = ['body-residual', 'hair-fragment', 'cloth-original'].map(id => layers[id].data.subarray(layerIndex, layerIndex + 4)).filter(pixel => pixel[3]);
    assert.equal(parts.length, source.data[sourceIndex + 3] ? 1 : 0, 'extraction partitions rather than overlapping original pixels');
    if (!parts.length) continue;
    assert.deepEqual(parts[0], source.data.subarray(sourceIndex, sourceIndex + 4), 'original composite is exact');
    if (mask.data[sourceIndex] === 0) {
      const changed = ['body-residual', 'hair-fragment', 'cloth-jade'].map(id => layers[id].data.subarray(layerIndex, layerIndex + 4)).find(pixel => pixel[3]);
      assert.deepEqual(changed, source.data.subarray(sourceIndex, sourceIndex + 4), 'variant preserves pixels outside draft mask');
    }
  }
  frames += clip.frames.length;
}
assert.equal(manifest.template.clips.hurt, undefined);
assert.equal(manifest.template.clips.death, undefined);
console.log(`PASS modular assets: ${sheets} RGBA sheets, ${frames} exactly reconstructed frames; draft masks remain unapproved`);