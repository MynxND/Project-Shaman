"""Pack original ImageGen cells without repainting; preserve true alpha and provenance."""
from PIL import Image
from pathlib import Path
import hashlib
import json
root=Path(__file__).resolve().parents[2]
source=root/'docs/design/bosses/shuten-doji/vfx-stomp-v2/source.png'
im=Image.open(source).convert('RGBA')
out=Image.new('RGBA',(1024,1024))
for i in range(16):
    x,y=i%4,i//4
    cell=im.crop((x*im.width//4,y*im.height//4,(x+1)*im.width//4,(y+1)*im.height//4))
    out.paste(cell.resize((256,256),Image.Resampling.NEAREST),(x*256,y*256))
assert out.getextrema()[3][0]==0 and out.getextrema()[3][1]==255
for i in range(16):
    cell=out.crop(((i%4)*256,(i//4)*256,(i%4+1)*256,(i//4+1)*256))
    lo,hi=cell.getchannel('A').getextrema()
    assert lo==0 and hi>0, f'Cell {i} must contain art and true transparency'
dest=root/'apps/client/public/assets/vfx/boss/stomp-v2/layers.png'
out.save(dest)
(dest.parent/'manifest.json').write_text(json.dumps({
    'provider':'built-in ImageGen','status':'temporary-review-artwork',
    'job':'exec-71eb5245-70a3-4feb-a8c8-65daf5c3f1e3',
    'source':'docs/design/bosses/shuten-doji/vfx-stomp-v2/source.png',
    'prompt':'docs/design/bosses/shuten-doji/vfx-stomp-v2/prompt.txt',
    'sourceSize':list(im.size),'size':[1024,1024],'cell':[256,256],
    'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),
    'packedSha256':hashlib.sha256(dest.read_bytes()).hexdigest(),
    'sampling':'nearest','alpha':'original preserved',
    'frames':{'wave':[0,1,2,3],'smoke':[4,5,6,7],'impactCandidatesUnused':[8,9,10,11],'scar':12,'ember':13,'basalt':14,'flame':15},
},indent=2)+'\n',encoding='utf-8')
print('Packed 16 RGBA cells; no background removal or painted procedural substitutes.')
