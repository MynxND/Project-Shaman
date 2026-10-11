"""Copy the chosen Umbral Capital ComfyUI outputs into the client and write the map asset manifest.

Usage: python tools/sprites/build_umbral_assets.py [ComfyUI root]
Default ComfyUI root: C:/ComfyUI/ComfyUI_windows_portable/ComfyUI

Objects: CHOICES picks one image (by output filename) per asset from output/umbral/. Each is cropped to
its opaque bounds plus 1px, resampled to HEIGHT_UNITS, and its anchor is the bottom-centre of the opaque pixels (where it meets the ground).
Ground: the latest output/umbral-ground/<id>_tile_*.png (128x128, seamless).
Writes apps/client/public/assets/umbral/{objects,ground}/*.png and manifest.json, and prints each object's
size in world units (16 asset px per unit) to help author footprints in packages/shared/src/maps/.
"""
import glob
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "apps/client/public/assets/umbral"
ASSET_PX_PER_UNIT = 16

# Asset id -> chosen ComfyUI output file (output/umbral/). Reviewed by eye from 4-image batches.
CHOICES: dict[str, str] = {
    "temple": "temple_00006_.png",
    "academy": "academy_00004_.png",
    "city-gate": "city-gate_00001_.png",
    "curse-shop": "curse-shop_00003_.png",
    "apothecary": "apothecary_00003_.png",
    "house-a": "house-a_00003_.png",
    "house-b": "house-b_00003_.png",
    "well": "well_00003_.png",
    "brazier": "brazier_00007_.png",
    "bone-totem": "bone-totem_00003_.png",
    "skull-lantern": "skull-lantern_00003_.png",
    "cauldron": "cauldron_00003_.png",
    "market-stall": "market-stall_00003_.png",
    "dead-tree": "dead-tree_00003_.png",
    "stele": "stele_00003_.png",
    "banner-pole": "banner-pole_00003_.png",
    "crates": "crates_00003_.png",
    "barrels": "barrels_00003_.png",
}
# Height in world units each object should stand in game. SDXL fills the frame regardless of object size,
# so sprites are resampled to HEIGHT_UNITS * ASSET_PX_PER_UNIT px to keep one pixel density across the map.
HEIGHT_UNITS = {
    "temple": 10, "academy": 7, "city-gate": 7, "curse-shop": 6, "apothecary": 6, "house-a": 5.5, "house-b": 6.5,
    "well": 2.4, "brazier": 2.2, "bone-totem": 3.2, "skull-lantern": 2.8, "cauldron": 1.4, "market-stall": 3,
    "dead-tree": 4.5, "stele": 2.4, "banner-pole": 3.6,
    "crates": 2.2, "barrels": 2.0,
}
# Enclosed white areas (e.g. inside an archway) survive the border-connected background key.
ENCLOSED_WHITE_MIN_AREA = 30
GROUNDS = ("basalt-cobble", "dark-earth", "ritual-paving", "dark-grass")


def clear_enclosed_white(img: Image.Image) -> Image.Image:
    """Make large near-white regions transparent even when the background key could not reach them."""
    a = np.asarray(img).copy()
    white = (a[..., 3] > 0) & (a[..., :3].min(axis=2) >= 232)
    seen = np.zeros_like(white)
    h, w = white.shape
    for y, x in zip(*np.where(white)):
        if seen[y, x]:
            continue
        stack, comp = [(y, x)], []
        seen[y, x] = True
        while stack:
            cy, cx = stack.pop()
            comp.append((cy, cx))
            for ny, nx in ((cy + 1, cx), (cy - 1, cx), (cy, cx + 1), (cy, cx - 1)):
                if 0 <= ny < h and 0 <= nx < w and white[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True
                    stack.append((ny, nx))
        if len(comp) >= ENCLOSED_WHITE_MIN_AREA:
            for cy, cx in comp:
                a[cy, cx, 3] = 0
    return Image.fromarray(a, "RGBA")


def main():
    comfy = Path(sys.argv[1] if len(sys.argv) > 1 else "C:/ComfyUI/ComfyUI_windows_portable/ComfyUI")
    (OUT / "objects").mkdir(parents=True, exist_ok=True)
    (OUT / "ground").mkdir(parents=True, exist_ok=True)
    manifest = {"objects": {}, "ground": {}}
    for asset_id, filename in CHOICES.items():
        img = clear_enclosed_white(Image.open(comfy / "output/umbral" / filename).convert("RGBA"))
        alpha = np.asarray(img)[..., 3] > 0
        ys, xs = np.where(alpha)
        box = (max(0, xs.min() - 1), max(0, ys.min() - 1), min(img.width, xs.max() + 2), min(img.height, ys.max() + 2))
        sprite = img.crop(box)
        target_h = round(HEIGHT_UNITS[asset_id] * ASSET_PX_PER_UNIT)
        if target_h < sprite.height:
            target_w = max(1, round(sprite.width * target_h / sprite.height))
            sprite = sprite.resize((target_w, target_h), Image.LANCZOS)
            px = np.asarray(sprite).copy()
            px[..., 3] = np.where(px[..., 3] >= 128, 255, 0)  # keep hard pixel-art edges
            sprite = Image.fromarray(px, "RGBA")
        a = np.asarray(sprite)[..., 3] > 0
        ys, xs = np.where(a)
        bottom = int(ys.max())
        base_cols = xs[ys >= bottom - 2]
        anchor = {"x": int(round((base_cols.min() + base_cols.max()) / 2)), "y": bottom}
        sprite.save(OUT / f"objects/{asset_id}.png")
        manifest["objects"][asset_id] = {"image": f"objects/{asset_id}.png", "width": sprite.width, "height": sprite.height, "anchor": anchor, "source": filename}
        print(f"{asset_id:14s} {sprite.width:4d}x{sprite.height:<4d} px = {sprite.width / ASSET_PX_PER_UNIT:5.1f} x {sprite.height / ASSET_PX_PER_UNIT:5.1f} units")
    for gid in GROUNDS:
        tiles = sorted(glob.glob(str(comfy / f"output/umbral-ground/{gid}_tile_*.png")))
        if not tiles:
            print("missing ground tile", gid)
            continue
        Image.open(tiles[-1]).convert("RGB").save(OUT / f"ground/{gid}.png")
        manifest["ground"][gid] = {"image": f"ground/{gid}.png", "source": Path(tiles[-1]).name}
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print("wrote", (OUT / "manifest.json").relative_to(ROOT))


if __name__ == "__main__":
    main()
