import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { FOUNDATION_VIEWS, FOUNDATION_PARTS, validateCharacterFoundation, foundationAnimation } from '../../packages/shared/dist/character-foundation.js';

const root = fileURLToPath(new URL('../../', import.meta.url));
const sharp = createRequire(createRequire(new URL('../../apps/client/package.json', import.meta.url)).resolve('next'))('sharp');
const design = path.join(root, 'docs/design/character-turnaround/foundation-01');
const output = path.join(root, 'apps/client/public');
const hash = data => createHash('sha256').update(data).digest('hex');
const json = async name => JSON.parse(await readFile(path.join(design, name), 'utf8'));
const pixels = async filename => sharp(await readFile(filename)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const manifest = await json('manifest.json'), report = await json('evidence.json');
assert.deepEqual(validateCharacterFoundation(manifest), []);
assert.equal(report.paidJobsSubmitted, 0); assert.equal(report.additionalCredits, 0);
for (const input of report.inputs) assert.equal(hash(await readFile(path.join(root, input.path))), input.pngSha256, input.path);
const contact = await pixels(path.join(design, 'four-view-native.png'));
const doubled = await pixels(path.join(design, 'four-view-2x.png'));
assert.equal(contact.info.width, 512); assert.equal(contact.info.height, 128);
assert.equal(doubled.info.width, 1024); assert.equal(doubled.info.height, 256);
const colors = ['4b99c0ff', 'e5ac61ff', '9ccb8cff', 'cb677fff'];
for (const [viewIndex, view] of FOUNDATION_VIEWS.entries()) {
  const data = manifest.views[view];
  const source = await pixels(path.join(output, data.source.url));
  assert.equal(source.info.width, 128); assert.equal(source.info.height, 128);
  assert.equal(hash(source.data), data.source.rgbaSha256);
  assert.ok((await readFile(path.join(design, `${view}/source.png`))).equals(await readFile(path.join(root, report.views[view].source))), 'Source PNG byte-exact');
  const parts = await Promise.all(FOUNDATION_PARTS.map(part => pixels(path.join(output, data.parts[part].url))));
  const ownership = await pixels(path.join(output, data.ownershipMask));
  const editMask = await pixels(path.join(design, `${view}/costume-edit-mask.png`));
  const composite = Buffer.alloc(source.data.length);
  for (const [index, part] of FOUNDATION_PARTS.entries()) assert.equal(hash(parts[index].data), data.parts[part].rgbaSha256);
  for (let pixel = 0; pixel < 16384; pixel++) {
    const offset = pixel * 4, visible = parts.map(part => part.data[offset + 3] > 0);
    assert.equal(visible.filter(Boolean).length, source.data[offset + 3] ? 1 : 0, `${view}: no overlapping or missing visible ownership`);
    const owner = source.data[offset + 3] ? visible.indexOf(true) : 0;
    parts[owner].data.copy(composite, offset, offset, offset + 4);
    assert.equal(ownership.data.subarray(offset, offset + 4).toString('hex'), source.data[offset + 3] ? colors[owner] : '000000ff');
    const editable = editMask.data[offset] === 255;
    assert.ok(editMask.data[offset] === 0 || editable);
    assert.equal(editMask.data[offset + 1], editMask.data[offset]); assert.equal(editMask.data[offset + 2], editMask.data[offset]); assert.equal(editMask.data[offset + 3], 255);
    if (editable) { assert.ok(parts[3].data[offset + 3]); assert.ok(Math.floor(pixel / 128) < 114); assert.equal(parts[1].data[offset + 3], 0); assert.equal(parts[2].data[offset + 3], 0); }
  }
  assert.ok(composite.equals(source.data), `${view}: lossless full RGBA reconstruction`);
  for (let row = 0; row < 128; row++) assert.ok(contact.data.subarray((row * 512 + viewIndex * 128) * 4, (row * 512 + (viewIndex + 1) * 128) * 4).equals(source.data.subarray(row * 512, (row + 1) * 512)));
  for (const name of ['source.png', ...FOUNDATION_PARTS.map(part => `${part}.png`), 'ownership.png', 'costume-edit-mask.png', 'anchors.png']) assert.ok((await readFile(path.join(design, view, name))).equals(await readFile(path.join(output, 'assets/character-turnaround/foundation-01', view, name))));
}
for (let row = 0; row < 256; row++) for (let column = 0; column < 1024; column++) {
  const offset = (row * 1024 + column) * 4, sourceOffset = (Math.floor(row / 2) * 512 + Math.floor(column / 2)) * 4;
  assert.ok(doubled.data.subarray(offset, offset + 4).equals(contact.data.subarray(sourceOffset, sourceOffset + 4)), 'Exact nearest replication');
}
const originalFront = await pixels(path.join(root, 'docs/design/head-proof/source/south.png'));
assert.equal(manifest.views.south.source.rgbaSha256, hash(originalFront.data));
const rig = JSON.parse(await readFile(path.join(output, 'assets/rig-v2/manifest.json'), 'utf8'));
for (const clip of manifest.clips) {
  assert.equal(clip.sourceFrames, rig.bodies.male.outfits.base[clip.state]?.[clip.view] ?? 0);
  if (clip.sourceFrames) {
    const bytes = await readFile(path.join(output, clip.sourceUrl));
    assert.equal(hash(bytes), clip.sourceSha256);
    const decoded = await pixels(path.join(output, clip.sourceUrl));
    assert.equal(decoded.info.width, 128 * clip.sourceFrames); assert.equal(decoded.info.height, 128);
    assert.deepEqual(clip.anchors, rig.bodies.male.layers[clip.state][clip.view].map(frame => ({ head: { x: frame.head[0], y: frame.head[1] }, headgearSeat: { x: frame.crown[0], y: frame.crown[1] } })));
  }
  assert.equal(foundationAnimation(manifest, clip.state, clip.view), null);
}
const plan = await json('generation-plan.json');
assert.equal(plan.numericalApprovalReceived, false); assert.equal(plan.paidJobsSubmitted, 0);
assert.equal(plan.cheapestBoundedNextStage.creditsEstimate, plan.perImageQuote.total * 3);
for (const view of ['east', 'north', 'west']) {
  const request = await json(`requests/costume-${view}.json`);
  assert.equal(request.submitted, false); assert.equal(request.requiresNumericalCostApproval, true);
  const catalog = JSON.parse(await readFile(path.join(root, 'docs/design/pixellab-tool-catalog.json'), 'utf8'));
  const schema = catalog.find(tool => tool.name === request.tool).inputSchema;
  for (const field of [...Object.keys(request.arguments), ...Object.keys(request.files)]) assert.ok(field in schema.properties, `Unknown schema field: ${field}`);
  const boxSchema = schema.properties.bounding_box;
  for (const field of Object.keys(request.arguments.bounding_box)) assert.ok(field in boxSchema.properties, `Unknown bounding-box field: ${field}`);
}
console.log('PASS foundation pixel evidence: exact approved front, four native source partitions, disjoint masks, source retention, exact 2x, 24 truthful clip records, unsubmitted masked-request schema.');