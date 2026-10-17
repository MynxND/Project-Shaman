// Compose unchanged source reference cells; no generation, pixel retouch or publication.
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {sharp, hash} from './body-eight-lib.mjs';
const out='docs/design/equipment/class-2-imagegen-fit-01';
await mkdir(out,{recursive:true});
const path='apps/client/public/assets/character-v3/body-eight-02/south.png';
const base=await readFile(path);
const enlarged=await sharp(base).resize(512,512,{kernel:'nearest'}).png().toBuffer();
await sharp({create:{width:1536,height:1024,channels:4,background:{r:0,g:0,b:0,alpha:0}}})
 .composite(Array.from({length:6},(_,i)=>({input:enlarged,left:(i%3)*512,top:Math.floor(i/3)*512})))
 .png().toFile(`${out}/unchanged-male-south-template.png`);
await writeFile(`${out}/source-lock.json`,JSON.stringify({source:path,sha256:hash(base),canvas:128,neck:{x:62,y:48},origin:{x:62,y:112},grid:{columns:3,rows:2,cell:512,sourceMagnification:4},order:['santet','onmyoji','rune-seer','keris','miko','ullr-hunter'],published:false},null,2));
console.log(out);
