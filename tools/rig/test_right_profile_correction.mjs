import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../../', import.meta.url));
const require = createRequire(new URL('../../apps/client/package.json', import.meta.url));
const sharp = createRequire(require.resolve('next'))('sharp');
const directory = path.join(root, 'docs/design/character-turnaround/right90-manual-01');
const publicDirectory = path.join(root, 'apps/client/public/assets/character-turnaround/right90-manual-01');
const hash = data => createHash('sha256').update(data).digest('hex');
const report = JSON.parse(await readFile(path.join(directory, 'provenance.json'), 'utf8'));
const decoded = async filename => sharp(filename).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const before = (await decoded(path.join(directory, 'before.png'))).data;
const after = await decoded(path.join(directory, 'after.png'));
const independentBounds = (data, topRow = 0, bottomRow = 127) => {
  const positions = [];
  for (let pixel = topRow * 128; pixel < (bottomRow + 1) * 128; pixel++) if (data[pixel * 4 + 3]) positions.push([pixel % 128, Math.floor(pixel / 128)]);
  const left = Math.min(...positions.map(position => position[0])), right = Math.max(...positions.map(position => position[0]));
  const top = Math.min(...positions.map(position => position[1])), bottom = Math.max(...positions.map(position => position[1]));
  return { left, top, right, bottom, width: right - left + 1, height: bottom - top + 1, pixels: positions.length };
};
assert.deepEqual(report.measurements.after.silhouette, independentBounds(after.data));
assert.deepEqual(report.measurements.after.headBounds, independentBounds(after.data, 0, 38));
assert.deepEqual(report.measurements.after.footBounds, independentBounds(after.data, 108, 127));
const mask = (await decoded(path.join(directory, 'edit-selection.png'))).data;
const diff = (await decoded(path.join(directory, 'pixel-diff.png'))).data;
const body = (await decoded(path.join(directory, 'protected-body.png'))).data;
const expectedBodyRows = [[26,39,58,127],[40,40,56,127],[41,42,55,127],[43,44,54,127],[45,47,53,127],[48,54,52,127],[55,59,51,127],[60,63,50,127],[64,64,44,127],[65,66,45,127],[67,74,44,127],[75,77,39,127],[78,127,0,127]];
assert.deepEqual(report.bodyProtectedRows, expectedBodyRows);
assert.equal(after.info.width, 128); assert.equal(after.info.height, 128);
assert.equal(report.review.approved, false); assert.equal(report.review.productionReady, false);
assert.equal(report.review.stop, true); assert.equal(report.review.scope, 'right-only');
assert.equal(report.service.paidJobsSubmitted, 0); assert.equal(report.service.additionalCredits, 0);
assert.equal(report.status, 'manual-right90-proposal-awaiting-review');
assert.deepEqual(report.transformations, []);
for (const [name, source] of Object.entries(report.sources)) {
  const bytes = await readFile(path.join(root, source.path));
  assert.equal(hash(bytes), source.pngSha256, name);
  assert.equal(hash((await decoded(bytes)).data), source.rgbaSha256, name);
}
assert.ok((await readFile(path.join(directory, 'front.png'))).equals(await readFile(path.join(root, report.sources.front.path))), 'Exact approved front PNG bytes');
assert.ok((await readFile(path.join(directory, 'before.png'))).equals(await readFile(path.join(root, report.sources.before.path))), 'Before is actual raw rotation, not rig-v2 original');
const profile = (await decoded(path.join(root, report.sources.protectedProfile.path))).data;
const sourceHairMask = (await decoded(path.join(root, report.sources.sourceHairMask.path))).data;
const original = (await decoded(path.join(directory, 'original-right.png'))).data;
const expected = Buffer.from(before);
for (const operation of report.operations) {
  const [column, row] = operation.destination, offset = (row * 128 + column) * 4;
  assert.equal(mask[offset], 255); assert.notEqual(profile[offset], 255);
  assert.notEqual(body[offset], 255, 'No protected garment/arm write');
  if (operation.method === 'exact-native-source-mask') {
    assert.deepEqual(operation.sourcePixel, operation.destination);
    assert.equal(sourceHairMask[offset], 255);
    assert.ok(original.subarray(offset, offset + 4).equals(Buffer.from(operation.rgba)), 'Exact source region pixels, not texture sampling');
  } else {
    assert.equal(operation.method, 'authored-native-scanline');
    assert.deepEqual(operation.rgba, [0, 0, 0, 0]);
  }
  expected.set(operation.rgba, offset);
}
assert.ok(expected.equals(after.data), 'Independent replay of source masks and recorded pixel writes');
let changed = 0, selected = 0, lowest = -1;
for (let pixel = 0; pixel < 16384; pixel++) {
  const offset = pixel * 4;
  const column = pixel % 128, row = Math.floor(pixel / 128);
  assert.equal(body[offset], expectedBodyRows.some(([top,bottom,left,right]) => row >= top && row <= bottom && column >= left && column <= right) ? 255 : 0);
  assert.ok(mask[offset] === 0 || mask[offset] === 255);
  assert.equal(mask[offset + 1], mask[offset]); assert.equal(mask[offset + 2], mask[offset]); assert.equal(mask[offset + 3], 255);
  const differs = !after.data.subarray(offset, offset + 4).equals(before.subarray(offset, offset + 4));
  if (!mask[offset] || profile[offset] === 255 || body[offset] === 255) assert.ok(!differs, `Protected RGBA ${pixel % 128},${Math.floor(pixel / 128)}`);
  assert.equal(diff[offset], differs ? 255 : 0, 'Diff mask reflects actual changes');
  changed += Number(differs); selected += Number(mask[offset] === 255);
  if (after.data[offset + 3]) lowest = Math.max(lowest, Math.floor(pixel / 128));
  if (Math.floor(pixel / 128) >= 78) assert.ok(!differs, 'Torso lower region, legs, sandals and feet unchanged');
}
assert.equal(lowest, 123); assert.equal(changed, report.changedPixels); assert.equal(selected, report.selectedPixels);
assert.equal(hash(after.data), report.afterRgbaSha256);
const contact = await decoded(path.join(directory, 'comparison-native.png'));
const doubled = await decoded(path.join(directory, 'comparison-2x.png'));
assert.equal(contact.info.width, 512); assert.equal(contact.info.height, 128);
assert.equal(doubled.info.width, 1024); assert.equal(doubled.info.height, 256);
for (const [index, filename] of ['front.png', 'original-right.png', 'before.png', 'after.png'].entries()) {
  const frame = (await decoded(path.join(directory, filename))).data;
  for (let row = 0; row < 128; row++) assert.ok(contact.data.subarray((row * 512 + index * 128) * 4, (row * 512 + (index + 1) * 128) * 4).equals(frame.subarray(row * 512, (row + 1) * 512)));
}
for (let row = 0; row < 256; row++) for (let column = 0; column < 1024; column++) {
  const sourceOffset = (Math.floor(row / 2) * 512 + Math.floor(column / 2)) * 4;
  const offset = (row * 1024 + column) * 4;
  assert.ok(doubled.data.subarray(offset, offset + 4).equals(contact.data.subarray(sourceOffset, sourceOffset + 4)), 'Exact nearest2x');
}
for (const filename of ['front.png', 'before.png', 'original-right.png', 'after.png', 'edit-selection.png', 'pixel-diff.png', 'comparison-native.png', 'comparison-2x.png', 'provenance.json', 'manifest.json']) {
  assert.ok((await readFile(path.join(directory, filename))).equals(await readFile(path.join(publicDirectory, filename))), filename);
}
for (const filename of ['protected-body.png','protected-profile.png','loose-hair-removal-mask.png','original-hair-source-mask.png','original-hair-source-layer.png']) {
  assert.ok((await readFile(path.join(directory, filename))).equals(await readFile(path.join(publicDirectory, filename))), filename);
}
const inspector = JSON.parse(await readFile(path.join(root, 'apps/client/public/assets/character-turnaround/manifest.json'), 'utf8'));
const previousInspector = JSON.parse(await readFile(path.join(directory, 'inspector-metadata-before.json'), 'utf8'));
const previousLedger = JSON.parse(await readFile(path.join(directory, 'generation-ledger-before.json'), 'utf8'));
const ledger = JSON.parse(await readFile(path.join(root, 'docs/design/character-turnaround/generation-ledger.json'), 'utf8'));
for (const [key, value] of Object.entries(previousLedger)) assert.deepEqual(ledger[key], value, `Existing ledger accounting/history ${key}`);
for (const [key, value] of Object.entries(previousInspector)) {
  if (!['master','views','review','generation','rightOnlyReview'].includes(key)) assert.deepEqual(inspector[key], value, `Unknown top-level metadata ${key}`);
}
for (const direction of ['north','west']) assert.deepEqual(inspector.views[direction], previousInspector.views[direction]);
for (const [key, value] of Object.entries(previousInspector.views.east)) {
  if (!['candidate','status','candidateSource','candidateLandmarks','candidateReview'].includes(key)) assert.deepEqual(inspector.views.east[key], value, `Prior east provenance ${key}`);
}
assert.equal(inspector.views.east.candidate, report.candidate);
assert.equal(inspector.views.east.status, report.status);
assert.deepEqual(inspector.views.east.candidateLandmarks.silhouette, report.measurements.after.silhouette);
assert.equal(inspector.master.approval.approved, true);
assert.equal(inspector.review.approved, false);
assert.equal(inspector.rightOnlyReview.review.approved, false);
assert.deepEqual(inspector.generation, ledger);
assert.equal(ledger.manualRight90Task.additionalCredits, 0);
const validation = { status: 'passed', approved: false, productionReady: false, native: true, changedPixels: changed, selectedPixels: selected, protectedPixels: 16384 - selected,
  checks: ['exact-front-PNG-and-original-strip-frame0','raw-before-byteexact','source-hashes-unchanged','independent-source-mask-replay','binary-selection-and-actual-diff','independent-body-guard-rows','all-unmasked-RGBA-exact','profile-face-ear-neck-exact','protected-visible-body-garment-exact','legs-sandals-feet-exact','independent-after-bounds','native-contact-panel-RGBA-exact','nearest2x-pixel-replication-exact','public-design-artifact-equality','north-west-unchanged','unknown-manifest-fields-retained','prior-ledger-accounting-history-retained','zero-new-jobs-credits'],
  measurements: report.measurements.after, currentStage: inspector.views.east.status, frontApproved: true, rightApproved: false, productionLimits: report.review.limitations };
await writeFile(path.join(directory, 'validation.json'), JSON.stringify(validation, null, 2) + '\n');
await writeFile(path.join(publicDirectory, 'validation.json'), JSON.stringify(validation, null, 2) + '\n');
console.log(`PASS right-only: ${changed} changed pixels; ${16384 - selected} unmasked RGBA protected; exact front/source pixels/native contact/nearest2x; no paid jobs, no approval.`);