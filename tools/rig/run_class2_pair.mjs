// Resumable production queue. Never resubmits a known/ambiguous paid request.
import { readFile, writeFile, access, mkdir, rename } from 'node:fs/promises';
import { spawn } from 'node:child_process';
const root='docs/design/equipment/class-2-production-01';
const queue=JSON.parse(await readFile(`${root}/queue.json`,'utf8'));
const exists=async p=>access(p).then(()=>true,()=>false);
const run=(file,args)=>new Promise((ok,bad)=>{const p=spawn(file,args,{windowsHide:true,stdio:['ignore','pipe','pipe']});let error='';p.stderr.on('data',b=>error+=b);p.on('error',bad);p.on('exit',code=>code===0?ok():bad(Error(error.slice(-800))));});
const rpc=async(tool,input,output)=>run('powershell',['-NoProfile','-File','tools/rig/hair_pixellab.ps1','-Action','call','-Tool',tool,'-ArgumentsFile',input,'-OutputFile',output]);
const read=async p=>JSON.parse(await readFile(p,'utf8'));
const txt=r=>r.result?.content?.filter(x=>x.type==='text').map(x=>x.text).join('\n')??'';
let spent=0,maxConcurrency=16;const pending=[],done=[];
for(const j of queue.jobs){
 const prefix=j.path.replace(/-request.json$/,'');j.prefix=prefix;
 if(await exists(prefix+'-submit.json')){
  const r=await read(prefix+'-submit.json'),t=txt(r),id=/job_id:\s*([a-f0-9-]{36})/.exec(t)?.[1],cost=Number(/cost:\s*(\d+) generations/.exec(t)?.[1]);
  if(!id||!cost)throw Error(`Ambiguous prior receipt: ${prefix}`);
  j.jobId=id;j.cost=cost;spent+=cost;
 }
 if(await exists(prefix+'-complete.json'))done.push(j);
 else pending.push(j);
}
const save=()=>writeFile(`${root}/progress.json`,JSON.stringify({spent,committedGenerations:spent,completedCharged:done.reduce((s,j)=>s+j.cost,0),maxConcurrency,cap:queue.creditCap,total:queue.jobs.length,completed:done.length,running:pending.filter(j=>j.jobId).map(j=>({id:j.id,action:j.action,direction:j.direction,jobId:j.jobId})),updated:new Date().toISOString()},null,2));
while(pending.length){
 const beforeDone=done.length;
 for(const j of pending){
  if(j.jobId)continue;
  if(pending.filter(x=>x.jobId).length>=maxConcurrency)break;
  if(spent+j.estimatedGenerations>queue.creditCap)throw Error('Credit cap reached; no further submissions');
  try{await rpc('animate_with_skeleton_v3',j.path,j.prefix+'-submit.json');}
  catch(error){
   const response=await exists(j.prefix+'-submit.json')?txt(await read(j.prefix+'-submit.json')):'';
   const rejected=/rate limit exceeded \((\d+)\/(\d+) jobs\)/i.exec(response);
   if(!rejected||/job_id:/.test(response))throw error;
   // Definitive admission refusal: no job/charge exists. Preserve receipt, obey provider limit, never retry a paid job.
   maxConcurrency=Number(rejected[2]);await rename(j.prefix+'-submit.json',j.prefix+`-admission-${Date.now()}.json`);await save();console.log(`Provider concurrency ${maxConcurrency}; admission uncharged`);break;
  }
  const t=txt(await read(j.prefix+'-submit.json'));j.jobId=/job_id:\s*([a-f0-9-]{36})/.exec(t)?.[1];j.cost=Number(/cost:\s*(\d+) generations/.exec(t)?.[1]);
  if(!j.jobId||!j.cost)throw Error(`Unknown submission ${j.prefix}; stop without retry`);
  spent+=j.cost;await save();console.log(`Submitted ${j.id}/${j.action}/${j.direction}; ${j.cost}, total${spent}`);
  if(spent>queue.creditCap)throw Error('Provider cost exceeded cap; stopping');
 }
 for(const j of [...pending].filter(j=>j.jobId)){
  const poll=j.prefix+'-poll.json';await writeFile(poll,JSON.stringify({job_id:j.jobId}));
  await rpc('get_image',poll,j.prefix+'-result.json');
  const t=txt(await read(j.prefix+'-result.json'));
  if(/status:\s*failed/i.test(t))throw Error(`Paid job failed: ${j.prefix}; no retry`);
  if(!/status:\s*completed/i.test(t))continue;
  const raw=`${root}/${j.id}/${j.action}/raw`;await mkdir(raw,{recursive:true});
  await Promise.all(Array.from({length:j.frames},(_,i)=>run('powershell',['-NoProfile','-File','scripts/pixellab-download.ps1','-Url',`https://api.pixellab.ai/mcp/images/${j.jobId}/download?index=${i}`,'-OutFile',`${raw}/${j.direction}-${i}.png`])));
  await writeFile(j.prefix+'-complete.json',JSON.stringify({jobId:j.jobId,cost:j.cost,frames:j.frames,completed:new Date().toISOString()},null,2));
  done.push(j);pending.splice(pending.indexOf(j),1);await save();console.log(`Downloaded ${j.id}/${j.action}/${j.direction}; ${done.length}/${queue.jobs.length}`);
 }
 if(pending.length&&done.length===beforeDone)await new Promise(r=>setTimeout(r,20000));
}
await save();console.log(`Production complete; ${done.length} clips; ${spent} generations`);
await run('node',['tools/rig/publish_class2_pair.mjs']);
