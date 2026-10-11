"""Verify packaged Medium assets against the requested source rules and rig coverage."""
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'apps/client/public/assets/skills/medium-v1'
DOC = ROOT / 'docs/design/skills/medium-v1'
manifest = json.loads((OUT / 'manifest.json').read_text(encoding='utf-8'))
design = json.loads((DOC / 'design.json').read_text(encoding='utf-8'))
jobs = json.loads((DOC / 'jobs.json').read_text(encoding='utf-8-sig'))
original = json.loads((DOC / 'archive/design-before-v2.json').read_text(encoding='utf-8'))
assert manifest['previewOnly'] is True
assert all(v is None for v in manifest['unknowns'].values())
assert [s['id'] for s in manifest['skills']] == [s['id'] for s in design['skills']]

def verify_sheet(sheet, expected_frames):
    im = Image.open(OUT / sheet['image']).convert('RGBA')
    assert im.size == (sheet['width'] * sheet['frames'], sheet['height'])
    assert sheet['frames'] == expected_frames
    assert 0 <= sheet['anchor']['x'] <= sheet['width']
    assert 0 <= sheet['anchor']['y'] <= sheet['height']
    signatures = []
    for i in range(sheet['frames']):
        frame = im.crop((i*sheet['width'],0,(i+1)*sheet['width'],sheet['height']))
        assert frame.getbbox(), 'empty frame'
        assert frame.getextrema()[3][0] == 0, 'missing transparency'
        signatures.append(frame.tobytes())
    assert len(set(signatures)) >= 4, 'animation must contain distinct native frames'

for skill, source in zip(manifest['skills'], design['skills']):
    for key in ['kind','maxLevel','castMs','cooldownMs','durationMs','formula']:
        assert skill[key] == source[key], (skill['id'],key)
        assert skill[key] == next(s for s in original['skills'] if s['id']==skill['id'])[key], 'source balance changed'
    if skill['kind'] == 'active':
        verify_sheet(skill['effect'],jobs['effects'][skill['id']].get('frameCount',8)+1)
    assert Image.open(OUT / skill['icon']).size == (64,64)
    if skill['kind'] == 'passive':
        assert skill['castMs'] is None and skill['cooldownMs'] is None
        assert skill['effect'] is None and skill['behavior'] == 'PASSIVE_STAT'
assert next(s for s in manifest['skills'] if s['id']=='ghost-sight')['castMs'] == 0

# Regressions found in visual review: no grey core in blast, readable actor corridor in healing.
for skill_id, point in [('amulet-blast',(108,80)),('soul-heal',(80,120))]:
    fx = next(s for s in manifest['skills'] if s['id']==skill_id)['effect']
    sheet = Image.open(OUT / fx['image']).convert('RGBA')
    for frame in range(fx['frames']):
        assert sheet.getpixel((frame*fx['width']+point[0],point[1]))[3] == 0, (skill_id,frame,'actor corridor covered')

# User review 2026-10-09: Amulet Blast v2 filled its frame and read as a hard-edged rectangle. Keep an empty margin
# so the burst never shows the frame edge, and keep it asymmetric (left/right alpha mass must differ).
fx = next(s for s in manifest['skills'] if s['id']=='amulet-blast')['effect']
sheet = Image.open(OUT / fx['image']).convert('RGBA')
for frame in range(fx['frames']):
    a = sheet.crop((frame*fx['width'],0,(frame+1)*fx['width'],fx['height'])).getchannel('A')
    l, t, r, b = a.getbbox() or (99,99,0,0)
    assert l >= 6 and t >= 6 and r <= fx['width']-6 and b <= fx['height']-6, ('amulet-blast',frame,'touches frame edge',(l,t,r,b))
seed = sheet.crop((0,0,fx['width'],fx['height'])).getchannel('A')
half = fx['width']//2
mass = lambda im: sum(i*c for i,c in enumerate(im.histogram()))
left = mass(seed.crop((0,0,half,fx['height']))); right = mass(seed.crop((half,0,fx['width'],fx['height'])))
assert abs(left-right) / max(left+right,1) > .08, ('amulet-blast','burst is mirror-symmetric')

for skill in manifest['skills']:
    old_icon = ROOT / 'docs/design/skills/medium-v1/raw' / jobs['effects'][skill['id']].get('iconSourceFolder',jobs['effects'][skill['id']].get('artifactFolder',skill['id'])) / 'seed.png'
    assert old_icon.exists(), 'tree icon source must be retained independently of release VFX'

facings = {'south','south-east','east','north-east','north','north-west','west','south-west'}
for body in ['male','female']:
    assert set(manifest['casts'][body]) == facings
    for sheet in manifest['casts'][body].values():
        verify_sheet(sheet,sheet['frames'])
        assert sheet['frames'] >= 8, 'cast poses keep at least 8 frames'
        assert .5 < sheet['scaleRatio'] < 1.5
print('PASS: ten source-correct skills,',sum(s['effect']['frames'] for s in manifest['skills'] if s['effect']),'active VFX frames, five stat passives without VFX, ten icons,', sum(s['frames'] for d in manifest['casts'].values() for s in d.values()), 'casting frames')
