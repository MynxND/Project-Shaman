"""Inspect saved provider images without altering their pixels; create join review evidence."""
from pathlib import Path
import hashlib
import json
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/design/mountain-sanctuary-phase-c'
records = []
paths = sorted((OUT / 'raw').glob('*.png'))
if not paths:
    raise SystemExit('No raw provider PNGs yet; do not fabricate outputs.')
sheet = Image.new('RGB', (600, 440 * len(paths)), '#142b29')
draw = ImageDraw.Draw(sheet)
for index, path in enumerate(paths):
    im = Image.open(path).convert('RGBA')
    w, h = im.size
    alpha = im.getchannel('A')
    opaque_rows_left = [y for y in range(h) if im.getpixel((0, y))[3] > 0]
    opaque_rows_right = [y for y in range(h) if im.getpixel((w - 1, y))[3] > 0]
    mismatch = sum(im.getpixel((0, y)) != im.getpixel((w - 1, y)) for y in range(h))
    records.append({'file': str(path.relative_to(ROOT)), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
                    'size': [w, h], 'alphaBounds': alpha.getbbox(),
                    'hasTransparency': alpha.getextrema()[0] == 0,
                    'leftOccupiedRows': opaque_rows_left, 'rightOccupiedRows': opaque_rows_right,
                    'horizontalExactEdgeMismatchRows': mismatch,
                    'visualApproval': False, 'seamless': False})
    draw.text((12, index * 440 + 8), f'{path.stem} | native {w}x{h} | repeated 2x at nearest 4x', fill='#efcf91')
    repeat = Image.new('RGBA', (w * 2, h))
    repeat.alpha_composite(im, (0, 0))
    repeat.alpha_composite(im, (w, 0))
    zoom = repeat.resize((w * 8, h * 4), Image.Resampling.NEAREST)
    sheet.paste(zoom, (12, index * 440 + 36), zoom)
    # A guide marks the seam position outside the art only.
    seam = 12 + w * 4
    draw.line((seam, index * 440 + 26, seam, index * 440 + 34), fill='#ffb55a', width=2)
sheet.save(OUT / 'join-review.png')
(OUT / 'inspection.json').write_text(json.dumps(records, indent=2), encoding='utf-8')
print(json.dumps({'candidates': len(records), 'inspection': str(OUT / 'inspection.json'), 'review': str(OUT / 'join-review.png')}))
