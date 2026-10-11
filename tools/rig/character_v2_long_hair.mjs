import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, copyFile, readdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { decodePng, hash, makeMasks, BODY_SHA256 } from './prepare_character_v2_hair.mjs';

const root = new URL('../../', import.meta.url);
const require = createRequire(new URL('apps/client/package.json', root));
const sharp = createRequire(require.resolve('next'))('sharp');
export const stage = 'docs/design/character-v2/hair-long-manual-01/';
export const manifestPath = 'apps/client/public/assets/character-v2/manifest.json';
export const ledgerPath = 'docs/design/character-v2/cost-ledger.json';
export const load = path => readFile(new URL(path, root));
export const json = async path => JSON.parse(await load(path));
const save = (path, value) => writeFile(new URL(path, root), JSON.stringify(value, null, 2) + '\n');

export function rasterize(art, pass) {
  assert.deepEqual(art.canvas, { width: 128, height: 128, origin: { x: 61, y: 112 } });
  assert.ok(['hairBack', 'hairFront'].includes(pass));
  const pixels = Buffer.alloc(128 * 128 * 4);
  for (const [symbol, points] of art[pass]) {
    const color = art.palette[symbol];
    assert.ok(color?.length === 3 && points.length >= 3);
    assert.ok(points.every(point => point.length === 2 && point.every(value => Number.isInteger(value) && value >= 0 && value < 128)));
    for (let row = 0; row < 128; row++) {
      for (let column = 0; column < 128; column++) {
        let inside = false;
        for (let index = 0, previous = points.length - 1; index < points.length; previous = index++) {
          const [x1, y1] = points[index];
          const [x2, y2] = points[previous];
          const edge = (column - x1) * (y2 - y1) === (row - y1) * (x2 - x1)
            && column >= Math.min(x1, x2) && column <= Math.max(x1, x2) && row >= Math.min(y1, y2) && row <= Math.max(y1, y2);
          if (edge) { inside = true; break; }
          if ((y1 > row) !== (y2 > row) && column < (x2 - x1) * (row - y1) / (y2 - y1) + x1) inside = !inside;
        }
        if (inside) pixels.set([...color, 255], (row * 128 + column) * 4);
      }
    }
  }
  return pixels;
}

export function compose(...layers) {
  const output = Buffer.alloc(128 * 128 * 4);
  for (const layer of layers) for (let offset = 0; offset < output.length; offset += 4) if (layer[offset + 3]) layer.copy(output, offset, offset, offset + 4);
  return output;
}

export function inspect(art, back, front, body) {
  const masks = makeMasks(body);
  const composite = compose(back, body, front);
  const palette = Object.values(art.palette).map(color => color.join(','));
  const metrics = { passes: {}, protectedFeatureMismatch: 0, scalpHoles: 0, foreheadOcclusion: 0, rearBodyOverlap: 0, rearVisibleBelowNeck: 0, frontVisibleBelowNeck: 0 };
  for (const [name, hair] of [['hairBack', back], ['hairFront', front]]) {
    const counts = { visible: 0, hiddenRgb: 0, partialAlpha: 0, skinLikePixels: 0, redPixels: 0, sourceCopies: 0, bounds: { left: 128, top: 128, right: -1, bottom: -1 }, colors: {} };
    for (let pixel = 0; pixel < 16384; pixel++) {
      const offset = pixel * 4;
      const [red, green, blue, alpha] = hair.subarray(offset, offset + 4);
      if (!alpha) { if (red || green || blue) counts.hiddenRgb++; continue; }
      const column = pixel % 128;
      const row = Math.floor(pixel / 128);
      assert.ok(palette.includes(`${red},${green},${blue}`), 'Non-hair palette');
      counts.visible++;
      if (alpha !== 255) counts.partialAlpha++;
      if (red > green + 15 && green > blue + 10) counts.skinLikePixels++;
      if (red > green + 15 && red > blue + 15) counts.redPixels++;
      if (hair.subarray(offset, offset + 4).equals(body.subarray(offset, offset + 4))) counts.sourceCopies++;
      counts.bounds.left = Math.min(counts.bounds.left, column);
      counts.bounds.right = Math.max(counts.bounds.right, column);
      counts.bounds.top = Math.min(counts.bounds.top, row);
      counts.bounds.bottom = Math.max(counts.bounds.bottom, row);
      counts.colors[`${red},${green},${blue}`] = (counts.colors[`${red},${green},${blue}`] ?? 0) + 1;
      if (name === 'hairBack') {
        if (body[offset + 3]) metrics.rearBodyOverlap++;
        if (row > 52 && !body[offset + 3] && !front[offset + 3]) metrics.rearVisibleBelowNeck++;
      } else {
        const forehead = art.foreheadOcclusion;
        const allowed = column >= forehead.left && column <= forehead.right && row >= forehead.top && row <= forehead.bottom;
        assert.equal(masks.ears[pixel] + masks.neck[pixel], 0, 'Ear/neck overlap');
        assert.ok(!masks.face[pixel] || allowed, 'Face feature/jaw overlap');
        if (masks.face[pixel]) metrics.foreheadOcclusion++;
        if (row > 52) metrics.frontVisibleBelowNeck++;
      }
    }
    for (const key of ['hiddenRgb', 'partialAlpha', 'skinLikePixels', 'redPixels', 'sourceCopies']) assert.equal(counts[key], 0, `${name}: ${key}`);
    assert.ok(counts.visible > 0, 'Empty hair pass');
    metrics.passes[name] = counts;
  }
  for (let pixel = 0; pixel < 16384; pixel++) {
    const offset = pixel * 4;
    const row = Math.floor(pixel / 128);
    if ((masks.face[pixel] && row >= 35) || masks.ears[pixel] || masks.neck[pixel]) {
      if (!body.subarray(offset, offset + 4).equals(composite.subarray(offset, offset + 4))) metrics.protectedFeatureMismatch++;
    }
    if (row >= 20 && row <= 31 && masks.hair[pixel] && body[offset + 3] && !front[offset + 3]) metrics.scalpHoles++;
  }
  assert.equal(metrics.protectedFeatureMismatch, 0);
  assert.equal(metrics.scalpHoles, 0, 'Visible bald scalp gaps');
  assert.ok(metrics.passes.hairBack.bounds.bottom >= 70 && metrics.passes.hairBack.bounds.bottom <= 80, 'Waist-length rear required');
  assert.ok(metrics.rearBodyOverlap > 100 && metrics.rearVisibleBelowNeck > 30 && metrics.frontVisibleBelowNeck > 10, 'Real split depth and visible long fall required');
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
  const art = await json(stage + 'art.json');
  const bodyBytes = await load('docs/design/character-v2/body-front-02/raw.png');
  assert.equal(hash(bodyBytes), BODY_SHA256);
  const body = await decodePng(bodyBytes);
  const back = rasterize(art, 'hairBack');
  const front = rasterize(art, 'hairFront');
  const { composite, metrics } = inspect(art, back, front, body);
  const ledger = await json(ledgerPath);
  assert.equal(ledger.spent, 20);
  assert.equal(ledger.cap, 20);
  assert.equal(ledger.remainingUncommitted, 0);
  try { await load(stage + 'manifest-before.json'); } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    await writeFile(new URL(stage + 'manifest-before.json', root), await load(manifestPath), { flag: 'wx' });
    await writeFile(new URL(stage + 'ledger-before.json', root), await load(ledgerPath), { flag: 'wx' });
    const manifest = await json(manifestPath);
    const paths = [...await frozenFiles('docs/design/character-v2/hair-proof-01/'), ...await frozenFiles('docs/design/character-v2/hair-manual-01/'), ...manifest.assets.flatMap(asset => [asset.provenance.sourcePath, 'apps/client/public' + asset.url])];
    await save(stage + 'frozen-hashes.json', Object.fromEntries(await Promise.all(paths.map(async path => [path, hash(await load(path))]))));
  }
  const png = (pixels, width, height) => sharp(pixels, { raw: { width, height, channels: 4 } }).png().toBuffer();
  for (const [name, pixels] of [['hair-back', back], ['hair-front', front], ['composite-diagnostic', composite]]) await writeFile(new URL(stage + name + '.png', root), await png(pixels, 128, 128));
  const comparison = Buffer.alloc(512 * 128 * 4);
  for (const [index, pixels] of [body, back, front, composite].entries()) for (let row = 0; row < 128; row++) pixels.copy(comparison, (row * 512 + index * 128) * 4, row * 128 * 4, (row + 1) * 128 * 4);
  for (const scale of [1, 2, 6]) {
    const width = 512 * scale;
    const pixels = Buffer.alloc(width * 128 * scale * 4);
    for (let row = 0; row < 128 * scale; row++) for (let column = 0; column < width; column++) {
      const offset = (Math.floor(row / scale) * 512 + Math.floor(column / scale)) * 4;
      comparison.copy(pixels, (row * width + column) * 4, offset, offset + 4);
    }
    await writeFile(new URL(stage + `comparison-${scale === 1 ? 'native' : `nearest${scale}x`}.png`, root), await png(pixels, width, 128 * scale));
  }
  const sources = Object.fromEntries(await Promise.all(['hair-back', 'hair-front'].map(async name => [name, hash(await load(stage + name + '.png'))])));
  await save(stage + 'review.json', { method: 'manual', jobId: null, itemId: art.itemId, sources, artSha256: hash(await load(stage + 'art.json')), bodySha256: BODY_SHA256, metrics, creditsSpent: 0, cap: 20, spent: 20, remaining: 0, hairVisualApproved: false, userVisualAccepted: false, productionReady: false, earOcclusion: false, diagnosticOnlyComposite: true, stop: 'SOUTH loose long silver-ivory hair, no bow/tie/accessory. Review before other directions. No paid calls or live migration.' });
  console.log(JSON.stringify(metrics, null, 2));
}

export async function publish() {
  const before = await json(stage + 'manifest-before.json');
  const ledgerBefore = await json(stage + 'ledger-before.json');
  const manifest = await json(manifestPath);
  const ledger = await json(ledgerPath);
  assert.deepEqual(manifest, before, 'Publish only from inspected snapshot');
  assert.deepEqual(ledger, ledgerBefore, 'Ledger changed since draft');
  const art = await json(stage + 'art.json');
  const review = await json(stage + 'review.json');
  const back = await decodePng(await load(stage + 'hair-back.png'));
  const front = await decodePng(await load(stage + 'hair-front.png'));
  assert.ok(back.equals(rasterize(art, 'hairBack')) && front.equals(rasterize(art, 'hairFront')));
  inspect(art, back, front, await decodePng(await load('docs/design/character-v2/body-front-02/raw.png')));
  const body = manifest.assets.find(asset => asset.direction === 'south' && asset.layer === 'body');
  const pose = manifest.poses.find(candidate => candidate.id === body.poseId);
  manifest.archivedHairDrafts = [...(manifest.archivedHairDrafts ?? []), { stage: 'hair-manual-01', selectable: false, reason: 'Latest USER requests long loose hair, not the crop. Original bytes and binding retained, no fake empty back pass.', pose: structuredClone(pose), assets: manifest.assets.filter(asset => asset.layer === 'hair'), review: manifest.manualHairReview }];
  manifest.assets = manifest.assets.filter(asset => asset.layer !== 'hair');
  pose.frames[0].order = ['hairBack', 'body', 'outfit', 'hairFront', 'headgear', 'mainHand', 'offHand', 'accessories', 'effects'];
  await mkdir(new URL('apps/client/public/assets/character-v2/hair-long-manual-01/', root), { recursive: true });
  for (const [pass, name] of [['hairBack', 'hair-back'], ['hairFront', 'hair-front']]) {
    assert.equal(hash(await load(stage + name + '.png')), review.sources[name]);
    const url = '/assets/character-v2/hair-long-manual-01/' + name + '.png';
    manifest.assets.push({ id: `${art.itemId}-idle-south-${pass}`, itemId: art.itemId, layer: 'hair', pass, poseId: body.poseId, direction: 'south', state: 'idle', canvas: body.canvas, timeline: [null], frameCount: 1, url, provenance: { kind: 'new-v2', sourcePath: stage + name + '.png', sha256: review.sources[name], method: 'manual', jobId: null }, visualApproved: false });
    await copyFile(new URL(stage + name + '.png', root), new URL('apps/client/public' + url, root));
  }
  manifest.longHairReview = { stage: 'hair-long-manual-01', method: 'manual', jobId: null, creditsSpent: 0, direction: 'south', itemId: art.itemId, hairVisualApproved: false, userVisualAccepted: false, reviewPath: stage + 'review.json' };
  ledger.manualStages = [...(ledger.manualStages ?? []), { ...manifest.longHairReview, paidHistoryUnchanged: true }];
  await save(manifestPath, manifest);
  await save(ledgerPath, ledger);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv[2] === '--draft') await draft();
  else if (process.argv[2] === '--publish') await publish();
  else throw new Error('Use --draft or --publish; zero provider calls.');
}