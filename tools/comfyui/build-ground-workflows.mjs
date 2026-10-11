// Seamless ground textures for Umbral Capital in local ComfyUI.
// Phase 1: node tools/comfyui/build-ground-workflows.mjs --phase 1 --queue
//   txt2img 1024x1024 texture -> output/umbral-ground/<id>_raw_*.png
// Then: python tools/comfyui/wrap_ground.py   (rolls each raw texture by half, writes input/<id>-wrapped.png + seam mask)
// Phase 2: node tools/comfyui/build-ground-workflows.mjs --phase 2 --queue
//   inpaint the centred seams -> nearest /8 -> output/umbral-ground/<id>_tile_*.png (128x128, tiles seamlessly)
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const outDir = path.join(root, 'docs/design/comfyui/map-assets');
const args = process.argv.slice(2);
const phase = Number(args[args.indexOf('--phase') + 1] ?? 1);

export const GROUNDS = [
  { id: 'basalt-cobble', desc: 'dark basalt cobblestone street paving, rounded grey-black stones with thin dark mortar' },
  { id: 'dark-earth', desc: 'packed dark brown earth ground with small pebbles and dry dirt' },
  { id: 'ritual-paving', desc: 'large square dark slate paving slabs with faint carved violet rune lines' },
  { id: 'dark-grass', desc: 'short dark green and grey grass ground with a few tiny dead leaves' },
];

const POSITIVE = (desc) => `pixel art, seamless tileable ground texture, ${desc}, viewed from above, uniform even lighting, `
  + 'evenly spread pattern with no focal point, game tileset texture, crisp pixel art, detailed shading';
const NEGATIVE = 'perspective, horizon, objects, buildings, characters, plants standing up, border, frame, vignette, '
  + 'text, watermark, blurry, photo, 3d render, large features, gradient lighting, shadows';

function loaders() {
  return {
    1: { class_type: 'CheckpointLoaderSimple', _meta: { title: 'SDXL base' }, inputs: { ckpt_name: 'sd_xl_base_1.0.safetensors' } },
    2: { class_type: 'LoraLoader', _meta: { title: 'Pixel Art XL' }, inputs: { model: ['1', 0], clip: ['1', 1], lora_name: 'pixel-art-xl.safetensors', strength_model: 1.0, strength_clip: 1.0 } },
  };
}

function phase1(g) {
  return {
    ...loaders(),
    3: { class_type: 'CLIPTextEncode', inputs: { clip: ['2', 1], text: POSITIVE(g.desc) } },
    4: { class_type: 'CLIPTextEncode', inputs: { clip: ['2', 1], text: NEGATIVE } },
    5: { class_type: 'EmptyLatentImage', inputs: { width: 1024, height: 1024, batch_size: 1 } },
    6: { class_type: 'KSampler', inputs: { model: ['2', 0], positive: ['3', 0], negative: ['4', 0], latent_image: ['5', 0], seed: 3001, steps: 28, cfg: 6.0, sampler_name: 'dpmpp_2m', scheduler: 'karras', denoise: 1.0 } },
    7: { class_type: 'VAEDecode', inputs: { samples: ['6', 0], vae: ['1', 2] } },
    8: { class_type: 'SaveImage', inputs: { images: ['7', 0], filename_prefix: `umbral-ground/${g.id}_raw` } },
  };
}

function phase2(g) {
  return {
    ...loaders(),
    3: { class_type: 'CLIPTextEncode', inputs: { clip: ['2', 1], text: POSITIVE(g.desc) } },
    4: { class_type: 'CLIPTextEncode', inputs: { clip: ['2', 1], text: NEGATIVE } },
    10: { class_type: 'LoadImage', _meta: { title: 'Half-rolled texture (seams centred)' }, inputs: { image: `${g.id}-wrapped.png` } },
    11: { class_type: 'LoadImageMask', _meta: { title: 'Seam cross mask' }, inputs: { image: `${g.id}-seam-mask.png`, channel: 'red' } },
    12: { class_type: 'VAEEncode', inputs: { pixels: ['10', 0], vae: ['1', 2] } },
    13: { class_type: 'SetLatentNoiseMask', inputs: { samples: ['12', 0], mask: ['11', 0] } },
    6: { class_type: 'KSampler', inputs: { model: ['2', 0], positive: ['3', 0], negative: ['4', 0], latent_image: ['13', 0], seed: 3002, steps: 28, cfg: 6.0, sampler_name: 'dpmpp_2m', scheduler: 'karras', denoise: 0.75 } },
    7: { class_type: 'VAEDecode', inputs: { samples: ['6', 0], vae: ['1', 2] } },
    // Only the seam cross is repainted, so the borders (the original centre) still wrap.
    14: { class_type: 'ImageCompositeMasked', inputs: { destination: ['10', 0], source: ['7', 0], x: 0, y: 0, resize_source: false, mask: ['11', 0] } },
    15: { class_type: 'ImageScale', _meta: { title: 'Tile 128 (nearest, /8)' }, inputs: { image: ['14', 0], upscale_method: 'nearest-exact', width: 128, height: 128, crop: 'disabled' } },
    16: { class_type: 'SaveImage', inputs: { images: ['15', 0], filename_prefix: `umbral-ground/${g.id}_tile` } },
  };
}

mkdirSync(outDir, { recursive: true });
for (const g of GROUNDS) {
  const wf = phase === 2 ? phase2(g) : phase1(g);
  writeFileSync(path.join(outDir, `ground-${g.id}-phase${phase}.api.json`), JSON.stringify(wf, null, 2) + '\n');
  if (args.includes('--queue')) {
    const res = await fetch('http://127.0.0.1:8188/prompt', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: wf }) });
    console.log(g.id, `phase ${phase}`, (await res.json()).prompt_id ?? 'error');
  }
}
