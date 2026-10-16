from pathlib import Path
from PIL import Image
import hashlib, json
root=Path(__file__).resolve().parents[3]
art=root/'apps/client/public/assets/boss/maiyarap'
manifest=json.loads((art/'manifest.json').read_text(encoding='utf-8'))
checks=0
rows=[]
for name in ['sleep-enchantment','underworld-chains','phantom-doppelganger','patal-gate','dream-theft','false-awakening','nightmare-passage','lucid-seal','underworld-court','sleepwalker-hunt','eternal-slumber']:
    im=Image.open(art/(name+'.png')).convert('RGBA')
    assert im.size==(1024,512)
    hashes=[]
    for i in range(8):
        c=im.crop((i%4*256,i//4*256,i%4*256+256,i//4*256+256))
        assert c.getchannel('A').getbbox()
        assert c.getchannel('A').getextrema()[0]==0
        hashes.append(hashlib.sha256(c.tobytes()).hexdigest());checks+=2
    assert len(set(hashes))==8;checks+=1
    rows.append({'skill':name,'authoredFrames':8,'uniquePixelFrames':8,'rgba':True})
for item in manifest['assets']:
    p=root/item['path'];assert hashlib.sha256(p.read_bytes()).hexdigest()==item['sha256'];checks+=1
out=root/'docs/design/bosses/maiyarap/evidence/art.json'
out.write_text(json.dumps({'checks':checks,'result':'pass','limits':'pixel uniqueness is not chronology or visual approval; source and runtime inspected separately','clips':rows},indent=2)+'\n',encoding='utf-8')
print('PASS',checks,'PNG/alpha/dimension/source-integrity checks')
