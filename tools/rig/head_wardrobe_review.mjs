// Builds a nearest-neighbour review sheet: row1 canonical V2 head per direction, row2 generated style view.
import {createRequire} from 'node:module';
const req=createRequire(new URL('../../apps/client/package.json',import.meta.url)),sharp=createRequire(req.resolve('next'))('sharp');
const out='docs/design/head-wardrobe-01/',id=process.argv[2],dirs=['south','south-west','west','north-west','north','north-east','east','south-east'];
const crop=p=>sharp(p).extract({left:24,top:0,width:80,height:72}).resize(160,144,{kernel:'nearest'}).png().toBuffer();
const comp=[];for(const [i,d] of dirs.entries()){comp.push({input:await crop(out+'canonical-'+d+'.png'),left:i*165,top:0});comp.push({input:await crop(out+id+'-'+d+'-raw.png'),left:i*165,top:150});}
await sharp({create:{width:8*165,height:296,channels:4,background:'#23312f'}}).composite(comp).png().toFile(out+id+'-rotation-review.png');
