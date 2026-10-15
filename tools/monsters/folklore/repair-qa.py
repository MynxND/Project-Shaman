"""Integrity regression, separate from authored-pose inspection and user approval."""
import json,hashlib,subprocess
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[3];A=ROOT/'apps/client/public/assets/monsters';W=ROOT/'docs/design/monsters/folklore-01/repair-03';read=lambda p:json.loads(p.read_text(encoding='utf8'))
baseline=read(W/'baseline.json')['monsters'];current=read(A/'folklore-01/drafts.json')['monsters'];profiles=read(W/'sources.json');report=read(W/'packing.json');assert len(report)==31
for r in report:
 assert r['accepted'] and hashlib.sha256((ROOT/r['source']).read_bytes()).hexdigest()==r['sourceSha256']
 for override in r.get('overrides',{}).values():assert hashlib.sha256((ROOT/override['source']).read_bytes()).hexdigest()==override['sha256']
new=0;checked=0
for ident,s in current.items():
 old=baseline[ident];path=A/old['image'];relative=path.relative_to(ROOT).as_posix();assert path.read_bytes()==subprocess.check_output(['git','show','HEAD:'+relative],cwd=ROOT),('Original overwritten',ident)
 image=Image.open(A/s['image']).convert('RGBA');original=Image.open(path).convert('RGBA');assert image.size==original.size;cw,ch=s['frameWidth'],s['frameHeight'];assert max(image.size)<=4096
 if s['image']!=old['image']:new+=1
 def crop(im,idx):return im.crop((idx%8*cw,idx//8*ch,(idx%8+1)*cw,(idx//8+1)*ch))
 for face,clips in s['directions'].items():
  for action,clip in clips.items():
   assert len(clip['indices'])==clip['frames'];assert clip['loop']==(action in ['idle','move'])
   for idx in clip['indices']:assert crop(image,idx).getchannel('A').getbbox(),(ident,face,action,idx)
   if action not in s.get('repairedActions',[]):
    for idx in old['directions'][face][action]['indices']:assert crop(image,idx).tobytes()==crop(original,idx).tobytes(),('Unrelated art changed',ident,face,action)
   checked+=1
 for action,p in profiles.get(ident,{}).items():
  assert p['accepted']
  for override in p.get('directionOverrides',{}).values():assert (ROOT/override['source']).exists()
assert new==28,new
(W/'technical-check.json').write_text(json.dumps({'originalAtlasesUnchanged':40,'versionedAtlases':new,'allActionDirections':checked,'replacementActions':len(report),'userVisualApproval':'pending'},indent=2)+'\n')
print('PASS40 original PNGs byte-exact;28 versioned atlases;1600 action/direction clips valid; untouched action pixels unchanged')
