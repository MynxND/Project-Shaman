import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(new URL('../../apps/client/package.json', import.meta.url));
const sharp = createRequire(require.resolve('next'))('sharp');
const publicRoot = new URL('../../apps/client/public/', import.meta.url);
const design = new URL('../../docs/design/hair-collection/', import.meta.url);
const json = async url => JSON.parse(await readFile(url, 'utf8'));
const manifest = await json(new URL('assets/hair-collection/manifest.json', publicRoot));
const coverage = await json(new URL('assets/hair-collection/coverage.json', publicRoot));
const definitions = await json(new URL('styles.json', design));
const original = await json(new URL('assets/head-proof/manifest.json', publicRoot));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const image = async url => {
  const result = await sharp(fileURLToPath(url)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  assert.equal(result.info.width, 128); assert.equal(result.info.height, 128); assert.equal(result.info.channels, 4);
  assert.ok(result.data.some((value, index) => index % 4 === 3 && !value));
  return result.data;
};
const asset = async url => image(new URL(url.slice(1), publicRoot));
assert.equal(manifest.hairstyles.length, 14);
assert.deepEqual(manifest.hairstyles.map(style => [style.id, style.name]), definitions.styles.map(style => [style.id, style.name]));
assert.equal(manifest.review.approved, false);
assert.equal(manifest.fallback.guideStyle, false);
assert.equal(coverage.complete, manifest.hairstyles.every(style => style.status === 'complete-candidate'));
assert.ok(coverage.chargedCredits <= 84); assert.ok(coverage.reservedCredits <= 84);
assert.equal(coverage.chargedCredits, coverage.jobs.reduce((total, job) => total + (job.chargedCredits ?? 0), 0));
assert.equal(coverage.reservedCredits, coverage.jobs.reduce((total, job) => total + job.estimatedCredits, 0));
for (const [url, digest] of Object.entries((await json(new URL('source-retention.json', design))).sources)) assert.equal(hash(await readFile(new URL(url.slice(1), publicRoot))), digest);
for (const [filename, digest] of Object.entries(await json(new URL('previous-head-proof-jobs-retention.json', design)))) assert.equal(hash(await readFile(new URL(`../head-proof/jobs/${filename}`, design))), digest);
const silhouettes = new Map();
let completeViews = 0, paletteChecks = 0, protectedChecks = 0;
for (const view of ['south', 'east', 'north', 'west']) {
  const base = manifest.views[view];
  assert.deepEqual(base.foot, { x: 64, y: 124 });
  if (view !== 'west') for (const layer of ['body', 'head', 'faceMask', 'crown', 'source']) assert.equal(base[layer], original.views[view][layer]);
  const head = await asset(base.head), body = await asset(base.body);
  const skin = view === 'west' ? await asset('/assets/hair-collection/base/west/protectedSkin.png') : await image(new URL(`masks/${view}-protected-skin.png`, design));
  for (const style of manifest.hairstyles) {
    const data = style.views[view];
    if (data.status !== 'complete-candidate') { assert.equal(data.front, null); assert.equal(data.back, null); continue; }
    completeViews++;
    const front = await asset(data.front), back = await asset(data.back);
    if (view !== 'west') assert.deepEqual(data.scalpGaps, []);
    const silhouette = Buffer.alloc(128 * 128);
    for (let pixel = 0; pixel < silhouette.length; pixel++) {
      const offset = pixel * 4;
      silhouette[pixel] = Number(Boolean(front[offset + 3] || back[offset + 3]));
      if (skin[offset + 3]) { assert.equal(front[offset + 3], 0); assert.equal(back[offset + 3], 0); protectedChecks++; }
      for (const layer of [front, back]) for (const palette of manifest.palettes) {
        const neutral = layer[offset] === layer[offset + 1] && layer[offset] === layer[offset + 2] && [48,104,168,232].includes(layer[offset]);
        const copy = Buffer.from(layer.subarray(offset, offset + 4));
        if (neutral && copy[3]) copy.set(palette.colors[[48,104,168,232].indexOf(copy[0])].slice(1).match(/../g).map(value => parseInt(value, 16)));
        assert.equal(copy[3], layer[offset + 3]);
        if (!neutral) assert.deepEqual(copy, layer.subarray(offset, offset + 4));
        paletteChecks++;
      }
    }
    assert.ok(silhouette.reduce((total, value) => total + value, 0) > 100);
    for (const [otherId, other] of silhouettes.get(view) ?? []) {
      const differences = silhouette.reduce((total, value, pixel) => total + Number(value !== other[pixel]), 0);
      assert.ok(differences > 10, `${view}/${style.id} duplicates ${otherId}: ${differences} silhouette pixels differ`);
    }
    if (!silhouettes.has(view)) silhouettes.set(view, []);
    silhouettes.get(view).push([style.id, silhouette]);
    if (view === 'west') {
      assert.equal(data.provenance.independentGeneration, false);
      const east = style.views.east;
      for (const [actual, source] of [[front, await asset(east.front)], [back, await asset(east.back)]]) for (let row = 0; row < 128; row++) for (let column = 1; column < 128; column++) assert.deepEqual(actual.subarray((row * 128 + 128 - column) * 4, (row * 128 + 128 - column) * 4 + 4), source.subarray((row * 128 + column) * 4, (row * 128 + column) * 4 + 4));
    }
    if (view === 'north' && style.design.length === 'long') {
      assert.ok(data.bounds.bottom >= 72);
      assert.ok(base.order.indexOf('hairFront') > base.order.indexOf('body'));
      assert.ok(front.some((value, index) => index % 4 === 3 && index >= 45 * 128 * 4 && value && body[index]));
    }
    assert.ok(head.some((value, index) => index % 4 === 3 && value));
  }
}
console.log(`PASS hair assets: 14 exact labels, ${completeViews} candidate views, ${protectedChecks} protected checks, ${paletteChecks} palette pixel checks; source/archive hashes, distinct silhouettes, foot-centered mirrors, pending-null URLs; art unapproved.`);