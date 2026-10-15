"""Diagnostic contact sheets from saved actual-game captures; never redraw effects."""
from PIL import Image, ImageDraw, ImageOps
from pathlib import Path
import json,sys
source=Path('apps/client/public/monster-review/ranged-vfx-08')
out=Path(sys.argv[1]);out.mkdir(parents=True,exist_ok=True)
data=json.loads((source/'audit.json').read_text(encoding='utf-8'))
kinds=list(dict.fromkeys(r['kind'] for r in data['results']))
faces=['south','south-east','east','north-east','north','north-west','west','south-west']
overview=Image.new('RGB',(1040,4*288),(16,32,31));od=ImageDraw.Draw(overview)
for n,k in enumerate(kinds):
 sheet=Image.new('RGB',(1040,4*284),(16,32,31));d=ImageDraw.Draw(sheet)
 for phase,key in enumerate(['image','impactImage']):
  for i,f in enumerate(faces):
   r=next(r for r in data['results'] if r['kind']==k and r['facing']==f and r['outcome']=='hit')
   im=ImageOps.contain(Image.open(source/r[key]),(260,260),Image.Resampling.NEAREST)
   x=i%4*260;y=(phase*2+i//4)*284;sheet.paste(im,(x+(260-im.width)//2,y+(260-im.height)//2));d.text((x+5,y+263),k+' '+f+' '+('flight' if phase==0 else 'hit'),fill=(236,227,191))
   if phase==0 and f=='east':
    ox=n%4*260;oy=n//4*288;overview.paste(im,(ox+(260-im.width)//2,oy+(260-im.height)//2));od.text((ox+5,oy+264),k+' / actual game',fill=(236,227,191))
 sheet.save(out/(k+'.png'))
overview.save(out/'overview.png')
print('Fourteen actual-game contact sheets: eight flights + eight confirmed hits each')
