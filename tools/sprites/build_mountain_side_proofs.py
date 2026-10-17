"""Exact native column translation, explicitly manual derivatives, never provider output."""
from pathlib import Path
from PIL import Image
import json
import hashlib

root = Path(__file__).resolve().parents[2]
folder = root / 'apps/client/public/assets/umbral/candidates/mountain-sanctuary-phase-c'
source = Image.open(folder / 'front-module-01.png').convert('RGBA')
manifest = json.loads((folder / 'manifest.json').read_text(encoding='utf-8'))
derivatives = {}
for name, reverse in [('right', False), ('left', True)]:
    result = Image.new('RGBA', source.size)
    shifts = [round(16 * ((63-x) if reverse else x) / 63) for x in range(64)]
    for x, shift in enumerate(shifts):
        # Copy each original pixel once, no interpolation, mirroring, scaling or repainting.
        assert all(source.getpixel((x,y))[3] == 0 for y in range(96-shift,96)), 'Would clip opaque source pixels'
        result.paste(source.crop((x,0,x+1,96-shift)), (x,shift))
    result.save(folder / f'{name}-return-manual-01.png')
    derivatives[name] = {'file': f'{name}-return-manual-01.png', 'nativeSize': [64,96], 'columnOffsetsY': shifts,
                         'method': 'exact native column translation from front-module-01; not an AI side-generation result',
                         'sourceSha256': hashlib.sha256((folder/'front-module-01.png').read_bytes()).hexdigest(),
                         'visualApproved': False}
manifest['sideDerivatives'] = derivatives
manifest['files'] = {f.name: hashlib.sha256(f.read_bytes()).hexdigest() for f in folder.glob('*.png')}
(folder/'manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
left = Image.open(folder/'left-return-manual-01.png').convert('RGBA')
right = Image.open(folder/'right-return-manual-01.png').convert('RGBA')
assert all(left.getpixel((63,y)) == source.getpixel((0,y)) == right.getpixel((0,y)) for y in range(96))
proof = Image.new('RGBA', (192,96))
for image, x in [(left,0),(source,64),(right,128)]: proof.alpha_composite(image,(x,0))
proof.resize((768,384), Image.Resampling.NEAREST).save(root/'docs/design/mountain-sanctuary-phase-c/derived/left-front-right-4x.png')
print('PASS manual left/front/right boundary equality; no native pixel scaling or opaque clipping; hashes saved')
