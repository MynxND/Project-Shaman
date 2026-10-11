// Inpaints the clothed Shamen base reference crops into a plain paper-doll base body.
// Usage: node tools/comfyui/build-base-inpaint-workflows.mjs [--queue] [--seed N]
// Inputs (copied into ComfyUI/input): docs/design/comfyui/reference/inpaint/<gender>-<view>-{1024,mask}.png
// Writes docs/design/comfyui/shamen-base-inpaint-sdxl.api.json (all six views in one graph).
// The base body always wears a plain grey bodysuit; never generate nude or sexualised bodies.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const seed = args.includes('--seed') ? Number(args[args.indexOf('--seed') + 1]) : 512;

const LOOKS = {
  male: 'youthful adult man, spiky messy silver-white hair',
  female: 'youthful adult woman, long straight light blonde hair',
};
const VIEWS = {
  front: 'three-quarter front view facing the viewer',
  side: 'side view, body turned to the left',
  back: 'back view, seen from behind',
};

const POSITIVE = (gender, view) => 'pixel art, solo, chibi game sprite, (equipment base body:1.3), same character, '
  + `${LOOKS[gender]}, wearing only a (simple plain grey one-piece bodysuit covering torso and upper thighs:1.4), `
  + `bare arms, bare lower legs, (barefoot:1.3), plain body without accessories, ${VIEWS[view]}, standing idle, `
  + 'soft cel shading, thin dark outlines, classic 2000s MMORPG character sprite, plain white background';

const NEGATIVE = '(robe, tunic, coat, cape, mantle, fur, armor, apron, sash, skirt, jacket, vest, trousers:1.4), '
  + '(boots, shoes, sandals, socks, belt, straps, gloves, wristbands, bag:1.4), jewelry, amulet, ribbons, tassels, '
  + '(nude, naked, nsfw, underwear, cleavage, sexualized:1.5), multiple characters, text, watermark, blurry, '
  + 'realistic, 3d render, ground shadow, scenery';

function build() {
  const wf = {
    1: { class_type: 'CheckpointLoaderSimple', _meta: { title: 'SDXL base' }, inputs: { ckpt_name: 'sd_xl_base_1.0.safetensors' } },
    2: { class_type: 'LoraLoader', _meta: { title: 'Pixel Art XL' }, inputs: { model: ['1', 0], clip: ['1', 1], lora_name: 'pixel-art-xl.safetensors', strength_model: 1.0, strength_clip: 1.0 } },
  };
  let base = 100;
  for (const gender of Object.keys(LOOKS)) {
    for (const view of Object.keys(VIEWS)) {
      const id = (n) => String(base + n);
      const name = `${gender}-${view}`;
      Object.assign(wf, {
        [id(0)]: { class_type: 'LoadImage', _meta: { title: `Reference ${name} (1024)` }, inputs: { image: `${name}-1024.png` } },
        [id(1)]: { class_type: 'LoadImageMask', _meta: { title: `Body mask ${name} (white = repaint)` }, inputs: { image: `${name}-mask.png`, channel: 'red' } },
        [id(2)]: { class_type: 'VAEEncode', inputs: { pixels: [id(0), 0], vae: ['1', 2] } },
        [id(3)]: { class_type: 'SetLatentNoiseMask', inputs: { samples: [id(2), 0], mask: [id(1), 0] } },
        [id(4)]: { class_type: 'CLIPTextEncode', _meta: { title: `Positive ${name}` }, inputs: { clip: ['2', 1], text: POSITIVE(gender, view) } },
        [id(5)]: { class_type: 'CLIPTextEncode', _meta: { title: `Negative ${name}` }, inputs: { clip: ['2', 1], text: NEGATIVE } },
        [id(6)]: { class_type: 'KSampler', _meta: { title: `Inpaint ${name}` }, inputs: { model: ['2', 0], positive: [id(4), 0], negative: [id(5), 0], latent_image: [id(3), 0], seed, steps: 30, cfg: 6.5, sampler_name: 'dpmpp_2m', scheduler: 'karras', denoise: 0.88 } },
        [id(7)]: { class_type: 'VAEDecode', inputs: { samples: [id(6), 0], vae: ['1', 2] } },
        [id(8)]: { class_type: 'ImageCompositeMasked', _meta: { title: 'Keep original pixels outside the mask' }, inputs: { destination: [id(0), 0], source: [id(7), 0], x: 0, y: 0, resize_source: false, mask: [id(1), 0] } },
        [id(9)]: { class_type: 'SaveImage', _meta: { title: `Save base ref ${name} 1024` }, inputs: { images: [id(8), 0], filename_prefix: `shaman/base_ref_${gender}_${view}` } },
        [id(10)]: { class_type: 'ImageScale', _meta: { title: 'Pixel grid 128 (nearest, /8)' }, inputs: { image: [id(8), 0], upscale_method: 'nearest-exact', width: 128, height: 128, crop: 'disabled' } },
        [id(11)]: { class_type: 'ShamanPixelBackgroundKey', _meta: { title: 'Remove background + ground shadow' }, inputs: { image: [id(10), 0], tolerance: 0.12, remove_ground_shadow: true, shadow_rows: 0.3 } },
        [id(12)]: { class_type: 'SaveImage', _meta: { title: `Save base sprite ${name} 128 RGBA` }, inputs: { images: [id(11), 0], filename_prefix: `shaman/base_sprite_${gender}_${view}` } },
      });
      base += 20;
    }
  }
  return wf;
}

const wf = build();
const file = path.join(root, 'docs/design/comfyui/shamen-base-inpaint-sdxl.api.json');
writeFileSync(file, JSON.stringify(wf, null, 2) + '\n');
console.log('wrote', path.relative(root, file), 'seed', seed);
if (args.includes('--queue')) {
  const res = await fetch('http://127.0.0.1:8188/prompt', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: wf }),
  });
  console.log(await res.text());
}
