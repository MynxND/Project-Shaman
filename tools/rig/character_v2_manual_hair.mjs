import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, copyFile, readdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { hash, decodePng, makeMasks, BODY_SHA256 } from './prepare_character_v2_hair.mjs';

const root = new URL('../../', import.meta.url);
const require = createRequire(new URL('apps/client/package.json', root));
const sharp = createRequire(require.resolve('next'))('sharp');
export const stage = 'docs/design/character-v2/hair-manual-01/';
export const manifestPath = 'apps/client/public/assets/character-v2/manifest.json';
export const ledgerPath = 'docs/design/character-v2/cost-ledger.json';
export const runtimePath = 'apps/client/public/assets/character-v2/hair-manual-01/front.png';
export const load = path => readFile(new URL(path, root));
const json = async path => JSON.parse(await load(path));
const save = (path, value) => writeFile(new URL(path, root), JSON.stringify(value, null, 2) + '\n');

export function rasterize(art) {
  assert.deepEqual(art.canvas, { width: 128, height: 128, origin: { x: 61, y: 112 } });
  const pixels = Buffer.alloc(128 * 128 * 4);
  const seen = new Set();
  for (const [row, left, symbols] of art.rows) {
    assert.ok(Number.isInteger(row) && Number.isInteger(left) && typeof symbols === 'string');
    assert.ok(!seen.has(row), 'Duplicate authored row');
    seen.add(row);
    assert.ok(row >= art.boundsConstraint.top && row <= art.boundsConstraint.bottom);
    assert.ok(left >= art.boundsConstraint.left && left + symbols.length - 1 <= art.boundsConstraint.right);
    for (const [index, symbol] of [...symbols].entries()) {
      if (symbol === '.') continue;
      const color = art.palette[symbol];
      assert.ok(color?.length === 3 && color.every(value => Number.isInteger(value) && value >= 0 && value <= 255), 'Unknown palette symbol');
      pixels.set([...color, 255], (row * 128 + left + index) * 4);
    }
  }
  return pixels;
}

export function inspect(art, hair, body) {
  const masks = makeMasks(body);
  const composite = Buffer.from(body);
  const palette = Object.values(art.palette).map(color => color.join(','));
  const faceColors = new Set();
  for (let pixel = 0; pixel < 16384; pixel++) {
    if (masks.protectedAnatomy[pixel]) faceColors.add(body.subarray(pixel * 4, pixel * 4 + 3).join(','));
  }
  assert.ok(palette.every(color => !faceColors.has(color)), 'Hair palette must be disjoint from protected skin/face palette');
  const metrics = { visible: 0, hiddenRgb: 0, partialAlpha: 0, skinLikePixels: 0, sourceCopies: 0, foreheadOcclusion: 0, protectedFeatureMismatch: 0, outsideOldProviderMask: 0, bounds: { left: 128, top: 128, right: -1, bottom: -1 }, colors: {} };
  for (let pixel = 0; pixel < 16384; pixel++) {
    const offset = pixel * 4;
    const [red, green, blue, alpha] = hair.subarray(offset, offset + 4);
    if (!alpha) { if (red || green || blue) metrics.hiddenRgb++; continue; }
    const column = pixel % 128;
    const row = Math.floor(pixel / 128);
    const forehead = art.foreheadOcclusion;
    const allowedForehead = column >= forehead.left && column <= forehead.right && row >= forehead.top && row <= forehead.bottom;
    assert.equal(masks.ears[pixel] + masks.neck[pixel], 0, 'Ear/neck overlap');
    assert.ok(!masks.face[pixel] || allowedForehead, 'Face feature/jaw overlap');
    assert.ok(palette.includes(`${red},${green},${blue}`), 'Non-hair color');
    metrics.visible++;
    if (alpha !== 255) metrics.partialAlpha++;
    if (red > green + 15 && green > blue + 10) metrics.skinLikePixels++;
    if (hair.subarray(offset, offset + 4).equals(body.subarray(offset, offset + 4))) metrics.sourceCopies++;
    if (masks.face[pixel]) metrics.foreheadOcclusion++;
    if (!masks.hair[pixel]) metrics.outsideOldProviderMask++;
    metrics.bounds.left = Math.min(metrics.bounds.left, column);
    metrics.bounds.right = Math.max(metrics.bounds.right, column);
    metrics.bounds.top = Math.min(metrics.bounds.top, row);
    metrics.bounds.bottom = Math.max(metrics.bounds.bottom, row);
    metrics.colors[`${red},${green},${blue}`] = (metrics.colors[`${red},${green},${blue}`] ?? 0) + 1;
    hair.copy(composite, offset, offset, offset + 4);
  }
  for (let pixel = 0; pixel < 16384; pixel++) {
    const row = Math.floor(pixel / 128);
    if ((masks.face[pixel] && row >= 35) || masks.ears[pixel] || masks.neck[pixel] || row >= 35) {
      if (!body.subarray(pixel * 4, pixel * 4 + 4).equals(composite.subarray(pixel * 4, pixel * 4 + 4))) metrics.protectedFeatureMismatch++;
    }
  }
  for (const key of ['hiddenRgb', 'partialAlpha', 'skinLikePixels', 'sourceCopies', 'protectedFeatureMismatch']) assert.equal(metrics[key], 0, key);
  assert.ok(metrics.visible > 374 && metrics.foreheadOcclusion > 0 && metrics.foreheadOcclusion < 50);
  assert.equal(hash(body), hash(Buffer.from(body)), 'Body buffer must remain unchanged');
  return { composite, metrics };
}

async function frozenFiles(directory) {
  const paths = [];
  for (const entry of await readdir(new URL(directory, root), { withFileTypes: true })) {
    const path = directory + entry.name;
    if (entry.isDirectory()) paths.push(...await frozenFiles(path + '/'));
    else paths.push(path);
  }
  return paths;
}

export async function draft() {
  const art = await json(stage + 'front-rowmap.json');
  const bodyBytes = await load('docs/design/character-v2/body-front-02/raw.png');
  assert.equal(hash(bodyBytes), BODY_SHA256);
  const body = await decodePng(bodyBytes);
  const hair = rasterize(art);
  const { composite, metrics } = inspect(art, hair, body);
  const ledger = await json(ledgerPath);
  const manifest = await json(manifestPath);
  assert.equal(ledger.spent, 20);
  assert.equal(ledger.cap, 20);
  assert.equal(ledger.remainingUncommitted, 0);
  try { await load(stage + 'manifest-before.json'); } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    await writeFile(new URL(stage + 'manifest-before.json', root), await load(manifestPath), { flag: 'wx' });
    await writeFile(new URL(stage + 'ledger-before.json', root), await load(ledgerPath), { flag: 'wx' });
    const paths = [...await frozenFiles('docs/design/character-v2/hair-proof-01/'), ...manifest.assets.flatMap(asset => [asset.provenance.sourcePath, 'apps/client/public' + asset.url])];
    await save(stage + 'frozen-hashes.json', Object.fromEntries(await Promise.all(paths.map(async path => [path, hash(await load(path))]))));
  }
  const png = (data, width, height) => sharp(data, { raw: { width, height, channels: 4 } }).png().toBuffer();
  await writeFile(new URL(stage + 'front.png', root), await png(hair, 128, 128));
  await writeFile(new URL(stage + 'composite-diagnostic.png', root), await png(composite, 128, 128));
  const comparison = Buffer.alloc(384 * 128 * 4);
  for (const [index, pixels] of [body, hair, composite].entries()) {
    for (let row = 0; row < 128; row++) pixels.copy(comparison, (row * 384 + index * 128) * 4, row * 128 * 4, (row + 1) * 128 * 4);
  }
  for (const scale of [1, 2, 6]) {
    const suffix = scale === 1 ? 'native' : `nearest${scale}x`;
    await writeFile(new URL(stage + `comparison-${suffix}.png`, root), await sharp(await png(comparison, 384, 128)).resize(384 * scale, 128 * scale, { kernel: 'nearest' }).png().toBuffer());
    await writeFile(new URL(stage + `hair-${suffix}.png`, root), await sharp(await load(stage + 'front.png')).resize(128 * scale, 128 * scale, { kernel: 'nearest' }).png().toBuffer());
  }
  await save(stage + 'review.json', { method: 'manual', jobId: null, itemId: art.itemId, sourceSha256: hash(await load(stage + 'front.png')), bodySha256: BODY_SHA256, rowmapSha256: hash(await load(stage + 'front-rowmap.json')), metrics, creditsSpent: 0, cap: 20, spent: 20, remaining: 0, hairVisualApproved: false, userVisualAccepted: false, productionReady: false, diagnosticOnlyComposite: true, stop: 'SOUTH manual draft only; USER visual review required. No paid submission, other direction, outfit, animation or live equipment.' });
  console.log(JSON.stringify(metrics, null, 2));
}

export async function publish() {
  const before = await json(stage + 'manifest-before.json');
  const ledgerBefore = await json(stage + 'ledger-before.json');
  const manifest = await json(manifestPath);
  const ledger = await json(ledgerPath);
  assert.deepEqual(manifest, before, 'Publish only on the exact inspected snapshot; preserve unknown user fields');
  assert.deepEqual(ledger, ledgerBefore, 'Ledger changed since draft; stop');
  const review = await json(stage + 'review.json');
  const art = await json(stage + 'front-rowmap.json');
  inspect(art, await decodePng(await load(stage + 'front.png')), await decodePng(await load('docs/design/character-v2/body-front-02/raw.png')));
  const body = manifest.assets.find(asset => asset.direction === 'south' && asset.layer === 'body');
  manifest.assets.push({ id: 'ivory-crop01-manual-idle-south', itemId: art.itemId, layer: 'hair', pass: 'hair', poseId: body.poseId, direction: 'south', state: 'idle', canvas: body.canvas, timeline: [null], frameCount: 1, url: '/assets/character-v2/hair-manual-01/front.png', provenance: { kind: 'new-v2', sourcePath: stage + 'front.png', sha256: review.sourceSha256, method: 'manual', jobId: null }, visualApproved: false });
  manifest.manualHairReview = { stage: 'hair-manual-01', method: 'manual', jobId: null, creditsSpent: 0, direction: 'south', itemId: art.itemId, hairVisualApproved: false, userVisualAccepted: false, reviewPath: stage + 'review.json' };
  ledger.manualStages = [...(ledger.manualStages ?? []), { ...manifest.manualHairReview, paidHistoryUnchanged: true }];
  await mkdir(new URL('apps/client/public/assets/character-v2/hair-manual-01/', root), { recursive: true });
  await copyFile(new URL(stage + 'front.png', root), new URL(runtimePath, root));
  await save(manifestPath, manifest);
  await save(ledgerPath, ledger);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv[2] === '--draft') await draft();
  else if (process.argv[2] === '--publish') await publish();
  else throw new Error('Use --draft or --publish; no provider calls exist.');
}