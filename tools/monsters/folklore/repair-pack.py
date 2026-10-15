"""Measured action replacement. Retain original alpha/colors; no painted or warped anatomy.
Preview by default; --publish installs only explicitly inspected/accepted action sources.
"""
import json,statistics,sys,hashlib
from pathlib import Path
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[3];DOC=ROOT/'docs/design/monsters/folklore-01';WORK=DOC/'repair-03';ASSET=ROOT/'apps/client/public/assets/monsters';OUT=ASSET/'folklore-01'
def read(p):return json.loads(p.read_text(encoding='utf8'))
def write(p,data):p.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
def bbox(im):return im.getchannel('A').point(lambda v:255 if v>40 else 0).getbbox()
def bands(im,count=8):
 a=im.getchannel('A');rows=[y for y in range(im.height) if sum(v>40 for v in a.crop((0,y,im.width,y+1)).get_flattened_data())>=8];groups=[]
 for y in rows:
  if not groups or y-groups[-1][-1]>3:groups.append([y])
  else:groups[-1].append(y)
 found=[(max(0,g[0]-2),min(im.height,g[-1]+3)) for g in groups if g[-1]-g[0]>20]
 if len(found)==count:return found
 # Some rows have only a few pixels of transparent gap. Find measured minima near each expected boundary.
 density=[sum(v>40 for v in a.crop((0,y,im.width,y+1)).get_flattened_data()) for y in range(im.height)]
 edges=[0]
 for i in range(1,count):
  target=i*im.height/count;reach=im.height/count*.3;cut=min(range(round(target-reach),round(target+reach)),key=lambda y:(density[y],abs(y-target)));assert density[cut]<=8,('No transparent row separation',i,cut,density[cut]);edges.append(cut)
 edges.append(im.height);return [(edges[i],edges[i+1]) for i in range(count)]
drafts=read(OUT/'drafts.json');baseline=read(WORK/'baseline.json');profiles=read(WORK/'sources.json');reports=[]
for ident,actions in profiles.items():
 if '--only' in sys.argv and ident not in sys.argv[sys.argv.index('--only')+1].split(','):continue
 sheet=baseline['monsters'][ident];cw,ch=sheet['frameWidth'],sheet['frameHeight'];atlas=Image.open(ASSET/sheet['image']).convert('RGBA');new=json.loads(json.dumps(sheet));changes=[]
 for action,profile in actions.items():
  if profile.get('hold'):continue
  if '--publish' in sys.argv and not profile.get('accepted'):continue
  print('Packing',ident,action,flush=True)
  im=Image.open(ROOT/profile['source']).convert('RGBA');columnBands=None
  count=profile.get('sourceRows',8)
  try:detected=profile.get('bands') or bands(im,count)
  except AssertionError:
   # Raised weapons can overlap the vertical extent of another column without touching it.
   # Measure each column separately, then retain their shared absolute ground datum.
   columnBands=[]
   for k in range(4):columnBands.append(bands(im.crop((round(k*im.width/4),0,round((k+1)*im.width/4),im.height)),count))
   detected=[(min(b[d][0] for b in columnBands),max(b[d][1] for b in columnBands)) for d in range(count)]
  assert len(detected)==count,(ident,action,'unexpected source row count',detected)
  # Both source contact poses normalize with one factor for the entire action, never per-frame stretching.
  cells={};heights=[];ref=[]
  density=[sum(v>40 for v in im.getchannel('A').crop((x,0,x+1,im.height)).get_flattened_data()) for x in range(im.width)]
  edges=profile.get('columnEdges')
  if not edges and not profile.get('perRowColumns'):
   edges=[0]
   for j in range(1,4):
    target=j*im.width/4;reach=im.width/4*.32;cut=min(range(round(target-reach),round(target+reach)),key=lambda x:(sum(density[x-2:x+3]),abs(x-target)));assert sum(density[cut-2:cut+3])<=8,(ident,action,'columns overlap',cut,density[cut]);edges.append(cut)
   edges.append(im.width)
  for d,face in enumerate(sheet['directions']):
   if face in profile.get('preserveDirections',[]):continue
   row=profile.get('directionRows',list(range(8)))[d];lo,hi=detected[row]
   if profile.get('perRowColumns'):
    region=im.getchannel('A').crop((0,lo,im.width,hi));dens=[sum(v>40 for v in region.crop((x,0,x+1,region.height)).get_flattened_data()) for x in range(im.width)];edges=[0]
    for j in range(1,4):
     target=j*im.width/4;reach=im.width/4*.4;cut=min(range(round(target-reach),round(target+reach)),key=lambda x:(sum(dens[x-1:x+2]),abs(x-target)));assert sum(dens[cut-1:cut+2])==0,(ident,face,'no clean cell gap');edges.append(cut)
    edges.append(im.width)
   for k in range(4):
    left=edges[k];right=edges[k+1]
    if columnBands:
     ownlo,ownhi=columnBands[k][row];cell=Image.new('RGBA',(right-left,hi-lo));cell.paste(im.crop((left,ownlo,right,ownhi)),(0,ownlo-lo))
    else:cell=im.crop((left,lo,right,hi))
    box=bbox(cell);assert box,(ident,face,k)
    assert box[0]>0 and box[2]<cell.width,(ident,face,k,'touches horizontal cell edge')
    cells[(d,k)]=(cell,lo,hi)
    if k==0:heights.append(box[3]-box[1]);idx=sheet['directions'][face]['idle']['indices'][0];old=atlas.crop(((idx%8)*cw,(idx//8)*ch,(idx%8+1)*cw,(idx//8+1)*ch));b=bbox(old);ref.append(b[3]-b[1])
  # Targeted direction strips replace only faulty camera rows; retain their original alpha.
  for face,override in profile.get('directionOverrides',{}).items():
   strip=Image.open(ROOT/override['source']).convert('RGBA');d=list(sheet['directions']).index(face)
   limits=override.get('columnEdges',[round(j*strip.width/4) for j in range(5)]);bb=bbox(strip);assert bb
   first=strip.crop((limits[0],bb[1],limits[1],bb[3]+2));target=bbox(cells[(d,0)][0]);start=bbox(first);ratio=statistics.median(heights)/(start[3]-start[1])
   for k in range(4):
    if override.get('frames') and k not in override['frames']:continue
    cell=strip.crop((limits[k],bb[1],limits[k+1],bb[3]+2));assert bbox(cell);small=cell.resize((round(cell.width*ratio),round(cell.height*ratio)),Image.Resampling.NEAREST);original,lo,hi=cells[(d,k)];canvas=Image.new('RGBA',original.size);box=bbox(small);cx=(target[0]+target[2])/2;canvas.paste(small,(round(cx-(box[0]+box[2])/2),original.height-small.height));cells[(d,k)]=(canvas,lo,hi)
  factor=statistics.median(ref)/statistics.median(heights)*profile.get('scale',1);assert .1<factor<3
  maxWidth=max(bbox(cell)[2]-bbox(cell)[0] for cell,_,_ in cells.values());assert maxWidth*factor<cw-8,(ident,action,'action too wide')
  actionRow={'idle':0,'move':4,'attack':8,'hurt':12,'death':16}[action];bounds=[]
  for d,face in enumerate(sheet['directions']):
   if face in profile.get('preserveDirections',[]):
    if profile.get('prependNeutral'):
     old=sheet['directions'][face][action];neutral=sheet['directions'][face]['idle']['indices'][0];indices=[neutral,old['indices'][0],old['indices'][1],neutral];new['directions'][face][action]={**old,'indices':indices,'frames':len(indices),'reusedFrom':'original neutral / windup / strike / neutral recovery'}
    continue
   center=statistics.median((bbox(cells[(d,j)][0])[0]+bbox(cells[(d,j)][0])[2])/2 for j in range(4))
   for k in range(4):
    cell,lo,hi=cells[(d,k)];size=(round(cell.width*factor),round(cell.height*factor));sprite=cell.resize(size,Image.Resampling.NEAREST);frame=Image.new('RGBA',(cw,ch))
    # Shared row ground datum preserves stride/hip movement; do not bottom-align each pose independently.
    origin=(bbox(cell)[0]+bbox(cell)[2])/2 if edges!=[round(j*im.width/4) for j in range(5)] else center
    x=round(cw/2-origin*factor);y=round(sheet['anchor']['y']-cell.height*factor+profile.get('offsetY',0));frame.paste(sprite,(x,y));box=bbox(frame);assert box and box[0]>0 and box[2]<cw and box[1]>0 and box[3]<ch,(ident,action,face,k,'clipped',box)
    atlas.paste(frame,(d*cw,(actionRow+k)*ch));bounds.append({'direction':face,'frame':k,'bbox':box})
   old=sheet['directions'][face][action];new['directions'][face][action]={**old,'frames':4,'indices':[(actionRow+k)*8+d for k in range(4)]};new['directions'][face][action].pop('reusedFrom',None)
   if profile.get('recoverNeutral'):new['directions'][face][action]['indices'][-1]=actionRow*8+d
  if action=='attack':new['attackImpactFrame']=profile.get('impactFrame',2)
  changes.append(action);reports.append({'id':ident,'action':action,'source':profile['source'],'sourceSha256':hashlib.sha256((ROOT/profile['source']).read_bytes()).hexdigest(),'bands':detected,'uniformScale':factor,'bounds':bounds,'accepted':profile.get('accepted',False),'preservedDirections':profile.get('preserveDirections',[]),'directionRows':profile.get('directionRows',list(range(8))),'overrides':{face:{**v,'sha256':hashlib.sha256((ROOT/v['source']).read_bytes()).hexdigest()} for face,v in profile.get('directionOverrides',{}).items()}})
 if not changes:continue
 new['animations']=new['directions']['south'];new['image']='folklore-01/'+ident+'-r03.png';new['repairedActions']=changes
 target=OUT/(ident+'-r03.png') if '--publish' in sys.argv else WORK/(ident+'-preview.png');atlas.save(target);write(WORK/(ident+'-preview.json'),new)
 # Native before/after proof: all four poses, all eight views, one action per source file.
 for action in changes:
  page=Image.new('RGB',(768,1600),'#17302e');draw=ImageDraw.Draw(page)
  for row,(face,clips) in enumerate(new['directions'].items()):
   for k,idx in enumerate(clips[action]['indices']):
    f=atlas.crop(((idx%8)*cw,(idx//8)*ch,(idx%8+1)*cw,(idx//8+1)*ch));f.thumbnail((186,172),Image.Resampling.NEAREST);page.paste(f,(k*192,row*200+20),f);draw.text((k*192+4,row*200+4),face+' '+str(k+1),fill='white')
  page.save(WORK/(ident+'-'+action+'-qa.png'))
 if '--publish' in sys.argv:drafts['monsters'][ident]=new
write(WORK/'packing.json',reports)
if '--publish' in sys.argv:write(OUT/'drafts.json',drafts)
print('Measured',len(reports),'replacement action atlases;', 'published accepted only' if '--publish' in sys.argv else 'preview only')
