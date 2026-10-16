"""Pack user-authorized ImageGen artwork; never manufacture intermediate poses.

Explicit measured palace cuts account for the generated facade occupying more
than one nominal cell. Originals remain unchanged with hashes and prompt files.
"""
from pathlib import Path
from PIL import Image
import hashlib, json
from collections import deque

ROOT = Path(__file__).resolve().parents[3]
ART = ROOT / 'apps/client/public/assets/boss/maiyarap'
SOURCE = ART / 'source'
FACES = ['south', 'south-west', 'west', 'north-west', 'north', 'north-east', 'east', 'south-east']
SKILLS = ['sleep-enchantment', 'underworld-chains', 'phantom-doppelganger', 'patal-gate', 'dream-theft', 'false-awakening', 'nightmare-passage', 'lucid-seal', 'underworld-court', 'sleepwalker-hunt', 'eternal-slumber']

def cells(im, cols, rows):
    return [im.crop((round(x * im.width / cols), round(y * im.height / rows), round((x + 1) * im.width / cols), round((y + 1) * im.height / rows))) for y in range(rows) for x in range(cols)]

def authored_cast_cells(im):
    """Measured irregular source rows, not a nominal equal grid. Keep each real pose.

    Connected opaque anatomy identifies32 isolated sprites. Nearest-component
    ownership retains their original antialiased edge/loose ornament pixels while
    excluding the adjacent row's crown. No pose or motion pixels are synthesized.
    """
    w,h=im.size;alpha=im.getchannel('A').tobytes();seen=bytearray(w*h);major=[]
    for i,v in enumerate(alpha):
        if v<=32 or seen[i]:continue
        q=deque([i]);seen[i]=1;pixels=[];x0=w;y0=h;x1=0;y1=0
        while q:
            k=q.popleft();x=k%w;y=k//w;pixels.append(k);x0=min(x0,x);y0=min(y0,y);x1=max(x1,x);y1=max(y1,y)
            for nx,ny in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
                if 0<=nx<w and 0<=ny<h:
                    n=ny*w+nx
                    if not seen[n] and alpha[n]>32:seen[n]=1;q.append(n)
        if len(pixels)>1000:major.append({'pixels':pixels,'box':[x0,y0,x1+1,y1+1]})
    assert len(major)==32, 'Re-inspect cast source: expected32 authored body islands'
    centers=[108,315,518,723,939,1154,1369,1601]
    rows=[[] for _ in centers]
    for c in major:
        y=(c['box'][1]+c['box'][3])/2;row=min(range(8),key=lambda r:abs(centers[r]-y));rows[row].append(c)
    assert all(len(row)==4 for row in rows)
    ordered=[c for row in rows for c in sorted(row,key=lambda c:c['box'][0])]
    owner=bytearray(w*h);q=deque()
    for label,c in enumerate(ordered,1):
        for i in c['pixels']:owner[i]=label;q.append(i)
    while q:
        i=q.popleft();x=i%w;y=i//w
        for nx,ny in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
            if 0<=nx<w and 0<=ny<h:
                n=ny*w+nx
                if not owner[n]:owner[n]=owner[i];q.append(n)
    buffers=[bytearray(w*h*4) for _ in ordered];rgba=im.tobytes()
    for i,a in enumerate(alpha):
        if a:buffers[owner[i]-1][i*4:i*4+4]=rgba[i*4:i*4+4]
    result=[]
    for data in buffers:
        frame=Image.frombytes('RGBA',(w,h),bytes(data));box=frame.getchannel('A').getbbox();result.append(frame.crop(box))
    return result,[c['box'] for c in ordered]

def pack(seq, columns=4, actor=False):
    out = Image.new('RGBA', (columns * 256, ((len(seq) + columns - 1) // columns) * 256))
    boxes = [c.getchannel('A').point(lambda a: 255 if a > 32 else 0).getbbox() for c in seq]
    if actor:
        scale = min(220 / max(b[2] - b[0] for b in boxes if b), 240 / max(b[3] - b[1] for b in boxes if b))
    for i, (c, box) in enumerate(zip(seq, boxes)):
        if actor and box:
            c = c.crop(box); c = c.resize((max(1, round(c.width * scale)), max(1, round(c.height * scale))), Image.Resampling.NEAREST)
        else:
            c.thumbnail((256, 256), Image.Resampling.NEAREST)
        out.alpha_composite(c, (i % columns * 256 + (256 - c.width) // 2, i // columns * 256 + (248 - c.height if actor else (256 - c.height) // 2)))
    return out

for skill in SKILLS:
    im = Image.open(SOURCE / (skill + '.png')).convert('RGBA')
    pack(cells(im, 4, 2)).save(ART / (skill + '.png'))

idle = pack(cells(Image.open(SOURCE / 'idle-eight.png').convert('RGBA'), 4, 2), actor=True)
idle.save(ART / 'idle-eight.png')
cast_cells,cast_boxes=authored_cast_cells(Image.open(SOURCE / 'cast-directions.png').convert('RGBA'))
cast = pack(cast_cells, actor=True)
cast.save(ART / 'cast-directions.png')
# Death maintains a fixed source cell rather than enlarging the vanishing remains.
death = pack(cells(Image.open(SOURCE / 'death.png').convert('RGBA'), 4, 2))
death.save(ART / 'death.png')
runtime = Image.new('RGBA', (2048, 1536))
for i, c in enumerate(cells(idle, 4, 2) + cells(cast, 4, 8) + cells(death, 4, 2)):
    runtime.alpha_composite(c, (i % 8 * 256, i // 8 * 256))
runtime.save(ART / 'actor.png')

kit = Image.open(SOURCE / 'palace-kit.png').convert('RGBA')
assert kit.size == (1536, 1024), 'Re-measure authored palace cuts for new source'
cuts = {'palace': (0, 0, 704, 585), 'pillar': (705, 0, 880, 585), 'lotus': (883, 290, 1225, 585), 'knot': (1225, 250, 1536, 590), 'flame': (0, 590, 350, 1024), 'source': (352, 590, 820, 1024), 'stone': (846, 632, 1200, 970), 'mist': (1210, 590, 1536, 1024)}
for name, box in cuts.items():
    c = kit.crop(box)
    if name != 'stone':
        b = c.getchannel('A').point(lambda a: 255 if a > 24 else 0).getbbox()
        if b: c = c.crop(b)
    c.save(ART / (name + '.png'))
source = Image.new('RGBA', (256, 256)); c = Image.open(ART / 'source.png'); c.thumbnail((210, 210), Image.Resampling.NEAREST); source.alpha_composite(c, ((256 - c.width) // 2, 248 - c.height)); source.save(ART / 'source-actor.png')

manifest_path = ROOT / 'apps/client/public/assets/monsters/manifest.json'
manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
def clip(indices, fps=8, loop=False): return dict(row=0, frames=len(indices), fps=fps, loop=loop, indices=indices)
directions = {}
for i, face in enumerate(FACES):
    directions[face] = {'idle': clip([i], 4, True), 'move': clip([i], 4, True), 'attack': clip(list(range(8+i*4,12+i*4)), 6), 'hurt': clip([i], 8), 'death': clip(list(range(40,48)), 7)}
manifest['monsters']['maiyarap'] = dict(image='../boss/maiyarap/actor.png', frameWidth=256, frameHeight=256, columns=8, anchor={'x':128,'y':248}, scale=.82, animations=directions['south'], directions=directions, attackImpactFrame=2)
manifest['monsters']['maiyarap-source'] = dict(image='../boss/maiyarap/source-actor.png', frameWidth=256, frameHeight=256, columns=1, anchor={'x':128,'y':248}, scale=.38, animations={a:clip([0],4,a in ['idle','move']) for a in ['idle','move','attack','hurt','death']})
manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n',encoding='utf-8')
receipt={'generator':'ImageGen built-in','authorization':'user2026-10-16','sourcePolicy':'original PNG retained; no synthetic motion frames','faces':FACES,'castFramesPerFacing':4,'castSourceBodyBoxes':cast_boxes,'castPacking':'32 measured anatomy components; equal-grid source assumption rejected after eight-direction runtime inspection','deathFrames':8,'deathFacing':'south-east only, direction-independent dissolution','move':'idle pose, server locomotion; not an authored walk cycle','palaceCuts':cuts,'assets':[]}
for p in sorted(ART.rglob('*.png')):
    im=Image.open(p).convert('RGBA'); receipt['assets'].append({'path':str(p.relative_to(ROOT)).replace('\\','/'),'size':list(im.size),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'alpha':list(im.getchannel('A').getextrema())})
(ART/'manifest.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Packed',len(receipt['assets']),'PNG assets;11 ability atlases,8 facings,32 cast poses,8 death poses.')
