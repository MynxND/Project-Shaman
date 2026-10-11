import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../../', import.meta.url));
const require = createRequire(new URL('../../apps/client/package.json', import.meta.url));
const sharp = createRequire(require.resolve('next'))('sharp');
const directory = path.join(root, 'docs/design/character-turnaround');
const publicRoot = path.join(root, 'apps/client/public/assets/character-turnaround');
const save = async (name, value) => writeFile(path.join(directory, name), JSON.stringify(value, null, 2) + '\n');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const source = await readFile(path.join(publicRoot, 'east-original.png'));
const front = await readFile(path.join(publicRoot, 'south-original.png'));
const sourceData = await sharp(source).ensureAlpha().raw().toBuffer();
const frontData = await sharp(front).ensureAlpha().raw().toBuffer();
const strip = await sharp(path.join(root, 'apps/client/public/assets/rig-v2/male/base/idle-east.png')).extract({ left: 0, top: 0, width: 128, height: 128 }).ensureAlpha().raw().toBuffer();
assert.deepEqual(sourceData, strip);
assert.deepEqual(front, await readFile(path.join(root, 'docs/design/head-proof/source/south.png')));
const live = JSON.parse(await readFile(path.join(directory, 'pixellab-right90-live.json'), 'utf8'));
const schema = live.result.tools.find(tool => tool.name === 'inpaint_image_pro_flash').inputSchema;
const mask = Buffer.alloc(128 * 128 * 4);
let editablePixels = 0;
let editableTransparentPixels = 0;
for (let pixel = 0; pixel < 128 * 128; pixel++) {
  const column = pixel % 128;
  const row = Math.floor(pixel / 128);
  const editable = column >= 20 && column <= 88 && row >= 3 && row <= 106
    || column >= 49 && column <= 82 && row >= 107 && row <= 124;
  mask.set(editable ? [255, 255, 255, 255] : [0, 0, 0, 255], pixel * 4);
  editablePixels += Number(editable);
  editableTransparentPixels += Number(editable && !sourceData[pixel * 4 + 3]);
}
const maskPng = await sharp(mask, { raw: { width: 128, height: 128, channels: 4 } }).png().toBuffer();
const context = await sharp({ create: { width: 256, height: 128, channels: 4, background: '#00000000' } }).composite([
  { input: source, left: 0, top: 0 },
  { input: front, left: 128, top: 0 }
]).png().toBuffer();
const description = 'Correct ONLY the boxed LEFT original into a strict RIGHT-facing 90-degree anatomical side profile of the SAME male Shaman shown in the RIGHT preserved front. NOT front-three-quarter, NOT an ambiguous turned pose. One near eye only, nose projects RIGHT in clean profile, far eye hidden; skull, jaw, ear and neck agree with a true side view. Turn the torso and pelvis fully sideways: narrow chest DEPTH, overlapping shoulders, arms and legs, no broad frontal chest or apron plane. Preserve SAME warm skin/face palette, spiky silver-ivory hair silhouette/design, head-to-body ratio, head height rows5-38, neck row38, shoulders row43, hip row77 and total height119px from our native front proportion template. Preserve cream fur mantle/tunic, crimson sash, bronze amulet, matching apron embroidery and hem ornaments, dark trousers, sandals and the original character, not a new outfit or hairstyle. Apron is seen edge-on with coherent folds and side seams; keep its existing ornament language, no new symbols. Correct obsolete diagonal cloth/hair-tail pixels and their transparent surroundings inside the WHITE mask. Paint the native128 anatomy and foot contour directly; origin(64,124), lowest occupied row123, transparent row124. Do NOT move, resize, stretch, resample or rotate the whole sprite to align it. Keep one-pixel clusters, outline weight and original warm palette. Same upright idle stance and pixel density as front. All BLACK-mask pixels, including transparent canvas, stay exact RGBA. Output a complete edited transparent native128 sprite. Do not add a second figure, background, weapon, armor, crown or animation. The right context front is immutable identity/proportion evidence; NEVER edit it. Owned original art only. If side geometry conflicts with existing visible art, repaint only white-mask pixels rather than preserving the incorrect three-quarter planes.';
const request = {
  description,
  image_base64: source.toString('base64'),
  mask_image_base64: maskPng.toString('base64'),
  context_image: { base64: context.toString('base64'), usage_description: 'LEFT exact native128 east frame0 is the sole edit target, boxed x0,y0,w128,h128. RIGHT exact native128 rig-v2 south frame0 is immutable identity and proportion template. Original owned reference-sheet design informs this preserved front; do not copy unrelated sheet poses. Same character and 1:1 pixel density, no scaling.' },
  bounding_box: { x: 0, y: 0, width: 128, height: 128 },
  crop_to_mask: true,
  no_background: true,
  output_method: 'Modify current layer',
  seed: 909
};
for (const key of Object.keys(request)) assert.ok(key in schema.properties, `Unsupported field ${key}`);
assert.ok(description.length <= schema.properties.description.maxLength);
assert.ok(schema.properties.output_method.enum.includes(request.output_method));
assert.equal(schema.properties.crop_to_mask.const, true);
const decodedMask = await sharp(maskPng).ensureAlpha().raw().toBuffer();
assert.deepEqual(decodedMask, mask);
for (let offset = 0; offset < mask.length; offset += 4) {
  assert.ok(mask[offset] === 0 || mask[offset] === 255);
  assert.equal(mask[offset], mask[offset + 1]);
  assert.equal(mask[offset], mask[offset + 2]);
  assert.equal(mask[offset + 3], 255);
}
assert.deepEqual(await sharp(context).extract({ left: 0, top: 0, width: 128, height: 128 }).ensureAlpha().raw().toBuffer(), sourceData);
assert.deepEqual(await sharp(context).extract({ left: 128, top: 0, width: 128, height: 128 }).ensureAlpha().raw().toBuffer(), frontData);
await mkdir(path.join(directory, 'right90'), { recursive: true });
await writeFile(path.join(directory, 'right90/input.png'), source);
await writeFile(path.join(directory, 'right90/context-native.png'), context);
await writeFile(path.join(directory, 'right90/mask-binary.png'), maskPng);
await save('right90/request.json', request);
await save('right90/preparation.json', {
  method: 'reference-guided-native-masked-inpaint',
  tool: 'inpaint_image_pro_flash',
  internalAdditionalCreditCap: 6,
  userApprovedNumericalBudget: null,
  submitted: false,
  editablePixels,
  editableTransparentPixels,
  protectedPixels: 128 * 128 - editablePixels,
  maskRegions: [{ left: 20, top: 3, right: 88, bottom: 106 }, { left: 49, top: 107, right: 82, bottom: 124 }],
  nativeSize: [128, 128], contextSize: [256, 128], boundingBox: request.bounding_box,
  source: 'apps/client/public/assets/rig-v2/male/base/idle-east.png', frame: 0,
  preservedFront: 'apps/client/public/assets/rig-v2/male/base/idle-south.png',
  ownedReferenceSheet: 'docs/design/comfyui/reference/shamen-base-sheet.webp',
  proportionTemplate: 'docs/design/character-turnaround/proportion-template.json',
  sourceRgbaSha256: hash(sourceData), frontPngSha256: hash(front), maskPngSha256: hash(maskPng),
  noSpriteTransform: true, approved: false,
  reviewGate: 'One attempt only; inspect native and nearest2x. Reject on angle, anatomy, identity or baseline failure; no back/left generation.'
});
console.log(JSON.stringify({ check: 'PASS', descriptionLength: description.length, editablePixels, editableTransparentPixels, protectedPixels: 16384 - editablePixels, sourceExact: true, frontExact: true, boxedContextExact: true, liveSchemaChecked: true }));