import { createRequire } from 'node:module';
import { readFile, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const require = createRequire(new URL('../../apps/client/package.json', import.meta.url));
const sharp = createRequire(require.resolve('next'))('sharp');
const directory = new URL('../../docs/design/head-proof/', import.meta.url);
const input = await readFile(new URL('../../apps/client/public/assets/head-proof/north/head.png', import.meta.url));
const { data: mask } = await sharp(fileURLToPath(new URL('masks/north-short-head-only.png', directory))).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
let editablePixels = 0;
for (let pixel = 0; pixel < 128 * 128; pixel++) {
  const column = pixel % 128;
  const row = Math.floor(pixel / 128);
  const protectedSkin = row >= 37 || (row >= 26 && (column <= 54 || column >= 72));
  const editable = mask[pixel * 4] === 255 && !protectedSkin;
  mask.set(editable ? [255, 255, 255, 255] : [0, 0, 0, 255], pixel * 4);
  editablePixels += Number(editable);
}
assert.ok(editablePixels > 100);
const maskPng = await sharp(mask, { raw: { width: 128, height: 128, channels: 4 } }).png().toBuffer();
const context = await sharp({ create: { width: 384, height: 128, channels: 4, background: '#00000000' } }).composite([
  { input: await readFile(new URL('previews/south-short-head-native.png', directory)), left: 0, top: 0 },
  { input: await readFile(new URL('previews/east-short-head-native.png', directory)), left: 128, top: 0 },
  { input, left: 256, top: 0 }
]).png().toBuffer();
const description = 'Add the NORTH/BACK view of the SAME short silver layered hairstyle shown in the original Shaman south and east context heads. The rightmost head is the edit target, facing AWAY: do not add face or eyes. Keep its native head scale and coordinates. Paint one coherent rounded cropped hairstyle, soft asymmetric layered locks with fine directional strand clusters flowing from crown to tapered short nape; match the front/side warm silver-ivory palette, detailed crisp one-pixel outlines and upper-left light. Avoid a rigid helmet, jagged vertical stripes, texture collage or tall spikes. Cover the bald upper scalp completely. A clean short nape ends above the preserved neck. Black-mask rear ears, side skin and neck are protected and must stay exactly unchanged. Source is an independent hair-free HEAD ONLY, never a body. White mask is the only allowed hair area. Return ONLY newly painted HAIR on a transparent separate changes layer: no scalp/skin pixels, face, eyes, torso, clothes, crown, bow, feathers, ribbons, ponytail or long tail. Context contains only our own original Shaman art, not external game sprites.';
const prompt = {
  description,
  image_base64: input.toString('base64'),
  mask_image_base64: maskPng.toString('base64'),
  context_image: { base64: context.toString('base64'), usage_description: 'Left: own south short hair. Middle: own east short hair. Right: exact north bald head target. Match one hairstyle across all three views; only the right source rectangle may change.' },
  bounding_box: { x: 256, y: 0, width: 128, height: 128 },
  crop_to_mask: true,
  no_background: true,
  output_method: 'New layer with changes',
  seed: 612
};
const live = JSON.parse(await readFile(new URL('pixellab-tools-north-correction-live.json', directory), 'utf8'));
const schema = live.result.tools.find(tool => tool.name === 'inpaint_image_pro_flash').inputSchema;
for (const key of Object.keys(prompt)) assert.ok(key in schema.properties, `Unsupported field: ${key}`);
assert.ok(description.length <= schema.properties.description.maxLength);
for (const filename of ['scalp-east', 'scalp-north', 'short-south', 'short-east']) {
  const receipt = JSON.parse(await readFile(new URL(`jobs/${filename}-submit.json`, directory), 'utf8'));
  assert.equal(receipt.result.structuredContent.estimated_generations, 6);
}
await writeFile(new URL('source-edits/north-short-correction-input.png', directory), input);
await writeFile(new URL('source-edits/north-short-correction-context.png', directory), context);
await writeFile(new URL('masks/north-short-correction-head-only.png', directory), maskPng);
await writeFile(new URL('prompts/short-north-correction-request.json', directory), JSON.stringify(prompt, null, 2) + '\n');
await writeFile(new URL('north-short-correction-provenance.json', directory), JSON.stringify({ approved: false, internalAdditionalGenerationCap: 6, priorChargedGenerations: 30, expectedGenerations: 6, costBasis: 'Four identical native128 masked-inpaint submit receipts; live capabilities do not expose an estimator', editablePixels, protectedRegions: ['row >= 37: neck', 'row >= 26 and x <= 54 or x >= 72: rear ears/side skin'], source: 'source-edits/north-short-correction-input.png', context: 'source-edits/north-short-correction-context.png', request: 'prompts/short-north-correction-request.json', mask: 'masks/north-short-correction-head-only.png', references: ['previews/south-short-head-native.png', 'previews/east-short-head-native.png'], nativeCanvas: { width: 128, height: 128 } }, null, 2) + '\n');
console.log(`PASS correction preparation: native128, ${editablePixels} editable pixels; own native head context; live schema and six-credit prior estimates checked.`);