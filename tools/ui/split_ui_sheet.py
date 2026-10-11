"""Split a PixelLab UI sheet into its separate pieces and measure 9-slice borders.

Usage: python tools/ui/split_ui_sheet.py <sheet.png> <out dir>
Pieces are 8-connected opaque regions (small specks merged away). Each is saved as piece-<n>.png with its bbox,
and an estimate of the frame thickness on each side: the distance from the edge, along the middle row/column,
to the first pixel whose colour is close to the panel interior (the median colour at the piece centre).
Writes pieces.json.
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image


def components(alpha):
    h, w = alpha.shape
    seen = np.zeros_like(alpha)
    out = []
    for y, x in zip(*np.where(alpha)):
        if seen[y, x]:
            continue
        stack, pts = [(y, x)], []
        seen[y, x] = True
        while stack:
            cy, cx = stack.pop()
            pts.append((cy, cx))
            for ny in (cy - 1, cy, cy + 1):
                for nx in (cx - 1, cx, cx + 1):
                    if 0 <= ny < h and 0 <= nx < w and alpha[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        stack.append((ny, nx))
        if len(pts) > 40:
            ys, xs = zip(*pts)
            out.append((int(min(xs)), int(min(ys)), int(max(xs)) + 1, int(max(ys)) + 1))
    return sorted(out, key=lambda b: (b[1] // 40, b[0]))


def border(rgb, interior, axis_line, reverse):
    line = axis_line[::-1] if reverse else axis_line
    for i, px in enumerate(line):
        if np.abs(px.astype(int) - interior).max() <= 18:
            return i
    return None


def main():
    sheet, out = Path(sys.argv[1]), Path(sys.argv[2])
    out.mkdir(parents=True, exist_ok=True)
    img = Image.open(sheet).convert("RGBA")
    a = np.asarray(img)
    info = []
    for n, (x0, y0, x1, y1) in enumerate(components(a[..., 3] > 0)):
        piece = img.crop((x0, y0, x1, y1))
        piece.save(out / f"piece-{n}.png")
        p = np.asarray(piece)
        h, w = p.shape[:2]
        interior = np.median(p[h // 2 - 2: h // 2 + 3, w // 2 - 2: w // 2 + 3, :3].reshape(-1, 3), axis=0)
        row, col = p[h // 2, :, :3], p[:, w // 2, :3]
        sides = {"left": border(p, interior, row, False), "right": border(p, interior, row, True),
                 "top": border(p, interior, col, False), "bottom": border(p, interior, col, True)}
        info.append({"piece": n, "bbox": [x0, y0, x1, y1], "size": [w, h], "interior_rgb": [int(v) for v in interior], "border": sides})
        print(n, (x0, y0, x1, y1), (w, h), sides)
    (out / "pieces.json").write_text(json.dumps(info, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
