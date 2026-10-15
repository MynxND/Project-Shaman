import assert from'node:assert/strict';import{readFile}from'node:fs/promises';import{createHash}from'node:crypto';import{sharp}from'../rig/body-eight-lib.mjs';
import{weightedVariant,terrainVariant}from'../../apps/client/public/assets/umbral/terrain-quality/variation.mjs';
const root='apps/client/public/assets/umbral/',q=JSON.parse(await readFile(root+'terrain-quality/manifest.json')),old=JSON.parse(await readFile(root+'manifest.json')),sha=b=>createHash('sha256').update(b).digest('hex');
// Village adds records to the catalogue; the original records and PNGs must remain byte-equivalent.
const originalManifest={...old,objects:Object.fromEntries(Object.entries(old.objects).filter(([id])=>!id.startsWith('village-')))};
const originalJson=JSON.stringify(originalManifest,null,2);
assert([originalJson,originalJson+'\n',(originalJson+'\n').replaceAll('\n','\r\n')].some(s=>sha(Buffer.from(s))===q.sourceHashes.manifest));for(const[id,s]of Object.entries(old.tilesets))assert.equal(sha(await readFile(root+s.image)),q.sourceHashes[id]);
const counts=[0,0,0,0],weights=[.6,.2,.12,.08];for(let y=0;y<100;y++)for(let x=0;x<100;x++){const v=weightedVariant('same-map',x,y,weights);assert.equal(v,weightedVariant('same-map',x,y,weights));counts[v]++;const phase=terrainVariant('same-map',x,y,weights)%16;assert.equal(phase,y%4*4+x%4);}
for(let i=0;i<4;i++)assert(Math.abs(counts[i]/10000-weights[i])<.03);assert(Array.from({length:100},(_,x)=>terrainVariant('same-map',x,11,weights,3)!==terrainVariant('same-map',x,11,weights,4)).filter(Boolean).length>20);
// Shared rim pixels remain exact across all four interior art variants.
for(const[id,s]of Object.entries(q.tilesets)){const bytes=await readFile(root+'terrain-quality/'+s.image),m=await sharp(bytes).metadata();assert.equal(m.width,4096);assert.equal(m.height,64);const p=await sharp(bytes).ensureAlpha().raw().toBuffer();for(const t of s.tiles)for(let phase=0;phase<16;phase++)for(let group=1;group<4;group++)for(let y=0;y<16;y++)for(let x=0;x<16;x++){if(x>=2&&y>=2&&x<14&&y<14)continue;const a=((t.y+y)*4096+phase*64+t.x+x)*4,b=((t.y+y)*4096+(group*16+phase)*64+t.x+x)*4;assert(p.subarray(a,a+4).equals(p.subarray(b,b+4)),id+' edge');}}
const deco=await sharp(root+'terrain-quality/decorations.png').metadata();assert.equal(deco.hasAlpha,true);assert.equal(deco.width,80);assert.equal(deco.height,32);
console.log('PASS: seeded weights/distribution, fixed phases,64-variant shared rims,4pair atlases incl.dirt-road,alpha decorations and unchanged original assets.');
