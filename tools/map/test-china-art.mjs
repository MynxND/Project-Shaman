import assert from'node:assert/strict';
import{readFile}from'node:fs/promises';
import{createHash}from'node:crypto';
import{stripTypeScriptTypes}from'node:module';
const root='apps/client/public/assets/umbral/china-01/',meta=JSON.parse(await readFile(root+'manifest.json')),source=await readFile(root+'source.png');
assert.equal(createHash('sha256').update(source).digest('hex'),meta.sourceSha256,'source PNG/alpha must remain unchanged');assert.equal(source.readUInt32BE(16),meta.dimensions[0]);assert.equal(source.readUInt32BE(20),meta.dimensions[1]);
assert.deepEqual(Object.keys(meta.frames),['grass','dirt','road','pine','bamboo','tea','stele','rock']);
for(const[name,f]of Object.entries(meta.frames)){assert(f.w>0&&f.h>0&&f.x>=0&&f.y>=0&&f.x+f.w<=meta.dimensions[0]&&f.y+f.h<=meta.dimensions[1],name);}
for(const id of ['mist-bamboo','cloud-tea-slopes']){const map=JSON.parse(await readFile(`docs/design/maps/${id}/map.json`));for(const o of map.objects)assert(['bamboo','village-tropical-tree','garden-understory','mossy-rock','village-sacred-totem','ruined-shrine','talisman-lantern','village-thatched-hut','village-thatched-lodge','cloud-tea-hall'].includes(o.asset),'unreviewed regional visual '+o.id);}
console.log('PASS original China atlas hash/alpha binding,8 frames/native bounds and complete regional prefab coverage. Browser evidence separately required.');
const quiltModule=stripTypeScriptTypes(await readFile('apps/client/src/game/world/china-quilt.ts','utf8'));
const{quiltPaint}=await import('data:text/javascript;base64,'+Buffer.from(quiltModule).toString('base64'));
const fixture=new Uint8ClampedArray(64*64*4),colors=new Set();
for(let y=0;y<64;y++)for(let x=0;x<64;x++){const i=(y*64+x)*4;fixture.set([x*4,y*4,(x+y)*2,255],i);colors.add(`${fixture[i]},${fixture[i+1]},${fixture[i+2]}`);}
const quilt=quiltPaint(fixture,64,128,96,123);
assert.equal(quilt.length,128*96*4);
assert.deepEqual(quilt,quiltPaint(fixture,64,128,96,123),'same seed must reproduce ground');
assert.notDeepEqual(quilt,quiltPaint(fixture,64,128,96,124),'seed must select a different source composition');
for(let i=0;i<quilt.length;i+=4){assert.equal(quilt[i+3],255);assert(colors.has(`${quilt[i]},${quilt[i+1]},${quilt[i+2]}`),'quilting must copy original painted colors');}
console.log('PASS deterministic painted-pixel quilting, seed variation, dimensions, opaque ground and original source colors.');
