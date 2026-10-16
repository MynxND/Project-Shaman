"""Pack owned RGBA sheets with stable anchors. Only crop/nearest scale/placement; no repainting."""
from pathlib import Path
from PIL import Image
import json, hashlib, shutil
root=Path(__file__).resolve().parents[2]
doc=root/'docs/design/bosses/shuten-doji/complete'
out=root/'apps/client/public/assets/vfx/boss/shuten-complete'
out.mkdir(parents=True,exist_ok=True)
rows=json.loads((doc/'generations.json').read_text(encoding='utf-8'))
anchors={'wave':(.5,.5),'sweep':(.5,.5),'sake':(.82,.65),'roar':(.5,.5),'portal':(.65,.5),'fist':(.87,.7),'breath':(.5,.5),'impact':(.7,.65),'smoke':(.9,.85),'liquid':(.7,.5),'drinking':(.94,.94),'fallen':(.94,.94)}
manifest={}
for row in rows:
    source=Path(row['path']);source=source if source.is_absolute() else root/source
    saved=doc/'sources'/f"{row['id']}.png"
    if source.resolve()!=saved.resolve():shutil.copy2(source,saved)
    count=8 if row['id'] in ['drinking','fallen'] else 16;grid_y=count//4
    im=Image.open(saved).convert('RGBA');atlas=Image.new('RGBA',(1024,grid_y*256));sy,ty=anchors[row['id']]
    for i in range(count):
        x,y=i%4,i//4;cell=im.crop((x*im.width//4,y*im.height//grid_y,(x+1)*im.width//4,(y+1)*im.height//grid_y))
        scale=min(244/cell.width,(256*ty-5)/(cell.height*sy),(256*(1-ty)-5)/(cell.height*(1-sy)))
        w,h=max(1,round(cell.width*scale)),max(1,round(cell.height*scale));sprite=cell.resize((w,h),Image.Resampling.NEAREST)
        atlas.paste(sprite,(x*256+(256-w)//2,y*256+round(256*ty-h*sy)))
        alpha=cell.getchannel('A');assert alpha.getextrema()[0]<8 and alpha.getextrema()[1]>30,f"Invalid cell {row['id']} {i}"
    dest=out/f"{row['id']}.png";atlas.save(dest)
    row['job']=Path(row['path']).stem if 'job' not in row else row['job'];row['path']=saved.relative_to(root).as_posix()
    manifest[row['id']]={'frames':count,'grid':[4,grid_y],'cell':[256,256],'anchor':[.5,ty], 'sourceSize':list(im.size),'source':row['path'],'sourceSha256':hashlib.sha256(saved.read_bytes()).hexdigest(),'sha256':hashlib.sha256(dest.read_bytes()).hexdigest()}
(doc/'generations.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(out/'manifest.json').write_text(json.dumps({'provider':'built-in ImageGen','alpha':'original preserved','packing':'nearest; stable foot anchor; no repaint','atlases':manifest},indent=2)+'\n',encoding='utf-8')
print(f'Validated and packed {sum(v["frames"] for v in manifest.values())} RGBA animation/view cells')
