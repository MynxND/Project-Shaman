import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { rasterize, inspect, load, stage, manifestPath, ledgerPath, runtimePath } from './character_v2_manual_hair.mjs';
import { decodePng, hash, BODY_SHA256 } from './prepare_character_v2_hair.mjs';
import { parseCharacterV2Manifest, v2ItemAssets, v2Sample } from '../../packages/shared/dist/character-v2.js';

const require = createRequire(new URL('../../apps/client/package.json', import.meta.url));
const sharp = createRequire(require.resolve('next'))('sharp');
const art = JSON.parse(await load(stage + 'front-rowmap.json'));
const bodyBytes = await load('docs/design/character-v2/body-front-02/raw.png');
const body = await decodePng(bodyBytes);

test('Authored rows are palette-only, transparent, forehead-only and protect all face features', () => {
  const original = Buffer.from(body);
  const hair = rasterize(art);
  const { metrics } = inspect(art, hair, body);
  assert.deepEqual(body, original);
  assert.equal(hash(bodyBytes), BODY_SHA256);
  assert.equal(Object.keys(metrics.colors).length, 7);
  const contaminated = Buffer.from(hair);
  contaminated.set([221, 166, 120, 255], (25 * 128 + 60) * 4);
  assert.throws(() => inspect(art, contaminated, body), /Non-hair/);
  const eyeOverlap = Buffer.from(hair);
  eyeOverlap.set([...art.palette.O, 255], (38 * 128 + 56) * 4);
  assert.throws(() => inspect(art, eyeOverlap, body), /Face feature/);
  const hidden = Buffer.from(hair);
  hidden[0] = 1;
  assert.throws(() => inspect(art, hidden, body), /hiddenRgb/);
  assert.throws(() => rasterize({ ...art, rows: [[12, 80, 'OO']] }));
});

test('Generated draft matches its own original rowmap and frozen evidence', async () => {
  assert.deepEqual(await decodePng(await load(stage + 'front.png')), rasterize(art));
  const review = JSON.parse(await load(stage + 'review.json'));
  assert.equal(review.sourceSha256, hash(await load(stage + 'front.png')));
  assert.equal(review.rowmapSha256, hash(await load(stage + 'front-rowmap.json')));
  assert.equal(review.creditsSpent, 0);
  assert.equal(review.hairVisualApproved, false);
  for (const [path, expected] of Object.entries(JSON.parse(await load(stage + 'frozen-hashes.json')))) assert.equal(hash(await load(path)), expected, path);
});

test('Diagnostic panels and 2x/6x enlargement replicate native pixels without interpolation', async () => {
  const hair = rasterize(art);
  const { composite } = inspect(art, hair, body);
  assert.deepEqual(await decodePng(await load(stage + 'composite-diagnostic.png')), composite);
  const comparison = Buffer.alloc(384 * 128 * 4);
  for (const [index, pixels] of [body, hair, composite].entries()) {
    for (let row = 0; row < 128; row++) pixels.copy(comparison, (row * 384 + index * 128) * 4, row * 128 * 4, (row + 1) * 128 * 4);
  }
  for (const scale of [1, 2, 6]) {
    const suffix = scale === 1 ? 'native' : `nearest${scale}x`;
    for (const [name, original, nativeWidth] of [['hair', hair, 128], ['comparison', comparison, 384]]) {
      const { data, info } = await sharp(await load(stage + `${name}-${suffix}.png`)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      assert.equal(info.width, nativeWidth * scale);
      assert.equal(info.height, 128 * scale);
      for (let row = 0; row < info.height; row++) {
        for (let column = 0; column < info.width; column++) {
          const offset = (row * info.width + column) * 4;
          const originalOffset = (Math.floor(row / scale) * nativeWidth + Math.floor(column / scale)) * 4;
          assert.ok(data.subarray(offset, offset + 4).equals(original.subarray(originalOffset, originalOffset + 4)), `${name} nearest${scale} pixel ${column},${row}`);
        }
      }
    }
  }
});

test('Saved actual browser evidence covers all four directions and SOUTH on/off at three viewports', async () => {
  const evidence = JSON.parse(await load(stage + 'browser-evidence.json'));
  assert.equal(evidence.results.length, 15);
  assert.deepEqual(evidence.pageErrors, []);
  for (const viewport of ['desktop', 'portrait', 'landscape']) {
    const cases = evidence.results.filter(record => record.viewport === viewport);
    assert.equal(cases.length, 5);
    assert.deepEqual(cases.map(record => [record.direction, record.hairOn]), [['south', true], ['south', false], ['east', false], ['north', false], ['west', false]]);
    for (const record of cases) {
      assert.deepEqual(record.actualViewport, { width: record.width, height: record.height });
      for (const key of ['mismatch', 'protectedFeatureMismatch']) assert.equal(record[key], 0);
      assert.equal(record.bodyDelta, record.hairOn ? 427 : 0);
      assert.equal(record.hairDisabled, record.direction !== 'south');
      assert.equal(record.hairSelection, record.direction === 'south' ? art.itemId : '');
      assert.equal(record.smoothing, false);
      assert.equal(record.imageRendering, 'pixelated');
      assert.equal(record.overflow, false);
      assert.equal(record.fullVisualAccepted, false);
      assert.equal(record.bodyApproved, true);
      assert.equal(record.canvasWidth, 256);
      assert.equal(record.canvasHeight, 256);
    }
  }
  assert.equal(evidence.realDeviceTest, false);
  assert.equal(evidence.responsiveScreenshotFidelityVerified, false);
});

test('Publication conserves prior unknown fields, receipts and four bodies; only SOUTH manual hair', async () => {
  const current = JSON.parse(await load(manifestPath));
  const nextStage = 'docs/design/character-v2/hair-long-manual-01/';
  const manifest = parseCharacterV2Manifest(current.longHairReview ? JSON.parse(await load(nextStage + 'manifest-before.json')) : current);
  if (!manifest.manualHairReview) return;
  const before = JSON.parse(await load(stage + 'manifest-before.json'));
  const ledger = JSON.parse(await load(current.longHairReview ? nextStage + 'ledger-before.json' : ledgerPath));
  const ledgerBefore = JSON.parse(await load(stage + 'ledger-before.json'));
  for (const [key, value] of Object.entries(before)) if (key !== 'assets') assert.deepEqual(manifest[key], value, key);
  for (const [key, value] of Object.entries(ledgerBefore)) if (key !== 'manualStages') assert.deepEqual(ledger[key], value, key);
  assert.deepEqual(ledger.manualStages.slice(0, -1), ledgerBefore.manualStages ?? []);
  assert.equal(ledger.manualStages.at(-1).creditsSpent, 0);
  assert.equal(ledger.spent, 20);
  assert.equal(ledger.cap, 20);
  assert.equal(ledger.remainingUncommitted, 0);
  assert.deepEqual(manifest.assets.filter(asset => asset.layer !== 'hair'), before.assets);
  assert.equal(manifest.approvals.userVisualAccepted, false);
  assert.equal(manifest.assets.filter(asset => asset.layer === 'hair').length, 1);
  const hair = manifest.assets.find(asset => asset.layer === 'hair');
  assert.equal(hair.visualApproved, false);
  assert.equal(hair.provenance.method, 'manual');
  assert.equal(hair.provenance.jobId, null);
  assert.deepEqual(await load(runtimePath), await load(stage + 'front.png'));
  for (const pose of manifest.poses) {
    assert.deepEqual(pose.canvas, art.canvas);
    assert.deepEqual(pose.frames.map(frame => frame.durationMs), [null]);
    assert.equal(v2Sample(pose, 99999), 0);
    const assets = v2ItemAssets(manifest, pose, 'hair', art.itemId);
    assert.equal(assets.length, pose.direction === 'south' ? 1 : 0);
    if (pose.direction === 'south') assert.ok(pose.frames[0].order.indexOf('body') < pose.frames[0].order.indexOf('hair'));
    assert.deepEqual(v2ItemAssets(manifest, pose, 'hair', 'ivory-crop-01'), []);
  }
});