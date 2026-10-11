import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { FOUNDATION_VIEWS, FOUNDATION_PARTS, validateCharacterFoundation } from '../../packages/shared/dist/character-foundation.js';
import { CHARACTER_STATES } from '../../packages/shared/dist/modular-character.js';

const root = fileURLToPath(new URL('../../', import.meta.url));
const sharp = createRequire(createRequire(new URL('../../apps/client/package.json', import.meta.url)).resolve('next'))('sharp');
const design = path.join(root, 'docs/design/character-turnaround/foundation-01');
const output = path.join(root, 'apps/client/public/assets/character-turnaround/foundation-01');
const prefix = '/assets/character-turnaround/foundation-01/';
const size = 128;
const hash = data => createHash('sha256').update(data).digest('hex');
const definitions = JSON.parse(await readFile(path.join(root, 'docs/design/head-proof/masks.json'), 'utf8'));
const rig = JSON.parse(await readFile(path.join(root, 'apps/client/public/assets/rig-v2/manifest.json'), 'utf8'));
const sourcePaths = {
  south: 'docs/design/character-turnaround/right90-manual-01/front.png',
  east: 'docs/design/character-turnaround/right90-manual-01/after.png',
  north: 'apps/client/public/assets/character-turnaround/north-original.png',
  west: 'apps/client/public/assets/character-turnaround/west-original.png'
};
const anchors = {
  south: { neck: { x: 64, y: 38 }, hairRoot: { x: 64, y: 22 }, headgearSeat: { x: 64, y: 16 } },
  east: { neck: { x: 66, y: 38 }, hairRoot: { x: 58, y: 26 }, headgearSeat: { x: 65, y: 15 } },
  north: { neck: { x: 63, y: 41 }, hairRoot: { x: 63, y: 25 }, headgearSeat: { x: 63, y: 15 } },
  west: { neck: { x: 61, y: 38 }, hairRoot: { x: 69, y: 26 }, headgearSeat: { x: 62, y: 15 } }
};
const residualArmRegions = {
  south: [[[26,65],[45,65],[43,89],[27,89]], [[80,65],[99,65],[100,90],[83,90]]],
  east: [[[56,69],[73,69],[73,91],[54,91]]],
  north: [[[27,62],[45,62],[43,87],[28,87]], [[81,62],[98,62],[99,87],[82,87]]],
  west: [[[54,69],[71,69],[73,91],[54,91]]]
};
const inside = (column, row, polygon) => {
  let contained = false;
  for (let current = 0, previous = polygon.length - 1; current < polygon.length; previous = current++) {
    const [currentX, currentY] = polygon[current], [previousX, previousY] = polygon[previous];
    if ((currentY > row) !== (previousY > row) && column < (previousX - currentX) * (row - currentY) / (previousY - currentY) + currentX) contained = !contained;
  }
  return contained;
};
const readPixels = async relative => {
  const bytes = await readFile(path.join(root, relative));
  const decoded = await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { bytes, data: decoded.data, width: decoded.info.width, height: decoded.info.height, relative };
};
await mkdir(design, { recursive: true });
await mkdir(output, { recursive: true });
const save = async (filename, bytes) => {
  await mkdir(path.dirname(path.join(design, filename)), { recursive: true });
  await mkdir(path.dirname(path.join(output, filename)), { recursive: true });
  await writeFile(path.join(design, filename), bytes);
  await writeFile(path.join(output, filename), bytes);
};
const saveJson = async (filename, data) => save(filename, Buffer.from(JSON.stringify(data, null, 2) + '\n'));
const savePng = async (filename, data, width = size, height = size) => save(filename, await sharp(data, { raw: { width, height, channels: 4 } }).png().toBuffer());
const manifest = { version: 1, id: 'medium-male-visible-foundation-01', canvas: { width: size, height: size, foot: { x: 64, y: 124 } }, productionReady: false, layerSemantics: 'visible-source-partition-not-clean-anatomy', views: {}, clips: [] };
const report = { approved: false, paidJobsSubmitted: 0, additionalCredits: 0, inputs: [], views: {}, partitionRule: 'Native-coordinate masks; no palette thresholding, scaling, recoloring, hidden anatomy or sprite mirroring.',
  labels: { bodyVisible: 'Unassigned visible body/arm residual, includes existing wraps. NOT a clean body.', headVisible: 'Visible face/ear/neck residual only. NOT a reconstructed bald head.', hairVisible: 'Existing mask-selected visible hair and bound ties. NOT complete occluded hair.', outfitVisible: 'Visible garment/accessory/footwear candidate partition. NOT independent full clothing.' },
  anchors: { status: 'provisional-native-pixel', coordinates: '128px top-left canvas coordinates; foot is ground edge at y124. These are draft attachment seats, not approved fit.', west: 'Native west artwork is not mirrored; draft mask coordinates reflect the existing east mask only.', animation: 'Archived rig per-frame head/crown anchors are evidence only, never transferred to the corrected static east.' } };
const contact = Buffer.alloc(512 * 128 * 4);
const layerContact = Buffer.alloc(512 * 640 * 4);
const remember = image => report.inputs.push({ path: image.relative, pngSha256: hash(image.bytes), rgbaSha256: hash(image.data) });
const colors = [[0,0,0,255], [75,153,192,255], [229,172,97,255], [156,203,140,255], [203,103,127,255]];
for (const [viewIndex, view] of FOUNDATION_VIEWS.entries()) {
  const source = await readPixels(sourcePaths[view]);
  assert.equal(source.width, size); assert.equal(source.height, size); remember(source);
  const originalStrip = await readPixels(`apps/client/public/assets/rig-v2/male/base/idle-${view}.png`);
  remember(originalStrip);
  if (view !== 'east') {
    const first = await sharp(originalStrip.bytes).extract({ left: 0, top: 0, width: size, height: size }).ensureAlpha().raw().toBuffer();
    assert.ok(first.equals(source.data), `${view}: native owned frame0 must be exact`);
  }
  const maskView = view === 'west' ? 'east' : view;
  const hairMask = await readPixels(`docs/design/head-proof/masks/${maskView}-hair-original.png`);
  const faceMask = await readPixels(view === 'east' ? 'docs/design/character-turnaround/right90-hair-repair-01/protected-profile.png' : `docs/design/head-proof/masks/${maskView}-face-protected.png`);
  remember(hairMask); remember(faceMask);
  const parts = Object.fromEntries(FOUNDATION_PARTS.map(part => [part, Buffer.alloc(size * size * 4)]));
  const ownership = Buffer.alloc(size * size * 4);
  const costumeMask = Buffer.alloc(size * size * 4);
  const composite = Buffer.alloc(size * size * 4);
  const anchorPreview = Buffer.from(source.data);
  const counts = Object.fromEntries(FOUNDATION_PARTS.map(part => [part, 0]));
  for (let pixel = 0; pixel < size * size; pixel++) {
    const column = pixel % size, row = Math.floor(pixel / size), offset = pixel * 4;
    const maskColumn = view === 'west' ? 127 - column : column;
    const maskOffset = (row * size + maskColumn) * 4;
    const face = faceMask.data[maskOffset] === 255;
    const hair = hairMask.data[maskOffset] === 255 && !face;
    const head = row < (view === 'north' ? 41 : 40);
    const residualArm = residualArmRegions[view].some(polygon => inside(column + .5, row + .5, polygon));
    const part = !source.data[offset + 3] ? 'bodyVisible' : hair ? 'hairVisible' : head || face ? 'headVisible' : residualArm ? 'bodyVisible' : 'outfitVisible';
    source.data.copy(parts[part], offset, offset, offset + 4);
    if (source.data[offset + 3]) counts[part]++;
    const owner = source.data[offset + 3] ? FOUNDATION_PARTS.indexOf(part) + 1 : 0;
    ownership.set(colors[owner], offset);
    costumeMask.set(part === 'outfitVisible' && row < 114 && source.data[offset + 3] ? [255,255,255,255] : [0,0,0,255], offset);
    parts[part].copy(composite, offset, offset, offset + 4);
  }
  assert.ok(composite.equals(source.data), `${view}: full RGBA partition including hidden RGB`);
  for (const [name, point] of Object.entries({ ...anchors[view], foot: manifest.canvas.foot })) {
    const color = name === 'foot' ? [255,255,255,255] : name === 'hairRoot' ? [156,203,140,255] : name === 'neck' ? [75,153,192,255] : [229,172,97,255];
    for (let delta = -2; delta <= 2; delta++) {
      for (const [column, row] of [[point.x + delta, point.y], [point.x, point.y + delta]]) if (column >= 0 && row >= 0 && column < 128 && row < 128) anchorPreview.set(color, (row * 128 + column) * 4);
    }
  }
  await save(`${view}/source.png`, source.bytes);
  await savePng(`${view}/ownership.png`, ownership);
  await savePng(`${view}/costume-edit-mask.png`, costumeMask);
  await savePng(`${view}/anchors.png`, anchorPreview);
  const data = { source: { url: `${prefix}${view}/source.png`, rgbaSha256: hash(source.data) }, sourceKind: view === 'south' ? 'approved-front' : view === 'east' ? 'manual-hair-draft' : 'owned-rig-reference', approved: view === 'south', anchors: { foot: manifest.canvas.foot, ...anchors[view] }, anchorStatus: 'provisional-native-pixel', parts: {}, ownershipMask: `${prefix}${view}/ownership.png`, reconstructionRequired: ['Full hidden torso/limbs under clothing', 'Bald scalp under hair and complete occluded hair', 'Garment underside, sleeve openings and seams', 'Mask/material boundaries and attachment fit need visual review'] };
  for (const part of FOUNDATION_PARTS) {
    await savePng(`${view}/${part}.png`, parts[part]);
    data.parts[part] = { url: `${prefix}${view}/${part}.png`, rgbaSha256: hash(parts[part]) };
  }
  manifest.views[view] = data;
  report.views[view] = { source: source.relative, sourcePngSha256: hash(source.bytes), native: true, changedPixels: 0, counts, residualArmRegions: residualArmRegions[view], headBoundaryExclusive: view === 'north' ? 41 : 40, maskSource: maskView, sourceApproved: view === 'south', partitionApproved: false, completeAnatomy: false };
  for (let row = 0; row < 128; row++) {
    source.data.copy(contact, (row * 512 + viewIndex * 128) * 4, row * 512, (row + 1) * 512);
    for (const [layerIndex, layer] of [source.data, ...FOUNDATION_PARTS.map(part => parts[part])].entries()) layer.copy(layerContact, ((layerIndex * 128 + row) * 512 + viewIndex * 128) * 4, row * 512, (row + 1) * 512);
  }
  if (view !== 'south') {
    const context = Buffer.alloc(256 * 128 * 4);
    const front = await readPixels(sourcePaths.south);
    for (let row = 0; row < 128; row++) {
      source.data.copy(context, row * 1024, row * 512, (row + 1) * 512);
      front.data.copy(context, row * 1024 + 512, row * 512, (row + 1) * 512);
    }
    await savePng(`${view}/costume-context.png`, context, 256, 128);
    await saveJson(`requests/costume-${view}.json`, { tool: 'inpaint_image_pro_flash', submitted: false, requiresNumericalCostApproval: true, quotedProvisionalCredits: 6,
      files: { image_base64: `${view}/source.png`, mask_image_base64: `${view}/costume-edit-mask.png`, context_image: `${view}/costume-context.png` },
      arguments: { description: `Repair only WHITE mask clothing in the LEFT sprite (${view} view). RIGHT sprite is the approved FRONT master, reference only. Match its cream woven tunic, crimson sash, aged bronze amulet, green/gold apron construction, fur mantle, hem and consistent shading in this view. Keep native pose, face, head, tied silver hair, exposed skin and feet exactly. Do not copy frontal panel width into a side view. No new accessories, no whole character redraw, no resizing. Mask is a conservative visible-garment draft, not permission to reconstruct anatomy.`, bounding_box: { x: 0, y: 0, width: 128, height: 128 }, crop_to_mask: true, no_background: true, output_method: 'Modify current layer', seed: 910 + viewIndex },
      limitations: ['Mask covers visible garment pixels only, excluding y114+ footwear; it cannot complete hidden anatomy or expand the silhouette.', 'Hand-authored mask must be visually reviewed before submission; generated output must pass unmasked RGBA conservation and costume review.', 'files names describe local PNG-to-base64 encoding; this is an unsubmitted request recipe, not a service receipt.'] });
  }
}
for (const state of CHARACTER_STATES) for (const view of FOUNDATION_VIEWS) {
  const count = rig.bodies.male.outfits.base[state]?.[view] ?? 0;
  let sourceSha256 = null;
  if (count) {
    const image = await readPixels(`apps/client/public/assets/rig-v2/male/base/${state}-${view}.png`);
    assert.equal(image.width, size * count); assert.equal(image.height, size); remember(image);
    sourceSha256 = hash(image.bytes);
  }
  manifest.clips.push({ state, view, sourceUrl: count ? `/assets/rig-v2/male/base/${state}-${view}.png` : null, sourceFrames: count, sourceSha256,
    anchors: (rig.bodies.male.layers[state]?.[view] ?? []).map(frame => ({ head: { x: frame.head[0], y: frame.head[1] }, headgearSeat: { x: frame.crown[0], y: frame.crown[1] } })), newBaseUrl: null, newBaseFrames: 0, approved: false });
}
assert.deepEqual(validateCharacterFoundation(manifest), []);
await savePng('four-view-native.png', contact, 512, 128);
await savePng('visible-layer-evidence.png', layerContact, 512, 640);
const nearest = (data, width, height) => {
  const doubled = Buffer.alloc(width * height * 16);
  for (let row = 0; row < height * 2; row++) for (let column = 0; column < width * 2; column++) {
    const offset = (Math.floor(row / 2) * width + Math.floor(column / 2)) * 4;
    data.copy(doubled, (row * width * 2 + column) * 4, offset, offset + 4);
  }
  return doubled;
};
await savePng('four-view-2x.png', nearest(contact, 512, 128), 1024, 256);
for (const input of report.inputs) assert.equal(hash(await readFile(path.join(root, input.path))), input.pngSha256, 'Source must remain untouched');
await saveJson('manifest.json', manifest);
await saveJson('evidence.json', report);
await saveJson('generation-plan.json', { queriedAt: '2026-10-09', source: 'Live get_pro_flash_capabilities(operation=inpaint,width=128,height=128)', revision: 'pro-flash-presets-48-128-2026-09-29', perImageQuote: { image: 6, rotations: 0, total: 6, provisional: true }, numericalApprovalReceived: false, paidJobsSubmitted: 0,
  cheapestBoundedNextStage: { jobs: 3, creditsEstimate: 18, retriesIncluded: 0, sequence: ['RIGHT90 costume only, inspect and stop on drift', 'BACK garment consistency, inspect', 'LEFT garment consistency, inspect'], reuse: 'Existing owned north/west references; no fresh eight-view rotation or style generation.' },
  furtherStages: [{ stage: 'Clean bald head and hidden clothed-body reconstruction', proposedJobs: 4, creditsEstimate: 24, guaranteed: false }, { stage: 'True independent anatomical body and complete outfit/hair layers', creditsEstimate: null, reason: 'Requires approved hidden-anatomy design and masks, not a clothed-image extraction.' }, { stage: 'One approved-new-base animation pilot', tool: 'animate_image', frameCount: 8, returnedFrames: 9, nativeCanvas: [128,128], creditsEstimate: 2, estimateSource: 'Cached catalog pixel-cost examples imply 2 at 128x128x8; NOT a live quote or guaranteed charge.', source: 'Approved reconstructed native PNG required; no registered character_id needed.', gates: ['Static costume/identity review', 'Clean-layer and occlusion review', 'Numerical budget approval', 'Per-frame identity, baseline, anchors and layer review'], schemaFields: ['action','frame_count','first_frame_base64','no_background','seed'], required: ['action'] }, { stage: 'Eight-direction idle/walk then attack/cast/hurt/death', creditsEstimate: null, reason: 'Four diagonal static views and clean-layer frame authoring are unresolved; no invented whole-job total.' }],
  schema: { tool: 'inpaint_image_pro_flash', required: ['description'], inputs: ['image_base64', 'mask_image_base64', 'context_image', 'bounding_box'], contextLimit: '3x native dimensions; bounding_box required', binaryMask: 'white generate / black preserve, alpha ignored', outputMethods: ['New layer with changes', 'Modify current layer, only changes', 'Modify current layer'], guaranteesNotOffered: ['identity', 'true profile', 'complete anatomy', 'visual approval'] } });
const sections = FOUNDATION_VIEWS.map(view => `<section><h2>${view === 'south' ? 'FRONT: source approved' : view === 'east' ? 'RIGHT90: hair-only draft' : view === 'north' ? 'BACK: owned reference' : 'LEFT: owned reference'}</h2><div class="pair"><img src="${view}/source.png" alt="${view} native source"><img src="${view}/anchors.png" alt="${view} provisional anchors"></div></section>`).join('');
await save('review.html', Buffer.from(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Character foundation review</title><style>body{margin:16px;background:#253b38;color:#f2eadb;font:14px Georgia,serif}h1{font-size:22px}h2{font-size:16px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,288px),1fr));gap:16px}section{min-width:0}.pair{display:flex;gap:8px;flex-wrap:wrap}img{width:128px;height:128px;image-rendering:pixelated;background:repeating-conic-gradient(#bcbcbc 0% 25%,#ededed 0% 50%) 0 0/16px 16px}.layers{width:512px;height:640px;max-width:100%;object-fit:contain;object-position:left top}p{max-width:80ch;line-height:1.5}</style><h1>Four-view foundation: draft evidence</h1><p>Only FRONT source is approved. RIGHT90 costume is unresolved. BACK/LEFT are existing owned references, not new corrected or approved art. No clean hidden anatomy or new-base animation is delivered.</p><main>${sections}</main><h2>Visible partitions</h2><p>Columns: FRONT / RIGHT90 / BACK / LEFT. Rows: source / body residual (includes wraps) / visible head / visible hair / visible garment. Empty pixels are missing anatomy, not a clean body.</p><img class="layers" src="visible-layer-evidence.png" alt="Exact source and four visible partitions"><p>Anchor marks: white foot; blue neck; green hair root; gold headgear seat. All attachment seats are provisional.</p></html>`));
console.log(`PASS build foundation: four native sources retained; ${manifest.clips.filter(clip => clip.sourceFrames > 0).length} archived clips; zero new-base clips, zero paid jobs.`);