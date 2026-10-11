# ComfyUI character workflow

**Concept exploration only.** Character generation moved here and back to PixelLab on 2026-10-08 after the user rejected the ComfyUI base-v1 as off theme; see docs/design/character-rig.md. PixelLab is the tool for game characters, map concepts and tiles. Output is approved concept/sprite material only after review; it is not runtime-connected gameplay art until placed with anchors and metadata.

## Install (user machine, not part of the repo)

Root: `C:\ComfyUI\ComfyUI_windows_portable` (ComfyUI v0.39.0, NVIDIA, PyTorch 2.14 + CUDA 13.0, RTX 5070 12GB). The earlier D: install was abandoned after SSD write failures (NTFS Event 50); leftovers are in `D:\ComfyUI\*_old_crash`.

| File | Folder | Source | License |
|---|---|---|---|
| sd_xl_base_1.0.safetensors | models/checkpoints | huggingface.co/stabilityai/stable-diffusion-xl-base-1.0 | CreativeML OpenRAIL++-M |
| pixel-art-xl.safetensors | models/loras | huggingface.co/nerijs/pixel-art-xl | CreativeML OpenRAIL-M |
| CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors | models/clip_vision | huggingface.co/h94/IP-Adapter (models/image_encoder/model.safetensors) | Apache-2.0 |
| ip-adapter-plus_sdxl_vit-h.safetensors | models/ipadapter | huggingface.co/h94/IP-Adapter (sdxl_models) | Apache-2.0 |
| ComfyUI_IPAdapter_plus | custom_nodes | github.com/cubiq/ComfyUI_IPAdapter_plus @ a0f451a (maintenance-only since 2025-04) | GPL-3.0 |
| shaman_pixel_tools | custom_nodes | this repo: tools/comfyui/shaman_pixel_tools | project |

All downloads were SHA256-verified against GitHub release digests and Hugging Face LFS hashes. After editing `tools/comfyui/shaman_pixel_tools`, copy the folder into `custom_nodes` again and restart ComfyUI.

Start: `C:\ComfyUI\ComfyUI_windows_portable\run_nvidia_gpu.bat`, open http://127.0.0.1:8188, drag a workflow JSON onto the page.

## Workflows

### 4-direction workflows (tools/comfyui/build-direction-workflows.mjs)

`node tools/comfyui/build-direction-workflows.mjs --outfit base|apprentice [--queue]` writes `shamen-<outfit>-<gender>-4dir-sdxl.api.json`. Down/left/up are separate samplers sharing one seed and latent, each with its own IP-Adapter reference crop (`reference/shamen-base-<gender>-{front,side,back}.png`); right is the mirrored left. Every direction runs Color Boost (sat 1.15, contrast 1.1) and Background Key with ground-shadow removal.

- `apprentice`: works for male. Female side reference is three-quarter and the sheet's female back view has short hair, so female left/up use IP-Adapter 0.5 with stronger prompt terms.
- `base` (paper-doll body for class outfits, plain grey bodysuit, barefoot; never nude): **not solved yet.** IP-Adapter 0.35 style transfer lost chibi proportions and SDXL still added boots, belts and vests; IP-Adapter 0.5 linear brought back the whole apprentice outfit because every reference crop is clothed. Inpaint approach below.

### shamen-base-inpaint-sdxl.api.json (tools/comfyui/build-base-inpaint-workflows.mjs)

Repaints everything below the neck on the six reference crops (`reference/inpaint/<gender>-<view>-1024.png`, masks = character silhouette below 30% of figure height, dilated 12px) into a plain grey bodysuit, barefoot. SetLatentNoiseMask, denoise 0.88, then ImageCompositeMasked so pixels outside the mask stay original. Outputs `base_ref_<gender>_<view>` (1024, candidate IP-Adapter reference) and `base_sprite_<gender>_<view>` (128 RGBA).

Seed 512 was briefly the in-game base-v1 (sources in `base-v1/`), then rejected by the user as off theme; runtime assets and builder removed. Seed 512 result: all six views became a plain grey bodysuit with bare feet, and the original head, pose and proportions were kept. Not yet approved. Issues: body rendering is blockier and less detailed than the head, body shape varies between views, the female side view keeps a faint robe-outline fringe at the mask edge, hair ornaments (feathers, ribbons) remain because the head is not repainted, and the female back keeps the sheet's short hair.

### shamen-apprentice-{male,female}-sdxl.api.json (single front view)

Base character direction supplied by the user on 2026-10-08 as a concept sheet (`reference/shamen-base-sheet.webp`; provenance: user-provided, origin not recorded). Front views cropped to `reference/shamen-base-{male,female}-front.png` and copied into ComfyUI `input/`. Outfit: ชุดหมอผีฝึกหัด (apprentice shaman): cream embroidered tunic, fur-trimmed mantle, red sash with bronze amulet buckle, woven green/gold apron panel, red prayer ribbons and feather charm, sandals.

Same pipeline as below with IP-Adapter 0.7 `linear`, end_at 0.85 (reference sets identity and proportions). Seeds 308 (male) and 408 (female): all 8 results single characters matching the sheet's hair, outfit and ~3-3.5 head proportions. Known issues: palette comes out paler and pinker than the sheet, and the grey ground-shadow ellipse survives background keying because it differs from the white backdrop.

The sheet's walk/run/attack frames, equipment layers and emotions are direction only; per-direction and animation sprites still need a consistent generation method (not solved by single-image IP-Adapter).

### ro-chibi-ipadapter-sdxl.api.json (3-head experiment)

1. SDXL base + Pixel Art XL LoRA (1.0, no trigger word)
2. IP-Adapter PLUS, weight 0.6, linear, end_at 0.8. Reference image `input/shaman_medium_ref.png` = `reference/medium-south-ref.png` (PixelLab Medium south rotation on white, x4 nearest)
3. Portrait canvas 832x1216, batch 4, dpmpp_2m karras, 28 steps, CFG 6
4. Nearest-neighbor /8 to a 104x152 grid
5. Pixel Background Key (Shaman): flood-fills the flat background from the border, tolerance 0.12, hard 0/1 alpha
6. Saves `output/shaman/base_sprite_*` (104x152 RGBA) and `base_preview_*` (x4 nearest RGBA)

First run (seed 208, 832x1216, IP-Adapter 0.6 linear): four single, consistent characters with transparent backgrounds in 59 s, but 3.5-4 heads tall.

Current settings (3-head pass): canvas 896x1152 -> 112x144 grid; prompt weights `(super deformed chibi:1.4)`, `(huge round head:1.3)`, `(head is one third of total height:1.3)`, `(short stubby body and legs:1.3)`; negative weights on tall/long legs/character sheet; IP-Adapter 0.45 `style transfer` so the taller PixelLab reference carries palette and rendering, not body shape. Seed 208 result: 2 of 4 near 3 heads, 1 multi-view sheet, 1 still ~3.8 heads. A square 1024 canvas produced more sheets. Once a 3-head base is approved, use it as the reference with `linear` weight to lock proportions.

### ro-chibi-sprite-sdxl.api.json (earlier)

Same pipeline without IP-Adapter or background removal. Often returns multi-view sheets or scenery.

## Style and reference rules

- Target: original base character, chibi classic-MMORPG proportions, soft cel shading, thin soft outlines, warm muted palette, three-quarter front view.
- Ragnarok Online is a direction reference only. Never load its sprites (or other third-party game art) as an IP-Adapter reference or LoRA training data.
- IP-Adapter references must be project-owned art: PixelLab/ComfyUI characters the user has approved.
- Background key needs a flat backdrop; keep "plain white background" in the prompt. Characters wearing near-white edges touching the border may lose those pixels; lower tolerance if that happens.
- Rotations from different seeds are not a consistent 8-direction set or a walk animation.
