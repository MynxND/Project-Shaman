"""Pack authored material frames; no synthesized artwork or alpha removal."""
from PIL import Image
from pathlib import Path
import json, hashlib
base=Path('docs/design/monsters/folklore-01/vfx-08')
out=Path('apps/client/public/assets/monsters/vfx-08'); out.mkdir(parents=True,exist_ok=True)
faces=['south','south-east','east','north-east','north','north-west','west','south-west']
meta={}
for asset in json.loads((base/'prompts.json').read_text(encoding='utf-8'))['assets']:
 p=base/asset['file'];im=Image.open(p).convert('RGBA');w,h=im.size
 assert abs(w/h-2)<.02 and im.getextrema()[3][0]==0
 atlas=Image.new('RGBA',(1280,1280))
 for i in range(8):
  #112px square fits inside160px even at45 degrees, preserving diagonal tips.
  frame=im.crop(((i%4)*w//4,(i//4)*h//2,(i%4+1)*w//4,(i//4+1)*h//2)).resize((112,112),Image.Resampling.NEAREST)
  assert frame.getbbox() is not None
  cell=Image.new('RGBA',(160,160));cell.alpha_composite(frame,(24,24))
  for j,angle in enumerate([-90,-45,0,45,90,135,180,-135]):
   rotated=cell.rotate(angle,resample=Image.Resampling.NEAREST)
   assert not rotated.getchannel('A').crop((0,0,160,1)).getbbox(),'clipped top'
   atlas.alpha_composite(rotated,(i*160,j*160))
 atlas.save(out/(asset['kind']+'.png'))
 meta[asset['kind']]={'sourceDimensions':[w,h],'sourceSha256':hashlib.sha256(p.read_bytes()).hexdigest(),'frameWidth':160,'frameHeight':160,'framesPerDirection':8,'directions':faces,'flightFrames':[0,1,2,3],'impactFrames':[4,5,6,7],'materialSize':112,'tipRadius':56,'notes':'Original alpha retained; nearest sampling; padded baked rotations. Effect orientations are not independently generated character frames.'}
(out/'manifest.json').write_text(json.dumps(meta,indent=2)+'\n',encoding='utf-8')
(base/'packing.json').write_text(json.dumps(meta,indent=2)+'\n',encoding='utf-8')
print('Packed14 materials x8 frames x8 directions; transparent padded diagonal tips')
