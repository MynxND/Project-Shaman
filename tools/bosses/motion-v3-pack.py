"""Review-only atlas extraction. Original ImageGen pixels stay immutable; no invented poses."""
from pathlib import Path
import json,hashlib
from PIL import Image
root=Path(__file__).resolve().parents[2]
source=root/'docs/design/bosses/motion-identity-v3/koschei/walk-east-01.png'
im=Image.open(source).convert('RGBA');frames=[];bounds=[]
for row in range(4):
 for col in range(4):
  cell=im.crop((round(col*im.width/4),round(row*im.height/4),round((col+1)*im.width/4),round((row+1)*im.height/4)))
  b=cell.getchannel('A').point(lambda a:255 if a>24 else 0).getbbox()
  if not b:raise ValueError('Empty generated frame')
  frames.append(cell);bounds.append(b)
scale=min(226/max(b[2]-b[0] for b in bounds),226/max(b[3]-b[1] for b in bounds));native=[]
for cell,b in zip(frames,bounds):
 crop=cell.crop(b);crop=crop.resize((round(crop.width*scale),round(crop.height*scale)),Image.Resampling.NEAREST)
 dst=Image.new('RGBA',(240,240));dst.alpha_composite(crop,((240-crop.width)//2,232-crop.height));native.append(dst)
out=root/'apps/client/public/boss-review/motion-v3';out.mkdir(parents=True,exist_ok=True)
sheet=Image.new('RGBA',(960,960))
for i,frame in enumerate(native):sheet.alpha_composite(frame,(i%4*240,i//4*240))
sheet.save(out/'koschei-walk-east.png')
gif=[]
for frame in native:
 bg=Image.new('RGBA',(240,240),'#14231f');bg.alpha_composite(frame);gif.append(bg.convert('RGB'))
gif[0].save(out/'koschei-walk-east.gif',save_all=True,append_images=gif[1:],duration=100,loop=0)
(out/'koschei-walk-east.json').write_text(json.dumps({'status':'unapproved candidate, not runtime','source':str(source.relative_to(root)).replace('\\','/'),'frames':16,'uniquePackedFrames':len(set(hashlib.sha256(f.tobytes()).hexdigest() for f in native)),'scale':scale,'bounds':bounds,'frameMs':100,'groundAnchor':[120,232]},indent=2))
print(out)
