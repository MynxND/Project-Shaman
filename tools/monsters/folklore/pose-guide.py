"""Code-native pose diagram for ImageGen guidance, never a game sprite or source-image edit."""
from pathlib import Path
from PIL import Image,ImageDraw
import math
ROOT=Path(__file__).resolve().parents[3];OUT=ROOT/'docs/design/monsters/folklore-01/repair-03';OUT.mkdir(parents=True,exist_ok=True)
im=Image.new('RGB',(1024,1536),'#162c2c');d=ImageDraw.Draw(im)
faces=['S','SW','W','NW','N','NE','E','SE']
for row,face in enumerate(faces):
 theta=row*math.pi/4
 for phase in range(4):
  cx=128+256*phase;cy=170+192*row
  def p(x,y,z):return(cx+round(72*(x*math.cos(theta)-y*math.sin(theta))),cy+round(72*(.45*(x*math.sin(theta)+y*math.cos(theta))-z)))
  bob=.025 if phase%2 else 0
  for side,color in [(1,'#ff8ac2'),(-1,'#61e6ef')]:
   x=.15*side;hip=p(x,0,.83+bob)
   if phase%2==0:fy=.4*side*(1 if phase==0 else -1);fz=0;ky=fy*.6;kz=.43
   else:
    support=side==(1 if phase==1 else -1);fy=-.13 if support else .05;fz=0 if support else .24;ky=fy*.5 if support else .26;kz=.43 if support else .55
   knee=p(x,ky,kz+bob);foot=p(x,fy,fz)
   d.line([hip,knee,foot],fill=color,width=8);d.ellipse([foot[0]-7,foot[1]-3,foot[0]+7,foot[1]+3],fill=color)
   shoulder=p(side*.28,0,1.42+bob);elbow=p(side*.31,-fy*.45,1.14+bob);hand=p(side*.34,-fy*.7,.95+bob);d.line([shoulder,elbow,hand],fill=color,width=6)
  d.line([p(0,0,.83+bob),p(0,0,1.5+bob)],fill='#ece3bf',width=14)
  head=p(0,0,1.7+bob);d.ellipse([head[0]-13,head[1]-17,head[0]+13,head[1]+13],outline='#ece3bf',width=4)
  d.text((phase*256+8,row*192+6),face+' '+['L CONTACT','R PASS / L SUPPORT','R CONTACT','L PASS / R SUPPORT'][phase],fill='white')
im.save(OUT/'walk-pose-guide.png');print(OUT/'walk-pose-guide.png')
