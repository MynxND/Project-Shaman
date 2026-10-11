// Builds 4-direction Global Shaman character workflows for ComfyUI (API format).
// Usage: node tools/comfyui/build-direction-workflows.mjs [--outfit base|apprentice] [--queue]
// Writes docs/design/comfyui/shamen-<outfit>-<gender>-4dir-sdxl.api.json.
// --queue also submits both graphs to a local ComfyUI at http://127.0.0.1:8188.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const outDir = path.join(root, 'docs/design/comfyui');

const STYLE = 'soft cel shading, thin dark outlines, rich warm earthy palette, strong contrast, '
  + 'classic 2000s MMORPG character sprite, plain white background, no ground shadow';

const NEGATIVE = 'tall, long legs, slender, realistic proportions, (multiple characters:1.3), (character sheet:1.3), '
  + 'sprite sheet, turnaround, multiple views, reference sheet, separate weapon, item icons, 3d render, realistic, photo, '
  + 'blurry, painterly, text, watermark, logo, cropped, cut off feet, extra limbs, busy background, scenery, floor, '
  + '(pastel:1.2), (washed out:1.2), pink tint, desaturated, (ground shadow:1.3), drop shadow, cast shadow';

// Base = paper-doll body that class outfits are drawn over. It always wears a plain
// neutral underlayer; never generate nude or sexualised bodies.
const OUTFITS = {
  base: {
    prompt: '(super deformed chibi:1.4), (huge round head:1.3), (short stubby limbs:1.2), (equipment base body:1.2), '
      + 'wearing only a (simple plain grey one-piece bodysuit covering torso and upper thighs:1.4), bare arms, (barefoot:1.3), '
      + 'arms relaxed slightly away from the body, no accessories, no jewelry, no hair ornaments',
    negative: ', (robe, tunic, coat, cape, armor, apron, sash, skirt, jacket, vest:1.3), (boots, shoes, sandals, socks, belt, straps, gloves, wristbands, pockets, bag:1.4), jewelry, amulet, ribbons, feathers, '
      + '(nude, naked, nsfw, underwear, cleavage, sexualized:1.5)',
    // The references wear the apprentice outfit; a lower linear weight keeps their proportions and face without most of the clothing.
    ipadapter: { weight: 0.5, weight_type: 'linear' },
    looks: {
      male: 'youthful adult man, spiky messy silver-white hair, red-brown eyes, calm face',
      female: 'youthful adult woman, long straight light blonde hair, red-brown eyes, gentle face',
    },
  },
  apprentice: {
    prompt: 'apprentice shaman outfit, layered cream long-sleeve tunic with embroidered cuffs, '
      + 'short fur-trimmed shoulder mantle, dark moss green vest, saturated brick red cloth sash with round bronze amulet buckle, '
      + 'hanging woven green and gold patterned apron panel, red prayer ribbons and small feather charm in hair, '
      + 'leather sandals with wrapped ankle cloth',
    negative: ', modern clothes, armor',
    ipadapter: null,
    looks: {
      male: 'young boy, spiky messy silver-white hair, red-brown eyes, calm face, dark chocolate brown baggy trousers',
      female: 'young girl, long straight light blonde hair, red-brown eyes, gentle face, short layered dark skirt with white knee socks',
    },
  },
};

const GENDERS = {
  male: { seed: 309 },
  female: {
    seed: 409,
    // The sheet's female side view is three-quarter and its back view has short hair, so lean on the prompt there.
    overrides: {
      left: { weight: 0.5, view: '(side view:1.5), (profile:1.3), body and face turned to the left' },
      up: { weight: 0.5, view: '(back view:1.4), seen from behind, facing away from the viewer, (long straight light blonde hair hanging down the back to the waist:1.4)' },
    },
  },
};

// Right is generated as a mirror of left, as classic sprite games do.
const DIRECTIONS = [
  { key: 'down', base: 20, ref: 'front', weight: 0.7, view: 'three-quarter front view facing the viewer', neg: '' },
  { key: 'left', base: 30, ref: 'side', weight: 0.75, view: '(side view:1.3), profile, body and face turned to the left', neg: ', front view, facing the viewer' },
  { key: 'up', base: 40, ref: 'back', weight: 0.75, view: '(back view:1.4), seen from behind, facing away from the viewer, back of the head visible', neg: ', (face:1.3), eyes, front view, facing the viewer' },
];

function build(outfitKey, gender) {
  const outfit = OUTFITS[outfitKey];
  const g = GENDERS[gender];
  const prefix = `shaman/${outfitKey}_${gender}`;
  const wf = {
    1: { class_type: 'CheckpointLoaderSimple', _meta: { title: 'SDXL base' }, inputs: { ckpt_name: 'sd_xl_base_1.0.safetensors' } },
    2: { class_type: 'LoraLoader', _meta: { title: 'Pixel Art XL' }, inputs: { model: ['1', 0], clip: ['1', 1], lora_name: 'pixel-art-xl.safetensors', strength_model: 1.0, strength_clip: 1.0 } },
    3: { class_type: 'IPAdapterUnifiedLoader', _meta: { title: 'IP-Adapter PLUS SDXL' }, inputs: { model: ['2', 0], preset: 'PLUS (high strength)' } },
    4: { class_type: 'EmptyLatentImage', _meta: { title: 'Canvas 896x1152 (/8 = 112x144), shared by all directions' }, inputs: { width: 896, height: 1152, batch_size: 2 } },
  };

  for (const baseDir of DIRECTIONS) {
    const d = { ...baseDir, ...(g.overrides?.[baseDir.key] ?? {}), ...(outfit.ipadapter ?? {}) };
    const id = (n) => String(d.base + n);
    const positive = `pixel art, solo, one single character centered, (chibi:1.3), (big head:1.2), about 3 heads tall, full body game sprite, `
      + `original Global Shaman base character, ${outfit.looks[gender]}, ${outfit.prompt}, ${d.view}, standing idle, feet visible, ${STYLE}`;
    Object.assign(wf, {
      [id(0)]: { class_type: 'LoadImage', _meta: { title: `Reference ${d.key}: Shamen base ${gender} ${d.ref}` }, inputs: { image: `shamen-base-${gender}-${d.ref}.png` } },
      [id(1)]: { class_type: 'IPAdapterAdvanced', _meta: { title: `IP-Adapter ${d.key}` }, inputs: { model: ['3', 0], ipadapter: ['3', 1], image: [id(0), 0], weight: d.weight, weight_type: d.weight_type ?? 'linear', combine_embeds: 'concat', start_at: 0.0, end_at: 0.85, embeds_scaling: 'V only' } },
      [id(2)]: { class_type: 'CLIPTextEncode', _meta: { title: `Positive ${d.key}` }, inputs: { clip: ['2', 1], text: positive } },
      [id(3)]: { class_type: 'CLIPTextEncode', _meta: { title: `Negative ${d.key}` }, inputs: { clip: ['2', 1], text: NEGATIVE + outfit.negative + d.neg } },
      [id(4)]: { class_type: 'KSampler', _meta: { title: `Sampler ${d.key} (same seed for every direction)` }, inputs: { model: [id(1), 0], positive: [id(2), 0], negative: [id(3), 0], latent_image: ['4', 0], seed: g.seed, steps: 28, cfg: 6.0, sampler_name: 'dpmpp_2m', scheduler: 'karras', denoise: 1.0 } },
      [id(5)]: { class_type: 'VAEDecode', inputs: { samples: [id(4), 0], vae: ['1', 2] } },
      [id(6)]: { class_type: 'ImageScale', _meta: { title: 'Pixel grid 112x144 (nearest, /8)' }, inputs: { image: [id(5), 0], upscale_method: 'nearest-exact', width: 112, height: 144, crop: 'disabled' } },
      [id(7)]: { class_type: 'ShamanPixelColorBoost', _meta: { title: 'Color boost' }, inputs: { image: [id(6), 0], saturation: 1.15, contrast: 1.1 } },
      [id(8)]: { class_type: 'ShamanPixelBackgroundKey', _meta: { title: 'Remove background + ground shadow' }, inputs: { image: [id(7), 0], tolerance: 0.12, remove_ground_shadow: true, shadow_rows: 0.3 } },
      [id(9)]: { class_type: 'SaveImage', _meta: { title: `Save ${d.key} 112x144 RGBA` }, inputs: { images: [id(8), 0], filename_prefix: `${prefix}_${d.key}` } },
    });
  }

  Object.assign(wf, {
    50: { class_type: 'ImageFlip', _meta: { title: 'Right = mirrored left' }, inputs: { image: ['38', 0], flip_method: 'y-axis: horizontally' } },
    51: { class_type: 'SaveImage', _meta: { title: 'Save right 112x144 RGBA' }, inputs: { images: ['50', 0], filename_prefix: `${prefix}_right` } },
  });
  return wf;
}

const args = process.argv.slice(2);
const outfitKey = args.includes('--outfit') ? args[args.indexOf('--outfit') + 1] : 'base';
if (!OUTFITS[outfitKey]) throw new Error(`Unknown outfit "${outfitKey}". Use: ${Object.keys(OUTFITS).join(', ')}`);
const queue = args.includes('--queue');

for (const gender of Object.keys(GENDERS)) {
  const wf = build(outfitKey, gender);
  const file = path.join(outDir, `shamen-${outfitKey}-${gender}-4dir-sdxl.api.json`);
  writeFileSync(file, JSON.stringify(wf, null, 2) + '\n');
  console.log('wrote', path.relative(root, file));
  if (queue) {
    const res = await fetch('http://127.0.0.1:8188/prompt', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: wf }),
    });
    console.log(gender, await res.text());
  }
}
