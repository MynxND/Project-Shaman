// Publishes a V3 one-shot action (attack | cast) from actions-eight-02/raw/<action>/: per-frame neck pivots, ground lock,
// approved static heads, sheet, manifest and an animated review GIF. Usage: node tools/rig/publish_action_eight.mjs attack|cast
import{readFile,writeFile,mkdir}from'node:fs/promises';import{json,save,order,sharp,rgba,hash}from'./body-eight-lib.mjs';
const action=process.argv[2];const spec={attack:{frames:8,fps:16,name:'Medium novice · ฝ่ามือวิญญาณ'},cast:{frames:12,fps:12,name:'Medium novice · ร่ายมนตร์'}}[action];if(!spec)throw Error('attack|cast');
const dir='docs/design/character-v3/actions-eight-02/',raw=`${dir}raw/${action}-final/`,pub=`apps/client/public/assets/character-v3/actions-eight-02/${action}/`,bodyPub='apps/client/public/assets/character-v3/body-eight-02/';
const FRAMES=Array.from({length:spec.frames},(_,i)=>i+1); // frame 0 is the echoed idle reference
const body=await json(bodyPub+'manifest.json');await mkdir(pub,{recursive:true});
const lowest=p=>{for(let y=127;y>=0;y--)for(let x=0;x<128;x++)if(p[(y*128+x)*4+3])return y;throw Error('empty');};
// Neck stump searched only in a narrow column around the idle neck, so hands raised beside the chest are ignored.
function stump(p,nx){for(let y=36;y<62;y++){const row=yy=>{const xs=[];for(let x=nx-7;x<=nx+7;x++)if(p[(yy*128+x)*4+3])xs.push(x);return xs;};const xs=row(y);if(xs.length){const all=[...xs,...row(y+1)];return{top:y,cx:(Math.min(...all)+Math.max(...all))/2,width:Math.max(...xs)-Math.min(...xs)+1};}}throw Error('No neck stump');}
// Removes provider specks: opaque islands under 8 px that are not connected to the body (8-connectivity).
function despeck(p){const seen=new Uint8Array(128*128);for(let i=0;i<128*128;i++){if(seen[i]||!p[i*4+3])continue;const comp=[i],stack=[i];seen[i]=1;while(stack.length){const c=stack.pop(),x=c%128,y=(c-x)/128;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=x+dx,ny=y+dy,n=ny*128+nx;if(nx<0||ny<0||nx>127||ny>127||seen[n]||!p[n*4+3])continue;seen[n]=1;stack.push(n);comp.push(n);}}if(comp.length<8)for(const c of comp)p.fill(0,c*4,c*4+4);}return p;}
const directions=[],cells=[],report={};
for(const[i,d]of order.entries()){
 const stillPixels=await rgba(await readFile(bodyPub+d+'.png')),still=body.frames[i],rest=stump(stillPixels,still.neckPivot.x),restY1=lowest(stillPixels);
 const dx=still.neckPivot.x-rest.cx,dy=still.neckPivot.y-rest.top,frames=[];report[d]=[];
 for(const[j,k]of FRAMES.entries()){
  const src=despeck(await rgba(await readFile(`${raw}${d}-${k}.png`))),shift=restY1-lowest(src),moved=Buffer.alloc(src.length);
  for(let y=0;y<128;y++){const t=y+shift;if(t>=0&&t<128)src.copy(moved,t*512,y*512,(y+1)*512);}
  const b=await sharp(moved,{raw:{width:128,height:128,channels:4}}).png().toBuffer(),s=stump(moved,still.neckPivot.x);
  // A crouching frame can lose the stump so the top row is the shoulder line; its centre is still the neck. Flag for review.
  if(s.width>12)console.warn(`review: no clear neck stump ${d}-${k} (top row width ${s.width}), using shoulder-line centre`);
  const neckPivot={x:Math.round(s.cx+dx),y:s.top+dy},url=`/assets/character-v3/actions-eight-02/${action}/${d}-${j}.png`;await writeFile('apps/client/public'+url,b);
  frames.push({url,sha256:hash(b),neckPivot,bodyOrigin:{x:still.bodyOrigin.x,y:lowest(moved)}});report[d].push({...neckPivot,groundShift:shift});cells.push({input:b,left:j*128,top:i*128});
 }
 directions.push({direction:d,headUrl:still.headUrl,headSha256:still.headSha256,headPivot:still.headPivot,frames});
}
const sheet=await sharp({create:{width:spec.frames*128,height:1024,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(cells).png().toBuffer();await writeFile(pub+'sheet.png',sheet);
const pages=[];for(let j=0;j<spec.frames;j++){const c=[];for(const[i,d]of directions.entries()){const f=d.frames[j];c.push({input:await readFile('apps/client/public'+f.url),left:(i%4)*128,top:Math.floor(i/4)*128},{input:await readFile('apps/client/public'+d.headUrl),left:(i%4)*128+f.neckPivot.x-d.headPivot.x,top:Math.floor(i/4)*128+f.neckPivot.y-d.headPivot.y});}
 pages.push(await sharp({create:{width:512,height:256,channels:4,background:'#20312e'}}).composite(c).resize(1024,512,{kernel:'nearest'}).raw().toBuffer());}
await sharp(Buffer.concat(pages),{raw:{width:1024,height:512*spec.frames,channels:4,pageHeight:512}}).gif({delay:Array(spec.frames).fill(Math.round(1000/spec.fps*1.5)),loop:0}).toFile(`${dir}${action}-review-2x.gif`);
const ledger=await json(dir+'ledger.json');
const manifest={version:'action-eight/1',action,name:spec.name,bodySet:'body-eight-02',fps:spec.fps,loop:false,directions,credits:{spent:ledger.spent??0,cap:ledger.cap},sheet:{url:`/assets/character-v3/actions-eight-02/${action}/sheet.png`,sha256:hash(sheet),frameWidth:128,frameHeight:128},sourceFrames:FRAMES,visualApproved:false};
await save(pub+'manifest.json',manifest);await save(`${dir}${action}-manifest.json`,manifest);await save(`${dir}${action}-neck-pivots.json`,report);
for(const d of order)console.log(d,report[d].map(p=>p.x+','+p.y).join(' '));
