#!/usr/bin/env node
// Pose Studio CLI for humans, Codex and Claude. Talks to the local server (single GPU queue).
// Usage: node tools/pose-studio/cli.mjs <command> [--flags]   (see tools/pose-studio/README.md)
import {PORT,CHARACTERS,DIRECTIONS} from './lib/common.mjs';
import {ACTIONS} from './lib/prepare.mjs';

const base=`http://127.0.0.1:${PORT}`;
const [cmd,...rest]=process.argv.slice(2);
const flags={},args=[];
for(let i=0;i<rest.length;i++){const a=rest[i];if(a.startsWith('--')){const k=a.slice(2),v=rest[i+1]&&!rest[i+1].startsWith('--')?rest[++i]:'true';flags[k]=v;}else args.push(a);}
const bool=v=>v===undefined?undefined:!['false','0','no'].includes(String(v));
const num=v=>v===undefined?undefined:Number(v);

async function api(path,opts={}){
  let r;try{r=await fetch(base+path,{...opts,headers:{'Content-Type':'application/json'}});}
  catch{fail(`Pose Studio server is not running. Start it with: node tools/pose-studio/server.mjs`);}
  const j=await r.json().catch(()=>({}));if(!r.ok)fail(j.error||`HTTP ${r.status}`);return j;
}
function fail(m){console.error(`error: ${m}`);process.exit(1);}
const print=v=>console.log(flags.json?JSON.stringify(v,null,2):typeof v==='string'?v:JSON.stringify(v,null,2));
const summary=j=>`${j.id}  [${j.status}]${j.progress?.phase?` ${j.progress.phase}`:''}${j.qa?`  QA:${j.qa.status}`:''}${j.error?`  error: ${j.error}`:''}`;

const help=`Pose Studio CLI
  characters                         list characters, directions and action presets
  status                             server + ComfyUI health and queue
  generate --character <id> --direction <dir|all> --action <preset> [--custom "motion text"]
           [--frames 8] [--length 39] [--seed N] [--loop true|false] [--turbo true|false] [--fps 16] [--notes "..."]
  jobs [--status review]             list jobs
  show <jobId>                       job detail incl. QA checks and output paths
  wait <jobId...>                    block until jobs leave queued/generating/processing
  select <jobId> --frames 0,4,8,...  choose which video frames become the sprite (re-runs QA)
  reprocess <jobId>                  rebuild sprite/QA from saved raw frames (no GPU)
  approve <jobId> [--note "..."]     human visual approval -> copies to docs/design/pose-studio/approved
  reject <jobId> [--note "..."]
  cancel <jobId>
Add --json for machine-readable output. Web UI: ${base}/`;

switch(cmd){
  case 'characters':print({characters:CHARACTERS.map(c=>({id:c.id,name:c.name})),directions:DIRECTIONS,actions:Object.fromEntries(Object.entries(ACTIONS).map(([k,a])=>[k,{label:a.label,loop:a.loop,frames:a.frames,length:a.length}]))});break;
  case 'status':print(await api('/api/status'));break;
  case 'generate':{
    if(!flags.character||!flags.direction)fail('--character and --direction are required');
    const dirs=flags.direction==='all'?DIRECTIONS:flags.direction.split(',');
    const out=[];for(const direction of dirs){const j=await api('/api/jobs',{method:'POST',body:JSON.stringify({character:flags.character,direction,action:flags.action,custom:flags.custom,prompt:flags.prompt,frames:num(flags.frames),length:num(flags.length),seed:num(flags.seed),loop:bool(flags.loop),turbo:bool(flags.turbo),fps:num(flags.fps),notes:flags.notes,requestedBy:flags.by||'cli'})});out.push(j);}
    flags.json?print(out):out.forEach(j=>console.log(`queued ${summary(j)}`));break;}
  case 'jobs':{const j=await api(`/api/jobs${flags.status?`?status=${flags.status}`:''}`);flags.json?print(j):j.forEach(x=>console.log(summary(x)));break;}
  case 'show':{const j=await api(`/api/jobs/${args[0]}`);if(flags.json){print(j);break;}console.log(summary(j));console.log(`prompt: ${j.prompt.split('\n')[1]||''}`);if(j.qa)for(const c of j.qa.checks)console.log(`  ${c.status.padEnd(4)} ${c.label}: ${c.detail}`);console.log(`files: docs/design/pose-studio/jobs/${j.id}/sprite/ (preview.gif, sheet.png, manifest.json)`);console.log(`view:  ${base}/#job=${j.id}`);break;}
  case 'wait':{const ids=args;for(;;){const js=await Promise.all(ids.map(id=>api(`/api/jobs/${id}`)));const busy=js.filter(j=>['queued','generating','processing'].includes(j.status));if(!busy.length){js.forEach(j=>console.log(summary(j)));break;}process.stderr.write(`\r${busy.map(summary).join(' | ').slice(0,180)}   `);await new Promise(r=>setTimeout(r,5000));}break;}
  case 'select':{if(!flags.frames)fail('--frames 0,4,8,... required');print(summary(await api(`/api/jobs/${args[0]}/select`,{method:'POST',body:JSON.stringify({selected:flags.frames.split(',').map(Number)})})));break;}
  case 'reprocess':print(summary(await api(`/api/jobs/${args[0]}/reprocess`,{method:'POST'})));break;
  case 'approve':case 'reject':print(summary(await api(`/api/jobs/${args[0]}/review`,{method:'POST',body:JSON.stringify({decision:cmd==='approve'?'approved':'rejected',note:flags.note,by:flags.by||'cli'})})));break;
  case 'cancel':print(summary(await api(`/api/jobs/${args[0]}/cancel`,{method:'POST'})));break;
  default:console.log(help);
}
