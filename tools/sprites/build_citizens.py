"""Build native PixelLab citizen sheets; no resampling or synthetic walk frames.

Inputs: docs/design/citizens/raw/{child,elder}.zip. Outputs: client assets and
contact sheets for reviewing every generated walk frame.
"""
import json
import statistics
import zipfile
from pathlib import Path
from PIL import Image, ImageDraw
from io import BytesIO

ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / 'docs/design/citizens/raw'
OUT = ROOT / 'apps/client/public/assets/umbral/citizens'
OUT.mkdir(parents=True, exist_ok=True)
manifest = {}
for kind, scale in [('child', 0.4), ('elder', 0.5)]:
    archive = RAW / f'{kind}.zip'
    if not zipfile.is_zipfile(archive):
        continue
    art = {'scale': scale, 'directions': {}}
    with zipfile.ZipFile(archive) as z:
        review = []
        for facing in ['east', 'west']:
            direction = {}
            for action in ['idle', 'walk']:
                names = [f'Idle/rotations/{facing}.png'] if action == 'idle' else sorted(
                    n for n in z.namelist() if n.startswith(f'Idle/animations/walk/{facing}/') and n.endswith('.png'))
                if not names:
                    raise ValueError(f'{kind} missing {action} {facing}')
                frames = [Image.open(BytesIO(z.read(n))).convert('RGBA') for n in names]
                width, height = max(f.width for f in frames), max(f.height for f in frames)
                sheet = Image.new('RGBA', (width * len(frames), height))
                bottoms = []
                for i, frame in enumerate(frames):
                    ox = (width - frame.width) // 2
                    oy = (height - frame.height) // 2
                    sheet.alpha_composite(frame, (i * width + ox, oy))
                    box = frame.getbbox()
                    bottoms.append(box[3] + oy if box else height)
                    if action == 'walk':
                        cell = Image.new('RGBA', (width, height), (44, 56, 49, 255))
                        cell.alpha_composite(frame, (ox, oy))
                        review.append(cell)
                name = f'{kind}-{action}-{facing}.png'
                sheet.save(OUT / name)
                direction[action] = {'image': name, 'width': width, 'height': height,
                    'frames': len(frames), 'anchor': {'x': width / 2, 'y': statistics.median(bottoms)}}
            art['directions'][facing] = direction
        w, h = max(c.width for c in review), max(c.height for c in review)
        contact = Image.new('RGBA', (8 * w, 2 * h))
        for i, cell in enumerate(review):
            contact.alpha_composite(cell, ((i % 8) * w, (i // 8) * h))
        contact.save(RAW / f'{kind}-walk-contact.png')
    manifest[kind] = art
(OUT / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
print('built:', ', '.join(manifest))
