// Generates Umbral Capital buildings and props in local ComfyUI (SDXL + Pixel Art XL).
// Usage: node tools/comfyui/build-map-asset-workflows.mjs [--queue] [--only id,id] [--seed N]
// Writes docs/design/comfyui/map-assets/<id>.api.json; outputs land in ComfyUI output/umbral/<id>_*.
// Each image: txt2img on white -> nearest /8 to the Pixel Art XL grid -> background key -> RGBA.
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const outDir = path.join(root, 'docs/design/comfyui/map-assets');
const args = process.argv.slice(2);
const only = args.includes('--only') ? args[args.indexOf('--only') + 1].split(',') : null;
const seed = args.includes('--seed') ? Number(args[args.indexOf('--seed') + 1]) : 1001;

const THEME = 'dark shamanic black magic capital city, basalt and obsidian stone, weathered dark wood, bone white details, '
  + 'tarnished gold trim, crimson prayer banners, violet and green spirit fire glow';
const VIEW = 'classic 2000s MMORPG town asset, elevated three-quarter overhead view looking down at about 45 degrees, '
  + 'upright front facing the viewer, top visible from above';
const POSITIVE_TAIL = '(one single isolated game asset sprite:1.3), whole object visible, (small in frame with wide empty white margin on all sides:1.3), crisp pixel art, detailed shading, plain white background, '
  + 'no ground, no characters, no text';
const NEGATIVE = '(multiple objects:1.4), (sprite sheet, collection, set of items:1.3), (cropped, touching the edges, filling the frame:1.3), isometric diamond, top-down floor plan, side view, flat front elevation, cinematic, perspective scenery, landscape, '
  + 'horizon, sky, multiple buildings, city, street, ground tiles, grass field, people, characters, text, watermark, logo, '
  + 'blurry, painterly, 3d render, photo, cropped, cut off, cast shadow, drop shadow, frame, border';

// size = generation canvas; /8 gives the sprite size in asset pixels (drawn at 2x in game).
export const ASSETS = [
  { id: 'temple', size: [1536, 1152], desc: 'grand temple of the black spirit, tiered dark pagoda roofs with curved gold-trimmed eaves, wide stone stairs at the front, skull ornaments, two violet spirit-fire braziers by the doors' },
  { id: 'academy', size: [1344, 1024], desc: 'academy of curses, long two-storey dark timber and basalt hall, curved tiled roof, rows of paper talisman windows, crimson banners' },
  { id: 'curse-shop', size: [1024, 1024], desc: 'small curse talisman shop, dark wooden house with curved roof, hanging paper talismans and bone charms over the open front counter' },
  { id: 'apothecary', size: [1024, 1024], desc: 'witch apothecary shop, crooked dark wooden house, shelves of glowing green potion jars at the front window, hanging herbs' },
  { id: 'house-a', size: [1024, 1024], desc: 'small dark timber house with steep curved tiled roof, red paper lantern by the door' },
  { id: 'house-b', size: [1024, 1024], desc: 'narrow two-storey basalt and wood house with balcony, violet glowing window' },
  { id: 'city-gate', size: [1344, 1024], desc: 'monumental spirit gate of the city, two thick black stone pillars with a curved gold-trimmed roof beam, hanging crimson banners and bone wind chimes, open passage in the middle' },
  { id: 'brazier', size: [1024, 1024], desc: 'stone brazier on a short pedestal burning with violet spirit fire' },
  { id: 'bone-totem', size: [1024, 1024], desc: 'tall carved wooden totem pole decorated with animal skulls, bones and red cloth' },
  { id: 'skull-lantern', size: [1024, 1024], desc: 'iron street lantern post with a skull-shaped lamp glowing green' },
  { id: 'cauldron', size: [1024, 1024], desc: 'large black iron cauldron on legs bubbling with glowing green brew' },
  { id: 'market-stall', size: [1024, 1024], desc: 'small market stall with crimson cloth awning, table of bottles, skulls and charms' },
  { id: 'dead-tree', size: [1024, 1024], desc: 'twisted leafless dead tree with hanging paper charms and red ribbons' },
  { id: 'stele', size: [1024, 1024], desc: 'carved black stone stele engraved with glowing violet runes' },
  { id: 'banner-pole', size: [1024, 1024], desc: 'tall wooden pole with long hanging crimson banner painted with a black spirit sigil' },
  { id: 'crates', size: [1024, 1024], desc: 'stack of three old dark wooden crates tied with rope, one with a red talisman seal' },
  { id: 'barrels', size: [1024, 1024], desc: 'two dark wooden barrels with iron bands, one with glowing green liquid at the top' },
  { id: 'fence', size: [1344, 1024], desc: 'short straight section of dark wooden fence with bone ornaments on the posts, seen from the front' },
  { id: 'rocks', size: [1024, 1024], desc: 'cluster of dark basalt rocks with moss and a few small mushrooms' },
  { id: 'gravestone', size: [1024, 1024], desc: 'old cracked gravestone with a carved spirit sigil and melted candles at its base' },
  { id: 'shrub', size: [1024, 1024], desc: 'dark green and purple thorny bush with small glowing violet berries' },
  { id: 'candles', size: [1024, 1024], desc: 'cluster of tall and short ritual candles burning with violet flames on a small stone slab' },
  { id: 'bone-pile', size: [1024, 1024], desc: 'small pile of bleached bones and an animal skull with red cloth strips' },
  { id: 'charm-pot', size: [1024, 1024], desc: 'large clay pot wrapped with rope and paper talismans, smoke of green incense rising' },
  { id: 'well', size: [1024, 1024], desc: 'round basalt stone well with wooden roof frame and hanging bucket' },
];

function build(asset) {
  const [w, h] = asset.size;
  const prefix = `umbral/${asset.id}`;
  return {
    1: { class_type: 'CheckpointLoaderSimple', _meta: { title: 'SDXL base' }, inputs: { ckpt_name: 'sd_xl_base_1.0.safetensors' } },
    2: { class_type: 'LoraLoader', _meta: { title: 'Pixel Art XL' }, inputs: { model: ['1', 0], clip: ['1', 1], lora_name: 'pixel-art-xl.safetensors', strength_model: 1.0, strength_clip: 1.0 } },
    3: { class_type: 'CLIPTextEncode', _meta: { title: `Positive ${asset.id}` }, inputs: { clip: ['2', 1], text: `pixel art, ${asset.desc}, ${THEME}, ${VIEW}, ${POSITIVE_TAIL}` } },
    4: { class_type: 'CLIPTextEncode', _meta: { title: 'Negative' }, inputs: { clip: ['2', 1], text: NEGATIVE } },
    5: { class_type: 'EmptyLatentImage', _meta: { title: `Canvas ${w}x${h}` }, inputs: { width: w, height: h, batch_size: 4 } },
    6: { class_type: 'KSampler', inputs: { model: ['2', 0], positive: ['3', 0], negative: ['4', 0], latent_image: ['5', 0], seed, steps: 28, cfg: 6.5, sampler_name: 'dpmpp_2m', scheduler: 'karras', denoise: 1.0 } },
    7: { class_type: 'VAEDecode', inputs: { samples: ['6', 0], vae: ['1', 2] } },
    8: { class_type: 'ImageScale', _meta: { title: `Pixel grid ${w / 8}x${h / 8} (nearest, /8)` }, inputs: { image: ['7', 0], upscale_method: 'nearest-exact', width: w / 8, height: h / 8, crop: 'disabled' } },
    9: { class_type: 'ShamanPixelBackgroundKey', _meta: { title: 'Remove background + ground shadow' }, inputs: { image: ['8', 0], tolerance: 0.1, remove_ground_shadow: true, shadow_rows: 0.25 } },
    10: { class_type: 'SaveImage', _meta: { title: `Save ${asset.id} RGBA` }, inputs: { images: ['9', 0], filename_prefix: prefix } },
  };
}

mkdirSync(outDir, { recursive: true });
for (const asset of ASSETS) {
  if (only && !only.includes(asset.id)) continue;
  const wf = build(asset);
  writeFileSync(path.join(outDir, `${asset.id}.api.json`), JSON.stringify(wf, null, 2) + '\n');
  if (args.includes('--queue')) {
    const res = await fetch('http://127.0.0.1:8188/prompt', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: wf }) });
    console.log(asset.id, (await res.json()).prompt_id ?? 'error');
  }
}
