// Derive coverage from the existing illustrated Wang artwork; no synthetic water/noise artwork.
import {readFile,writeFile,copyFile} from 'node:fs/promises';
import {sharp,hash} from '../rig/body-eight-lib.mjs';
const pub='apps/client/public/assets/umbral',out=pub+'/water-animation-01';
const manifest=JSON.parse(await readFile(pub+'/manifest.json'));
const set=manifest.tilesets['water-grass'],bytes=await readFile(pub+'/'+set.image),pixels=await sharp(bytes).ensureAlpha().raw().toBuffer();
const palette=bit=>{const t=set.tiles.find(t=>t.corners.every(c=>c===bit)),colors=[];for(let y=0;y<16;y++)for(let x=0;x<16;x++){const p=((t.y+y)*64+t.x+x)*4;colors.push([pixels[p],pixels[p+1],pixels[p+2]]);}return colors;};
const waterBit=set.upper==='water'?1:0,water=palette(waterBit),land=palette(1-waterBit),mask=Buffer.alloc(64*64*4);
const distance=(rgb,pal)=>Math.min(...pal.map(c=>(rgb[0]-c[0])**2+(rgb[1]-c[1])**2+(rgb[2]-c[2])**2));
for(const t of set.tiles)for(let y=0;y<16;y++)for(let x=0;x<16;x++){const i=((t.y+y)*64+t.x+x)*4,rgb=[pixels[i],pixels[i+1],pixels[i+2]],wet=t.corners.every(c=>c===waterBit)||(!t.corners.every(c=>c===1-waterBit)&&distance(rgb,water)<distance(rgb,land));mask[i]=mask[i+1]=mask[i+2]=wet?255:0;mask[i+3]=255;}
await sharp(mask,{raw:{width:64,height:64,channels:4}}).png().toFile(out+'/mask-tiles.png');
const solid=set.tiles.find(t=>t.corners.every(c=>c===waterBit));await sharp(bytes).extract({left:solid.x,top:solid.y,width:16,height:16}).png().toFile(out+'/surface.png');
const fallSource=pub+'/candidates/mountain-sanctuary-phase-c/waterfall-01.png';await copyFile(fallSource,out+'/waterfall.png');
await writeFile(out+'/manifest.json',JSON.stringify({tileSize:16,waterBit,tiles:set.tiles,source:set.image,sourceSha256:hash(bytes),waterfallSource:'candidates/mountain-sanctuary-phase-c/waterfall-01.png',waterfallSha256:hash(await readFile(fallSource)),generatedArt:false},null,2)+'\n');
console.log('Exported exact source-derived water masks/surface and reused waterfall art.');
