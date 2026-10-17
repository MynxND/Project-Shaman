// Minimal ComfyUI HTTP/WebSocket client (local server only).
import {randomUUID} from 'node:crypto';
import {COMFY_URL} from './common.mjs';

export async function comfyAlive(){try{const r=await fetch(`${COMFY_URL}/system_stats`,{signal:AbortSignal.timeout(3000)});return r.ok?await r.json():null;}catch{return null;}}

export async function uploadImage(buffer,name){
  const form=new FormData();
  form.append('image',new Blob([buffer],{type:'image/png'}),name);
  form.append('subfolder','pose-studio');form.append('overwrite','true');
  const r=await fetch(`${COMFY_URL}/upload/image`,{method:'POST',body:form});
  if(!r.ok)throw new Error(`ComfyUI upload failed ${r.status}: ${await r.text()}`);
  const j=await r.json();return j.subfolder?`${j.subfolder}/${j.name}`:j.name;
}

// Queue an API-format graph and resolve with its history entry. onProgress gets {step,steps,node}.
export async function runGraph(graph,{onProgress=()=>{},signal}={}){
  const clientId=randomUUID();
  let ws;try{ws=new WebSocket(`${COMFY_URL.replace(/^http/,'ws')}/ws?clientId=${clientId}`);}catch{}
  let promptId;
  if(ws)ws.onmessage=ev=>{if(typeof ev.data!=='string')return;let m;try{m=JSON.parse(ev.data);}catch{return;}
    if(m.data?.prompt_id&&promptId&&m.data.prompt_id!==promptId)return;
    if(m.type==='progress')onProgress({step:m.data.value,steps:m.data.max,node:m.data.node});
    else if(m.type==='executing'&&m.data.node)onProgress({node:m.data.node});};
  try{
    const r=await fetch(`${COMFY_URL}/prompt`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:graph,client_id:clientId})});
    const body=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(`ComfyUI rejected graph: ${JSON.stringify(body.node_errors||body.error||body).slice(0,800)}`);
    promptId=body.prompt_id;
    for(;;){
      if(signal?.aborted){await fetch(`${COMFY_URL}/interrupt`,{method:'POST'}).catch(()=>{});throw new Error('cancelled');}
      await new Promise(r=>setTimeout(r,2000));
      const h=await fetch(`${COMFY_URL}/history/${promptId}`).then(r=>r.json()).catch(()=>({}));
      const e=h[promptId];if(!e)continue;
      if(e.status?.status_str==='error'){const msg=(e.status.messages||[]).find(m=>m[0]==='execution_error')?.[1];throw new Error(`ComfyUI execution error: ${msg?`${msg.node_type}: ${msg.exception_message}`:'unknown'}`);}
      if(e.status?.completed)return{promptId,outputs:e.outputs};
    }
  }finally{try{ws?.close();}catch{}}
}

export async function fetchOutput({filename,subfolder,type}){
  const q=new URLSearchParams({filename,subfolder:subfolder||'',type:type||'output'});
  const r=await fetch(`${COMFY_URL}/view?${q}`);if(!r.ok)throw new Error(`ComfyUI view ${filename} failed ${r.status}`);
  return Buffer.from(await r.arrayBuffer());
}
