const fs=require('node:fs'),path=require('node:path'),sharp=require('sharp'),crypto=require('node:crypto');
const root=__dirname,size=128;
async function run(){
 const src=await sharp(path.join(root,'source.png')).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const grid=Buffer.alloc(size*size*4);
 // Recover enlarged pixel clusters by area voting, rather than point-sampling a detailed illustration.
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const counts=new Map();let opaque=0,total=0;
  for(let sy=Math.floor(y*src.info.height/size);sy<Math.floor((y+1)*src.info.height/size);sy++)for(let sx=Math.floor(x*src.info.width/size);sx<Math.floor((x+1)*src.info.width/size);sx++){
   total++;const i=(sy*src.info.width+sx)*4;if(src.data[i+3]<200)continue;opaque++;
   const rgb=[0,1,2].map(c=>Math.min(255,Math.round(src.data[i+c]/8)*8));const key=rgb.join(',');counts.set(key,(counts.get(key)||0)+1);
  }
  if(opaque<total*.5)continue;
  const best=[...counts].sort((a,b)=>b[1]-a[1])[0][0].split(',').map(Number);const i=(y*size+x)*4;grid.set([...best,255],i);
 }
 // No dithering: reduce near-identical provider colors without adding scattered pixels.
 const palette=['#191923','#292833','#383743','#4a4957','#605e6c','#f9c58c','#eab07a','#d99764','#b9764f','#8c5039','#393744','#494651','#5b5660','#6b626a','#6c3034','#8d3c3d','#aa4b47','#c05a50','#4b3030','#684333','#885a41','#b37c52','#fff0c9','#e29a20','#a36312','#f4d09b'].map(h=>h.slice(1).match(/../g).map(v=>parseInt(v,16)));
 const full=Buffer.from(grid);
 for(let i=0;i<full.length;i+=4){if(!full[i+3])continue;let best=palette[0],dist=Infinity;for(const p of palette){const d=p.reduce((s,c,k)=>s+(full[i+k]-c)**2,0);if(d<dist){dist=d;best=p;}}full.set(best,i);}
 for(let i=0;i<full.length;i+=4)if(!full[i+3])full.fill(0,i,i+4);
 await sharp(full,{raw:{width:size,height:size,channels:4}}).png().toFile(path.join(root,'front.png'));
 await sharp(full,{raw:{width:size,height:size,channels:4}}).resize(512,512,{kernel:'nearest'}).png().toFile(path.join(root,'front-4x.png'));
 const colors=new Set();for(let i=0;i<full.length;i+=4)if(full[i+3])colors.add(full.subarray(i,i+3).toString('hex'));
 const support=await sharp(path.join(root,'hidden-head-source.png')).resize(128,128,{kernel:'nearest'}).ensureAlpha().raw().toBuffer();
 const layers=Object.fromEntries(['body','head','face','hair'].map(k=>[k,Buffer.alloc(full.length)]));
 let hiddenPixels=0;
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const i=(y*size+x)*4;if(!full[i+3])continue;
  let layer='body';
  if(y<48){layer='head';const dark=full[i]<140&&full[i+1]<125;
   if(dark&&y<43&&(y<33||x<54||x>72||(x>=60&&x<=64&&y<37)))layer='hair';
   else if((y>=33&&y<=39&&x>=54&&x<=72)||(y>=41&&y<=43&&x>=60&&x<=65))layer='face';
   if(support[i+3]>=200&&support[i]>140){
    let best=palette[5],dist=Infinity;for(const p of palette.slice(5,10)){const d=p.reduce((s,c,k)=>s+(support[i+k]-c)**2,0);if(d<dist){best=p;dist=d;}}
    layers.head.set([...best,255],i);hiddenPixels++;
   }
  }
  full.copy(layers[layer],i,i,i+4);
 }
 const recomposed=Buffer.alloc(full.length);
 for(const name of ['body','head','face','hair']){for(let i=0;i<full.length;i+=4)if(layers[name][i+3])layers[name].copy(recomposed,i,i,i+4);await sharp(layers[name],{raw:{width:size,height:size,channels:4}}).png().toFile(path.join(root,name+'.png'));}
 let differentBytes=0;for(let i=0;i<full.length;i++)if(full[i]!==recomposed[i])differentBytes++;
 if(differentBytes)throw Error('Layer reconstruction differs: '+differentBytes);
 await sharp(recomposed,{raw:{width:size,height:size,channels:4}}).png().toFile(path.join(root,'recomposed.png'));
 const panels=[];for(const name of ['front','body','head','face','hair','recomposed'])panels.push({input:await sharp(path.join(root,name+'.png')).resize(384,384,{kernel:'nearest'}).png().toBuffer(),left:panels.length*384,top:0});
 await sharp({create:{width:2304,height:384,channels:4,background:'#71838b'}}).composite(panels).png().toFile(path.join(root,'layer-review.png'));
 const report={size,sourceDimensions:{width:src.info.width,height:src.info.height},method:'128-grid area vote, 8-channel-value bins, authored26-color palette, zero dithering',opaqueColors:colors.size,differentBytes,hiddenPixels,sha256:crypto.createHash('sha256').update(full).digest('hex')};
 fs.writeFileSync(path.join(root,'manifest.json'),JSON.stringify({version:'front-sprite-study/2',size,layers:['body','head','face','hair'],anchors:{neck:{x:64,y:48},foot:{x:64,y:123}},scope:'offline south idle only',status:'review candidate; previous visual rejection not overridden',hiddenBase:'ImageGen support pixels; not recovered original anatomy'},null,2));
 fs.writeFileSync(path.join(root,'validation.json'),JSON.stringify(report,null,2));
 fs.writeFileSync(path.join(root,'validation.js'),'window.spriteValidation='+JSON.stringify(report)+';');console.log(report);
}
run().catch(e=>{console.error(e);process.exitCode=1});
