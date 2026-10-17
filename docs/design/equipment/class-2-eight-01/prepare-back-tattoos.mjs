import {sharp,hash} from '../../../../tools/rig/body-eight-lib.mjs';
import {readFile,writeFile} from 'node:fs/promises';
const root='docs/design/equipment/class-2-eight-01/';
for(const [d,cx] of [['north',63],['north-east',62],['north-west',64]]){
 const bytes=await readFile(root+`achan/${d}.png`),a=await sharp(bytes).ensureAlpha().raw().toBuffer(),points=new Set();
 const put=(x,y)=>points.add(y*128+x);
 // Original fictional geometry: paired stepped diamonds, vertical spine and small lateral marks.
 for(let y=54;y<=67;y++)put(cx,y);
 for(const cy of [57,64])for(let t=0;t<=3;t++)for(const sign of [-1,1]){put(cx+sign*t,cy-3+t);put(cx+sign*t,cy+3-t);}
 for(let y=55;y<=66;y+=3)for(const sign of [-1,1]){put(cx+sign*6,y);put(cx+sign*5,y);}
 const pixels=[];for(const p of points){const x=p%128,y=Math.floor(p/128),i=p*4,r=a[i],g=a[i+1],b=a[i+2];if(a[i+3]&&r>145&&r>g*1.15&&g>b*1.08)pixels.push([x,y,'#'+a.subarray(i,i+4).toString('hex'),'#594039ff']);}
 await writeFile(root+`achan-${d}-tattoo-patches.json`,JSON.stringify({sourceSha256:hash(bytes),image:'data:image/png;base64,'+bytes.toString('base64'),changes:[{operation:'patch_pixels',layer:'image',frames:[1],pixels,reason:'Original fictional back tattoo clusters on exposed torso only, no real sacred script; preserve neck, arms, outline and costume'}]},null,2)+'\n');
 console.log(d,pixels.length);
}
