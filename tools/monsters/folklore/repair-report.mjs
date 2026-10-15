import{readFile,writeFile}from'node:fs/promises';
const root='docs/design/monsters/folklore-01/',asset='apps/client/public/assets/monsters/folklore-01/';
const audit=JSON.parse(await readFile(root+'audit-02/report.json')),drafts=JSON.parse(await readFile(asset+'drafts.json')),sources=JSON.parse(await readFile(root+'repair-03/sources.json'));
const report=structuredClone(audit);report.scope='Repair03:40 species /8 directions /move attack death; chronological atlas inspection plus browser playback samples, not960 live playback approvals';report.userVisualApproval='pending';report.sourceProfiles=sources;
for(const[id,row]of Object.entries(report.monsters)){
 const s=drafts.monsters[id];row.notes='ปรับแก้ตาม audit02 · ภาพเดิมเก็บให้เทียบก่อน–หลัง · รอผู้ใช้ตรวจความลื่นไหล';delete row.candidateStatus;
 for(const[action,p]of Object.entries(sources[id]??{}))if(p.accepted){row.actions[action]={status:'repaired-art',finding:'แทนภาพท่าที่มีปัญหาและตรวจภาพเรียงเวลาครบ8ทิศ · ใช้เฟรมเดิมในมุมที่ยังถูกต้องตามรายการ sourceProfiles · รอผู้ใช้ตรวจภาพ'};}
 if(s.motionProfile){row.actions.move={status:'motion-updated',finding:({hover:'ใช้เฟรมผ้า/ร่างเดิมพร้อมจังหวะลอย4ช่วง ไม่อ้างเป็นท่าเดินหรือภาพวาดใหม่4ภาพ',flight:'เพิ่มท่ากระพือปีก6มุม อีก2มุมคงภาพเดิมที่หันถูก พร้อมจังหวะลอย',hop:'ท่ากระโดดสองเท้า: สัมผัสพื้น → ย่อ → ลอย → ลงพื้น; แก้มุมหลังและข้างด้วยภาพรายทิศ',coil:'ใช้ neutral/เตรียมขด/ยกขด/เตรียมขดจากภาพเดิม ไม่ใช้ pose กระแทกเป็นท่าเดิน'})[s.motionProfile]};}
 if(id==='sending')row.actions.attack={status:'scale-fixed',finding:'ลดสเกลทั้งท่าเป็น0.85เท่าด้วย nearest-neighbor รอบ anchor เดิม ครบ8ทิศ ไม่ยืดสัดส่วนรายเฟรม'};
 if(id==='phi-krasue')row.actions.attack.finding='แก้ภาพมุมSและNEที่หันผิด; อีก6มุมใช้ neutral → windup → strike → neutral จากภาพเดิม จังหวะโดนอยู่เฟรม2';
 if(id==='draugen')row.actions.attack.finding='แก้ภาพ7มุม โดยเฉพาะมุมหลัง และคืน pose neutral มุมเดียวกัน; มุมEคงภาพเดิมที่ถูกต้อง จังหวะโดนเฟรม2';
 row.sourceFrameCounts=Object.fromEntries(['move','attack','death'].map(a=>[a,s.directions.south[a].frames]));row.userVisualApproval='pending';
}
await writeFile(root+'repair-03/report.json',JSON.stringify(report,null,2)+'\n');await writeFile(asset+'audit.json',JSON.stringify(report,null,2)+'\n');
console.log('Updated40 review entries; previous audit immutable; user approval pending');
