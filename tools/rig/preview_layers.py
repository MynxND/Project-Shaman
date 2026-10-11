"""Compose rig v2 layers offline with the same maths as the client (EquipmentLayers.ts), for review.

Body/outfit frames: docs/design/rig/raw/<body>/<outfit>/<anim>/<facing>/<n>.png (all on the shared skeletons).
Weapon: apps/client/public/assets/equipment/<weapon>/south.png drawn upright, its grip (WEAPON_GRIP of its height
from the top) pinned to the skeleton's right hand and rotated along grip -> tip; in front of or behind the body per
the skeleton's depth flag.
Run: python -I tools/rig/preview_layers.py <out.png> <body> <outfit> <anim> <weapon|none> [facing ...]
"""
import json
import math
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
WEAPON_GRIP = 0.62  # fraction of the weapon image height from its top where the hand holds it
FACINGS = ['south', 'south-east', 'east', 'north-east', 'north', 'north-west', 'west', 'south-west']


def weapon_layer(weapon: str, grip, tip):
    img = Image.open(ROOT / f'apps/client/public/assets/equipment/{weapon}/south.png').convert('RGBA')
    # Pad so the grip sits at the image centre, then rotate about the centre.
    gx, gy = img.width / 2, img.height * WEAPON_GRIP
    side = int(2 * max(gy, img.height - gy, gx)) + 2
    pad = Image.new('RGBA', (side, side))
    pad.alpha_composite(img, (round(side / 2 - gx), round(side / 2 - gy)))
    angle = math.degrees(math.atan2(tip[1] - grip[1], tip[0] - grip[0]))  # screen angle of the weapon axis
    rotated = pad.rotate(-(angle + 90), resample=Image.NEAREST)  # image "up" is -90 degrees on screen
    return rotated, (round(grip[0] - side / 2), round(grip[1] - side / 2))


def main():
    out, body, outfit, anim, weapon = sys.argv[1:6]
    facings = sys.argv[6:] or FACINGS
    skel = json.loads((ROOT / 'docs/design/rig/skeletons.json').read_text(encoding='utf-8'))['bodies'][body]
    rows = []
    for facing in facings:
        folder = ROOT / f'docs/design/rig/raw/{body}/{outfit}/{anim}/{facing}'
        frames = sorted(folder.glob('*.png'), key=lambda p: int(p.stem)) if folder.exists() else []
        rows.append((facing, [Image.open(p).convert('RGBA') for p in frames], skel[facing][anim + ':weapon']))
    cols = max(len(r[1]) for r in rows)
    sheet = Image.new('RGBA', (128 * cols, 128 * len(rows)), (40, 60, 55, 255))
    for r, (facing, frames, weapons) in enumerate(rows):
        for c, frame in enumerate(frames):
            cell = Image.new('RGBA', (128, 128))
            w = weapons[c]
            layer = weapon_layer(weapon, w['grip'], w['tip']) if weapon != 'none' else None
            if layer and not w['front']:
                cell.alpha_composite(*layer)
            cell.alpha_composite(frame)
            if layer and w['front']:
                cell.alpha_composite(*layer)
            sheet.alpha_composite(cell, (c * 128, r * 128))
    sheet.resize((sheet.width * 2, sheet.height * 2), Image.NEAREST).save(out)


if __name__ == '__main__':
    main()
