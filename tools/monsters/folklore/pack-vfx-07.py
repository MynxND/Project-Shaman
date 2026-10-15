from PIL import Image
from pathlib import Path
import json, hashlib
base=Path('docs/design/monsters/folklore-01/vfx-07');out=Path('apps/client/public/assets/monsters/vfx-07');faces=['south','south-east','east','north-east','north','north-west','west','south-west'];angles=[-90,-45,0,45,90,135,180,-135];meta={}
for style in ['frost','water','curse']:
 p=base/'sources'/f'{style}.png';im=Image.open(p).convert('RGBA');w,h=im.size;assert abs(w/h-2)<.02
 atlas=Image.new('RGBA',(160*8,160*8));
 for i in range(8):
  frame=im.crop(((i%4)*w//4,(i//4)*h//2,(i%4+1)*w//4,(i//4+1)*h//2)).resize((128,128),Image.Resampling.NEAREST);cell=Image.new('RGBA',(160,160));cell.alpha_composite(frame,(16,16))
  for j,angle in enumerate(angles):atlas.alpha_composite(cell.rotate(angle,resample=Image.Resampling.NEAREST),(i*160,j*160))
 atlas.save(out/f'{style}.png');meta[style]={'sourceDimensions':[w,h],'sourceSha256':hashlib.sha256(p.read_bytes()).hexdigest(),'frameWidth':160,'frameHeight':160,'framesPerDirection':8,'directions':faces,'flightFrames':[0,1,2,3],'impactFrames':[4,5,6,7],'notes':'Packing only: preserve RGBA, nearest scaling, baked eight rotations, no recoloring. Directional emission anchors remain separately measured from monster art.'}
(out/'manifest.json').write_text(json.dumps(meta,indent=2)+'\n',encoding='utf-8');(base/'packing.json').write_text(json.dumps(meta,indent=2)+'\n',encoding='utf-8');print('Packed3 original VFX assets x8 frames x8 directions; transparent native alpha retained')
