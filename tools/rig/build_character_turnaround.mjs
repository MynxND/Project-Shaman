import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir, access, copyFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = fileURLToPath(new URL('../../', import.meta.url));
const require = createRequire(new URL('../../apps/client/package.json', import.meta.url));
const sharp = createRequire(require.resolve('next'))('sharp');
const design = path.join(root, 'docs/design/character-turnaround');
const publicRoot = path.join(root, 'apps/client/public');
const output = path.join(publicRoot, 'assets/character-turnaround');
const directions = ['south', 'east', 'north', 'west'];
const size = 128;
const hash = data => createHash('sha256').update(data).digest('hex');
const exists = async filename => { try { await access(filename); return true; } catch { return false; } };
const save = async (filename, data) => writeFile(filename, JSON.stringify(data, null, 2) + '\n');
const bounds = (data, region = [0, 0, 127, 127]) => {
  let left = size, top = size, right = -1, bottom = -1, pixels = 0;
  for (let row = region[1]; row <= region[3]; row++) for (let column = region[0]; column <= region[2]; column++) {
    if (!data[(row * size + column) * 4 + 3]) continue;
    left = Math.min(left, column); right = Math.max(right, column);
    top = Math.min(top, row); bottom = Math.max(bottom, row); pixels++;
  }
  return pixels ? { left, top, right, bottom, width: right - left + 1, height: bottom - top + 1, pixels } : null;
};
const estimates = {
  south: { headRegion: [40, 0, 89, 38], shoulders: [[48, 43], [79, 43]], torso: [53, 42, 75, 67], hips: [[54, 77], [74, 77]], wrists: [[38, 73], [91, 73]], hands: [[38, 78], [91, 78]], neck: [64, 38] },
  east: { headRegion: [37, 0, 83, 38], shoulders: [[57, 42], [70, 44]], torso: [54, 42, 73, 67], hips: [[55, 78], [72, 78]], wrists: [[56, 75], [78, 73]], hands: [[57, 80], [79, 78]], neck: [66, 38] },
  north: { headRegion: [39, 0, 87, 40], shoulders: [[48, 45], [78, 45]], torso: [52, 43, 75, 69], hips: [[54, 78], [74, 78]], wrists: [[38, 72], [88, 72]], hands: [[38, 77], [88, 77]], neck: [63, 41] },
  west: { headRegion: [35, 0, 89, 40], shoulders: [[58, 42], [71, 44]], torso: [52, 42, 72, 67], hips: [[53, 78], [72, 78]], wrists: [[47, 74], [61, 76]], hands: [[48, 79], [61, 81]], neck: [64, 38] }
};
await mkdir(output, { recursive: true });
await mkdir(path.join(design, 'previews'), { recursive: true });
const retentionFile = path.join(design, 'source-retention.json');
const previous = await exists(retentionFile) ? JSON.parse(await readFile(retentionFile, 'utf8')) : null;
const retention = { version: 1, sources: {} };
const retain = async relative => {
  const bytes = await readFile(path.join(root, relative));
  const digest = hash(bytes);
  if (previous) assert.equal(digest, previous.sources[relative], `${relative}: source changed; do not reset retention`);
  retention.sources[relative] = digest;
  return bytes;
};
await retain('docs/design/comfyui/reference/shamen-base-sheet.webp');
await retain('apps/client/public/assets/pixellab/main-male-v1/south.png');
const canvas = { width: size, height: size, origin: { x: 64, y: 124 }, footBaseline: 124, baselineConvention: 'Ground edge immediately below master lowest occupied row123; originals are not shifted to fit.', pixelDensity: 'one source pixel per native canvas pixel' };
const ledger = JSON.parse(await readFile(path.join(design, 'generation-ledger.json'), 'utf8'));
const rightReview = JSON.parse(await readFile(path.join(design, 'right90/review.json'), 'utf8'));
assert.equal(rightReview.status, 'rejected');
assert.equal(rightReview.candidate, null);
assert.equal(ledger.additionalChargedCredits, ledger.jobs.reduce((total, job) => total + job.chargedGenerations, 0));
assert.equal(ledger.additionalReservedCredits, 0);
assert.deepEqual(ledger.pendingJobs, []);
const rotationReview = ledger.rotationInvocation ? JSON.parse(await readFile(path.join(design, 'rotation-experiment-01/review.json'), 'utf8')) : null;
const rotationMeasurements = rotationReview ? JSON.parse(await readFile(path.join(design, 'rotation-experiment-01/measurements.json'), 'utf8')) : null;
const hairRepair = ledger.hairRepairInvocation ? JSON.parse(await readFile(path.join(design, ledger.hairRepairInvocation.experiment, 'review.json'), 'utf8')) : null;
if (hairRepair) {
  assert.equal(hairRepair.approved, false);
  assert.equal(hairRepair.stop, true);
  assert.ok(['failed-no-result', 'rejected', 'proposed-right90-awaiting-user-review'].includes(hairRepair.status));
  assert.equal(Boolean(hairRepair.candidate), hairRepair.status === 'proposed-right90-awaiting-user-review');
}
if (rotationReview) {
  assert.equal(rotationReview.status, 'rejected');
  assert.equal(rotationReview.candidate, null);
  assert.equal(rotationReview.stop, true);
}
const limitations = [
  'Selected original front is not certified user-approved; all art needs user review.',
  'Only south has a candidate, copied exactly from the original frame-0 archive. One actual right90 edit is rejected; east candidate is null, and back/left are blocked by the sequential stop gate.',
  'Native source measurements and provisional anatomical landmarks are not semantic proof of a true profile or identity.',
  'Actual native128 inpaint used an exact BW mask and boxed native256x128 east+front context. Black-mask RGBA remained exact, but output became front-facing with frontal chest/apron, redrawn costume structure and ground-edge delta-1. Reference guidance did not reliably deliver right90 in this observed attempt; no universal inability or identity guarantee is claimed.',
  'Original ground-edge deltas south0/east+1/north-3/west0 fail an aligned four-view contract; no per-direction translation or scale applied.',
  'Baked clothed reference; clean base, garment separation, equipment and animations are not delivered.'
];
if (rotationReview) limitations.push('Native owned-front V3 rotation preserved south RGBA and improved the east-facing profile/baseline, but introduced a long loose white hair tail and lost crimson hair ties. East raw is exposed only as a rejected comparison; back/left raw are archived and unreviewed after the stop. No manual pixel correction or whole-image transform.');
if (hairRepair) limitations.push(hairRepair.candidate ? 'A narrow existing-master hair/tie correction is proposed for right-view user review only; no approval or back/left progression.' : 'One narrow existing-master hair/tie repair failed on the service with no output and observed charge0. No retry; latest actual rejected preview retained. Output conservation and corrected identity cannot be assessed without an image.');
const manifest = { version: 1, id: 'shaman-male-original-turnaround-native128', canvas, master: { view: 'south', status: 'selected-original-not-user-approved', source: '/assets/rig-v2/male/base/idle-south.png', frame: 0 }, views: {}, review: { approved: false, stage: rotationReview ? 'right90-rotation-rejected-identity-stop' : 'right90-attempt-rejected-stop', limitations, right90: rightReview, ...(rotationReview ? { rotation: rotationReview } : {}) }, generation: ledger };
if (hairRepair) {
  manifest.review.hairRepair = hairRepair;
  manifest.review.stage = hairRepair.candidate ? 'proposed-right90-awaiting-user-review' : 'right90-hair-repair-failed-stop';
}
const spec = { version: 1, canvas, master: manifest.master, measurementConvention: 'Inclusive native pixel bounds; anatomical coordinates are provisional visual estimates, not detected skeleton joints.', views: {}, originalPalette: [], modularReady: false, futureLayerContract: { layers: ['base', 'hair', 'outfit', 'headgear', 'mainHand', 'offHand', 'accessory'], shared: ['direction', 'pose', 'frameCount', 'canvas', 'origin', 'footBaseline'], status: 'not-implemented' } };
const frames = [];
for (const view of directions) {
  const relative = `apps/client/public/assets/rig-v2/male/base/idle-${view}.png`;
  const bytes = await retain(relative);
  const metadata = await sharp(bytes).metadata();
  assert.equal(metadata.width, 512); assert.equal(metadata.height, size);
  const data = await sharp(bytes).extract({ left: 0, top: 0, width: size, height: size }).ensureAlpha().raw().toBuffer();
  const originalFile = path.join(output, `${view}-original.png`);
  if (view === 'south') {
    const archive = 'docs/design/head-proof/source/south.png';
    const archiveBytes = await retain(archive);
    assert.deepEqual(await sharp(archiveBytes).ensureAlpha().raw().toBuffer(), data, 'Front archive must be exact frame 0');
    await copyFile(path.join(root, archive), originalFile);
    await copyFile(originalFile, path.join(output, 'south-candidate.png'));
  } else await sharp(data, { raw: { width: size, height: size, channels: 4 } }).png().toFile(originalFile);
  const silhouette = bounds(data);
  const landmarks = { headBounds: bounds(data, estimates[view].headRegion), headBoundsMeaning: 'Opaque head assembly within provisional region, including ornaments; not a certified skull box.', ...estimates[view], silhouette, totalHeight: silhouette.height, footBounds: bounds(data, [0, 108, 127, 127]), observedLowestPixel: silhouette.bottom, groundEdgeDelta: silhouette.bottom + 1 - canvas.footBaseline, landmarkStatus: 'provisional-visible-art-estimates', semanticChecks: { trueTargetAngle: view === 'south' ? 'front-retained-requires-user-review' : 'not-certified', profileFaceVisibility: 'manual-review-required-not-inferred-from-color', identityMatchesMaster: 'manual-review-required' } };
  const original = `/assets/character-turnaround/${view}-original.png`;
  manifest.views[view] = { original, candidate: view === 'south' ? '/assets/character-turnaround/south-candidate.png' : null, status: view === 'south' ? 'preserved-original-awaiting-review' : 'blocked-angle-identity-review', source: { url: `/assets/rig-v2/male/base/idle-${view}.png`, frame: 0, stripSha256: hash(bytes), frame0RgbaSha256: hash(data) }, landmarks };
  if (view === 'east') manifest.views[view].status = 'rejected-right90-actual-generation';
  if (view === 'east' && rotationReview) {
    manifest.views[view].status = 'rejected-right90-rotation-identity';
    manifest.views[view].rejectedPreview = rotationReview.rejectedPreview;
    manifest.views[view].rejectedStatus = 'rejected-not-a-candidate-hair-tie-identity-drift';
    manifest.views[view].rejectedMeasurements = rotationMeasurements.views.east;
  }
  if (view === 'north' || view === 'west') manifest.views[view].status = 'blocked-by-right90-failure';
  spec.views[view] = landmarks;
  frames.push({ input: await sharp(data, { raw: { width: size, height: size, channels: 4 } }).png().toBuffer(), left: directions.indexOf(view) * size, top: 0 });
  if (view === 'south') {
    const mainBytes = await readFile(path.join(root, 'apps/client/public/assets/pixellab/main-male-v1/south.png'));
    const mainData = await sharp(mainBytes).ensureAlpha().raw().toBuffer();
    spec.master.mainV1SouthComparison = { rgbaEqual: mainData.equals(data), selectedReason: 'Current head-proof full-body source, native frame0; not a user approval claim.' };
    const colors = new Map();
    for (let offset = 0; offset < data.length; offset += 4) if (data[offset + 3]) {
      const color = '#' + data.subarray(offset, offset + 4).toString('hex');
      colors.set(color, (colors.get(color) ?? 0) + 1);
    }
    spec.originalPalette = [...colors.entries()].sort((first, second) => second[1] - first[1]).map(([rgba, count]) => ({ rgba, count }));
  }
}
const native = await sharp({ create: { width: size * 4, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite(frames).png().toBuffer();
await writeFile(path.join(design, 'previews/originals-native.png'), native);
await sharp(native).resize(size * 8, size * 2, { kernel: 'nearest' }).png().toFile(path.join(design, 'previews/originals-2x.png'));
manifest.contactSheets = { native: '/assets/character-turnaround/originals-native.png', enlarged: '/assets/character-turnaround/originals-2x.png', order: directions, content: 'originals-only-not-approved-candidates', scale: [1, 2], baseline: canvas.footBaseline };
await copyFile(path.join(design, 'previews/originals-native.png'), path.join(output, 'originals-native.png'));
await copyFile(path.join(design, 'previews/originals-2x.png'), path.join(output, 'originals-2x.png'));
if (rotationReview) {
  const rejectedOutput = path.join(output, 'rotation-experiment-01');
  await mkdir(rejectedOutput, { recursive: true });
  await copyFile(path.join(design, 'rotation-experiment-01/raw/east.png'), path.join(rejectedOutput, 'east-rejected.png'));
  for (const filename of ['east-comparison-native.png', 'east-comparison-2x.png']) await copyFile(path.join(design, 'rotation-experiment-01', filename), path.join(rejectedOutput, filename));
  manifest.review.rotationComparison = { native: '/assets/character-turnaround/rotation-experiment-01/east-comparison-native.png', enlarged: '/assets/character-turnaround/rotation-experiment-01/east-comparison-2x.png', order: rotationReview.evidence.comparisonOrder, content: 'rejected-rotation-not-a-candidate' };
}
if (hairRepair) {
  const repairDirectory = path.join(design, ledger.hairRepairInvocation.experiment);
  manifest.views.east.rejectedHistory = [
    { status: rightReview.status, raw: 'right90/raw.png', review: 'right90/review.json' },
    { status: rotationReview.status, preview: rotationReview.rejectedPreview, review: 'rotation-experiment-01/review.json' },
    { status: hairRepair.status, raw: hairRepair.raw, review: `${ledger.hairRepairInvocation.experiment}/review.json` }
  ];
  manifest.views.east.latestAttempt = { status: hairRepair.status, candidate: hairRepair.candidate, review: `${ledger.hairRepairInvocation.experiment}/review.json`, outputAvailable: hairRepair.raw !== null };
  if (hairRepair.candidate) {
    assert.equal(hairRepair.candidate, '/assets/character-turnaround/right90-hair-repair-01/east-candidate.png');
    const bytes = await readFile(path.join(repairDirectory, 'raw.png'));
    const decoded = await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    assert.equal(decoded.info.width, size); assert.equal(decoded.info.height, size);
    const input = await sharp(path.join(repairDirectory, 'input.png')).ensureAlpha().raw().toBuffer();
    const mask = await sharp(path.join(repairDirectory, 'mask-binary.png')).ensureAlpha().raw().toBuffer();
    const profile = await sharp(path.join(repairDirectory, 'protected-profile.png')).ensureAlpha().raw().toBuffer();
    for (let pixel = 0; pixel < size * size; pixel++) {
      const offset = pixel * 4;
      if (mask[offset] === 0 || profile[offset] === 255) assert.ok(input.subarray(offset, offset + 4).equals(decoded.data.subarray(offset, offset + 4)), 'Repair must preserve unmasked/profile RGBA');
    }
    assert.equal(bounds(decoded.data).bottom + 1 - canvas.footBaseline, 0);
    await mkdir(path.join(output, 'right90-hair-repair-01'), { recursive: true });
    await copyFile(path.join(repairDirectory, 'raw.png'), path.join(publicRoot, hairRepair.candidate));
    manifest.views.east.candidate = hairRepair.candidate;
    manifest.views.east.status = 'proposed-right90-awaiting-user-review';
  } else {
    assert.equal(hairRepair.candidate, null);
    manifest.views.east.status = 'blocked-right90-hair-repair-failed';
  }
}
if (!previous) await save(retentionFile, retention);
const mergeMetadata = (existing, current) => {
  const merged = { ...existing };
  for (const [key, value] of Object.entries(current)) merged[key] = value && typeof value === 'object' && !Array.isArray(value) ? mergeMetadata(existing?.[key] ?? {}, value) : value;
  return merged;
};
const manifestFile = path.join(output, 'manifest.json');
const retainedManifest = await exists(manifestFile) ? JSON.parse(await readFile(manifestFile, 'utf8')) : {};
const rebuiltManifest = mergeMetadata(retainedManifest, manifest);
const manualFile = path.join(design, 'right90-manual-01/manifest.json');
if (await exists(manualFile)) {
  const manual = JSON.parse(await readFile(manualFile, 'utf8')).rightOnlyReview;
  const provenance = JSON.parse(await readFile(path.join(design, 'right90-manual-01/provenance.json'), 'utf8'));
  assert.equal(manual.status, 'manual-right90-proposal-awaiting-review');
  assert.equal(manual.review.approved, false); assert.equal(manual.review.stop, true);
  assert.equal(hash(await readFile(path.join(publicRoot, manual.after))), provenance.afterPngSha256);
  assert.ok((await readFile(path.join(publicRoot, manual.front))).equals(await readFile(path.join(design, '../head-proof/source/south.png'))));
  rebuiltManifest.rightOnlyReview = manual;
  rebuiltManifest.master = { ...rebuiltManifest.master, status: 'user-approved-original-front-byte-exact', approval: manual.frontApproval };
  rebuiltManifest.views.south = { ...rebuiltManifest.views.south, status: 'user-approved-original-front-byte-exact', approval: manual.frontApproval };
  rebuiltManifest.views.east = { ...rebuiltManifest.views.east, candidate: manual.after, status: manual.status, candidateSource: manual.source, candidateLandmarks: manual.landmarks, candidateReview: manual.review };
  rebuiltManifest.review.stage = manual.status;
  rebuiltManifest.review.manualRight90 = { approved: false, review: '/assets/character-turnaround/right90-manual-01/manifest.json', productionReady: false, stop: true };
  rebuiltManifest.review.limitations = rebuiltManifest.review.limitations.filter(limitation => !limitation.startsWith('Selected original front') && !limitation.startsWith('Only south has a candidate'));
  rebuiltManifest.review.limitations.push('Current manual right-only: original rig-v2 front explicitly approved; east hair repair is an unapproved native source-pixel proposal. Prior service failures remain history. Costume projection unresolved; no north/west progression.');
}
spec.master = rebuiltManifest.master;
await save(path.join(design, 'proportion-template.json'), spec);
await save(manifestFile, rebuiltManifest);
console.log(JSON.stringify({ status: rebuiltManifest.review.stage, views: Object.fromEntries(directions.map(view => [view, rebuiltManifest.views[view].landmarks.silhouette])), additionalCredits: ledger.additionalChargedCredits, pendingJobs: ledger.pendingJobs.length }, null, 2));