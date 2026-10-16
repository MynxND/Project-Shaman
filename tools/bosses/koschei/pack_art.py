"""Pack authored source pixels only. Retain originals; no invented motion frames."""
from pathlib import Path
from PIL import Image
import json,hashlib
from collections import deque
ROOT=Path(__file__).resolve().parents[3]
ART=ROOT/'apps/client/public/assets/boss/koschei';SOURCE=ART/'source'
FACES=['south','south-west','west','north-west','north','north-east','east','south-east']
SKILLS=['gravefrost-spear','deathly-chains','necropolis-guard','soul-lance','immortal-rebirth','cursed-needle','royal-necromancy','deathstorm','throne-of-bones','soul-severance','the-last-needle']
def cells(im,cols,rows):
 return [im.crop((round(x*im.width/cols),round(y*im.height/rows),round((x+1)*im.width/cols),round((y+1)*im.height/rows))) for y in range(rows) for x in range(cols)]
def trimmed(c):
 box=c.getchannel('A').point(lambda a:255 if a>24 else 0).getbbox()
 return c.crop(box) if box else c
def measured_eight_cells(im):
    """Measured irregular source rows, not a nominal equal grid. Keep each real pose.

    Connected opaque anatomy identifies32 isolated sprites. Nearest-component
    ownership retains their original antialiased edge/loose ornament pixels while
    excluding the adjacent row's crown. No pose or motion pixels are synthesized.
    """
    w,h=im.size;alpha=im.getchannel('A').tobytes();seen=bytearray(w*h);major=[]
    for i,v in enumerate(alpha):
        if v<=32 or seen[i]:continue
        q=deque([i]);seen[i]=1;pixels=[];x0=w;y0=h;x1=0;y1=0
        while q:
            k=q.popleft();x=k%w;y=k//w;pixels.append(k);x0=min(x0,x);y0=min(y0,y);x1=max(x1,x);y1=max(y1,y)
            for nx,ny in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
                if 0<=nx<w and 0<=ny<h:
                    n=ny*w+nx
                    if not seen[n] and alpha[n]>32:seen[n]=1;q.append(n)
        if len(pixels)>1000:major.append({'pixels':pixels,'box':[x0,y0,x1+1,y1+1]})
    assert len(major)==8, 'Re-inspect cast source: expected8 authored body islands'
    centers=[im.height*.25,im.height*.75]
    rows=[[] for _ in centers]
    for c in major:
        y=(c['box'][1]+c['box'][3])/2;row=min(range(2),key=lambda r:abs(centers[r]-y));rows[row].append(c)
    assert all(len(row)==4 for row in rows)
    ordered=[c for row in rows for c in sorted(row,key=lambda c:c['box'][0])]
    owner=bytearray(w*h);q=deque()
    for label,c in enumerate(ordered,1):
        for i in c['pixels']:owner[i]=label;q.append(i)
    while q:
        i=q.popleft();x=i%w;y=i//w
        for nx,ny in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
            if 0<=nx<w and 0<=ny<h:
                n=ny*w+nx
                if not owner[n]:owner[n]=owner[i];q.append(n)
    buffers=[bytearray(w*h*4) for _ in ordered];rgba=im.tobytes()
    for i,a in enumerate(alpha):
        if a:buffers[owner[i]-1][i*4:i*4+4]=rgba[i*4:i*4+4]
    result=[]
    for data in buffers:
        frame=Image.frombytes('RGBA',(w,h),bytes(data));box=frame.getchannel('A').getbbox();result.append(frame.crop(box))
    return result,[c['box'] for c in ordered]

def pack(cs,cols=4,actor=False):
 out=Image.new('RGBA',(cols*256,((len(cs)+cols-1)//cols)*256))
 cropped=[trimmed(c) for c in cs] if actor else [c.copy() for c in cs]
 scale=min(min(224/c.width,240/c.height) for c in cropped) if actor else None
 for i,c in enumerate(cropped):
  if actor:c=c.resize((max(1,round(c.width*scale)),max(1,round(c.height*scale))),Image.Resampling.NEAREST)
  else:c.thumbnail((232,232),Image.Resampling.NEAREST)
  out.alpha_composite(c,(i%cols*256+(256-c.width)//2,i//cols*256+(248-c.height if actor else (256-c.height)//2)))
 return out
idlecs=cells(Image.open(SOURCE/'idle-eight-v2.png').convert('RGBA'),4,2)
releasecs,release_boxes=measured_eight_cells(Image.open(SOURCE/'release-eight.png').convert('RGBA'))
idle=pack(idlecs,actor=True);idle.save(ART/'idle-eight.png')
# Rejected32-pose source turns some casts to the wrong direction. Only explicit
# eight-facing release source is adopted; later authored windup may replace idle.
windupcs=cells(Image.open(SOURCE/'windup-eight.png').convert('RGBA'),4,2) if (SOURCE/'windup-eight.png').exists() else idlecs
castcs=[c for i in range(8) for c in [idlecs[i],windupcs[i],releasecs[i],idlecs[i]]]
cast=pack(castcs,actor=True);cast.save(ART/'cast-directions.png')
# Measure source ports in each actual authored pose, not a guessed compass offset.
ports={}
for i,face in enumerate(FACES):
 ports[face]={}
 for beat,label in enumerate(['idle','windup','release']):
  c=cells(cast,4,8)[i*4+beat];px=c.load();left={(x,y) for y in range(256) for x in range(256) if px[x,y][3]>64 and px[x,y][1]>120 and px[x,y][2]>150 and px[x,y][2]-px[x,y][0]>30};groups=[]
  while left:
   seed=left.pop();group=[seed];queue=[seed]
   while queue:
    x,y=queue.pop()
    for n in [(x-1,y),(x+1,y),(x,y-1),(x,y+1)]:
     if n in left:left.remove(n);queue.append(n);group.append(n)
   groups.append(group)
  assert groups,'missing cyan staff flame '+face
  g=max(groups,key=len);ports[face][label]={'x':round(sum(x for x,y in g)/len(g)-128,2),'y':round(sum(y for x,y in g)/len(g)-248,2),'pixels':len(g),'frame':8+i*4+beat}
(ART/'ports.json').write_text(json.dumps({'anchor':[128,248],'actorScale':.9,'method':'largest connected bright cyan flame in each authored idle/windup/release pose; relative pixels, not gameplay geometry','ports':ports},indent=2)+'\n',encoding='utf-8')

deathcs=cells(Image.open(SOURCE/'death.png').convert('RGBA'),4,2) if (SOURCE/'death.png').exists() else idlecs
death=pack(deathcs,actor=True);death.save(ART/'death.png')
runtime=Image.new('RGBA',(2048,1536))
for i,c in enumerate(cells(idle,4,2)+cells(cast,4,8)+cells(death,4,2)):runtime.alpha_composite(c,(i%8*256,i//8*256))
runtime.save(ART/'actor.png')
for k in SKILLS:
 if (SOURCE/(k+'.png')).exists():pack(cells(Image.open(SOURCE/(k+'.png')).convert('RGBA'),4,2)).save(ART/(k+'.png'))
kit=Image.open(SOURCE/'relic-kit.png').convert('RGBA')
for name,c in zip(['oak','chest','hare','duck','egg','needle'],cells(kit,3,2)):trimmed(c).save(ART/(name+'.png'))
kit=Image.open(SOURCE/'crypt-kit.png').convert('RGBA')
assert kit.size==(1223,1286),'Remeasure crypt kit for new source'
# Source facade crosses the nominal row midpoint: measured modules, not grid cuts.
cryptcuts={'crypt':(0,0,790,750),'tomb':(790,250,1223,790),'stone':(65,775,560,1265),'mist':(590,800,1223,1286)}
for name,box in cryptcuts.items():
 c=kit.crop(box)
 (c if name=='stone' else trimmed(c)).save(ART/(name+'.png'))
c=trimmed(Image.open(ART/'needle.png').convert('RGBA'));c.thumbnail((140,200),Image.Resampling.NEAREST)
n=Image.new('RGBA',(256,256));n.alpha_composite(c,((256-c.width)//2,248-c.height));n.save(ART/'needle-actor.png')
p=ROOT/'apps/client/public/assets/monsters/manifest.json';m=json.loads(p.read_text(encoding='utf-8'))
def clip(indices,fps=8,loop=False):return dict(row=0,frames=len(indices),fps=fps,loop=loop,indices=indices)
directions={f:{'idle':clip([i],4,True),'move':clip([i],4,True),'attack':clip(list(range(8+i*4,12+i*4)),6),'hurt':clip([i],8),'death':clip(list(range(40,48)),7)} for i,f in enumerate(FACES)}
m['monsters']['koschei']=dict(image='../boss/koschei/actor.png',frameWidth=256,frameHeight=256,columns=8,anchor={'x':128,'y':248},scale=.9,animations=directions['south'],directions=directions,attackImpactFrame=2)
m['monsters']['koschei-needle']=dict(image='../boss/koschei/needle-actor.png',frameWidth=256,frameHeight=256,columns=1,anchor={'x':128,'y':248},scale=.4,animations={a:clip([0],4,a in ['idle','move']) for a in ['idle','move','attack','hurt','death']})
p.write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
receipt={'generator':'ImageGen built-in','faces':FACES,'cryptCuts':cryptcuts,'releaseBodyBoxes':release_boxes,'casting':'idle, authored windup (if supplied), explicit directional release, idle recovery; no interpolated artwork','rejected':['idle-eight.png wrong rear view','cast-directions.png release faces wrong direction'],'assets':[]}
for p in sorted(ART.rglob('*.png')):receipt['assets'].append({'path':p.relative_to(ROOT).as_posix(),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'size':list(Image.open(p).size)})
(ART/'manifest.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Packed',len(receipt['assets']),'retained-source/runtime PNGs')
