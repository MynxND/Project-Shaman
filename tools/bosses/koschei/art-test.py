from pathlib import Path
from PIL import Image
import hashlib, json
root=Path(__file__).resolve().parents[3]
art=root/'apps/client/public/assets/boss/koschei'
manifest=json.loads((art/'manifest.json').read_text(encoding='utf-8'))
checks=0
rows=[]
for name in ['gravefrost-spear','deathly-chains','necropolis-guard','soul-lance','immortal-rebirth','cursed-needle','royal-necromancy','deathstorm','throne-of-bones','soul-severance','the-last-needle']:
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
ports=json.loads((art/'ports.json').read_text(encoding='utf-8'))['ports']
for face,p in ports.items():
    assert p['release']['pixels']>80,face+' missing staff flame component';checks+=1
for face in ['south-west','west','north-west']:
    assert ports[face]['release']['x'] < -40;checks+=1
for face in ['south-east','east','north-east']:
    assert ports[face]['release']['x'] > 40;checks+=1
assert ports['north']['release']['y'] < -190;checks+=1
assert ports['south']['release']['y'] > -70;checks+=1
out=root/'docs/design/bosses/koschei/evidence/art.json'
out.write_text(json.dumps({'checks':checks,'result':'pass','limits':'pixel uniqueness is not chronology or visual approval; source and runtime inspected separately','clips':rows},indent=2)+'\n',encoding='utf-8')
print('PASS',checks,'PNG/alpha/dimension/source-integrity checks')
