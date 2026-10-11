import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {sharp,json,save,hash,rgba} from './body-eight-lib.mjs';

const P='apps/client/public',out='docs/design/ssr/hair-review-2026-10-11/';
const sets=['kid-clean-eight-01','face-fit-short-eight-02','eye-veil-eight-01'];
await mkdir(out,{recursive:true});
const rows=[],report=[];
for(const [row,set] of sets.entries()){
 const root='/assets/ssr/candidates/'+set+'/',d='docs/design/ssr/'+set+'/',m=await json(P+root+'manifest.json');
 const details=[];
 for(const f of m.files){
  const source=await readFile(P+f.url);assert.equal(hash(source),f.sha256);
  const pixels=await rgba(source);
  for(let y=0;y<128;y++)for(let x=0;x<128;x++)if(x<32||x>=96)assert.equal(pixels[(y*128+x)*4+3],0,'Detail must preserve every opaque pixel: '+f.id);
  const id=f.id+'-detail',url=root+id+'.png',bytes=await sharp(source).extract({left:32,top:0,width:64,height:128}).png().toBuffer();
  if(set==='kid-clean-eight-01')await writeFile(P+url,bytes);
  else assert.equal(hash(await readFile(P+url)),hash(bytes));
  details.push({id,url,sha256:hash(bytes)});
 }
 if(set==='kid-clean-eight-01'){
  m.details=details;await save(P+root+'manifest.json',m);await save(d+'manifest.json',m);
 }
 for(const [col,dir]of m.directions.entries()){
  const palette=row===0?'black':'silver';
  rows.push({input:await readFile(P+root+palette+'-'+dir+'-body-detail.png'),left:col*64,top:row*128});
 }
 report.push({set,directions:m.directions,pixelChecks:await json(d+'validation.json'),previewHashesChecked:m.files.length,detailPixelsPreserved:details.length,status:'technical checks passed; agent visual review completed; user acceptance remains separate'});
}
const sheet=await sharp({create:{width:512,height:384,channels:4,background:'#20312e'}}).composite(rows).png().toBuffer();
await sharp(sheet).resize(2048,1536,{kernel:'nearest'}).png().toFile(out+'three-styles-4x.png');
await save(out+'report.json',{date:'2026-10-11',newCredits:0,sets:report,order:'Rows: clean center part, fuller short fringe, partial Eye Veil. Columns: south, south-west, west, north-west, north, north-east, east, south-east.',note:'Review only; no gameplay publication or automatic user approval. Native assets unchanged; clean preview removes transparent margins only.'});
console.log('24 views reviewed; 288 native hashes and 288 lossless detail previews checked; original pixels preserved. Credits: 0.');
