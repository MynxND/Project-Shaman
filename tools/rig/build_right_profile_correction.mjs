import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../../', import.meta.url));
const require = createRequire(new URL('../../apps/client/package.json', import.meta.url));
const sharp = createRequire(require.resolve('next'))('sharp');
const designRelative = 'docs/design/character-turnaround/right90-manual-01';
const publicRelative = 'apps/client/public/assets/character-turnaround/right90-manual-01';
const design = path.join(root, designRelative);
const output = path.join(root, publicRelative);
const size = 128;
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const exists = async filename => { try { await access(filename); return true; } catch { return false; } };
const paths = {
  front: 'docs/design/head-proof/source/south.png',
  before: 'docs/design/character-turnaround/rotation-experiment-01/raw/east.png',
  originalRight: 'apps/client/public/assets/character-turnaround/east-original.png',
  sourceHair: 'docs/design/head-proof/source-edits/east-hair-exact.png',
  sourceHairMask: 'docs/design/head-proof/masks/east-hair-original.png',
  protectedProfile: 'docs/design/character-turnaround/right90-hair-repair-01/protected-profile.png'
};
const bytes = {};
const pixels = {};
for (const [name, relative] of Object.entries(paths)) {
  bytes[name] = await readFile(path.join(root, relative));
  const decoded = await sharp(bytes[name]).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  assert.equal(decoded.info.width, size, name);
  assert.equal(decoded.info.height, size, name);
  pixels[name] = decoded.data;
}
const frontStrip = await readFile(path.join(root, 'apps/client/public/assets/rig-v2/male/base/idle-south.png'));
assert.ok((await sharp(frontStrip).extract({ left: 0, top: 0, width: size, height: size }).ensureAlpha().raw().toBuffer()).equals(pixels.front));
const after = Buffer.from(pixels.before);
const selection = new Uint8Array(size * size);
const operations = [];
const removalRows = [
  [26, 39, 33, 57], [40, 40, 33, 55], [41, 42, 33, 54],
  [43, 44, 33, 53], [45, 47, 33, 52], [48, 54, 33, 51],
  [55, 59, 33, 50], [60, 63, 33, 49], [64, 64, 33, 43],
  [65, 66, 33, 44], [67, 74, 33, 43], [75, 77, 33, 38]
];
const bodyProtectedRows = [
  [26, 39, 58, 127], [40, 40, 56, 127], [41, 42, 55, 127],
  [43, 44, 54, 127], [45, 47, 53, 127], [48, 54, 52, 127],
  [55, 59, 51, 127], [60, 63, 50, 127], [64, 64, 44, 127],
  [65, 66, 45, 127], [67, 74, 44, 127], [75, 77, 39, 127], [78, 127, 0, 127]
];
const bodyProtected = pixel => {
  const column = pixel % size, row = Math.floor(pixel / size);
  return bodyProtectedRows.some(([top, bottom, left, right]) => row >= top && row <= bottom && column >= left && column <= right);
};
const protectedPixel = pixel => pixels.protectedProfile[pixel * 4] === 255;
const removable = (column, row) => removalRows.some(([top, bottom, left, right]) => row >= top && row <= bottom && column >= left && column <= right);
const write = (column, row, rgba, provenance) => {
  const pixel = row * size + column;
  assert.ok(!protectedPixel(pixel), `Protected profile at ${column},${row}`);
  assert.ok(!bodyProtected(pixel), `Protected body at ${column},${row}`);
  selection[pixel] = 1;
  after.set(rgba, pixel * 4);
  operations.push({ destination: [column, row], rgba: [...rgba], ...provenance });
};
for (let row = 26; row <= 77; row++) for (let column = 33; column <= 57; column++) {
  const pixel = row * size + column;
  if (!removable(column, row) || protectedPixel(pixel) || !pixels.before[pixel * 4 + 3]) continue;
  write(column, row, [0, 0, 0, 0], { region: 'loose-rear-lock-removal', method: 'authored-native-scanline', source: 'transparent-background', provisional: true });
}
for (let row = 6; row <= 76; row++) for (let column = 20; column <= 57; column++) {
  const pixel = row * size + column;
  const offset = pixel * 4;
  if (!pixels.sourceHair[offset + 3] || pixels.sourceHairMask[offset] !== 255 || protectedPixel(pixel)) continue;
  const region = row < 20 ? 'rear-spikes' : row < 35 ? 'crimson-bow' : 'segmented-tied-tail';
  const nativeAnchorAllowed = row < 26 || removable(column, row) || !pixels.before[offset + 3];
  if (!nativeAnchorAllowed) continue;
  assert.ok(pixels.sourceHair.subarray(offset, offset + 4).equals(pixels.originalRight.subarray(offset, offset + 4)), 'Extracted hair must be owned original RGBA');
  write(column, row, pixels.sourceHair.subarray(offset, offset + 4), { region, method: 'exact-native-source-mask', source: paths.originalRight, sourcePixel: [column, row], transform: 'none' });
}
const bounds = (data, topRow = 0, bottomRow = 127) => {
  let left = size, top = size, right = -1, bottom = -1, occupied = 0;
  for (let row = topRow; row <= bottomRow; row++) for (let column = 0; column < size; column++) {
    if (!data[(row * size + column) * 4 + 3]) continue;
    left = Math.min(left, column); right = Math.max(right, column);
    top = Math.min(top, row); bottom = Math.max(bottom, row); occupied++;
  }
  return occupied ? { left, top, right, bottom, width: right - left + 1, height: bottom - top + 1, pixels: occupied } : null;
};
const measure = data => ({ silhouette: bounds(data), headBounds: bounds(data, 0, 38), shoulderBounds: bounds(data, 39, 48), torsoBounds: bounds(data, 49, 67), footBounds: bounds(data, 108, 127), observedLowestPixel: bounds(data).bottom, groundEdgeDelta: bounds(data).bottom + 1 - 124 });
const mask = Buffer.alloc(size * size * 4);
const diff = Buffer.alloc(size * size * 4);
const bodyMask = Buffer.alloc(size * size * 4);
const removalMask = Buffer.alloc(size * size * 4);
const sourceMask = Buffer.alloc(size * size * 4);
const sourceLayer = Buffer.alloc(size * size * 4);
for (const operation of operations) {
  const [column, row] = operation.destination, offset = (row * size + column) * 4;
  if (operation.method === 'exact-native-source-mask') {
    sourceMask.set([255, 255, 255, 255], offset);
    sourceLayer.set(operation.rgba, offset);
  } else removalMask.set([255, 255, 255, 255], offset);
}
const overlay = Buffer.from(after);
const changedRows = [];
let changedPixels = 0, addedPixels = 0, clearedPixels = 0, protectedPixels = 0;
for (let row = 0; row < size; row++) {
  const columns = [];
  for (let column = 0; column < size; column++) {
    const pixel = row * size + column, offset = pixel * 4;
    const changed = !after.subarray(offset, offset + 4).equals(pixels.before.subarray(offset, offset + 4));
    mask.set(selection[pixel] ? [255, 255, 255, 255] : [0, 0, 0, 255], offset);
    diff.set(changed ? [255, 255, 255, 255] : [0, 0, 0, 255], offset);
    bodyMask.set(bodyProtected(pixel) ? [255, 255, 255, 255] : [0, 0, 0, 255], offset);
    if (!sourceMask[offset + 3]) sourceMask.set([0, 0, 0, 255], offset);
    if (!removalMask[offset + 3]) removalMask.set([0, 0, 0, 255], offset);
    if (!selection[pixel] || protectedPixel(pixel) || bodyProtected(pixel)) {
      assert.ok(!changed, `Unmasked RGBA changed at ${column},${row}`);
      protectedPixels++;
    }
    if (changed) {
      changedPixels++;
      addedPixels += Number(!pixels.before[offset + 3] && after[offset + 3] > 0);
      clearedPixels += Number(pixels.before[offset + 3] > 0 && !after[offset + 3]);
      columns.push(column);
      overlay.set([40, 220, 180, 255], offset);
    }
  }
  if (columns.length) changedRows.push({ row, columns });
}
assert.ok(changedPixels > 100);
assert.equal(measure(after).groundEdgeDelta, 0);
const nearest = (data, width, height, factor) => {
  const result = Buffer.alloc(width * height * factor * factor * 4);
  for (let row = 0; row < height * factor; row++) for (let column = 0; column < width * factor; column++) {
    const offset = (Math.floor(row / factor) * width + Math.floor(column / factor)) * 4;
    data.copy(result, (row * width * factor + column) * 4, offset, offset + 4);
  }
  return result;
};
const contact = Buffer.alloc(size * 4 * size * 4);
for (const [index, frame] of [pixels.front, pixels.originalRight, pixels.before, after].entries()) {
  for (let row = 0; row < size; row++) frame.copy(contact, (row * size * 4 + index * size) * 4, row * size * 4, (row + 1) * size * 4);
}
await mkdir(design, { recursive: true });
await mkdir(output, { recursive: true });
const saveBytes = async (name, data) => {
  await writeFile(path.join(design, name), data);
  await writeFile(path.join(output, name), data);
};
const savePng = async (name, data, width = size, height = size) => saveBytes(name, await sharp(data, { raw: { width, height, channels: 4 } }).png().toBuffer());
await saveBytes('front.png', bytes.front);
await saveBytes('before.png', bytes.before);
await saveBytes('original-right.png', bytes.originalRight);
await savePng('after.png', after);
await savePng('edit-selection.png', mask);
await savePng('pixel-diff.png', diff);
await savePng('protected-body.png', bodyMask);
await saveBytes('protected-profile.png', bytes.protectedProfile);
await savePng('loose-hair-removal-mask.png', removalMask);
await savePng('original-hair-source-mask.png', sourceMask);
await savePng('original-hair-source-layer.png', sourceLayer);
await savePng('mask-overlay-2x.png', nearest(overlay, size, size, 2), 256, 256);
await savePng('comparison-native.png', contact, 512, 128);
await savePng('comparison-2x.png', nearest(contact, 512, 128, 2), 1024, 256);
await savePng('after-2x.png', nearest(after, size, size, 2), 256, 256);
await savePng('after-6x.png', nearest(after, size, size, 6), 768, 768);
await savePng('before-6x.png', nearest(pixels.before, size, size, 6), 768, 768);
const prefix = '/assets/character-turnaround/right90-manual-01/';
const masterHead = measure(pixels.front).headBounds;
const afterHead = measure(after).headBounds;
const sourceColors = new Map();
for (const operation of operations) if (operation.method === 'exact-native-source-mask') {
  const color = Buffer.from(operation.rgba).toString('hex');
  if (!sourceColors.has(color)) sourceColors.set(color, { rgba: color, sourcePixel: operation.sourcePixel, source: paths.originalRight });
}
const editedRegions = [...new Set(operations.map(operation => operation.region))].map(region => {
  const writes = operations.filter(operation => operation.region === region);
  return { region, method: writes[0].method, source: writes[0].source, writeCount: writes.length,
    rows: [...new Set(writes.map(operation => operation.destination[1]))].map(row => ({ row, columns: writes.filter(operation => operation.destination[1] === row).map(operation => operation.destination[0]) })) };
});
const nativeRootContacts = [];
for (let row = 20; row <= 34; row++) {
  if (sourceLayer[(row * size + 57) * 4 + 3] && pixels.before[(row * size + 58) * 4 + 3]) nativeRootContacts.push([[57, row], [58, row]]);
}
assert.ok(nativeRootContacts.length > 0, 'Source rear-hair edge must touch the unchanged rotation scalp at native coordinates');
const report = {
  version: 1, status: 'manual-right90-proposal-awaiting-review', approved: false,
  candidate: prefix + 'after.png', native: true, canvas: { width: size, height: size, origin: { x: 64, y: 124 }, footBaseline: 124 },
  sources: Object.fromEntries(Object.entries(paths).map(([name, relative]) => [name, { path: relative, pngSha256: hash(bytes[name]), rgbaSha256: hash(pixels[name]) }])),
  sourceStripSha256: hash(frontStrip), afterPngSha256: hash(await readFile(path.join(design, 'after.png'))), afterRgbaSha256: hash(after),
  changedPixels, addedPixels, clearedPixels, selectedPixels: selection.reduce((total, selected) => total + selected, 0), protectedPixels,
  allUnmaskedRgbaExact: true, allProtectedProfileRgbaExact: true, allProtectedBodyRgbaExact: true, transformations: [], changedRows, operations,
  removalRows, bodyProtectedRows, editedRegions, paletteSource: { method: 'owned-original-exact-RGBA-no-recolor', colors: [...sourceColors.values()], manualContourPaint: [], clearRgba: [0, 0, 0, 0] },
  nativeRootContacts, measurements: { front: measure(pixels.front), originalRight: measure(pixels.originalRight), before: measure(pixels.before), after: measure(after) },
  ratios: { headAssemblyWidthToFront: afterHead.width / masterHead.width, headAssemblyHeightToFront: afterHead.height / masterHead.height,
    silhouetteHeightToFront: measure(after).silhouette.height / measure(pixels.front).silhouette.height,
    headTopDeltaFromFront: afterHead.top - masterHead.top, footBaselineDeltaFromFront: 0, nativePixelDensity: 1, independentScaling: false,
    meaning: 'Occupied head assembly bands include bows/hair, not detected skulls. Ratios describe bounds; no scale was applied.' },
  review: { approved: false, productionReady: false, stop: true, scope: 'right-only', frontApprovedByExplicitUserRequest: true, limitations: [
    'Hair-only local reference draft. Rotation body keeps its known costume construction differences; no outfit-profile correction is claimed.',
    'Hair is projected by retaining a compatible native rear-hair attachment only; the original full head was not transplanted. Bow texture and tail spacing still need user review.',
    'Clothed reference only, not a clean modular body or independent outfit. Equipped registry is unchanged.',
    'Hidden side face identity cannot be verified against the frontal master. Back/left remain blocked.'
  ] },
  visualInspection: { inspected: true, scales: [1, 2, 6], observations: [
    'Crimson rear bow and segmented ivory tail are visible; continuous loose rotation hair was removed.',
    'Profile eye, projecting nose, jaw, ear/neck and unchanged shoulder/sleeve remain visible. No full head overlay.',
    'Two rear spikes retain source texture, while crown/front bangs retain rotation texture; the texture seam needs review.',
    'Rotation coat hem/apron, belt ornament, chest construction and sandal pose are not the original-front costume projection. Production-quality full turnaround is unmet.'
  ], approved: false },
  service: { paidJobsSubmitted: 0, additionalCredits: 0, method: 'local-deterministic-source-pixels', schemaInspection: 'MCP initialize + notifications/initialized + tools/list only; no tools/call',
    schemas: [
      { name: 'inpaint_image_pro_flash', required: ['description'], fields: ['description', 'image_base64', 'image_url', 'source_image_id', 'mask_x', 'mask_y', 'mask_width', 'mask_height', 'mask_image_base64', 'mask_image_url', 'context_image', 'bounding_box', 'crop_to_mask', 'no_background', 'background_removal_task', 'output_method', 'seed', 'project_id'], cropToMaskConst: true, outputMethods: ['New layer with changes', 'Modify current layer, only changes', 'Modify current layer'], readOnlyHint: false },
      { name: 'create_character_pro_flash', firstFrameDirectionConst: 'south', directionsConst: 8, firstFrameInputs: ['source_image_id', 'first_frame_base64', 'first_frame_url'], readOnlyHint: false },
      { name: 'get_pro_flash_capabilities', fields: ['operation', 'width', 'height', 'n_directions'], readOnlyHint: true }
    ], observedLimitations: 'Schema offers reference/mask inputs but no identity or true-profile guarantee. Prior inpaint changed pose/costume; rotation lost hairstyle; later masked repair failed with no output. No retry in this task.' }
};
await saveBytes('provenance.json', Buffer.from(JSON.stringify(report, null, 2) + '\n'));
const rightOnlyReview = {
  front: prefix + 'front.png', originalRight: prefix + 'original-right.png', before: prefix + 'before.png', after: prefix + 'after.png',
  comparisonNative: prefix + 'comparison-native.png', comparison2x: prefix + 'comparison-2x.png', comparisonOrder: ['approved-front', 'original-rig-v2-right', 'raw-rotation-before', 'manual-right-after'],
  editSelection: prefix + 'edit-selection.png', pixelDiff: prefix + 'pixel-diff.png', review: report.review,
  status: report.status, source: { ...report.sources.before, kind: 'archived-PixelLab-front-reference-rotation-raw-not-original-rig-v2' }, provenance: prefix + 'provenance.json', landmarks: { ...report.measurements.after, headBoundsMeaning: 'Native occupied head assembly band y0..38 including bow; not an anatomical skull box.', nativeRootContacts }, origin: report.canvas.origin,
  originalRightSource: report.sources.originalRight, native: true, frontApproval: { approved: true, evidence: 'Explicit user request: original rig-v2 male idle-south frame0 native128 untouched byteexact.' },
  browserEvidence: { native: prefix + 'browser-comparison-native.png', nearest2x: prefix + 'browser-comparison-2x.png', status: 'capture-required' }
};
const screenshotNames = ['browser-comparison-native.png', 'browser-comparison-2x.png'];
const pairNames = ['browser-2x-front-original.png', 'browser-2x-before-after.png'];
if ((await Promise.all(pairNames.map(name => exists(path.join(design, name))))).every(Boolean)) {
  const pairs = [];
  for (const name of pairNames) {
    const pairBytes = await readFile(path.join(design, name));
    const pair = await sharp(pairBytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    assert.equal(pair.info.width, 512);
    pairs.push(pair);
    await writeFile(path.join(output, name), pairBytes);
  }
  const combinedHeight = pairs.reduce((total, pair) => total + pair.info.height, 0);
  const combined = Buffer.concat(pairs.map(pair => pair.data));
  await savePng('browser-comparison-2x.png', combined, 512, combinedHeight);
}
if ((await Promise.all(screenshotNames.map(name => exists(path.join(design, name))))).every(Boolean)) {
  for (const name of screenshotNames) await writeFile(path.join(output, name), await readFile(path.join(design, name)));
  const nativeCapture = await sharp(path.join(design, screenshotNames[0])).metadata();
  const doubledCapture = await sharp(path.join(design, screenshotNames[1])).metadata();
  rightOnlyReview.browserEvidence = { ...rightOnlyReview.browserEvidence, status: 'captured-and-visually-inspected', nativeSpriteDisplay: [128, 128], doubledSpriteDisplay: [256, 256],
    nativeCapture: [nativeCapture.width, nativeCapture.height], doubledCapture: [doubledCapture.width, doubledCapture.height], doubledLayout: 'Two separately scrolled/captured unscaled panel pairs joined by exact screenshot RGBA row concatenation; checker-backed, no screenshot resampling. Wide native/2x PNG sheets remain available.',
    pairScreenshots: pairNames.map(name => prefix + name),
    initialViewerFailure: 'Built-in PNG viewer auto-fit and wide/tall viewport screenshots clipped evidence; replaced by separately scrolled pair captures. No app inspector change.' };
}
await saveBytes('manifest.json', Buffer.from(JSON.stringify({ version: 1, rightOnlyReview }, null, 2) + '\n'));
const nativeLabels = '<div class="labels"><span>Front approved</span><span>Original right</span><span>Rotation before</span><span>Manual after</span></div>';
await saveBytes('review.html', Buffer.from(`<!doctype html><html lang="en"><meta charset="utf-8"><title>Right-only art review</title><style>body{margin:24px;background:#253b38;color:#fff;font:14px sans-serif}section{width:512px;margin:0 0 24px}.labels{display:grid;grid-template-columns:repeat(4,1fr);line-height:24px}.double .labels{grid-template-columns:repeat(2,1fr)}.pair{width:512px;height:256px;overflow:hidden}.second img{position:relative;left:-512px}img{display:block;max-width:none;image-rendering:pixelated;background:repeating-conic-gradient(#bcbcbc 0% 25%,#ededed 0% 50%) 0 0 / 16px 16px}h1{font-size:18px;letter-spacing:0}p{margin:8px 0 16px}</style><h1>Right-only manual proposal, unapproved</h1><p>Clothed reference draft. Body/costume differences unresolved. Native128; no transforms.</p><section class="native">${nativeLabels}<img width="512" height="128" src="comparison-native.png" alt="Four native review sprites"></section><section class="double"><div class="labels"><span>Approved front</span><span>Original rig-v2 right</span></div><div class="pair"><img width="1024" height="256" src="comparison-2x.png" alt="Front and original right, exact 2x"></div><div class="labels"><span>Raw rotation BEFORE</span><span>Manual right AFTER</span></div><div class="pair second"><img width="1024" height="256" src="comparison-2x.png" alt="Rotation before and manual after, exact 2x"></div></section></html>`));
const inspectorFile = path.join(root, 'apps/client/public/assets/character-turnaround/manifest.json');
const inspectorBytes = await readFile(inspectorFile);
const snapshotFile = path.join(design, 'inspector-metadata-before.json');
if (!(await exists(snapshotFile))) await writeFile(snapshotFile, inspectorBytes);
const inspector = JSON.parse(inspectorBytes);
inspector.master = { ...inspector.master, status: 'user-approved-original-front-byte-exact', approval: rightOnlyReview.frontApproval };
inspector.views.south = { ...inspector.views.south, status: 'user-approved-original-front-byte-exact', approval: rightOnlyReview.frontApproval };
inspector.views.east = { ...inspector.views.east, candidate: report.candidate, status: report.status, candidateSource: rightOnlyReview.source, candidateLandmarks: rightOnlyReview.landmarks, candidateReview: report.review };
inspector.rightOnlyReview = rightOnlyReview;
inspector.review = { ...inspector.review, approved: false, stage: report.status, manualRight90: { approved: false, review: prefix + 'manifest.json', productionReady: false, stop: true },
  limitations: (inspector.review.limitations ?? []).filter(limitation => !limitation.startsWith('Current manual right-only:')).concat('Current manual right-only: explicit front approval applies to rig-v2 male idle-south frame0 only. East is a native hair-only proposal, not an approved base; earlier failure statements below/above are retained history, not its current output status.') };
const ledgerFile = path.join(root, 'docs/design/character-turnaround/generation-ledger.json');
const ledgerBytes = await readFile(ledgerFile);
const ledgerSnapshot = path.join(design, 'generation-ledger-before.json');
if (!(await exists(ledgerSnapshot))) await writeFile(ledgerSnapshot, ledgerBytes);
const ledger = JSON.parse(ledgerBytes);
ledger.manualRight90Task = { method: 'local-deterministic-source-pixels', directory: 'right90-manual-01', submittedJobs: 0, additionalCredits: 0, status: report.status, approved: false, review: 'right90-manual-01/manifest.json' };
inspector.generation = ledger;
assert.equal(inspector.views.north.candidate, null); assert.equal(inspector.views.west.candidate, null);
await writeFile(ledgerFile, JSON.stringify(ledger, null, 2) + '\n');
await writeFile(inspectorFile, JSON.stringify(inspector, null, 2) + '\n');
console.log(JSON.stringify({ status: report.status, changedPixels, selectedPixels: report.selectedPixels, protectedPixels, measurements: report.measurements.after, additionalCredits: 0 }, null, 2));