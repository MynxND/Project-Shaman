import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {sharp,json,hash} from './body-eight-lib.mjs';
const root='apps/client/public/assets/ssr/candidates/';
const old=await json(root+'face-eight-01/manifest.json'),current=await json(root+'face-eight-02/manifest.json');
for(const f of current.files){const prev=old.files.find(p=>p.id===f.id);assert(prev);if(f.id.startsWith('cold-detached-')&&(f.id.includes('south-east')||f.id.includes('south-west')))continue;assert.equal(f.sha256,prev.sha256,'Unrelated output changed: '+f.id);}
const p=await sharp(await readFile(root+'face-eight-02/cold-detached-south-east-patch.png')).ensureAlpha().raw().toBuffer();
for(const [left,right]of [[57,62],[69,72]])for(let x=left;x<=right;x++)assert.deepEqual([...p.subarray((38*128+x)*4,(38*128+x)*4+4)],[76,50,54,255],'Both eyelids share row38');
for(const f of current.files)assert.equal(hash(await readFile('apps/client/public'+f.url)),f.sha256);
console.log('PASS: only cold diagonal outputs changed, both half-lidded eyes share baseline, exact other faces/angles and approved FRONT');
