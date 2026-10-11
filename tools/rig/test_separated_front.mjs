import {readFile} from 'node:fs/promises';import {createRequire} from 'node:module';import {createHash} from 'node:crypto';import assert from 'node:assert/strict';
const require=createRequire(new URL('../../apps/client/package.json',import.meta.url)),ts=require('typescript'),sharp=createRequire(require.resolve('next'))('sharp');
const source=await readFile('apps/client/src/game/characters/separated-rig-model.ts','utf8');const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {parseRig,initialLook,resolveRig,rotatePixel}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const d='docs/design/character-v3/separated-front-01/',m=parseRig(JSON.parse(await readFile(d+'manifest.json','utf8'))),base=initialLook(m),rest=resolveRig(m,base);
for(const headId of m.headIds)for(const x of [-16,0,16])for(const y of [-16,0,16])for(const quarterTurns of [0,1,2,3])for(const bob of [-2,0,2]){
 const actual=resolveRig(m,{...base,headId,offset:{x,y},quarterTurns,bob});assert.deepEqual(actual.body,rest.body,'body moves with head');assert.deepEqual(actual.neck,rest.neck,'neck changes with head');assert.deepEqual(actual.headRoot,{x:rest.neck.x+x,y:rest.neck.y+y+bob});
}
assert.deepEqual(rotatePixel({x:3,y:2},1),{x:-2,y:3});assert.deepEqual(rotatePixel({x:3,y:2},4),{x:3,y:2});
assert.throws(()=>parseRig({...m,headIds:[m.bodyId,'head-a']}));assert.throws(()=>parseRig({...m,neckPivot:{x:1.5,y:17}}));assert.throws(()=>parseRig({...m,parts:m.parts.map(p=>({...p,url:'/assets/character-v2/body-front-02/raw.png'}))}));assert.throws(()=>parseRig({...m,hairSets:[{id:'invalid',partIds:['body']}]}));
const sha=b=>createHash('sha256').update(b).digest('hex');
for(const p of m.parts){const b=await readFile('apps/client/public'+p.url);assert.equal(sha(b),p.sha256);assert.deepEqual(b,await readFile(d+p.id+'-raw.png'),'must use independent original, no crop/mask');const{data,info}=await sharp(b).ensureAlpha().raw().toBuffer({resolveWithObject:true});assert.equal(info.width,p.width);assert.equal(info.height,p.height);assert(data.some((n,i)=>i%4===3&&n===0));assert(data.some((n,i)=>i%4===3&&n===255));}
assert.notEqual(m.parts.find(p=>p.id==='head-a').sha256,m.parts.find(p=>p.id==='head-b').sha256,'swap requires two real heads');
for(const[p,h]of Object.entries(JSON.parse(await readFile(d+'frozen-v2.json','utf8'))))assert.equal(sha(await readFile(p)),h,'V2 mutation: '+p);
const ledger=JSON.parse(await readFile(d+'ledger.json','utf8'));assert.equal(ledger.spent,15);assert.equal(ledger.reserved,0);assert.equal(ledger.attempts.length,3);assert.equal(ledger.retries,0);assert.equal(m.visualApproved,false);
console.log('216 native head transforms preserve body and neck; independent originals, two heads, manifest guards, unchanged V2 and15/15 no-retry ledger pass. Anatomy/beauty require visual approval.');
