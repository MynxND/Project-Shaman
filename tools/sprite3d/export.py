"""Pixel processing and atlas export, independent of Blender/model authoring."""
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image

p = argparse.ArgumentParser()
p.add_argument('--config', default=str(Path(__file__).with_name('config.json')))
args = p.parse_args()
root = Path(__file__).resolve().parents[2]
c = json.loads(Path(args.config).read_text())
out = root/c['output']
records = json.loads((out/'render.json').read_text())
directions = list(dict.fromkeys(r['direction'] for r in records))
size, count = c['size'], c['frames']
sheet = Image.new('RGBA', (size*count, size*len(directions)))
frames = []
for r in records:
    img = Image.open(out/r['path']).convert('RGBA')
    pixels = []
    levels = c['paletteLevels']-1
    for red,green,blue,alpha in img.getdata():
        if alpha < c['alphaThreshold']:
            pixels.append((0,0,0,0))
        else:
            pixels.append(tuple(round(round(v/255*levels)*255/levels) for v in (red,green,blue))+(255,))
    img.putdata(pixels)
    img = img.resize((size,size), Image.Resampling.NEAREST)
    bounds = img.getbbox()
    if not bounds or bounds[0] == 0 or bounds[1] == 0 or bounds[2] == size or bounds[3] == size:
        raise ValueError('Empty/clipped frame '+r['path'])
    path = out/'frames'/r['direction']/f"{r['index']:02}.png"
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path)
    x,y = r['index']*size, directions.index(r['direction'])*size
    sheet.paste(img,(x,y))
    frames.append({**{k:v for k,v in r.items() if k != 'path'}, 'rect':{'x':x,'y':y,'w':size,'h':size},
                   'bounds':list(bounds), 'file':path.relative_to(out).as_posix(), 'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
sheet.save(out/'sheet.png')
manifest = {'schema':'shaman-sprite3d/1','character':c.get('character','shaman-placeholder'),'action':c['action'],
            'image':'sheet.png','size':size,'framesPerDirection':count,'directions':directions,
            'durationMs':c['durationMs'],'loop':c['action'] in ['idle','walk','run'],
            'groundAnchorSpace':'frame-local pixels; projected world origin',
            'visualApproved':False,'reference':c['reference'],'config':c,'frames':frames}
(out/'manifest.json').write_text(json.dumps(manifest,indent=2))
print(f'Exported {len(frames)} frames, {sheet.size}, transparent RGBA')
