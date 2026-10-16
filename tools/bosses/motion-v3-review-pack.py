"""Build review-only native-frame candidates. Never silently approve or adopt generated anatomy."""
from pathlib import Path
from PIL import Image
import hashlib,json
root=Path(__file__).resolve().parents[2];base=root/'docs/design/bosses/motion-identity-v3';out=root/'apps/client/public/boss-review/motion-v3';out.mkdir(parents=True,exist_ok=True)
audit=json.loads((base/'asset-audit.json').read_text(encoding='utf8'));issues=audit['sources']
faces=['south','south-west','west','north-west','north','north-east','east','south-east'];clips=[]
for boss in ['koschei','maiyarap','shuten-doji']:
 for action in ['walk','cast']:
  for face in faces:
   sources=sorted((base/boss).glob(f'{action}-{face}-[0-9][0-9].png'))
   if not sources:continue
   eligible=[p for p in sources if issues.get(p.relative_to(base).as_posix(),{}).get('status')!='rejected']
   source=(eligible or sources)[-1];issue=issues.get(source.relative_to(base).as_posix(),{});im=Image.open(source).convert('RGBA');raw=[];boxes=[];warnings=[]
   for row in range(4):
    for col in range(4):
     frame=im.crop((round(col*im.width/4),round(row*im.height/4),round((col+1)*im.width/4),round((row+1)*im.height/4)));box=frame.getchannel('A').point(lambda a:255 if a>32 else 0).getbbox()
     if not box:raise ValueError(str(source))
     if box[0]<=1 or box[1]<=1 or box[2]>=frame.width-1 or box[3]>=frame.height-1:warnings.append(f'frame {row*4+col}: cell-edge pixels require clipping/ownership inspection')
     raw.append(frame);boxes.append(box)
   # One scale for the entire clip, never normalize the changing pose frame by frame.
   scale=min(224/max(b[2]-b[0] for b in boxes),224/max(b[3]-b[1] for b in boxes));sheet=Image.new('RGBA',(960,960));hashes=[];bounds=[]
   for i,(frame,box) in enumerate(zip(raw,boxes)):
    crop=frame.crop(box);crop=crop.resize((max(1,round(crop.width*scale)),max(1,round(crop.height*scale))),Image.Resampling.NEAREST);dst=Image.new('RGBA',(240,240));x=(240-crop.width)//2;y=232-crop.height;dst.alpha_composite(crop,(x,y));sheet.alpha_composite(dst,(i%4*240,i//4*240));hashes.append(hashlib.sha256(dst.tobytes()).hexdigest());bounds.append([x,y,crop.width,crop.height])
   name=f'{boss}-{action}-{face}';sheet.save(out/(name+'.png'));clips.append({'id':name,'boss':boss,'action':action,'face':face,'image':name+'.png','source':source.relative_to(root).as_posix(),'sourceHash':hashlib.sha256(source.read_bytes()).hexdigest(),'sourceHashes':hashes,'frames':16,'frameMs':100,'cell':240,'columns':4,'anchor':[120,232],'scale':scale,'bounds':bounds,'warnings':warnings,'audit':issue,'status':'candidate; bounding-box registration only; no runtime adoption or gait approval'})
(out/'clips.json').write_text(json.dumps(clips,indent=2),encoding='utf8');print('Packed',len(clips),'review-only clips')
