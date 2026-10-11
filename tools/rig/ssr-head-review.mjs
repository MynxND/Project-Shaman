// Zoomed head review (Hair Layer Standard v1 check sheet): rows = reference, default hair (recoloured silver), each
// other hairstyle, and a face expression on the first new style; columns = 8 directions. Uses the shared composer.
import{readFile}from'node:fs/promises';import{readdirSync}from'node:fs';import{sharp}from'./body-eight-lib.mjs';
const S=await import('../../packages/shared/dist/index.js');const P='apps/client/public',parts={};
for(const f of readdirSync(P+'/assets/ssr/parts'))if(f!=='index.json'){const p=JSON.parse(await readFile(P+'/assets/ssr/parts/'+f,'utf8'));parts[p.id]=p;}
const pal=JSON.parse(await readFile(P+'/assets/ssr/palettes.json','utf8')).hair;
async function prep(it,palette){let b=await readFile(P+it.url);if(it.palette){const cols=pal[palette].map(h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)));const{data,info}=await sharp(b).ensureAlpha().raw().toBuffer({resolveWithObject:true});for(let i=0;i<data.length;i+=4)if(data[i+3]){const k=S.ssrRampIndex(data[i]);if(k>=0)[data[i],data[i+1],data[i+2]]=cols[k];}b=await sharp(data,{raw:info}).png().toBuffer();}if(it.mirror)b=await sharp(b).flop().png().toBuffer();return b;}
async function head(ids,d,palette='silver'){const items=S.ssrCompose(parts['body.medium-novice'],ids.map(i=>parts[i]),'idle',d,0).filter(i=>i.kind!=='body');const L=[];for(const it of items)L.push({input:await prep(it,palette),left:it.x,top:it.y});
 const c=await sharp({create:{width:128,height:128,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(L).png().toBuffer();return sharp(c).extract({left:36,top:6,width:56,height:50}).png().toBuffer();}
const styles=Object.values(parts).filter(p=>p.kind==='hairFront'&&p.id!=='hairFront.default').map(p=>p.id);
const rows=[[['headBase.default']],[['headBase.skin','hairFront.default']],...styles.map(s=>[['headBase.skin',s]]),...(styles[0]?[[['headBase.skin','face.cold',styles[0]]]]:[]),[['headBase.skin','hairFront.default'],'black'],...(styles[0]?[[['headBase.skin',styles[0]],'black'],[['headBase.skin',styles[0]],'brown'],[['headBase.skin','hairFront.default'],'red']]:[])];
const cells=[];for(const[r,[ids,palette]]of rows.entries())for(const[c,d]of S.SSR_DIRECTIONS.entries())cells.push({input:await head(ids,d,palette),left:c*56,top:r*50});
const out=process.argv[2]||'docs/design/ssr/head-review.png';const b=await sharp({create:{width:8*56,height:rows.length*50,channels:4,background:'#3c3a3a'}}).composite(cells).png().toBuffer();
await sharp(b).resize(8*56*3,rows.length*50*3,{kernel:'nearest'}).toFile(out);console.log(out);
