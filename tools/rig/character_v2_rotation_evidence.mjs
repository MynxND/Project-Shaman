import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, copyFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { parseCharacterV2Manifest } from '../../packages/shared/dist/character-v2.js';

const root = new URL('../../', import.meta.url);
const stage = new URL('docs/design/character-v2/body-rotation-01/', root);
const runtime = new URL('apps/client/public/assets/character-v2/body-rotation-01/', root);
const json = async file => JSON.parse(await readFile(file, 'utf8'));
const save = async (file, value) => writeFile(file, JSON.stringify(value, null, 2) + '\n');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const require = createRequire(new URL('apps/client/package.json', root));
const sharp = createRequire(require.resolve('next'))('sharp');
const directions = ['south', 'east', 'north', 'west'];
const origin = { x: 61, y: 112 };
const source = await readFile(new URL('docs/design/character-v2/body-front-02/raw.png', root));
assert.equal(hash(source), '0ed1ddf448b70a93dc5f624617e832a0af593779b6b7257d65db39b61be35958');
const authorization = await json(new URL('authorization.json', stage));
const intent = await json(new URL('submit-intent.json', stage));
const submit = (await json(new URL('submit.json', stage))).result.structuredContent;
const outer = await json(new URL('outer-job.json', stage));
assert.equal(outer.id, submit.job_id);
assert.equal(outer.status, 'completed');
assert.equal(outer.last_response.billing_charged, true);
assert.equal(outer.last_response.billing_usage.generations, 2);
assert.equal(outer.last_response.first_direction_generated, false);
assert.deepEqual(outer.last_response.billing_stages.map(record => record.stage), ['rotations']);
assert.equal(outer.last_response.character_id, submit.character_id);
assert.equal(outer.last_response.directions_count, 8);
const script = await readFile(new URL('tools/rig/character_v2_rotation.ps1', root), 'utf8');
assert.ok(script.indexOf("'submit-intent.json')) { throw") < script.indexOf("Call-Pixel 'create_character_pro_flash'"));
const result = await json(new URL('result.json', stage));
const text = result.result.content.filter(part => part.type === 'text').map(part => part.text).join('\n');
assert.match(text, /^status: completed/m);
assert.match(text, /animations: none/);
assert.equal(submit.first_direction_generated, false);
assert.equal(submit.estimated_generations, 2);
assert.equal(authorization.maxCredits, 2);
assert.equal(authorization.maxSubmissions, 1);
assert.equal(authorization.frontVisualApproved, true);
assert.equal(authorization.fourViewVisualApproved, false);
assert.equal(intent.sourceSha256, hash(source));
assert.deepEqual(intent.transformations, []);
assert.equal(hash(await readFile(new URL('request.json', stage))), intent.requestSha256);
const schema = (await json(new URL('live-schemas.json', stage))).find(record => record.name === 'create_character_pro_flash');
assert.match(schema.description, /only rotations are charged/);
assert.equal(schema.inputSchema.properties.n_directions.const, 8);
assert.equal((await json(new URL('quote.json', stage))).result.structuredContent.cost.rotations, 2);
const rawUrls = [...text.matchAll(/^  ([a-z-]+): (https:\/\/[^\s]+)$/gm)];
assert.equal(rawUrls.length, 8);
const measurement = { version: 'shaman-character-v2-rotation-evidence/1', sourceSha256: hash(source), sharedOrigin: origin, transformations: [], views: {}, providerSouth: null };
const decoded = {};
for (const [, direction, url] of rawUrls) {
  assert.ok(['api.pixellab.ai', 'backblaze.pixellab.ai'].includes(new URL(url).hostname));
  const rawPath = new URL(`raw/${direction}.png`, stage);
  if (process.argv.includes('--collect')) {
    await mkdir(new URL('raw/', stage), { recursive: true });
    try { await access(rawPath); } catch {
      const response = await fetch(url);
      assert.ok(response.ok, `Download ${direction}: ${response.status}`);
      await writeFile(rawPath, Buffer.from(await response.arrayBuffer()));
    }
  }
  const bytes = await readFile(rawPath);
  const metadata = await sharp(bytes).metadata();
  assert.equal(metadata.format, 'png');
  assert.equal(metadata.hasAlpha, true);
  const { data, info } = await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  assert.equal(info.width, 128);
  assert.equal(info.height, 128);
  decoded[direction] = data;
  const rows = [];
  let visible = 0;
  let partialAlpha = 0;
  for (let row = 0; row < 128; row++) {
    let left = 128;
    let right = -1;
    for (let column = 0; column < 128; column++) {
      const alpha = data[(row * 128 + column) * 4 + 3];
      if (!alpha) continue;
      visible++;
      if (alpha !== 255) partialAlpha++;
      left = Math.min(left, column);
      right = Math.max(right, column);
    }
    if (right >= 0) rows.push({ row, left, right });
  }
  assert.ok(visible > 0 && visible < 16384, `Empty or opaque ${direction}`);
  const bounds = { minX: Math.min(...rows.map(record => record.left)), minY: rows[0].row, maxX: Math.max(...rows.map(record => record.right)), maxY: rows.at(-1).row };
  const bottom = rows.filter(record => record.row >= bounds.maxY - 4);
  const actualFoot = { x: Math.round((Math.min(...bottom.map(record => record.left)) + Math.max(...bottom.map(record => record.right))) / 2), y: bounds.maxY };
  measurement.views[direction] = { sha256: hash(bytes), rgbaSha256: hash(data), width: 128, height: 128, visible, partialAlpha, bounds, figureHeight: bounds.maxY - bounds.minY + 1, actualFoot, actualFootDelta: { x: actualFoot.x - origin.x, y: actualFoot.y - origin.y }, footMethod: 'Lowest opaque row and midpoint of bottom-five-row alpha extents; semantic foot estimate provisional, not alignment.', sourcePath: `docs/design/character-v2/body-rotation-01/raw/${direction}.png`, rows };
}
const originalRgba = await sharp(source).ensureAlpha().raw().toBuffer();
measurement.providerSouth = { pngBytesEqual: source.equals(await readFile(new URL('raw/south.png', stage))), rgbaEqual: originalRgba.equals(decoded.south), runtimeUsesApprovedOriginal: true };
decoded.south = originalRgba;
const contact = Buffer.alloc(512 * 128 * 4);
for (const [index, direction] of directions.entries()) for (let row = 0; row < 128; row++) decoded[direction].copy(contact, (row * 512 + index * 128) * 4, row * 128 * 4, (row + 1) * 128 * 4);
if (process.argv.includes('--collect')) {
  await save(new URL('measurements.json', stage), measurement);
  await sharp(contact, { raw: { width: 512, height: 128, channels: 4 } }).png().toFile(fileURLToPath(new URL('cardinals-native.png', stage)));
  console.log(JSON.stringify(measurement, (key, value) => key === 'rows' ? undefined : value, 2));
} else {
  assert.deepEqual(await json(new URL('measurements.json', stage)), measurement);
  const currentLedger = await json(new URL('docs/design/character-v2/cost-ledger.json', root));
  const laterHair = currentLedger.jobs.some(record => record.stage === 'hair-proof-01');
  const hairStage = new URL('docs/design/character-v2/hair-proof-01/paid-stage/', root);
  const ledger = laterHair ? await json(new URL('ledger-before.json', hairStage)) : currentLedger;
  const before = await json(new URL('ledger-before.json', stage));
  const manifestPath = new URL('apps/client/public/assets/character-v2/manifest.json', root);
  const manifest = laterHair ? await json(new URL('manifest-before.json', hairStage)) : await json(manifestPath);
  if (laterHair) assert.ok(!process.argv.includes('--publish'), 'Never republish historical rotation over authorized hair stage');
  const manifestBefore = await json(new URL('manifest-before.json', stage));
  const review = await json(new URL('review.json', stage));
  const job = ledger.jobs.find(record => record.stage === 'body-rotation-01');
  assert.equal(ledger.jobs.filter(record => record.stage === 'body-rotation-01').length, 1);
  assert.deepEqual(ledger.jobs.filter(record => record.stage !== 'body-rotation-01'), before.jobs);
  assert.deepEqual(ledger.stageAuthorizations, [...before.stageAuthorizations, authorization]);
  for (const [key, value] of Object.entries(before)) if (!['jobs', 'stageAuthorizations', 'spent', 'reserved', 'pendingCredits', 'remainingUncommitted'].includes(key)) assert.deepEqual(ledger[key], value);
  assert.equal(job.jobId, submit.job_id);
  assert.equal(job.characterId, submit.character_id);
  assert.equal(job.chargedCredits ?? job.accountedCredits, 2);
  assert.equal(ledger.spent, before.spent + 2);
  assert.equal(ledger.reserved, 0);
  assert.equal(ledger.pendingCredits, 0);
  assert.equal(ledger.remainingUncommitted, 4);
  if (process.argv.includes('--publish')) {
    assert.deepEqual(manifest.poses, manifestBefore.poses);
    assert.deepEqual(manifest.assets, manifestBefore.assets);
    manifest.assets.find(asset => asset.direction === 'south').visualApproved = true;
    manifest.frontVisualApproval = authorization;
    manifest.rotationReview = review;
    for (const direction of directions.slice(1)) {
      const assessed = review.views[direction];
      if (!assessed.credibleCandidate) continue;
      const pose = structuredClone(manifestBefore.poses[0]);
      pose.id = `neutral-male-02-idle-${direction}`;
      pose.direction = direction;
      pose.frames[0].anchors = assessed.anchors;
      const asset = structuredClone(manifestBefore.assets[0]);
      asset.id = `neutral-male-02-body-${direction}`;
      asset.poseId = pose.id;
      asset.direction = direction;
      asset.url = `/assets/character-v2/body-rotation-01/${direction}.png`;
      asset.provenance = { kind: 'new-v2', sourcePath: measurement.views[direction].sourcePath, sha256: measurement.views[direction].sha256, method: 'pixellab', jobId: job.jobId };
      asset.visualApproved = false;
      await mkdir(runtime, { recursive: true });
      await copyFile(new URL(`raw/${direction}.png`, stage), new URL(`${direction}.png`, runtime));
      manifest.poses.push(pose);
      manifest.assets.push(asset);
    }
    parseCharacterV2Manifest(manifest);
    await save(manifestPath, manifest);
  }
  parseCharacterV2Manifest(manifest);
  for (const asset of manifest.assets) {
    assert.deepEqual(asset.canvas.origin, origin);
    assert.equal(asset.visualApproved, asset.direction === 'south');
    assert.equal(hash(await readFile(new URL(`apps/client/public${asset.url}`, root))), asset.provenance.sha256);
    assert.deepEqual(await readFile(new URL(`apps/client/public${asset.url}`, root)), await readFile(new URL(asset.provenance.sourcePath, root)));
  }
  assert.equal(manifest.approvals.userVisualAccepted, false);
  assert.equal(manifest.approvals.animationAccepted, false);
  assert.equal(manifest.assets.length, 4);
  assert.equal(manifest.poses.length, 4);
  assert.deepEqual([...manifest.assets.map(asset => asset.direction)].sort(), [...directions].sort());
  for (const direction of directions) {
    assert.deepEqual(review.views[direction].actualFoot, measurement.views[direction].actualFoot);
    assert.deepEqual(review.views[direction].actualFootDelta, measurement.views[direction].actualFootDelta);
  }
  assert.ok(manifest.assets.every(asset => asset.layer === 'body'));
  for (const [key, value] of Object.entries(manifestBefore)) if (!['poses', 'assets', 'budget'].includes(key)) assert.deepEqual(manifest[key], value);
  assert.deepEqual(manifest.poses.find(pose => pose.direction === 'south'), manifestBefore.poses[0]);
  assert.deepEqual(manifest.budget, { cap: 18, spent: 14, reserved: 0 });
  console.log('Rotation PASS: eight native raw images; exact approved FRONT02; shared origin61,112; partial body approval; spent14/cap18 remaining4 pending0; no hair/outfit/animation.');
}