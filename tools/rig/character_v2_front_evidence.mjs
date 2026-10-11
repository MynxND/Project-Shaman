import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';

const root = new URL('../../', import.meta.url);
const stage = new URL('docs/design/character-v2/body-front-01/', root);
const runtime = new URL('apps/client/public/assets/character-v2/body-front-01/', root);
const require = createRequire(new URL('apps/client/package.json', root));
const sharp = createRequire(require.resolve('next'))('sharp');
const json = async file => JSON.parse(await readFile(file, 'utf8'));
const review = await json(new URL('review.json', stage));
const receipt = await json(new URL('result.json', stage));
const ledger = await json(new URL('docs/design/character-v2/cost-ledger.json', root));
const bytes = await readFile(new URL('raw.png', stage));
const hash = createHash('sha256').update(bytes).digest('hex');
assert.equal(hash, review.sha256);
assert.equal(receipt.result.structuredContent.job_id, review.jobId);
assert.equal(receipt.result.structuredContent.status, 'completed');
assert.equal(receipt.result.structuredContent.charged_generations, 6);
const originalJob = ledger.jobs.find(job => job.stage === 'body-front-01');
assert.equal(originalJob.jobId, review.jobId);
assert.equal(originalJob.chargedCredits, receipt.result.structuredContent.charged_generations);
assert.equal(originalJob.status, 'completed-rejected');
assert.equal(ledger.spent, ledger.jobs.reduce((total, job) => total + (job.chargedCredits ?? job.accountedCredits ?? 0), 0));
assert.equal(ledger.reserved, ledger.jobs.filter(job => job.chargedCredits === null && job.accountedCredits === undefined).reduce((total, job) => total + job.estimatedCredits, 0));
assert.equal(review.status, 'rejected');
assert.equal(review.credibleCandidate, false);
assert.equal(review.visualApproved, false);
const metadata = await sharp(bytes).metadata();
assert.equal(metadata.format, 'png');
assert.equal(metadata.width, 128);
assert.equal(metadata.height, 128);
assert.equal(metadata.hasAlpha, true);
const { data } = await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
let visible = 0;
let transparent = 0;
let partial = 0;
let minX = 128;
let minY = 128;
let maxX = -1;
let maxY = -1;
const rows = [];
for (let row = 0; row < 128; row++) {
  let left = 128;
  let right = -1;
  for (let column = 0; column < 128; column++) {
    const alpha = data[(row * 128 + column) * 4 + 3];
    if (!alpha) { transparent++; continue; }
    visible++;
    if (alpha !== 255) partial++;
    minX = Math.min(minX, column);
    minY = Math.min(minY, row);
    maxX = Math.max(maxX, column);
    maxY = Math.max(maxY, row);
    left = Math.min(left, column);
    right = Math.max(right, column);
  }
  if (right >= 0) rows.push({ row, left, right });
}
assert.ok(visible > 0 && transparent > 0);
assert.equal(partial, 0);
assert.equal(review.landmarks.foot.y, maxY);
const bottom = rows.filter(record => record.row >= maxY - 4);
assert.equal(review.landmarks.foot.x, Math.round((Math.min(...bottom.map(record => record.left)) + Math.max(...bottom.map(record => record.right))) / 2));
const measurement = { sha256: hash, width: 128, height: 128, byteLength: bytes.length, visible, transparent, partial, bounds: { minX, minY, maxX, maxY }, rows, landmarks: review.landmarks, sourceUnmodified: true, method: 'alpha scan only; exact raw bytes copied; no V1 pixel extraction' };
const manifest = await json(new URL('apps/client/public/assets/character-v2/manifest.json', root));
assert.ok(manifest.assets.every(asset => asset.provenance.jobId !== review.jobId));
assert.equal(manifest.approvals.userVisualAccepted, false);
if (process.argv.includes('--test')) {
  assert.deepEqual(await readFile(new URL('raw.png', runtime)), bytes);
  assert.deepEqual(await json(new URL('review.json', runtime)), review);
  assert.deepEqual(await json(new URL('measurements.json', stage)), measurement);
} else {
  await mkdir(runtime, { recursive: true });
  await writeFile(new URL('measurements.json', stage), JSON.stringify(measurement, null, 2) + '\n');
  await copyFile(new URL('raw.png', stage), new URL('raw.png', runtime));
  await copyFile(new URL('review.json', stage), new URL('review.json', runtime));
}
console.log(`FRONT01 rejected evidence verified: ${hash}; ${visible} visible / ${transparent} transparent; measured foot ${review.landmarks.foot.x},${maxY}; original receipt6 preserved and excluded from candidates.`);