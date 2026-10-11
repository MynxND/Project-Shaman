import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const root = fileURLToPath(new URL('../../', import.meta.url));
const require = createRequire(new URL('../../apps/client/package.json', import.meta.url));
const sharp = createRequire(require.resolve('next'))('sharp');
const publicRoot = path.join(root, 'apps/client/public');
const design = path.join(root, 'docs/design/head-proof');
const output = path.join(publicRoot, 'assets/head-proof');
const views = ['south', 'east', 'north'];
const size = 128;
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const rgba = async filename => sharp(filename).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const png = async (data, filename, width = size, height = size) => {
  await mkdir(path.dirname(filename), { recursive: true });
  await sharp(data, { raw: { width, height, channels: 4 } }).png().toFile(filename);
};
const report = { stage: 'source-inspection', approved: false, sources: {} };
const definitions = JSON.parse(await readFile(path.join(design, 'masks.json'), 'utf8'));
const inside = (column, row, polygon) => {
  let contained = false;
  for (let current = 0, previous = polygon.length - 1; current < polygon.length; previous = current++) {
    const [currentX, currentY] = polygon[current];
    const [previousX, previousY] = polygon[previous];
    if ((currentY > row) !== (previousY > row) && column < (previousX - currentX) * (row - currentY) / (previousY - currentY) + currentX) contained = !contained;
  }
  return contained;
};
const maskImage = selection => {
  const data = Buffer.alloc(size * size * 4);
  for (let pixel = 0; pixel < size * size; pixel++) data.set(selection[pixel] ? [255, 255, 255, 255] : [0, 0, 0, 255], pixel * 4);
  return data;
};
const select = predicate => Uint8Array.from({ length: size * size }, (_, pixel) => Number(predicate(pixel % size, Math.floor(pixel / size), pixel)));
const exists = async filename => { try { await access(filename); return true; } catch { return false; } };
const retentionFile = path.join(design, 'source-retention.json');
const retention = await exists(retentionFile) ? JSON.parse(await readFile(retentionFile, 'utf8')) : null;
const order = ['hairBack', 'body', 'head', 'hairFront', 'crown'];
const manifest = {
  version: 1,
  id: 'medium-male-head-proof-native128',
  canvas: { width: size, height: size, foot: { x: 64, y: 124 } },
  review: {
    approved: false,
    stage: 'three-view',
    limitations: [
      'Three native static views are for visual review only; PNG coverage does not imply approved artwork.',
      'Scalp and hidden cloth are masked reconstructions; protected face and original body proportions are retained.',
      'Short hair uses head-only PixelLab changes layers in all three views; the archived manual north cap is only a fallback without a completed job. Cross-view art consistency needs review.',
      'Crimson hair-bound ties retain source color; only exact four-stop neutral hair pixels are recolored.',
      'Crown uses trimmed existing ritual-hat pixels, with face-intersecting tassel pixels removed; side/back seats await reconstructed scalp review.',
      'Hand-authored skin/ear masks and shoulder-charm boundaries require user visual approval; byte equality alone does not approve the segmentation.',
      'Three static source frame-0 views only. No animation expansion or main-player integration.'
    ]
  },
  views: {},
  hairstyles: ['original', 'short'].map(id => ({ id, name: id === 'original' ? 'Original spikes and tied tail' : 'Short layered crop', views: {} })),
  palettes: [
    { id: 'silver', name: 'Warm silver', colors: ['#55433f', '#a29389', '#e0d6c6', '#fff2dc'] },
    { id: 'ink', name: 'Ink black', colors: ['#141820', '#303742', '#535f6e', '#8997a7'] },
    { id: 'chestnut', name: 'Chestnut', colors: ['#352126', '#684039', '#a56b4e', '#daa377'] },
    { id: 'jade', name: 'Jade', colors: ['#173332', '#315f51', '#60977a', '#b5d4a4'] }
  ]
};
const coverage = { complete: false, chargedGenerations: 6, generationCap: 36, capSource: 'Internal limit, not a user-specified budget', priorGenerationCap: 30, additionalGenerationCap: 24, correctionGenerationCap: 6, reservedCorrectionGenerations: 0, correctionChargedGenerations: 0, reservedAdditionalGenerations: 0, pendingJobs: [], rejectedJobs: [], completedJobs: ['8507f082-b8a6-4087-b777-6d909a10965b'], missingAssets: [], views: {} };
for (const job of ['scalp-east', 'scalp-north', 'short-south', 'short-east', 'short-north']) {
  const filename = path.join(design, `jobs/${job}-submit.json`);
  if (!(await exists(filename))) continue;
  const receipt = JSON.parse(await readFile(filename, 'utf8')).result.structuredContent;
  assert.equal(receipt.estimated_generations, 6, `${job}: unexpected cost requires review`);
  if (job === 'short-north') coverage.reservedCorrectionGenerations += receipt.estimated_generations;
  else coverage.reservedAdditionalGenerations += receipt.estimated_generations;
  const resultFile = path.join(design, `jobs/${job}-result.json`);
  if (await exists(resultFile)) {
    const result = JSON.parse(await readFile(resultFile, 'utf8'));
    if (result.result.content.some(item => item.type === 'image')) {
      coverage.completedJobs.push(receipt.job_id);
      assert.equal(result.result.structuredContent.charged_generations, 6, `${job}: actual usage differs from reservation`);
      coverage.chargedGenerations += result.result.structuredContent.charged_generations;
      if (job === 'short-north') coverage.correctionChargedGenerations += result.result.structuredContent.charged_generations;
      continue;
    }
  }
  coverage.pendingJobs.push(receipt.job_id);
}
assert.ok(coverage.reservedAdditionalGenerations <= 24, 'Additional generation budget exceeded');
assert.ok(coverage.reservedCorrectionGenerations <= coverage.correctionGenerationCap, 'Internal correction cap exceeded');
assert.ok(coverage.chargedGenerations <= coverage.generationCap, 'Cumulative internal cap exceeded');
const extractPixels = (source, selection) => {
  const target = Buffer.alloc(size * size * 4);
  for (let pixel = 0; pixel < size * size; pixel++) if (selection[pixel]) source.copy(target, pixel * 4, pixel * 4, pixel * 4 + 4);
  return target;
};
const neutralHair = data => {
  const target = Buffer.from(data);
  for (let pixel = 0; pixel < size * size; pixel++) {
    const offset = pixel * 4;
    if (!target[offset + 3]) continue;
    if (target[offset] > target[offset + 1] * 1.35 && target[offset] > target[offset + 2] * 1.2) continue;
    const brightness = .2126 * target[offset] + .7152 * target[offset + 1] + .0722 * target[offset + 2];
    const shade = brightness < 88 ? 48 : brightness < 144 ? 104 : brightness < 208 ? 168 : 232;
    target[offset] = target[offset + 1] = target[offset + 2] = shade;
  }
  return target;
};
const compose = layers => {
  const target = Buffer.alloc(size * size * 4);
  for (const layer of layers) for (let pixel = 0; pixel < size * size; pixel++) {
    const offset = pixel * 4;
    const alpha = layer[offset + 3] / 255;
    if (!alpha) continue;
    const existingAlpha = target[offset + 3] / 255;
    const resultAlpha = alpha + existingAlpha * (1 - alpha);
    for (let channel = 0; channel < 3; channel++) target[offset + channel] = Math.round((layer[offset + channel] * alpha + target[offset + channel] * existingAlpha * (1 - alpha)) / resultAlpha);
    target[offset + 3] = Math.round(resultAlpha * 255);
  }
  return target;
};
const bounds = data => {
  let left = size, top = size, right = -1, bottom = -1;
  for (let pixel = 0; pixel < size * size; pixel++) if (data[pixel * 4 + 3]) {
    left = Math.min(left, pixel % size); right = Math.max(right, pixel % size);
    top = Math.min(top, Math.floor(pixel / size)); bottom = Math.max(bottom, Math.floor(pixel / size));
  }
  return right < 0 ? null : { left, top, right, bottom };
};
const previewRows = [];
const palettePreviews = Object.fromEntries(views.map(view => [view, []]));
await mkdir(design, { recursive: true });
for (const view of views) {
  const filename = path.join(publicRoot, `assets/rig-v2/male/base/idle-${view}.png`);
  const before = await readFile(filename);
  const metadata = await sharp(before).metadata();
  assert.equal(metadata.width, 512);
  assert.equal(metadata.height, 128);
  const source = await sharp(before).extract({ left: 0, top: 0, width: size, height: size }).ensureAlpha().raw().toBuffer();
  await png(source, path.join(design, `source/${view}.png`));
  const restored = await rgba(path.join(design, `source/${view}.png`));
  assert.deepEqual(restored.data, source);
  await sharp(source, { raw: { width: size, height: size, channels: 4 } }).resize(768, 768, { kernel: 'nearest' }).png().toFile(path.join(design, `source/${view}-zoom.png`));
  const gridParts = [];
  for (let coordinate = 0; coordinate <= 90; coordinate += 5) {
    if (coordinate <= 80) gridParts.push(`<path d="M${coordinate * 8},0V720" stroke="#1ac4c4" stroke-opacity=".3"/><text x="${coordinate * 8 + 2}" y="11" fill="#ffffff" font-size="10">${coordinate + 20}</text>`);
    gridParts.push(`<path d="M0,${coordinate * 8}H640" stroke="#1ac4c4" stroke-opacity=".3"/><text x="2" y="${coordinate * 8 + 11}" fill="#ffffff" font-size="10">${coordinate}</text>`);
  }
  const grid = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="720">${gridParts.join('')}</svg>`);
  await sharp(source, { raw: { width: size, height: size, channels: 4 } }).extract({ left: 20, top: 0, width: 80, height: 90 }).resize(640, 720, { kernel: 'nearest' }).composite([{ input: grid }]).png().toFile(path.join(design, `source/${view}-grid.png`));
  const crownFile = path.join(publicRoot, `assets/equipment/hat-ritual/${view}.png`);
  const crownBytes = await readFile(crownFile);
  const crown = await rgba(crownFile);
  if (retention) {
    assert.equal(hash(before), retention.sources[view].stripSha256, `${view}: original strip changed since preparation`);
    assert.equal(hash(crownBytes), retention.sources[view].crownSha256, `${view}: original equipment changed since preparation`);
  }
  await png(crown.data, path.join(design, `source/crown-${view}.png`), crown.info.width, crown.info.height);
  await sharp(crownBytes).resize(crown.info.width * 4, crown.info.height * 4, { kernel: 'nearest' }).png().toFile(path.join(design, `source/crown-${view}-zoom.png`));
  const crownGridParts = [];
  for (let coordinate = 0; coordinate < Math.max(crown.info.width, crown.info.height); coordinate += 2) {
    if (coordinate < crown.info.width) crownGridParts.push(`<path d="M${coordinate * 12},0V${crown.info.height * 12}" stroke="#1ac4c4" stroke-opacity=".4"/><text x="${coordinate * 12 + 1}" y="10" fill="white" font-size="9">${coordinate}</text>`);
    if (coordinate < crown.info.height) crownGridParts.push(`<path d="M0,${coordinate * 12}H${crown.info.width * 12}" stroke="#1ac4c4" stroke-opacity=".4"/><text x="1" y="${coordinate * 12 + 10}" fill="white" font-size="9">${coordinate}</text>`);
  }
  const crownGrid = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${crown.info.width * 12}" height="${crown.info.height * 12}">${crownGridParts.join('')}</svg>`);
  await sharp(crownBytes).resize(crown.info.width * 12, crown.info.height * 12, { kernel: 'nearest' }).composite([{ input: crownGrid }]).png().toFile(path.join(design, `source/crown-${view}-grid.png`));
  assert.equal(hash(await readFile(filename)), hash(before));
  report.sources[view] = { strip: `assets/rig-v2/male/base/idle-${view}.png`, stripSha256: hash(before), frame0RgbaSha256: hash(source), crown: `assets/equipment/hat-ritual/${view}.png`, crownSha256: hash(crownBytes) };
  const definition = definitions[view];
  const protectedFace = select((column, row, pixel) => source[pixel * 4 + 3] && definition.faceRows.some(([faceRow, start, end]) => row === faceRow && column >= start && column <= end));
  const headRegion = select((column, row) => inside(column + .5, row + .5, definition.headRegion));
  const originalHair = select((column, row, pixel) => !protectedFace[pixel] && (headRegion[pixel] || definition.hairExtensions.some(polygon => inside(column + .5, row + .5, polygon))));
  const scalp = select((column, row) => inside(column + .5, row + .5, definition.scalp));
  const scalpEdit = select((column, row, pixel) => !protectedFace[pixel] && (originalHair[pixel] || scalp[pixel]));
  const shortEdit = select((column, row, pixel) => !protectedFace[pixel] && inside(column + .5, row + .5, definition.shortEnvelope));
  const masks = { 'face-protected': protectedFace, 'head-region': headRegion, 'hair-original': originalHair, 'scalp-inpaint': scalpEdit, 'short-inpaint': shortEdit, scalp };
  for (const [name, selection] of Object.entries(masks)) await png(maskImage(selection), path.join(design, `masks/${view}-${name}.png`));
  assert.equal(select((column, row, pixel) => protectedFace[pixel] && scalpEdit[pixel]).reduce((sum, value) => sum + value, 0), 0);
  const maskBytes = await readFile(path.join(design, `masks/${view}-scalp-inpaint.png`));
  const sourceBytes = await readFile(path.join(design, `source/${view}.png`));
  const prompt = {
    description: `Identity-preserving edit of this original Shaman sprite, ${view === 'south' ? 'FRONT facing camera' : view === 'east' ? 'SIDE PROFILE facing right' : 'BACK facing away'}. Only white mask may change. Remove ALL silver hair, spikes, long side locks, rear braid/feather tail and hair-bound red bow/ribbons. Reconstruct a fully BALD natural rounded warm skin scalp/head, same original chibi head size and coordinates. Keep exposed face/eyes/ears exactly; do not redraw face. In lower masked areas where removed tail covered outfit, reconstruct matching existing Medium woven cloth/collar from surrounding original pixels, not skin. Retain separate shoulder feather charms and class outfit unchanged. Crisp native pixel art; match existing warm outlined skin and cloth palette. Transparent outside silhouette. No hair, no stubble, no new ornament, no changed pose, no relocated/scaled torso or feet.`,
    image_base64: sourceBytes.toString('base64'),
    mask_image_base64: maskBytes.toString('base64'),
    crop_to_mask: true,
    no_background: true,
    output_method: 'Modify current layer',
    seed: 410 + views.indexOf(view)
  };
  await mkdir(path.join(design, 'prompts'), { recursive: true });
  await writeFile(path.join(design, `prompts/scalp-${view}.json`), JSON.stringify(prompt, null, 2) + '\n');
  const maskOverlay = Buffer.from(source);
  for (let pixel = 0; pixel < size * size; pixel++) if (originalHair[pixel] && source[pixel * 4 + 3]) maskOverlay.set([50, 220, 200, 255], pixel * 4);
  await png(maskOverlay, path.join(design, `masks/${view}-segmentation.png`));
  await sharp(maskOverlay, { raw: { width: size, height: size, channels: 4 } }).resize(768, 768, { kernel: 'nearest' }).png().toFile(path.join(design, `masks/${view}-segmentation-zoom.png`));
  const resultFile = path.join(design, `jobs/scalp-${view}-result.json`);
  let restoredGeneration = null;
  if (await exists(resultFile)) {
    const result = JSON.parse(await readFile(resultFile, 'utf8'));
    const image = result.result.content.find(item => item.type === 'image' && item.mimeType === 'image/png');
    assert.ok(image, `${view}: completed job must contain its raw PNG`);
    const bytes = Buffer.from(image.data, 'base64');
    await mkdir(path.join(design, 'raw'), { recursive: true });
    await writeFile(path.join(design, `raw/scalp-${view}.png`), bytes);
    const generated = await rgba(path.join(design, `raw/scalp-${view}.png`));
    assert.equal(generated.info.width, size, 'Require full native output; never assume cropped coordinates');
    assert.equal(generated.info.height, size);
    let unmaskedPixels = 0;
    for (let pixel = 0; pixel < size * size; pixel++) if (!scalpEdit[pixel]) {
      assert.deepEqual(generated.data.subarray(pixel * 4, pixel * 4 + 4), source.subarray(pixel * 4, pixel * 4 + 4), `${view}: unmasked RGBA at ${pixel % size},${Math.floor(pixel / size)}`);
      unmaskedPixels++;
    }
    await sharp(bytes).resize(768, 768, { kernel: 'nearest' }).png().toFile(path.join(design, `raw/scalp-${view}-zoom.png`));
    report.sources[view].generated = { fullNativeCanvas: true, rawPngSha256: hash(bytes), unmaskedPixelsVerified: unmaskedPixels };
    restoredGeneration = Buffer.from(generated.data);
    for (let pixel = 0; pixel < size * size; pixel++) if (protectedFace[pixel]) source.copy(restoredGeneration, pixel * 4, pixel * 4, pixel * 4 + 4);
    console.log(`PASS ${view} generation: 128x128; ${unmaskedPixels} unmasked RGBA pixels unchanged.`);
  }
  const sourceHair = extractPixels(source, originalHair);
  const sourceFace = extractPixels(source, protectedFace);
  const sourceBody = extractPixels(source, select((column, row, pixel) => !originalHair[pixel] && !protectedFace[pixel]));
  const reconstructed = compose([sourceBody, sourceFace, sourceHair]);
  for (let pixel = 0; pixel < size * size; pixel++) if (source[pixel * 4 + 3]) assert.deepEqual(reconstructed.subarray(pixel * 4, pixel * 4 + 4), source.subarray(pixel * 4, pixel * 4 + 4), `${view}: exact partition reconstruction`);
  await png(sourceHair, path.join(design, `source-edits/${view}-hair-exact.png`));
  await png(sourceFace, path.join(design, `source-edits/${view}-face-exact.png`));
  await png(sourceBody, path.join(design, `source-edits/${view}-body-exact.png`));
  const neckConnector = select((column, row, pixel) => !protectedFace[pixel] && (view === 'south' ? column >= 61 && column <= 66 && row >= 37 && row <= 39 : view === 'east' ? column >= 64 && column <= 69 && row >= 37 && row <= 40 : column >= 59 && column <= 68 && row >= 38 && row <= 41));
  const headSelection = select((column, row, pixel) => protectedFace[pixel] || (!neckConnector[pixel] && (scalp[pixel] || (view === 'north' && row >= 26 && row <= 33 && column >= 47 && column <= 78))));
  const body = restoredGeneration ? extractPixels(restoredGeneration, select((column, row, pixel) => !headRegion[pixel] && !headSelection[pixel])) : sourceBody;
  const head = restoredGeneration ? extractPixels(restoredGeneration, headSelection) : null;
  const bodyCleanup = new Uint8Array(size * size);
  if (head && view === 'east') {
    const cleanup = JSON.parse(await readFile(path.join(design, 'east-body-cleanup.json'), 'utf8'));
    for (const [column, row, ...expectedRgba] of cleanup.pixels) {
      const pixel = row * size + column;
      assert.ok(scalpEdit[pixel] && !protectedFace[pixel] && !headSelection[pixel], 'East body cleanup must remain in editable hidden-cloth area');
      assert.deepEqual([...body.subarray(pixel * 4, pixel * 4 + 4)], expectedRgba, 'East cleanup source remnant changed');
      body.fill(0, pixel * 4, pixel * 4 + 4);
      bodyCleanup[pixel] = 1;
    }
    report.sources[view].bodyCleanup = { mask: 'masks/east-body-cleanup.png', pixels: cleanup.pixels.length, approved: false, protectedOutsideMaskPixel: cleanup.protectedOutsideMaskPixel };
  }
  await png(maskImage(bodyCleanup), path.join(design, `masks/${view}-body-cleanup.png`));
  const scalpCleanup = select((column, row, pixel) => view === 'east' && head && scalp[pixel] && scalpEdit[pixel] && row <= 24 && !head[pixel * 4 + 3]);
  if (head && view === 'east') {
    const beforeCleanup = Buffer.from(head);
    for (let pixel = 0; pixel < size * size; pixel++) if (scalpCleanup[pixel]) {
      const column = pixel % size, row = Math.floor(pixel / size);
      const sampleRow = Math.min(24, row + 7);
      let nearest = -1, distance = Infinity;
      for (let sampleY = 19; sampleY <= 24; sampleY++) for (let sampleX = 56; sampleX <= 75; sampleX++) {
        const candidate = sampleY * size + sampleX;
        if (beforeCleanup[candidate * 4 + 3] && !protectedFace[candidate]) {
          const candidateDistance = Math.abs(sampleX - column) * 4 + Math.abs(sampleY - sampleRow);
          if (candidateDistance < distance) { nearest = candidate; distance = candidateDistance; }
        }
      }
      assert.ok(nearest >= 0, 'East scalp cleanup requires existing generated skin pixels');
      beforeCleanup.copy(head, pixel * 4, nearest * 4, nearest * 4 + 4);
    }
  }
  await png(maskImage(scalpCleanup), path.join(design, `masks/${view}-scalp-cleanup.png`));
  await png(maskImage(neckConnector), path.join(design, `masks/${view}-neck-connector.png`));
  if (head && view !== 'south') for (let pixel = 0; pixel < size * size; pixel++) if (neckConnector[pixel]) restoredGeneration.copy(body, pixel * 4, pixel * 4, pixel * 4 + 4);
  if (head && view === 'south') for (let pixel = 0; pixel < size * size; pixel++) if (neckConnector[pixel]) {
    const column = pixel % size;
    const sample = (35 * size + Math.max(61, Math.min(66, column))) * 4;
    source.copy(body, pixel * 4, sample, sample + 4);
  }
  let protectedPixelsVerified = 0;
  if (head) for (let pixel = 0; pixel < size * size; pixel++) if (protectedFace[pixel]) {
    assert.deepEqual(head.subarray(pixel * 4, pixel * 4 + 4), source.subarray(pixel * 4, pixel * 4 + 4), `${view}: restored face RGBA`);
    protectedPixelsVerified++;
  }
  let neckContactPixels = 0;
  if (head) for (let pixel = 0; pixel < size * size; pixel++) if (head[pixel * 4 + 3]) {
    assert.ok(protectedFace[pixel] || scalpEdit[pixel], `${view}: head cannot copy old source hair`);
    const column = pixel % size, row = Math.floor(pixel / size);
    if ([[column - 1, row], [column + 1, row], [column, row - 1], [column, row + 1]].some(([adjacentX, adjacentY]) => adjacentX >= 0 && adjacentX < size && adjacentY >= 0 && adjacentY < size && body[(adjacentY * size + adjacentX) * 4 + 3])) neckContactPixels++;
  }
  if (head) assert.ok(neckContactPixels >= 3, `${view}: head must physically join body neck in source coordinates`);
  let finalUnmaskedPixelsVerified = 0;
  const headAndBody = head ? compose([body, head]) : null;
  if (headAndBody) for (let pixel = 0; pixel < size * size; pixel++) if (!scalpEdit[pixel] && !neckConnector[pixel]) {
    assert.deepEqual(headAndBody.subarray(pixel * 4, pixel * 4 + 4), source.subarray(pixel * 4, pixel * 4 + 4), `${view}: final composite outside all edit masks`);
    finalUnmaskedPixelsVerified++;
  }
  for (let pixel = 0; pixel < size * size; pixel++) {
    assert.ok(!body[pixel * 4 + 3] || !headRegion[pixel] || neckConnector[pixel], `${view}: body must contain no head-region pixels except attached neck`);
    assert.ok(!body[pixel * 4 + 3] || !protectedFace[pixel], `${view}: body must contain no exposed head skin`);
    if (!scalpEdit[pixel] && !protectedFace[pixel] && !neckConnector[pixel]) assert.deepEqual(body.subarray(pixel * 4, pixel * 4 + 4), source.subarray(pixel * 4, pixel * 4 + 4), `${view}: protected outfit RGBA`);
  }
  const url = filename => `/assets/head-proof/${view}/${filename}.png`;
  const asset = async (filename, data) => png(data, path.join(output, view, `${filename}.png`));
  await asset('source', source);
  await asset('body', body);
  if (head) await asset('head', head);
  else coverage.missingAssets.push(url('head'));
  if (head && view === 'north' && await exists(path.join(design, 'jobs/short-north-submit.json'))) {
    const correctionInput = await rgba(path.join(design, 'source-edits/north-short-correction-input.png'));
    assert.deepEqual(correctionInput.data, head, 'North correction must target the unchanged independent head');
  }
  if (head) {
    await png(head, path.join(design, `source-edits/${view}-head-only.png`));
    const submittedSelection = select((column, row, pixel) => protectedFace[pixel] || ((headRegion[pixel] || scalp[pixel]) && !neckConnector[pixel]));
    const submittedHead = await exists(path.join(design, `jobs/short-${view}-submit.json`)) ? extractPixels(restoredGeneration, submittedSelection) : head;
    await png(submittedHead, path.join(design, `source-edits/${view}-short-submitted-head-only.png`));
    const hairEdit = select((column, row, pixel) => shortEdit[pixel] && !protectedFace[pixel]);
    await png(maskImage(hairEdit), path.join(design, `masks/${view}-short-head-only.png`));
    const hairPrompt = {
      description: `Only add a COMPLETE SHORT layered silver hairstyle to this original Shaman ${view === 'south' ? 'FRONT' : view === 'east' ? 'RIGHT SIDE PROFILE' : 'BACK'} head. The source is head-only on its original native128 transparent canvas, NOT a full body. Keep head scale, position, face and ears EXACT. Paint a coherent short textured crop with a rounded full cap, short layered tapered locks, asymmetrical swept fringe, clean finished nape. Match existing warm outlined detailed pixel art and original pale silver/ivory hair shading; four material light levels. This is a genuinely authored complete hairstyle, not a cutout of long hair. Hair entirely within the white mask; black face/ears are protected. Fully cover the upper bald scalp with connected hair, but do not paint skin or repaint face. NO long tail, braid, ponytail, bow, ribbon, feathers, accessories, crown, beard, torso or clothes. Transparent background and transparent below hair. Return only NEW HAIR pixels on a separate changes layer, no scalp pixels.`,
      image_base64: (await readFile(path.join(design, `source-edits/${view}-short-submitted-head-only.png`))).toString('base64'),
      mask_image_base64: (await readFile(path.join(design, `masks/${view}-short-head-only.png`))).toString('base64'),
      crop_to_mask: true, no_background: true, output_method: 'New layer with changes', seed: 510 + views.indexOf(view)
    };
    await writeFile(path.join(design, `prompts/short-${view}.json`), JSON.stringify(hairPrompt, null, 2) + '\n');
  }
  const faceMask = Buffer.alloc(size * size * 4);
  for (let pixel = 0; pixel < size * size; pixel++) if (protectedFace[pixel]) faceMask.set([255, 255, 255, 255], pixel * 4);
  await asset('faceMask', faceMask);
  const crownNative = Buffer.alloc(size * size * 4);
  let crownBounds = { left: crown.info.width, top: crown.info.height, right: 0, bottom: 0 };
  for (let row = 0; row < crown.info.height; row++) for (let column = 0; column < crown.info.width; column++) if (crown.data[(row * crown.info.width + column) * 4 + 3]) {
    crownBounds.left = Math.min(crownBounds.left, column); crownBounds.right = Math.max(crownBounds.right, column);
    crownBounds.top = Math.min(crownBounds.top, row); crownBounds.bottom = Math.max(crownBounds.bottom, row);
  }
  const crownCrop = await sharp(crownBytes).extract({ left: crownBounds.left, top: crownBounds.top, width: crownBounds.right - crownBounds.left + 1, height: crownBounds.bottom - crownBounds.top + 1 }).png().toBuffer();
  const crownScaled = await sharp(crownCrop).resize({ width: definition.crownWidth, kernel: 'nearest' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const crownScale = definition.crownWidth / (crownBounds.right - crownBounds.left + 1);
  const pivot = { x: Math.round((definition.crownPivot.x - crownBounds.left) * crownScale), y: Math.round((definition.crownPivot.y - crownBounds.top) * crownScale) };
  const crownPlacement = { x: definition.crownSeat.x - pivot.x, y: definition.crownSeat.y - pivot.y };
  let removedCrownFacePixels = 0;
  let crownClippedPixels = 0;
  for (let row = 0; row < crownScaled.info.height; row++) for (let column = 0; column < crownScaled.info.width; column++) {
    const offset = (row * crownScaled.info.width + column) * 4;
    if (!crownScaled.data[offset + 3]) continue;
    const destinationX = column + crownPlacement.x, destinationY = row + crownPlacement.y;
    if (destinationX < 0 || destinationY < 0 || destinationX >= size || destinationY >= size) { crownClippedPixels++; continue; }
    const pixel = destinationY * size + destinationX;
    if (protectedFace[pixel]) { removedCrownFacePixels++; continue; }
    crownScaled.data.copy(crownNative, pixel * 4, offset, offset + 4);
  }
  for (let pixel = 0; pixel < size * size; pixel++) assert.ok(!crownNative[pixel * 4 + 3] || !protectedFace[pixel], `${view}: crown intersects face mask`);
  assert.equal(crownClippedPixels, 0, `${view}: crown clipped by native canvas`);
  await asset('crown', crownNative);
  const hairstyles = {};
  for (const style of manifest.hairstyles) {
    let hairSource = source;
    let selection = style.id === 'original' ? originalHair : select((column, row, pixel) => originalHair[pixel] && shortEdit[pixel]);
    let authorship = style.id === 'original' ? 'exact original source' : 'temporary source crop';
    const hairResultFile = path.join(design, `jobs/short-${view}-result.json`);
    if (style.id === 'short' && await exists(hairResultFile)) {
      const result = JSON.parse(await readFile(hairResultFile, 'utf8'));
      const image = result.result.content.find(item => item.type === 'image' && item.mimeType === 'image/png');
      if (image) {
        const bytes = Buffer.from(image.data, 'base64');
        await writeFile(path.join(design, `raw/short-${view}.png`), bytes);
        const generated = await rgba(path.join(design, `raw/short-${view}.png`));
        assert.equal(generated.info.width, size);
        assert.equal(generated.info.height, size);
        hairSource = generated.data;
        for (let pixel = 0; pixel < size * size; pixel++) if (!shortEdit[pixel]) assert.equal(hairSource[pixel * 4 + 3], 0, `${view}: changes-only hair outside mask`);
        if (view === 'north') {
          const correctionMask = await rgba(path.join(design, 'masks/north-short-correction-head-only.png'));
          for (let pixel = 0; pixel < size * size; pixel++) if (correctionMask.data[pixel * 4] !== 255) assert.equal(hairSource[pixel * 4 + 3], 0, 'North correction covers protected ear/neck or leaves its mask');
          const receipt = JSON.parse(await readFile(path.join(design, 'jobs/short-north-submit.json'), 'utf8')).result.structuredContent;
          report.sources[view].shortCorrection = { jobId: receipt.job_id, rawPngSha256: hash(bytes), request: 'prompts/short-north-correction-request.json', requestSha256: hash(await readFile(path.join(design, 'prompts/short-north-correction-request.json'))), mask: 'masks/north-short-correction-head-only.png', input: 'source-edits/north-short-correction-input.png', chargedGenerations: result.result.structuredContent.charged_generations, protectedEarNeckOverlap: 0, approved: false };
        }
        selection = select((column, row, pixel) => shortEdit[pixel] && !protectedFace[pixel] && hairSource[pixel * 4 + 3]);
        authorship = 'PixelLab head-only changes layer, reviewed extraction mask';
        await sharp(bytes).resize(768, 768, { kernel: 'nearest' }).png().toFile(path.join(design, `raw/short-${view}-zoom.png`));
      }
    }
    if (style.id === 'short' && view === 'north' && authorship !== 'PixelLab head-only changes layer, reviewed extraction mask') {
      const authored = JSON.parse(await readFile(path.join(design, 'north-short-authored.json'), 'utf8'));
      hairSource = Buffer.alloc(size * size * 4);
      selection = select((column, row) => authored.rows.some(([selectedRow, left, right]) => row === selectedRow && column >= left && column <= right));
      const materialPixel = (column, row) => {
        const offset = (row * size + column) * 4;
        return source[offset + 3] && !(source[offset] > source[offset + 1] * 1.35 && source[offset] > source[offset + 2] * 1.2);
      };
      for (let pixel = 0; pixel < size * size; pixel++) if (selection[pixel]) {
        const column = pixel % size, row = Math.floor(pixel / size);
        const texture = authored.textureRows.find(([top, bottom]) => row >= top && row <= bottom);
        let sampleX = column, sampleY = row + texture[2];
        if (!materialPixel(sampleX, sampleY)) {
          const rectangle = authored.fallbackSourceRect;
          let closest = Infinity;
          for (let candidateY = rectangle.top; candidateY <= rectangle.bottom; candidateY++) for (let candidateX = rectangle.left; candidateX <= rectangle.right; candidateX++) if (materialPixel(candidateX, candidateY)) {
            const distance = Math.abs(candidateX - column) * 4 + Math.abs(candidateY - sampleY);
            if (distance < closest) { closest = distance; sampleX = candidateX; sampleY = candidateY; }
          }
          assert.ok(Number.isFinite(closest), 'Authored short cap requires real source hair shading');
        }
        source.copy(hairSource, pixel * 4, (sampleY * size + sampleX) * 4, (sampleY * size + sampleX) * 4 + 4);
      }
      authorship = 'manually completed native source-texture short cap; no generation';
      await png(hairSource, path.join(design, 'source-edits/north-short-authored-uncolored.png'));
    }
    await png(extractPixels(hairSource, selection), path.join(design, `source-edits/${view}-${style.id}-uncolored.png`));
    await png(maskImage(selection), path.join(design, `masks/${view}-${style.id}-hair-extraction.png`));
    const backSelection = select((column, row, pixel) => view !== 'north' && style.id === 'original' && selection[pixel] && !headSelection[pixel] && definition.hairBackRegions.some(polygon => inside(column + .5, row + .5, polygon)));
    const frontSelection = select((column, row, pixel) => selection[pixel] && !backSelection[pixel]);
    const front = neutralHair(extractPixels(hairSource, frontSelection));
    const back = neutralHair(extractPixels(hairSource, backSelection));
    const rawHair = extractPixels(hairSource, selection);
    const neutral = compose([back, front]);
    const hairMaterial = select((column, row, pixel) => neutral[pixel * 4 + 3] && neutral[pixel * 4] === neutral[pixel * 4 + 1] && neutral[pixel * 4] === neutral[pixel * 4 + 2] && [48,104,168,232].includes(neutral[pixel * 4]));
    const fixedMaterial = select((column, row, pixel) => neutral[pixel * 4 + 3] && !hairMaterial[pixel]);
    await png(maskImage(hairMaterial), path.join(design, `masks/${view}-${style.id}-neutral-material.png`));
    await png(extractPixels(rawHair, fixedMaterial), path.join(design, `source-edits/${view}-${style.id}-fixed-material.png`));
    for (let pixel = 0; pixel < size * size; pixel++) if (fixedMaterial[pixel]) assert.deepEqual(neutral.subarray(pixel * 4, pixel * 4 + 4), rawHair.subarray(pixel * 4, pixel * 4 + 4), `${view}/${style.id}: fixed crimson material changed`);
    let upperScalpPixelsVerified = 0;
    if (style.id === 'short' && head) for (let row = 16; row <= 21; row++) for (let column = view === 'east' ? 58 : 56; column <= 71; column++) {
      const pixel = row * size + column;
      if (head[pixel * 4 + 3] && !protectedFace[pixel]) {
        assert.ok(neutral[pixel * 4 + 3], `${view}: short crop leaves bald upper scalp at ${column},${row}`);
        upperScalpPixelsVerified++;
      }
    }
    await asset(`${style.id}-front`, front);
    await asset(`${style.id}-back`, back);
    style.views[view] = { front: url(`${style.id}-front`), back: url(`${style.id}-back`) };
    hairstyles[style.id] = { front, back, authorship, bounds: bounds(neutral), upperScalpPixelsVerified, fixedMaterialPixels: fixedMaterial.reduce((sum, value) => sum + value, 0) };
    const pixels = selection.reduce((sum, selected, pixel) => sum + Number(Boolean(selected && hairSource[pixel * 4 + 3])), 0);
    assert.ok(pixels > 40, `${view}/${style.id}: hair must contain actual art`);
    for (let pixel = 0; pixel < size * size; pixel++) assert.ok(!protectedFace[pixel] || (!front[pixel * 4 + 3] && !back[pixel * 4 + 3]), `${view}/${style.id}: hair covers protected face`);
  }
  const originalSilhouette = compose([hairstyles.original.back, hairstyles.original.front]);
  const shortSilhouette = compose([hairstyles.short.back, hairstyles.short.front]);
  let silhouetteDifference = 0;
  for (let pixel = 0; pixel < size * size; pixel++) if (Boolean(originalSilhouette[pixel * 4 + 3]) !== Boolean(shortSilhouette[pixel * 4 + 3])) silhouetteDifference++;
  assert.ok(silhouetteDifference > 100, `${view}: short must be a different silhouette, not a recolor`);
  manifest.views[view] = { neck: definition.neck, crownSeat: definition.crownSeat, body: url('body'), head: url('head'), source: url('source'), faceMask: url('faceMask'), crown: url('crown'), order };
  coverage.views[view] = { head: head ? 'reconstructed-unapproved' : 'MISSING', body: head ? 'headless-reconstructed-unapproved' : 'headless-extraction-hidden-cloth-MISSING', hair: Object.fromEntries(Object.entries(hairstyles).map(([id, hair]) => [id, { authorship: hair.authorship, bounds: hair.bounds, upperScalpPixelsVerified: hair.upperScalpPixelsVerified, fixedMaterialPixels: hair.fixedMaterialPixels }])), protectedFacePixels: protectedFace.reduce((sum, value) => sum + value, 0), protectedPixelsVerified, exactPartitionReconstruction: true, neckContactPixels, finalUnmaskedPixelsVerified, headBounds: head ? bounds(head) : null, bodyBounds: bounds(body), crownFaceOverlap: 0, crownClippedPixels, removedCrownFacePixels, crownBounds, crownSourceSize: { width: crown.info.width, height: crown.info.height }, crownPivot: definition.crownPivot, crownPlacement, silhouetteDifference };
  if (head) for (const style of manifest.hairstyles) for (const palette of manifest.palettes) {
    const remap = data => {
      const target = Buffer.from(data);
      const stops = palette.colors.map(color => [Number.parseInt(color.slice(1, 3), 16), Number.parseInt(color.slice(3, 5), 16), Number.parseInt(color.slice(5, 7), 16)]);
      for (let pixel = 0; pixel < size * size; pixel++) {
        const offset = pixel * 4;
        if (!target[offset + 3]) continue;
        const index = target[offset] === target[offset + 1] && target[offset] === target[offset + 2] ? [48, 104, 168, 232].indexOf(target[offset]) : -1;
        if (index >= 0) target.set(stops[index], offset);
      }
      return target;
    };
    palettePreviews[view].push(compose([remap(hairstyles[style.id].back), body, head, remap(hairstyles[style.id].front)]));
  }
  const previewHead = head ?? sourceFace;
  const originalComposed = compose([hairstyles.original.back, body, previewHead, hairstyles.original.front]);
  const shortComposed = compose([hairstyles.short.back, body, previewHead, hairstyles.short.front]);
  const columns = [source, body, previewHead, compose([body, previewHead]), originalComposed, compose([originalComposed, crownNative]), shortComposed, compose([shortComposed, crownNative])];
  previewRows.push(columns);
  await png(compose([body, previewHead]), path.join(design, `previews/${view}-head-body-${head ? 'candidate' : 'INCOMPLETE'}.png`));
  for (const [id, hair] of Object.entries(hairstyles)) {
    const headPreview = compose([hair.back, previewHead, hair.front]);
    const crowned = compose([headPreview, crownNative]);
    await png(headPreview, path.join(design, `previews/${view}-${id}-head-native.png`));
    await png(crowned, path.join(design, `previews/${view}-${id}-crowned-head-native.png`));
    await sharp(crowned, { raw: { width: size, height: size, channels: 4 } }).extract({ left: 36, top: 0, width: 56, height: 48 }).resize(448, 384, { kernel: 'nearest' }).png().toFile(path.join(design, `previews/${view}-${id}-crown-seat-8x.png`));
  }
  const decomposed = [body, previewHead, hairstyles.original.back, hairstyles.original.front, hairstyles.short.back, hairstyles.short.front, crownNative];
  const decomposedLabels = ['BODY / NECK', 'BARE HEAD', 'ORIGINAL BACK', 'ORIGINAL FRONT', 'SHORT BACK', 'SHORT FRONT', 'CROWN'];
  const decomposedWidth = size * decomposed.length;
  await sharp({ create: { width: decomposedWidth, height: size, channels: 4, background: '#28383a' } }).composite(decomposed.map((data, index) => ({ input: data, raw: { width: size, height: size, channels: 4 }, left: index * size, top: 0 }))).png().toFile(path.join(design, `previews/${view}-decomposed-native.png`));
  const decomposedSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${decomposedWidth}" height="${size}">${decomposedLabels.map((label, index) => `<text x="${index * size + 4}" y="10" fill="white" font-size="8">${label}</text>`).join('')}</svg>`);
  const decomposedLabelled = await sharp(path.join(design, `previews/${view}-decomposed-native.png`)).composite([{ input: decomposedSvg }]).png().toBuffer();
  await sharp(decomposedLabelled).resize(decomposedWidth * 2, size * 2, { kernel: 'nearest' }).png().toFile(path.join(design, `previews/${view}-decomposed-2x.png`));
}
await writeFile(path.join(design, 'source-retention.json'), JSON.stringify(report, null, 2) + '\n');
await mkdir(output, { recursive: true });
await writeFile(path.join(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
await writeFile(path.join(output, 'coverage.json'), JSON.stringify(coverage, null, 2) + '\n');
await writeFile(path.join(design, 'validation.json'), JSON.stringify(coverage, null, 2) + '\n');
const previewWidth = size * 8, previewHeight = size * 3;
const contact = Buffer.alloc(previewWidth * previewHeight * 4);
for (let row = 0; row < previewHeight; row++) for (let column = 0; column < previewWidth; column++) contact.set((Math.floor(row / 8) + Math.floor(column / 8)) % 2 ? [33, 43, 45, 255] : [44, 56, 58, 255], (row * previewWidth + column) * 4);
const inputs = previewRows.flatMap((columns, row) => columns.map((data, column) => ({ input: data, raw: { width: size, height: size, channels: 4 }, left: column * size, top: row * size })));
await mkdir(path.join(design, 'previews'), { recursive: true });
await sharp(contact, { raw: { width: previewWidth, height: previewHeight, channels: 4 } }).composite(inputs).png().toFile(path.join(design, 'previews/contact-native.png'));
const columnNames = ['SOURCE', 'HEADLESS BODY', 'HEAD', 'HEAD + BODY', 'ORIGINAL', 'ORIGINAL + CROWN', 'SHORT', 'SHORT + CROWN'];
const labels = columnNames.map((name, column) => `<text x="${column * size + 4}" y="10" fill="white" font-size="8">${name}</text>`);
for (let row = 0; row < views.length; row++) labels.push(`<text x="4" y="${(row + 1) * size - 4}" fill="#a9e7c8" font-size="9">${views[row].toUpperCase()} - VISUAL APPROVAL PENDING</text>`);
const labelsSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${previewWidth}" height="${previewHeight}">${labels.join('')}</svg>`);
await sharp(path.join(design, 'previews/contact-native.png')).composite([{ input: labelsSvg }]).png().toFile(path.join(design, 'previews/contact-labelled-native.png'));
await sharp(path.join(design, 'previews/contact-labelled-native.png')).resize(previewWidth * 2, previewHeight * 2, { kernel: 'nearest' }).png().toFile(path.join(design, 'previews/contact-2x.png'));
for (const view of views) if (palettePreviews[view].length) {
  const paletteWidth = size * manifest.palettes.length;
  const paletteHeight = size * manifest.hairstyles.length;
  const tiles = palettePreviews[view].map((data, index) => ({ input: data, raw: { width: size, height: size, channels: 4 }, left: index % manifest.palettes.length * size, top: Math.floor(index / manifest.palettes.length) * size }));
  await sharp({ create: { width: paletteWidth, height: paletteHeight, channels: 4, background: '#28383a' } }).composite(tiles).png().toFile(path.join(design, `previews/${view}-palettes-native.png`));
  const paletteSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${paletteWidth}" height="${paletteHeight}">${manifest.palettes.map((palette, index) => `<text x="${index * size + 4}" y="10" fill="white" font-size="8">${palette.id.toUpperCase()}</text>`).join('')}<text x="4" y="124" fill="white" font-size="8">${view.toUpperCase()} ORIGINAL / REVIEW PENDING</text><text x="4" y="252" fill="white" font-size="8">${view.toUpperCase()} SHORT / REVIEW PENDING</text></svg>`);
  const paletteLabelled = await sharp(path.join(design, `previews/${view}-palettes-native.png`)).composite([{ input: paletteSvg }]).png().toBuffer();
  await sharp(paletteLabelled).resize(paletteWidth * 2, paletteHeight * 2, { kernel: 'nearest' }).png().toFile(path.join(design, `previews/${view}-palettes-2x.png`));
}
const referencedUrls = views.flatMap(view => {
  const data = manifest.views[view];
  return [data.body, data.head, data.source, data.faceMask, data.crown, ...manifest.hairstyles.flatMap(style => [style.views[view].front, style.views[view].back])];
});
const outputHashes = {};
for (const url of referencedUrls) {
  assert.ok(url.startsWith('/assets/head-proof/'));
  const filename = path.join(publicRoot, url);
  if (!(await exists(filename))) { assert.ok(coverage.missingAssets.includes(url), `Unexpected missing asset: ${url}`); continue; }
  const image = await rgba(filename);
  assert.equal(image.info.width, size, `${url}: native width`);
  assert.equal(image.info.height, size, `${url}: native height`);
  assert.equal(image.info.channels, 4, `${url}: RGBA channels`);
  assert.ok(image.data.some((value, index) => index % 4 === 3 && value === 0), `${url}: transparent background required`);
  outputHashes[url] = hash(await readFile(filename));
}
await writeFile(path.join(design, 'output-hashes.json'), JSON.stringify(outputHashes, null, 2) + '\n');
coverage.complete = Object.keys(outputHashes).length === 27 && coverage.missingAssets.length === 0;
coverage.completeMeans = 'Every required runtime PNG exists at native128; not visual approval.';
coverage.approved = false;
coverage.stage = 'three-view';
coverage.additionalChargedGenerations = coverage.chargedGenerations - 6;
coverage.priorAdditionalChargedGenerations = coverage.additionalChargedGenerations - coverage.correctionChargedGenerations;
await writeFile(path.join(output, 'coverage.json'), JSON.stringify(coverage, null, 2) + '\n');
await writeFile(path.join(design, 'validation.json'), JSON.stringify(coverage, null, 2) + '\n');
console.log('PASS: three exact frame-0 RGBA extractions; original strips and crowns retained.');
console.log(`PASS: ${Object.keys(outputHashes).length}/27 referenced PNGs verified native128 RGBA with transparent background.`);
console.log(`REVIEW PENDING: ${coverage.missingAssets.length} missing scalp assets; ${coverage.chargedGenerations}/${coverage.generationCap} credits charged (internal cap); ${coverage.pendingJobs.length} pending jobs.`);