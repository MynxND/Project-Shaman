"""Pack owned ImageGen sources; preserve original PNGs and measured native dimensions.
Missing directions are marked temporary during the first proof, never approved motion.
"""
from pathlib import Path
from PIL import Image,ImageDraw
import json,hashlib
from collections import deque
ROOT=Path(__file__).resolve().parents[3]
SRC=ROOT/'docs/design/bosses/calon-arang/sources'
OUT=ROOT/'apps/client/public/assets/boss/calon-arang';OUT.mkdir(parents=True,exist_ok=True)
FACES=['south','south-west','west','north-west','north','north-east','east','south-east']
CELL=240;ANCHOR=[120,232]
def cells(path,cols,rows):
 im=Image.open(path).convert('RGBA');return [im.crop((round(x*im.width/cols),round(y*im.height/rows),round((x+1)*im.width/cols),round((y+1)*im.height/rows))) for y in range(rows) for x in range(cols)]
def box(im):return im.getchannel('A').point(lambda a:255 if a>12 else 0).getbbox()

def clean_actor(im):
 # Measured atlas-cell residue: retain the body and detached details within its bounds.
 # Neighboring-cell shoe/hair slivers outside the main silhouette must not float over the head.
 w,h=im.size;a=im.getchannel('A').tobytes();seen=bytearray(w*h);groups=[]
 for i,v in enumerate(a):
  if v<32 or seen[i]:continue
  seen[i]=1;q=[i];g=[]
  while q:
   j=q.pop();g.append(j);x=j%w;y=j//w
   for k in ([j-1] if x else [])+([j+1] if x+1<w else [])+([j-w] if y else [])+([j+w] if y+1<h else []):
    if a[k]>=32 and not seen[k]:seen[k]=1;q.append(k)
  groups.append(g)
 if not groups:return im
 main=max(groups,key=len);xs=[i%w for i in main];ys=[i//w for i in main];b=(min(xs)-3,min(ys)-3,max(xs)+3,max(ys)+3)
 alpha=bytearray(a)
 for y in range(h):
  for x in range(w):
   if x<b[0] or y<b[1] or x>b[2] or y>b[3]:alpha[y*w+x]=0
 im.putalpha(Image.frombytes('L',(w,h),bytes(alpha)));return im
def actor_group(frames):
 frames=[clean_actor(im) for im in frames]
 # One physical scale per action, enclosing every pose; never resize each pose independently.
 bounds=[box(im) for im in frames];scale=min(222/max(1,max(b[3]-b[1] for b in bounds)),224/max(1,max(b[2]-b[0] for b in bounds)));out=[]
 for im in frames:
  b=box(im);c=im.crop(b);c=c.resize((max(1,round(c.width*scale)),max(1,round(c.height*scale))),Image.Resampling.NEAREST)
  canvas=Image.new('RGBA',(CELL,CELL));canvas.alpha_composite(c,((CELL-c.width)//2,ANCHOR[1]-c.height));out.append(canvas)
 return out
idle=actor_group(cells(SRC/'idle-eight.png',4,2));walk=[];cast=[];missing=[]
for i,face in enumerate(FACES):
 for action,target in [('walk',walk),('cast',cast)]:
  path=SRC/f'{action}-{face}.png'
  if (SRC/f'{action}-{face}-v2.png').exists():path=SRC/f'{action}-{face}-v2.png'
  if path.exists():target.extend(actor_group(cells(path,4,4)))
  else:target.extend([idle[i]]*16);missing.append(action+':'+face)
death=actor_group(cells(SRC/'death.png',4,2))
allframes=idle+walk+cast+death
sheet=Image.new('RGBA',(CELL*16,CELL*17))
for i,im in enumerate(allframes):sheet.alpha_composite(im,(i%16*CELL,i//16*CELL))
sheet.save(OUT/'actor.png')
for name,frames,cols in [('idle-eight',idle,4),('walk-south',walk[:16],4),('cast-south',cast[:16],4)]:
 im=Image.new('RGBA',(cols*CELL,((len(frames)+cols-1)//cols)*CELL))
 for i,c in enumerate(frames):im.alpha_composite(c,(i%cols*CELL,i//cols*CELL))
 im.save(OUT/(name+'.png'))
skills=json.loads((SRC.parent/'design.json').read_text());materials={}
for k,*_ in skills:
 path=SRC/('plague-bloom-v2.png' if k=='plague-bloom' else k+'.png')
 if not path.exists():continue
 frames=cells(path,4,4);dest=Image.new('RGBA',(1024,1024))
 # Fixed frame canvas preserves authored growth/decay; no per-frame max-fill normalization.
 for i,c in enumerate(frames):dest.alpha_composite(c.resize((256,256),Image.Resampling.NEAREST),(i%4*256,i//4*256))
 dest.save(OUT/(k+'.png'));materials[k]={'frames':16,'width':256,'height':256,'source':path.name}
def own_prop(im):
 # Separate neighboring atlas props by measured opaque connected components.
 # Small detached petals inherit the nearest large component; original source is untouched.
 w,h=im.size;a=im.getchannel('A').tobytes();seen=bytearray(w*h);groups=[]
 for i,v in enumerate(a):
  if v<80 or seen[i]:continue
  seen[i]=1;q=[i];group=[]
  while q:
   j=q.pop();group.append(j);x=j%w;y=j//w
   for k in ([j-1] if x else [])+([j+1] if x+1<w else [])+([j-w] if y else [])+([j+w] if y+1<h else []):
    if a[k]>=80 and not seen[k]:seen[k]=1;q.append(k)
  if len(group)>2000:groups.append(group)
 if len(groups)<2:return im
 groups.sort(key=len,reverse=True);owner=bytearray(w*h);q=deque()
 for label,g in enumerate(groups,1):
  for i in g:owner[i]=label;q.append(i)
 while q:
  j=q.popleft();x=j%w;y=j//w
  for k in ([j-1] if x else [])+([j+1] if x+1<w else [])+([j-w] if y else [])+([j+w] if y+1<h else []):
   if not owner[k]:owner[k]=owner[j];q.append(k)
 data=bytearray(im.tobytes())
 for i,label in enumerate(owner):
  if label!=1:data[i*4+3]=0
 return Image.frombytes('RGBA',(w,h),bytes(data))
props=Image.open(SRC/'props.png').convert('RGBA')
for name,b in {'temple':[0,0,970,550],'effigy':[1000,0,1390,555],'well':[0,555,680,1024],'source':[680,475,1536,1024]}.items():
 c=props.crop(b)
 # Measured atlas-neighbor cutouts: detached neighboring props are not part of these assets.
 alpha=c.getchannel('A');draw=ImageDraw.Draw(alpha)
 if name=='effigy':draw.polygon([(0,400),(75,555),(0,555)],fill=0)
 if name=='source':
  draw.rectangle((0,0,290,90),fill=0);draw.rectangle((470,0,856,80),fill=0)
 c.putalpha(alpha);c=own_prop(c) if name in ['effigy','source'] else c;c=c.crop(box(c));c.save(OUT/(name+'.png'))
manifest_path=ROOT/'apps/client/public/assets/monsters/manifest.json';manifest=json.loads(manifest_path.read_text())
directions={}
for i,f in enumerate(FACES):
 directions[f]={a:{'row':0,'frames':len(ix),'fps':fps,'loop':loop,'indices':ix} for a,ix,fps,loop in [('idle',[i],4,True),('move',list(range(8+i*16,24+i*16)),18,True),('attack',list(range(136+i*16,152+i*16)),12,False),('hurt',[i],4,False),('death',list(range(264,272)),12,False)]}
base={'image':'../boss/calon-arang/actor.png','frameWidth':CELL,'frameHeight':CELL,'columns':16,'anchor':{'x':120,'y':232},'scale':.95,'attackImpactFrame':10,'animations':directions['south'],'directions':directions}
manifest['monsters']['calon-arang']=base
obj={'image':'../boss/calon-arang/effigy.png','frameWidth':1,'frameHeight':1,'columns':1,'anchor':{'x':0,'y':0},'animations':{}}
eff=Image.open(OUT/'effigy.png');obj.update(frameWidth=eff.width,frameHeight=eff.height,anchor={'x':eff.width//2,'y':eff.height-1},scale=.23)
obj['animations']={a:{'row':0,'frames':1,'fps':4,'loop':a in ['idle','move']} for a in ['idle','move','attack','hurt','death']};manifest['monsters']['calon-effigy']=obj
manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
report={'generator':'ImageGen built-in','nativeCell':CELL,'anchor':ANCHOR,'faces':FACES,'walkFrames':16,'castFrames':16,'releaseFrame':10,'deathFrames':8,'deathFacing':'south-east shared','temporaryMissingDirections':missing,'materials':materials,'sourceSha256':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in SRC.glob('*.png')}}
(OUT/'manifest.json').write_text(json.dumps(report,indent=2)+'\n')
print('Packed Calon; temporary missing',len(missing),'materials',len(materials))
