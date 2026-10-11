"""Review contact/GIF of all four actions and eight facings, with the runtime hand-axis composition."""
import json
from pathlib import Path
from PIL import Image, ImageDraw
from preview_layers import weapon_layer

ROOT=Path(__file__).resolve().parents[2]
RAW=ROOT/'docs/design/rig/raw'
OUT=ROOT/'docs/design/equipment/reviews'
OUT.mkdir(exist_ok=True)
skel=json.loads((ROOT/'docs/design/rig/skeletons.json').read_text(encoding='utf-8'))['bodies']
facings=['south','south-east','east','north-east','north','north-west','west','south-west']
actions=['idle','walk','attack','cast']
cell=224; margin=48
for body in ['male','female']:
    for outfit in ['base','bronze-ward']:
        weapon='staff-bell' if outfit=='base' else 'staff-bone'
        images=[]
        for tick in range(12):
            board=Image.new('RGBA',(cell*8,cell*4),'#203b36')
            labels=ImageDraw.Draw(board)
            for row,action in enumerate(actions):
                n=len(skel[body]['south'][action])
                # Uniform phase across actions, while preserving each native animation's own frame order.
                index=min(n-1,tick*n//12)
                for col,facing in enumerate(facings):
                    source=RAW/body/outfit/action/facing/f'{index}.png'
                    x,y=col*cell,row*cell
                    labels.text((x+8,y+8),f'{body}/{outfit} {action} {facing} F{index}',fill='#e8d9b1')
                    if not source.exists():
                        labels.text((x+8,y+28),'PENDING',fill='#d6b46c'); continue
                    w=skel[body][facing][action+':weapon'][index]
                    art,pos=weapon_layer(weapon,w['grip'],w['tip'])
                    at=(x+margin+pos[0],y+margin+pos[1])
                    if not w['front']: board.alpha_composite(art,at)
                    board.alpha_composite(Image.open(source).convert('RGBA'),(x+margin,y+margin))
                    if w['front']: board.alpha_composite(art,at)
            images.append(board.convert('RGB'))
        images[7].save(OUT/f'{body}-{outfit}-all-directions.png')
        images[0].save(OUT/f'{body}-{outfit}-all-directions.gif',save_all=True,append_images=images[1:],duration=100,loop=0,disposal=2)
        print('review',body,outfit)
