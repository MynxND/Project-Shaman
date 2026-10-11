"""Animated preview of every walk direction at in-game timing (from main-v1-manifest.json).

Usage: python tools/sprites/walk_preview_gif.py <out.gif> [scale]
Each cell plays its direction at frames * WALK_SPEED / WALK_CYCLE_UNITS fps, anchored at the manifest feet
anchor so alignment issues show up as visible jitter. Rows: male, female; columns: S, SE, E, NE, N, NW, W, SW.
"""
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
ASSETS = ROOT / "apps/client/public/assets/pixellab"
WALK_SPEED, WALK_CYCLE_UNITS = 4, 8 / 3  # keep in sync with packages/shared
DIRS = ["south", "south-east", "east", "north-east", "north", "north-west", "west", "south-west"]
CELL_W, CELL_H, GROUND = 110, 150, 135


def main():
    out, scale = sys.argv[1], int(sys.argv[2]) if len(sys.argv) > 2 else 2
    manifest = json.loads((ASSETS / "main-v1-manifest.json").read_text(encoding="utf-8"))
    cycle = WALK_CYCLE_UNITS / WALK_SPEED
    step = 1 / 30
    frames = []
    for k in range(round(cycle * 2 / step)):
        t = k * step
        sheet = Image.new("RGBA", (CELL_W * 8, CELL_H * 2), (52, 62, 60, 255))
        draw = ImageDraw.Draw(sheet)
        for r, body in enumerate(("male", "female")):
            walk = manifest["bodies"][body]["animations"]["walk"]
            for c, d in enumerate(DIRS):
                paths = walk["frames"][d]
                fps = len(paths) * WALK_SPEED / WALK_CYCLE_UNITS
                img = Image.open(ASSETS / paths[int(t * fps) % len(paths)]).convert("RGBA")
                a = walk["layouts"][d]["anchor"]
                x0, y0 = c * CELL_W + CELL_W // 2, r * CELL_H + GROUND
                draw.line([(c * CELL_W + 10, y0 + 1), (c * CELL_W + CELL_W - 10, y0 + 1)], fill=(90, 110, 104, 255))
                sheet.alpha_composite(img, (x0 - a["x"], y0 - a["y"]))
        frames.append(sheet.resize((sheet.width * scale // 2, sheet.height * scale // 2), Image.NEAREST).convert("P", palette=Image.ADAPTIVE))
    frames[0].save(out, save_all=True, append_images=frames[1:], duration=round(step * 1000), loop=0, disposal=2)
    print("wrote", out, len(frames), "frames")


if __name__ == "__main__":
    main()
