import {sharp} from '../../../../tools/rig/body-eight-lib.mjs';
const b=Buffer.alloc(128*128*3);
for(const[x0,y0,x1,y1]of [[32,68,48,93],[78,65,94,93]])for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)b.fill(255,(y*128+x)*3,(y*128+x)*3+3);
await sharp(b,{raw:{width:128,height:128,channels:3}}).png().toFile('docs/design/equipment/class-2-first-pair-03/juggernaut-hand-mask.png');
