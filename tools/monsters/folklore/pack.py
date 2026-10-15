"""Pack measured, reviewed source rectangles; no painting, alpha keying or invented directional frames.
Run with Pillow Python. Original alpha PNGs stay byte-exact in raw/<id>/source.png.
"""
import json, hashlib, math, sys
from pathlib import Path
from PIL import Image, ImageFilter
from collections import deque
ROOT=Path(__file__).resolve().parents[3]
DOC=ROOT/'docs/design/monsters/folklore-01'
OUT=ROOT/'apps/client/public/assets/monsters/folklore-01'
def isolate_cell(cell, core, pivot):
    # Ownership extraction only: keep the connected sprite and detached details in its authored cell.
    # Alpha/color of retained source pixels is unchanged; no new character pixels are painted.
    width,height=cell.size;a=cell.getchannel('A');raw=bytes(a.get_flattened_data());seen=bytearray(len(raw));groups=[]
    for seed,v in enumerate(raw):
        if v<=40 or seen[seed]:continue
        seen[seed]=1;q=deque([seed]);pixels=[];sx=sy=0
        while q:
            k=q.popleft();pixels.append(k);x=k%width;y=k//width;sx+=x;sy+=y
            for nx,ny in [(x-1,y),(x+1,y),(x,y-1),(x,y+1)]:
                if nx<0 or ny<0 or nx>=width or ny>=height:continue
                j=ny*width+nx
                if not seen[j] and raw[j]>40:seen[j]=1;q.append(j)
        groups.append((pixels,sx/len(pixels),sy/len(pixels)))
    if not groups:return cell
    main=max(groups,key=lambda g:len(g[0])/(1+abs(g[1]-pivot)/max(1,width)*4))
    mask=bytearray(len(raw));left,top,right,bottom=core
    for g in groups:
        own=g is main or (left+2<=g[1]<right-2 and top<=g[2]<bottom and len(g[0])>=2)
        if own:
            for k in g[0]:mask[k]=255
    owned=Image.frombytes('L',cell.size,bytes(mask)).filter(ImageFilter.MaxFilter(3))
    result=cell.copy();result.putalpha(Image.composite(a,Image.new('L',cell.size),owned));return result

def sha(b):return hashlib.sha256(b).hexdigest()
roster=json.loads((DOC/'roster.json').read_text(encoding='utf8'))
profiles=json.loads((DOC/'cuts.json').read_text())
faces=roster['directions'];only=set(sys.argv[1:]);drafts=json.loads((OUT/'drafts.json').read_text())['monsters'] if only else {};results=json.loads((DOC/'packing.json').read_text()) if only else []
for ident,p in profiles.items():
 if only and ident not in only:continue
 raw=DOC/'raw'/ident/'source.png'
 if not raw.exists():continue
 im=Image.open(raw).convert('RGBA'); W,H=im.size
 assert im.getchannel('A').getextrema()[0]<255,ident+' opaque background'
 n=p['columns']; centers=p.get('columnCenters',[(i+.5)*W/n for i in range(n)]);boundaries=[0]+[round((a+b)/2) for a,b in zip(centers,centers[1:])]+[W]; cols=p.get('columnMap',list(range(8)));assert len(cols)==8
 bands=p['bands']; assert all(0<=a<b<=H for a,b in bands)
 # One shared scale for the whole creature; never independently stretch an action frame.
 pad=p.get('padX',28);cw=224 if pad>28 else 192;factor=min(1,(cw-32)/(W/n+pad*2),160/max(b-a+12 for a,b in bands))
 atlas=Image.new('RGBA',(cw*8,3840)); directionData={}; occupied=[]; borderWarnings=[]
 for d,col in enumerate(cols):
  clips={}
  for actionIndex,action in enumerate(['idle','move','attack','hurt','death']):
   picks=p['actions'][action]; assert 0<len(picks)<=4
   indices=[];hashes=[]
   for frameIndex,sourceRow in enumerate(picks):
    source=im; sourceBands=bands; sourceBounds=boundaries; sourceCenters=centers; sourceW=W; sourceH=H; sourceCol=col; sourceFactor=factor
    if action=='attack' and ident=='sending':
     # Versioned short-strike repair. One uniform scale across all32 new attack poses.
     source=Image.open(DOC/'raw'/ident/'attack-v2.png').convert('RGBA');sourceW,sourceH=source.size
     sourceCol=d;sourceRow=frameIndex;sourceCenters=[(i+.5)*sourceW/8 for i in range(8)];sourceBounds=[round(i*sourceW/8) for i in range(9)]
     sourceBands=[(round(i*sourceH/4),round((i+1)*sourceH/4)) for i in range(4)];sourceFactor=min(1,128/(sourceH/4))
    lo,hi=sourceBands[sourceRow];x0=sourceBounds[sourceCol];x1=sourceBounds[sourceCol+1];y0=max(0,lo-4);y1=min(sourceH,hi+4)
    ex0=max(0,x0-pad);ex1=min(sourceW,x1+pad);ey0=max(0,y0-3);ey1=min(sourceH,y1+3);cell=source.crop((ex0,ey0,ex1,ey1));cell=isolate_cell(cell,(x0-ex0,lo-ey0,x1-ex0,hi-ey0),sourceCenters[sourceCol]-ex0); a=cell.getchannel('A');assert a.getbbox(),ident+' empty cell'
    if sum(v>40 for v in a.crop((0,0,1,cell.height)).get_flattened_data())>12 or sum(v>40 for v in a.crop((cell.width-1,0,cell.width,cell.height)).get_flattened_data())>12:borderWarnings.append([action,faces[d],sourceRow])
    size=(max(1,round(cell.width*sourceFactor)),max(1,round(cell.height*sourceFactor))); resized=cell.resize(size,Image.Resampling.NEAREST)
    frame=Image.new('RGBA',(cw,192));frame.paste(resized,(cw//2-round((sourceCenters[sourceCol]-ex0)*sourceFactor),176-size[1]))
    if ident=='sending' and action=='attack':
     frame=Image.new('RGBA',(cw,192));frame.paste(resized,(cw//2-round((sourceCenters[sourceCol]-ex0)*sourceFactor),170-round(a.getbbox()[3]*sourceFactor)))
    targetRow=actionIndex*4+frameIndex;atlas.paste(frame,(d*cw,targetRow*192));indices.append(targetRow*8+d);hashes.append(sha(frame.tobytes()))
    occupied.append({'action':action,'direction':faces[d],'frame':frameIndex,'sourceRect':[ex0,ey0,ex1-ex0,ey1-ey0],'coreRect':[x0,y0,x1-x0,y1-y0],'bbox':frame.getchannel('A').getbbox(),'sha256':hashes[-1]})
   clips[action]={'row':actionIndex*4,'frames':len(picks),'fps':{'idle':5,'move':8,'attack':8,'hurt':8,'death':6}[action],'loop':action in ['idle','move'],'indices':indices}
   if action=='hurt':clips[action]['reusedFrom']='death reaction'
  directionData[faces[d]]=clips
 meta=next(r for r in roster['monsters'] if r['id']==ident)
 atlas.save(OUT/(ident+'.png'))
 info={'image':'folklore-01/'+ident+'.png','frameWidth':cw,'frameHeight':192,'columns':8,'anchor':{'x':cw//2,'y':176},'scale':meta['scale'],'animations':directionData['south'],'directions':directionData}
 drafts[ident]=info
 report={'id':ident,'sourceSha256':sha(raw.read_bytes()),'sourceSize':[W,H],'packedSha256':sha((OUT/(ident+'.png')).read_bytes()),'scale':factor,'frames':occupied,'sourceBorderWarnings':borderWarnings,'notes':p.get('notes',[]),'visualStatus':'review candidate; not automatically approved'}
 (DOC/'raw'/ident/'packing.json').write_text(json.dumps(report,indent=2))
 results=[r for r in results if r['id']!=ident];results.append({k:v for k,v in report.items() if k!='frames'});print('PACK',ident,len(occupied),'frames',len(borderWarnings),'source edge warnings')
(OUT/'drafts.json').write_text(json.dumps({'monsters':drafts},indent=2))
(DOC/'packing.json').write_text(json.dumps(results,indent=2))
