import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {sharp,json,hash} from './body-eight-lib.mjs';
import {ssrCompose,SSR_DIRECTIONS} from '../../packages/shared/dist/index.js';
const d='docs/design/ssr/face-eight-01/',P='apps/client/public',out=P+'/assets/ssr/candidates/face-eight-01/';
const m=await json(out+'manifest.json'),approval=await json(d+'front-approval.json');assert.equal(m.credits.spent,18);assert.equal(m.credits.attempts,3);assert.equal(m.credits.retries,0);assert.deepEqual(m.directions,SSR_DIRECTIONS);
for(const [path,h]of Object.entries(await json(d+'frozen.json')))assert.equal(hash(await readFile(path)),h,path);
for(const a of approval.faces)for(const [path,h]of Object.entries(a.approved))assert.equal(hash(await readFile(path)),h,path);
for(const f of m.files)assert.equal(hash(await readFile(P+f.url)),f.sha256,f.url);
const raw=async path=>sharp(await readFile(path)).ensureAlpha().raw().toBuffer();const body=await json(P+'/assets/ssr/parts/body.medium-novice.json');
for(const s of m.styles){
 const gen=await raw(d+s.id+'-generated.png'),src=await raw(d+s.id+'-source.png'),mask=await raw(d+s.id+'-mask.png');for(let k=0;k<128*128;k++)if(!mask[k*4])assert.deepEqual(gen.subarray(k*4,k*4+4),src.subarray(k*4,k*4+4),'Outside generation mask');
 const face=await json(out+s.id+'-part.json'),a=approval.faces.find(x=>x.id===s.id),old=P+'/assets/ssr/candidates/'+a.set+'/';assert.equal(hash(await readFile(out+s.id+'-south-patch.png')),hash(await readFile(old+s.id+'-patch.png')));
 for(const dir of SSR_DIRECTIONS){const items=ssrCompose(body,[face],'idle',dir,0).filter(x=>x.kind==='face');if(dir.includes('north'))assert.equal(items.length,0,'Back must have no face overlay');else{assert.equal(items.length,1);if(['west','south-west'].includes(dir))assert.equal(items[0].mirror,true);}}
 for(const hair of ['short','curtains'])for(const dir of SSR_DIRECTIONS){const before=await raw(out+s.id+'-'+hair+'-'+dir+'-before.png'),after=await raw(out+s.id+'-'+hair+'-'+dir+'-body.png');let changes=0;for(let y=0;y<128;y++)for(let x=0;x<128;x++){const k=(y*128+x)*4;if(before.subarray(k,k+4).equals(after.subarray(k,k+4)))continue;changes++;assert(y<49,'Body/neck changed');assert(x>=45&&x<=80&&y>=28,'Change escaped head face');}if(dir.includes('north'))assert.equal(changes,0);else assert(changes>10,'Face must visibly change');if(dir==='south')for(const mode of ['head','body'])assert.equal(hash(await readFile(out+s.id+'-'+hair+'-'+dir+'-'+mode+'.png')),hash(await readFile(old+s.id+'-'+hair+'-'+mode+'.png')),'FRONT exact file reuse');}
}
console.log('PASS 3x8: approved FRONT exact, immutable geometry/body/hair, masks, face visibility, back empty, mirrored layers, hashes, cap18');
