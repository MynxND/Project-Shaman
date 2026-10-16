from pathlib import Path
from PIL import Image
import hashlib,json
root=Path(__file__).resolve().parents[2]
folder=root/'apps/client/public/assets/vfx/boss/shuten-complete'
manifest=json.loads((folder/'manifest.json').read_text())
count=0
for name,item in manifest['atlases'].items():
    file=folder/f'{name}.png';im=Image.open(file)
    assert im.mode=='RGBA'
    assert hashlib.sha256(file.read_bytes()).hexdigest()==item['sha256']
    assert hashlib.sha256((root/item['source']).read_bytes()).hexdigest()==item['sourceSha256']
    hashes=set()
    for i in range(item['frames']):
        cell=im.crop(((i%4)*256,(i//4)*256,(i%4+1)*256,(i//4+1)*256))
        lo,hi=cell.getchannel('A').getextrema();assert lo<8 and hi>30,(name,i)
        hashes.add(hashlib.sha256(cell.tobytes()).hexdigest());count+=1
    assert len(hashes)==item['frames'],f'Duplicate frames {name}'
assert count==176
print('PASS 176 distinct transparent cells, 12 atlas hashes and original-source provenance')
