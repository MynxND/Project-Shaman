import assert from 'node:assert/strict';
import { writeFile, mkdir, copyFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { rasterize, inspect, load, json, manifestPath, ledgerPath } from './character_v2_long_hair.mjs';
import { decodePng, hash, BODY_SHA256 } from './prepare_character_v2_hair.mjs';

const root = new URL('../../', import.meta.url);
const require = createRequire(new URL('apps/client/package.json', root));
const sharp = createRequire(require.resolve('next'))('sharp');
export const stage = 'docs/design/character-v2/hair-long-redesign-02/';
const save = (path, value) => writeFile(new URL(path, root), JSON.stringify(value, null, 2) + '\n');

export async function draft() {
  const art = await json(stage + 'art.json');
  const bodyBytes = await load('docs/design/character-v2/body-front-02/raw.png');
  assert.equal(hash(bodyBytes), BODY_SHA256);
  const body = await decodePng(bodyBytes);
  const back = rasterize(art, 'hairBack');
  const front = rasterize(art, 'hairFront');
  const { composite, metrics } = inspect(art, back, front, body);
  const manifest = await json(manifestPath);
  const ledger = await json(ledgerPath);
  assert.equal(ledger.cap, 20);
  assert.equal(ledger.spent, 20);
  assert.equal(ledger.remainingUncommitted, 0);
  try { await load(stage + 'manifest-before.json'); } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    await writeFile(new URL(stage + 'manifest-before.json', root), await load(manifestPath), { flag: 'wx' });
    const paths = [ledgerPath, ...manifest.assets.flatMap(asset => [asset.provenance.sourcePath, 'apps/client/public' + asset.url]), 'docs/design/character-v2/hair-long-manual-01/art.json', 'docs/design/character-v2/hair-long-manual-01/review.json'];
    await save(stage + 'frozen-hashes.json', Object.fromEntries(await Promise.all(paths.map(async path => [path, hash(await load(path))]))));
  }
  const png = (pixels, width, height) => sharp(pixels, { raw: { width, height, channels: 4 } }).png().toBuffer();
  for (const [name, pixels] of [['hair-back',back],['hair-front',front],['composite-diagnostic',composite]]) await writeFile(new URL(stage + name + '.png', root), await png(pixels,128,128));
  for (const scale of [1,2,6]) {
    const width = 128 * scale;
    const pixels = Buffer.alloc(width * width * 4);
    for (let row = 0; row < width; row++) for (let column = 0; column < width; column++) {
      const offset = (Math.floor(row / scale) * 128 + Math.floor(column / scale)) * 4;
      composite.copy(pixels, (row * width + column) * 4, offset, offset + 4);
    }
    await writeFile(new URL(stage + `composite-${scale}x.png`, root), await png(pixels,width,width));
  }
  const sources = Object.fromEntries(await Promise.all(['hair-back','hair-front'].map(async name => [name,hash(await load(stage + name + '.png'))])));
  await save(stage + 'review.json', { method: 'manual', jobId: null, itemId: art.itemId, sources, artSha256: hash(await load(stage + 'art.json')), bodySha256: BODY_SHA256, metrics, creditsSpent: 0, hairVisualApproved: false, userVisualAccepted: false, productionReady: false, diagnosticOnlyComposite: true });
  console.log(JSON.stringify(metrics));
}

export async function publish() {
  const before = await json(stage + 'manifest-before.json');
  const manifest = await json(manifestPath);
  assert.deepEqual(manifest, before);
  for (const [path, expected] of Object.entries(await json(stage + 'frozen-hashes.json'))) assert.equal(hash(await load(path)), expected, path);
  const art = await json(stage + 'art.json');
  const review = await json(stage + 'review.json');
  const body = manifest.assets.find(asset => asset.layer === 'body' && asset.direction === 'south');
  manifest.archivedHairDrafts.push({ stage: 'hair-long-manual-01', selectable: false, visualApproved: false, reason: 'USER rejected FRONT: ugly broad straight cape and jagged ends. Retained unchanged, replaced by independently authored proposal.', pose: structuredClone(manifest.poses.find(pose => pose.id === body.poseId)), assets: manifest.assets.filter(asset => asset.layer === 'hair'), review: manifest.longHairReview });
  manifest.assets = manifest.assets.filter(asset => asset.layer !== 'hair');
  await mkdir(new URL('apps/client/public/assets/character-v2/hair-long-redesign-02/', root), { recursive: true });
  for (const [pass,name] of [['hairBack','hair-back'],['hairFront','hair-front']]) {
    const bytes = await load(stage + name + '.png');
    assert.equal(hash(bytes), review.sources[name]);
    assert.ok((await decodePng(bytes)).equals(rasterize(art,pass)));
    const url = '/assets/character-v2/hair-long-redesign-02/' + name + '.png';
    manifest.assets.push({ id: `${art.itemId}-idle-south-${pass}`, itemId: art.itemId, layer: 'hair', pass, poseId: body.poseId, direction: 'south', state: 'idle', canvas: body.canvas, timeline: [null], frameCount: 1, url, provenance: { kind: 'new-v2', sourcePath: stage + name + '.png', sha256: review.sources[name], method: 'manual', jobId: null }, visualApproved: false });
    await copyFile(new URL(stage + name + '.png', root),new URL('apps/client/public' + url,root));
  }
  manifest.hairRedesignReview = { stage: 'hair-long-redesign-02', direction: 'south', itemId: art.itemId, method: 'manual', jobId: null, creditsSpent: 0, hairVisualApproved: false, userVisualAccepted: false, reviewPath: stage + 'review.json' };
  await save(manifestPath,manifest);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv[2] === '--draft') await draft();
  else if (process.argv[2] === '--publish') await publish();
  else throw new Error('Use --draft or --publish. No network or paid calls.');
}