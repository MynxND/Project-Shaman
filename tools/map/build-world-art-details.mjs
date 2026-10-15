import {readFile,writeFile} from 'node:fs/promises';
import {MAPS} from '../../packages/shared/dist/maps/index.js';
import {MONSTERS} from '../../packages/shared/dist/combat.js';
const atlas=JSON.parse(await readFile('docs/design/maps/world-30/atlas.json'));
const proposed=JSON.parse(await readFile('docs/design/maps/leveling-20-proposal.json')).maps;
const extra={
 'mountain-spirit-sanctuary':{climate:'ป่าภูเขาชื้น / หมอกหุบเขา',landmark:'สำนักผนึกเหนือหน้าผา',monsters:['ภูตผ้าผนึก','เงาผู้เฝ้าบันได'],activity:'ข้อเสนอ: สำรวจสำนัก · เก็บวัตถุดิบอาคม · จุดต่อเส้นทางต่างภูมิภาค'},
 'moon-ritual-ridge':{climate:'สันเขาลมหนาว / ป่าเมฆ',landmark:'ลานพิธีใต้ระฆังสันเขา',monsters:['ภูตระฆัง','เงานักเดินเขา'],activity:'ข้อเสนอ: ล่าตามสันเขา · สำรวจลานพิธี'},
 'spirit-funeral-road':{climate:'ป่าหมอกเย็น / ทางหินเก่า',landmark:'ศาลประตูส่งวิญญาณ',monsters:['วิญญาณหลงทาง','เงาผู้เฝ้าประตู'],activity:'ข้อเสนอ: สำรวจทางวิญญาณ · เผชิญกลุ่มผู้เฝ้าทาง'},
 'storm-seal-coast':{climate:'ชายฝั่งมรสุม / ลมทะเล',landmark:'หอผนึกพายุริมฝั่ง',monsters:['ภูตคลื่น','เงาเรือต้องสาป'],activity:'ข้อเสนอ: เก็บวัตถุดิบชายฝั่ง · สำรวจเส้นทางเสบียง'},
 'ancestral-lantern-isles':{climate:'หมู่เกาะชื้น / ป่าปาล์ม',landmark:'ท่าประทีปบรรพชน',monsters:['ภูตตะเกียงทะเล','เงาป่าปาล์ม'],activity:'ข้อเสนอ: สำรวจเกาะ · แลกเปลี่ยนวัตถุดิบระหว่างท่า'},
 'stone-oath-moor':{climate:'ทุ่งชื้นลมหนาว / ป่าโอ๊ก',landmark:'วงหินคำสัตย์กลางทุ่ง',monsters:['ผู้เฝ้าวงหิน','เงาสัตว์ป่า'],activity:'ข้อเสนอ: สำรวจวงหิน · ล่ารอบขอบป่า'},
 'taiga-blood-trail':{climate:'ไทกาหนาว / ป่าสนดำ',landmark:'ค่ายพรานตามแนวรอยล่า',monsters:['หมาป่าเงา','ภูตหิมะ'],activity:'ข้อเสนอ: ติดตามรอยล่า · เผชิญฝูงมอนสเตอร์'},
 'ancestral-grave-garden':{climate:'ป่าชื้น / สวนสุสาน',landmark:'สวนหินบรรพชนใต้ไม้ใหญ่',monsters:['เงาสุสาน','ภูตไม้ฝังราก'],activity:'ข้อเสนอ: สำรวจสวนสุสาน · ล่ารอบลานบรรพชน'},
 'veiled-spirit-harbor':{climate:'ท่าป่าชื้น / หมอกทะเล',landmark:'ท่าเรือม่านดำและศาลริมอ่าว',monsters:['เงาลูกเรือ','ภูตท่าเก่า'],activity:'ข้อเสนอ: สำรวจโกดังเก่า · เผชิญกลุ่มวิญญาณริมท่า'}
};
const details=Object.fromEntries(atlas.maps.map(m=>{
 const live=MAPS[m.id],plan=proposed.find(p=>p.id===m.id)??extra[m.id];
 const residents=live?[...new Set((live.spawnRegions??[]).flatMap(r=>r.monsters.map(s=>MONSTERS[s.kind]?.name.th??s.kind)))]:[];
 const activities=live?m.id==='umbral-capital'?'ร้านค้า · รักษา · เปลี่ยนอาชีพ · ภารกิจ · จุดพัก':'สำรวจ · ล่ามอนสเตอร์ · เดินทางผ่านประตูแมพ':plan?.activity??'ข้อเสนอ: สำรวจภูมิภาค · ล่ามอนสเตอร์ · จุดเด่นตามสำนัก';
 return[m.id,{climate:plan?.climate??m.biome,landmark:m.id==='moon-mangrove'?'หอระฆังริมช่องน้ำ (ปัจจุบันใช้ภาพศาลร้างทดแทน)':plan?.landmark??(live?.landmarks?.[0]?.name.th??'จุดเด่นภูมิภาค — ยังรอ layout brief'),activities,residents,proposedResidents:live?[]:(plan?.monsters??[]),npcs:live?.npcs?.map(n=>n.name.th)??[],connections:atlas.links.filter(l=>l.from===m.id||l.to===m.id).map(l=>({id:l.from===m.id?l.to:l.from,status:l.status})),source:live?'authoritative MAPS / existing MONSTERS':extra[m.id]?'world-atlas-art-01 new proposal; no approved gameplay layout':'leveling-20-proposal + world-30 proposal'}];
}));
await writeFile('apps/client/src/components/maps/world-art-details.json',JSON.stringify(details,null,2));
await writeFile('docs/design/maps/world-atlas-art-01/details.json',JSON.stringify(details,null,2));
console.log('30 details records; existing residents/NPCs source-bound; proposed features separated.');
