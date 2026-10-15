import assert from'node:assert/strict';import{readFile}from'node:fs/promises';import{stripTypeScriptTypes}from'node:module';
const code=stripTypeScriptTypes(await readFile('apps/client/src/game/world/weathered-ground.ts','utf8'));const{weatherGroundEdges}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const w=256,h=160,base=new Uint8Array(w*h);for(let y=0;y<h;y++)for(let x=0;x<w;x++)base[y*w+x]=x<64?0:x<128?1:x<192?2:3;
const original=base.slice(),out=weatherGroundEdges(base,w,h);assert.deepEqual(base,original);assert.deepEqual(out,weatherGroundEdges(base,w,h));let eroded=0,extended=0;
for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;if(base[i]===3)assert.equal(out[i],3);if(x<54||x>138&&x<182)assert.equal(out[i],base[i]);assert(out[i]<=3);if(out[i]<base[i])eroded++;if(out[i]>base[i])extended++;}
assert(eroded>100&&extended>10,'both material lips and scattered chips');for(const x of[63,127])assert(new Set(Array.from({length:h},(_,y)=>out[y*w+x])).size>1,'straight boundary broken');
console.log('PASS material-only wear: deterministic, input unchanged, water/route cores exact, broken edges in both directions', {eroded,extended});
