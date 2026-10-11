import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
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
const save = async (filename, value) => writeFile(filename, JSON.stringify(value, null, 2) + '\n');
const decode = async filename => sharp(await readFile(filename)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const [command, view = 'east'] = process.argv.slice(2);
assert.ok(['east', 'north', 'west'].includes(view));
const directory = path.join(stage, view);
if (command === 'prepare') {
  await mkdir(directory, { recursive: true });
  const recipe = await load(path.join(foundation, `requests/costume-${view}.json`));
  for (const [field, filename] of Object.entries(recipe.files)) {
    await copyFile(path.join(foundation, filename), path.join(directory, `${field}.png`));
  }
  await copyFile(path.join(foundation, 'south/source.png'), path.join(directory, 'front.png'));
  await save(path.join(directory, 'request.json'), { ...recipe, authorization: { costumeCap: 18, retries: 0, anatomy: 0, animation: 0, source: 'Parent bounded costume-stage authorization, 2026-10-09' } });
  const prior = await readFile(path.join(root, 'docs/design/character-turnaround/generation-ledger.json'));
  try { await readFile(path.join(stage, 'ledger.json')); } catch {
    await save(path.join(stage, 'ledger.json'), { cap: 18, charged: 0, reserved: 0, jobs: [], priorAccountingSha256: hash(prior), priorChargedCredits: JSON.parse(prior).additionalChargedCredits, approved: false, productionReady: false });
  }
}
if (command === 'prepare' || command === 'test') {
  const source = await decode(path.join(directory, 'image_base64.png'));
  const mask = await decode(path.join(directory, 'mask_image_base64.png'));
  const context = await decode(path.join(directory, 'context_image.png'));
  const frontBytes = await readFile(path.join(directory, 'front.png'));
  assert.ok(frontBytes.equals(await readFile(path.join(root, 'docs/design/head-proof/source/south.png'))));
  assert.ok((await readFile(path.join(directory, 'image_base64.png'))).equals(await readFile(path.join(foundation, `${view}/source.png`))));
  const front = await decode(path.join(directory, 'front.png'));
  assert.equal(source.info.width, 128); assert.equal(source.info.height, 128);
  assert.equal(mask.info.width, 128); assert.equal(mask.info.height, 128);
  assert.equal(context.info.width, 256); assert.equal(context.info.height, 128);
  let selected = 0;
  for (let pixel = 0; pixel < 16384; pixel++) {
    const offset = pixel * 4;
    assert.ok(mask.data[offset] === 0 || mask.data[offset] === 255);
    assert.equal(mask.data[offset], mask.data[offset + 1]); assert.equal(mask.data[offset], mask.data[offset + 2]);
    if (mask.data[offset] === 255) { selected++; assert.ok(Math.floor(pixel / 128) >= 38 && Math.floor(pixel / 128) < 114); }
  }
  assert.ok(selected > 0);
  for (let row = 0; row < 128; row++) {
    assert.ok(context.data.subarray(row * 1024, row * 1024 + 512).equals(source.data.subarray(row * 512, (row + 1) * 512)));
    assert.ok(context.data.subarray(row * 1024 + 512, (row + 1) * 1024).equals(front.data.subarray(row * 512, (row + 1) * 512)));
  }
  const ledger = await load(path.join(stage, 'ledger.json'));
  assert.ok(ledger.charged + ledger.reserved <= 18);
  assert.equal(hash(await readFile(path.join(root, 'docs/design/character-turnaround/generation-ledger.json'))), ledger.priorAccountingSha256);
  const evidence = { view, native: [128, 128], frontPngSha256: hash(frontBytes), sourcePngSha256: hash(await readFile(path.join(directory, 'image_base64.png'))), sourceRgbaSha256: hash(source.data), maskPngSha256: hash(await readFile(path.join(directory, 'mask_image_base64.png'))), selected, protected: 16384 - selected, approved: false, productionReady: false };
  if (command === 'prepare') await save(path.join(directory, 'preparation.json'), evidence);
  else assert.deepEqual(await load(path.join(directory, 'preparation.json')), evidence);
  console.log(`PASS ${view}: native128, byte-exact front/source, binary mask ${selected}, protected ${16384 - selected}, context exact, prior ledger retained, cap18.`);
}
if (command === 'result') {
  const source = await decode(path.join(directory, 'image_base64.png'));
  const raw = await decode(path.join(directory, 'raw.png'));
  const mask = await decode(path.join(directory, 'mask_image_base64.png'));
  assert.equal(raw.info.width, 128); assert.equal(raw.info.height, 128);
  let changed = 0, protectedMismatch = 0;
  for (let pixel = 0; pixel < 16384; pixel++) {
    const offset = pixel * 4;
    if (!source.data.subarray(offset, offset + 4).equals(raw.data.subarray(offset, offset + 4))) {
      changed++;
      if (mask.data[offset] === 0) protectedMismatch++;
    }
  }
  const front = await decode(path.join(directory, 'front.png'));
  const contact = Buffer.alloc(384 * 128 * 4);
  for (let row = 0; row < 128; row++) for (const [index, image] of [front, source, raw].entries()) {
    image.data.copy(contact, (row * 384 + index * 128) * 4, row * 512, (row + 1) * 512);
  }
  await sharp(contact, { raw: { width: 384, height: 128, channels: 4 } }).png().toFile(path.join(directory, 'comparison-native.png'));
  const enlarged = Buffer.alloc(768 * 256 * 4);
  for (let row = 0; row < 256; row++) for (let column = 0; column < 768; column++) {
    const offset = (Math.floor(row / 2) * 384 + Math.floor(column / 2)) * 4;
    contact.copy(enlarged, (row * 768 + column) * 4, offset, offset + 4);
  }
  await sharp(enlarged, { raw: { width: 768, height: 256, channels: 4 } }).png().toFile(path.join(directory, 'comparison-2x.png'));
  await save(path.join(directory, 'output-check.json'), { native: [128, 128], changed, protectedMismatch, rawPngSha256: hash(await readFile(path.join(directory, 'raw.png'))), rawRgbaSha256: hash(raw.data), approved: false, productionReady: false, visualVerdict: 'awaiting-art-review' });
  assert.equal(protectedMismatch, 0, 'Provider must preserve every unmasked RGBA byte');
  assert.ok(changed > 0, 'No-op is not repaired artwork');
  console.log(`PASS ${view} output: changed ${changed}, protected mismatch0; genuine raw/contact archived, art approval pending.`);
}