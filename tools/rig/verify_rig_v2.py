"""Check native rig coverage and layer attachment data. --complete requires two outfits on both bodies."""
import json
import math
import sys
from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parents[2]
BASE=ROOT/'apps/client/public/assets/rig-v2'
m=json.loads((BASE/'manifest.json').read_text(encoding='utf-8'))
directions=['south','south-east','east','north-east','north','north-west','west','south-west']
expected={'idle':4,'walk':8,'attack':8,'cast':12}
report={}
for body in ['male','female']:
    b=m['bodies'].get(body,{})
    for outfit in ['base','bronze-ward']:
        complete=0
        for action,n in expected.items():
            for facing in directions:
                count=b.get('outfits',{}).get(outfit,{}).get(action,{}).get(facing)
                if count is None:
                    continue
                assert count==n, (body,outfit,action,facing,count)
                image=Image.open(BASE/body/outfit/f'{action}-{facing}.png').convert('RGBA')
                assert image.size==(128*n,128)
                layer=b['layers'][action][facing]
                assert len(layer)==n
                distinct=set()
                for i,f in enumerate(layer):
                    frame=image.crop((i*128,0,(i+1)*128,128))
                    distinct.add(frame.tobytes())
                    assert frame.getbbox(), (body,outfit,action,facing,i,'empty')
                    assert frame.getchannel('A').getextrema()[0]==0, 'no transparency'
                    for point in ['grip','tip','crown']:
                        assert len(f[point])==2 and all(math.isfinite(v) for v in f[point])
                    assert math.dist(f['grip'],f['tip'])>0
                    assert isinstance(f['front'],bool)
                assert len(distinct)>1, (body,outfit,action,facing,'static duplicate animation')
                complete+=1
        report[f'{body}/{outfit}']=complete
        if '--complete' in sys.argv:
            assert complete==32, (body,outfit,'missing coverage',complete)
print(json.dumps(report))
coverage={
    'status':'generation-paused-identity-review',
    'animationFacings':report,
    'requiredPerBodyOutfit':32,
    'independentHairTopBottom':'requires-reviewed-art-reconstruction; not implemented',
    'visualApproval':'user-review-pending',
    'rejectedOutfits':['bronze-ward'],
}
(ROOT/'docs/design/equipment/coverage.json').write_text(json.dumps(coverage,indent=2)+'\n',encoding='utf-8')
print('PASS available native rig strips, frame timelines, alpha and attachment geometry')
