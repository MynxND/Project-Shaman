// Exact, free Workbench cleanup requests. Sharp only packs original frames into an atlas.
import {readFile,writeFile} from 'node:fs/promises';
import {sharp,hash,order} from './body-eight-lib.mjs';
const root='docs/design/equipment/class-2-production-01';
const regions={
 'south-east':{1:[[81,22,88,39]],2:[[49,20,79,39]],3:[[81,85,95,120]],4:[[81,85,95,120]],5:[[81,85,95,120]],6:[[85,78,97,88]]},
 'north-east':{1:[[80,29,86,38]],2:[[75,24,82,36]],4:[[84,98,94,116]],5:[[82,96,94,116]]},
 north:{1:[[74,25,82,38]],2:[[74,25,82,38]],3:[[81,97,86,115]],4:[[81,97,86,115]],5:[[81,97,86,115]],6:[[81,97,86,115]]},
 'north-west':{1:[[48,20,74,38]],2:[[48,20,74,38]],3:[[32,95,45,108]],4:[[32,95,45,108]],5:[[32,95,45,108]],6:[[36,87,44,96]]},
 'south-west':{1:[[49,7,77,37]],2:[[49,7,77,37]],3:[[27,86,43,122]],4:[[27,86,43,122]],5:[[27,86,43,122]],6:[[35,83,46,99]]}
};
const patches=[],sources=[],images=[];
const manifest=JSON.parse(await readFile('apps/client/public/assets/character-v3/class-outfits/manifest.json','utf8'));
const outfit=manifest.outfits.find(o=>o.id==='juggernaut');
for(const[d,direction]of order.entries())for(let k=0;k<8;k++){
 const path=`${root}/juggernaut/attack/raw/${direction}-${k}.png`,bytes=await readFile(path),pixels=await sharp(bytes).ensureAlpha().raw().toBuffer();
 images.push({input:bytes,left:k*128,top:d*128});sources.push({direction,frame:k,sha256:hash(bytes)});
 const areas=[...(k===1||k===2?[[0,0,127,37]]:[]),...(regions[direction]?.[k]??[])],seen=new Set();
 for(const[x0,y0,x1,y1]of areas)for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
  if(seen.has(y*128+x))continue;seen.add(y*128+x);
  const i=(y*128+x)*4;if(!pixels[i+3])continue;
  const hands=outfit.directions[direction].attack[k],nearHand=[hands.main,hands.off].some(p=>(p.x-x)**2+(p.y-y)**2<=49);
  let protectedSkin=false;
  if(y<38||nearHand)for(let yy=Math.max(0,y-1);yy<=Math.min(127,y+1);yy++)for(let xx=Math.max(0,x-1);xx<=Math.min(127,x+1);xx++){const j=(yy*128+xx)*4;if(pixels[j+3]&&pixels[j]>130&&pixels[j]>pixels[j+1]*1.15&&pixels[j+1]>pixels[j+2]*1.08)protectedSkin=true;}
  if(protectedSkin)continue;
  patches.push([k*128+x,d*128+y,'#'+pixels.subarray(i,i+4).toString('hex'),'#00000000']);
 }
}
const atlas=await sharp({create:{width:1024,height:1024,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(images).png().toBuffer();
await writeFile(`${root}/knife-cleanup-source.png`,atlas);
const changes=[{operation:'patch_pixels',layer:'image',frames:[1],pixels:patches,reason:'Remove unwanted baked knife/sword pixels outside the body from generated empty-hand axe poses; preserve source skin and everything outside exact guarded regions.'}];
await writeFile(`${root}/knife-cleanup-guards.json`,JSON.stringify({atlasSha256:hash(atlas),regions,sources,changes},null,2));
await writeFile(`${root}/knife-cleanup-request.json`,JSON.stringify({argv:['edit','data:image/png;base64,'+atlas.toString('base64'),'--changes',JSON.stringify(changes)],mode:'low',notes:'User requests finishing production Thailand/Russia with no more paid tests. Free exact cleanup of baked knife artifacts; actual axe and shield remain separate modular assets.'}));
console.log(`Prepared ${patches.length} guarded pixels; no image generation or credits`);
