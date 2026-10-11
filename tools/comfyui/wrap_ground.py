"""Step between ground phases: roll each raw texture by half and write a seam-cross mask.

Usage: python tools/comfyui/wrap_ground.py [ComfyUI root]
Default ComfyUI root: C:/ComfyUI/ComfyUI_windows_portable/ComfyUI
Reads output/umbral-ground/<id>_raw_*.png (latest), writes input/<id>-wrapped.png and input/<id>-seam-mask.png.
"""
import glob
import sys
from pathlib import Path

import numpy as np
from PIL import Image

IDS = ("basalt-cobble", "dark-earth", "ritual-paving", "dark-grass")
SEAM_HALF_WIDTH = 56  # px on the 1024 texture, i.e. 7 asset pixels each side of the seam


def main():
    comfy = Path(sys.argv[1] if len(sys.argv) > 1 else "C:/ComfyUI/ComfyUI_windows_portable/ComfyUI")
    for gid in IDS:
        raws = sorted(glob.glob(str(comfy / f"output/umbral-ground/{gid}_raw_*.png")))
        if not raws:
            print("missing raw texture for", gid)
            continue
        img = np.asarray(Image.open(raws[-1]).convert("RGB"))
        h, w, _ = img.shape
        rolled = np.roll(np.roll(img, h // 2, axis=0), w // 2, axis=1)
        Image.fromarray(rolled).save(comfy / f"input/{gid}-wrapped.png")
        mask = np.zeros((h, w), np.uint8)
        mask[h // 2 - SEAM_HALF_WIDTH : h // 2 + SEAM_HALF_WIDTH, :] = 255
        mask[:, w // 2 - SEAM_HALF_WIDTH : w // 2 + SEAM_HALF_WIDTH] = 255
        Image.fromarray(mask).save(comfy / f"input/{gid}-seam-mask.png")
        print("wrapped", gid)


if __name__ == "__main__":
    main()
