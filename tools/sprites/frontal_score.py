"""Score how frontal (left-right symmetric) each frame of a walk-toward-camera cycle is.

Usage: python tools/sprites/frontal_score.py <frames dir> [<frames dir> ...]
For each frame the upper body (top 55% of the figure: head, shoulders, chest) is mirrored around its own
centroid and compared with itself; the score is the share of opaque pixels with no mirrored partner.
A body square to the camera scores low; a torso turned to three-quarter, or hair and feathers swinging out
to one side, scores high. Prints per-frame scores and the worst frame.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image


def score(img: Image.Image) -> float:
    a = np.asarray(img.convert("RGBA"))[..., 3] > 0
    ys, xs = np.where(a)
    top, bottom = ys.min(), ys.max()
    a = a[top: top + int(0.55 * (bottom - top)) + 1]
    ys, xs = np.where(a)
    cx = int(round(xs.mean()))
    half = max(cx, a.shape[1] - cx)
    padded = np.zeros((a.shape[0], 2 * half + 1), bool)
    padded[:, half - cx: half - cx + a.shape[1]] = a
    mirrored = padded[:, ::-1]
    return float((padded & ~mirrored).sum() / padded.sum())


for folder in sys.argv[1:]:
    paths = sorted(Path(folder).glob("*.png"), key=lambda p: int(p.stem))
    scores = [score(Image.open(p)) for p in paths]
    print(f"{folder}: worst {max(scores):.3f} (frame {int(np.argmax(scores))}), mean {np.mean(scores):.3f} :: " + " ".join(f"{s:.2f}" for s in scores))
