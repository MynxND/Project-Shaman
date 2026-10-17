import {readFile,writeFile,rename,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {validateHeadOffsets,applyHeadOffsets,frameKey} from '../../../../tools/rig/armed-head-offsets.mjs';
const uiRoot=new URL('./',import.meta.url),pub=new URL('../../../../apps/client/public/',import.meta.url);
const digest=b=>createHash('sha256').update(b).digest('hex');
const json=async url=>JSON.parse(await readFile(url,'utf8'));
export function createHeadHandler({root=uiRoot,manifestName='manifest-imagegen-armed-draft.json',origin='http://127.0.0.1:8770',runtimeQuery=''}={}){
const draft=new URL('assets/character-v3/class-outfits/'+manifestName,pub);
let pending=Promise.resolve();
return async function handleHeadRequest(req,res,path){
 if(!path.startsWith('/head-'))return false;
 try{
  if(req.method==='GET'&&path==='/head-walk-regeneration-data'){
   const data=await readFile(new URL('../../walk-regeneration-2026-10-14/manifest.json',uiRoot));
   res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(data);return true;
  }
  if(req.method==='GET'&&/^\/head-walk-regeneration-image\/[a-z-]+\/[a-z-]+\/[0-7]$/.test(path)){
   // URL has a stable class/facing/frame identity even as other jobs complete.
   const parts=path.split('/'),classId=parts[2],facing=parts[3],slot=Number(parts[4]);
   const data=await json(new URL('../../walk-regeneration-2026-10-14/manifest.json',uiRoot));
   const clip=data.clips.find(c=>c.id===classId&&c.direction===facing),f=clip?.frames[slot];
   if(!f)throw Error('Regenerated clip not ready');const asset=data.assets[f.asset],png=await readFile(asset.path);
   const requested=new URL(req.url,'http://127.0.0.1').searchParams.get('sha');
   if(digest(png)!==f.sha256||(requested&&requested!==f.sha256))throw Error('Regenerated draft changed; reload');
   res.writeHead(200,{'Content-Type':'image/png','Cache-Control':'no-store'});res.end(png);return true;
  }
  if(req.method==='GET'&&['/head-walk-review','/head-walk-review-data'].includes(path)){
   const audit=new URL('../../walk-cycle-audit-2026-10-14/',uiRoot),html=path==='/head-walk-review';
   res.writeHead(200,{'Content-Type':html?'text/html; charset=utf-8':'application/json','Cache-Control':'no-store'});
   res.end(await readFile(new URL(html?'review.html':'review.json',audit)));return true;
  }
  if(req.method==='GET'&&/^\/head-walk-review-image\/\d+$/.test(path)){
   const audit=await json(new URL('../../walk-cycle-audit-2026-10-14/review.json',uiRoot));
   const asset=audit.assets[Number(path.split('/').at(-1))];if(!asset)throw Error('Unknown walk image');
   const png=await readFile(asset.path);if(digest(png)!==asset.sha256)throw Error('Walk source changed; rebuild audit');
   res.writeHead(200,{'Content-Type':'image/png','Cache-Control':'no-store'});res.end(png);return true;
  }
  if(req.method==='GET'&&(path==='/head-walk-repair'||/^\/head-repair-frame\/(?:(south|south-east|east|north-east|north|north-west|west|south-west)\/)?[0-7]$/.test(path))){
   const parts=path.split('/'),preview=path==='/head-walk-repair',direction=parts.length===4?parts[2]:'south',file=preview?'preview.html':'santet/'+direction+'/'+parts.at(-1)+'.png';
   res.writeHead(200,{'Content-Type':preview?'text/html; charset=utf-8':'image/png','Cache-Control':'no-store'});res.end(await readFile(new URL('../class-2-walk-repair-01/'+file,uiRoot)));return true;
  }
  if(req.method==='GET'&&path==='/head-walk-audit'){
   res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(await readFile(new URL('walk-audit/index.html',root)));return true;
  }
  if(req.method==='GET'&&['/head-editor','/head-editor.js','/head-tracking.mjs'].includes(path)){
   const file=path==='/head-editor'?'head-editor.html':path.slice(1);
   res.writeHead(200,{'Content-Type':path==='/head-editor'?'text/html; charset=utf-8':'text/javascript; charset=utf-8','Cache-Control':'no-store'});res.end(await readFile(new URL(file,uiRoot)));return true;
  }
  const bytes=await readFile(new URL('export-report.json',root)),report=JSON.parse(bytes),fingerprint=digest(bytes);
  const base=await json(new URL('assets/character-v3/body-eight-02/manifest.json',pub));
  if(req.method==='GET'&&path==='/head-data'){
   const manifest=await json(draft);
   const heads=base.frames.map(b=>({direction:b.direction,url:'/head-image/'+b.direction,neckPivot:b.neckPivot,headPivot:b.headPivot}));
   let saved=null,revision='empty';try{const raw=await readFile(new URL('user-head-offsets.json',root));revision=digest(raw);saved=validateHeadOffsets(JSON.parse(raw),report,fingerprint);}catch{}
   const frames=report.frames.map(f=>{
    const b=base.frames.find(b=>b.direction===f.direction),d=manifest.outfits.find(o=>o.branch===f.id).directions[f.direction];
    return {...f,key:frameKey(f),translation:{x:f.neck.x-b.neckPivot.x+d.headOffset.x-(b.neckPivot.x-b.headPivot.x),y:f.neck.y-b.neckPivot.y+d.headOffset.y-(b.neckPivot.y-b.headPivot.y)}};
   });
   let tracking=null;try{const p=await json(new URL('head-fit/proposals.json',root));if(p.sourceFingerprint===fingerprint)tracking=p;}catch{}
   try{const t=await json(new URL('head-fit/santet-transfer/report.json',root));if(tracking&&t.sourceFingerprint===fingerprint){
    const transfers=new Map(t.records.map(p=>[p.key,p]));
    tracking.proposals=tracking.proposals.map(p=>{const v=transfers.get(p.key);return v?{...p,dx:v.dx,dy:v.dy,accepted:!v.needsReview,reason:v.needsReview?'อ้างอิง Santet — คอเปลี่ยนรูป ต้องตรวจตำแหน่ง':'อ้างอิง Santet และตำแหน่งคอชุดนี้'}:p;});
   }}catch{}
   res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({sourceFingerprint:fingerprint,heads,frames,saved,runtimeQuery,tracking,revision}));return true;
  }
  if(req.method==='GET'&&path.startsWith('/head-image/')){
   const b=base.frames.find(b=>b.direction===path.slice(12));if(!b)throw Error('Unknown direction');
   const png=await readFile(new URL(b.headUrl.slice(1),pub));if(digest(png)!==b.headSha256)throw Error('Head hash changed');
   res.writeHead(200,{'Content-Type':'image/png','Cache-Control':'no-store'});res.end(png);return true;
  }
  if(req.method==='POST'&&['/head-save','/head-apply'].includes(path)){
   if(req.headers.origin!==origin) {res.writeHead(403);res.end('Origin refused');return true;}
   let body='';for await(const c of req){body+=c;if(body.length>400000)throw Error('Too large');}
   const request=JSON.parse(body),packet=validateHeadOffsets(request,report,fingerprint);let revision;
   const work=pending.then(async()=>{
    // Recheck provenance after waiting for another save; serialize disk mutations.
    if(digest(await readFile(new URL('export-report.json',root)))!==fingerprint)throw Error('Source changed');
    let previous=null,currentRevision='empty';try{previous=await readFile(new URL('user-head-offsets.json',root));currentRevision=digest(previous);}catch(e){if(e.code!=='ENOENT')throw e;}
    if(request.baseRevision!==currentRevision)throw Error('ร่างนี้เป็นรุ่นเก่า บันทึกถูกระงับเพื่อป้องกันทับงาน กรุณาดาวน์โหลด JSON เก็บก่อน แล้วโหลดข้อมูลล่าสุด');
    await mkdir(new URL('head-history/',root),{recursive:true});
    if(previous)await writeFile(new URL('head-history/offsets-before-save-'+Date.now()+'.json',root),previous);
    if(path==='/head-apply'){
     const original=await readFile(draft),manifest=JSON.parse(original);applyHeadOffsets(manifest,report,packet);
     await mkdir(new URL('head-history/',root),{recursive:true});
     await writeFile(new URL('head-history/manifest-'+Date.now()+'.json',root),original);
     await writeFile(new URL(manifestName+'.tmp',new URL('./',draft)),JSON.stringify(manifest,null,2));
     await rename(new URL(manifestName+'.tmp',new URL('./',draft)),draft);
    }
    await writeFile(new URL('user-head-offsets.json.tmp',root),JSON.stringify(packet,null,2));
    await rename(new URL('user-head-offsets.json.tmp',root),new URL('user-head-offsets.json',root));
    revision=digest(await readFile(new URL('user-head-offsets.json',root)));
   });pending=work.catch(()=>{});await work;
   res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({saved:packet.offsets.length,applied:path==='/head-apply',revision}));return true;
  }
  res.writeHead(404);res.end();return true;
 }catch(e){res.writeHead(400,{'Content-Type':'text/plain; charset=utf-8'});res.end(e.message);return true;}
};
}
export const handleHeadRequest=createHeadHandler();
