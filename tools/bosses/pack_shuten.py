from PIL import Image
from pathlib import Path
import json, shutil, sys
root=Path(__file__).resolve().parents[2]
src=Path(sys.argv[1]) if len(sys.argv)>1 else None
out=root/'apps/client/public/assets/monsters/shuten'; out.mkdir(parents=True,exist_ok=True)
archive=root/'docs/design/bosses/shuten-doji/sources/authored'; archive.mkdir(parents=True,exist_ok=True)
files={'armored':'f7bc65af-7638-481f-95a9-b1e0df11dd8b','frenzy':'75b12639-338e-432b-aff9-12f248a2b6d4','headless':'d0b39d1e-5b72-43ec-abbf-114297da2e27','head':'b8a42b25-9810-4c14-801c-ce866fce0815','elite':'27d15a97-a18d-43d0-9f29-b62a1b2df892','impact':'dab2532d-f6c2-4d89-9a95-cf88a9f473c0','violet':'abec9bbc-b883-4f37-a2dd-3381744ff3e4','sweep':'5ca52526-08ab-4cee-bc93-9843c9ff392a','breath':'eccec68d-be3c-475f-b057-4697ce9bdd69','fist':'5dfe0e9a-9705-4084-811c-97450c9c9560','props':'6f978334-521e-4b88-8e51-fd0c94d7cda8','armored-windup':'90c78042-f182-40c3-bd26-bf228faba21c','frenzy-windup':'24dceeb4-4d39-4783-884e-7b58fbdaa1d0','headless-windup':'d63b9316-edd2-4fcf-b1e5-d0eec61ce3ef','armored-strike':'e079e036-1559-4cf5-8340-19eb12de038d','frenzy-strike':'18192801-d6b4-49ea-aaa9-9ea9bcc09088','headless-strike':'0aaa58b6-b641-4115-8fe3-e025fc13a4f8'}
faces=['south','south-east','east','north-east','north','north-west','west','south-west']
manifest={}
for name,uid in files.items():
 p=archive/(name+'.png')
 if src: shutil.copy2(src/('exec-'+uid+'.png'),p)
 im=Image.open(p).convert('RGBA'); w,h=im.size
 # Pack authored cells without repainting. Shared cell boundaries preserve directional scale.
 atlas=Image.new('RGBA',(256*4,256*2))
 for i in range(8):
  tile=im.crop((round(i%4*w/4),round(i//4*h/2),round((i%4+1)*w/4),round((i//4+1)*h/2)))
  if name in ['armored','frenzy','headless','head','elite','props'] or '-windup' in name or '-strike' in name:
   box=tile.getbbox()
   if box: tile=tile.crop(box)
   maxsize=(224,190 if name=='headless' else 220) if name!='head' else (190,170)
   tile.thumbnail(maxsize,Image.Resampling.NEAREST)
   atlas.alpha_composite(tile,(i%4*256+(256-tile.width)//2,i//4*256+240-tile.height))
  else:
   tile=tile.resize((256,256),Image.Resampling.NEAREST); atlas.alpha_composite(tile,(i%4*256,i//4*256))
 atlas.save(out/(name+'.png'))
 if name in ['armored','head','elite']:
  def clip(i,loop): return {'row':i//4,'frames':1,'indices':[i],'fps':4,'loop':loop}
  dirs={f:{a:clip(i,a in ['idle','move']) for a in ['idle','move','attack','hurt','death']} for i,f in enumerate(faces)}
  kind={'armored':'shuten-doji','head':'shuten-head','elite':'oe-elite-oni'}[name]
  manifest[kind]={'image':'shuten/'+name+'.png','frameWidth':256,'frameHeight':256,'columns':4,'anchor':{'x':128,'y':240},'scale':.92 if name=='armored' else .42 if name=='elite' else .48,'animations':dirs['south'],'directions':dirs}
for kind,index in [('shuten-altar',0),('shuten-drum',1)]:
 dirs={f:{a:{'row':0,'frames':1,'indices':[index],'fps':1,'loop':a in ['idle','move']} for a in ['idle','move','attack','hurt','death']} for f in faces}
 manifest[kind]={'image':'shuten/props.png','frameWidth':256,'frameHeight':256,'columns':4,'anchor':{'x':128,'y':240},'scale':.38,'animations':dirs['south'],'directions':dirs}
(out/'manifest.json').write_text(json.dumps({'monsters':manifest},indent=2))
p=root/'apps/client/public/assets/monsters/manifest.json'; data=json.loads(p.read_text());data['monsters'].update(manifest);p.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
print('Packed',len(files),'authored sheets;',len(manifest),'actor bindings')
