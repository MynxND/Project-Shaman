import { createRequire } from 'node:module';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../../', import.meta.url));
const require = createRequire(new URL('../../apps/client/package.json', import.meta.url));
const sharp = createRequire(require.resolve('next'))('sharp');
const directory = path.join(root, 'docs/design/character-turnaround');
const attempt = path.join(directory, 'right90');
const loadJson = async filename => JSON.parse(await readFile(path.join(attempt, filename), 'utf8'));
const receipt = await loadJson('result.json');
const result = receipt.result.structuredContent;
assert.equal(result.status, 'completed');
assert.equal(result.charged_generations, 6);
const inline = receipt.result.content.find(item => item.type === 'image' && item.mimeType === 'image/png');
let rawBytes;
if (inline) rawBytes = Buffer.from(inline.data, 'base64');
else {
  const response = await fetch(result.download_url);
  assert.ok(response.ok, `Raw download failed: ${response.status}`);
  rawBytes = Buffer.from(await response.arrayBuffer());
}
await writeFile(path.join(attempt, 'raw.png'), rawBytes);
const metadata = await sharp(rawBytes).metadata();
assert.equal(metadata.width, 128);
assert.equal(metadata.height, 128);
const raw = await sharp(rawBytes).ensureAlpha().raw().toBuffer();
const sourceBytes = await readFile(path.join(attempt, 'input.png'));
const source = await sharp(sourceBytes).ensureAlpha().raw().toBuffer();
const frontBytes = await readFile(path.join(root, 'apps/client/public/assets/character-turnaround/south-original.png'));
const front = await sharp(frontBytes).ensureAlpha().raw().toBuffer();
const mask = await sharp(path.join(attempt, 'mask-binary.png')).ensureAlpha().raw().toBuffer();
const bounds = (data, topRow = 0, bottomRow = 127) => {
  let left = 128, top = 128, right = -1, bottom = -1, pixels = 0;
  for (let row = topRow; row <= bottomRow; row++) for (let column = 0; column < 128; column++) {
    if (!data[(row * 128 + column) * 4 + 3]) continue;
    left = Math.min(left, column); right = Math.max(right, column);
    top = Math.min(top, row); bottom = Math.max(bottom, row); pixels++;
  }
  return pixels ? { left, top, right, bottom, width: right - left + 1, height: bottom - top + 1, pixels } : null;
};
const measure = data => ({ silhouette: bounds(data), headBand: bounds(data, 0, 38), shoulderBand: bounds(data, 39, 48), torsoBand: bounds(data, 49, 67), hipBand: bounds(data, 68, 83), footBand: bounds(data, 108, 127), groundEdgeDelta: bounds(data).bottom + 1 - 124 });
let changedPixels = 0, maskEscapePixels = 0, clearedPixels = 0, addedPixels = 0;
const escapes = [];
for (let pixel = 0; pixel < 16384; pixel++) {
  const offset = pixel * 4;
  const changed = !source.subarray(offset, offset + 4).equals(raw.subarray(offset, offset + 4));
  changedPixels += Number(changed);
  clearedPixels += Number(source[offset + 3] && !raw[offset + 3]);
  addedPixels += Number(!source[offset + 3] && raw[offset + 3] > 0);
  if (changed && mask[offset] === 0) {
    maskEscapePixels++;
    if (escapes.length < 20) escapes.push([pixel % 128, Math.floor(pixel / 128)]);
  }
}
const native = await sharp({ create: { width: 384, height: 128, channels: 4, background: '#00000000' } }).composite([
  { input: frontBytes, left: 0, top: 0 },
  { input: sourceBytes, left: 128, top: 0 },
  { input: rawBytes, left: 256, top: 0 }
]).png().toBuffer();
await writeFile(path.join(attempt, 'comparison-native.png'), native);
const doubled = await sharp(native).resize(768, 256, { kernel: 'nearest' }).png().toBuffer();
await writeFile(path.join(attempt, 'comparison-2x.png'), doubled);
const nativeData = await sharp(native).ensureAlpha().raw().toBuffer();
const doubledData = await sharp(doubled).ensureAlpha().raw().toBuffer();
for (let row = 0; row < 256; row++) for (let column = 0; column < 768; column++) {
  const originalOffset = (Math.floor(row / 2) * 384 + Math.floor(column / 2)) * 4;
  const doubledOffset = (row * 768 + column) * 4;
  assert.deepEqual(doubledData.subarray(doubledOffset, doubledOffset + 4), nativeData.subarray(originalOffset, originalOffset + 4));
}
const report = {
  method: 'reference-guided-native-masked-inpaint', jobId: result.job_id,
  rawPngSha256: createHash('sha256').update(rawBytes).digest('hex'),
  nativeSize: [128, 128], order: ['preserved-front', 'original-east', 'raw-right90'],
  noSpriteTransform: true, exactNearest2x: true,
  changedPixels, clearedPixels, addedPixels, maskEscapePixels, firstMaskEscapes: escapes,
  allUnmaskedRgbaExact: maskEscapePixels === 0,
  measured: { front: measure(front), originalEast: measure(source), rawRight90: measure(raw) },
  chargedGenerations: result.charged_generations,
  semanticReview: 'Pending direct native/nearest2x inspection; byte checks do not prove angle, anatomy or identity.', approved: false
};
await writeFile(path.join(attempt, 'measurements.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));