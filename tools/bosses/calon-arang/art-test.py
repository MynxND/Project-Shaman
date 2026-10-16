"""Validate exported bounds/alpha/real-frame coverage; never substitutes for visual approval."""
from pathlib import Path
from PIL import Image,ImageDraw
import hashlib,json
R=Path(__file__).resolve().parents[3];A=R/'apps/client/public/assets/boss/calon-arang';E=R/'docs/design/bosses/calon-arang/evidence';E.mkdir(exist_ok=True)
m=json.loads((A/'manifest.json').read_text());checks=0
def check(v,s):
 global checks
 assert v,s
 checks+=1
check(not m['temporaryMissingDirections'],'all eight walk/cast directions authored')
actor=Image.open(A/'actor.png').convert('RGBA');check(actor.size==(3840,4080),'bounded below4096 GPU atlas')
review=Image.new('RGBA',(8*240,9*240),(18,31,27,255));d=ImageDraw.Draw(review)
for action,start,row in [('walk',8,0),('cast',136,4)]:
 for face in range(8):
  hashes=set()
  for i in range(16):
   frame=start+face*16+i;c=actor.crop((frame%16*240,frame//16*240,(frame%16+1)*240,(frame//16+1)*240));b=c.getchannel('A').point(lambda a:255 if a>12 else 0).getbbox();check(b is not None,action+' alpha');check(b[0]>=0 and b[1]>0 and b[2]<=240 and b[3]<240,action+' in-cell bounds');hashes.add(hashlib.sha256(c.tobytes()).hexdigest())
   samples=[0,4,8,12] if action=='walk' else [0,5,10,15]
   if i in samples:review.alpha_composite(c,(face*240,(row+samples.index(i))*240))
  check(len(hashes)==16,action+' has16 nonduplicate poses '+m['faces'][face])
for i,face in enumerate(m['faces']):d.text((i*240+8,8),face,fill='#eed7a6')
review.save(E/'motion-contact-sheet.png')
for key in m['materials']:
 im=Image.open(A/(key+'.png')).convert('RGBA');check(im.size==(1024,1024),key+' atlas');hashes=set()
 for i in range(16):
  c=im.crop((i%4*256,i//4*256,(i%4+1)*256,(i//4+1)*256));check(c.getchannel('A').getextrema()[0]==0,key+' transparent');check(c.getchannel('A').getbbox() is not None,key+' present');hashes.add(hashlib.sha256(c.tobytes()).hexdigest())
 check(len(hashes)==16,key+'16 real frames')
check(len(m['materials'])==11,'all11 materials')
(E/'art.json').write_text(json.dumps({'checks':checks,'walkDirections':8,'castDirections':8,'actorFrames':272,'vfxMaterials':len(m['materials']),'status':'pass'},indent=2));print('PASS',checks,'art checks')
