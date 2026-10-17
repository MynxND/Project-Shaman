import {sharp} from '../../../../tools/rig/body-eight-lib.mjs';
for(const d of ['south','south-east','east','north-east','north','north-west','west','south-west']){
 const a=await sharp(`docs/design/equipment/class-2-eight-01/juggernaut/${d}.png`).ensureAlpha().raw().toBuffer();
 const rows=[];for(let y=40;y<=55;y++){const xs=[];for(let x=40;x<90;x++){const i=(y*128+x)*4,r=a[i],g=a[i+1],b=a[i+2];if(a[i+3]&&r>130&&r>g*1.16&&g>b*1.1)xs.push(x);}if(xs.length)rows.push([y,Math.min(...xs),Math.max(...xs)]);}
 console.log(d,JSON.stringify(rows));
}
