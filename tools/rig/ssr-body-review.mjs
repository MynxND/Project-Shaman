// Full-body review with the shared composer: rows = head sets (+palette), columns = directions. Usage:
// node tools/rig/ssr-body-review.mjs <out.png> <dir,dir,...> "<parts|palette>;<parts|palette>"
import{readFile}from'node:fs/promises';import{readdirSync}from'node:fs';import{sharp}from'./body-eight-lib.mjs';
const S=await import('../../packages/shared/dist/index.js');const P='apps/client/public',parts={};
for(const f of readdirSync(P+'/assets/ssr/parts'))if(f!=='index.json'){const p=JSON.parse(await readFile(P+'/assets/ssr/parts/'+f,'utf8'));parts[p.id]=p;}
const pal=JSON.parse(await readFile(P+'/assets/ssr/palettes.json','utf8')).hair;
const[out,dirArg,rowArg]=process.argv.slice(2);const dirs=dirArg.split(','),rows=rowArg.split(';').map(r=>{const[ids,p]=r.split('|');return{ids:ids.split(','),palette:p||'silver'};});
async function prep(it,palette){let b=await readFile(P+it.url);if(it.palette){const cols=pal[palette].map(h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)));const{data,info}=await sharp(b).ensureAlpha().raw().toBuffer({resolveWithObject:true});for(let i=0;i<data.length;i+=4)if(data[i+3]){const k=S.ssrRampIndex(data[i]);if(k>=0)[data[i],data[i+1],data[i+2]]=cols[k];}b=await sharp(data,{raw:info}).png().toBuffer();}if(it.mirror)b=await sharp(b).flop().png().toBuffer();return b;}
const cells=[],W=72,H=104;
for(const[r,row]of rows.entries())for(const[c,d]of dirs.entries()){const items=S.ssrCompose(parts['body.medium-novice'],row.ids.map(i=>parts[i]),'idle',d,0);const L=[];for(const it of items)L.push({input:await prep(it,row.palette),left:it.x,top:it.y});
 const img=await sharp({create:{width:128,height:128,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(L).png().toBuffer();cells.push({input:await sharp(img).extract({left:28,top:8,width:W,height:H}).png().toBuffer(),left:c*W,top:r*H});}
const b=await sharp({create:{width:dirs.length*W,height:rows.length*H,channels:4,background:'#3c3a3a'}}).composite(cells).png().toBuffer();await sharp(b).resize(dirs.length*W*3,rows.length*H*3,{kernel:'nearest'}).toFile(out);console.log(out);
