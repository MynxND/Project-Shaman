// Renders SSR compositions offline with the SAME shared composer the prototype uses (review images, no generation).
import{readFile}from'node:fs/promises';import{readdirSync}from'node:fs';import{sharp}from'./body-eight-lib.mjs';
const S=await import('../../packages/shared/dist/index.js');const P='apps/client/public',parts={};
for(const f of readdirSync(P+'/assets/ssr/parts'))if(f!=='index.json'){const p=JSON.parse(await readFile(P+'/assets/ssr/parts/'+f,'utf8'));parts[p.id]=p;}
const cache={};const img=async u=>cache[u]??=await readFile(P+u);
const PAL=JSON.parse(await readFile(P+'/assets/ssr/palettes.json','utf8')).hair;
// Palette layers: red channel = ramp index*32+16 -> palette colour (same rule as the prototype and shared ssrRampIndex).
async function recolor(buf,pal){const{data,info}=await sharp(buf).ensureAlpha().raw().toBuffer({resolveWithObject:true});const cols=PAL[pal].map(h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)));for(let i=0;i<data.length;i+=4){if(!data[i+3])continue;const k=S.ssrRampIndex(data[i]);if(k<0)continue;[data[i],data[i+1],data[i+2]]=cols[k];}return sharp(data,{raw:info}).png().toBuffer();}
async function cell(heads,action,dir,frame,pal='silver'){const items=S.ssrCompose(parts['body.medium-novice'],heads.map(h=>parts[h]),action,dir,frame);
 const layers=[];for(const it of items){let b=await img(it.url);if(it.palette)b=await recolor(b,pal);if(it.mirror)b=await sharp(b).flop().png().toBuffer();layers.push({input:b,left:it.x,top:it.y});}
 const c=await sharp({create:{width:128,height:128,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(layers).png().toBuffer();return sharp(c).extract({left:28,top:8,width:72,height:108}).png().toBuffer();}
const mode=process.argv[3]||'faces';
const rows=mode==='colors'
 ?[[['headBase.default'],S.SSR_DIRECTIONS,'silver'],[['headBase.skin','hairFront.default'],S.SSR_DIRECTIONS,'silver'],...['black','brown','gold','red','teal','blue','white'].map(p=>[['headBase.skin',p==='gold'||p==='blue'?'hairFront.side-sweep':'hairFront.default'],S.SSR_DIRECTIONS,p])]
 :[[['headBase.default'],S.SSR_DIRECTIONS,'silver'],[['headBase.skin','hairFront.side-sweep'],S.SSR_DIRECTIONS,'silver'],
 ...['cold','sad','closed'].map(e=>[['headBase.skin','face.'+e,'hairFront.side-sweep'],['south','south-east','east','west','south-west'],'silver'])];
const cells=[];for(const[r,[heads,dirs,pal]]of rows.entries())for(const d of dirs)cells.push({input:await cell(heads,'idle',d,0,pal),left:S.SSR_DIRECTIONS.indexOf(d)*72,top:r*108});
const out=process.argv[2]||'docs/design/ssr/prototype-composites.png';
const b=await sharp({create:{width:8*72,height:rows.length*108,channels:4,background:'#3c3a3a'}}).composite(cells).png().toBuffer();await sharp(b).resize(8*72*2,rows.length*108*2,{kernel:'nearest'}).toFile(out);console.log(out);
