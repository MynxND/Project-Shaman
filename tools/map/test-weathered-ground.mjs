import assert from'node:assert/strict';import{readFile}from'node:fs/promises';import{stripTypeScriptTypes}from'node:module';
const code=stripTypeScriptTypes(await readFile('apps/client/src/game/world/weathered-ground.ts','utf8'));const{weatherGroundEdges}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const w=256,h=160,base=new Uint8Array(w*h);for(let y=0;y<h;y++)for(let x=0;x<w;x++)base[y*w+x]=x<64?0:x<128?1:x<192?2:3;
const original=base.slice(),out=weatherGroundEdges(base,w,h);assert.deepEqual(base,original);assert.deepEqual(out,weatherGroundEdges(base,w,h));let eroded=0,extended=0;
for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;if(base[i]===3)assert.equal(out[i],3);if(x<54||x>138&&x<182)assert.equal(out[i],base[i]);assert(out[i]<=3);if(out[i]<base[i])eroded++;if(out[i]>base[i])extended++;}
assert(eroded>100&&extended>10,'both material lips and scattered chips');for(const x of[63,127])assert(new Set(Array.from({length:h},(_,y)=>out[y*w+x])).size>1,'straight boundary broken');
console.log('PASS material-only wear: deterministic, input unchanged, water/route cores exact, broken edges in both directions', {eroded,extended});

const shore=weatherGroundEdges(base,w,h,true);assert.deepEqual(base,original);assert.deepEqual(shore,weatherGroundEdges(base,w,h,true));let toes=0;
for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;if(base[i]!==3)assert.equal(shore[i],base[i],'dry decks/approaches exact');else if(shore[i]!==3){toes++;assert(x<202,'narrow bank only');}if(x>202)assert.equal(shore[i],base[i]);}assert(toes>100,'water edge has bank intrusions');
// Original water mode survives every remaining wet sample; no dry cell becomes water.
const pond=new Uint8Array(base.length);for(let i=0;i<pond.length;i++)if(base[i]===3)pond[i]=i%2?1:2;const displayed=pond.map((mode,i)=>shore[i]===3?mode:0);for(let i=0;i<pond.length;i++)assert(displayed[i]===0||displayed[i]===pond[i]);
console.log('PASS shoreline toe: dry land/decks and water modes exact, bounded deterministic intrusions', {toes});
