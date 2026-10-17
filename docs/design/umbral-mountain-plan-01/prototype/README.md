# Umbral elevation prototype — 2026-10-11

สถานะ: ต้นแบบแยกสำหรับตรวจภาพและการเดิน ยังไม่ใช่เมือง Production ที่ผ่านอนุมัติ

## เปิดเล่น

- Development client: http://localhost:3000/?map=umbral-elevation-lab
- กล้องภาพรวม: http://localhost:3000/?map=umbral-elevation-lab&mountainReview=wide
- ภาพเปรียบเทียบเมืองจริง: http://localhost:3000/?mountainReview=wide
- ใช้ dev server เดิม port 3000/2567; ไม่ต้องเปิด `pnpm dev` ซ้ำ หากยังทำงานอยู่
- เลือกแผนที่ทดลองได้เฉพาะ development; server ปฏิเสธ map elevation นี้เมื่อ NODE_ENV=production

## สิ่งที่ทำ

Clone ข้อมูลเมืองเดิมด้วย map ID ใหม่ ไม่มีการย้ายอาคาร NPC จุดเกิด หรือ object เดิม ไม่มีการเปลี่ยน PNG/manifest เดิม เพิ่มเฉพาะ instance ของ mossy-rock และ garden-understory เป็นกลุ่มตามขอบชาน ใช้ basalt-cobble เดิมทำกำแพงกันดิน ริมชาน เงา และขั้นบันได ไม่มี asset ภาพเกมใหม่ และใช้ PixelLab **0 เครดิต / 0 generation calls**

พื้นยกระดับ ตัวละคร NPC ชาวเมือง decal แสง และ contact shadow ใช้ projection เดียวกัน: `screenY = worldY × 32 − elevation × 48` โดยโลก/ระยะเดินยังเป็น world units เดิม ระดับอยู่ในข้อมูล shared; depth สำหรับบังหน้าหลังใช้ฐาน worldY ไม่ใช้ elevation เป็น display depth โดยตรง รูปเดิมและต้นไม้เดิมยังบังตัวละครตามตำแหน่งฐาน ไม่เพิ่ม blur หรือ bloom

Server คำนวณ elevation จากตำแหน่งหลัง simulation tick แล้ว sync ผ่าน PlayerState ไม่รับ elevation จาก input ของ client การเดินและ stop correction ตรวจแนว segment และปิดด้านข้าง corridor ป้องกันเดินทะลุหน้าผา Citizen ใช้กฎเดียวกัน และการใช้บริการ NPC ข้ามชานถูกปฏิเสธ

## S1–S6 (world coordinates)

| จุด | ประเภท | พื้นที่ x,y,w,h | ระดับ | กติกา |
|---|---|---|---|---|
| S1 | บันไดหลักขึ้นวิหาร | 37,20,6,6 | +2 ↔ +1 | เข้าออกจากปลายเหนือ/ใต้ |
| S2 | บันไดหลักจากเมืองล่าง | 37,42,6,6 | +1 ↔ 0 | เข้าออกจากปลายเหนือ/ใต้ |
| S3 | ทางลาดตะวันออก | 48,31,4,4 | +1 ↔ 0 | เข้าออกจากปลายตะวันตก/ตะวันออก |
| S4 | บันไดสวนศักดิ์สิทธิ์ | 31.5,20,3,6 | +2 ↔ +1 | เข้าออกจากปลายเหนือ/ใต้ |
| S5 | บันไดฝั่งตะวันออกสองช่วง มีชานพัก | 61,20,1.5,8 | +2 ↔ +1 ↔ 0 | ย้าย corridor จาก x62 เพื่อหลบ footprint เดิม ไม่ย้ายอาคาร/พร็อพ |
| S6 | ทางลาดก่อนสะพานฝั่งตะวันตก | 14.8,42,2.4,2 | +1 ↔ 0 | ลงจบที่ y44; สะพานเดิมต่อจากนั้นเป็นทางเดินระดับ 0 |

ด้านข้างทุกทางเชื่อมปิด ไม่อนุญาตเข้ากลางทางจากชานข้างเคียง S5 มีช่วงพักกึ่งกลาง 12.5% ของระยะทาง แยกจากบันไดสองช่วง ทางเดินที่เหลือนอก corridor อยู่ระดับเดิมของแต่ละชาน ไม่มีการทำให้ทุก path เป็นบันได

## หลักฐาน

- `before-phaser.png` / `after-phaser.png`: screenshot จากเกม localhost และกล้อง Phaser จริง ที่ viewport เดียวกัน 1280×960 ไม่ใช่ concept render
- `two-clients.json`: สอง Colyseus SDK clients อยู่ห้องเดียวกัน เดินพร้อมกันด้วย move input จริง ไม่ teleport/ฉีดตำแหน่ง: Z0 → Z1 → Z2 → Z0 แต่ละ client เห็น xy/elevation ของทั้งสองคนตรงกัน การส่ง elevation=999 ไม่เปลี่ยนค่าที่ server คำนวณ
- `packages/shared/scripts/elevation-test.mjs`: S1–S6 เข้าออกทั้งสองทิศ ปิดทางด้านข้าง ป้องกันข้าม cliff/stop correction ตรวจ center lane ไม่ชน footprint เดิม และเดินต่อเนื่องขึ้นสองชั้น
- Shared regression suite ผ่าน; NPC service/network regression ผ่าน รวมการ sync ชาวเมืองสอง client
- Typecheck และ production build ผ่าน
- SHA256 เมืองจริง/NPC/manifest ตรง backup และ assets-umbral 93 ไฟล์ตรง backup ทั้งหมด

## ขอบเขตที่ยังไม่ควรเรียกว่าเสร็จ Production

- รูปชานและกำแพงยังเป็นวัสดุต้นแบบจาก texture ถนนเดิม แนวยาวยังตรงเกินไปสำหรับภูเขาขั้นสุดท้าย ต้องอนุมัติ composition ก่อนทำขอบหินธรรมชาติ/น้ำตก ไม่ได้สร้าง kit ใหม่
- height field ปัจจุบันเจาะจง layout นี้ ยังไม่รองรับชั้นซ้อน/ลอดสะพานหรือ routing graph ทั่วไป ไม่มีระบบ pathfinding ใหม่; ใช้การเดินและ collision เดิมร่วมกับ elevation gate
- เส้นหลัก S2→S1 ทดสอบ network จริง; ทางรอง S3–S6 ตรวจเชิง geometry/footprint ไม่ใช่บันทึกผู้เล่นสองคนเดินครบทุกเส้น
- ทดสอบสองคนผ่าน SDK clients จริง ไม่ใช่การควบคุมเบราว์เซอร์สองหน้าต่างด้วยมือ การเคลื่อนที่ทับตำแหน่งกันเป็นพฤติกรรมเดิมของผู้เล่น ไม่ได้เพิ่ม player-player collision
- ภาพนิ่งแสดงชาน/แสง/เงา/ต้นไม้จริง แต่ไม่ใช่หลักฐานว่า jitter และ foreground overlap ทุกจุดผ่านแล้ว ยังต้องตรวจเดินเล่นและวัด FPS บนอุปกรณ์เป้าหมายก่อนขยายเมือง
- Lab ปิด portals และ casts เพื่อแยกจากโลกจริง/นโยบายการต่อสู้ต่างระดับ Quest visit ที่ผูก production map ID ไม่ถือว่าเสร็จใน lab นี้ เมืองจริงยังใช้ระบบเดิม
- ขั้นบันไดเป็น visual cue; การเดินใช้ elevation ต่อเนื่องเพื่อไม่กระโดดทีละขั้น พื้น terrain ดึงจาก tile เดิมและกรอง NEAREST

## Rollback

Production map และ asset ไม่ได้ถูกเขียนทับ Backup ต้นฉบับอยู่ `../backup/` พร้อม hashes การย้อนต้นแบบให้ถอด lab registration และ field/projection/gates ที่มี `map.elevation` เฉพาะต้นแบบ แล้ว build client/server/schema คู่กัน อย่านำไฟล์ MapRenderer/world backup ทับทั้งไฟล์โดยไม่ review เพราะอาจมีงานอื่นตามมา

รออนุมัติภาพต้นแบบก่อนแก้ Production Map หรือสร้าง asset ใหม่

## Browser walk check

ควบคุมผู้เล่นในเบราว์เซอร์ localhost จริงด้วย WASD: จากชานกลางขึ้นไป (42,17) หน้า NPC พระอาจารย์ จากนั้นลงผ่าน S1/S2 ถึง (42,50) แล้วขึ้นกลับ (42,36) ได้ เปิดบทสนทนานวลจันทร์ได้ ภาพ `upper-gameplay.png` และ `lower-gameplay.png` ใช้กล้องตามผู้เล่นจริง ไม่ใช่กล้องแผนผัง ตรวจ desktop และ mobile portrait 390×844 แล้ว (mobile-phaser.png); HUD เดิมกินพื้นที่จอมากแต่ไม่ได้แก้ UI ในงานนี้ Browser error log ณ การตรวจไม่มี error ไม่ถือเป็นการวัด FPS หรือ jitter ตลอดเส้นทาง
