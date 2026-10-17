import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import ts from 'typescript';
import {sharp,hash} from './body-eight-lib.mjs';
import {BRANCH_WEAPONS} from '../../packages/shared/dist/index.js';
const detail=process.argv.includes('--detail'),suffix=detail?'detail':'armed';
const root='docs/design/equipment/'+(detail?'class-2-imagegen-detail-01':'class-2-imagegen-armed-01');
const shared=new URL('../../packages/shared/dist/index.js',import.meta.url).href;
const source=ts.transpileModule(await readFile('apps/client/src/game/characters/class-outfit.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText.replace(/from '@shaman\/shared'/g,`from '${shared}'`);
const {parseClassOutfits,outfitTexture,selectClassOutfit,outfitLayerFrame}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const manifest=parseClassOutfits(JSON.parse(await readFile('apps/client/public/assets/character-v3/class-outfits/manifest-imagegen-'+suffix+'-draft.json','utf8')));
const report={frames:0,outfits:0,duplicateAttachmentChecks:0,blankFrames:[],unequipAndSwapFallback:true,pixelLabCredits:0,normalGameplayPublished:false};
const textures=new Set();
for(const o of manifest.outfits)for(const[f,d]of Object.entries(o.directions))for(const a of ['idle','walk','attack','cast'])for(const[i,p]of (a==='idle'?[d.idle]:d[a]).entries())textures.add(outfitTexture(o.id,a==='attack'?o.attackAction:a,f,a==='idle'?undefined:i));
const scene={cache:{json:{get:()=>manifest}},textures:{exists:k=>textures.has(k)}};
for(const o of manifest.outfits.filter(o=>o.id.endsWith('-'+suffix))){
 report.outfits++;const weapon=BRANCH_WEAPONS[o.branch];assert.equal(selectClassOutfit(scene,o.branch,weapon)?.id,o.id);assert.equal(selectClassOutfit(scene,o.branch,undefined),null);assert.equal(selectClassOutfit(scene,o.branch,weapon==='bow-ullr'?'wand-santet':'bow-ullr'),null);
 for(const[f,d]of Object.entries(o.directions))for(const a of ['idle','walk','attack','cast'])for(const[i,p]of (a==='idle'?[d.idle]:d[a]).entries()){
  assert.equal(p.bakedWeapon,weapon);const key=outfitTexture(o.id,a==='attack'?o.attackAction:a,f,a==='idle'?undefined:i);
  assert.equal(outfitLayerFrame(scene,key,{view:f,grip:[0,0],tip:[0,0],front:true,crown:[0,0],tilt:0}),undefined);report.duplicateAttachmentChecks++;
  const bytes=await readFile('apps/client/public'+p.url),m=await sharp(bytes).metadata();assert.equal(m.width,128);assert.equal(m.height,128);assert.ok(m.hasAlpha);assert.equal(hash(bytes),p.sha256);
  const px=await sharp(bytes).ensureAlpha().raw().toBuffer();let opaque=0;for(let j=3;j<px.length;j+=4)if(px[j]>180)opaque++;if(opaque<100)report.blankFrames.push(p.url);report.frames++;
 }
 const key=outfitTexture(o.id,'walk','north',2);textures.delete(key);assert.equal(selectClassOutfit(scene,o.branch,weapon),null);textures.add(key);
}
assert.equal(report.frames,1200);assert.equal(report.outfits,6);assert.equal(report.blankFrames.length,0);
const staging=JSON.parse(await readFile(`${root}/staging-report.json`,'utf8'));assert.equal(hash(await readFile('apps/client/public/assets/character-v3/class-outfits/manifest.json')),staging.defaultManifestSha256);
await writeFile(`${root}/verification.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report));
