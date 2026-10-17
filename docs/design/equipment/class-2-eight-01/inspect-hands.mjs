import {sharp} from '../../../../tools/rig/body-eight-lib.mjs';
import {readFile} from 'node:fs/promises';
const report=JSON.parse(await readFile('docs/design/equipment/class-2-eight-01/pair-equipment-audit.json','utf8'));
for(const id of ['achan','juggernaut'])for(const direction of Object.keys(report.results[id])){
 const a=await sharp(`docs/design/equipment/class-2-eight-01/${id}/${direction}.png`).ensureAlpha().raw().toBuffer();
 const mask=new Set();for(let y=60;y<100;y++)for(let x=25;x<105;x++){const i=(y*128+x)*4,r=a[i],g=a[i+1],b=a[i+2];if(a[i+3]&&r>145&&r>g*1.15&&g>b*1.08)mask.add(y*128+x)}
 const parts=[];while(mask.size){const seed=mask.values().next().value,q=[seed],xs=[],ys=[];mask.delete(seed);for(let n=0;n<q.length;n++){const v=q[n],x=v%128,y=Math.floor(v/128);xs.push(x);ys.push(y);for(const k of [v-1,v+1,v-128,v+128])if(mask.delete(k))q.push(k)}if(q.length>5)parts.push({n:q.length,x:[Math.min(...xs),Math.max(...xs)],y:[Math.min(...ys),Math.max(...ys)]});}
 console.log(id,direction,'original',report.results[id][direction].hands.map(h=>h.sourceAnchor),'skin',JSON.stringify(parts));
}
