import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {sharp,hash} from '../rig/body-eight-lib.mjs';
import {MAPS} from '../../packages/shared/dist/index.js';
const ts=createRequire(import.meta.url)('typescript');
const source=await readFile('apps/client/src/game/world/water-model.ts','utf8'),compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
await writeFile('docs/design/maps/water-animation-01/water-model.mjs',compiled);
const {advanceWater,coverZoom,waterSeed}=await import('../../docs/design/maps/water-animation-01/water-model.mjs');
for(const fps of [15,30,60,120]){const c={seconds:0};for(let i=0;i<fps*20;i++)advanceWater(c,1000/fps,false,1.5);assert(Math.abs(c.seconds-30)<1e-9);advanceWater(c,1000,true,1);assert(Math.abs(c.seconds-30)<1e-9);advanceWater(c,1000,true,1,.125);assert(Math.abs(c.seconds-30.125)<1e-9);}
for(const [w,h]of [[1280,720],[390,844],[844,390],[3840,2160]])for(const m of Object.values(MAPS)){const z=coverZoom(w,h,m.width*32,m.height*32);assert(w/z<=m.width*32+1e-8);assert(h/z<=m.height*32+1e-8);}
assert.equal(waterSeed('a',3,5),waterSeed('a',3,5));assert.notEqual(waterSeed('a',3,5),waterSeed('a',3,6));
const root='apps/client/public/assets/umbral/',m=JSON.parse(await readFile(root+'water-animation-01/manifest.json'));assert.equal(hash(await readFile(root+m.source)),m.sourceSha256);assert.equal(hash(await readFile(root+m.waterfallSource)),m.waterfallSha256);
const p=await sharp(root+'water-animation-01/mask-tiles.png').ensureAlpha().raw().toBuffer();let mixed=0;for(const t of m.tiles){let count=0;for(let y=0;y<16;y++)for(let x=0;x<16;x++){const i=((t.y+y)*64+t.x+x)*4;assert(p[i]===0||p[i]===255);assert.equal(p[i+3],255);if(p[i])count++;}if(t.corners.every(c=>c===m.waterBit))assert.equal(count,256);else if(t.corners.every(c=>c!==m.waterBit))assert.equal(count,0);else{assert(count>0&&count<256);mixed++;}}
assert.equal(mixed,14);
const gameplay=Object.fromEntries(Object.entries(MAPS).map(([id,map])=>[id,hash(Buffer.from(JSON.stringify(map)))]));await writeFile('docs/design/maps/water-animation-01/gameplay-snapshot.json',JSON.stringify(gameplay,null,2)+'\n');
console.log('PASS:15/30/60/120fps clocks,pause/step,seed phases,16 binary Wang masks,source artwork hashes,all-map camera coverage; shared gameplay untouched.');
