# แก้แอนิเมชันมอนสเตอร์ รอบ03

ผู้ใช้อนุญาตแก้ภาพทั้งหมดตาม audit02 ด้วย ImageGen หลัง PixelLab generationหมด ชุดนี้นำภาพแก้เข้า manifest ที่เกมและหน้า `/monsters/folklore` ใช้แล้ว ไม่ใช่แค่ภาพ candidate อย่างรอบก่อน ภาพเดิมและ audit02 เก็บไว้ครบ สถานะการอนุมัติภาพโดยผู้ใช้ยัง pending

## ผลแก้

- เดิน22ตัว: Phi Pret, Phi Pop, Kuchisake-onna, Rokurokubi, Gashadokuro, Dokkaebi, Gumiho, Leshy, Domovoi, Kikimora, Vodyanoy, Bannik, Draugur, Afturganga, Uppvakningur, E Gui, Wutou Gui, Huli Jing, Draugen, Huldra, Fossegrim, Nisse. แต่ละมุมเรียง contactซ้าย → passingขารับน้ำหนักซ้าย → contactขวา → passingขารับน้ำหนักขวา ชุดเปรตใช้ candidateเดิมที่กลับมาตรวจและตัดแถวใหม่ครบ8มุม ไม่อ้างว่าเจนใหม่ทุกตัว
- เจียงซือเปลี่ยนเป็นกระโดดสองเท้า ย่อ/ลอย/ลงพื้น แก้N/NW/NE/Eด้วยภาพรายทิศ กระหังเพิ่มกระพือปีก6มุม; NW/Eใช้ภาพเดิมที่หันถูกและจังหวะลอย ไม่ใช้ภาพใหม่ที่หันผิด
- ผีลอย15ตัวใช้ผ้า/ร่างเดิมพร้อม offsetพิกเซลตามจังหวะ4ช่วง แยก ground originจากตำแหน่งวาด ทั้งเงา วงเลือก ระยะโจมตี และการเลือกเป้ายังอยู่บนพื้น ไม่อ้างว่ามีภาพวาดใหม่4ภาพสำหรับผีลอยเหล่านี้ ทิลเบริใช้ภาพneutral/เตรียมขด/ยกขด/เตรียมขดเดิมแทน moveที่แทบไม่ขยับ
- ท่าตาย5ตัว: Huli Jing, Mare, Utburdur, Phi Krahang, Draugen. เพิ่มยุบ/ล้มก่อนร่างหรือเศษผ้า/ควันค้าง ไม่ย้อนขึ้นยืน; เปลวUtburdurดับในเฟรมท้าย กระหังมีช่วงศพค้างซึ่งไม่ใช่4poseที่แตกต่างทั้งหมด
- กระสือแก้มุมโจมตีSและNE; อีก6มุมใช้ neutral → windup → strike → neutralจากภาพเดิม ดรอยเกนแก้7มุมโดยเฉพาะด้านหลัง คืนneutralของมุมเดียวกัน มุมEคงภาพเดิมที่ถูกต้อง; Sendingปรับทั้งท่าโจมตีด้วยตัวคูณ0.85รอบanchorเดิม ไม่มีการยืดแขนขารายเฟรม
- เก็บการแก้ลำดับโจมตี9ตัวจากรอบ02ไว้; Draugenใช้ชุดใหม่แทน overrideเดิม ค่าimpactระบุแยกจากจำนวนเฟรม ทดสอบdeadlineรวมกระสือ10ตัว

รวม31action replacementsตาม `sources.json` (บางมุมใช้ภาพเดิมตามรายการข้างบน) และSendingscaleอีก1action ไฟล์atlasใหม่28ชุดลงท้าย`-r03.png`; ภาพatlasเดิม40ชุดไม่ถูกเขียนทับ ท่าที่ไม่ได้แก้มีพิกเซลเดิมตรงทุกเฟรม จำนวนframe/timing beatกับจำนวนภาพที่แตกต่างเป็นคนละอย่าง ไม่อ้างว่าทุกท่ามี4ภาพใหม่

## แหล่งภาพและการแพ็ก

ใช้ built-in ImageGen ไม่ใช้ CLI/APIสำรอง คำสั่งและภาพที่ใช้จริงเก็บคู่ `*-prompt.txt` / `*-source.png` ในโฟลเดอร์นี้ (กระสือมุมหน้าอยู่`*-front-*`; ผีเปรตอ้างcandidateและpromptเดิมในaudit02) `walk-pose-guide.png` เป็นแผนภาพข้อต่อที่เขียนด้วยโค้ดสำหรับกำกับท่า ไม่ใช่ spriteเกมหรือภาพจากเกมอื่น

ไม่หารตารางเท่ากันแบบเดาสุ่ม: วัดแถวและคอลัมน์จากalpha เลือกช่องว่างจริง ตรวจการตัดหัว/เท้า/อาวุธ แก้sourceที่ขาดแถวหรือสลับกล้องด้วยรายทิศ หรือใช้มุมเดิมที่ถูกต้อง รายการ mapping/ข้อยกเว้นใน `sources.json`; hash, bounds, row measurements และoverride hashอยู่ `packing.json` คงalpha/สีเดิม ย่อแบบnearest-neighborด้วยสเกลรวม ไม่วาดแขนขาหรือใช้mirrorหน้าแทนหลัง ภาพย่อยรายทิศปรับสเกลรวมให้ตรงชุดหลัก

## ตรวจภาพและระบบ

`*-qa.png` แสดงท่าแก้ครบ8มุม×4จังหวะ; `after/` แสดง move/attack/deathตามดัชนีจริงครบ40ตัว ให้เทียบกับ audit02 นี่เป็นการตรวจภาพเรียงเวลา ไม่ใช่คำรับรองว่าดูการเล่นสดครบ960คลิปหรือว่าเท้าจะไม่ไถลทุกความเร็วในเกม การปรับจังหวะตามระยะก้าวจริงและงานเก็บภาพให้เนียนขึ้นยังให้ผู้ใช้วิจารณ์ได้

Browserตรวจตัวอย่างครบ7ประเทศ: Pret/Gashadokuro/Dokkaebi/Bannik/Draugur/Jiangshi/Draugen รวมท่าตายHuli Jing/Mare, pause/เลื่อนเฟรม/replay/ก่อน–หลัง และตาราง41แถวรวมheader ตรวจมือถือ390×844และ844×390ไม่ล้นแนวนอน `desktop-walk.png`, `desktop-hop.png`, `mobile-walk.png` เป็นภาพจริงของpreview; `live-paddy.png` แสดงชุดภาพในห้องทุ่งนาประทีปออนไลน์ การเล่นในbrowserเป็นตัวอย่าง ไม่ใช้แทนการอนุมัติภาพทั้งชุด

`repair-qa.py` ผ่านsource/override hash,40original PNGbyte-exact,28versioned atlas,1600 action/direction contracts และuntouched action pixels. Shared regression suite, folklore model/ground queries/10impact deadlines และtypecheckผ่าน ทดสอบauthoritative20rooms,50camp additionsและPhi Popdamage/deathผ่าน ไม่มีการเปลี่ยนNPC/portal/collision/layout/spawn/ค่าสเตตัสเดิม เกาหลี6ยังไม่ผูกแมพ ไอร์แลนด์เป็นการวางมอนสเตอร์ตามที่ผู้ใช้เลือก ไม่อ้างต้นกำเนิดนิทาน

Production buildปกติคอมไพล์และtypecheckผ่านแต่workerล้มระหว่างเก็บpage data (27workers,Windows3221226505,freeRAMประมาณ3GB); buildซ้ำด้วย `SHAMAN_BUILD_WORKERS=2` ผ่านทั้งหมด36pages เพิ่มตัวเลือกcapแบบopt-inในNextconfig โดยค่าdefaultเดิมไม่เปลี่ยน

## ทำซ้ำ

ใช้Pythonที่มีPillow และรันจากrepository root:

```text
python tools/monsters/folklore/repair-pack.py --publish
python tools/monsters/folklore/repair-motion.py
node tools/monsters/folklore/apply-audit.mjs
node tools/monsters/folklore/repair-report.mjs
node tools/monsters/folklore/publish.mjs
python tools/monsters/folklore/repair-qa.py
python tools/monsters/folklore/audit.py --repair03
pnpm --filter @shaman/shared build
node tools/monsters/folklore/test.mjs
pnpm typecheck
```

`--publish` เลือกเฉพาะsourceที่ตรวจแล้ว; `--only id1,id2` ใช้ตอนไล่แก้รายตัว การสร้างจากbaselineซ้ำไม่ย่อSendingซ้อนหรือเติมneutralซ้ำ แฟ้มpreviewชั่วคราวจากการแพ็กอาจลบได้หลังตรวจ แต่เก็บsources/prompts/baseline/reports/QA/runtimeไว้
