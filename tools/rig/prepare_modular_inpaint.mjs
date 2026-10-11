import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';

const [state, facing, frameText, garmentMaskPath, protectedMaskPath, description] = process.argv.slice(2);
if (!description || !garmentMaskPath || !protectedMaskPath) throw new Error('Usage: node tools/rig/prepare_modular_inpaint.mjs <state> <facing> <frame> <reviewed-garment-mask.png> <reviewed-protected-mask.png> <description>. Prepares a request only; never calls PixelLab.');
const root = fileURLToPath(new URL('../../', import.meta.url));
const require = createRequire(new URL('../../apps/client/package.json', import.meta.url));
const sharp = createRequire(require.resolve('next'))('sharp');
const template = JSON.parse(await readFile(path.join(root, 'docs/design/modular-character/pose-template.json'), 'utf8'));
const frame = Number(frameText);
assert.ok(Number.isInteger(frame) && frame >= 0 && template.clips[state]?.[facing]?.frames[frame], 'pose must exist');
assert.ok(description.length <= 1600, 'keep space for identity constraints');
const readMask = async filename => {
  const image = await sharp(filename).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  assert.equal(image.info.width, 128, 'mask must match native source, not padded runtime canvas');
  assert.equal(image.info.height, 128);
  for (let index = 0; index < image.data.length; index += 4) {
    const value = image.data[index];
    assert.ok((value === 0 || value === 255) && image.data[index + 1] === value && image.data[index + 2] === value, 'mask RGB must be pure black/white; alpha is ignored');
  }
  return image;
};
const garment = await readMask(garmentMaskPath), protectedMask = await readMask(protectedMaskPath);
let editable = 0, protectedPixels = 0;
for (let index = 0; index < garment.data.length; index += 4) {
  if (garment.data[index] === 255) editable++;
  if (protectedMask.data[index] === 255) protectedPixels++;
  assert.ok(!(garment.data[index] === 255 && protectedMask.data[index] === 255), 'garment mask overlaps independently protected head/skin');
}
assert.ok(editable > 0 && protectedPixels > 0, 'both masks must be nonempty and independently reviewed');
const source = await sharp(path.join(root, `apps/client/public/assets/rig-v2/male/base/${state}-${facing}.png`)).extract({ left: frame * 128, top: 0, width: 128, height: 128 }).png().toBuffer();
const request = {
  description: `${description} Preserve the original Shaman face, hair, exposed skin, proportions and pose. Modify only reviewed garment pixels. Crisp native pixel art, matching existing woven cloth, aged bronze, light and shading. No new body, weapons, text or effects.`,
  image_base64: source.toString('base64'),
  mask_image_base64: (await readFile(garmentMaskPath)).toString('base64'),
  crop_to_mask: true,
  output_method: 'New layer with changes',
  seed: 0,
};
const output = path.join(root, 'docs/design/modular-character/requests', `${state}-${facing}-${frame}`);
await mkdir(output, { recursive: true });
await writeFile(path.join(output, 'arguments.json'), JSON.stringify(request, null, 2) + '\n');
await writeFile(path.join(output, 'provenance.json'), JSON.stringify({ tool: 'inpaint_image_pro_flash', state, facing, frame, templateId: template.id, garmentMask: path.relative(root, path.resolve(garmentMaskPath)).replaceAll('\\', '/'), protectedMask: path.relative(root, path.resolve(protectedMaskPath)).replaceAll('\\', '/'), editable, protectedPixels, submitted: false, approved: false }, null, 2) + '\n');
console.log(`Prepared changes-only request at ${path.relative(root, output)}; not submitted. Review native output bounds and protected RGBA before packaging.`);