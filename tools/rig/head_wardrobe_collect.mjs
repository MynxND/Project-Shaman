// Polls submitted head-wardrobe jobs once, downloads completed outputs and settles the ledger.
// Never resubmits: a failed or ambiguous job keeps its reservation for review.
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const out='docs/design/head-wardrobe-01/',stage=process.argv[2]??'front';
const read=async p=>JSON.parse((await readFile(p,'utf8')).replace(/^﻿/,''));
const call=(tool,args,file)=>{execFileSync('powershell',['-NoProfile','-File','tools/rig/hair_pixellab.ps1','-Action','call','-Tool',tool,'-ArgumentsFile',args,'-OutputFile',file],{stdio:'pipe'});};
const ledger=await read(out+'ledger.json');
for(const a of ledger.attempts.filter(a=>a.stage===stage&&a.status==='submitted')){
 const submit=(await read(out+a.style+'-'+stage+'-submit.json')).result.structuredContent;
 const pollArgs=out+a.style+'-'+stage+'-poll-args.json',resultPath=out+a.style+'-'+stage+'-result.json';
 if(stage==='front'){
  await writeFile(pollArgs,JSON.stringify({job_id:submit.job_id}));call('get_image',pollArgs,resultPath);
  const r=(await read(resultPath)).result.structuredContent??{status:'processing'};console.log(a.style,r.status);if(r.status!=='completed')continue;
  const png=Buffer.from(await (await fetch(r.download_url)).arrayBuffer());await writeFile(out+a.style+'-front-raw.png',png);
  a.jobId=submit.job_id;a.charged=r.charged_generations;
 }else{
  await writeFile(pollArgs,JSON.stringify({object_id:submit.object_id,include_preview:false}));call('get_object',pollArgs,resultPath);
  const r=(await read(resultPath)).result;const text=r.content.map(c=>c.text??'').join('\n');const status=r.structuredContent?.status??(/completed/i.test(text)?'completed':'pending');
  console.log(a.style,status);if(status!=='completed')continue;
  const urls=[...text.matchAll(/^\s*([a-z-]+): (https:\/\/\S+\/rotations\/[a-z-]+\.png)$/gm)];if(urls.length!==8)throw Error(a.style+': expected 8 rotation URLs, got '+urls.length);
  for(const[,dir,url]of urls){const res=await fetch(url);if(!res.ok)throw Error(a.style+' '+dir+' download '+res.status);await writeFile(out+a.style+'-'+dir+'-raw.png',Buffer.from(await res.arrayBuffer()));}
  // get_object does not report usage; the reservation equals the quoted rotation price and is verified against get_balance.
  a.objectId=submit.object_id;a.charged=r.structuredContent?.charged_generations??a.reserved;
 }
 a.status='completed';ledger.reserved-=a.reserved;ledger.spent+=a.charged;
 await writeFile(out+'ledger.json',JSON.stringify(ledger,null,2)+'\n');
}
await writeFile(out+'ledger.json',JSON.stringify(ledger,null,2)+'\n');
console.log({spent:ledger.spent,reserved:ledger.reserved,pending:ledger.attempts.filter(a=>a.status==='submitted').map(a=>a.style)});
