import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { decodePng, makeMasks, hash } from './prepare_character_v2_hair.mjs';
import { parseCharacterV2Manifest, v2ItemAssets } from '../../packages/shared/dist/character-v2.js';

const root = new URL('../../', import.meta.url);
const stagePath = 'docs/design/character-v2/hair-proof-01/paid-stage/';
const load = path => readFile(new URL(path, root));
const json = async path => JSON.parse(await load(path));
const save = (path, value) => writeFile(new URL(path, root), JSON.stringify(value, null, 2) + '\n');
const require = createRequire(new URL('apps/client/package.json', root));
const sharp = createRequire(require.resolve('next'))('sharp');
const before = await json(stagePath + 'ledger-before.json');
const manifestBefore = await json(stagePath + 'manifest-before.json');
const authorization = await json(stagePath + 'authorization.json');
const liveManifest = parseCharacterV2Manifest(await json('apps/client/public/assets/character-v2/manifest.json'));
const longStage = 'docs/design/character-v2/hair-long-manual-01/';
const currentLedger = await json(liveManifest.longHairReview ? longStage + 'ledger-before.json' : 'docs/design/character-v2/cost-ledger.json');
const currentManifest = liveManifest.longHairReview ? parseCharacterV2Manifest(await json(longStage + 'manifest-before.json')) : liveManifest;
const manualStage = 'docs/design/character-v2/hair-manual-01/';
const laterManual = Boolean(currentManifest.manualHairReview);
if (laterManual) assert.equal(process.argv.includes('--record'), false, 'Never overwrite paid history after manual publication');
const ledger = laterManual ? await json(manualStage + 'ledger-before.json') : currentLedger;
const manifest = laterManual ? parseCharacterV2Manifest(await json(manualStage + 'manifest-before.json')) : currentManifest;
if (laterManual) {
  for (const [key, value] of Object.entries(ledger)) assert.deepEqual(currentLedger[key], value, `Frozen paid ledger field ${key}`);
  for (const [key, value] of Object.entries(manifest)) {
    assert.deepEqual(key === 'assets' ? currentManifest.assets.filter(asset => asset.layer !== 'hair') : currentManifest[key], value, `Frozen paid manifest field ${key}`);
  }
  assert.equal(currentManifest.assets.length, manifest.assets.length + 1);
  assert.equal(currentManifest.assets.at(-1).provenance.method, 'manual');
  assert.equal(currentManifest.assets.at(-1).provenance.jobId, null);
}
const receipt = (await json(stagePath + 'result.json')).result.structuredContent;
const submit = (await json(stagePath + 'submit.json')).result.structuredContent;
const intent = await json(stagePath + 'submit-intent.json');
const request = await json(stagePath + 'request.json');
assert.equal(hash(await load(stagePath + 'request.json')), intent.requestSha256);
assert.equal(hash(await load(authorization.maskPath)), request.maskTransport.sha256);
assert.equal(request.arguments.output_method, 'New layer with changes');
assert.equal(request.arguments.crop_to_mask, true);
assert.equal(request.arguments.no_background, true);
assert.equal(request.arguments.source_image_id, '1fb97f42-4ce5-55e9-903f-a8edd56a67bc');
assert.deepEqual(request.transformations, []);
assert.equal(request.outputCount, 1);
assert.equal(receipt.status, 'completed');
assert.equal(receipt.job_id, submit.job_id);
assert.equal(receipt.charged_generations, 6);
assert.equal(submit.estimated_generations, 6);
assert.deepEqual(submit.image_size, { width: 128, height: 128 });
assert.equal(authorization.maxSubmissions, 1);
assert.equal(authorization.retryAuthorized, false);
assert.equal(ledger.cap, authorization.approvedCap);
assert.equal(before.cap, authorization.previousCap);
assert.equal(before.spent, authorization.priorSpent);
assert.deepEqual(ledger.jobs.filter(job => job.stage !== 'hair-proof-01'), before.jobs);
assert.deepEqual(ledger.stageAuthorizations, [...before.stageAuthorizations, authorization]);
assert.equal(ledger.jobs.filter(job => job.stage === 'hair-proof-01').length, 1);
const job = ledger.jobs.find(record => record.stage === 'hair-proof-01');
assert.equal(job.jobId, submit.job_id);
assert.equal(job.chargedCredits, receipt.charged_generations);
assert.equal(ledger.spent, before.spent + receipt.charged_generations);
assert.equal(ledger.reserved, 0);
assert.equal(ledger.pendingCredits, 0);
assert.equal(ledger.remainingUncommitted, 0);
for (const [key, value] of Object.entries(before)) {
  if (!['cap', 'spent', 'reserved', 'pendingCredits', 'remainingUncommitted', 'jobs', 'stageAuthorizations', 'bodyFourViewApproval'].includes(key)) assert.deepEqual(ledger[key], value);
}
assert.deepEqual(manifest.frontVisualApproval, manifestBefore.frontVisualApproval);
assert.deepEqual(manifest.rotationReview, manifestBefore.rotationReview);
assert.deepEqual(manifest.poses, manifestBefore.poses);
for (const [key, value] of Object.entries(manifestBefore)) {
  if (!['budget', 'assets', 'bodyFourViewApproval'].includes(key)) assert.deepEqual(manifest[key], value, `Preserve manifest field ${key}`);
}
assert.equal(manifest.assets.length, 4, 'Rejected hair must never be published');
for (const previous of manifestBefore.assets) {
  const current = manifest.assets.find(asset => asset.id === previous.id);
  assert.deepEqual(current, { ...previous, visualApproved: true });
  const source = await load(current.provenance.sourcePath);
  assert.equal(hash(source), current.provenance.sha256);
  assert.equal(hash(await load('apps/client/public' + current.url)), current.provenance.sha256);
}
assert.equal(manifest.approvals.userVisualAccepted, false);
assert.equal(manifest.approvals.animationAccepted, false);
assert.deepEqual(manifest.bodyFourViewApproval, authorization);
assert.equal(manifest.budget.capAuthority.decisionPath, stagePath + 'authorization.json');
assert.deepEqual(manifest.budget, { cap: 20, spent: 20, reserved: 0, capAuthority: manifest.budget.capAuthority });
for (const pose of manifest.poses) assert.deepEqual(v2ItemAssets(manifest, pose, 'hair', 'ivory-crop-01'), []);
const sourceBytes = await load('docs/design/character-v2/body-front-02/raw.png');
assert.equal(hash(sourceBytes), authorization.sourceSha256);
const body = await decodePng(sourceBytes);
const masks = makeMasks(body);
const rawBytes = await load(stagePath + 'raw.png');
const layer = await decodePng(rawBytes);
const composite = Buffer.from(body);
const metrics = { nativeWidth: 128, nativeHeight: 128, visible: 0, outsideMask: 0, partialAlpha: 0, hiddenRgb: 0, sourceCopies: 0, skinLikePixels: 0, bounds: { minX: 128, minY: 128, maxX: -1, maxY: -1 } };
const colors = new Map();
for (let pixel = 0; pixel < 16384; pixel++) {
  const offset = pixel * 4;
  const [red, green, blue, alpha] = layer.subarray(offset, offset + 4);
  if (!alpha) {
    if (red || green || blue) metrics.hiddenRgb++;
    continue;
  }
  metrics.visible++;
  if (!masks.hair[pixel]) metrics.outsideMask++;
  if (alpha !== 255) metrics.partialAlpha++;
  if (layer.subarray(offset, offset + 4).equals(body.subarray(offset, offset + 4))) metrics.sourceCopies++;
  if (red > green + 15 && green > blue + 10) metrics.skinLikePixels++;
  const color = `${red},${green},${blue},${alpha}`;
  colors.set(color, (colors.get(color) ?? 0) + 1);
  const column = pixel % 128;
  const row = Math.floor(pixel / 128);
  metrics.bounds.minX = Math.min(metrics.bounds.minX, column);
  metrics.bounds.maxX = Math.max(metrics.bounds.maxX, column);
  metrics.bounds.minY = Math.min(metrics.bounds.minY, row);
  metrics.bounds.maxY = Math.max(metrics.bounds.maxY, row);
  layer.copy(composite, offset, offset, offset + 4);
}
let protectedMismatch = 0;
for (let pixel = 0; pixel < 16384; pixel++) {
  const offset = pixel * 4;
  if (!masks.hair[pixel] && !composite.subarray(offset, offset + 4).equals(body.subarray(offset, offset + 4))) protectedMismatch++;
}
assert.equal(protectedMismatch, 0);
assert.equal(metrics.outsideMask, 0);
assert.ok(metrics.visible > 0);
assert.ok(metrics.skinLikePixels > 0, 'Rejected scalp contamination must remain observable, not erased');
const review = {
  version: 'shaman-character-v2-hair-review/1', status: 'completed-rejected-skin-contamination', jobId: submit.job_id,
  rawPath: stagePath + 'raw.png', rawSha256: hash(rawBytes), sourceSha256: hash(sourceBytes), metrics,
  colors: [...colors], protectedMismatch, frozenPixels: 16010, transformations: [],
  credibleCandidate: false, isolationAccepted: false, visualApproved: false, productionReady: false, published: false, retryAuthorized: false,
  visualVerdict: 'Actual provider PNG contains ivory hair at the top plus a visible warm skin/scalp band beneath it INSIDE the editable cap mask. This is not a hair-only layer. Reject untouched raw, never erase generated skin and claim service isolation. Shape is a compact cap; the approved mask forbids natural bangs and full hairstyle coverage.',
  stop: 'ONE job completed, actual6, V2 cap20 spent20 remaining0 pending0. No retry, other hair directions, outfit, animation or live integration.',
  diagnosticOnly: true, compositePath: stagePath + 'rejected-composite-diagnostic.png',
};
const native = Buffer.alloc(384 * 128 * 4);
for (const [index, pixels] of [body, layer, composite].entries()) {
  for (let row = 0; row < 128; row++) pixels.copy(native, (row * 384 + index * 128) * 4, row * 128 * 4, (row + 1) * 128 * 4);
}
const enlarged = Buffer.alloc(768 * 256 * 4);
for (let row = 0; row < 256; row++) {
  for (let column = 0; column < 768; column++) {
    const offset = (Math.floor(row / 2) * 384 + Math.floor(column / 2)) * 4;
    native.copy(enlarged, (row * 768 + column) * 4, offset, offset + 4);
  }
}
const outputs = [
  ['rejected-composite-diagnostic.png', composite, 128, 128],
  ['comparison-native.png', native, 384, 128],
  ['comparison-nearest2x.png', enlarged, 768, 256],
];
if (process.argv.includes('--record')) {
  for (const [name, data, width, height] of outputs) await writeFile(new URL(stagePath + name, root), await sharp(data, { raw: { width, height, channels: 4 } }).png().toBuffer(), { flag: 'wx' });
  await save(stagePath + 'review.json', review);
  job.status = review.status;
  await save('docs/design/character-v2/cost-ledger.json', ledger);
} else {
  assert.deepEqual(await json(stagePath + 'review.json'), review);
  assert.equal(job.status, review.status);
  for (const [name, data] of outputs) assert.ok((await sharp(await load(stagePath + name)).ensureAlpha().raw().toBuffer()).equals(data), 'Exact native/nearest diagnostic mismatch');
}
assert.equal(hash(await load(stagePath + 'raw.png')), review.rawSha256);
console.log(JSON.stringify({ status: review.status, jobId: job.jobId, metrics, protectedMismatch, charged: 6, spent: ledger.spent, cap: ledger.cap, remaining: 0, published: false }, null, 2));