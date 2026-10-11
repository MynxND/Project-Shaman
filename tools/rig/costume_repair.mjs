import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, copyFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const foundation = path.join(root, 'docs/design/character-turnaround/foundation-01');
const stage = path.join(root, 'docs/design/character-turnaround/costume-repair-01');
const sharp = createRequire(createRequire(new URL('../../apps/client/package.json', import.meta.url)).resolve('next'))('sharp');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const load = async filename => JSON.parse(await readFile(filename, 'utf8'));
const save = async (filename, data) => writeFile(filename, JSON.stringify(data, null, 2) + '\n');
const decode = async filename => sharp(await readFile(filename)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const [mode, view = 'east'] = process.argv.slice(2);
assert.ok(['east', 'north', 'west'].includes(view));
const directory = path.join(stage, view);

if (mode === 'prepare') {
  const exists = async filename => access(filename).then(() => true, () => false);
  assert.equal(await exists(path.join(directory, 'request.json')), false, 'Prepared view already exists; never overwrite stage evidence');
  if (view === 'east') assert.equal(await exists(path.join(stage, 'ledger.json')), false, 'Stage ledger exists; never clear prior accounting');
  await mkdir(directory, { recursive: true });
  const recipe = await load(path.join(foundation, `requests/costume-${view}.json`));
  const inputs = {};
  for (const [field, relative] of Object.entries(recipe.files)) {
    const target = field === 'image_base64' ? 'input.png' : field === 'mask_image_base64' ? 'mask.png' : 'context.png';
    const bytes = await readFile(path.join(foundation, relative));
    await copyFile(path.join(foundation, relative), path.join(directory, target));
    inputs[field] = { file: target, pngSha256: hash(bytes), source: `docs/design/character-turnaround/foundation-01/${relative}` };
  }
  const front = await readFile(path.join(foundation, 'south/source.png'));
  assert.ok(front.equals(await readFile(path.join(root, 'docs/design/head-proof/source/south.png'))));
  await copyFile(path.join(foundation, 'south/source.png'), path.join(directory, 'front.png'));
  const request = { tool: recipe.tool, arguments: recipe.arguments, inputs, frontPngSha256: hash(front), native: [128, 128], approved: false, productionReady: false };
  if (view === 'east') request.arguments.description = 'Edit only WHITE-mask clothing of LEFT sprite, a strict RIGHT-facing profile. RIGHT sprite is the untouched approved FRONT master, reference only. Preserve the existing side pose and narrow side silhouette. Match FRONT cream embroidered woven tunic, short fur-trimmed mantle, crimson waist sash, weathered bronze amulet, green/gold woven apron and layered cream hem. Project these same garments in genuine side view: narrow hanging apron at front of hips, not a wide frontal skirt; continuous side seams, natural drape and consistent upper-left shading. Keep head, silver tied hair, crimson bow, face, exposed skin, hands, feet and all black-mask RGBA EXACT. No new armor, no cape, no new accessories, no front-facing body, no whole-character reroll, no resize. Repair costume and shading only, not anatomy.';
  await save(path.join(directory, 'request.json'), request);
  if (view === 'east') await save(path.join(stage, 'ledger.json'), { version: 1, authorization: 'Latest proceed instruction interpreted by coordinator as bounded costume authorization', maximumCredits: 18, retries: 0, priorLedger: '../generation-ledger.json', priorLedgerSha256: hash(await readFile(path.join(root, 'docs/design/character-turnaround/generation-ledger.json'))), jobs: [], pendingJobs: [], chargedCredits: 0, reservedCredits: 0, anatomyAnimationAuthorized: false, approved: false });
}
if (mode === 'prepare' || mode === 'check') {
  const request = await load(path.join(directory, 'request.json'));
  for (const input of Object.values(request.inputs)) assert.equal(hash(await readFile(path.join(directory, input.file))), input.pngSha256);
  assert.equal(hash(await readFile(path.join(directory, 'front.png'))), request.frontPngSha256);
  const input = await decode(path.join(directory, 'input.png'));
  const mask = await decode(path.join(directory, 'mask.png'));
  const context = await decode(path.join(directory, 'context.png'));
  const front = await decode(path.join(directory, 'front.png'));
  for (const image of [input, mask, front]) { assert.equal(image.info.width, 128); assert.equal(image.info.height, 128); }
  assert.equal(context.info.width, 256); assert.equal(context.info.height, 128);
  for (let row = 0; row < 128; row++) {
    assert.ok(context.data.subarray(row * 1024, row * 1024 + 512).equals(input.data.subarray(row * 512, row * 512 + 512)));
    assert.ok(context.data.subarray(row * 1024 + 512, row * 1024 + 1024).equals(front.data.subarray(row * 512, row * 512 + 512)));
  }
  let selected = 0;
  for (let pixel = 0; pixel < 16384; pixel++) {
    const offset = pixel * 4;
    assert.ok(mask.data[offset] === 0 || mask.data[offset] === 255);
    assert.equal(mask.data[offset], mask.data[offset + 1]); assert.equal(mask.data[offset], mask.data[offset + 2]);
    if (mask.data[offset] === 255) { selected++; assert.ok(Math.floor(pixel / 128) >= 38 && Math.floor(pixel / 128) < 114); assert.ok(input.data[offset + 3] > 0); }
  }
  assert.ok(selected > 0);
  const ledger = await load(path.join(stage, 'ledger.json'));
  assert.equal(ledger.maximumCredits, 18); assert.equal(ledger.retries, 0); assert.equal(ledger.anatomyAnimationAuthorized, false);
  assert.ok(ledger.chargedCredits + ledger.reservedCredits <= 18);
  assert.equal(typeof ledger.reservedCredits, 'number');
  assert.equal(hash(await readFile(path.join(root, 'docs/design/character-turnaround/generation-ledger.json'))), ledger.priorLedgerSha256);
  await save(path.join(directory, 'preflight.json'), { passed: true, selectedPixels: selected, protectedPixels: 16384 - selected, native: [128, 128], exactContext: true, frontLocked: true, priorLedgerUnchanged: true });
  console.log(`PASS ${view}: native128, exact source/front context, ${selected} editable / ${16384 - selected} protected, budget18/no retries, prior accounting retained.`);
}
if (mode === 'result') {
  const request = await load(path.join(directory, 'request.json'));
  const input = await decode(path.join(directory, 'input.png'));
  const mask = await decode(path.join(directory, 'mask.png'));
  const raw = await decode(path.join(directory, 'raw.png'));
  assert.equal(raw.info.width, 128); assert.equal(raw.info.height, 128);
  let changed = 0, protectedMismatch = 0;
  for (let pixel = 0; pixel < 16384; pixel++) {
    const offset = pixel * 4;
    const differs = !input.data.subarray(offset, offset + 4).equals(raw.data.subarray(offset, offset + 4));
    changed += Number(differs); protectedMismatch += Number(differs && mask.data[offset] === 0);
  }
  const images = [await decode(path.join(directory, 'front.png')), input, raw, mask];
  const contact = Buffer.alloc(512 * 128 * 4);
  for (const [index, image] of images.entries()) for (let row = 0; row < 128; row++) image.data.copy(contact, (row * 512 + index * 128) * 4, row * 512, (row + 1) * 512);
  await sharp(contact, { raw: { width: 512, height: 128, channels: 4 } }).png().toFile(path.join(directory, 'comparison-native.png'));
  const doubled = Buffer.alloc(1024 * 256 * 4);
  for (let row = 0; row < 256; row++) for (let column = 0; column < 1024; column++) { const offset = (Math.floor(row / 2) * 512 + Math.floor(column / 2)) * 4; contact.copy(doubled, (row * 1024 + column) * 4, offset, offset + 4); }
  await sharp(doubled, { raw: { width: 1024, height: 256, channels: 4 } }).png().toFile(path.join(directory, 'comparison-2x.png'));
  await save(path.join(directory, 'pixel-check.json'), { passed: protectedMismatch === 0 && changed > 0, changedPixels: changed, protectedMismatch, rawPngSha256: hash(await readFile(path.join(directory, 'raw.png'))), sourcePngSha256: request.inputs.image_base64.pngSha256, frontLocked: hash(await readFile(path.join(foundation, 'south/source.png'))) === request.frontPngSha256, approved: false, artVerdict: 'requires-visual-review' });
  assert.equal(protectedMismatch, 0, 'Raw provider output altered protected RGBA; reject without compositing over it');
  assert.ok(changed > 0);
  console.log(`PASS raw ${view}: ${changed} changed pixels; zero protected RGBA mismatches. Art review required.`);
}
if (mode === 'archive-rejection') {
  const ledger = await load(path.join(stage, 'ledger.json'));
  const review = await load(path.join(directory, 'review.json'));
  const pixelCheck = await load(path.join(directory, 'pixel-check.json'));
  const receipt = (await load(path.join(directory, 'result.json'))).result.structuredContent;
  assert.equal(review.credibleCandidate, false); assert.equal(review.stop, true);
  assert.equal(receipt.status, 'completed'); assert.equal(receipt.charged_generations, 6);
  assert.equal(pixelCheck.protectedMismatch, 0);
  assert.equal(hash(await readFile(path.join(directory, 'raw.png'))), pixelCheck.rawPngSha256);
  const job = ledger.jobs.find(record => record.id === receipt.job_id);
  assert.ok(job); assert.equal(job.chargedCredits, receipt.charged_generations);
  job.status = 'completed-rejected-costume';
  job.review = `${view}/review.json`; job.raw = `${view}/raw.png`; job.chargeEvidence = `${view}/result.json#result.structuredContent.charged_generations`;
  ledger.reservedCredits = 0; ledger.status = 'stopped-right-costume-rejected-no-retry';
  ledger.remainingAuthorizationUnused = ledger.maximumCredits - ledger.chargedCredits;
  assert.deepEqual(ledger.pendingJobs, []); assert.equal(ledger.jobs.length, 1);
  await save(path.join(stage, 'ledger.json'), ledger);
  const runtime = path.join(root, 'apps/client/public/assets/character-turnaround/costume-repair-01');
  await mkdir(path.join(runtime, view), { recursive: true });
  for (const filename of ['front.png', 'input.png', 'mask.png', 'raw.png', 'comparison-native.png', 'comparison-2x.png']) await copyFile(path.join(directory, filename), path.join(runtime, view, filename));
  const manifest = { version: 1, native: [128, 128], approved: false, productionReady: false, registeredLook: null, candidate: null, newBaseAnimationClips: 0, cleanAnatomy: false, chargedCredits: ledger.chargedCredits, pendingJobs: [], views: { east: { status: 'rejected-costume', jobId: receipt.job_id, source: '/assets/character-turnaround/costume-repair-01/east/input.png', rejectedPreview: '/assets/character-turnaround/costume-repair-01/east/raw.png', comparison: '/assets/character-turnaround/costume-repair-01/east/comparison-2x.png', sourcePngSha256: pixelCheck.sourcePngSha256, rawPngSha256: pixelCheck.rawPngSha256, protectedMismatch: 0 }, north: { status: 'blocked-by-right-rejection', candidate: null }, west: { status: 'blocked-by-right-rejection', candidate: null } } };
  await save(path.join(stage, 'runtime-review.json'), manifest);
  await save(path.join(runtime, 'manifest.json'), manifest);
  console.log('Archived genuine rejected RIGHT raw + runtime review bundle; charge6, reserved0, pending0, unused12. No registry or approved-source replacement.');
}
if (mode === 'test-final') {
  const ledger = await load(path.join(stage, 'ledger.json'));
  const review = await load(path.join(directory, 'review.json'));
  const manifest = await load(path.join(stage, 'runtime-review.json'));
  const pixelCheck = await load(path.join(directory, 'pixel-check.json'));
  const request = await load(path.join(directory, 'request.json'));
  const schemas = await load(path.join(directory, 'live-schemas.json'));
  const schema = schemas.find(record => record.name === request.tool).inputSchema;
  for (const field of [...Object.keys(request.arguments), ...Object.keys(request.inputs)]) assert.ok(field in schema.properties, `Unknown live input: ${field}`);
  const receipt = (await load(path.join(directory, 'result.json'))).result.structuredContent;
  assert.equal(receipt.job_id, ledger.jobs[0].id); assert.equal(receipt.charged_generations, ledger.jobs[0].chargedCredits);
  assert.equal(hash(await readFile(path.join(directory, 'raw.png'))), pixelCheck.rawPngSha256);
  const source = await decode(path.join(directory, 'input.png'));
  const raw = await decode(path.join(directory, 'raw.png'));
  const mask = await decode(path.join(directory, 'mask.png'));
  let changed = 0;
  for (let pixel = 0; pixel < 16384; pixel++) {
    const offset = pixel * 4;
    const differs = !source.data.subarray(offset, offset + 4).equals(raw.data.subarray(offset, offset + 4));
    if (mask.data[offset] === 0) assert.equal(differs, false, `Protected RGBA mismatch at pixel ${pixel}`);
    changed += Number(differs);
  }
  assert.equal(changed, pixelCheck.changedPixels); assert.ok(changed > 0);
  const contact = await decode(path.join(directory, 'comparison-native.png'));
  const doubled = await decode(path.join(directory, 'comparison-2x.png'));
  assert.equal(contact.info.width, 512); assert.equal(contact.info.height, 128);
  assert.equal(doubled.info.width, 1024); assert.equal(doubled.info.height, 256);
  for (const [index, image] of [await decode(path.join(directory, 'front.png')), source, raw, mask].entries()) for (let row = 0; row < 128; row++) assert.ok(contact.data.subarray((row * 512 + index * 128) * 4, (row * 512 + (index + 1) * 128) * 4).equals(image.data.subarray(row * 512, (row + 1) * 512)));
  for (let row = 0; row < 256; row++) for (let column = 0; column < 1024; column++) {
    const offset = (Math.floor(row / 2) * 512 + Math.floor(column / 2)) * 4;
    assert.ok(doubled.data.subarray((row * 1024 + column) * 4, (row * 1024 + column + 1) * 4).equals(contact.data.subarray(offset, offset + 4)));
  }
  assert.equal(ledger.chargedCredits, 6); assert.equal(ledger.reservedCredits, 0); assert.equal(ledger.maximumCredits, 18);
  assert.deepEqual(ledger.pendingJobs, []); assert.equal(ledger.jobs.length, 1); assert.equal(ledger.retries, 0);
  assert.equal(ledger.jobs[0].status, 'completed-rejected-costume'); assert.equal(review.stop, true); assert.equal(review.credibleCandidate, false);
  assert.equal(ledger.anatomyAnimationAuthorized, false); assert.equal(manifest.productionReady, false); assert.equal(manifest.approved, false); assert.equal(manifest.candidate, null);
  assert.equal(manifest.newBaseAnimationClips, 0); assert.equal(manifest.cleanAnatomy, false);
  assert.equal(hash(await readFile(path.join(root, 'docs/design/character-turnaround/generation-ledger.json'))), ledger.priorLedgerSha256);
  const runtime = path.join(root, 'apps/client/public/assets/character-turnaround/costume-repair-01');
  assert.deepEqual(await load(path.join(runtime, 'manifest.json')), manifest);
  for (const filename of ['front.png', 'input.png', 'mask.png', 'raw.png', 'comparison-native.png', 'comparison-2x.png']) assert.ok((await readFile(path.join(directory, filename))).equals(await readFile(path.join(runtime, view, filename))));
  assert.equal(hash(await readFile(path.join(foundation, 'south/source.png'))), (await load(path.join(directory, 'request.json'))).frontPngSha256);
  console.log('PASS final: genuine raw provenance, exact runtime review copies, source/front locks, charge6/cap18/pending0, rejected/stop/no false anatomy or animation claims.');
}