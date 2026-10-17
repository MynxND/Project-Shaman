import assert from 'node:assert/strict';
import {isolateAtlasCell} from './armed-atlas-isolation.mjs';
const width=64,height=64,p=Buffer.alloc(width*height*4);
const dot=(x,y,a=255)=>{const at=(y*width+x)*4;p[at]=90;p[at+1]=60;p[at+2]=40;p[at+3]=a;};
for(let y=16;y<56;y++)for(let x=20;x<44;x++)dot(x,y);
// Long weapon connected to hand, including tip at the canvas boundary.
for(let x=0;x<21;x++)dot(x,30);
// Small detail beside body must survive; remote neighbour fragment must not.
dot(45,40);dot(61,8);dot(62,8);dot(63,8);dot(3,2,1);
const result=isolateAtlasCell(p,width,height);
assert.equal(result.pixels[(30*width)*4+3],255);
assert.equal(result.pixels[(40*width+45)*4+3],255);
assert.equal(result.pixels[(8*width+62)*4+3],0);
assert.equal(result.pixels[(2*width+3)*4+3],0);
assert.equal(p[(8*width+62)*4+3],255,'source buffer is immutable');
assert.equal(result.removed.length,1);
console.log('Atlas isolation retains connected weapon tips and nearby details; removes remote fragments without mutating source.');
