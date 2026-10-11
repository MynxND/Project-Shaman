import assert from'node:assert/strict';import{readFile,writeFile,readdir,mkdir}from'node:fs/promises';
import{sharp,rgba,json,hash,save}from'./body-eight-lib.mjs';
const P='apps/client/public',root=P+'/assets/ssr/candidates/',pal=await json(P+'/assets/ssr/palettes.json'),report=[];
const rgb=s=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16)),silver=pal.hair.silver.map(rgb),white=pal.hair.white.map(rgb);
for(const folder of await readdir(root,{withFileTypes:true})){
 if(!folder.isDirectory())continue;const dir=root+folder.name+'/';let m;try{m=await json(dir+'manifest.json');}catch{continue;}
 const records=[...(m.files||[]),...(m.details||[])],files=[];
 for(const f of records){
  if(!/(^|-)silver(?=-|$)/.test(f.id))continue;
  const replace=(s,color)=>s.replace(/(^|-)silver(?=-|$)/,(_,p)=>p+color),gold=records.find(r=>r.id===replace(f.id,'gold')),black=records.find(r=>r.id===replace(f.id,'black'));
  if(!gold||!black)throw Error('Missing comparison palette: '+folder.name+'/'+f.id);
  const source=await readFile(P+f.url),a=await rgba(source),g=await rgba(await readFile(P+gold.url)),b=await rgba(await readFile(P+black.url)),out=Buffer.from(a);
  assert.equal(hash(source),f.sha256);assert.equal(a.length,g.length);assert.equal(a.length,b.length);
  let changed=0;
  for(let i=0;i<a.length;i+=4){
   assert.equal(a[i+3],g[i+3]);assert.equal(a[i+3],b[i+3]);
   if(!g.subarray(i,i+4).equals(b.subarray(i,i+4))){
    const index=silver.findIndex(c=>c.every((v,j)=>v===a[i+j]));assert(index>=0,'Non-ramp pixel changed between palettes: '+f.id);
    white[index].forEach((v,j)=>out[i+j]=v);changed++;
   }
  }
  const meta=await sharp(source).metadata(),bytes=await sharp(out,{raw:{width:meta.width,height:meta.height,channels:4}}).png().toBuffer(),id=replace(f.id,'white'),url=f.url.replace(f.id+'.png',id+'.png');
  await writeFile(P+url,bytes);files.push({id,url,sha256:hash(bytes),width:meta.width,height:meta.height,changedPixels:changed,sourceSha256:f.sha256});
 }
 if(files.length){await save(dir+'white-manifest.json',{version:'white-hair-preview/1',defaultPalette:'white',files,credits:0,scope:'New white preview files only; existing approved images and manifests unchanged. Recolours only pixels demonstrated to change between black/gold; fixed accents and skin unchanged.'});report.push({set:folder.name,files:files.length,changedPixels:files.reduce((a,f)=>a+f.changedPixels,0)});}
}
await mkdir('docs/design/ssr/white-hair-default-01/',{recursive:true});await save('docs/design/ssr/white-hair-default-01/report.json',{credits:0,sets:report});console.log(report);
