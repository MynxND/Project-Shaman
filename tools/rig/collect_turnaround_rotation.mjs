import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../../', import.meta.url));
const require = createRequire(new URL('../../apps/client/package.json', import.meta.url));
const sharp = createRequire(require.resolve('next'))('sharp');
const experiment = path.join(root, 'docs/design/character-turnaround/rotation-experiment-01');
const result = JSON.parse(await readFile(path.join(experiment, 'result-final.json'), 'utf8'));
const text = result.result.content.filter(part => part.type === 'text').map(part => part.text).join('\n');
assert.match(text, /^status: completed/m);
assert.match(text, /animations: none/);
const preflight = JSON.parse(await readFile(path.join(experiment, 'preflight.json'), 'utf8'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const sourceBytes = await readFile(path.join(experiment, 'source-front.png'));
assert.equal(hash(sourceBytes), preflight.sourceSha256);
assert.deepEqual(sourceBytes, await readFile(path.join(root, 'docs/design/head-proof/source/south.png')));
const bounds = (data, region = [0, 0, 127, 127]) => {
  let left = 128, top = 128, right = -1, bottom = -1, pixels = 0;
  for (let row = region[1]; row <= region[3]; row++) for (let column = region[0]; column <= region[2]; column++) {
    if (!data[(row * 128 + column) * 4 + 3]) continue;
    left = Math.min(left, column); right = Math.max(right, column);
    top = Math.min(top, row); bottom = Math.max(bottom, row); pixels++;
  }
  return { left, top, right, bottom, width: right - left + 1, height: bottom - top + 1, pixels };
};
await mkdir(path.join(experiment, 'raw'), { recursive: true });
const directions = [...text.matchAll(/^  ([a-z-]+): (https:\/\/[^\s]+)$/gm)];
assert.equal(directions.length, 8);
const measurements = { version: 1, approved: false, transformations: [], views: {} };
for (const [, direction, url] of directions) {
  const filename = path.join(experiment, 'raw', `${direction}.png`);
  try { await access(filename); } catch {
    const response = await fetch(url);
    assert.ok(response.ok, `${direction}: download ${response.status}`);
    await writeFile(filename, Buffer.from(await response.arrayBuffer()));
  }
  const bytes = await readFile(filename);
  const decoded = await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  assert.equal(decoded.info.width, 128); assert.equal(decoded.info.height, 128);
  const silhouette = bounds(decoded.data);
  measurements.views[direction] = {
    rawPngSha256: hash(bytes), rgbaSha256: hash(decoded.data), silhouette,
    headAssemblyBounds: bounds(decoded.data, [0, 0, 127, 38]),
    footBounds: bounds(decoded.data, [0, 108, 127, 127]),
    groundEdgeDelta: silhouette.bottom + 1 - 124,
    review: direction === 'east' ? 'awaiting-first-manual-review' : 'not-assessed'
  };
}
const serviceFront = await sharp(path.join(experiment, 'raw/south.png')).ensureAlpha().raw().toBuffer();
const source = await sharp(sourceBytes).ensureAlpha().raw().toBuffer();
measurements.serviceFront = { rgbaEqual: serviceFront.equals(source), pngBytesEqual: (await readFile(path.join(experiment, 'raw/south.png'))).equals(sourceBytes), runtimeUsesOriginal: true };
const view = process.argv[2] ?? 'east';
assert.ok(['east', 'north', 'west'].includes(view));
const inputs = [sourceBytes, await readFile(path.join(root, `apps/client/public/assets/character-turnaround/${view}-original.png`)), await readFile(path.join(experiment, 'raw', `${view}.png`))];
const contactRgba = Buffer.alloc(384 * 128 * 4);
for (const [index, input] of inputs.entries()) {
  const data = await sharp(input).ensureAlpha().raw().toBuffer();
  for (let row = 0; row < 128; row++) data.copy(contactRgba, (row * 384 + index * 128) * 4, row * 128 * 4, (row + 1) * 128 * 4);
}
const native = await sharp(contactRgba, { raw: { width: 384, height: 128, channels: 4 } }).png().toBuffer();
await writeFile(path.join(experiment, `${view}-comparison-native.png`), native);
const enlargedRgba = Buffer.alloc(768 * 256 * 4);
for (let row = 0; row < 256; row++) for (let column = 0; column < 768; column++) {
  const sourceOffset = (Math.floor(row / 2) * 384 + Math.floor(column / 2)) * 4;
  contactRgba.copy(enlargedRgba, (row * 768 + column) * 4, sourceOffset, sourceOffset + 4);
}
await sharp(enlargedRgba, { raw: { width: 768, height: 256, channels: 4 } }).png().toFile(path.join(experiment, `${view}-comparison-2x.png`));
await writeFile(path.join(experiment, 'measurements.json'), JSON.stringify(measurements, null, 2) + '\n');
console.log(JSON.stringify({ status: 'raw-archived-not-packaged', sourceFrontExact: true, serviceFront: measurements.serviceFront, firstReview: view, measurement: measurements.views[view], directions: directions.length }, null, 2));