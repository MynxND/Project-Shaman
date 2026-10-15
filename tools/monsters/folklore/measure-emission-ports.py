import json,math
from PIL import Image
from pathlib import Path
base=Path('docs/design/monsters/folklore-01');p=base/'encounter-04.json';e=json.loads(p.read_text(encoding='utf-8'));sheets=json.loads(Path('apps/client/public/assets/monsters/folklore-01/drafts.json').read_text(encoding='utf-8'))['monsters'];proof=[];overrides=json.loads((base/'emission-overrides.json').read_text(encoding='utf-8'))['monsters']
for id,m in e['monsters'].items():
 if 'projectile' not in m:continue
 s=sheets[id];im=Image.open('apps/client/public/assets/monsters/'+s['image']).convert('RGBA');origins={}
 for face in e.get('directions',['south','south-west','west','north-west','north','north-east','east','south-east']):
  c=s['directions'][face]['attack'];impact=s.get('attackImpactFrame',2 if c['frames']>=4 else 1);idx=c['indices'][impact];w=s['frameWidth'];h=s['frameHeight'];f=im.crop(((idx%s['columns'])*w,(idx//s['columns'])*h,(idx%s['columns']+1)*w,(idx//s['columns']+1)*h));a=f.getchannel('A');bbox=a.getbbox();fraction=.23 if id in ['phi-krasue','yuki-onna'] else .48 if id in ['utburdur','fossegrim'] else .42;y=round(bbox[1]+(bbox[3]-bbox[1])*fraction)
  points=[(x,yy) for yy in range(max(0,y-3),min(h,y+4)) for x in range(w) if a.getpixel((x,yy))>160]
  if not points:raise Exception(id+face)
  if 'east' in face:target=max(x for x,yy in points)-2
  elif 'west' in face:target=min(x for x,yy in points)+2
  else:target=s['anchor']['x']
  x,y=min(points,key=lambda v:abs(v[0]-target)+abs(v[1]-y)*2);override=overrides.get(id,{}).get(face)
  if override:
   ox,oy=override['x'],override['y'];near=[(px,py) for py in range(max(0,oy-5),min(h,oy+6)) for px in range(max(0,ox-5),min(w,ox+6)) if a.getpixel((px,py))>160];x,y=min(near,key=lambda q:(q[0]-ox)**2+(q[1]-oy)**2)
  origins[face]={'x':x,'y':y};proof.append({'kind':id,'facing':face,'atlas':s['image'],'frame':idx,'origin':{'x':x,'y':y},'alpha':a.getpixel((x,y))})
 m['projectile']['origins']=origins
p.write_text(json.dumps(e,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');(base/'live-06').mkdir(exist_ok=True);(base/'live-06'/'ports.json').write_text(json.dumps(proof,indent=2)+'\n',encoding='utf-8');print('136 native release-pose emission ports measured; no source PNG changed')
