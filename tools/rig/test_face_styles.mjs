import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {sharp,json,hash} from './body-eight-lib.mjs';
const d='docs/design/ssr/face-styles-front-01/',p='apps/client/public',root=p+'/assets/ssr/candidates/face-styles-front-01/';
const spec=await json(d+'spec.json'),m=await json(root+'manifest.json');assert.equal(hash(await readFile(spec.source)),spec.sourceHash);assert.equal(m.credits.spent,10);assert.equal(m.credits.attempts,2);assert.equal(m.credits.retries,0);
for(const f of m.files)assert.equal(hash(await readFile(p+f.url)),f.sha256);
const raw=async path=>sharp(await readFile(path)).ensureAlpha().raw().toBuffer();const src=await raw(d+'source.png');
for(const s of spec.styles){const gen=await raw(d+s.id+'-generated.png');for(let y=0;y<64;y++)for(let x=0;x<64;x++)if(!(x>=21&&x<=40&&y>=35&&y<=47))assert.deepEqual(gen.subarray((y*64+x)*4,(y*64+x)*4+4),src.subarray((y*64+x)*4,(y*64+x)*4+4));
for(const hair of ['short','curtains'])for(const mode of ['head','body']){const before=await raw(root+'original-'+hair+'-'+mode+'.png'),after=await raw(root+s.id+'-'+hair+'-'+mode+'.png');let changed=0;for(let k=0;k<128*128;k++){if(before.subarray(k*4,k*4+4).equals(after.subarray(k*4,k*4+4)))continue;changed++;const x=k%128,y=k/128|0;assert(x>=53&&x<=72&&y>=34&&y<=47,'Changes escaped face at '+x+','+y);}assert(changed>20,'New face must visibly differ');}}
console.log('PASS: frozen V3 source, generation masks, real face changes only, body/hair/neck unchanged, hashes, budget');
