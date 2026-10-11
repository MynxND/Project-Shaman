"""Render a whole-map preview PNG from the shared map definition and the client map assets.

Usage:
    node -e "import('./packages/shared/dist/index.js').then(m => process.stdout.write(JSON.stringify(m.UMBRAL_CAPITAL)))" > map.json
    python tools/sprites/render_map_preview.py map.json docs/design/umbral-capital-preview.png [--footprints]

Mirrors MapRenderer.ts: ground tiles at 1x, objects at 2x anchored at their base and drawn in base-y order.
--footprints outlines blocking rectangles (red) and the spawn (cyan). Output is downscaled 2x.
"""
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
ASSETS = ROOT / "apps/client/public/assets/umbral"
UNIT = 32
SCALE = 2


def main():
    map_def = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    out = Path(sys.argv[2])
    show_footprints = "--footprints" in sys.argv
    manifest = json.loads((ASSETS / "manifest.json").read_text(encoding="utf-8"))
    W, H = int(map_def["width"] * UNIT), int(map_def["height"] * UNIT)
    canvas = Image.new("RGBA", (W, H), (0, 0, 0, 255))

    def ground(material, x, y, w, h):
        tile = Image.open(ASSETS / manifest["ground"][material]["image"]).convert("RGBA")
        x0, y0, x1, y1 = int(x * UNIT), int(y * UNIT), int((x + w) * UNIT), int((y + h) * UNIT)
        region = Image.new("RGBA", (x1 - x0, y1 - y0))
        # Phaser TileSprite tiles from the region's own origin.
        for ty in range(0, region.height, tile.height):
            for tx in range(0, region.width, tile.width):
                region.paste(tile, (tx, ty))
        canvas.alpha_composite(region, (x0, y0))

    ground(map_def["ground"]["base"], 0, 0, map_def["width"], map_def["height"])
    for r in map_def["ground"]["regions"]:
        ground(r["material"], r["x"], r["y"], r["w"], r["h"])

    for obj in sorted(map_def["objects"], key=lambda o: o["y"]):
        meta = manifest["objects"][obj["asset"]]
        sprite = Image.open(ASSETS / meta["image"]).convert("RGBA")
        sprite = sprite.resize((sprite.width * SCALE, sprite.height * SCALE), Image.NEAREST)
        x = int(obj["x"] * UNIT - (meta["anchor"]["x"] + 0.5) * SCALE)
        y = int(obj["y"] * UNIT - (meta["anchor"]["y"] + 1) * SCALE)
        canvas.alpha_composite(sprite, (max(0, x), max(0, y)), (max(0, -x), max(0, -y)))

    if show_footprints:
        draw = ImageDraw.Draw(canvas)
        rects = [{"x": o["x"] - o["footprint"]["w"] / 2, "y": o["y"] - o["footprint"]["h"], **o["footprint"]}
                 for o in map_def["objects"] if o["footprint"]] + map_def["blockers"]
        for r in rects:
            draw.rectangle([r["x"] * UNIT, r["y"] * UNIT, (r["x"] + r["w"]) * UNIT, (r["y"] + r["h"]) * UNIT], outline=(255, 60, 60, 255), width=3)
        sx, sy = map_def["spawn"]["x"] * UNIT, map_def["spawn"]["y"] * UNIT
        draw.ellipse([sx - 8, sy - 8, sx + 8, sy + 8], outline=(80, 240, 255, 255), width=3)

    canvas.resize((W // 2, H // 2), Image.NEAREST).save(out)
    print("wrote", out)


if __name__ == "__main__":
    main()
