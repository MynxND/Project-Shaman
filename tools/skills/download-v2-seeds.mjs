import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
const evidence=JSON.parse(readFileSync('docs/design/skill-system/medium-v2-animation-jobs.json','utf8'));
const dir='docs/design/skill-system/seed-review';
mkdirSync(dir,{recursive:true});
await Promise.all(evidence.skills.map(async s=>{
  const res=await fetch(s.seedUrl??`https://api.pixellab.ai/mcp/images/${s.seedJob}/download`);
  if(!res.ok)throw new Error(`${s.id}: HTTP ${res.status}`);
  writeFileSync(`${dir}/${s.id}.png`,Buffer.from(await res.arrayBuffer()));
}));
console.log('Downloaded five original PixelLab v2 seed candidates for pixel/anchor review.');
