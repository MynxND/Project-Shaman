"""Shared skeleton timeline for the modular character (docs/design/equipment/README.md).

One 18-joint humanoid (PixelLab animate_with_skeleton_v3 labels) is authored ONCE in 3D body space for every
animation, then projected into each of the 8 facings with the game's low top-down camera. Every layer (body /
outfit sprites, weapon, headgear) is drawn on these exact skeletons, so frame counts, timing, origin and joint
positions match by construction; weapon attachment points are the hand joints, not guesses.

Body space: x = character's right, y = up, z = forward; units are fractions of the figure height (chibi proportions:
big head). The camera looks down ELEVATION degrees: a point nearer the camera is drawn lower on screen.

Run: python -I tools/rig/skeleton.py [--fit-preview out.png]
     writes docs/design/rig/skeletons.json (keypoints per body, facing, animation, frame; 0-1 fractions of the frame).
"""
import json
import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
RIG = ROOT / 'apps/client/public/assets/pixellab'
OUT = ROOT / 'docs/design/rig'
FACINGS = ['south', 'south-east', 'east', 'north-east', 'north', 'north-west', 'west', 'south-west']
# Screen angle of the facing (0 = east, 90 = toward the camera / down the screen).
YAW = {'east': 0, 'south-east': 45, 'south': 90, 'south-west': 135, 'west': 180, 'north-west': 225, 'north': 270, 'north-east': 315}
ELEVATION = math.radians(18)
FRAME = 128  # skeletons are expressed on the rig's 128 px rotation canvas

# Rest pose in body space (chibi: head top at 1.0, chin ~0.62).
REST = {
    'NOSE': (0.0, 0.76, 0.12), 'RIGHT EYE': (0.07, 0.80, 0.10), 'LEFT EYE': (-0.07, 0.80, 0.10),
    'RIGHT EAR': (0.15, 0.79, 0.0), 'LEFT EAR': (-0.15, 0.79, 0.0),
    'NECK': (0.0, 0.60, 0.0),
    'RIGHT SHOULDER': (0.17, 0.56, 0.0), 'LEFT SHOULDER': (-0.17, 0.56, 0.0),
    'RIGHT ELBOW': (0.22, 0.45, -0.01), 'LEFT ELBOW': (-0.22, 0.45, -0.01),
    'RIGHT ARM': (0.22, 0.35, 0.03), 'LEFT ARM': (-0.22, 0.35, 0.03),
    'RIGHT HIP': (0.09, 0.38, 0.0), 'LEFT HIP': (-0.09, 0.38, 0.0),
    'RIGHT KNEE': (0.09, 0.20, 0.01), 'LEFT KNEE': (-0.09, 0.20, 0.01),
    'RIGHT LEG': (0.09, 0.03, 0.0), 'LEFT LEG': (-0.09, 0.03, 0.0),
}
LABELS = list(REST)


def lerp(a, b, t):
    return tuple(x + (y - x) * t for x, y in zip(a, b))


def add(a, d):
    return tuple(x + y for x, y in zip(a, d))


# ---- Motions in body space: each returns {label: (x, y, z)} for phase t in [0, 1) ----
def idle(t):
    p = dict(REST)
    bob = 0.006 * math.sin(2 * math.pi * t)
    for k in p:
        if 'LEG' not in k and 'KNEE' not in k:
            p[k] = add(p[k], (0, bob, 0))
    return p


def walk(t):
    p = dict(REST)
    s = math.sin(2 * math.pi * t)
    c = math.cos(2 * math.pi * t)
    stride, lift = 0.10, 0.05
    bob = 0.012 * abs(c)
    for side, sign in (('RIGHT', 1), ('LEFT', -1)):
        z = sign * stride * s
        up = max(0.0, sign * c) * lift
        p[f'{side} LEG'] = add(REST[f'{side} LEG'], (0, up, z))
        p[f'{side} KNEE'] = add(REST[f'{side} KNEE'], (0, up * 0.6, z * 0.6 + up * 0.5))
        # Opposite arm swings forward.
        p[f'{side} ARM'] = add(REST[f'{side} ARM'], (0, 0.0, -z * 0.8))
        p[f'{side} ELBOW'] = add(REST[f'{side} ELBOW'], (0, 0.0, -z * 0.4))
    for k in p:
        if 'LEG' not in k and 'KNEE' not in k:
            p[k] = add(p[k], (0, bob, 0))
    return p


def attack(t):
    """Main-hand (right) overhead strike: wind up behind the shoulder, swing down in front, recover."""
    p = dict(REST)
    keys = [  # (t, hand, elbow) for the right arm
        (0.00, REST['RIGHT ARM'], REST['RIGHT ELBOW']),
        (0.30, (0.16, 0.72, -0.10), (0.16, 0.60, -0.08)),
        (0.45, (0.12, 0.70, 0.08), (0.15, 0.62, 0.02)),
        (0.62, (0.06, 0.38, 0.28), (0.12, 0.48, 0.16)),
        (0.80, (0.08, 0.36, 0.20), (0.13, 0.46, 0.10)),
        (1.00, REST['RIGHT ARM'], REST['RIGHT ELBOW']),
    ]
    for (t0, h0, e0), (t1, h1, e1) in zip(keys, keys[1:]):
        if t0 <= t <= t1:
            u = (t - t0) / (t1 - t0)
            u = u * u * (3 - 2 * u)
            p['RIGHT ARM'], p['RIGHT ELBOW'] = lerp(h0, h1, u), lerp(e0, e1, u)
    lean = 0.04 * math.sin(math.pi * min(1, t / 0.8))
    for k in p:
        if 'LEG' not in k and 'KNEE' not in k and 'HIP' not in k:
            p[k] = add(p[k], (0, -lean * 0.3, lean))
    return p


def cast(t):
    """Gather both hands at the chest, slow circle, lift the right palm, open both arms, settle (12 frames)."""
    p = dict(REST)
    chest = (0.0, 0.47, 0.12)
    if t < 0.3:
        u = t / 0.3
        r, l = lerp(REST['RIGHT ARM'], add(chest, (0.02, 0, 0)), u), lerp(REST['LEFT ARM'], add(chest, (-0.02, 0, 0)), u)
    elif t < 0.55:
        a = (t - 0.3) / 0.25 * 2 * math.pi
        o = (0.03 * math.cos(a), 0.03 * math.sin(a), 0)
        r, l = add(add(chest, (0.02, 0, 0)), o), add(add(chest, (-0.02, 0, 0)), o)
    elif t < 0.8:
        u = (t - 0.55) / 0.25
        r = lerp(add(chest, (0.02, 0, 0)), (0.24, 0.60, 0.10), u)
        l = lerp(add(chest, (-0.02, 0, 0)), (-0.24, 0.60, 0.10), u)
    else:
        u = (t - 0.8) / 0.2
        r, l = lerp((0.24, 0.60, 0.10), REST['RIGHT ARM'], u), lerp((-0.24, 0.60, 0.10), REST['LEFT ARM'], u)
    p['RIGHT ARM'], p['LEFT ARM'] = r, l
    p['RIGHT ELBOW'] = lerp(REST['RIGHT SHOULDER'], r, 0.5)
    p['LEFT ELBOW'] = lerp(REST['LEFT SHOULDER'], l, 0.5)
    p['RIGHT ELBOW'] = add(p['RIGHT ELBOW'], (0.04, -0.03, 0))
    p['LEFT ELBOW'] = add(p['LEFT ELBOW'], (-0.04, -0.03, 0))
    return p


ANIMATIONS = {'idle': (idle, 4), 'walk': (walk, 8), 'attack': (attack, 8), 'cast': (cast, 12)}

# Main-hand weapon direction per animation, in body space, relative to the right hand: where the weapon's TIP points.
# Not sent to PixelLab (it only takes the 18 joints); used by the weapon layer: grip = right hand, axis = hand -> tip.
UPRIGHT = (0.03, 1.0, 0.12)
def weapon_dir(anim, t):
    if anim == 'cast':
        # Keep the hand pin but lean the staff away from the actor's face during the chest-level gesture.
        return (0.45, 1.0, 0.10)
    if anim != 'attack':
        return UPRIGHT
    keys = [(0.0, UPRIGHT), (0.30, (0.0, 0.75, -0.65)), (0.45, (0.0, 1.0, 0.1)), (0.62, (0.0, -0.25, 1.0)), (0.80, (0.0, 0.1, 1.0)), (1.0, UPRIGHT)]
    for (t0, a), (t1, b) in zip(keys, keys[1:]):
        if t0 <= t <= t1:
            u = (t - t0) / (t1 - t0)
            return lerp(a, b, u * u * (3 - 2 * u))
    return UPRIGHT


def project(points, facing, fit):
    """Body space -> frame pixels for a facing, with the per-body fit (feet y, centre x, scale)."""
    a = math.radians(YAW[facing])
    fwd = (math.cos(a), math.sin(a))          # on the ground plane: (screen x, toward-camera)
    right = (-fwd[1], fwd[0])                 # character's right on the ground plane
    out = {}
    for k, (x, y, z) in points.items():
        gx = right[0] * x + fwd[0] * z         # screen-x component
        gz = right[1] * x + fwd[1] * z         # toward-camera component
        sx = fit['cx'] + gx * fit['s']
        sy = fit['feet'] - (y * math.cos(ELEVATION) - gz * math.sin(ELEVATION)) * fit['s']
        out[k] = (sx, sy, gz)
    return out


def fit_for(body, facing):
    img = Image.open(RIG / f'main-{body}-v1/{facing}.png').convert('RGBA')
    a = np.asarray(img)[..., 3] > 40
    ys, xs = np.nonzero(a)
    top, bottom = ys.min(), ys.max()
    feet_cols = xs[ys >= bottom - 4]
    return {'cx': float(np.median(xs[ys > top + (bottom - top) * 0.3])), 'feet': float(bottom - 2),
            's': float((bottom - top) / math.cos(ELEVATION))}


def keypoints(proj):
    # z_index from nearness to the camera so the model layers limbs correctly.
    return [{'label': k, 'x': round(sx / FRAME, 4), 'y': round(sy / FRAME, 4), 'z_index': int(round(gz * 100))} for k, (sx, sy, gz) in proj.items()]


def main():
    data = {'note': 'Generated by tools/rig/skeleton.py. x/y are fractions of the 128 px frame.', 'elevation': math.degrees(ELEVATION), 'bodies': {}}
    for body in ('male', 'female'):
        b = {}
        for facing in FACINGS:
            fit = fit_for(body, facing)
            entry = {'fit': fit, 'rest': keypoints(project(REST, facing, fit))}
            for name, (fn, n) in ANIMATIONS.items():
                frames, weapon = [], []
                for i in range(n):
                    pose = fn(i / n)
                    hand = pose['RIGHT ARM']
                    d = weapon_dir(name, i / n)
                    norm = math.sqrt(sum(c * c for c in d)) or 1
                    tip = add(hand, tuple(0.2 * c / norm for c in d))
                    proj = project({**pose, 'TIP': tip}, facing, fit)
                    grip, tipp, neck = proj['RIGHT ARM'], proj['TIP'], proj['NECK']
                    del proj['TIP']
                    frames.append(keypoints(proj))
                    # Grip and tip in frame pixels; front = the hand is nearer the camera than the body's centre line.
                    weapon.append({'grip': [round(grip[0], 1), round(grip[1], 1)], 'tip': [round(tipp[0], 1), round(tipp[1], 1)], 'front': bool(grip[2] > neck[2])})
                entry[name] = frames
                entry[name + ':weapon'] = weapon
            b[facing] = entry
        data['bodies'][body] = b
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / 'skeletons.json').write_text(json.dumps(data, separators=(',', ':')) + '\n', encoding='utf-8')
    print('wrote skeletons for', {b: len(v) for b, v in data['bodies'].items()})
    if '--fit-preview' in sys.argv:
        out = sys.argv[sys.argv.index('--fit-preview') + 1]
        bones = [('NECK', 'NOSE'), ('NECK', 'RIGHT SHOULDER'), ('NECK', 'LEFT SHOULDER'), ('RIGHT SHOULDER', 'RIGHT ELBOW'), ('RIGHT ELBOW', 'RIGHT ARM'),
                 ('LEFT SHOULDER', 'LEFT ELBOW'), ('LEFT ELBOW', 'LEFT ARM'), ('NECK', 'RIGHT HIP'), ('NECK', 'LEFT HIP'), ('RIGHT HIP', 'RIGHT KNEE'),
                 ('RIGHT KNEE', 'RIGHT LEG'), ('LEFT HIP', 'LEFT KNEE'), ('LEFT KNEE', 'LEFT LEG')]
        sheet = Image.new('RGBA', (FRAME * 8, FRAME * 2), (40, 60, 55, 255))
        for r, body in enumerate(('male', 'female')):
            for c, facing in enumerate(FACINGS):
                sheet.alpha_composite(Image.open(RIG / f'main-{body}-v1/{facing}.png').convert('RGBA'), (c * FRAME, r * FRAME))
                pts = {k['label']: (c * FRAME + k['x'] * FRAME, r * FRAME + k['y'] * FRAME) for k in data['bodies'][body][facing]['rest']}
                d = ImageDraw.Draw(sheet)
                for a, b in bones:
                    colour = (255, 80, 80) if a.startswith('RIGHT') or b.startswith('RIGHT') else (80, 200, 255)
                    d.line([pts[a], pts[b]], fill=colour, width=2)
                for k, (x, y) in pts.items():
                    d.ellipse((x - 2, y - 2, x + 2, y + 2), fill=(255, 230, 80) if 'ARM' in k else (255, 255, 255))
        sheet.resize((sheet.width * 2, sheet.height * 2), Image.NEAREST).save(out)


if __name__ == '__main__':
    main()
