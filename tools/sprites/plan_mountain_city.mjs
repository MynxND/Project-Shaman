// Read-only scene reconstruction and diagram; does not modify playable map data.
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {sharp,json,save,hash} from '../rig/body-eight-lib.mjs';
import {UMBRAL_CAPITAL as map,terrainVertices,cellCorners} from '../../packages/shared/dist/index.js';
const D='docs/design/umbral-mountain-plan-01/',A='apps/client/public/assets/umbral/';await mkdir(D+'backup',{recursive:true});
const paths=['packages/shared/src/maps/umbral-capital.ts','packages/shared/src/maps/umbral-npcs.ts','packages/shared/src/world.ts','apps/client/src/game/world/MapRenderer.ts','apps/client/public/assets/umbral/manifest.json'];
const records=[];for(const p of paths){const b=await readFile(p),dest=D+'backup/'+p.replaceAll('/','__');await copyFile(p,dest);records.push({source:p,backup:dest,sha256:hash(b)});}await save(D+'backup/index.json',records);await save(D+'current-map.json',map);
const manifest=await json(A+'manifest.json'),W=map.width*16,H=map.height*16;
const raw=Buffer.alloc(W*H*4);for(let i=3;i<raw.length;i+=4)raw[i]=255;
const blit=(d,w,h,x,y)=>{for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++){const dx=x+xx,dy=y+yy;if(dx<0||dy<0||dx>=W||dy>=H)continue;const s=(yy*w+xx)*4,t=(dy*W+dx)*4,a=d[s+3]/255;if(!a)continue;for(let c=0;c<3;c++)raw[t+c]=Math.round(d[s+c]*a+raw[t+c]*(1-a));}};
const images=new Map();async function load(path){if(!images.has(path))images.set(path,await sharp(A+path).ensureAlpha().raw().toBuffer({resolveWithObject:true}));return images.get(path);}
for(const r of [{material:map.ground.base,x:0,y:0,w:map.width,h:map.height},...map.ground.regions]){const p=await load(manifest.ground[r.material].image);for(let y=0;y<r.h*16;y++)for(let x=0;x<r.w*16;x++){const sx=(x*2)%p.info.width,sy=(y*2)%p.info.height;blit(p.data.subarray((sy*p.info.width+sx)*4,(sy*p.info.width+sx)*4+4),1,1,Math.round(r.x*16)+x,Math.round(r.y*16)+y);}}
const vertices=terrainVertices(map),pairs=new Map(),solid=new Map();for(const s of Object.values(manifest.tilesets||{})){const p=await load(s.image),frames=new Map();for(const t of s.tiles){const data=Buffer.alloc(16*16*4);for(let y=0;y<16;y++)for(let x=0;x<16;x++){const k=((t.y+y)*p.info.width+t.x+x)*4;for(let c=0;c<3;c++)data[(y*16+x)*4+c]=Math.round(p.data[k+c]*[169,179,156][c]/255);data[(y*16+x)*4+3]=p.data[k+3];}frames.set(t.corners.join(''),data);}pairs.set([s.lower,s.upper].sort().join('|'),{upper:s.upper,frames});if(!solid.has(s.lower))solid.set(s.lower,frames.get('0000'));if(!solid.has(s.upper))solid.set(s.upper,frames.get('1111'));}
for(let y=0;y<map.height;y++)for(let x=0;x<map.width;x++){let corners=cellCorners(vertices,map.width,x,y),k=[...new Set(corners)];if(k.length>2){const count=t=>corners.filter(c=>c===t).length;const [a,b]=k.sort((a,b)=>count(b)-count(a));corners=corners.map(c=>c===a||c===b?c:a);k=[a,b];if(!pairs.has(k.sort().join('|'))){corners=corners.map(()=>a);k=[a];}}const p=pairs.get(k.slice().sort().join('|')),tile=k.length===1?solid.get(k[0]):p?.frames.get(corners.map(c=>c===p.upper?1:0).join(''));if(tile)blit(tile,16,16,x*16,y*16);}
for(const d of map.decals||[]){const p=await load(manifest.decals[d.asset].image);blit(p.data,p.info.width,p.info.height,Math.round(d.x*16-p.info.width/2),Math.round(d.y*16-p.info.height/2));}
for(const o of [...map.objects].sort((a,b)=>a.y-b.y)){const m=manifest.objects[o.asset];let p=await load(m.image);if(o.flip)p=await sharp(A+m.image).flop().ensureAlpha().raw().toBuffer({resolveWithObject:true});blit(p.data,p.info.width,p.info.height,Math.round(o.x*16-m.anchor.x-.5),Math.round((o.y-(o.lift||0))*16-m.anchor.y-1));}
await sharp(raw,{raw:{width:W,height:H,channels:4}}).png().toFile(D+'current-map.png');
const pts=p=>p.map(([x,y])=>`${x*16},${y*16}`).join(' ');let overlay='';
function area(points,c){overlay+=`<polygon points="${pts(points)}" fill="${c}" fill-opacity=".20" stroke="${c}" stroke-width="3"/>`;}
area([[6,6],[74,6],[74,22],[48,22],[46,24],[32,24],[30,22],[6,22]],'#76ddb2');
area([[6,24],[32,24],[34,22],[46,22],[49,25],[49,43],[6,43]],'#f8d16e');
area([[50,24],[74,24],[74,44],[47,44],[47,58],[6,58],[6,45],[33,45],[33,43],[49,43]],'#83b9ff');
function line(p,c,w=6,dash=''){overlay+=`<polyline points="${pts(p)}" fill="none" stroke="${c}" stroke-width="${w}" ${dash?`stroke-dasharray="${dash}"`:''}/>`;}
line([[6,23],[30,23],[34,25],[36,25]],'#ff9c68');line([[44,25],[49,24],[61,23]],'#ff9c68');line([[66,23],[74,23]],'#ff9c68');
line([[7,43],[14,43]],'#ff9c68');line([[18,43],[33,43],[36,44]],'#ff9c68');line([[44,44],[48,43],[49,36]],'#ff9c68');line([[49,29],[49,25]],'#ff9c68');
line([[3.5,8],[3.5,23],[3.5,43],[8,45],[16,45],[27,45],[32,45]],'#5be6f0',10);line([[76.5,8],[76.5,23],[76.5,44],[69,45],[64,45],[49,45]],'#5be6f0',8);
for(const [id,x,y,w,h] of [['S1',40,23,6,4],['S2',40,45,6,5],['S3',50,33,3,4],['S4',33,23,3,4],['S5',63,23,3,4],['S6',16,42,2.4,3]]){overlay+=`<rect x="${(x-w/2)*16}" y="${(y-h/2)*16}" width="${w*16}" height="${h*16}" fill="#f8e6b0" fill-opacity=".65" stroke="#fff" stroke-width="2"/>`;label(id,x,y);}
function label(t,x,y){overlay+=`<text x="${x*16}" y="${y*16}" font-family="Arial" font-size="18" font-weight="bold" text-anchor="middle" fill="white" stroke="#102c29" stroke-width="5" paint-order="stroke">${t}</text>`;}
for(const [t,x,y]of [['UPPER +2',40,7],['GARDEN +2',20,9],['MIDDLE +1',40,39],['TRAINING +1',19,34],['MARKET 0',62,35],['LOWER 0',39,53],['W1',3.5,23],['W2',76.5,23],['W3',3.5,43],['B1',16,47],['B2',64,47]])label(t,x,y);
for(const n of map.npcs||[]){overlay+=`<circle cx="${n.x*16}" cy="${n.y*16}" r="5" fill="#fff" stroke="#201321" stroke-width="2"/>`;}
overlay+=`<circle cx="640" cy="576" r="9" fill="none" stroke="#fff" stroke-width="3"/>`;
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="960"><image width="1280" height="960" href="data:image/png;base64,${(await readFile(D+'current-map.png')).toString('base64')}"/>${overlay}</svg>`;
await writeFile(D+'annotated-plan.svg',svg);await sharp(Buffer.from(svg)).png().toFile(D+'annotated-plan.png');
await save(D+'audit.json',{mapId:map.id,width:map.width,height:map.height,spawn:map.spawn,objects:map.objects.length,npcs:map.npcs,portals:map.portals,assetIds:[...new Set(map.objects.map(o=>o.asset))],note:'Current source map and real sprites reconstructed at asset scale. Omits lighting, player and NPC sprites; white dots indicate actual NPC coordinates. Overlay proposals are not terrain implementation.'});
console.log('Saved current-map reconstruction, annotated plan and source backup.');
