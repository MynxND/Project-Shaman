const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{pathToFileURL}=require('node:url'),{execFileSync}=require('node:child_process'),sharp=require('sharp');
const root=__dirname,workspace=path.resolve(root,'../../../..'),pub=path.join(workspace,'apps/client/public'),read=p=>JSON.parse(fs.readFileSync(p));
const hairs=[['natural-short','ผมสั้นธรรมดา','hairFront.default'],['golden-part','แสกข้างยาว','hairFront.golden-part'],['kid-clean','แสกกลางสั้น','hairFront.kid-clean'],['face-fit-short','หน้าม้าปัดเต็ม','hairFront.face-fit-short'],['eye-veil','หน้าม้าปิดตา','hairFront.eye-veil'],['korean-wolf','Wolf Cut','hairFront.korean-wolf'],['swept-spikes','ผมตั้งปัดหลัง','hairFront.swept-spikes'],['curtain-gold','แสกกลางกรอบหน้า','hairFront.curtain-gold']];
const faces=[['neutral','ปกติ'],['cold','เย็นชา'],['sad','เศร้า'],['closed','หลับตา'],['violet-sharp','หน้าคม · ตาสีม่วง'],['teal-soft','หน้าละมุน · ตาฟ้าอมเขียว'],['cold-detached','เย็นชา · เบื่อโลก']];
async function run(){
 const {ssrCompose,ssrRampIndex}=await import(pathToFileURL(path.join(workspace,'packages/shared/dist/sprite-rig.js')).href);
 const originalOutfits=read(path.join(pub,'assets/character-v3/class-outfits/manifest-imagegen-detail-draft.json')).outfits,base=read(path.join(pub,'assets/character-v3/body-eight-02/manifest.json')).frames;
 const walkRoot=path.join(workspace,'docs/design/equipment/right-walk-2026-10-16'),candidate=path.join(walkRoot,'candidate-manifest.json');
 if(fs.existsSync(path.join(walkRoot,'MOTION_REJECTED.json')))throw Error('Walk candidates rejected: arm/leg motion and assembled costume require visual review before exporting preview/downloads.');
 const outfits=fs.existsSync(candidate)?read(candidate).outfits:originalOutfits;
 const ids=read(path.join(pub,'assets/ssr/parts/index.json')),parts=Object.fromEntries(ids.map(id=>[id,read(path.join(pub,'assets/ssr/parts',id+'.json'))])),palette=read(path.join(pub,'assets/ssr/palettes.json')).hair.white.map(h=>h.slice(1).match(/../g).map(x=>parseInt(x,16)));
 fs.mkdirSync(path.join(root,'heads'),{recursive:true});const cache=new Map();
 for(const [hair,,partId]of hairs)for(const [face]of faces)for(const b of base){
  const items=ssrCompose(parts['body.medium-novice'],[parts['headBase.skin'],...(face==='neutral'?[]:[parts['face.'+face]]),parts[partId]],'idle',b.direction,0).filter(it=>it.kind!=='body');
  const composites=[];
  for(const it of items){const key=it.url+'|'+it.mirror+'|'+!!it.palette;let img=cache.get(key);if(!img){let pipeline=sharp(path.join(pub,it.url));if(it.mirror)pipeline=pipeline.flop();const raw=await pipeline.ensureAlpha().raw().toBuffer({resolveWithObject:true});if(it.palette)for(let i=0;i<raw.data.length;i+=4){if(!raw.data[i+3])continue;const index=ssrRampIndex(raw.data[i]);if(index>=0)raw.data.set(palette[index],i);}img={data:raw.data,info:raw.info};cache.set(key,img);}
   const left=Math.round(it.x),top=Math.round(it.y),sx=Math.max(0,-left),sy=Math.max(0,-top),width=Math.min(img.info.width-sx,128-Math.max(0,left)),height=Math.min(img.info.height-sy,128-Math.max(0,top));if(width<=0||height<=0)continue;
   composites.push({input:await sharp(img.data,{raw:img.info}).extract({left:sx,top:sy,width,height}).png().toBuffer(),left:Math.max(0,left),top:Math.max(0,top)});
  }
  const head=await sharp({create:{width:128,height:128,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(composites).png().toBuffer();fs.writeFileSync(path.join(root,'heads',`${hair}--${face}--${b.direction}.png`),head);
  if(b.direction==='east')await sharp(head).flop().png().toFile(path.join(root,'heads',`${hair}--${face}--east-mirror.png`));
 }
 const fingerprint=crypto.createHash('sha256').update(JSON.stringify({outfits,base,hairs,faces,parts:Object.values(parts),composer:fs.readFileSync(path.join(workspace,'packages/shared/dist/sprite-rig.js'),'utf8'),palette})).digest('hex');
 const originalFingerprint=crypto.createHash('sha256').update(JSON.stringify({outfits:originalOutfits,base,hairs,faces,parts:Object.values(parts),composer:fs.readFileSync(path.join(workspace,'packages/shared/dist/sprite-rig.js'),'utf8'),palette})).digest('hex');
 const data={version:1,fingerprint,originalFingerprint,bodyBase:'../../../../apps/client/public/assets/character-v3/class-outfits/',hairs,faces,base,outfits,originalOutfits};fs.writeFileSync(path.join(root,'preview-data.js'),'window.OUTFIT_PREVIEW_DATA='+JSON.stringify(data)+';');
 if(fs.existsSync(candidate))for(const outfit of outfits){const dest=path.join(root,'walk-candidates',outfit.id);fs.mkdirSync(dest,{recursive:true});for(const d of ['east','west'])for(let n=0;n<20;n++)fs.copyFileSync(path.join(walkRoot,outfit.id,`${d}-${n}.png`),path.join(dest,`${d}-${n}.png`));}
 fs.mkdirSync(path.join(root,'downloads'),{recursive:true});
 const python=process.env.PREVIEW_PYTHON||'C:/Users/nikza/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe';
 const code="import sys,pathlib,zipfile,json\nsrc=pathlib.Path(sys.argv[1]);dst=pathlib.Path(sys.argv[2]);ids=json.loads(sys.argv[3]);walk=pathlib.Path(sys.argv[4])\nfor name in ids:\n for variant in ['original','new']:\n  changed=variant=='new' and (walk/name/'east-0.png').exists()\n  with zipfile.ZipFile(dst/(name+('-original' if variant=='original' else '')+'.zip'),'w',zipfile.ZIP_DEFLATED) as z:\n   for f in sorted((src/name).rglob('*')):\n    if not f.is_file():continue\n    if changed and f.parent.name=='walk' and f.name.startswith(('east-','west-','hands-east-','hands-west-')):continue\n    z.write(f,str(f.relative_to(src)))\n   if changed:\n    for direction in ['east','west']:\n     for frame in range(20):\n      f=walk/name/(direction+'-'+str(frame)+'.png');z.write(f,name+'/walk/'+f.name)\n   z.writestr(name+'/README.txt','Headless128 PNGs,8 directions. New east/west walk:20 frames each, west exact mirror. Other clips original.25fps provisional. Preview head edits not baked.' if changed else 'Original headless128 PNGs, all8 directions, unchanged. Preview head edits not baked.')\n";
 execFileSync(python,['-c',code,path.join(pub,'assets/character-v3/class-outfits'),path.join(root,'downloads'),JSON.stringify(outfits.map(o=>o.id)),walkRoot]);
 for(const o of outfits)fs.writeFileSync(path.join(root,'downloads',o.id+'.json'),JSON.stringify(o,null,2));
 const artifact=path.join(workspace,'artifacts/headless-outfits-2026-10-16');fs.mkdirSync(artifact,{recursive:true});for(const f of ['preview.html','preview.js','preview.css'])fs.copyFileSync(path.join(root,f),path.join(artifact,f));
 fs.cpSync(path.join(root,'heads'),path.join(artifact,'heads'),{recursive:true});fs.cpSync(path.join(root,'downloads'),path.join(artifact,'downloads'),{recursive:true});if(fs.existsSync(path.join(root,'walk-candidates')))fs.cpSync(path.join(root,'walk-candidates'),path.join(artifact,'walk-candidates'),{recursive:true});data.bodyBase='latest/';fs.writeFileSync(path.join(artifact,'preview-data.js'),'window.OUTFIT_PREVIEW_DATA='+JSON.stringify(data)+';');
 console.log({heads:hairs.length*faces.length*base.length,outfits:outfits.length,fingerprint});
}
run().catch(e=>{console.error(e);process.exitCode=1});
