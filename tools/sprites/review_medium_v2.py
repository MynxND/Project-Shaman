"""Native-frame visual inspection contact sheets; no source pixels are edited."""
import json
from pathlib import Path
from PIL import Image, ImageDraw
ROOT=Path(__file__).resolve().parents[2]
evidence=json.loads((ROOT/'docs/design/skill-system/medium-v2-accepted.json').read_text(encoding='utf-8'))
out=ROOT/'docs/design/skill-system/reviews'
out.mkdir(exist_ok=True)
for spec in evidence['skills']:
    paths=sorted((ROOT/'docs/design/skills/medium-v1/raw'/f"{spec['id']}-ritual-v2").glob('frame_*.png'))
    if len(paths)!=spec['frameCount']+1:
        continue
    images=[Image.open(p).convert('RGBA') for p in paths]
    w,h=images[0].size
    if spec.get('reviewedSheetUrl'):
        sheet=Image.open(ROOT/'docs/design/skills/medium-v1/raw'/f"{spec['id']}-ritual-v2"/'reviewed-sheet.png').convert('RGBA')
        columns=spec['reviewedSheetColumns']
        images=[sheet.crop(((i%columns)*w,(i//columns)*h,(i%columns+1)*w,(i//columns+1)*h)) for i in range(len(images))]
    board=Image.new('RGB',(w*5,(h+22)*((len(images)+4)//5)),'#203634')
    labels=ImageDraw.Draw(board)
    for i,im in enumerate(images):
        x,y=(i%5)*w,(i//5)*(h+22)
        board.paste(im,(x,y+22),im)
        labels.text((x+3,y+4),f"{spec['id']} F{i}",fill='#ece3bf')
    board.save(out/f"{spec['id']}-frames.png")
    print(spec['id'],len(images),'native frames; dimensions',images[0].size,'bounds', [im.getbbox() for im in images])
