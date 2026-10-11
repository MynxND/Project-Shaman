import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { stage, load, json, rasterize, inspect, compose, manifestPath, ledgerPath } from './character_v2_long_hair.mjs';
import { decodePng, hash, BODY_SHA256 } from './prepare_character_v2_hair.mjs';
import { parseCharacterV2Manifest, v2ItemAssets, v2Sample } from '../../packages/shared/dist/character-v2.js';

const require = createRequire(new URL('../../apps/client/package.json', import.meta.url));
const sharp = createRequire(require.resolve('next'))('sharp');
const art = await json(stage + 'art.json');
const bodyBytes = await load('docs/design/character-v2/body-front-02/raw.png');
const body = await decodePng(bodyBytes);
const back = rasterize(art, 'hairBack');
const front = rasterize(art, 'hairFront');
const { composite, metrics } = inspect(art, back, front, body);
const current = await json(manifestPath);
const live = current.hairRedesignReview ? await json('docs/design/character-v2/hair-long-redesign-02/manifest-before.json') : current;

test('Original loose waist-length clusters use seven hair-only colors and preserve eyes, ears, jaw and neck', () => {
  assert.equal(hash(bodyBytes), BODY_SHA256);
  assert.equal(metrics.protectedFeatureMismatch, 0);
  assert.equal(metrics.scalpHoles, 0);
  assert.equal(metrics.foreheadOcclusion, 29);
  assert.deepEqual(metrics.passes.hairBack.bounds, { left: 42, top: 18, right: 82, bottom: 78 });
  assert.deepEqual(metrics.passes.hairFront.bounds, { left: 43, top: 13, right: 81, bottom: 66 });
  for (const pass of Object.values(metrics.passes)) {
    assert.equal(Object.keys(pass.colors).length, 7);
    for (const key of ['hiddenRgb', 'partialAlpha', 'redPixels', 'skinLikePixels', 'sourceCopies']) assert.equal(pass[key], 0);
  }
  assert.equal(metrics.rearBodyOverlap, 1508);
  assert.equal(metrics.rearVisibleBelowNeck, 116);
  assert.equal(metrics.frontVisibleBelowNeck, 88);
  assert.ok(!compose(body, back, front).equals(composite), 'Wrong rear depth must be observable');
  assert.ok(!compose(front, body, back).equals(composite), 'Wrong front depth must be observable');
});

test('Reject skin, crimson, hidden RGB, missing long fall, empty subpass and protected-feature contamination', () => {
  for (const [color, reason] of [[[210,60,50,255], /Non-hair/], [[224,170,124,255], /Non-hair/], [[...art.palette.O,128], /partialAlpha/]]) {
    const bad = Buffer.from(front);
    bad.set(color, (25 * 128 + 60) * 4);
    assert.throws(() => inspect(art, back, bad, body), reason);
  }
  for (const [column, row, reason] of [[56,38,/Face feature/], [49,38,/Ear\/neck/], [61,50,/Ear\/neck/]]) {
    const bad = Buffer.from(front);
    bad.set([...art.palette.O,255], (row * 128 + column) * 4);
    assert.throws(() => inspect(art, back, bad, body), reason);
  }
  const bad = Buffer.from(back);
  bad[0] = 1;
  assert.throws(() => inspect(art, bad, front, body), /hiddenRgb/);
  const crop = Buffer.from(back);
  crop.fill(0, 53 * 128 * 4);
  assert.throws(() => inspect(art, crop, front, body), /Waist-length/);
  assert.throws(() => inspect(art, Buffer.alloc(back.length), front, body), /Empty/);
});

test('Transparent PNGs reproduce original polygons and recorded hashes; composites are diagnostics only', async () => {
  const review = await json(stage + 'review.json');
  assert.equal(review.artSha256, hash(await load(stage + 'art.json')));
  assert.deepEqual(review.metrics, metrics);
  for (const [name, pixels] of [['hair-back', back], ['hair-front', front]]) {
    assert.ok((await decodePng(await load(stage + name + '.png'))).equals(pixels));
    assert.equal(review.sources[name], hash(await load(stage + name + '.png')));
  }
  assert.ok((await decodePng(await load(stage + 'composite-diagnostic.png'))).equals(composite));
  for (const key of ['hairVisualApproved', 'userVisualAccepted', 'productionReady', 'earOcclusion']) assert.equal(review[key], false);
  assert.equal(review.creditsSpent, 0);
  assert.equal(review.jobId, null);
});

test('Native, 2x and 6x panels are exact nearest pixel replication', async () => {
  const panels = [body, back, front, composite];
  for (const scale of [1,2,6]) {
    const suffix = scale === 1 ? 'native' : `nearest${scale}x`;
    const { data, info } = await sharp(await load(stage + `comparison-${suffix}.png`)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    assert.equal(info.width, 512 * scale);
    assert.equal(info.height, 128 * scale);
    for (let row = 0; row < info.height; row++) for (let column = 0; column < info.width; column++) {
      const nativeColumn = Math.floor(column / scale);
      const offset = (Math.floor(row / scale) * 128 + nativeColumn % 128) * 4;
      assert.ok(data.subarray((row * info.width + column) * 4, (row * info.width + column) * 4 + 4).equals(panels[Math.floor(nativeColumn / 128)].subarray(offset, offset + 4)));
    }
  }
});

test('Bodies, crop archive and all rejected provider evidence remain byte-exact', async () => {
  for (const [path, expected] of Object.entries(await json(stage + 'frozen-hashes.json'))) assert.equal(hash(await load(path)), expected, path);
});

test('Saved actual browser results verify both-pass toggle, sorted pixels and absent views at three viewports', async () => {
  const evidence = await json(stage + 'browser-evidence.json');
  assert.equal(evidence.results.length, 15);
  assert.deepEqual(evidence.pageErrors, []);
  assert.equal(evidence.pointerVerified, false);
  assert.equal(evidence.realDeviceTest, false);
  assert.equal(evidence.responsiveScreenshotFidelityVerified, false);
  assert.equal(evidence.screenshotsActuallyInspected, true);
  for (const [viewport, width, height] of [['desktop',1280,900],['portrait',390,844],['landscape',844,390]]) {
    const cases = evidence.results.filter(record => record.viewport === viewport);
    assert.deepEqual(cases.map(record => [record.direction, record.hairOn]), [['south',true],['south',false],['east',false],['north',false],['west',false]]);
    for (const record of cases) {
      assert.deepEqual(record.actualViewport, { width, height });
      for (const key of ['mismatch','hashMismatch','protectedFeatureMismatch']) assert.equal(record[key], 0);
      assert.equal(record.bodyDelta, record.hairOn ? 953 : 0);
      assert.equal(record.hairDisabled, record.direction !== 'south');
      assert.equal(record.hairSelection, record.direction === 'south' ? art.itemId : '');
      assert.equal(record.smoothing, false);
      assert.equal(record.imageRendering, 'pixelated');
      assert.equal(record.canvasWidth, 256);
      assert.equal(record.canvasHeight, 256);
      assert.equal(record.overflow, false);
      assert.equal(record.fullVisualAccepted, false);
    }
    for (const state of ['on','off']) {
      const metadata = await sharp(await load(stage + `browser-${viewport}-hair-${state}.png`)).metadata();
      assert.equal(metadata.format, 'png');
      assert.ok(metadata.width > 200 && metadata.height > 200);
    }
  }
});

test('Published pair fails closed on missing subpasses/directions and retains static pose and original bodies', { skip: !live.longHairReview }, async () => {
  const manifest = parseCharacterV2Manifest(live);
  const before = await json(stage + 'manifest-before.json');
  const ledger = await json(ledgerPath);
  const ledgerBefore = await json(stage + 'ledger-before.json');
  for (const [key, value] of Object.entries(before)) if (!['assets','poses'].includes(key)) assert.deepEqual(manifest[key], value, key);
  for (const [key, value] of Object.entries(ledgerBefore)) if (key !== 'manualStages') assert.deepEqual(ledger[key], value, key);
  assert.deepEqual(ledger.manualStages.slice(0,-1), ledgerBefore.manualStages);
  assert.equal(ledger.manualStages.at(-1).creditsSpent, 0);
  assert.equal(ledger.cap, 20);
  assert.equal(ledger.spent, 20);
  assert.equal(ledger.remainingUncommitted, 0);
  assert.deepEqual(manifest.assets.filter(asset => asset.layer !== 'hair'), before.assets.filter(asset => asset.layer !== 'hair'));
  assert.equal(manifest.assets.length, 6);
  assert.equal(manifest.approvals.userVisualAccepted, false);
  const archive = manifest.archivedHairDrafts.at(-1);
  assert.equal(archive.selectable, false);
  assert.deepEqual(archive.assets, before.assets.filter(asset => asset.layer === 'hair'));
  assert.deepEqual(archive.pose, before.poses.find(pose => pose.direction === 'south'));
  for (const pose of manifest.poses) {
    const previous = before.poses.find(candidate => candidate.id === pose.id);
    const expected = structuredClone(previous);
    if (pose.direction === 'south') expected.frames[0].order = ['hairBack','body','outfit','hairFront','headgear','mainHand','offHand','accessories','effects'];
    assert.deepEqual(pose, expected);
    assert.equal(v2Sample(pose, 999999), 0);
    const pair = v2ItemAssets(manifest, pose, 'hair', art.itemId);
    assert.equal(pair.length, pose.direction === 'south' ? 2 : 0);
    assert.deepEqual(v2ItemAssets(manifest, pose, 'hair', 'ivory-crop01-manual'), []);
    assert.deepEqual(v2ItemAssets(manifest, pose, 'outfit', 'woven-apprentice-01'), []);
    if (pair.length) {
      for (const asset of pair) {
        assert.equal(asset.provenance.method, 'manual');
        assert.equal(asset.provenance.jobId, null);
        assert.equal(asset.visualApproved, false);
        assert.deepEqual(await load('apps/client/public' + asset.url), await load(asset.provenance.sourcePath));
        const missing = structuredClone(manifest);
        missing.assets = missing.assets.filter(candidate => candidate.id !== asset.id);
        assert.deepEqual(v2ItemAssets(missing, pose, 'hair', art.itemId), []);
      }
    }
  }
  assert.ok(!manifest.assets.some(asset => asset.url.includes('diagnostic')));
});