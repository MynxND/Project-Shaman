import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import path from 'node:path';

const root = fileURLToPath(new URL('../../', import.meta.url));
const require = createRequire(new URL('../../apps/client/package.json', import.meta.url));
const sharp = createRequire(require.resolve('next'))('sharp');
const directory = path.join(root, 'docs/design/character-turnaround/right90-hair-repair-01');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const save = async (name, value) => writeFile(path.join(directory, name), JSON.stringify(value, null, 2) + '\n');
const png = (data, width = 128, height = 128) => sharp(data, { raw: { width, height, channels: 4 } }).png().toBuffer();
const doubled = (data, width, height) => {
  const output = Buffer.alloc(width * height * 16);
  for (let row = 0; row < height * 2; row++) for (let column = 0; column < width * 2; column++) {
    data.copy(output, (row * width * 2 + column) * 4, (Math.floor(row / 2) * width + Math.floor(column / 2)) * 4, (Math.floor(row / 2) * width + Math.floor(column / 2)) * 4 + 4);
  }
  return output;
};
const rawPath = 'docs/design/character-turnaround/rotation-experiment-01/raw/east.png';
const sourceBytes = await readFile(path.join(root, rawPath));
const frontBytes = await readFile(path.join(root, 'docs/design/head-proof/source/south.png'));
const eastBytes = await readFile(path.join(root, 'apps/client/public/assets/character-turnaround/east-original.png'));
const source = await sharp(sourceBytes).ensureAlpha().raw().toBuffer();
const front = await sharp(frontBytes).ensureAlpha().raw().toBuffer();
const east = await sharp(eastBytes).ensureAlpha().raw().toBuffer();
const skinRegions = [[70, 21, 84, 25], [58, 26, 84, 39]];
const upperRows = [[3, 8, 59, 76], [9, 13, 50, 80], [14, 20, 46, 84], [21, 25, 47, 72]];
const bowRows = [[18, 25, 43, 58], [26, 35, 40, 57]];
const tailRows = [[26, 39, 33, 57], [40, 48, 33, 55], [49, 54, 33, 54], [55, 63, 33, 50], [64, 66, 33, 43], [67, 70, 33, 43], [71, 77, 33, 40]];
const mask = Buffer.alloc(16384 * 4);
const protectedSkin = Buffer.alloc(16384 * 4);
const overlay = Buffer.from(source);
let selected = 0, selectedOpaque = 0;
for (let row = 0; row < 128; row++) for (let column = 0; column < 128; column++) {
  const offset = (row * 128 + column) * 4;
  const skin = skinRegions.some(([left, top, right, bottom]) => column >= left && column <= right && row >= top && row <= bottom);
  const upper = upperRows.some(([top, bottom, left, right]) => row >= top && row <= bottom && column >= left && column <= right);
  const bow = bowRows.some(([top, bottom, left, right]) => row >= top && row <= bottom && column >= left && column <= right);
  const oldTail = tailRows.some(([top, bottom, left, right]) => row >= top && row <= bottom && column >= left && column <= right) && source[offset + 3] > 0;
  const editable = (upper || bow || oldTail) && !skin;
  mask.set(editable ? [255, 255, 255, 255] : [0, 0, 0, 255], offset);
  protectedSkin.set(skin ? [255, 255, 255, 255] : [0, 0, 0, 255], offset);
  if (editable) {
    selected++;
    selectedOpaque += Number(source[offset + 3] > 0);
    overlay.set([30, 200, 155, 255], offset);
  }
  assert.ok(!(editable && skin));
  assert.ok(!editable || row < 78);
}
assert.ok(selected > 500 && selected < 2200);
const context = Buffer.alloc(384 * 128 * 4);
for (const [index, data] of [source, east, front].entries()) for (let row = 0; row < 128; row++) data.copy(context, (row * 384 + index * 128) * 4, row * 128 * 4, (row + 1) * 128 * 4);
const maskBytes = await png(mask);
const contextBytes = await png(context, 384, 128);
const description = 'Repair ONLY the selected existing hair and crimson tie identity of the LEFT right-facing male Shaman. This is the SAME MASTER hairstyle, NOT a new hairstyle. MIDDLE owned original east shows the required short spiky warm ivory upper hair, large crimson bow behind the near ear, and separated segmented tied ivory tail with crimson bindings. RIGHT is the immutable master front. Replace LEFT invented long loose flowing hair with that SAME bow and tied segmented tail, projected naturally into this genuine RIGHT profile. Match master head volume, fine native one-pixel strand clusters, warm ivory shadows, outline and shading; no oversized new scalp, smooth helmet, loose cape of hair, new equipment or ornaments. Keep LEFT exposed profile face, eye, projecting nose, jaw, ear, neck and every black-mask pixel EXACT. Never paint over or erase the protected profile. Fill upper hair coherently without transparent scalp gaps. Mask contains upper hair/bow destination and precisely bounded old loose-hair footprint only. Where old loose hair is removed: restore transparency outside the actor; reconstruct existing cream mantle/cloth ONLY where the old hair had already hidden it, with no new garment design. Existing visible cloth, skin, arms, hands, trousers, sandals, stance and feet must not change. No whole actor redraw, move, scale, rotation, texture transplant, background or second figure. Native128 transparent output, existing lowest occupied row123 unchanged. Return complete edited sprite, only white-mask pixels may differ. References are original owned art only.';
const request = {
  description, image_base64: sourceBytes.toString('base64'), mask_image_base64: maskBytes.toString('base64'),
  context_image: { base64: contextBytes.toString('base64'), usage_description: 'LEFT native128 raw rotation is sole edit target at x0,y0. MIDDLE native128 original east is exact master hair/bow/tied-tail identity reference, not a pose transplant. RIGHT native128 front is immutable master. No reference is resized or rotated. Preserve LEFT profile anatomy and visible body.' },
  bounding_box: { x: 0, y: 0, width: 128, height: 128 }, crop_to_mask: true, no_background: true, output_method: 'Modify current layer', seed: 1009
};
const live = JSON.parse(await readFile(path.join(directory, 'tools-live.json'), 'utf8'));
const schema = live.result.tools.find(tool => tool.name === 'inpaint_image_pro_flash').inputSchema;
for (const key of Object.keys(request)) assert.ok(key in schema.properties, `Unsupported field ${key}`);
assert.ok(description.length <= schema.properties.description.maxLength);
assert.ok(schema.properties.output_method.enum.includes(request.output_method));
assert.equal(schema.properties.crop_to_mask.const, true);
assert.ok((await sharp(maskBytes).ensureAlpha().raw().toBuffer()).equals(mask));
await mkdir(directory, { recursive: true });
await writeFile(path.join(directory, 'input.png'), sourceBytes);
await writeFile(path.join(directory, 'mask-binary.png'), maskBytes);
await writeFile(path.join(directory, 'protected-profile.png'), await png(protectedSkin));
await writeFile(path.join(directory, 'mask-overlay-2x.png'), await png(doubled(overlay, 128, 128), 256, 256));
await writeFile(path.join(directory, 'input-2x.png'), await png(doubled(source, 128, 128), 256, 256));
await writeFile(path.join(directory, 'context-native.png'), contextBytes);
await writeFile(path.join(directory, 'context-2x.png'), await png(doubled(context, 384, 128), 768, 256));
await save('request.json', request);
await save('quote-request.json', { operation: 'inpaint', width: 128, height: 128 });
await save('wait-request.json', { timeout_seconds: 90 });
await save('preparation.json', {
  approved: false, submitted: false, internalAdditionalCreditCap: 6, userApprovedNumericalBudget: null,
  source: rawPath, sourcePngSha256: hash(sourceBytes), sourceRgbaSha256: hash(source),
  frontPngSha256: hash(frontBytes), originalEastPngSha256: hash(eastBytes), maskPngSha256: hash(maskBytes),
  selectedPixels: selected, selectedOpaquePixels: selectedOpaque, protectedPixels: 16384 - selected,
  protectedProfileRegions: skinRegions, oldHairRemovalRows: tailRows,
  upperHairDestinationRows: upperRows, bowDestinationRows: bowRows,
  hiddenGeometry: 'Any cloth revealed under old hair is provisional reconstruction only; no clean garment/head-body layers claimed.',
  manualTransplant: 'Not used: original east and rotation head silhouettes/pose anatomy do not align exactly.',
  contextOrder: ['raw-rotation-edit-target', 'owned-original-east-identity', 'immutable-master-front'],
  contextSize: [384, 128], nativeSize: [128, 128], noTransform: true, liveSchemaChecked: true,
  stopPolicy: 'One repair only; no retry on failure; no north/west review or generation before right approval.'
});
console.log(`PASS preparation: ${selected} selected (${selectedOpaque} opaque), ${16384 - selected} protected; native128, exact mask bytes/context rows, live schema, protected profile.`);
console.log('Pixel diagnostic x30..85: H=ivory S=warm C=dark/cloth .=transparent');
for (let row = 20; row <= 77; row++) {
  let line = '';
  for (let column = 30; column <= 85; column++) {
    const [red, green, blue, alpha] = source.subarray((row * 128 + column) * 4, (row * 128 + column) * 4 + 4);
    line += !alpha ? '.' : green > 140 && blue > 115 && red - blue < 65 ? 'H' : red > 145 && green > 90 && blue > 55 ? 'S' : 'C';
  }
  console.log(`${row} ${line}`);
}