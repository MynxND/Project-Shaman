// Raster preparation only: new authored art -> native atlases -> old Wang masks.
// Existing assets and terrain/collision geometry are immutable inputs.
import{readFile,writeFile,mkdir}from'node:fs/promises';import{resolve}from'node:path';import{createHash}from'node:crypto';import{sharp}from'../rig/body-eight-lib.mjs';
import{createRequire}from'node:module';
const root=resolve('docs/design/maps/terrain-quality-01'),out=resolve('apps/client/public/assets/umbral/terrain-quality');await mkdir(out,{recursive:true});
const manifestBytes=await readFile('apps/client/public/assets/umbral/manifest.json'),manifest=JSON.parse(manifestBytes),sourceHashes={manifest:sha(manifestBytes)};
function sha(b){return createHash('sha256').update(b).digest('hex');}
const raw=await readFile(resolve(root,'raw/terrain-atlas-v2.png'));const terrain=await sharp(raw).resize(256,192,{kernel:'nearest'}).ensureAlpha().raw().toBuffer();
await sharp(terrain,{raw:{width:256,height:192,channels:4}}).png().toFile(resolve(out,'authored-terrain.png'));
const materials=['grass','dirt','road'],native={};for(let m=0;m<3;m++)native[materials[m]]=Array.from({length:4},(_,v)=>{const b=Buffer.alloc(64*64*4);for(let y=0;y<64;y++)terrain.copy(b,y*64*4,((m*64+y)*256+v*64)*4,((m*64+y)*256+v*64+64)*4);return b;});
const sources={};for(const [id,set]of Object.entries(manifest.tilesets)){const bytes=await readFile(resolve('apps/client/public/assets/umbral',set.image));sourceHashes[id]=sha(bytes);sources[id]=await sharp(bytes).ensureAlpha().raw().toBuffer();}
const palette=(setId,bit)=>{const set=manifest.tilesets[setId],t=set.tiles.find(t=>t.corners.every(c=>c===bit)),pixels=sources[setId],colors=[];for(let y=0;y<16;y++)for(let x=0;x<16;x++){const p=((t.y+y)*64+t.x+x)*4;colors.push([pixels[p],pixels[p+1],pixels[p+2]]);}return colors;};
const distance=(rgb,pal)=>Math.min(...pal.map(c=>(rgb[0]-c[0])**2+(rgb[1]-c[1])**2+(rgb[2]-c[2])**2));
const qualitySets={};
for(const [id,set]of [...Object.entries(manifest.tilesets),['dirt-road',{...manifest.tilesets['grass-dirt'],lower:'dirt',upper:'road'}]]){
 const sourceId=id==='dirt-road'?'grass-dirt':id,sourceSet=manifest.tilesets[sourceId],source=sources[sourceId],low=palette(sourceId,0),high=palette(sourceId,1),pixels=Buffer.alloc(4096*64*4);
 const owners=[];
 for(const t of sourceSet.tiles){const mask=[];for(let y=0;y<16;y++)for(let x=0;x<16;x++){const p=((t.y+y)*64+t.x+x)*4,rgb=[source[p],source[p+1],source[p+2]];mask.push(t.corners.every(c=>c===0)?0:t.corners.every(c=>c===1)?1:distance(rgb,high)<distance(rgb,low)?1:0);}owners.push(mask);}
 for(let variant=0;variant<64;variant++){const group=Math.floor(variant/16),phase=variant%16,ox=phase%4*16,oy=Math.floor(phase/4)*16;
  sourceSet.tiles.forEach((tile,ti)=>{for(let y=0;y<16;y++)for(let x=0;x<16;x++){const material=owners[ti][y*16+x]?set.upper:set.lower,p=((tile.y+y)*4096+variant*64+tile.x+x)*4;
   if(material==='water'){const s=((tile.y+y)*64+tile.x+x)*4;source.copy(pixels,p,s,s+4);continue;}
   const rim=x<2||y<2||x>13||y>13,frame=native[material][rim?0:group],s=((oy+y)*64+ox+x)*4;frame.copy(pixels,p,s,s+4);
  }});
 }
 const file=id+'.png';await sharp(pixels,{raw:{width:4096,height:64,channels:4}}).png().toFile(resolve(out,file));qualitySets[id]={...set,image:file,variantStride:64,variantCount:64,weights:id==='grass-road'?[.60,.18,.14,.08]:[.60,.20,.12,.08],tiles:sourceSet.tiles};
}
// Ten alpha decorations from the generated sheet, individually fitted to16px.
const decoRaw=await readFile(resolve(root,'raw/decoration-atlas.png')),meta=await sharp(decoRaw).metadata(),decos=[];
for(let i=0;i<10;i++){const x0=Math.floor(i%5*meta.width/5),y0=Math.floor(Math.floor(i/5)*meta.height/2),w=Math.floor((i%5+1)*meta.width/5)-x0,h=Math.floor((Math.floor(i/5)+1)*meta.height/2)-y0;
 const cell=await sharp(decoRaw).extract({left:x0,top:y0,width:w,height:h}).png().toBuffer();const trimmed=await sharp(cell).trim().png().toBuffer();const crop=await sharp(trimmed).resize(16,16,{fit:'contain',background:'#00000000',kernel:'nearest'}).png().toBuffer();decos.push({input:crop,left:i%5*16,top:Math.floor(i/5)*16});}
await sharp({create:{width:80,height:32,channels:4,background:'#00000000'}}).composite(decos).png().toFile(resolve(out,'decorations.png'));
const result={version:1,nativeTileSize:16,seed:31414,edgeGuardPixels:2,tilesets:qualitySets,decorations:{image:'decorations.png',cell:16,columns:5,count:10},sourceHashes,rawSha256:sha(raw),visualApproved:false};
await writeFile(resolve(out,'manifest.json'),JSON.stringify(result,null,2));await writeFile(resolve(root,'manifest.json'),JSON.stringify(result,null,2));console.log('4 compatible pair atlases,64 variants per Wang tile;10 alpha decorations; source assets untouched.');
const require=createRequire(resolve('apps/client/package.json')),ts=require('typescript');const model=await readFile('apps/client/src/game/world/terrain-variation.ts','utf8');await writeFile(resolve(out,'variation.mjs'),ts.transpileModule(model,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText);
