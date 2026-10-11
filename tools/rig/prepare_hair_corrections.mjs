import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';

const require = createRequire(new URL('../../apps/client/package.json', import.meta.url));
const sharp = createRequire(require.resolve('next'))('sharp');
const directory = new URL('../../docs/design/hair-collection/', import.meta.url);
const schema = JSON.parse(await readFile(new URL('pixellab-tools-live.json', directory), 'utf8')).result.tools.find(tool => tool.name === 'inpaint_image_pro_flash').inputSchema;
for (const [style, coordinates] of [['tapered-short', '70,16'], ['high-topknot', '69,16;70,16;70,17;71,17']]) {
  const request = JSON.parse(await readFile(new URL(`prompts/${style}-north.json`, directory), 'utf8'));
  const profile = await sharp({ create: { width: 128, height: 128, channels: 4, background: '#00000000' } }).composite(await Promise.all([
    `../../apps/client/public/assets/hair-collection/${style}/east/back.png`,
    '../../apps/client/public/assets/head-proof/east/head.png',
    `../../apps/client/public/assets/hair-collection/${style}/east/front.png`
  ].map(async filename => ({ input: await readFile(new URL(filename, import.meta.url)), left: 0, top: 0 })))).png().toBuffer();
  const context = await sharp({ create: { width: 384, height: 128, channels: 4, background: '#00000000' } }).composite([
    { input: await readFile(new URL(`../../apps/client/public/assets/hair-collection/${style}/portrait.png`, import.meta.url)), left: 0, top: 0 },
    { input: profile, left: 128, top: 0 },
    { input: Buffer.from(request.image_base64, 'base64'), left: 256, top: 0 }
  ]).png().toBuffer();
  request.context_image = { base64: context.toString('base64'), usage_description: 'Our accepted south hairstyle and east profile; rightmost exact unchanged bald north head is edit target. Never generate body or face.' };
  request.description = `NORTH/BACK original Shaman HAIR ONLY correction. Match the SAME ${style} from our own south/east context. ${style === 'tapered-short' ? 'Low compact tapered crop with separated short feathered locks, clean nape.' : 'Swept-back cap and one centered HIGH coiled topknot, fixed crimson tie, clean nape.'} Fully continuous cap over bald upper scalp; cover ALL existing scalp pixels in x56..71,y16..21, especially ${coordinates}. Do not leave tiny transparent holes at cap edge. Keep exact head scale/native coordinates and detailed silver-ivory pixel clusters. Black-mask rear ears, side skin and neck must remain protected. Return ONLY NEW HAIR on transparent separate changes layer. No scalp, skin, eyes, face, neck, body, clothing, long tail, feathers, UI, text or collage. Paint a complete coherent replacement hairstyle, not copied texture fragments. Upper-left light, crisp one-pixel outline. Rightmost native128 bald head is target; do not repaint any source pixels outside white mask.`;
  request.seed += 100;
  assert.ok(request.description.length <= schema.properties.description.maxLength);
  await writeFile(new URL(`source/${style}-north-correction-context.png`, directory), context);
  await writeFile(new URL(`prompts/${style}-north-correction.json`, directory), JSON.stringify(request, null, 2) + '\n');
}
console.log('PASS two six-credit correction requests prepared; original jobs and prompts retained.');