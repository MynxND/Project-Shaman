import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { parseCharacterV2Manifest, v2ImageDimensionsMatch } from '../../../packages/shared/dist/character-v2.js';

const root = new URL('../../../', import.meta.url);
const manifest = parseCharacterV2Manifest(JSON.parse(await readFile(new URL('apps/client/public/assets/character-v2/manifest.json', root), 'utf8')));
const ledger = JSON.parse(await readFile(new URL('docs/design/character-v2/cost-ledger.json', root), 'utf8'));
assert.equal(ledger.version, 'shaman-character-v2-cost/1');
const expectedBudget = { cap: ledger.cap, spent: ledger.spent, reserved: ledger.reserved };
if (ledger.cap === 20) {
  const authorization = JSON.parse(await readFile(new URL('docs/design/character-v2/hair-proof-01/paid-stage/authorization.json', root), 'utf8'));
  assert.equal(ledger.stageAuthorizations.some(record => JSON.stringify(record) === JSON.stringify(authorization)), true);
  expectedBudget.capAuthority = { stageId: authorization.id, previousCap: authorization.previousCap, approvedCap: authorization.approvedCap, maxCredits: authorization.maxCredits, maxSubmissions: authorization.maxSubmissions, decisionPath: 'docs/design/character-v2/hair-proof-01/paid-stage/authorization.json' };
}
assert.deepEqual(manifest.budget, expectedBudget);
assert.equal(manifest.approvals.assetSpecAccepted, ledger.acceptedSpec);
assert.equal(manifest.approvals.assetSpecDecision, ledger.assetSpecDecision);
if (!ledger.acceptedSpec) {
  assert.equal(ledger.stageAuthorization, null);
  assert.deepEqual(ledger.jobs, []);
  assert.deepEqual(manifest.poses, []);
  assert.deepEqual(manifest.assets, []);
}
const require = createRequire(import.meta.url);
const sharp = createRequire(require.resolve('next'))('sharp');
for (const asset of manifest.assets) {
  const runtime = await readFile(new URL(`apps/client/public${asset.url}`, root));
  const source = await readFile(new URL(asset.provenance.sourcePath, root));
  assert.equal(createHash('sha256').update(source).digest('hex'), asset.provenance.sha256);
  assert.deepEqual(runtime, source, 'published source bytes must match runtime');
  const metadata = await sharp(runtime).metadata();
  assert.equal(metadata.format, 'png');
  assert.equal(metadata.hasAlpha, true);
  assert.equal(v2ImageDimensionsMatch(asset, metadata.width, metadata.height), true);
  const { data, info } = await sharp(runtime).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let visible = 0;
  let transparent = 0;
  for (let pixel = 0; pixel < data.length; pixel += info.channels) {
    if (data[pixel + info.channels - 1] > 0) visible++;
    else transparent++;
  }
  assert.ok(visible > 0 && transparent > 0, 'not an empty asset or opaque background');
}
if (ledger.jobs.some(job => job.stage === 'body-front-01' && job.status === 'completed-rejected')) {
  execFileSync(process.execPath, [fileURLToPath(new URL('tools/rig/character_v2_front_evidence.mjs', root)), '--test'], { stdio: 'inherit' });
}
if (ledger.jobs.some(job => job.stage === 'body-front-02' && job.status === 'completed-review-unapproved')) {
  execFileSync(process.execPath, [fileURLToPath(new URL('tools/rig/character_v2_front02_evidence.mjs', root)), '--test'], { stdio: 'inherit' });
}
if (ledger.jobs.some(job => job.stage === 'body-rotation-01' && job.status === 'completed-awaiting-four-view-review')) {
  execFileSync(process.execPath, [fileURLToPath(new URL('tools/rig/character_v2_rotation_evidence.mjs', root)), '--test'], { stdio: 'inherit' });
}
if (ledger.jobs.some(job => job.stage === 'hair-proof-01')) {
  execFileSync(process.execPath, [fileURLToPath(new URL('tools/rig/character_v2_hair_evidence.mjs', root))], { stdio: 'inherit' });
}
if (manifest.manualHairReview) {
  execFileSync(process.execPath, ['--test', fileURLToPath(new URL('tools/rig/character_v2_manual_hair.test.mjs', root))], { stdio: 'inherit' });
}
if (manifest.longHairReview) {
  execFileSync(process.execPath, ['--test', fileURLToPath(new URL('tools/rig/character_v2_long_hair.test.mjs', root))], { stdio: 'inherit' });
}
if (manifest.hairRedesignReview) {
  execFileSync(process.execPath, ['--test', fileURLToPath(new URL('tools/rig/character_v2_hair_redesign.test.mjs', root))], { stdio: 'inherit' });
}
console.log(`Character V2 publication: ${manifest.status}; ${manifest.assets.length} candidate PNGs verified; budget ${ledger.spent}/${ledger.reserved}/${ledger.cap}. Rejected evidence is NOT art readiness.`);