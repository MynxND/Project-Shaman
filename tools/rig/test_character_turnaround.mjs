import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../../', import.meta.url));
const require = createRequire(new URL('../../apps/client/package.json', import.meta.url));
const sharp = createRequire(require.resolve('next'))('sharp');
const design = path.join(root, 'docs/design/character-turnaround');
const publicRoot = path.join(root, 'apps/client/public');
const manifest = JSON.parse(await readFile(path.join(publicRoot, 'assets/character-turnaround/manifest.json'), 'utf8'));
const retention = JSON.parse(await readFile(path.join(design, 'source-retention.json'), 'utf8'));
for (const [relative, expected] of Object.entries(retention.sources)) assert.equal(createHash('sha256').update(await readFile(path.join(root, relative))).digest('hex'), expected, relative);
assert.equal(manifest.review.approved, false);
const rotation = manifest.review.rotation;
const hairRepair = manifest.review.hairRepair;
const manualRight = manifest.rightOnlyReview;
const originalJob = manifest.generation.jobs.find(job => job.direction === 'right90');
const rotationJob = manifest.generation.jobs.find(job => job.direction === 'right90-first-review');
assert.deepEqual(manifest.generation, JSON.parse(await readFile(path.join(design, 'generation-ledger.json'), 'utf8')), 'Manifest must retain the full current ledger');
assert.equal(manifest.generation.additionalChargedCredits, manifest.generation.jobs.reduce((total, job) => total + job.chargedGenerations, 0));
assert.equal(manifest.generation.additionalReservedCredits, 0);
assert.equal(manifest.generation.internalCeiling, rotation ? 14 : 6);
assert.equal(manifest.generation.jobs.length, hairRepair ? 3 : rotation ? 2 : 1);
assert.equal(originalJob.status, 'completed-rejected');
assert.equal(manifest.review.stage, manualRight ? 'manual-right90-proposal-awaiting-review' : hairRepair ? hairRepair.candidate ? 'proposed-right90-awaiting-user-review' : 'right90-hair-repair-failed-stop' : rotation ? 'right90-rotation-rejected-identity-stop' : 'right90-attempt-rejected-stop');
assert.equal(manifest.review.right90.candidate, null);
assert.equal(manifest.review.right90.stop, true);
assert.deepEqual(manifest.generation.pendingJobs, []);
assert.equal(manifest.canvas.footBaseline, 124);
assert.deepEqual(manifest.canvas.origin, { x: 64, y: 124 });
assert.equal(manifest.generation.userApprovedNumericalBudget, null);
const sourceFront = await readFile(path.join(root, 'docs/design/head-proof/source/south.png'));
assert.deepEqual(await readFile(path.join(publicRoot, manifest.views.south.candidate)), sourceFront, 'Front PNG bytes must be exact');
for (const [view, record] of Object.entries(manifest.views)) {
  const image = sharp(await readFile(path.join(publicRoot, record.original)));
  const metadata = await image.metadata();
  assert.equal(metadata.width, 128); assert.equal(metadata.height, 128); assert.equal(metadata.hasAlpha, true);
  const data = await image.ensureAlpha().raw().toBuffer();
  assert.equal(createHash('sha256').update(data).digest('hex'), record.source.frame0RgbaSha256);
  const strip = await sharp(path.join(publicRoot, record.source.url)).extract({ left: 0, top: 0, width: 128, height: 128 }).ensureAlpha().raw().toBuffer();
  assert.deepEqual(data, strip, `${view}: independent source frame0 match`);
  let lowestRow = -1;
  for (let pixel = 0; pixel < 128 * 128; pixel++) if (data[pixel * 4 + 3]) lowestRow = Math.max(lowestRow, Math.floor(pixel / 128));
  assert.equal(record.landmarks.observedLowestPixel, lowestRow);
  assert.equal(record.landmarks.groundEdgeDelta, lowestRow + 1 - 124);
  assert.equal(record.landmarks.semanticChecks.profileFaceVisibility, 'manual-review-required-not-inferred-from-color');
  for (let coordinate = 0; coordinate < 128; coordinate++) {
    for (const pixel of [coordinate, 127 * 128 + coordinate, coordinate * 128, coordinate * 128 + 127]) assert.equal(data[pixel * 4 + 3], 0, `${view}: transparent canvas border`);
  }
  if (view !== 'south' && !(view === 'east' && (hairRepair?.candidate || manualRight))) assert.equal(record.candidate, null, 'Unreviewed original must not be promoted to candidate');
}
const native = await sharp(path.join(design, 'previews/originals-native.png')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const doubled = await sharp(path.join(design, 'previews/originals-2x.png')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
assert.equal(native.info.width, 512); assert.equal(native.info.height, 128);
assert.equal(doubled.info.width, 1024); assert.equal(doubled.info.height, 256);
for (const [index, view] of ['south', 'east', 'north', 'west'].entries()) {
  const frame = await sharp(path.join(design, 'previews/originals-native.png')).extract({ left: index * 128, top: 0, width: 128, height: 128 }).ensureAlpha().raw().toBuffer();
  const original = await sharp(path.join(publicRoot, manifest.views[view].original)).ensureAlpha().raw().toBuffer();
  assert.deepEqual(frame, original, `${view}: contact retains original placement without per-view transform`);
}
for (let row = 0; row < 256; row++) for (let column = 0; column < 1024; column++) {
  const sourceOffset = (Math.floor(row / 2) * 512 + Math.floor(column / 2)) * 4;
  const targetOffset = (row * 1024 + column) * 4;
  assert.deepEqual(doubled.data.subarray(targetOffset, targetOffset + 4), native.data.subarray(sourceOffset, sourceOffset + 4));
}
const attempt = path.join(design, 'right90');
const result = JSON.parse(await readFile(path.join(attempt, 'result.json'), 'utf8')).result.structuredContent;
assert.equal(result.status, 'completed');
assert.equal(result.charged_generations, originalJob.chargedGenerations);
assert.equal(result.job_id, originalJob.id);
const rawBytes = await readFile(path.join(attempt, 'raw.png'));
const raw = await sharp(rawBytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
assert.equal(raw.info.width, 128); assert.equal(raw.info.height, 128);
const measured = JSON.parse(await readFile(path.join(attempt, 'measurements.json'), 'utf8'));
assert.equal(createHash('sha256').update(rawBytes).digest('hex'), measured.rawPngSha256);
const mask = await sharp(path.join(attempt, 'mask-binary.png')).ensureAlpha().raw().toBuffer();
const input = await sharp(path.join(attempt, 'input.png')).ensureAlpha().raw().toBuffer();
assert.deepEqual(input, await sharp(path.join(publicRoot, manifest.views.east.original)).ensureAlpha().raw().toBuffer());
let rawLowestRow = -1;
for (let pixel = 0; pixel < 16384; pixel++) {
  const offset = pixel * 4;
  assert.ok(mask[offset] === 0 || mask[offset] === 255);
  assert.equal(mask[offset], mask[offset + 1]); assert.equal(mask[offset], mask[offset + 2]);
  if (mask[offset] === 0) assert.deepEqual(raw.data.subarray(offset, offset + 4), input.subarray(offset, offset + 4), 'Exact unmasked RGBA');
  if (raw.data[offset + 3]) rawLowestRow = Math.max(rawLowestRow, Math.floor(pixel / 128));
}
assert.equal(rawLowestRow, 122);
assert.equal(rawLowestRow + 1 - manifest.canvas.footBaseline, -1);
const comparison = await sharp(path.join(attempt, 'comparison-native.png')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const comparison2x = await sharp(path.join(attempt, 'comparison-2x.png')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
assert.equal(comparison.info.width, 384); assert.equal(comparison.info.height, 128);
assert.equal(comparison2x.info.width, 768); assert.equal(comparison2x.info.height, 256);
for (const [index, frame] of [await sharp(sourceFront).ensureAlpha().raw().toBuffer(), input, raw.data].entries()) {
  assert.deepEqual(await sharp(path.join(attempt, 'comparison-native.png')).extract({ left: index * 128, top: 0, width: 128, height: 128 }).ensureAlpha().raw().toBuffer(), frame);
}
for (let row = 0; row < 256; row++) for (let column = 0; column < 768; column++) {
  const sourceOffset = (Math.floor(row / 2) * 384 + Math.floor(column / 2)) * 4;
  const targetOffset = (row * 768 + column) * 4;
  assert.deepEqual(comparison2x.data.subarray(targetOffset, targetOffset + 4), comparison.data.subarray(sourceOffset, sourceOffset + 4));
}
if (rotation) {
  const experiment = path.join(design, 'rotation-experiment-01');
  const measurements = JSON.parse(await readFile(path.join(experiment, 'measurements.json'), 'utf8'));
  assert.equal(rotation.status, 'rejected'); assert.equal(rotation.approved, false);
  assert.equal(rotation.candidate, null); assert.equal(rotation.stop, true);
  assert.deepEqual(rotation.manualPixelCorrections, []); assert.deepEqual(rotation.transformations, []);
  assert.equal(rotationJob.chargedGenerations, 2);
  assert.equal(rotationJob.status, 'completed-rejected');
  assert.equal(manifest.generation.rotationInvocation.additionalInternalCeiling, 8);
  assert.equal(manifest.generation.rotationInvocation.userApprovedNumericalBudget, null);
  assert.equal(manifest.generation.rotationInvocation.usageEvidence.chargedGenerationsReceipt, null);
  const submit = JSON.parse(await readFile(path.join(experiment, 'submit.json'), 'utf8')).result.structuredContent;
  assert.equal(submit.first_direction_generated, false); assert.equal(submit.estimated_generations, 2);
  assert.equal(submit.job_id, rotationJob.id);
  const completed = JSON.parse(await readFile(path.join(experiment, 'result-final.json'), 'utf8')).result.content.find(part => part.type === 'text').text;
  assert.match(completed, /^status: completed/m); assert.match(completed, /animations: none/);
  for (const [direction, measuredView] of Object.entries(measurements.views)) {
    const bytes = await readFile(path.join(experiment, 'raw', `${direction}.png`));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), measuredView.rawPngSha256);
    const decoded = await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    assert.equal(decoded.info.width, 128); assert.equal(decoded.info.height, 128);
    assert.equal(createHash('sha256').update(decoded.data).digest('hex'), measuredView.rgbaSha256);
    let lowest = -1;
    for (let pixel = 0; pixel < 16384; pixel++) if (decoded.data[pixel * 4 + 3]) lowest = Math.max(lowest, Math.floor(pixel / 128));
    assert.equal(lowest + 1 - 124, measuredView.groundEdgeDelta);
    if (direction === 'south') assert.deepEqual(decoded.data, await sharp(sourceFront).ensureAlpha().raw().toBuffer());
  }
  assert.equal(measurements.views.east.groundEdgeDelta, 0);
  assert.deepEqual(await readFile(path.join(publicRoot, manifest.views.east.rejectedPreview)), await readFile(path.join(experiment, 'raw/east.png')));
  assert.equal(manifest.views.east.candidate, manualRight?.after ?? hairRepair?.candidate ?? null);
  assert.equal(manifest.views.east.rejectedStatus, 'rejected-not-a-candidate-hair-tie-identity-drift');
  const rotationNative = await sharp(path.join(experiment, 'east-comparison-native.png')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const rotation2x = await sharp(path.join(experiment, 'east-comparison-2x.png')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  assert.equal(rotationNative.info.width, 384); assert.equal(rotationNative.info.height, 128);
  assert.equal(rotation2x.info.width, 768); assert.equal(rotation2x.info.height, 256);
  for (const [index, bytes] of [sourceFront, await readFile(path.join(publicRoot, manifest.views.east.original)), await readFile(path.join(experiment, 'raw/east.png'))].entries()) {
    const panel = await sharp(path.join(experiment, 'east-comparison-native.png')).extract({ left: index * 128, top: 0, width: 128, height: 128 }).ensureAlpha().raw().toBuffer();
    assert.deepEqual(panel, await sharp(bytes).ensureAlpha().raw().toBuffer(), 'Rotation panels preserve exact native placement');
  }
  for (let row = 0; row < 256; row++) for (let column = 0; column < 768; column++) {
    const sourceOffset = (Math.floor(row / 2) * 384 + Math.floor(column / 2)) * 4;
    const targetOffset = (row * 768 + column) * 4;
    assert.deepEqual(rotation2x.data.subarray(targetOffset, targetOffset + 4), rotationNative.data.subarray(sourceOffset, sourceOffset + 4));
  }
  for (const filename of ['east-comparison-native.png', 'east-comparison-2x.png']) assert.deepEqual(await readFile(path.join(publicRoot, 'assets/character-turnaround/rotation-experiment-01', filename)), await readFile(path.join(experiment, filename)));
}
if (hairRepair) {
  const attempt = path.join(design, 'right90-hair-repair-01');
  const preparation = JSON.parse(await readFile(path.join(attempt, 'preparation.json'), 'utf8'));
  const job = manifest.generation.jobs.find(record => record.id === hairRepair.jobId);
  assert.equal(manifest.generation.hairRepairInvocation.additionalInternalCeiling, 6);
  assert.equal(manifest.generation.hairRepairInvocation.userApprovedNumericalBudget, null);
  assert.equal(hairRepair.approved, false); assert.equal(hairRepair.stop, true);
  assert.equal(manifest.views.north.candidate, null); assert.equal(manifest.views.west.candidate, null);
  assert.equal(manifest.views.north.status, 'blocked-by-right90-failure');
  assert.equal(manifest.views.west.status, 'blocked-by-right90-failure');
  assert.equal(manifest.views.east.rejectedHistory.length, 3);
  const inputBytes = await readFile(path.join(attempt, 'input.png'));
  assert.ok(inputBytes.equals(await readFile(path.join(design, 'rotation-experiment-01/raw/east.png'))));
  assert.equal(createHash('sha256').update(inputBytes).digest('hex'), preparation.sourcePngSha256);
  const maskBytes = await readFile(path.join(attempt, 'mask-binary.png'));
  assert.equal(createHash('sha256').update(maskBytes).digest('hex'), preparation.maskPngSha256);
  const mask = await sharp(maskBytes).ensureAlpha().raw().toBuffer();
  const profile = await sharp(path.join(attempt, 'protected-profile.png')).ensureAlpha().raw().toBuffer();
  let selected = 0;
  for (let pixel = 0; pixel < 16384; pixel++) {
    const offset = pixel * 4;
    assert.ok(mask[offset] === 0 || mask[offset] === 255);
    assert.equal(mask[offset], mask[offset + 1]); assert.equal(mask[offset], mask[offset + 2]);
    assert.ok(!(mask[offset] === 255 && profile[offset] === 255));
    selected += Number(mask[offset] === 255);
  }
  assert.equal(selected, preparation.selectedPixels);
  const context = await sharp(path.join(attempt, 'context-native.png')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const context2x = await sharp(path.join(attempt, 'context-2x.png')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  assert.equal(context.info.width, 384); assert.equal(context.info.height, 128);
  assert.equal(context2x.info.width, 768); assert.equal(context2x.info.height, 256);
  for (const [index, bytes] of [inputBytes, await readFile(path.join(publicRoot, manifest.views.east.original)), sourceFront].entries()) {
    const frame = await sharp(path.join(attempt, 'context-native.png')).extract({ left: index * 128, top: 0, width: 128, height: 128 }).ensureAlpha().raw().toBuffer();
    assert.ok(frame.equals(await sharp(bytes).ensureAlpha().raw().toBuffer()), 'Repair context must retain exact native reference placement');
  }
  for (let row = 0; row < 256; row++) for (let column = 0; column < 768; column++) {
    const offset = (row * 768 + column) * 4;
    const sourceOffset = (Math.floor(row / 2) * 384 + Math.floor(column / 2)) * 4;
    assert.ok(context2x.data.subarray(offset, offset + 4).equals(context.data.subarray(sourceOffset, sourceOffset + 4)), 'Repair context must be exact nearest2x');
  }
  if (hairRepair.candidate) {
    assert.equal(hairRepair.status, 'proposed-right90-awaiting-user-review');
    assert.equal(manifest.views.east.candidate, hairRepair.candidate);
    const rawBytes = await readFile(path.join(attempt, 'raw.png'));
    assert.ok(rawBytes.equals(await readFile(path.join(publicRoot, hairRepair.candidate))));
    const raw = await sharp(rawBytes).ensureAlpha().raw().toBuffer();
    const input = await sharp(inputBytes).ensureAlpha().raw().toBuffer();
    for (let pixel = 0; pixel < 16384; pixel++) {
      const offset = pixel * 4;
      if (mask[offset] === 0 || profile[offset] === 255) assert.ok(raw.subarray(offset, offset + 4).equals(input.subarray(offset, offset + 4)));
    }
  } else {
    assert.equal(hairRepair.status, 'failed-no-result');
    assert.equal(hairRepair.raw, null);
    assert.equal(hairRepair.outputConservation, 'unavailable-no-output-not-a-pass');
    assert.equal(job.status, 'completed-failed-no-result'); assert.equal(job.chargedGenerations, 0);
    const result = JSON.parse(await readFile(path.join(attempt, 'result.json'), 'utf8'));
    assert.match(result.result.content.find(part => part.type === 'text').text, /^status: failed/m);
    assert.equal(manifest.generation.hairRepairInvocation.usageEvidence.observedDelta, 0);
    assert.equal(manifest.views.east.candidate, manualRight?.after ?? null);
  }
}
const report = {
  version: 1,
  executableChecks: 'passed',
  checks: ['retained-source-sha256', 'byte-exact-front-png', 'all-original-frame0-rgba', 'native128-transparent-border', 'no-contact-sheet-transform', 'pixel-exact-nearest2x', 'null-blocked-candidates', 'actual-six-generation-receipt', 'raw-native128-sha256', 'binary-mask-and-exact-unmasked-rgba', 'raw-baseline-failure-retained', 'raw-comparison-no-transform-exact-nearest2x'],
  sourceBaselineDeltas: Object.fromEntries(Object.entries(manifest.views).map(([view, record]) => [view, record.landmarks.groundEdgeDelta])),
  fourViewAligned: Object.values(manifest.views).every(record => record.landmarks.groundEdgeDelta === 0),
  correctedDirections: [],
  preservedDirections: ['south'],
  blockedDirections: hairRepair?.candidate || manualRight ? ['north', 'west'] : ['east', 'north', 'west'],
  proposedDirections: hairRepair?.candidate || manualRight ? ['east'] : [],
  ...(manualRight ? { manualRight90: { status: manualRight.status, approved: false, productionReady: false, evidence: 'right90-manual-01/provenance.json', checks: 'Run tools/rig/test_right_profile_correction.mjs for independent per-pixel source replay and preservation.' } } : {}),
  ...(hairRepair ? { hairRepairAttempt: { status: hairRepair.status, approved: false, candidate: hairRepair.candidate, evidence: 'right90-hair-repair-01/review.json', outputConservation: hairRepair.outputConservation, observedChargedCredits: manifest.generation.hairRepairInvocation.chargedCredits, checks: ['raw-input-byte-exact', 'front-byte-exact', 'binary-mask-hash', 'protected-profile-excluded', 'no-north-west-promotion', 'rejection-history-retained', 'full-ledger-retained'] } } : {}),
  semanticReviewRequired: ['true90-and270-profile', 'back180-face-absence', 'identity-and-asymmetry', 'anatomical-landmarks', 'user-approval'],
  approved: false,
  additionalChargedCredits: manifest.generation.additionalChargedCredits,
  attemptedDirections: ['east'],
  rejectedDirections: ['east'],
  actualMethod: manifest.generation.method,
  actualAttemptEvidence: 'right90/review.json',
  ...(rotation ? { rotationAttempt: { method: rotationJob.method, observedChargedCredits: 2, approved: false, evidence: 'rotation-experiment-01/review.json', checks: ['exact-source-reuse-rgba', 'eight-native-raw-hashes', 'rejected-preview-byte-exact', 'east-baseline-zero-not-semantic-approval', 'native-comparison-no-transform', 'exact-nearest2x', 'null-candidates-and-sequential-stop', 'billing-attribution-caveat-retained'] } } : {}),
  pendingJobs: manifest.generation.pendingJobs
};
await writeFile(path.join(design, 'validation.json'), JSON.stringify(report, null, 2) + '\n');
console.log(`PASS: retained originals/front, gated candidates, original actual6 receipt, exact black-mask RGBA and native/nearest2x comparisons.${rotation ? ' Rotation retention and rejected identity verified.' : ''}${hairRepair ? ` Hair repair ${hairRepair.status}; mask/profile, exact native/2x context, ledger/history and right-only gate verified. Observed repair charge${manifest.generation.hairRepairInvocation.chargedCredits}; pending0.` : ''} NOT semantic art certification.`);