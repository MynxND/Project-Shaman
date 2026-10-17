#!/usr/bin/env node
// Pose Studio local server: web UI + JSON API + one-at-a-time GPU queue.
// node tools/pose-studio/server.mjs  ->  http://127.0.0.1:8790/
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {PORT,root,jobsDir,CHARACTERS,DIRECTIONS,idlePaths,character} from './lib/common.mjs';
import {ACTIONS} from './lib/prepare.mjs';
import {comfyAlive} from './lib/comfy.mjs';
import {listJobs,getJob,saveJob,createJob,generate,processJob,setSelection,review,removeJob} from './lib/jobs.mjs';

const uiDir=resolve(root,'tools/pose-studio/ui');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.gif':'image/gif','.json':'application/json; charset=utf-8','.txt':'text/plain; charset=utf-8'};
const queue=[];let running=null;const live=new Map();

async function pump(){
  if(running||!queue.length)return;
  const id=queue.shift();const job=await getJob(id).catch(()=>null);if(!job||job.status!=='queued')return pump();
  const ctrl=new AbortController();running={id,ctrl};
  try{await generate(job,{signal:ctrl.signal,onUpdate:j=>live.set(j.id,{status:j.status,progress:j.progress})});}
  finally{live.delete(id);running=null;pump();}
}
// Resume queued jobs and mark interrupted ones after a restart.
for(const j of await listJobs()){if(j.status==='queued')queue.push(j.id);else if(['generating','processing'].includes(j.status)){j.status='failed';j.error='server restarted during the run; re-queue it';j.progress=null;await saveJob(j);}}
queue.reverse();pump();

const send=(res,code,body)=>{res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(body));};
const body=req=>new Promise((ok,bad)=>{let s='';req.on('data',c=>{s+=c;if(s.length>1e6)req.destroy();});req.on('end',()=>{try{ok(s?JSON.parse(s):{});}catch(e){bad(e);}});});
const withLive=j=>({...j,...(live.get(j.id)||{}),queuePosition:queue.indexOf(j.id)>=0?queue.indexOf(j.id)+1:null});

async function file(res,path,base){
  const p=resolve(path);if(!p.startsWith(resolve(base)+sep)||!types[extname(p)]){res.writeHead(404);return res.end();}
  try{const b=await readFile(p);res.writeHead(200,{'Content-Type':types[extname(p)],'Cache-Control':'no-store'});res.end(b);}catch{res.writeHead(404);res.end();}
}

createServer(async(req,res)=>{
  const url=new URL(req.url,'http://127.0.0.1'),p=decodeURIComponent(url.pathname),m=req.method;
  try{
    if(p==='/'&&m==='GET')return file(res,resolve(uiDir,'index.html'),uiDir);
    if(p.startsWith('/ui/'))return file(res,resolve(uiDir,p.slice(4)),uiDir);
    if(p==='/font/torsilp.ttf'){const b=await readFile(resolve(root,'apps/client/src/app/fonts/TorsilpThaiMai.ttf'));res.writeHead(200,{'Content-Type':'font/ttf','Cache-Control':'max-age=86400'});return res.end(b);}
    if(p.startsWith('/jobs/'))return file(res,resolve(jobsDir,p.slice(6)),jobsDir);
    if(p.startsWith('/idle/')){const[,,id,dir]=p.split('/');const c=character(id);const dirName=dir.replace(/\.png$/,'');if(!DIRECTIONS.includes(dirName))throw new Error('bad direction');return file(res,idlePaths(c,dirName).withHead,root);}
    if(p==='/api/status'){const comfy=await comfyAlive();return send(res,200,{server:'ok',comfy:comfy?{ok:true,devices:comfy.devices?.map(d=>({name:d.name,vramFreeGB:+(d.vram_free/2**30).toFixed(1),vramTotalGB:+(d.vram_total/2**30).toFixed(1)})),ramFreeGB:+(comfy.system?.ram_free/2**30).toFixed(1)}:{ok:false,hint:'start C:\\ComfyUI\\ComfyUI_windows_portable\\run_nvidia_gpu.bat'},running:running?.id||null,queue:[...queue]});}
    if(p==='/api/catalog')return send(res,200,{characters:CHARACTERS.map(c=>({id:c.id,name:c.name})),directions:DIRECTIONS,actions:ACTIONS});
    if(p==='/api/jobs'&&m==='GET'){let js=await listJobs();const st=url.searchParams.get('status');if(st)js=js.filter(j=>j.status===st);return send(res,200,js.map(withLive));}
    if(p==='/api/jobs'&&m==='POST'){const job=await createJob(await body(req));queue.push(job.id);pump();return send(res,201,withLive(job));}
    const mm=p.match(/^\/api\/jobs\/([\w.-]+)(?:\/(\w+))?$/);
    if(mm){const[,id,act]=mm;
      if(!act&&m==='GET')return send(res,200,withLive(await getJob(id)));
      if(!act&&m==='DELETE'){const i=queue.indexOf(id);if(i>=0)queue.splice(i,1);return send(res,200,await removeJob(id));}
      if(act==='select'&&m==='POST')return send(res,200,await setSelection(id,(await body(req)).selected));
      if(act==='reprocess'&&m==='POST')return send(res,200,await processJob(await getJob(id)));
      if(act==='review'&&m==='POST')return send(res,200,await review(id,await body(req)));
      if(act==='retry'&&m==='POST'){const j=await getJob(id);if(!['failed','cancelled','rejected'].includes(j.status))throw new Error(`cannot retry a ${j.status} job`);const b=await body(req);const n=await createJob({character:j.character,direction:j.direction,action:j.action,custom:j.custom,prompt:b.prompt||j.prompt,...j.params,seed:b.seed??undefined,requestedBy:'retry'});queue.push(n.id);pump();return send(res,201,withLive(n));}
      if(act==='cancel'&&m==='POST'){const i=queue.indexOf(id);if(i>=0){queue.splice(i,1);const j=await getJob(id);j.status='cancelled';await saveJob(j);return send(res,200,j);}if(running?.id===id){running.ctrl.abort();return send(res,200,{...(await getJob(id)),status:'cancelling'});}throw new Error('job is not queued or running');}
    }
    send(res,404,{error:'not found'});
  }catch(e){send(res,400,{error:String(e.message||e)});}
}).listen(PORT,'127.0.0.1',()=>console.log(`Pose Studio http://127.0.0.1:${PORT}/  (ComfyUI ${process.env.COMFY_URL||'http://127.0.0.1:8188'})`));
