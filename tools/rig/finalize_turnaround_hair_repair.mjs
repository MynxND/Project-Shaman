import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import path from 'node:path';

const root = fileURLToPath(new URL('../../', import.meta.url));
const design = path.join(root, 'docs/design/character-turnaround');
const attempt = path.join(design, 'right90-hair-repair-01');
const require = createRequire(new URL('../../apps/client/package.json', import.meta.url));
const sharp = createRequire(require.resolve('next'))('sharp');
const load = async filename => JSON.parse(await readFile(filename, 'utf8'));
const save = async (filename, value) => writeFile(filename, JSON.stringify(value, null, 2) + '\n');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const text = receipt => receipt.result.content.filter(part => part.type === 'text').map(part => part.text).join('\n');
const resultText = text(await load(path.join(attempt, 'result.json')));
const submit = (await load(path.join(attempt, 'submit.json'))).result.structuredContent;
assert.match(resultText, /^status: failed/m);
assert.match(resultText, /temporary server issue/);
assert.equal(submit.estimated_generations, 6);
const balance = receipt => Number(text(receipt).match(/^generations_remaining: (\d+)/m)[1]);
const before = balance(await load(path.join(attempt, 'balance-before.json')));
const after = balance(await load(path.join(attempt, 'balance-after.json')));
assert.equal(before, after, 'Failed attempt must have an unchanged observed balance');
const preparation = await load(path.join(attempt, 'preparation.json'));
const rawSource = await readFile(path.join(root, preparation.source));
const input = await readFile(path.join(attempt, 'input.png'));
assert.ok(rawSource.equals(input), 'Raw rotation source PNG bytes must remain exact');
assert.equal(hash(rawSource), preparation.sourcePngSha256);
const front = await readFile(path.join(root, 'docs/design/head-proof/source/south.png'));
assert.equal(hash(front), preparation.frontPngSha256);
assert.ok(front.equals(await readFile(path.join(root, 'apps/client/public/assets/character-turnaround/south-candidate.png'))));
const maskBytes = await readFile(path.join(attempt, 'mask-binary.png'));
assert.equal(hash(maskBytes), preparation.maskPngSha256);
const mask = await sharp(maskBytes).ensureAlpha().raw().toBuffer();
const profile = await sharp(path.join(attempt, 'protected-profile.png')).ensureAlpha().raw().toBuffer();
let selected = 0, selectedProfile = 0;
for (let pixel = 0; pixel < 16384; pixel++) {
  const offset = pixel * 4;
  assert.ok(mask[offset] === 0 || mask[offset] === 255);
  assert.equal(mask[offset], mask[offset + 1]); assert.equal(mask[offset], mask[offset + 2]);
  selected += Number(mask[offset] === 255);
  selectedProfile += Number(mask[offset] === 255 && profile[offset] === 255);
}
assert.equal(selected, preparation.selectedPixels);
assert.equal(selectedProfile, 0);
const review = {
  version: 1, status: 'failed-no-result', approved: false, candidate: null, stop: true,
  reviewedDirection: 'east', jobId: submit.job_id, result: 'temporary-server-failure', raw: null,
  chargedGenerationsReceipt: null, observedChargedCredits: before - after,
  outputConservation: 'unavailable-no-output-not-a-pass', identityAssessment: 'unavailable-no-output',
  sourceRetention: { rawRotationPngExact: true, masterFrontPngExact: true, sourcePngSha256: hash(rawSource), frontPngSha256: hash(front) },
  mask: { file: 'mask-binary.png', pngSha256: hash(maskBytes), selectedPixels: selected, protectedPixels: 16384 - selected, selectedProtectedProfilePixels: selectedProfile },
  observations: [
    'Before image still has genuine right-facing profile and baseline0, but loose long hair and absent master crimson bow/tied segments remain rejected.',
    'One narrow reference-guided native128 inpaint was accepted with estimate6, then failed on the service with no output image.',
    'No raw after image exists; no corrected candidate, scalp-gap inspection, or output body-conservation claim is possible.',
    'Original east and rotated east skull silhouettes/pose do not align exactly, so no manual source-hair transplant was attempted.'
  ],
  evidence: { request: 'request.json', submit: 'submit.json', result: 'result.json', mask: 'mask-binary.png', protectedProfile: 'protected-profile.png', before: 'input.png', before2x: 'input-2x.png', context: 'context-native.png', context2x: 'context-2x.png', maskOverlay2x: 'mask-overlay-2x.png', after: null, comparisonAfter: null },
  rejectedPreview: '/assets/character-turnaround/rotation-experiment-01/east-rejected.png',
  rejectedPreviewPolicy: 'Retain latest actual rejected image; failed repair produced no replacement PNG. Prior rejection history is not deleted.',
  manualPixelCorrections: [], transformations: [], unreviewedGeneratedDirections: ['north', 'west'],
  nextGate: 'Stop for right-view review and a new explicit repair decision; no retry, back/left, new hairstyles, equipment or animation.',
  hiddenGeometry: preparation.hiddenGeometry
};
await save(path.join(attempt, 'review.json'), review);
const ledger = await load(path.join(design, 'generation-ledger.json'));
const job = ledger.jobs.find(record => record.id === submit.job_id);
assert.ok(job);
Object.assign(job, { status: 'completed-failed-no-result', chargedGenerations: 0, raw: null, chargeEvidence: 'unchanged-observed-account-balance-no-job-charge-field' });
ledger.pendingJobs = ledger.pendingJobs.filter(id => id !== submit.job_id);
ledger.additionalReservedCredits = Math.max(0, ledger.additionalReservedCredits - (ledger.hairRepairInvocation.reservedCredits ?? 0));
ledger.additionalChargedCredits = ledger.jobs.reduce((total, record) => total + record.chargedGenerations, 0);
Object.assign(ledger.hairRepairInvocation, {
  status: 'failed-no-result-stop-no-retry', chargedCredits: 0, reservedCredits: 0,
  usageEvidence: { before: 'right90-hair-repair-01/balance-before.json', after: 'right90-hair-repair-01/balance-after.json', remainingBefore: before, remainingAfter: after, observedDelta: 0, chargedGenerationsReceipt: null, caveat: 'Result has no charge field; observed balance unchanged. This is observed0, not a job-specific charged_generations receipt.' }
});
await save(path.join(design, 'generation-ledger.json'), ledger);
console.log('PASS: failed result archived; observed charge0, pending0; exact front/raw retention, binary mask hash and protected-profile selection0. No output, no retry, no candidate.');