"""All eight views, every move/attack/death frame in manifest order; inspection is separate."""
from pathlib import Path
import json,sys
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[3];OUT=ROOT/'docs/design/monsters/folklore-01/audit-02';OUT.mkdir(exist_ok=True)
ASSETS=ROOT/'apps/client/public/assets/monsters';sheets=json.loads((ASSETS/'folklore-01/drafts.json').read_text(encoding='utf8'))['monsters']
if '--after' not in sys.argv and (OUT/'before-drafts.json').exists():
 sheets=json.loads((OUT/'before-drafts.json').read_text(encoding='utf8'))['monsters']
if '--after' in sys.argv:
 OUT=OUT/'after';OUT.mkdir(exist_ok=True)
 selected=json.loads((OUT.parent/'report.json').read_text(encoding='utf8'))['sequenceRepairs'];sheets={k:v for k,v in sheets.items() if k in selected}
if '--repair03' in sys.argv:
 OUT=OUT.parent/'repair-03/after';OUT.mkdir(exist_ok=True);sheets=json.loads((ASSETS/'folklore-01/drafts.json').read_text(encoding='utf8'))['monsters']
for ident,s in sheets.items():
 im=Image.open(ASSETS/s['image']);page=Image.new('RGB',(1536,1240),'#19302e');d=ImageDraw.Draw(page)
 d.text((8,4),ident+' | MOVE 1-4 | ATTACK 1-4 | DEATH 1-4',fill='white')
 for row,(face,clips) in enumerate(s['directions'].items()):
  for a,action in enumerate(['move','attack','death']):
   for k,idx in enumerate(clips[action]['indices']):
    x=idx%8*s['frameWidth'];y=idx//8*s['frameHeight'];f=im.crop((x,y,x+s['frameWidth'],y+s['frameHeight']));f.thumbnail((124,124),Image.Resampling.NEAREST)
    px=(a*4+k)*128;py=row*152+26;page.paste(f,(px+(128-f.width)//2,py),f);d.text((px+2,py+124),face+' '+str(k+1),fill='#dfd1a9')
 page.save(OUT/(ident+'.png'))
print('Wrote',len(sheets),'complete chronological eight-view contact sheets')
