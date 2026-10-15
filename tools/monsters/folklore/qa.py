"""Check atlas integrity and emit contact sheets for separate human visual inspection."""
import json,hashlib
from pathlib import Path
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[3];DOC=ROOT/'docs/design/monsters/folklore-01';OUT=ROOT/'apps/client/public/assets/monsters/folklore-01'
roster=json.loads((DOC/'roster.json').read_text(encoding='utf8'));drafts=json.loads((OUT/'drafts.json').read_text(encoding='utf8'))['monsters'];reports=json.loads((DOC/'packing.json').read_text(encoding='utf8'));assert len(drafts)==40
for r in reports:
 assert not r['sourceBorderWarnings'],r['id']
 assert hashlib.sha256((DOC/'raw'/r['id']/'source.png').read_bytes()).hexdigest()==r['sourceSha256']
for start in range(0,40,8):
 page=Image.new('RGB',(1024,1200),'#142725');draw=ImageDraw.Draw(page)
 for row,m in enumerate(roster['monsters'][start:start+8]):
  ident=m['id'];s=drafts[ident];im=Image.open(OUT.parent/s['image']);assert max(im.size)<=4096
  assert im.size==(s['frameWidth']*8,3840);assert im.getchannel('A').getextrema()[0]==0
  for face in roster['directions']:
   for action in ['idle','move','attack','hurt','death']:
    clip=s['directions'][face][action];assert clip['frames']==len(clip['indices'])
    for index in clip['indices']:
     x=index%8*s['frameWidth'];y=index//8*192;assert im.crop((x,y,x+s['frameWidth'],y+192)).getchannel('A').getbbox(),(ident,face,action,index)
  picks=[('move','south',0),('move','north',1),('move','east',2),('attack','south',1),('attack','east',1),('death','south',0),('death','south',-1),('death','north',-1)]
  draw.text((4,row*150+3),ident,fill='white')
  for col,(action,face,k) in enumerate(picks):
   clip=s['directions'][face][action];idx=clip['indices'][min(k,len(clip['indices'])-1)];x=idx%8*s['frameWidth'];y=idx//8*192
   frame=im.crop((x,y,x+s['frameWidth'],y+192));frame.thumbnail((124,120),Image.Resampling.NEAREST);page.paste(frame,(col*128+(128-frame.width)//2,row*150+18),frame)
   draw.text((col*128+3,row*150+137),action[:3]+' '+face[:2],fill='#cabc8a')
 page.save(DOC/('packed-contact-'+str(start//8+1)+'.png'))
print('PASS40 alpha atlases / eight views / all action indices / source hashes / source border checks')
