from pathlib import Path
from PIL import Image
import json,hashlib
root=Path(__file__).resolve().parents[2];base=root/'apps/client/public/assets/monsters/shuten';count=0
for p in base.glob('*.png'):
 im=Image.open(p);assert im.mode=='RGBA' and im.size==(1024,512),p.name
 assert im.getchannel('A').getextrema()==(0,255),p.name
 hashes=set()
 for i in range(8):
  cell=im.crop((i%4*256,i//4*256,(i%4+1)*256,(i//4+1)*256));assert cell.getbbox(),(p.name,i);hashes.add(hashlib.sha256(cell.tobytes()).hexdigest());count+=1
 assert len(hashes)==8,p.name+' duplicate cells'
m=json.loads((base/'manifest.json').read_text())['monsters'];assert len(m)==5
for kind,s in m.items():
 assert len(s['directions'])==8
 for face,clips in s['directions'].items():
  for action,clip in clips.items():
   assert len(clip['indices'])==clip['frames'] and all(0<=f<8 for f in clip['indices'])
   if action in ['attack','death']:assert not clip['loop']
 assert s['anchor']=={'x':128,'y':240}
print('PASS',count,'RGBA atlas cells, five actor manifests, all8 directions/actions/anchors')
