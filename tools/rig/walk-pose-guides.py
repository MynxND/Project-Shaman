"""Original analytical pose diagrams, not new character art or 3D models."""
from pathlib import Path
from PIL import Image,ImageDraw
import json,math
ROOT=Path(__file__).resolve().parents[2]
out=ROOT/'docs/design/walk-regeneration-2026-10-14'
plan=json.loads((out/'plan.json').read_text(encoding='utf-8'))
report=json.loads((ROOT/'docs/design/equipment/class-2-imagegen-detail-01/export-report.json').read_text(encoding='utf-8'))
directions=['south','south-east','east','north-east','north','north-west','west','south-west']
for job in plan['jobs']:
 f=next(f for f in report['frames'] if f['id']==job['id'] and f['action']=='walk' and f['direction']==job['direction'])
 reg=f['sourceRegistration'];scale=reg['scale'];dx=reg['offsetX'];dy=reg['offsetY']
 image=Image.new('RGB',(1774,887),'#eee9dc');draw=ImageDraw.Draw(image)
 az=directions.index(job['direction'])*math.pi/4
 def project(x,y,z):return (62+(x*math.cos(az)+y*math.sin(az))*32,109-(y*math.cos(az)-x*math.sin(az))*8-z*32)
 def raw(point,col,row):return (col*443.5+(point[0]-dx)/scale,row*443.5+(point[1]-dy)/scale)
 for i in range(8):
  col,row=i%4,i//4
  cx0,cy0=col*443.5,row*443.5
  groundY=raw((62,111),col,row)[1]
  draw.line((cx0+70,groundY,cx0+370,groundY),fill='#80754e',width=2)
  for sign,offset,color,label in [(-1,0,'#c33333','A'),(1,.5,'#167f96','B')]:
   phase=(i/8+offset)%1
   if phase<.5:y=-.25+phase;z=0
   else:
    t=(phase-.5)*2;y=.25-.5*(3*t*t-2*t*t*t);z=.20*math.sin(math.pi*t)**2
   hip=project(sign*.22,0,.88)
   ankle=project(sign*.22,y,z)
   knee=project(sign*.22,y*.5-.04,.43+z*.4)
   points=[raw(p,col,row) for p in (hip,knee,ankle)]
   draw.line(points,fill=color,width=7)
   for x,yy in points:draw.ellipse((x-7,yy-7,x+7,yy+7),fill=color)
   x,yy=points[-1];draw.text((x+8,yy-15),label,fill=color)
  draw.text((cx0+100,cy0+20),f'{i}: '+['A contact','A down/B toe off','B passing','B swing','B contact','B down/A toe off','A passing','A swing'][i],fill='black')
 path=Path(job['prompt']).with_name('pose-guide.png');image.save(path)
print('36 original pose guides')

