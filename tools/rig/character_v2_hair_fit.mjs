import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, readdir, copyFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { decodePng, hash, makeMasks, BODY_SHA256 } from './prepare_character_v2_hair.mjs';
import { rasterize, compose } from './character_v2_long_hair.mjs';

const root = new URL('../../', import.meta.url);
const require = createRequire(new URL('apps/client/package.json', root));
const sharp = createRequire(require.resolve('next'))('sharp');
export const stage = 'docs/design/character-v2/hair-fit-front-01/';
export const runtime = 'apps/client/public/assets/character-v2/hair-fit-front-01/';
export const manifestPath = 'apps/client/public/assets/character-v2/manifest.json';
export const ledgerPath = 'docs/design/character-v2/cost-ledger.json';
export const bodyPath = 'docs/design/character-v2/body-front-02/raw.png';
export const load = path => readFile(new URL(path, root));
export const json = async path => JSON.parse(await load(path));
const save = (path, value) => writeFile(new URL(path, root), JSON.stringify(value, null, 2) + '\n');
export const png = (pixels, width = 128, height = 128) => sharp(pixels, { raw: { width, height, channels: 4 } }).png().toBuffer();

export function nearest(pixels, width, height, scale) {
  const output = Buffer.alloc(width * height * scale * scale * 4);
  for (let row = 0; row < height * scale; row++) for (let column = 0; column < width * scale; column++) {
    const offset = (Math.floor(row / scale) * width + Math.floor(column / scale)) * 4;
    pixels.copy(output, (row * width * scale + column) * 4, offset, offset + 4);
  }
  return output;
}

export function bounds(pixels) {
  const result = { left: 128, top: 128, right: -1, bottom: -1, visible: 0 };
  for (let pixel = 0; pixel < 16384; pixel++) if (pixels[pixel * 4 + 3]) {
    result.left = Math.min(result.left, pixel % 128);
    result.right = Math.max(result.right, pixel % 128);
    result.top = Math.min(result.top, Math.floor(pixel / 128));
    result.bottom = Math.max(result.bottom, Math.floor(pixel / 128));
    result.visible++;
  }
  return result;
}

async function files(directory) {
  const output = [];
  for (const entry of await readdir(new URL(directory, root), { withFileTypes: true })) {
    const path = directory + entry.name;
    if (entry.isDirectory()) output.push(...await files(path + '/'));
    else output.push(path);
  }
  return output;
}

export async function assertFrozen() {
  for (const [path, expected] of Object.entries(await json(stage + 'frozen-hashes.json'))) assert.equal(hash(await load(path)), expected, path);
}

export async function measure() {
  const bytes = await load(bodyPath);
  assert.equal(hash(bytes), BODY_SHA256);
  assert.equal(hash(await load('apps/client/public/assets/character-v2/body-front-02/raw.png')), BODY_SHA256);
  const body = await decodePng(bytes);
  const ledger = await json(ledgerPath);
  assert.equal(ledger.cap, 20);
  assert.equal(ledger.spent, 20);
  assert.equal(ledger.remainingUncommitted, 0);
  const manifest = await json(manifestPath);
  const south = manifest.assets.find(asset => asset.layer === 'body' && asset.direction === 'south');
  assert.equal(south.itemId, 'neutral-male-02');
  assert.deepEqual(south.canvas, { width: 128, height: 128, origin: { x: 61, y: 112 } });
  assert.equal(south.visualApproved, true);
  await mkdir(new URL(stage, root), { recursive: true });
  try { await load(stage + 'manifest-before.json'); } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    await writeFile(new URL(stage + 'manifest-before.json', root), await load(manifestPath), { flag: 'wx' });
    const paths = new Set([ledgerPath, ...manifest.assets.flatMap(asset => [asset.provenance.sourcePath, 'apps/client/public' + asset.url])]);
    for (const directory of ['docs/design/character-v3/', 'apps/client/public/assets/character-v3/', 'docs/design/character-v2/hair-manual-01/', 'docs/design/character-v2/hair-long-manual-01/', 'docs/design/character-v2/hair-long-redesign-02/']) for (const path of await files(directory)) paths.add(path);
    for (const directory of ['apps/client/src/', 'tools/rig/']) for (const path of await files(directory)) if (/v3/i.test(path)) paths.add(path);
    for (const archive of manifest.archivedHairDrafts ?? []) for (const asset of archive.assets) {
      paths.add(asset.provenance.sourcePath);
      paths.add('apps/client/public' + asset.url);
    }
    await save(stage + 'frozen-hashes.json', Object.fromEntries(await Promise.all([...paths].map(async path => [path, hash(await load(path))]))));
  }
  const rows = [];
  for (let row = 14; row <= 52; row++) {
    const columns = [];
    const darkPixels = [];
    for (let column = 46; column <= 78; column++) {
      const offset = (row * 128 + column) * 4;
      if (!body[offset + 3]) continue;
      columns.push(column);
      if (Math.max(...body.subarray(offset, offset + 3)) < 130) darkPixels.push(column);
    }
    rows.push({ y: row, left: columns[0] ?? null, right: columns.at(-1) ?? null, opaque: columns.length, darkPixels });
  }
  const masks = makeMasks(body);
  const scalp = Buffer.alloc(body.length);
  const protectedPixels = Buffer.alloc(body.length);
  const guide = Buffer.from(body);
  for (let pixel = 0; pixel < 16384; pixel++) {
    const offset = pixel * 4;
    const row = Math.floor(pixel / 128);
    if (row <= 31 && row >= 20 && body[offset + 3]) {
      scalp.set([255, 255, 255, 255], offset);
      guide.set([63, 193, 179, 255], offset);
    }
    if ((masks.face[pixel] && row >= 35) || masks.ears[pixel] || masks.neck[pixel]) {
      protectedPixels.set([255, 255, 255, 255], offset);
      guide.set([229, 178, 75, 255], offset);
    }
  }
  const template = { sourcePath: bodyPath, bodySha256: BODY_SHA256, canvas: south.canvas, poseId: south.poseId, bodyBounds: bounds(body), rows, scalpBounds: bounds(scalp), protectedBounds: bounds(protectedPixels), foreheadPermitted: { left: 52, right: 72, top: 32, bottom: 34 }, semanticLandmarksProvisional: true, hiddenAnatomyRecovered: false, interpretation: 'Measured visible opacity and conservatively protected source face/ears/neck; NOT an anatomical skeleton or hidden head reconstruction.' };
  for (const [name, pixels] of [['base', body], ['scalp-mask', scalp], ['protected-mask', protectedPixels], ['template-overlay', guide]]) {
    await writeFile(new URL(stage + name + '.png', root), await png(pixels));
    await writeFile(new URL(stage + name + '-4x.png', root), await png(nearest(pixels, 128, 128, 4), 512, 512));
  }
  await save(stage + 'head-template.json', template);
  await assertFrozen();
  console.log(JSON.stringify(template, null, 2));
}

export function inspectHair(art, back, front, body, template) {
  const masks = makeMasks(body);
  const output = compose(back, body, front);
  const palette = Object.values(art.palette).map(color => color.join(','));
  const metrics = { passes: {}, scalpHoles: 0, protectedFeatureMismatch: 0, foreheadOcclusion: 0, visibleRear: 0, visibleRearBelowJaw: 0 };
  for (const [pass, pixels] of [['hairBack', back], ['hairFront', front]]) {
    const counts = { ...bounds(pixels), hiddenRgb: 0, partialAlpha: 0, nonPalette: 0, skinPixels: 0, redPixels: 0, sourceCopies: 0 };
    assert.ok(counts.visible > 0, 'Each subpass must contain real hair');
    for (let pixel = 0; pixel < 16384; pixel++) {
      const offset = pixel * 4;
      const row = Math.floor(pixel / 128);
      const column = pixel % 128;
      const [red, green, blue, alpha] = pixels.subarray(offset, offset + 4);
      if (!alpha) { if (red || green || blue) counts.hiddenRgb++; continue; }
      if (alpha !== 255) counts.partialAlpha++;
      if (!palette.includes(`${red},${green},${blue}`)) counts.nonPalette++;
      if (red > green + 15 && green > blue + 10) counts.skinPixels++;
      if (red > green + 15 && red > blue + 15) counts.redPixels++;
      if (pixels.subarray(offset, offset + 4).equals(body.subarray(offset, offset + 4))) counts.sourceCopies++;
      if (pass === 'hairFront') {
        const permitted = row >= 32 && row <= 34 && column >= 52 && column <= 72;
        assert.equal(masks.ears[pixel] + masks.neck[pixel], 0, 'Ear/neck overlap');
        assert.ok(!masks.face[pixel] || permitted, 'Protected face overlap');
        if (masks.face[pixel]) metrics.foreheadOcclusion++;
      } else if (!body[offset + 3] && !front[offset + 3]) {
        metrics.visibleRear++;
        if (row >= 44) metrics.visibleRearBelowJaw++;
      }
    }
    for (const key of ['hiddenRgb', 'partialAlpha', 'nonPalette', 'skinPixels', 'redPixels', 'sourceCopies']) assert.equal(counts[key], 0, `${pass}: ${key}`);
    assert.ok(counts.left >= 46 && counts.right <= 79, 'Over-wide hair');
    assert.ok(counts.bottom <= 57, 'Hair must not become a chest/waist cape');
    metrics.passes[pass] = counts;
  }
  for (let pixel = 0; pixel < 16384; pixel++) {
    const offset = pixel * 4;
    const row = Math.floor(pixel / 128);
    if ((masks.face[pixel] && row >= 35) || masks.ears[pixel] || masks.neck[pixel]) {
      if (!body.subarray(offset, offset + 4).equals(output.subarray(offset, offset + 4))) metrics.protectedFeatureMismatch++;
    }
    if (row >= 20 && row <= 31 && body[offset + 3] && !front[offset + 3]) metrics.scalpHoles++;
  }
  assert.equal(metrics.protectedFeatureMismatch, 0);
  assert.equal(metrics.scalpHoles, 0);
  assert.ok(metrics.visibleRearBelowJaw > 0, 'Rear hair must have genuine visible nape/side pixels');
  const minTop = art.itemId.startsWith('ritual-') ? 12 : 17;
  assert.ok(metrics.passes.hairFront.top >= minTop);
  assert.equal(template.bodySha256, BODY_SHA256);
  return { composite: output, hairOnly: compose(back, front), metrics };
}

export async function draft() {
  await assertFrozen();
  const collection = await json(stage + 'art.json');
  const template = await json(stage + 'head-template.json');
  const body = await decodePng(await load(bodyPath));
  const records = [];
  const columns = [body];
  for (const style of collection.styles) {
    const art = { ...style, palette: collection.palette, canvas: collection.canvas };
    const back = rasterize(art, 'hairBack');
    const front = rasterize(art, 'hairFront');
    const { composite, hairOnly, metrics } = inspectHair(art, back, front, body, template);
    const directory = stage + style.itemId + '/';
    await mkdir(new URL(directory, root), { recursive: true });
    const sources = {};
    for (const [name, pixels] of [['hair-back', back], ['hair-front', front], ['hair-only', hairOnly], ['composite', composite]]) {
      const bytes = await png(pixels);
      await writeFile(new URL(directory + name + '.png', root), bytes);
      await writeFile(new URL(directory + name + '-4x.png', root), await png(nearest(pixels,128,128,4),512,512));
      sources[name] = hash(bytes);
    }
    records.push({ itemId: style.itemId, labelThai: style.labelThai, design: style.design, sources, metrics, hairVisualApproved: false, userVisualAccepted: false });
    columns.push(composite);
  }
  const sheet = Buffer.alloc(512 * 384 * 4);
  const scalp = await decodePng(await load(stage + 'scalp-mask.png'));
  for (const [column, pixels] of columns.entries()) for (let row = 0; row < 128; row++) pixels.copy(sheet, (row * 512 + column * 128) * 4, row * 512, (row + 1) * 512);
  for (const [index, record] of records.entries()) {
    const hair = await decodePng(await load(stage + record.itemId + '/hair-only.png'));
    for (let row = 0; row < 128; row++) hair.copy(sheet, ((row + 128) * 512 + (index + 1) * 128) * 4, row * 512, (row + 1) * 512);
  }
  for (const [column, pixels] of columns.entries()) for (let row = 12; row < 60; row++) for (let col = 40; col < 84; col++) {
    const offset = (row * 128 + col) * 4;
    const target = ((row - 12 + 264) * 512 + column * 128 + col - 40 + 42) * 4;
    pixels.copy(sheet, target, offset, offset + 4);
    if (scalp[offset + 3] && (!scalp[offset - 4 + 3] || !scalp[offset + 4 + 3] || !scalp[offset - 512 + 3] || !scalp[offset + 512 + 3])) sheet.set([63,193,179,255],target);
  }
  for (const scale of [1,4]) await writeFile(new URL(stage + `fit-comparison-${scale === 1 ? 'native' : '4x'}.png`, root), await png(nearest(sheet,512,384,scale),512*scale,384*scale));
  const review = { method: 'manual', source: 'Original integer pixel clusters authored on measured V2 template; palette-only transparent extraction from those authored masks. No existing hair pixels or V3 input.', jobId: null, creditsSpent: 0, paidCalls: 0, budget: { cap: 20, spent: 20, remaining: 0, paidBlocked: true, newNumericalBudgetApproved: false, maxPaidAttemptsPerStyle: 1 }, bodySha256: BODY_SHA256, artSha256: hash(await load(stage + 'art.json')), templatePath: stage + 'head-template.json', records, userVisualAccepted: false, productionReady: false, visualInspectionCompleted: false, stop: 'Exactly three FRONT proposals for USER review. No other direction, collection, outfit, animation or live changes.' };
  await save(stage + 'fit-review.json', review);
  await assertFrozen();
  console.log(JSON.stringify(records.map(record => ({ itemId: record.itemId, metrics: record.metrics })), null, 2));
}

export async function publish() {
  await assertFrozen();
  const before = await json(stage + 'manifest-before.json');
  const manifest = await json(manifestPath);
  assert.deepEqual(manifest, before, 'Publish from the inspected snapshot only');
  const review = await json(stage + 'fit-review.json');
  assert.equal(review.artSha256, hash(await load(stage + 'art.json')));
  assert.equal(review.records.length, 3);
  const collection = await json(stage + 'art.json');
  const body = manifest.assets.find(asset => asset.layer === 'body' && asset.direction === 'south');
  const bodyPixels = await decodePng(await load(bodyPath));
  const template = await json(stage + 'head-template.json');
  manifest.archivedHairDrafts = [...(manifest.archivedHairDrafts ?? []), {
    stage: 'hair-long-redesign-02', selectable: false, visualApproved: false,
    reason: 'USER rejects ALL current hair; retain this binding and PNGs unchanged, not selectable.',
    pose: structuredClone(manifest.poses.find(pose => pose.id === body.poseId)),
    assets: manifest.assets.filter(asset => asset.layer === 'hair'), review: manifest.hairRedesignReview,
  }];
  manifest.assets = manifest.assets.filter(asset => asset.layer !== 'hair');
  for (const record of review.records) {
    const style = collection.styles.find(candidate => candidate.itemId === record.itemId);
    const art = { ...style, palette: collection.palette, canvas: collection.canvas };
    const back = rasterize(art, 'hairBack');
    const front = rasterize(art, 'hairFront');
    inspectHair(art, back, front, bodyPixels, template);
    const directory = runtime + record.itemId + '/';
    await mkdir(new URL(directory, root), { recursive: true });
    for (const [pass, name, pixels] of [['hairBack', 'hair-back', back], ['hairFront', 'hair-front', front]]) {
      const sourcePath = stage + record.itemId + '/' + name + '.png';
      const bytes = await load(sourcePath);
      assert.equal(hash(bytes), record.sources[name]);
      assert.ok((await decodePng(bytes)).equals(pixels));
      const url = '/assets/character-v2/hair-fit-front-01/' + record.itemId + '/' + name + '.png';
      await copyFile(new URL(sourcePath, root), new URL('apps/client/public' + url, root));
      manifest.assets.push({ id: `${record.itemId}-idle-south-${pass}`, itemId: record.itemId, layer: 'hair', pass, poseId: body.poseId, direction: 'south', state: 'idle', canvas: body.canvas, timeline: [null], frameCount: 1, url, provenance: { kind: 'new-v2', sourcePath, sha256: record.sources[name], method: 'manual', jobId: null }, visualApproved: false });
    }
  }
  await mkdir(new URL(runtime, root), { recursive: true });
  for (const name of ['head-template.json', 'scalp-mask.png', 'protected-mask.png', 'template-overlay.png', 'fit-comparison-native.png', 'fit-comparison-4x.png']) await copyFile(new URL(stage + name, root), new URL(runtime + name, root));
  manifest.hairFitReview = { stage: 'hair-fit-front-01', direction: 'south', method: 'manual', jobId: null, paidCalls: 0, creditsSpent: 0, hairVisualApproved: false, userVisualAccepted: false, templateUrl: '/assets/character-v2/hair-fit-front-01/head-template.json', styles: review.records.map(record => ({ itemId: record.itemId, labelThai: record.labelThai })), reviewPath: stage + 'fit-review.json' };
  manifest.hairRejectionReview = { decision: 'Latest USER rejects ALL prior hair, not the four approved V2 bodies.', stages: ['hair-manual-01', 'hair-long-manual-01', 'hair-long-redesign-02'], selectable: false, allPriorHairRejected: true, assetsRetainedUnchanged: true };
  await save(manifestPath, manifest);
  await assertFrozen();
  console.log('Published three SOUTH manual pairs; ledger and frozen V2/V3 history unchanged.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv[2] === '--measure') await measure();
  else if (process.argv[2] === '--draft') await draft();
  else if (process.argv[2] === '--publish') await publish();
  else throw new Error('Use --measure, --draft or --publish. No network generation.');
}