/** Download completed native frames without exposing credentials or altering their pixels. */
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
const evidence=JSON.parse(readFileSync('docs/design/skill-system/medium-v2-animation-jobs.json','utf8'));
const requested=new Set(process.argv.slice(2));
const tasks=[];
for(const s of evidence.skills.filter(s=>requested.has(s.id))){
  const dir=`docs/design/skills/medium-v1/raw/${s.id}-ritual-v2`;
  mkdirSync(dir,{recursive:true});
  tasks.push([s.seedUrl??`https://api.pixellab.ai/mcp/images/${s.seedJob}/download`,`${dir}/seed.png`]);
  for(let i=0;i<=s.frameCount;i++)tasks.push([`https://api.pixellab.ai/mcp/images/${s.animationJob}/download?index=${i}`,`${dir}/frame_${String(i).padStart(3,'0')}.png`]);
}
let cursor=0;
await Promise.all(Array.from({length:6},async()=>{
  while(cursor<tasks.length){const [url,path]=tasks[cursor++];if(existsSync(path))continue;
    const res=await fetch(url);if(!res.ok)throw new Error(`${path}: HTTP ${res.status}`);
    const bytes=Buffer.from(await res.arrayBuffer());
    if(bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw new Error(`Not PNG: ${path}`);
    writeFileSync(path,bytes);
  }
}));
console.log(`Downloaded ${requested.size} completed VFX job(s), preserving all native PNG frames.`);
