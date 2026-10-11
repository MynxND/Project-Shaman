"""Remove whole-body side-to-side sway from generated walk and idle cycles.

Usage: python tools/sprites/stabilize_walk.py
Reads raw PixelLab frames from docs/design/pixellab-main/raw/<body>/<animation>/<direction>/<n>.png (walk, idle)
and writes stabilised frames to apps/client/public/assets/pixellab/main-<body>-v1/<animation>/<direction>/<n>.png.

A classic sprite walk keeps the head and torso horizontally still; only arms and legs move and the body bobs
slightly. Generated cycles drift the whole figure a few pixels left and right inside the canvas, which reads
as swaying. Each frame is shifted by whole pixels so the centroid of the upper body (top of head to waist)
sits at the cycle's median. Vertical position is untouched, so the natural bob and foot contact stay.
Prints before/after sway as a percentage of figure height.
"""
from pathlib import Path

import numpy as np
from PIL import Image

import sys
sys.path.insert(0, str(Path(__file__).resolve().parent))
from rig_cleanup import drop_specks

ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / "docs/design/pixellab-main/raw"
OUT = ROOT / "apps/client/public/assets/pixellab"
UPPER_BODY = (0.0, 0.6)  # fraction of figure height measured from the top of the head


def upper_body_x(img: Image.Image) -> float:
    alpha = np.asarray(img)[..., 3] > 0
    ys, xs = np.where(alpha)
    top, bottom = ys.min(), ys.max()
    lo, hi = top + UPPER_BODY[0] * (bottom - top), top + UPPER_BODY[1] * (bottom - top)
    keep = (ys >= lo) & (ys <= hi)
    return float(xs[keep].mean())


def shift_x(img: Image.Image, dx: int) -> Image.Image:
    out = Image.new("RGBA", img.size, (0, 0, 0, 0))
    out.paste(img, (dx, 0))
    return out


def stabilise(body: str, animation: str, direction_dir: Path):
    paths = sorted(direction_dir.glob("*.png"), key=lambda p: int(p.stem))
    frames = [Image.open(p).convert("RGBA") for p in paths]
    xs = [upper_body_x(f) for f in frames]
    target = float(np.median(xs))
    shifts = [int(round(target - x)) for x in xs]
    out_dir = OUT / f"main-{body}-v1/{animation}/{direction_dir.name}"
    out_dir.mkdir(parents=True, exist_ok=True)
    for p in out_dir.glob("*.png"):
        p.unlink()
    fixed = []
    for path, frame, dx in zip(paths, frames, shifts):
        f = shift_x(frame, dx)
        f.save(out_dir / path.name)
        fixed.append(f)
    height = np.median([np.ptp(np.where(np.asarray(f)[..., 3] > 0)[0]) for f in frames])
    before = np.ptp(xs) / height * 100
    after = np.ptp([upper_body_x(f) for f in fixed]) / height * 100
    print(f"{body:6s} {animation:5s} {direction_dir.name:10s} sway {before:4.1f}% -> {after:4.1f}% of height, shifts {shifts}")


# Loops are stabilised. The basic attack keeps its intentional lean, so it is copied unchanged. Cast frames are
# packaged by tools/sprites/build_medium_vfx.py; archive folders are ignored.
STABILISED = ("walk", "idle")
COPIED = ("attack",)


def copy_frames(body: str, animation: str, direction_dir: Path):
    out_dir = OUT / f"main-{body}-v1/{animation}/{direction_dir.name}"
    out_dir.mkdir(parents=True, exist_ok=True)
    for p in out_dir.glob("*.png"):
        p.unlink()
    for path in sorted(direction_dir.glob("*.png"), key=lambda p: int(p.stem)):
        drop_specks(Image.open(path))[0].save(out_dir / path.name)
    print(f"{body:6s} {animation:6s} {direction_dir.name:10s} copied")


def main():
    for body_dir in sorted(RAW.iterdir()):
        for anim_dir in sorted(d for d in body_dir.iterdir() if d.is_dir() and d.name in STABILISED + COPIED):
            for direction_dir in sorted(anim_dir.iterdir()):
                (stabilise if anim_dir.name in STABILISED else copy_frames)(body_dir.name, anim_dir.name, direction_dir)


if __name__ == "__main__":
    main()
