"""Presentation-only motion; world coordinates, camp data and combat remain authoritative."""
import json
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[3];OUT=ROOT/'apps/client/public/assets/monsters';WORK=ROOT/'docs/design/monsters/folklore-01/repair-03'
path=OUT/'folklore-01/drafts.json';data=json.loads(path.read_text(encoding='utf8'));baseline=json.loads((WORK/'baseline.json').read_text(encoding='utf8'))
hover='phi-krasue onryo yuki-onna ubume cheonyeo-gwishin mulgwishin dalgyal-gwishin chonggak-gwishin rusalka utburdur sending nu-gui shui-gui nokken mare'.split()
for ident,profile in [(i,'hover') for i in hover]+[('phi-krahang','flight'),('jiangshi','hop'),('tilberi','coil')]:
 s=data['monsters'][ident];s['motionProfile']=profile
 for face,clips in s['directions'].items():
  if profile in ['hover','flight']:
   old=baseline['monsters'][ident]['directions'][face]['idle'];poses=old['indices'];clips['idle']={**old,'frames':4,'indices':[poses[k%len(poses)] for k in range(4)],'fps':4,'reusedFrom':'original idle poses; four timing beats for cosmetic hover, not four new drawings'}
  if profile=='coil':
   old=baseline['monsters'][ident]['directions'][face];indices=[old['idle']['indices'][0],old['attack']['indices'][0],old['attack']['indices'][1],old['attack']['indices'][0]]
   clips['move']={**old['move'],'frames':4,'indices':indices,'fps':6,'reusedFrom':'original neutral / coil preparation / raised coil / preparation; no impact pose'}
 s['animations']=s['directions']['south']
# One uniform factor for the whole Sending attack, anchored at the same ground point.
s=data['monsters']['sending'];old=baseline['monsters']['sending'];cw,ch=s['frameWidth'],s['frameHeight'];im=Image.open(OUT/old['image']).convert('RGBA');factor=.85
for face,clips in old['directions'].items():
 for idx in clips['attack']['indices']:
  x=idx%8*cw;y=idx//8*ch;frame=im.crop((x,y,x+cw,y+ch));small=frame.resize((round(cw*factor),round(ch*factor)),Image.Resampling.NEAREST);out=Image.new('RGBA',(cw,ch));out.paste(small,(round(s['anchor']['x']*(1-factor)),round(s['anchor']['y']*(1-factor))));im.paste(out,(x,y))
s['image']='folklore-01/sending-r03.png';s['repairedActions']=['attack'];s['attackScaleRepair']={'factor':factor,'source':old['image'],'method':'uniform nearest-neighbor around unchanged anchor; all32 poses'};im.save(OUT/s['image'])
path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print('Applied18 movement profiles and uniform Sending attack scale; no gameplay coordinates changed')
