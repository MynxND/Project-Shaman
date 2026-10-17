"""Lossless owned-reference copies and documented UV texture crops, no AI."""
from pathlib import Path
import hashlib
import json
import shutil
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SOURCE = Path(r'C:\Users\nikza\.codex\generated_images\01a12fb0-f3fd-7c61-9a13-adb474158593')
OUT = ROOT/'docs/design/santet-3d-01'
(OUT/'references').mkdir(parents=True, exist_ok=True)
(OUT/'textures').mkdir(exist_ok=True)
sources = {'body': 'exec-006958d1-47e9-42c5-9311-ce4febb7614b.png',
           'head': 'exec-157c5b88-fc47-4dcd-92ea-86bcd3d7968f.png'}
provenance = []
images = {}
for role, name in sources.items():
    path = SOURCE/name
    shutil.copy2(path, OUT/'references'/name)
    images[role] = Image.open(path).convert('RGBA')
    provenance.append({'role':role,'source':str(path),'repositoryCopy':f'references/{name}',
                       'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
body = images['body']
cw,ch = body.width//4,body.height//2
for name,index in [('front',0),('side',2),('back',4)]:
    x,y = index%4*cw,index//4*ch
    cell = body.crop((x,y,x+cw,y+ch))
    cell.save(OUT/'textures'/f'body-{name}.png')
    provenance.append({'texture':f'body-{name}.png','sourceRole':'body','crop':[x,y,x+cw,y+ch]})
head = images['head']
# First SOUTH cell provides identity texture only, never source gait poses.
for name,rect in [('face',(160,108,280,179)),('hair',(131,49,299,132))]:
    head.crop(rect).save(OUT/'textures'/f'{name}.png')
    provenance.append({'texture':f'{name}.png','sourceRole':'head','crop':list(rect)})
# A review image combines untouched source head cell and body turnaround.
head.crop((0,0,head.width//4,head.height//2)).save(OUT/'reference.png')
(OUT/'reference-provenance.json').write_text(json.dumps(provenance,indent=2))
print('Santet references copied and UV crops recorded')
