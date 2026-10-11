// Diagnostic contact sheet of the published walk (body + head per frame), with a baseline guide row per direction.
import{readFile}from'node:fs/promises';import{json,sharp}from'./body-eight-lib.mjs';
const m=await json('apps/client/public/assets/character-v3/walk-eight-02/manifest.json'),cells=[];
for(const[i,d]of m.directions.entries())for(const[j,f]of d.frames.entries())cells.push({input:await readFile('apps/client/public'+f.url),left:j*96-16,top:i*112-30},{input:await readFile('apps/client/public'+d.headUrl),left:j*96-16+f.neckPivot.x-d.headPivot.x,top:i*112-30+f.neckPivot.y-d.headPivot.y});
const b=await sharp({create:{width:768,height:896,channels:4,background:'#20312e'}}).composite(cells).png().toBuffer();await sharp(b).resize(1536,1792,{kernel:'nearest'}).toFile('docs/design/character-v3/walk-eight-02/assembled-review-2x.png');
