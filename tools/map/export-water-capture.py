"""Assemble actual browser captures; no artwork is generated or retouched."""
from pathlib import Path
import json
from PIL import Image, ImageChops

root = Path('docs/design/maps/water-animation-01')
capture = json.loads((root / 'capture.json').read_text(encoding='utf-8'))
rect = capture['canvas']
box = (round(rect['x']), round(rect['y']), round(rect['x']+rect['width']), round(rect['y']+rect['height']))
frames = [Image.open(p).convert('RGB').crop(box) for p in sorted((root/'screens').glob('frame-*.png'))]
assert len(frames) == 25
frames[0].save(root/'screens/animation-poster.png')
frames[0].save(root/'water-preview.gif',save_all=True,append_images=frames[1:],duration=125,disposal=2,optimize=False)
# Document changing native render content rather than claiming motion from one still.
deltas = [ImageChops.difference(frames[i], frames[i+1]).getbbox() is not None for i in range(len(frames)-1)]
assert all(deltas)
probe=capture['waterProbe']
probe_box=(probe['x'],probe['y'],probe['x']+probe['width'],probe['y']+probe['height'])
water_frames=[Image.open(p).convert('RGB').crop(probe_box) for p in sorted((root/'screens').glob('frame-*.png'))]
water_changes=[ImageChops.difference(water_frames[i],water_frames[i+1]).getbbox() is not None for i in range(len(water_frames)-1)]
assert all(water_changes), 'Water interior must change independently of animated lamps/UI'
(root/'capture-analysis.json').write_text(json.dumps({'frames':len(frames),'stepSeconds':.125,'timelineSeconds':3,'changedPairs':sum(deltas),'waterInteriorChangedPairs':sum(water_changes),'crop':box,'waterProbe':probe_box,'source':'actual Phaser browser screenshots','gifPlayback':'finite capture; real shader clock does not reset'},indent=2)+'\n',encoding='utf-8')
print('Exported 25 actual Phaser frames as a finite 3-second GIF; PNG evidence retained.')
