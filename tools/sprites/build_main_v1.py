"""Build the manifest for the PixelLab main characters (main-v1).

Usage (Python 3 with Pillow and numpy): python tools/sprites/build_main_v1.py
Reads apps/client/public/assets/pixellab/main-<body>-v1/<direction>.png (128x128 RGBA)
and walk frames from main-<body>-v1/walk/<direction>/<n>.png, and writes
apps/client/public/assets/pixellab/main-v1-manifest.json with feet anchors and animations.
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
ASSETS = ROOT / "apps/client/public/assets/pixellab"
FRAME = 128
DIRECTIONS = ("south", "south-east", "east", "north-east", "north", "north-west", "west", "south-west")
CHARACTERS = {
    "male": "336280fc-8cfd-4a7f-98a3-056f78476544",
    "female": "5faf034e-7b29-46ce-9671-0fb4e945049e",
}
WALK_FRAME_RATE = 12  # informational; the client derives walk fps from WALK_SPEED / WALK_CYCLE_UNITS
IDLE_FRAME_RATE = 5
# Basic attack (spirit palm strike, 2026-10-09): 8 frames played once at 16 fps = 0.5 s, inside the 0.9 s attack delay.
ATTACK_FRAME_RATE = 16
# Idle directions left out because the generated breathing loop turned the body away from the static rotation
# (male north scored 0.104 vs 0.064 on tools/sprites/frontal_score.py); the client shows the static frame there.
IDLE_EXCLUDE = {"male": {"north"}, "female": set()}
# Walk directions drawn by mirroring another direction. Empty since 2026-10-08: every direction is
# generated (skeleton-v3), because mirroring flipped one-sided details (feathers, ribbons) when turning.
WALK_MIRROR = {"male": {}, "female": {}}


def centroid(img):
    alpha = np.asarray(img)[..., 3] > 0
    ys, xs = np.where(alpha)
    return float(xs.mean()), float(ys.mean())


def bottom_row(img):
    return int(np.where(np.asarray(img)[..., 3] > 0)[0].max())


def animation(body, anchor, name, frame_rate, skip):
    frames = {}
    for direction in DIRECTIONS:
        folder = ASSETS / f"main-{body}-v1/{name}/{direction}"
        if direction in skip or not folder.is_dir():
            continue
        count = len(list(folder.glob("*.png")))
        frames[direction] = [f"main-{body}-v1/{name}/{direction}/{i}.png" for i in range(count)]
    mirror = {d: src for d, src in WALK_MIRROR[body].items() if src in frames}
    if not frames:
        return None
    # Walk frames come back on varied canvases (176x176, 128x176, 132x172, ...) without consistent padding.
    # x: frame 0 starts from the idle rotation's pose, so align its opaque-pixel centroid with the idle one.
    # y: the lowest foot touches the ground every frame, so use the median bottom row across the cycle,
    # keeping the idle frame's gap between its bottom row and the body anchor.
    layouts = {}
    for direction, paths in frames.items():
        imgs = [Image.open(ASSETS / path).convert("RGBA") for path in paths]
        idle = Image.open(ASSETS / f"main-{body}-v1/{direction}.png").convert("RGBA")
        fx, _ = centroid(imgs[0])
        ix, _ = centroid(idle)
        ground = float(np.median([bottom_row(img) for img in imgs]))
        layouts[direction] = {"frameWidth": imgs[0].width, "frameHeight": imgs[0].height,
                              "anchor": {"x": int(round(anchor["x"] + fx - ix)),
                                         "y": int(round(ground + anchor["y"] - bottom_row(idle)))}}
    return {"frameRate": frame_rate, "frames": frames, "layouts": layouts, "mirror": mirror}


def main():
    manifest = {"version": "main-v1", "source": "PixelLab create_character v3", "frameSize": FRAME, "bodies": {}}
    for body, character_id in CHARACTERS.items():
        frames = {}
        for direction in DIRECTIONS:
            alpha = np.asarray(Image.open(ASSETS / f"main-{body}-v1/{direction}.png").convert("RGBA"))[..., 3] > 0
            ys, xs = np.where(alpha)
            bottom = ys.max()
            # Feet centre (opaque pixels in the lowest 6 rows), recorded for reference.
            feet_cols = xs[ys >= bottom - 5]
            frames[direction] = {
                "image": f"main-{body}-v1/{direction}.png",
                "feetCentre": {"x": int(round(float(feet_cols.mean()))), "y": int(bottom)},
                "height": int(bottom - ys.min() + 1),
            }
        # PixelLab frames are pivot-centred, so one anchor per body keeps turning in place.
        anchor = {"x": FRAME // 2, "y": max(f["feetCentre"]["y"] for f in frames.values())}
        entry = {"pixellabCharacterId": character_id, "anchor": anchor, "frames": frames}
        animations = {}
        walk = animation(body, anchor, "walk", WALK_FRAME_RATE, set(WALK_MIRROR[body]))
        idle = animation(body, anchor, "idle", IDLE_FRAME_RATE, IDLE_EXCLUDE[body])
        if walk:
            animations["walk"] = walk
        if idle:
            animations["idle"] = idle
        attack = animation(body, anchor, "attack", ATTACK_FRAME_RATE, set())
        if attack:
            animations["attack"] = attack
        if animations:
            entry["animations"] = animations
        manifest["bodies"][body] = entry
    out = ASSETS / "main-v1-manifest.json"
    out.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print("wrote", out.relative_to(ROOT))


if __name__ == "__main__":
    main()
