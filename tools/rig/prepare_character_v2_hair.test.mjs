import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile, access } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { readInputs, makeMasks, evaluateLayer, decodePng, assertUntouched, hash, HAIR_RAMP, INITIAL_LEDGER_SHA256, loadPreparationEvidence } from './prepare_character_v2_hair.mjs';

const root = new URL('../../', import.meta.url);
const stage = new URL('docs/design/character-v2/hair-proof-01/', root);
const require = createRequire(new URL('apps/client/package.json', root));
const sharp = createRequire(require.resolve('next'))('sharp');
const inputs = await readInputs();
const masks = makeMasks(inputs.body);
const bodyBefore = hash(inputs.body);
const makeProbe = pixel => {
  const layer = Buffer.alloc(inputs.body.length);
  layer.set([...HAIR_RAMP[2], 255], pixel * 4);
  return layer;
};

test('native masks follow source-alpha anatomy, with disjoint hair/protection', () => {
  for (const name of ['hair', 'face', 'ears', 'neck', 'protectedAnatomy', 'protectedAll']) {
    assert.equal(masks[name].length, 16384);
    assert.ok(masks[name].some(value => value === 255));
  }
  for (let pixel = 0; pixel < masks.hair.length; pixel++) {
    assert.equal(masks.hair[pixel] * masks.protectedAnatomy[pixel], 0);
    assert.equal(masks.hair[pixel] + masks.protectedAll[pixel], 255);
    if (masks.protectedAnatomy[pixel]) assert.equal(inputs.body[pixel * 4 + 3], 255);
  }
  assert.equal(masks.hair[20 * 128 + 62], 255);
  assert.equal(masks.face[35 * 128 + 57], 255);
  assert.equal(masks.ears[38 * 128 + 48], 255);
  assert.equal(masks.neck[50 * 128 + 62], 255);
  assert.equal(masks.face[32 * 128 + 47], 0, 'Not a rectangular face cover');
});

test('independent layer control probes are memory-only, recomposite without touching body', () => {
  const layer = makeProbe(24 * 128 + 62);
  const result = evaluateLayer(layer, inputs.body, masks);
  assert.equal(result.visible, 1);
  assert.equal(result.protectedMismatch, 0);
  assert.equal(result.visualApproved, false);
  assert.equal(result.productionReady, false);
  assert.equal(hash(inputs.body), bodyBefore);
  for (let pixel = 0; pixel < masks.hair.length; pixel++) {
    const offset = pixel * 4;
    if (!layer[offset + 3]) assert.ok(result.composite.subarray(offset, offset + 4).equals(inputs.body.subarray(offset, offset + 4)));
  }
});

test('reject face, ear, neck, out-of-mask, empty, full-body and cached-skin layers', () => {
  for (const pixel of [35 * 128 + 57, 38 * 128 + 48, 50 * 128 + 62]) assert.throws(() => evaluateLayer(makeProbe(pixel), inputs.body, masks), /overlap/);
  assert.throws(() => evaluateLayer(makeProbe(16 * 128 + 20), inputs.body, masks), /Out-of-mask/);
  assert.throws(() => evaluateLayer(Buffer.alloc(inputs.body.length), inputs.body, masks), /Empty/);
  assert.throws(() => evaluateLayer(inputs.body, inputs.body, masks), /skin\/body|overlap|Out-of-mask|cache/);
  const scalpCopy = Buffer.alloc(inputs.body.length);
  const offset = (24 * 128 + 62) * 4;
  inputs.body.copy(scalpCopy, offset, offset, offset + 4);
  assert.throws(() => evaluateLayer(scalpCopy, inputs.body, masks), /skin\/body/);
  const hiddenBody = makeProbe(24 * 128 + 62);
  hiddenBody.set([190, 140, 100, 0], (70 * 128 + 62) * 4);
  assert.throws(() => evaluateLayer(hiddenBody, inputs.body, masks), /cache body RGB/);
  const translucent = makeProbe(24 * 128 + 62);
  translucent[(24 * 128 + 62) * 4 + 3] = 128;
  assert.throws(() => evaluateLayer(translucent, inputs.body, masks), /binary hair alpha/);
  assert.throws(() => evaluateLayer(Buffer.alloc(64 * 64 * 4), inputs.body, masks), /full native/);
});

test('candidate PNG dimensions and actual alpha are checked independently', async () => {
  const wrongSize = await sharp({ create: { width: 64, height: 64, channels: 4, background: { r: 217, g: 220, b: 205, alpha: 1 } } }).png().toBuffer();
  await assert.rejects(decodePng(wrongSize), /Native width/);
  const opaqueRgb = await sharp({ create: { width: 128, height: 128, channels: 3, background: '#d9dccd' } }).png().toBuffer();
  await assert.rejects(decodePng(opaqueRgb), /RGBA transparency/);
  const probe = makeProbe(24 * 128 + 62);
  const bytes = await sharp(probe, { raw: { width: 128, height: 128, channels: 4 } }).png().toBuffer();
  assert.equal(evaluateLayer(await decodePng(bytes), inputs.body, masks).visible, 1);
});

test('preparation artifacts when present retain blocked budget, exact masks and initial ledger hash', async () => {
  let exists = false;
  try { await access(stage); exists = true; } catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (!exists) return;
  const request = JSON.parse(await readFile(new URL('request.json', stage), 'utf8'));
  const evidence = JSON.parse(await readFile(new URL('preparation.json', stage), 'utf8'));
  assert.equal(request.submittable, false);
  assert.equal(request.realCandidate, null);
  assert.equal(request.providerArguments.output_method, 'New layer with changes');
  assert.equal(request.providerArguments.mask_image_url, null);
  assert.equal(request.providerArguments.seed, 0);
  assert.deepEqual(request.providerArguments.bounding_box, { x: 0, y: 0, width: 128, height: 128 });
  assert.equal(evidence.initialLedgerSha256, INITIAL_LEDGER_SHA256);
  for (const budget of [evidence.budget, request.budget]) {
    assert.equal(budget.cap, 18);
    assert.equal(budget.spent, 14);
    assert.equal(budget.reserved, 0);
    assert.equal(budget.pendingCredits, 0);
    assert.equal(budget.remaining, 4);
    assert.equal(budget.proposedCredits, 6);
    assert.equal(budget.estimateProvisional, true);
    assert.equal(budget.liveQuoteObtained, false);
    assert.equal(budget.deficit, 2);
    assert.equal(budget.submittable, false);
    assert.equal(budget.hairStageAuthorized, false);
    assert.equal(budget.fourViewApproved, false);
    assert.equal(budget.submittedJobs, 0);
  }
  const maskNames = { hair: 'hair-allowed-mask', face: 'protected-face-mask', ears: 'protected-ear-mask', neck: 'protected-neck-mask', protectedAnatomy: 'protected-anatomy-mask', protectedAll: 'protected-all-mask' };
  for (const [name, filename] of Object.entries(maskNames)) {
    const bytes = await readFile(new URL(filename + '.png', stage));
    const metadata = await sharp(bytes).metadata();
    assert.equal(metadata.width, 128);
    assert.equal(metadata.height, 128);
    const rgb = await sharp(bytes).removeAlpha().toColourspace('srgb').raw().toBuffer();
    for (let pixel = 0; pixel < 16384; pixel++) {
      for (let channel = 0; channel < 3; channel++) assert.equal(rgb[pixel * 3 + channel], masks[name][pixel]);
    }
    assert.equal(evidence.counts[name], masks[name].filter(value => value === 255).length);
  }
  const native = await decodePng(await readFile(new URL('body-mask-diagnostic-native.png', stage)));
  const diagnosticColors = { hair: [25, 194, 215, 255], face: [237, 91, 137, 255], ears: [242, 194, 72, 255], neck: [95, 178, 111, 255] };
  for (let pixel = 0; pixel < 16384; pixel++) {
    const offset = pixel * 4;
    const selected = Object.keys(diagnosticColors).find(name => masks[name][pixel]);
    const expected = selected ? Buffer.from(diagnosticColors[selected]) : inputs.body.subarray(offset, offset + 4);
    assert.ok(native.subarray(offset, offset + 4).equals(expected), 'Diagnostic must contain only exact owned body plus labeled mask colors');
  }
  const enlarged = await sharp(await readFile(new URL('body-mask-diagnostic-2x.png', stage))).ensureAlpha().raw().toBuffer();
  for (let row = 0; row < 256; row++) {
    for (let column = 0; column < 256; column++) {
      const nativeOffset = (Math.floor(row / 2) * 128 + Math.floor(column / 2)) * 4;
      const largeOffset = (row * 256 + column) * 4;
      assert.ok(enlarged.subarray(largeOffset, largeOffset + 4).equals(native.subarray(nativeOffset, nativeOffset + 4)));
    }
  }
  assert.equal((await readFile(new URL('ledger-initial-sha256.txt', stage), 'utf8')).trim(), INITIAL_LEDGER_SHA256);
  for (const [path, initial] of Object.entries(evidence.untouchedHashes)) assert.equal(hash(await loadPreparationEvidence(path)), initial);
  assert.throws(
    () => execFileSync(process.execPath, [fileURLToPath(new URL('./prepare_character_v2_hair.mjs', import.meta.url)), '--prepare'], { stdio: 'pipe' }),
    error => error.status === 1 && /Preparation already exists; refuse to overwrite user evidence/.test(error.stderr.toString()),
  );
  await assertUntouched(inputs);
});

test('source/runtime body and historical preparation manifest/ledger remain byte-exact', async () => {
  assert.equal(hash(inputs.body), bodyBefore);
  await assertUntouched(inputs);
});