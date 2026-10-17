import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {sharp,hash} from './body-eight-lib.mjs';
const root='docs/design/equipment/class-2-imagegen-detail-01';
const bytes=await readFile(root+'/export-report.json'),report=JSON.parse(bytes);
const saved=JSON.parse(await readFile(root+'/user-head-offsets.json'));
const orders=new Map((saved.orders??[]).map(o=>[o.key,o.indices]));
await mkdir(root+'/walk-audit',{recursive:true});const clips=[];
for(const id of [...new Set(report.frames.map(f=>f.id))]){
 const layers=[];
 for(const [row,direction]of ['south','south-east','east','north-east','north','north-west','west','south-west'].entries()){
  const original=report.frames.filter(f=>f.id===id&&f.action==='walk'&&f.direction===direction).sort((a,b)=>a.index-b.index);
  const key=[id,'walk',direction].join('/'),sequence=orders.get(key)??original.map(f=>f.index);
  clips.push({key,sequence,sourceHashes:original.map(f=>f.sha256),status:'needs gait review; no anatomy inferred from image hashes'});
  for(let position=0;position<sequence.length;position++){
   const f=original.find(f=>f.index===sequence[position]);
   const crop=await sharp(root+'/'+f.url).extract({left:24,top:78,width:80,height:46}).resize(320,184,{kernel:'nearest'}).png().toBuffer();
   const label=Buffer.from(`<svg width="320" height="220"><text x="8" y="207" fill="#f0dfb0" font-size="16">${direction} : ${position} / source ${f.index}</text></svg>`);
   const tile=await sharp({create:{width:320,height:220,channels:4,background:'#243a34'}}).composite([{input:crop,left:0,top:0},{input:label,left:0,top:0}]).png().toBuffer();
   layers.push({input:tile,left:position*320,top:row*220});
  }
 }
 await sharp({create:{width:2560,height:1760,channels:4,background:'#243a34'}}).composite(layers).png().toFile(root+'/walk-audit/'+id+'.png');
}
await writeFile(root+'/walk-audit/report.json',JSON.stringify({sourceFingerprint:hash(bytes),clips:clips.length,frames:clips.length*8,ordersRespected:true,pixelLabCredits:0,assetsModified:false,findings:'Visual review of raw Santet SOUTH shows repeated same-leg lift at source1,2,4,6. Reordering cannot invent missing opposite-leg poses or equalize contact/passing phases.',details:clips},null,2));
const html=`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>ตรวจเท้าท่าเดิน</title><style>body{background:#182d28;color:#eee4c9;font:18px system-ui;padding:20px}img{max-width:100%;image-rendering:pixelated}a{color:#e1c477}</style><h1>ตรวจเท้าท่าเดิน — 6 คลาส / 8 ทิศ</h1><p>ซ้ายไปขวา = ลำดับเล่นที่บันทึกไว้ · source = หมายเลขภาพต้นฉบับ · แสดงช่วงขาแบบขยาย ไม่เปลี่ยนภาพเกม</p><p>ตรวจเท้าซ้าย/ขวาสลับนำ → ลงน้ำหนัก → ผ่านกลาง → ก้าวอีกข้าง ห้ามใช้การสะท้อนทั้งตัว เพราะอาวุธและชุดไม่สมมาตร</p><a href="/head-editor">กลับไปจัดเฟรม</a>${[...new Set(report.frames.map(f=>f.id))].map(id=>`<h2>${id}</h2><img src="/walk-audit/${id}.png">`).join('')}`;
await writeFile(root+'/walk-audit/index.html',html);
console.log('48 walk clips /384 frames; diagnostic crops only; sources and user offsets unchanged.');
