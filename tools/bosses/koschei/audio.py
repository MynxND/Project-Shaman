"""Original deterministic synthesized cold-bell cues, not sampled instruments/music."""
from pathlib import Path
import math,struct,wave
root=Path(__file__).resolve().parents[3]/'apps/client/public/assets/boss/koschei'
for name,hz,seconds in [('charge',174.6,.65),('contact',98,.4),('relic',261.6,.8)]:
 rate=22050;samples=[]
 for i in range(int(rate*seconds)):
  t=i/rate;envelope=min(1,t/.012)*math.exp(-t*(5 if name=='contact' else 3.8));v=sum(math.sin(2*math.pi*hz*mul*t)*amp for mul,amp in [(1,.48),(2.71,.23),(4.13,.1)])*envelope
  samples.append(struct.pack('<h',int(max(-1,min(1,v))*.45*32767)))
 with wave.open(str(root/(name+'.wav')),'wb') as f:f.setparams((1,2,rate,0,'NONE','not compressed'));f.writeframes(b''.join(samples))
print('Three original synthesized cues saved')
