import assert from 'node:assert/strict';import{readFile}from'node:fs/promises';import{createRequire}from'node:module';import{json,order,hash,sharp,rgba,bounds}from'./body-eight-lib.mjs';
const ts=createRequire(new URL('../../apps/client/package.json',import.meta.url))('typescript');const tr=async p=>ts.transpileModule(await readFile(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const dep='data:text/javascript;base64,'+Buffer.from(await tr('apps/client/src/game/characters/body-eight-model.ts')).toString('base64');
const{parseActionEight}=await import('data:text/javascript;base64,'+Buffer.from((await tr('apps/client/src/game/characters/walk-eight-model.ts')).replace("from './body-eight-model'",`from '${dep}'`)).toString('base64'));
const body=await json('apps/client/public/assets/character-v3/body-eight-02/manifest.json');let total=0;
for(const[action,count]of[['attack',8],['cast',12]]){
 const base=`apps/client/public/assets/character-v3/actions-eight-02/${action}/`,m=parseActionEight(await json(base+'manifest.json'),action);assert.throws(()=>parseActionEight(m,action==='attack'?'cast':'attack'));
 const sheet=await readFile(base+'sheet.png');assert.equal(hash(sheet),m.sheet.sha256);
 for(const[i,d]of m.directions.entries()){assert.equal(d.direction,order[i]);assert.equal(d.frames.length,count,'cast timeline needs 12 frames');assert.equal(d.headSha256,body.frames[i].headSha256);assert.equal(hash(await readFile('apps/client/public'+d.headUrl)),d.headSha256,'Approved head changed');
  const restY1=bounds(await rgba(await readFile(`apps/client/public/assets/character-v3/body-eight-02/${d.direction}.png`))).y1;
  for(const[j,f]of d.frames.entries()){const b=await readFile('apps/client/public'+f.url),p=await rgba(b);assert.equal(hash(b),f.sha256);assert.equal(bounds(p).y1,restY1,'Foot off ground '+f.url);
   assert(Math.abs(f.neckPivot.y-body.frames[i].neckPivot.y)<=10,'Neck jump '+f.url);assert((await sharp(sheet).extract({left:j*128,top:i*128,width:128,height:128}).ensureAlpha().raw().toBuffer()).equals(p),'Lossy sheet');total++;}}}
console.log(`Actions: ${total} headless attack/cast frames, 12-frame cast timeline, ground-locked, approved heads frozen, lossless sheets. Visual approval pending.`);
