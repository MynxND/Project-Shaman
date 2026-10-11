"""Download and package original PixelLab Medium sprites, retaining every native frame.

Run with --download after jobs.json is updated; --strict requires active effects, tree icons and
both character bodies in eight generated directions. No direction is mirrored.
"""
import sys
sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parent))
from rig_cleanup import drop_specks
import argparse
import json
import statistics
import subprocess
import urllib.request
import zipfile
from io import BytesIO
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
DOC = ROOT / 'docs/design/skills/medium-v1'
RAW = DOC / 'raw'
OUT = ROOT / 'apps/client/public/assets/skills/medium-v1'
policy = json.loads(subprocess.check_output(['node', '--input-type=module', '-e', "import {MEDIUM_PRESENTATION,SKILL_BEHAVIOR_POLICY} from './packages/shared/dist/index.js'; console.log(JSON.stringify({skills:MEDIUM_PRESENTATION,behaviors:SKILL_BEHAVIOR_POLICY}))"], cwd=ROOT, text=True))
OUT.mkdir(parents=True, exist_ok=True)
RAW.mkdir(parents=True, exist_ok=True)
args = argparse.ArgumentParser()
args.add_argument('--download', action='store_true')
args.add_argument('--strict', action='store_true')
options = args.parse_args()
jobs = json.loads((DOC / 'jobs.json').read_text(encoding='utf-8-sig'))
design = json.loads((DOC / 'design.json').read_text(encoding='utf-8-sig'))
facings = ['south', 'south-east', 'east', 'north-east', 'north', 'north-west', 'west', 'south-west']

def download(url, path):
    if path.exists():
        return
    try:
        data = urllib.request.urlopen(url, timeout=60).read()
        if path.suffix == '.png':
            Image.open(BytesIO(data)).verify()
        else:
            if not zipfile.is_zipfile(BytesIO(data)):
                raise ValueError('not a zip archive')
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
    except Exception as error:
        print('not ready:', path.name, type(error).__name__)

if options.download:
    for skill_id, entry in jobs['effects'].items():
        if not policy['behaviors'][policy['skills'][skill_id]['behavior']]['generateVfx']:
            continue  # Existing raw passive experiments are archived; never request new passive VFX.
        folder = RAW / entry.get('artifactFolder', skill_id)
        download(entry.get('seedUrl', f"https://api.pixellab.ai/mcp/images/{entry['seedJob']}/download"), folder / 'seed.png')
        if entry.get('animationJob') and entry.get('completed'):
            for i in range(entry.get('frameCount', 8) + 1):
                download(f"https://api.pixellab.ai/mcp/images/{entry['animationJob']}/download?index={i}", folder / f'frame_{i:03}.png')
        if entry.get('reviewedSheetUrl'):
            download(entry['reviewedSheetUrl'], folder / 'reviewed-sheet.png')
    for body, entry in jobs['casts'].items():
        if entry.get('completed'):
            download(f"https://api.pixellab.ai/mcp/characters/{entry['characterId']}/download", RAW / f'{body}-cast-final.zip')
        if entry.get('front', {}).get('completed'):
            download(f"https://api.pixellab.ai/mcp/characters/{entry['front']['characterId']}/download", RAW / f'{body}-front-cast-final.zip')

def package_frames(frames, name, anchor=None):
    width, height = max(f.width for f in frames), max(f.height for f in frames)
    sheet = Image.new('RGBA', (width * len(frames), height))
    review = Image.new('RGBA', (width * len(frames), height), '#203634')
    gif_frames = []
    for i, frame in enumerate(frames):
        pad = Image.new('RGBA', (width, height))
        pad.alpha_composite(frame, ((width-frame.width)//2, (height-frame.height)//2))
        sheet.alpha_composite(pad, (i*width, 0))
        review.alpha_composite(pad, (i*width, 0))
        visible = Image.new('RGBA', (width, height), '#203634')
        visible.alpha_composite(pad)
        gif_frames.append(visible.convert('RGB'))
    revision = jobs['effects'].get(name, {}).get('artRevision')
    image_name = f'{name}-{revision}.png' if revision else f'{name}.png'
    sheet.save(OUT / image_name)
    review.save(DOC / f'{name}-frames.png')
    gif_frames[0].save(DOC / f'{name}.gif', save_all=True, append_images=gif_frames[1:], duration=110, loop=0)
    return {'image': image_name, 'width': width, 'height': height, 'frames': len(frames),
            'anchor': anchor or {'x': width/2, 'y': height/2}}

manifest = {'version': 'medium-v1', 'source': 'PixelLab', 'previewOnly': True,
            'unknowns': design['unknowns'], 'skills': [], 'casts': {}}
for skill in design['skills']:
    rule = policy['skills'][skill['id']]
    needs_vfx = policy['behaviors'][rule['behavior']]['generateVfx']
    folder = RAW / jobs['effects'][skill['id']].get('artifactFolder', skill['id'])
    seed = folder / 'seed.png'
    paths = sorted(folder.glob('frame_*.png'))
    if not seed.exists() or (needs_vfx and len(paths) != jobs['effects'][skill['id']].get('frameCount', 8) + 1):
        if options.strict:
            raise ValueError(f"Missing native frames: {skill['id']}")
        continue
    frames = [Image.open(p).convert('RGBA') for p in paths] if needs_vfx else []
    entry = jobs['effects'][skill['id']]
    if needs_vfx and entry.get('reviewedSheetUrl'):
        reviewed = Image.open(folder / 'reviewed-sheet.png').convert('RGBA')
        width, height = frames[0].size
        columns = entry['reviewedSheetColumns']
        assert reviewed.width == columns*width and reviewed.height >= ((len(frames)+columns-1)//columns)*height
        frames = [reviewed.crop(((i%columns)*width,(i//columns)*height,(i%columns+1)*width,(i//columns+1)*height)) for i in range(len(frames))]
    if any(f.getextrema()[3][0] == 255 for f in frames):
        raise ValueError(f"Opaque VFX frame: {skill['id']}")
    icon_folder = jobs['effects'][skill['id']].get('iconSourceFolder')
    native = Image.open(RAW / icon_folder / 'seed.png' if icon_folder else seed).convert('RGBA')
    # HUD icon is a nearest-neighbour adaptation of the original PixelLab motif.
    bounds = native.getbbox()
    crop = native.crop(bounds)
    crop.thumbnail((54, 54), Image.Resampling.NEAREST)
    icon = Image.new('RGBA', (64,64))
    icon.alpha_composite(crop, ((64-crop.width)//2,(64-crop.height)//2))
    icon.save(OUT / f"{skill['id']}-icon.png")
    data = {k:v for k,v in skill.items() if k not in ['motif','motion','size']}
    data['behavior'] = rule['behavior']
    data['effect'] = package_frames(frames, skill['id'], jobs['effects'][skill['id']].get('anchor')) if needs_vfx else None
    if data['effect'] is None:
        data['visual'] = 'โบนัสค่าสถานะ · ไม่มีท่าร่าย วงร่าย หรือ VFX'
    data['icon'] = f"{skill['id']}-icon.png"
    data['seedJob'] = jobs['effects'][skill['id']]['seedJob']
    data['animationJob'] = jobs['effects'][skill['id']]['animationJob']
    manifest['skills'].append(data)

# An empty archive, so the v1 zip can be absent once every direction has v2 frames.
EMPTY_ZIP = bytes([0x50, 0x4B, 0x05, 0x06]) + bytes(18)
rig = json.loads((ROOT / 'apps/client/public/assets/pixellab/main-v1-manifest.json').read_text())
for body in ['male','female']:
    archive = RAW / f'{body}-cast-final.zip'
    if not archive.exists():
        archive = RAW / f'{body}-cast.zip'
    # Cast v2 (2026-10-09, user: casting looked choppy): 12-frame v3 loops per direction from
    # tools/sprites/animate_rig.ps1, starting and ending on the idle rotation. Used where present; v1 zips otherwise.
    V2 = ROOT / f'docs/design/pixellab-main/raw/{body}/cast'
    v2_log = lambda facing: json.loads((ROOT / f'docs/design/pixellab-main/cast/{body}-{facing}.json').read_text(encoding='utf-8-sig'))
    if (not archive.exists() or not zipfile.is_zipfile(archive)) and not V2.exists():
        if options.strict:
            raise ValueError(f'Missing cast archive: {body}')
        continue
    directions = {}
    with (zipfile.ZipFile(archive) if archive.exists() and zipfile.is_zipfile(archive) else zipfile.ZipFile(BytesIO(EMPTY_ZIP))) as z:
        for facing in facings:
            names = sorted(n for n in z.namelist() if n.startswith(f'Idle/animations/medium-ritual-cast-v1/{facing}/') and n.endswith('.png'))
            v2_dir = V2 / facing
            if v2_dir.is_dir():
                frames = [drop_specks(Image.open(p))[0] for p in sorted(v2_dir.glob('*.png'), key=lambda p: int(p.stem))]
            elif facing == 'south' and (RAW / f'{body}-front-cast-final.zip').exists():
                with zipfile.ZipFile(RAW / f'{body}-front-cast-final.zip') as front:
                    names_front = sorted(n for n in front.namelist() if n.startswith('Idle/animations/medium-ritual-cast-v1/south/') and n.endswith('.png'))
                    frames = [Image.open(BytesIO(front.read(n))).convert('RGBA') for n in names_front]
            else:
                frames = [Image.open(BytesIO(z.read(n))).convert('RGBA') for n in names]
            if not frames:
                if options.strict:
                    raise ValueError(f'Missing casting direction: {body}/{facing}')
                continue
            # Stabilize planted feet using whole-pixel translations. Raw frames stay intact.
            w, h = max(f.width for f in frames)+16, max(f.height for f in frames)+16
            stable = []
            heights = []
            for f in frames:
                box = f.getbbox()
                if not box:
                    raise ValueError('Empty casting frame')
                heights.append(box[3]-box[1])
                foot = f.crop((0, max(box[1],box[3]-6),f.width,box[3])).getchannel('A')
                pixels = [(x,a) for y in range(foot.height) for x in range(foot.width) if (a:=foot.getpixel((x,y)))>40]
                foot_x = sum(x*a for x,a in pixels)/sum(a for _,a in pixels)
                canvas = Image.new('RGBA',(w,h))
                canvas.alpha_composite(f, (round(w/2-foot_x), h-8-box[3]))
                stable.append(canvas)
            ref = Image.open(ROOT / f'apps/client/public/assets/pixellab/main-{body}-v1/{facing}.png')
            refbox = ref.getbbox()
            data = package_frames(stable, f'cast-{body}-{facing}', {'x':w/2,'y':h-8})
            data['scaleRatio'] = (refbox[3]-refbox[1])/statistics.median(heights)
            if v2_dir.is_dir():
                log = v2_log(facing)
                data['characterId'] = log['characterId']
                data['animationGroup'] = log['group']
                data['revision'] = 'v2'
            else:
                provenance = jobs['casts'][body]['front'] if facing == 'south' else jobs['casts'][body]
                data['characterId'] = provenance['characterId']
                data['animationGroup'] = provenance['group']
            directions[facing] = data
    manifest['casts'][body] = directions

(OUT / 'manifest.json').write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')

# Every-frame contact sheets, at native resolution, and an animated ten-skill overview.
reviews = [(s['id'], Image.open(DOC / f"{s['id']}-frames.png")) for s in manifest['skills'] if s['effect']]
if reviews:
    contact = Image.new('RGB',(max(im.width for _,im in reviews),sum(im.height+24 for _,im in reviews)), '#203634')
    draw = ImageDraw.Draw(contact)
    y = 0
    for label, im in reviews:
        draw.text((4,y+5), label, fill='#edd7a3')
        contact.paste(im.convert('RGB'),(0,y+24))
        y += im.height+24
    contact.save(DOC / 'all-effect-frames.png')
    overview = []
    for frame_index in range(max(s['effect']['frames'] for s in manifest['skills'] if s['effect'])):
        board = Image.new('RGB',(1000,230),'#203634')
        labels = ImageDraw.Draw(board)
        for i, skill in enumerate(manifest['skills']):
            sheet = skill['effect']
            if sheet is None:
                continue
            native = Image.open(OUT / sheet['image']).convert('RGBA')
            native_index = min(sheet['frames']-1, int(frame_index / max(s['effect']['frames'] for s in manifest['skills'] if s['effect']) * sheet['frames']))
            frame = native.crop((native_index*sheet['width'],0,(native_index+1)*sheet['width'],sheet['height']))
            x,y = (i%5)*200,(i//5)*230
            board.paste(frame,(x+(200-frame.width)//2,y+8),frame)
            labels.text((x+8,y+202),skill['name'],fill='#edd7a3')
            labels.text((x+8,y+218),skill['kind'],fill='#91b2a0')
        overview.append(board)
    overview[0].save(DOC / 'medium-effects-overview.gif',save_all=True,append_images=overview[1:],duration=130,loop=0)
for body, directions in manifest['casts'].items():
    rows = [(f,Image.open(DOC / f'cast-{body}-{f}-frames.png')) for f in facings if f in directions]
    contact = Image.new('RGB',(max(im.width for _,im in rows),sum(im.height+24 for _,im in rows)), '#203634')
    draw = ImageDraw.Draw(contact)
    y = 0
    for label, im in rows:
        draw.text((4,y+5),f'{body} {label}',fill='#edd7a3')
        contact.paste(im.convert('RGB'),(0,y+24))
        y += im.height+24
    contact.save(DOC / f'cast-{body}-all-frames.png')
print('packaged:',len(manifest['skills']),'skills;',sum(s['effect'] is not None for s in manifest['skills']),'active effects;', {b:len(d) for b,d in manifest['casts'].items()})
