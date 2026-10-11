"""Derives a hollow ring frame from the PixelLab round frame (apps/client/public/assets/ui/round-frame.png).

The parchment disc inside the frame is made transparent so a skill icon can show through.
Usage: python -I tools/ui/make_ring_frame.py  ->  apps/client/public/assets/ui/ring-frame.png (+ prints inner radius)
"""
import math
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
src = Image.open(ROOT / 'apps/client/public/assets/ui/round-frame.png').convert('RGBA')
w, h = src.size
cx, cy = (w - 1) / 2, (h - 1) / 2

def light(p):
    r, g, b, a = p
    return a > 0 and (r * 299 + g * 587 + b * 114) / 1000 > 150

# Largest radius whose whole disc is parchment (light) -> the opening of the ring.
inner = 0.0
for r10 in range(10, int(min(w, h) * 5)):
    r = r10 / 10
    ok = all(light(src.getpixel((x, y))) for y in range(h) for x in range(w) if math.hypot(x - cx, y - cy) <= r)
    if not ok:
        break
    inner = r
out = src.copy()
px = out.load()
for y in range(h):
    for x in range(w):
        # Clear the opening and any parchment touching it, keep the bronze/wood ring and its gold points.
        if math.hypot(x - cx, y - cy) <= inner + 0.5 or (math.hypot(x - cx, y - cy) <= inner + 3 and light(px[x, y])):
            px[x, y] = (0, 0, 0, 0)
out.save(ROOT / 'apps/client/public/assets/ui/ring-frame.png')
print(f'size {w}x{h}, opening radius {inner:.1f}px')
