// Export-only crop/nearest scaling/composition; raw generations are never retouched.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {sharp,hash} from './body-eight-lib.mjs';
const root='docs/design/equipment/class-2-imagegen-fit-01';
const src=await readFile(`${root}/south-six-raw01.png`);
const pixels=await sharp(src).ensureAlpha().raw().toBuffer();
const ids=['santet','onmyoji','rune-seer','keris','miko','ullr-hunter'];
const head=await readFile('apps/client/public/assets/character-v3/head-eight-01/south.png');
const cards=[],report={pixelLabCredits:0,sourceSha256:hash(src),headSha256:hash(head),runtimeCompatible:false,frames:[]};
await mkdir(`${root}/south`,{recursive:true});
for(const [c,id] of ids.entries()){
 const left=(c%3)*512,top=Math.floor(c/3)*512;
 let x0=512,y0=512,x1=-1,y1=-1;
 for(let y=0;y<512;y++)for(let x=0;x<512;x++)if(pixels[((top+y)*1536+left+x)*4+3]>127){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
 // The neck stump is the highest visible component in these headless source cells.
 let neckSum=0,neckCount=0;
 for(let y=y0;y<y0+4;y++)for(let x=x0;x<=x1;x++)if(pixels[((top+y)*1536+left+x)*4+3]>127){neckSum+=x;neckCount++;}
 const sourceNeckX=neckSum/neckCount,scale=66/(y1-y0+1);
 const width=Math.round((x1-x0+1)*scale),targetLeft=Math.round(62-(sourceNeckX-x0)*scale);
 const cut=await sharp(src).extract({left:left+x0,top:top+y0,width:x1-x0+1,height:y1-y0+1}).resize(width,66,{kernel:'nearest'}).png().toBuffer();
 const body=await sharp({create:{width:128,height:128,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:cut,left:targetLeft,top:47}]).png().toBuffer();
 await writeFile(`${root}/south/${id}-body.png`,body);
 // Original head pixels are reused intact. This is a static fit preview, not SSR integration.
 const preview=await sharp(body).composite([{input:head,left:0,top:0}]).png().toBuffer();
 await writeFile(`${root}/south/${id}-with-original-head.png`,preview);
 const card=await sharp(preview).resize(512,512,{kernel:'nearest'}).png().toBuffer();
 cards.push({input:card,left,top});
 report.frames.push({id,sourceBounds:{x0,y0,x1,y1},sourceNeckX,export:{width:128,height:128,scale,targetLeft,top:47,footRow:112},sha256:hash(body),headPreserved:true,handAnchorsVerified:false});
}
await sharp({create:{width:1536,height:1024,channels:4,background:{r:36,g:58,b:52,alpha:1}}}).composite(cards).png().toFile(`${root}/south-original-head-review-4x.png`);
await writeFile(`${root}/fit-report.json`,JSON.stringify(report,null,2));
console.log('Exported6 south fitting candidates; original head reused; not runtime published.');
