// Publishes walk-eight-02: per-frame neck pivots measured from the real neck stump, approved static heads, atlas, manifest and an animated review GIF.
import{readFile,writeFile,mkdir}from'node:fs/promises';import{json,save,order,sharp,rgba,hash}from'./body-eight-lib.mjs';
const dir='docs/design/character-v3/walk-eight-02/',pub='apps/client/public/assets/character-v3/walk-eight-02/',bodyPub='apps/client/public/assets/character-v3/body-eight-02/';
const FRAMES=[1,2,3,4,5,6,7,8]; // frame 0 is PixelLab's echoed idle reference, not part of the loop
const body=await json(bodyPub+'manifest.json');await mkdir(pub,{recursive:true});
// Neck stump: topmost opaque row in the neck band; centre of its top two rows.
function stump(p){for(let y=38;y<60;y++){const xs=[];for(let x=40;x<90;x++)if(p[(y*128+x)*4+3])xs.push(x);if(xs.length){const next=[];for(let x=40;x<90;x++)if(p[((y+1)*128+x)*4+3])next.push(x);const all=[...xs,...next];return{top:y,cx:(Math.min(...all)+Math.max(...all))/2,width:Math.max(...xs)-Math.min(...xs)+1};}}throw Error('No neck stump');}
const lowest=p=>{for(let y=127;y>=0;y--)for(let x=0;x<128;x++)if(p[(y*128+x)*4+3])return y;throw Error('empty');};
const directions=[],sheetCells=[],report={},ground={};
for(const[i,d]of order.entries()){
 const stillPixels=await rgba(await readFile(bodyPub+d+'.png')),still=body.frames[i],rest=stump(stillPixels),restY1=lowest(stillPixels);
 // Approved static anchor expressed relative to the static stump, then carried onto each walking frame.
 const dx=still.neckPivot.x-rest.cx,dy=still.neckPivot.y-rest.top;const frames=[];report[d]=[];
 for(const[j,k]of FRAMES.entries()){
  // Ground lock: the planted foot is always the lowest pixel, so shift the whole frame onto the idle baseline (removes provider drift, keeps the walk bob).
  const raw=await rgba(await readFile(`${dir}raw/${d}-${k}.png`)),shift=restY1-lowest(raw);
  const moved=Buffer.alloc(raw.length);for(let y=0;y<128;y++){const t=y+shift;if(t>=0&&t<128)raw.copy(moved,t*512,y*512,(y+1)*512);}
  const b=await sharp(moved,{raw:{width:128,height:128,channels:4}}).png().toBuffer(),p=await rgba(b),s=stump(p);ground[d]=(ground[d]||[]).concat(shift);if(s.width>12)throw Error(`Stump too wide ${d}-${k}: head pixels or shoulders at top`);
  const neckPivot={x:Math.round(s.cx+dx),y:s.top+dy};const y1=lowest(p);
  const url=`/assets/character-v3/walk-eight-02/${d}-${j}.png`;await writeFile('apps/client/public'+url,b);
  frames.push({url,sha256:hash(b),neckPivot,bodyOrigin:{x:still.bodyOrigin.x,y:y1}});report[d].push(neckPivot);sheetCells.push({input:b,left:j*128,top:i*128});
 }
 directions.push({direction:d,headUrl:still.headUrl,headSha256:still.headSha256,headPivot:still.headPivot,frames});
}
const sheet=await sharp({create:{width:FRAMES.length*128,height:8*128,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(sheetCells).png().toBuffer();await writeFile(pub+'sheet.png',sheet);
// Review GIF: all eight directions assembled per frame (diagnostic only; runtime uses separate PNGs).
const pages=[];for(let j=0;j<FRAMES.length;j++){const cells=[];for(const[i,d]of directions.entries()){const f=d.frames[j];cells.push({input:await readFile('apps/client/public'+f.url),left:(i%4)*128,top:Math.floor(i/4)*128},{input:await readFile('apps/client/public'+d.headUrl),left:(i%4)*128+f.neckPivot.x-d.headPivot.x,top:Math.floor(i/4)*128+f.neckPivot.y-d.headPivot.y});}
 pages.push(await sharp({create:{width:512,height:256,channels:4,background:'#20312e'}}).composite(cells).resize(1024,512,{kernel:'nearest'}).raw().toBuffer());}
await sharp(Buffer.concat(pages),{raw:{width:1024,height:512*FRAMES.length,channels:4,pageHeight:512}}).gif({delay:Array(FRAMES.length).fill(125),loop:0}).toFile(dir+'walk-review-2x.gif');
const used=async p=>Number((await json(p)).result.content.filter(c=>c.type==='text').map(c=>c.text).join('\n').match(/generations_used:\s*([\d.]+)/)?.[1]);const spent=(await used(dir+'balance-after.json'))-(await used(dir+'balance-before.json'));
const ledger=await json(dir+'ledger.json');if(!(spent>0&&spent<=ledger.cap))throw Error('Unexpected charge '+spent);Object.assign(ledger,{spent,reserved:0,retries:0,status:'completed'});ledger.attempts[0].status='completed';await save(dir+'ledger.json',ledger);
const manifest={version:'walk-eight/1',name:'Medium novice · เดิน',bodySet:'body-eight-02',fps:8,loop:true,directions,credits:{spent,cap:ledger.cap},sheet:{url:'/assets/character-v3/walk-eight-02/sheet.png',sha256:hash(sheet),frameWidth:128,frameHeight:128},sourceFrames:FRAMES,visualApproved:false};
await save(pub+'manifest.json',manifest);await save(dir+'manifest.json',manifest);await save(dir+'neck-pivots.json',{neckPivots:report,groundShift:ground});
for(const d of order)console.log(d,report[d].map(p=>p.x+','+p.y).join(' '));console.log({spent,ground});
