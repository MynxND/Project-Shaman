"""Packaging-time cleanup for generated rig frames (cast, attack). Raw PixelLab frames are never modified.

PixelLab v3 sometimes sprinkles tiny detached sparkles around the hands even when asked for no effects. Those are
small islands of opaque pixels not connected to the body. drop_specks() removes 8-connected islands smaller than
MIN_ISLAND pixels, keeping the body and any larger detached piece (e.g. a floating hair ornament).
"""
from collections import deque

import numpy as np
from PIL import Image

MIN_ISLAND = 30


def drop_specks(img: Image.Image, min_island: int = MIN_ISLAND) -> tuple[Image.Image, int]:
    """Returns the cleaned frame and how many pixels were removed."""
    rgba = np.array(img.convert("RGBA"))
    solid = rgba[..., 3] > 0
    seen = np.zeros_like(solid)
    h, w = solid.shape
    removed = 0
    for y0, x0 in zip(*np.nonzero(solid)):
        if seen[y0, x0]:
            continue
        island = []
        queue = deque([(y0, x0)])
        seen[y0, x0] = True
        while queue:
            y, x = queue.popleft()
            island.append((y, x))
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    ny, nx = y + dy, x + dx
                    if 0 <= ny < h and 0 <= nx < w and solid[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        queue.append((ny, nx))
        if len(island) < min_island:
            ys, xs = zip(*island)
            rgba[list(ys), list(xs), 3] = 0
            removed += len(island)
    return Image.fromarray(rgba), removed
