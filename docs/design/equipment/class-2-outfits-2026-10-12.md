# ชุดคลาส 2 — 5 ประเทศ / 10 สาย

**อนุมัติคอนเซปต์อีก 3 ประเทศ 2026-10-13:** ผู้ใช้ยืนยัน “เอาแบบนี้เลยครับยืนยัน” สำหรับภาพชายทั้ง6สาย อินโดนีเซีย Santet/Keris ญี่ปุ่น Onmyoji/Miko และนอร์เวย์ Rune Seer/Ullr ใน [ภาพต้นแบบที่อนุมัติ](class-2-imagegen-concepts-01/README.md). ยึดทรงชุดและสีตามภาพ รวมแขนเสื้อ Santet และขนบ่า Rune Seer แทนข้อเสนอแก้ที่ยังไม่อนุมัติ. ใช้ built-in imagegen ตามคำสั่งผู้ใช้ ไม่ใช้เครดิต PixelLab. ยังเป็นคอนเซปต์ ไม่ใช่สไปรต์8ทิศหรือแอนิเมชันพร้อมใช้; ฐานชาย หัว และอาวุธเดิมคงเดิม ตัวละครหญิงพักต่อ.

**ส่งมอบคู่แรก 2026-10-13:** ไทย Achan / รัสเซีย Juggernaut ผลิตครบ48คลิปและเผยแพร่400เฟรมตัวชุด เชื่อมคลาสในเกมแล้ว ใช้144เครดิต เหลือ7 ไม่มีภาพทดลองหรือ paid reroll เพิ่ม; แก้จุดจับ4เฟรมและลบเศษอาวุธติดภาพแบบ guarded pixel ฟรี. [ไฟล์ ภาพก่อน–หลัง คลิป และข้อจำกัด](class-2-production-01/README.md). ตรวจไฟล์/renderer/build ผ่าน ส่วนการรับรองความสวยเป็นสิทธิผู้ใช้ ตัวละครหญิงไม่เปลี่ยน อีก8สาขายังไม่ผลิต. ข้อความสถานะก่อนส่งมอบด้านล่างเก็บเป็นประวัติ.

**Production authorization 2026-10-13 — สถานะล่าสุด:** ผู้ใช้สั่งหยุดรอบภาพทดสอบและให้ผลิต/เชื่อมสองชุดชายไทย Achan กับรัสเซีย Juggernaut ให้เสร็จ ใช้เส้นทางเปลี่ยน headless clothed-body frames บน rig เดิม เก็บหัว/ผมแยกและตำแหน่งหัวรัสเซียที่ผู้ใช้ปรับไว้ ใช้ branch ที่ซิงก์อยู่แล้วเลือกชุด; body-slot ที่ระบุชัดเจนมีสิทธิก่อน และอาวุธที่ยังไม่มีท่าชุดนั้นกลับไปใช้ rig เดิมครบชุดโดยไม่เปลี่ยนสิทธิใช้อาวุธหรือ combat. [รายการผลิตจริง](class-2-production-01/README.md) กำลังทำ48คลิป/384 motion frames +16 idle เดิม; cap144 จาก151 ไม่มี paid reroll อัตโนมัติ. Runtime adapter เขียนแล้ว แต่ยังไม่ประกาศชุดพร้อมจนไฟล์ครบและผ่านการตรวจใน renderer จริง. Cast8ภาพใช้ timeline12ขั้นเดิม. การแยก garment layers, hide/show UI, อาวุธเพิ่มเติม, อีกแปดสาขา และตัวละครหญิงไม่ได้รวมในรอบนี้. ข้อความ offline-only และ gates ด้านล่างเป็นประวัติ/ข้อเสนอเดิมสำหรับส่วนที่ยังไม่ได้อนุมัติ ไม่ใช่เหตุให้หยุดขอบเขตคู่แรกที่ผู้ใช้อนุมัติล่าสุด.

**Technical repair revision03:** ตามคำสั่งผู้ใช้ ได้แก้ contact rectangles และแนวเท้าของ SOUTH ทั้งสองชุดใน [ไฟล์แยก](class-2-first-pair-03/README.md). ตรวจ native128, foot row112, พิกเซลมือในขอบเขตตรวจตรง source และไม่มีการเปลี่ยนนอก mask ผ่านแล้ว ภาพแก้รองเท้า/ขารัสเซียยังเป็น derivative รอตรวจภาพ ไม่ถือว่ารับอนุมัติ revision02 โดยอัตโนมัติ Runtime/ทิศอื่น/แอนิเมชันยังไม่พร้อม

**Latest approval 2026-10-12:** ผู้ใช้ยืนยัน “แบบนี้ชอบเลยผ่านครับ” สำหรับภาพ SOUTH รอบ02 ของ Achan และ Juggernaut ดู [approved first pair](class-2-first-pair-02/README.md). แนวเสื้อเปลือยรอยสัก/ผ้าดำของไทย และขนสัตว์/เกราะ/เครื่องรางของรัสเซียผ่านด้านภาพแล้ว เฉพาะภาพที่แสดง; ทิศอื่น แอนิเมชัน และ runtime ยังไม่ผ่านโดยปริยาย

**User-directed art revision 2026-10-12:** ผู้ใช้ปฏิเสธความธรรมดาของภาพคู่แรก ไทย Achan เปลี่ยนจากเสื้อพิธีงาช้างเป็นเปลือยท่อนบน รอยสักอาคมเต็มอก/แขน/ลำตัว ผ้านุ่งดำ เครื่องรางคอ ตาม mood reference ผู้ใช้ (ใช้เป็นแนวคิด ไม่คัดลอกตัวบุคคล/อักษรจริง). รัสเซีย Juggernaut เพิ่มพลังและความน่าเกรงขามแบบหมอผีสงคราม: ขนหมาป่าไม่สมมาตร เครื่องรางกระดูก/เขี้ยวและเชือกพิธีแดงหม่นร่วมเกราะเหล็กน้ำเงินเดิม. การเปลี่ยนนี้แทนคำบรรยายเสื้อผ้า Achan เดิมและข้อจำกัดเครื่องประดับเล็กของ Juggernaut เฉพาะสองคลาส; อีกแปดคลาสและอาวุธทั้งหมดคงเดิม รอยสักเป็นลายเรขาคณิตแฟนตาซี ไม่เพิ่ม body redesign หรือ VFX. ภาพรอบใหม่แยกใน `class-2-first-pair-02/`; ยังไม่อนุมัติ visual/production

**Production specification revision 2 — 2026-10-12.** ข้อกำหนดสำหรับ Premium 2.5D MMORPG outfit บน V3 ชายเดิม ส่วน technical contract ด้านล่างแทนข้อเสนอทางเทคนิคเดิมที่ขัดกัน คอนเซปต์ทั้งสิบชุด สี silhouette และอาวุธในส่วนประเทศคงเดิม เอกสารพร้อมใช้วางแผนผลิต แต่ **runtime ยังไม่พร้อมรับ modular outfit และยังไม่อนุญาตผลิต bulk**

**Latest image stage:** ผู้ใช้อนุมัติสร้างภาพและเครดิตภายหลังรอบเอกสารแล้ว ได้ภาพ SOUTH ชาย Achan/Juggernaut คลาสละหนึ่งครั้ง รวม20เครดิต ดู [first-pair review](class-2-first-pair-01/README.md). ภาพยังรออนุมัติ ไม่ใช่การอนุมัติ architecture, layer implementation, bulk directions หรือ animation ข้อความ “ไม่มีการสร้างภาพ” ด้านล่างบันทึกสถานะของรอบเอกสารเดิม

สถานะ: คอนเซปต์เสนอเพื่อพิจารณา 2026-10-12 ยังไม่ใช่อาร์ตที่อนุมัติหรือชุดในเกม งานตัวละครหญิงพักตามคำสั่งผู้ใช้ ออกแบบบนสัดส่วนตัวละครชายปัจจุบันเท่านั้น ไม่มีการสร้างภาพ ใช้เครดิต หรือแก้ runtime

ขอบเขตยึดสิบสายใน `packages/shared/src/skill-registry.ts` และอาวุธใน `packages/shared/src/equipment.ts` ไม่ขยายเป็น 12 ประเทศ ใช้ Ullr Hunter ตามระบบปัจจุบัน ไม่เพิ่ม Seidr Witch จากเอกสารเก่า

## ภาษาภาพร่วม

Medium คือผู้ฝึกหัด เมื่อเปลี่ยนคลาส 2 ต้องอ่านออกจากรูปทรงชุดก่อนสี: สายพิธีมีแนวดิ่งและผ้าซ้อน สายประชิดเปิดศอกและแยกขา สายยิงเปิดบ่ายิง สายป้องกันมีมวลเกราะชัดเจน แต่ไม่โตเป็นชุดคลาส 3

ใช้ผ้าทอ หนัง ไม้แกะและโลหะเก่า ผิวด้าน พิกเซลคม สีทองเก่า/หยก/แดงหม่นเป็นจุดร่วมเล็ก ๆ ของโลก แต่สีหลักและการตัดชุดต่างกันตามประเทศ ไม่คัดลอกเครื่องแต่งกายของบุคคลหรืออ้างว่าชุดแฟนตาซีเหล่านี้เป็นชุดพิธีแท้ ไม่ใช้ธงชาติเป็นชุด ไม่ผสมตัวอักษรศักดิ์สิทธิ์แบบสุ่ม รายละเอียดทั้งหมดต่อไปนี้เป็นข้อเสนอใหม่

สัดส่วนสีตั้งต้น: สีหลักประมาณ 60%, สีรอง 30%, เครื่องหมายคลาส 10% ใช้แสงบนซ้ายตามฐานเดิม ลายเล็กยุบเป็นกลุ่มพิกเซล ไม่วาดตัวหนังสืออ่านไม่ได้ ไม่มีแสงเรืองติดชุด ไม่มีวงเวทหรือ VFX รวมในภาพเสื้อผ้า

## 1. ไทย

### Achan Saiyasat — ชุดครูผูกอาคม

- **ภาพจำ:** แนวดิ่งสงบ บ่าทรงแคบ ผ้าพาดเฉียงหนึ่งผืนและแผงผ้ายาวด้านหน้า อ่านเป็นผู้ประกอบพิธี ไม่ใช่นักรบเกราะหนัก
- **การตัด:** เสื้อคอตั้งแขนสามส่วน กางเกงผ้าทรงสอบ ชายเสื้อแยกหน้าเปิดช่วงเข่า ผ้าคาดเอวรัดแน่น ปลายผ้าอยู่เหนือข้อเท้า
- **วัสดุ/สี:** ผ้าฝ้ายงาช้าง `#D8CBA7`, ครามดำ `#273743`, สัมฤทธิ์เก่า `#A88A51`; สายสิญจน์ขาวหม่นเป็นจุดเด่น ไม่ทาทองทั้งตัว
- **รายละเอียด:** ตะกรุดสามชิ้นที่เอว กระเป๋าเครื่องพิธีแบน ลายขอบผ้าเป็นปมและตราแต่งขึ้นใหม่ ไม่ใช้ข้อความยันต์จริง
- **ด้านหลัง:** ผ้าพาดเป็นแนวเฉียงเด่นและปมเอวเล็ก ไม่เพิ่มหางขนนกใหญ่ทับทรงผม
- **อาวุธ:** ไม้เท้าสายสิญจน์เดิม มือและตะกรุดเว้นจากแนวด้าม แขนเสื้อไม่คลุมจุดจับ
- **ต่างจาก Medium:** เพิ่มโครงเสื้อพิธีและชุดเครื่องมือที่เอว แทนการเปลี่ยนสีชุดฝึกหัดอย่างเดียว

### Mor Phhee — ชุดผู้เดินทางกับพราย

- **ภาพจำ:** ช่วงบนกระชับและชายผ้าไม่สมมาตร เคลื่อนไหวคล่องกว่า Achan
- **การตัด:** เสื้อผ้าพันอกทับเสื้อแขนสั้น กางเกงผูกข้อ ผ้าคาดเอวแดงหม่น ปลอกแขนผ้า ไม่ใช้กระโปรงยาวปิดเท้า
- **วัสดุ/สี:** ฝ้ายถ่าน `#302D30`, น้ำตาลดิน `#6A4D3D`, แดงคำหมากหม่น `#914951`, กระดูกเก่าเป็นจุดเล็ก
- **รายละเอียด:** ห่อเครื่องรางและถุงผ้าสองระดับ ตะกรุดเดี่ยว ผ้าพันข้อมือขาวหม่น หลีกเลี่ยงหัวกะโหลกกองใหญ่จนกลายเป็น necromancer ทั่วไป
- **ด้านหลัง:** กระเป๋าแบนช่วงสะโพกและผ้าคาดเอวสั้น เป็นตัวบอกคลาสจากด้านหลัง
- **อาวุธ:** มีดหมอเดิม สะโพกฝั่งมือโจมตีเว้นพื้นที่สำหรับท่าฟันและปลายมีด
- **ต่างจาก Achan:** ทรงเตี้ย คล่องตัว วัสดุผ่านการเดินทาง แทนทรงสูงสะอาดของครูพิธี

## 2. อินโดนีเซีย

### Santet Master — ชุดผู้ถักคำสาป

- **ภาพจำ:** เสื้อคลุมเข้ารูปแนวตั้งกับผ้าพันเอวเป็นกรอบสี่เหลี่ยม ไม่ใช้หมวกแม่มดยุโรป
- **การตัด:** เสื้อคอปิดแขนยาวแคบ เสื้อกั๊กผ้าสั้นทับด้านนอก ผ้าพันสะโพกผ่าด้านข้างเหนือกางเกง ปลายแขนจบก่อนข้อมือ
- **วัสดุ/สี:** ครามม่วงเข้ม `#302E49`, น้ำตาลผ้าทอ `#77513C`, ทองหม่น `#AC8C57`, แดงคล้ำเฉพาะปมเชือก
- **รายละเอียด:** ลายขอบเรขาคณิตต้นฉบับที่ได้แรงบันดาลใจจากงานผ้าทอ ถุงเข็มปิดฝาที่เอวและตุ๊กตาถักชิ้นเล็ก ไม่อ้างลายใดเป็นลายพิธีของชุมชนจริง
- **ด้านหลัง:** แผงผ้าหลังแคบมีลายขั้นซ้อนหนึ่งชุด จำได้โดยไม่ใช้สัญลักษณ์เรืองแสง
- **อาวุธ:** ไม้เข็มสาปเดิม ปลอกแขนเว้นนิ้วและไม่ทำปลายผ้าเสมือนอาวุธชิ้นที่สอง
- **ต่างจาก Keris:** ผ้าแนวดิ่งปิดลำตัวและเครื่องมือถัก/ผูก แทนแนวเฉียงของนักสู้

### Keris Master — ชุดนักรบกริชคู่

- **ภาพจำ:** ไหล่กระชับ เอวแน่น ขาสองข้างอ่านชัด มีเส้นไขว้จากสายหนัง
- **การตัด:** เสื้อสั้นคอเฉียง แขนพับ ผ้าพันเอวลายขอบ กางเกงคล่องตัว ปลอกข้อมือหนัง ฝักสองเล่มเก็บด้านหลังสะโพก
- **วัสดุ/สี:** น้ำตาลไม้เข้ม `#49352D`, เขียวป่าหม่น `#3C5D4D`, ผ้าทราย `#B49C75`, โลหะรมดำ ไม่เป็นนินจาญี่ปุ่น
- **รายละเอียด:** หัวเข็มขัดโลหะทรงเรียบ ลายผ้าใช้แถบใหญ่สองถึงสามแถบ ไม่คัดลอกลายราชสำนักเฉพาะ
- **ด้านหลัง:** ฝักคู่ทรงกะทัดรัด อ่านเป็นคู่แต่ไม่ซ้ำภาพกริชที่ถืออยู่หรือชนต้นแขน
- **อาวุธ:** กริชคู่เดิม เปิดแขนทั้งสองข้างเท่ากัน ชายผ้าไม่พาดมือรอง
- **ต่างจาก Santet:** ชายเสื้อสั้น จุดสนใจอยู่แขนและสะโพก รองรับท่าโจมตีสองมือ

## 3. ญี่ปุ่น

### Onmyoji — ชุดผู้จัดระเบียบดวงวิญญาณ

- **ภาพจำ:** เสื้อพิธีทรงเหลี่ยม ชายสองแผงและแขนทรงกว้างแบบควบคุมขนาด
- **การตัด:** เสื้อคอไขว้ทับชั้นใน กางเกงจีบอ่านเป็นขาสองข้าง เข็มขัดผ้าแบน แผงชายเสื้อถึงกลางหน้าแข้ง แขนบานแค่ท่อนบนและรัดช่วงมือ
- **วัสดุ/สี:** งาช้าง `#DDD4BE`, ครามเข้ม `#30384F`, ม่วงควัน `#6A5C78`, ทองเก่าเป็นตะเข็บเล็ก
- **รายละเอียด:** ซองกระดาษพิธีแบนที่เอว ตราทรงห้าเหลี่ยมต้นฉบับไม่มีดาวห้าแฉก ไม่สร้างคันจิสุ่ม และไม่ใส่อักษรจีน/เกาหลีแทน
- **ด้านหลัง:** แผงผ้าหลังทรงสี่เหลี่ยมและปมเอวเตี้ย ไม่ปิดทรงผมด้วยหมวกบังคับ
- **อาวุธ:** พัดเดิม พัดต้องแยกจากแขนเสื้อด้วยสีและช่องว่าง มองเห็นข้อมือขณะกางพัด
- **ต่างจาก Miko:** คราม/ม่วงและรูปทรงเหลี่ยมเป็นระเบียบ ไม่ใช้แดงขาวเหมือนกันทั้งคู่

### Miko / Shinto Priest — ชุดผู้ชำระทางวิญญาณ (ฐานชาย)

- **ภาพจำ:** ช่วงบนขาวสั้นกับกางเกงจีบแดงหม่น สะอาด เบาและเปิดหน้า ไม่ดัดตัวละครชายเป็นโมเดลหญิง
- **การตัด:** เสื้อพิธีคอไขว้แขนทรงพอเหมาะ กางเกงจีบสูงเหนือข้อเท้า สายผูกข้างสั้น ช่องแยกขาชัดเมื่อเดิน
- **วัสดุ/สี:** ขาวกระดาษ `#E3DDCA`, แดงชาดหม่น `#A84F4D`, น้ำตาลไม้ `#72513D`, เชือกฟางเป็นจุดรอง
- **รายละเอียด:** ถุงเครื่องพิธีสีขาวเล็กและปมเชือกที่เอว ลวดลายแต่งขึ้นใหม่ ไม่ติด torii หรือสัญลักษณ์ใหญ่บนทุกชิ้น และไม่ถือว่าข้อยกเว้น Onmyoji อนุญาตสัญลักษณ์ทั้งหมดกับชุดนี้
- **ด้านหลัง:** ปมผูกแบนขนาดเล็ก แดงช่วงขาเป็นภาพจำ ไม่เพิ่มโบว์ยักษ์
- **อาวุธ:** โกเฮเดิม กระดาษชิเดะเป็นส่วนอาวุธ ไม่วาดซ้ำติดแขนเสื้อ
- **ต่างจาก Onmyoji:** แบ่งสีบน/ล่างชัด ทรงเบากว่า ชายเสื้อสั้นกว่า

## 4. นอร์เวย์

### Rune Seer — ชุดผู้หยั่งศิลา

- **ภาพจำ:** เสื้อคลุมยาวผ่าหน้ากับบ่าผ้าขนสั้น รูปทรงยอดแคบและฐานเปิด
- **การตัด:** เสื้อขนสัตว์ทอแขนพอดีตัว คลุมบ่าสั้น ผ้าชายสองแผงถึงหน้าแข้ง กางเกงและรองเท้าหนังแยกชัด
- **วัสดุ/สี:** น้ำเงินหิน `#3D5268`, เทาหมอก `#A9B1AC`, น้ำตาลหนัง `#61503E`, เขียวหยกหม่นเฉพาะเครื่องประดับศิลา
- **รายละเอียด:** จี้หินเรียบและหัวเข็มขัดเก่า ขอบผ้าลายขั้นต้นฉบับ ไม่ใช้เส้นรูนสุ่ม ภาพที่สร้างในอนาคตต้องไม่มีอักษรรูน; หากใช้จริงให้วางจากระบบรูนที่อนุญาตภายหลัง
- **ด้านหลัง:** แผงผ้าหลังทรงแคบและแถบไหล่สีเทา ไม่มีเสื้อคลุมลากพื้น
- **อาวุธ:** ไม้เท้าศิลารูนเดิม สีชุดไม่กลืนศิลาหัวไม้เท้า ไม่จำเป็นต้องมีน้ำแข็งติดเสื้อทุกจุด
- **ต่างจาก Ullr:** ผ้ายาวและชั้นทอหนา ภาพจำเป็นผู้ประกอบพิธีมากกว่านักล่า

### Ullr Hunter — ชุดนักล่าทางหิมะ

- **ภาพจำ:** เสื้อคลุมสั้นไม่สมมาตร บ่ายิงโล่ง ซองลูกธนูแนวเฉียงด้านหลัง
- **การตัด:** เสื้อขนสัตว์สั้นทับหนังบาง ผ้าคลุมบ่าฝั่งตรงข้ามสายธนู กางเกงรัดช่วงน่อง บูตหนัง ปลอกแขนกันสายธนู
- **วัสดุ/สี:** เขียวสน `#3B564B`, น้ำตาลหนัง `#6F523A`, เทาหิมะหม่น `#BDC1B5`, เหล็กเก่าเป็นจุดเล็ก
- **รายละเอียด:** ซองลูกธนูกะทัดรัด เชือกมัดอุปกรณ์ ไม่ใส่หมวกเขาวัวหรือเกราะไวกิงแฟนตาซีขนาดใหญ่
- **ด้านหลัง:** ลูกธนูสามถึงสี่กลุ่มพิกเซลเหนือไหล่ แยกสีจากผม ห้ามให้ตำแหน่งซองบังคับเปลี่ยนทรงผม
- **อาวุธ:** ธนูอุลล์เดิม ผ้าคลุมห้ามชนสาย/มือดึง แขนทั้งคู่ต้องอ่านชัดในท่ายิง
- **ต่างจาก Rune Seer:** ทรงสั้น เส้นเฉียง หนังมากกว่าผ้า ไม่มีหางเสื้อพิธี

## 5. รัสเซีย / ไซบีเรีย

คู่นี้ใช้แนวแฟนตาซีป่าไทกาตามคลาสในโครงการ ไม่อ้างว่า Slavic และประเพณีไซบีเรียทุกกลุ่มเป็นวัฒนธรรมเดียวกัน ไม่คัดลอกเครื่องพิธีเฉพาะชุมชนมารวมกัน

### Juggernaut Volkhv — ชุดปราการไทกา

- **ภาพจำ:** ลำตัวกว้างทรงสี่เหลี่ยม บ่าเกราะต่ำ เอวแน่นและขาแข็งแรง มวลชุดเพิ่มด้วยเสื้อผ้าไม่ขยายกระดูกฐาน
- **การตัด:** เสื้อทอหนาทับเกราะแผ่นเล็กแบบแฟนตาซี บ่าหนังขลิบขนสั้น เกราะหน้าแข้ง ชายเกราะแยกเหนือเข่า ข้อศอกเปิด
- **วัสดุ/สี:** เหล็กน้ำเงินหม่น `#465563`, หนังดำ `#3A302C`, ขนเทา `#A6A296`, แดงดิน `#874844` เฉพาะเข็มขัด/ขอบ
- **รายละเอียด:** หมุดเกราะเป็นกลุ่มใหญ่ จี้ไม้ทรงหมาป่าต้นฉบับชิ้นเดียว ไม่ใส่หัวหมาป่าขนาดใหญ่บนไหล่บังหน้า
- **ด้านหลัง:** แผ่นเกราะกลางหลังกับขอบขนแนวนอน ไม่ใส่โล่สำรองบนหลังซ้ำโล่ในมือ
- **อาวุธ:** ขวานมือเดียวและโล่เดิม เกราะฝั่งโล่บางลงใกล้รักแร้ เว้นข้อมือรองและขอบโล่ ชุดไม่บังคับให้โล่อยู่หน้าตลอด
- **ต่างจาก Taiga:** น้ำหนักอยู่กลางลำตัว รูปทรงปิดมั่นคง ไม่มีผ้าหรือขนปลิวขนาดใหญ่

### Taiga Shaman — ชุดเขี้ยวแห่งป่าเหนือ

- **ภาพจำ:** บ่าเอียงและเอวเบา แขนสองข้างเปิดสำหรับขวานสองมือ ไม่ใช้เกราะเดียวกับ Juggernaut เปลี่ยนสี
- **การตัด:** เสื้อหนังแขนสั้นทับผ้าทอ ปกขนสั้นฝั่งเดียว สายรัดลำตัวเฉียง ผ้าคาดเอวปลายสั้น กางเกงกับบูตหนัง
- **วัสดุ/สี:** น้ำตาลเบิร์ชเข้ม `#654936`, เขียวเทาป่า `#505C4B`, ขนครีมหม่น `#C1B49B`, แดงสนิม `#9A5145`
- **รายละเอียด:** เครื่องรางไม้ทรงเขี้ยว ถุงเดินป่าแบน ลายขอบแถบกว้างแต่งขึ้นใหม่ ไม่มีอักษรรูนแบบนอร์เวย์
- **ด้านหลัง:** สายหนังเฉียงและปกขนหนึ่งข้างอ่านชัด ไม่เพิ่มขวานสำรองบังท่าเหวี่ยง
- **อาวุธ:** ขวานสองมือไทกาเดิม เว้นวงแขนเหนือศีรษะและช่องระหว่างมือ ผ้าพาดไม่ตัดผ่านด้าม
- **ต่างจาก Juggernaut:** เส้นเฉียง วัสดุนิ่มและแขนคล่อง แทนมวลเหล็กทรงเหลี่ยม

## ข้อกำหนดทำอาร์ตและเชื่อมตอนเปลี่ยนคลาส

1. ทำภาพเสนอ SOUTH ของชายบนฐานปัจจุบันก่อน: ชุดอย่างเดียว และภาพประกอบร่วมอาวุธเดิมแยกกัน ตรวจที่ขนาดเล่นจริงและขยาย nearest ไม่สร้างฐานร่างใหม่ ไม่แก้หน้า ผม ผิว หรือจุดเท้า
2. เครื่องประดับศีรษะเป็นทางเลือกแยกจากชุดคลาส ห้ามบังคับหมวกทับผมผู้เล่น อาวุธ/โล่/กริชรองไม่รวมในภาพเสื้อผ้า
3. โครงแบ่งชิ้นเป้าหมาย: torso, upper/lower sleeves, waist, left/right legs, boots และ front/back cloth เป็น **authoring contract ที่เสนอ ยังไม่มี renderer รองรับ** ใช้ technical matrix ท้ายเอกสารเป็นเกณฑ์ ไม่ถือว่ามี skeletal joints ของเสื้อผ้าอยู่แล้ว
4. ขนาดพิกเซลและตำแหน่งชิ้นยึดจากฐาน V3 จริงก่อนผลิต ไม่ใช้ skeleton legacy ที่คลาดจากภาพหรือสเกลตัวละครเพื่อยัดชุด เก็บ source/prompt/receipt แยกในโฟลเดอร์ของคลาส
5. หลังภาพเสนอได้รับการเลือก จึงทำแปดทิศและตรวจ idle/walk/attack/cast/hurt/death ตามคลิปที่ rig รองรับ ทิศที่ยังไม่มีต้องระบุว่าขาด ห้ามยืมชุดจากอีกคลาสแบบเงียบ ๆ
6. ตรวจแขนกับอาวุธจริงทุกทิศ โดยเฉพาะ Keris, Juggernaut และ Ullr; เส้นชายผ้าต้องไม่กระโดดระหว่าง idle กับ attack ไม่ทำ hitbox จากขอบชุด
7. ข้อเสนอการเชื่อม: เมื่อเซิร์ฟเวอร์ยืนยัน tier 2 + branch ให้เลือก class-outfit ID จากข้อมูลกลาง ผู้เล่นทั้งสองฝั่งเห็น ID เดียวกัน และโหลดเซฟคืนได้ ไม่ให้ client เลือกคลาสเองด้วยชุด
8. **ยังต้องตัดสินใจก่อนลงระบบ:** ชุดประจำคลาสเป็น appearance พื้นฐานหรือ body equipment ที่ผู้เล่นถอดได้; ให้เกราะ body ที่สวมทับมีผลต่อภาพอย่างไร ข้อเสนอเริ่มต้นคือ class appearance แยกจากสถิติ/ไอเท็ม ไม่แจกเกราะเพิ่มหรือเปลี่ยนค่าสถานะโดยปริยาย ไม่มีการเปลี่ยนระบบนี้ในรอบคอนเซปต์

## แผนผลิตที่เสนอ

รอบแรก: Achan + Juggernaut เป็นคู่ทดสอบทรงผ้า/เกราะ จากนั้น Keris + Ullr ทดสอบมือคู่/ธนู แล้วจึงอีกหกชุด เก็บภาพเทียบ Medium → class 2 แสดงหน้า/หลัง/ด้านข้างและอาวุธ เปิดตรวจคลาสละชุดก่อนขยายแอนิเมชัน ไม่เริ่ม bulk generation จากเอกสารนี้

เกณฑ์ตรวจร่วม: เดาคลาสจาก silhouette ได้ในภาพเทา, คู่ร่วมประเทศต่างกันชัด, หน้า/ผม/มือยังอ่านได้, ไม่ชนอาวุธ, ด้านหลังยังมีเอกลักษณ์, ไม่มีตัวหนังสือสุ่ม/ลายศักดิ์สิทธิ์คัดลอก, ไม่มีการแตะตัวละครหญิง

## แหล่งอ้างอิงภายในและการตรวจ

อ้างอิงขอบเขตคลาส/อาวุธจาก skill-registry.ts, equipment.ts และ README อุปกรณ์; สัดส่วน/การแยกภาพจาก character-rig.md, architecture.md; ข้อจำกัดภาพจาก art-direction.md และ SHAMAN_WORLD_ART_BIBLE.md รายละเอียดเสื้อผ้าและรหัสสีใหม่ทั้งหมดเป็นงานออกแบบแฟนตาซี ไม่ใช่ข้อเท็จจริงทางประวัติศาสตร์ ไม่มีภาพต้นแบบที่สร้างใหม่และไม่มี runtime integration จึงยังตรวจ clipping/animation จริงไม่ได้ เอกสารล้วน ไม่ต้อง build เกม

## A. Technical baseline — inspected implementation

หลักฐานเป็น repository snapshot วันที่ 2026-10-12 ไม่ใช่การรับรอง visual approval ของ assets เก่า เอกสาร architecture มีประวัติหลายรุ่น จึงยึด implementation และ manifests ด้านล่างสำหรับ V3

| เรื่อง | รองรับจริง / แหล่งตรวจ | ผลต่อการผลิต |
|---|---|---|
| Native body canvas | `body-eight-model.ts`, `walk-eight-model.ts`, V3 manifests: 128×128; images ต่อเฟรม ไม่ใช่ atlas เสื้อผ้า | รักษา canvas และตำแหน่งฐาน ห้าม trim แล้วทิ้ง offset |
| Body | `V3Puppet.ts` โหลด `body-eight-02`, `walk-eight-02`, `actions-eight-02` เป็นภาพ headless body ที่มีเสื้อผ้าเดิมรวมอยู่ | ไม่มี torso/sleeve/leg runtime แยก ไม่ใช่ naked base ที่แต่งทับได้ทันที |
| Head | V3 neck pivot รายเฟรม; SSR runtime วาด headBase/face/hair โดยกรอง body ออกจาก composer (`SsrHead.ts`) | SSR part types ไม่ใช่หลักฐานว่าระบบโลกวาด outfit parts แล้ว |
| Ground origin | idle direction `bodyOrigin`; Phaser origin `(x+0.5)/128, (y+1)/128` ใน show/showCast/showAttackFrame | ไม่แทนทุกทิศด้วย 64,128 และไม่ใช้ bbox center เป็น pivot |
| Animation pivots | neckPivot และ bodyOrigin ใน manifest รายเฟรม; head ใช้ neck ของเฟรมจริง | คัดลอก binding จาก source clip ไม่คำนวณจากขอบเสื้อใหม่ |
| Hand attachments | `hand-anchors.json` + `v3-weapon.ts`, main/off/weaponHand/rotation; ไม่ใช่ skeletal hand bones | ห้ามสมมติ elbow, shoulder, knee หรือ waist joint; ต้อง author masks/frames เพิ่มหากเลือกแยกชิ้น |
| Scale | `CharacterRig.setScale` คูณ input ด้วย `V3_SIZE_RATIO = 118/97` | ชุดตาม effective actor.scaleX/Y เดียวกัน คูณ ratio ครั้งเดียว ไม่กำหนด universal screen height |
| Filtering | V3, SSR และ gear ใช้ Phaser NEAREST | พิกเซล native คม; effective scale อาจเป็นเศษส่วน ไม่อ้าง pixel-perfect integer display ทุกกล้อง |
| Palette | SSR hair มี ramp 8 steps, red index `i*32+16`, `ssrRampIndex`; body/outfit ไม่มี palette limit/dye API ที่ตรวจบังคับ | ห้ามอ้างว่าชุดมี 8 สีหรือย้อมชุดได้แล้ว สี hex ในคอนเซปต์คือข้อเสนอ ไม่ใช่ palette runtime |
| Outline | ไม่พบ validator ความหนา outline หรือ fixed outline color ใน V3 loader | เก็บรูปแบบ contour ของฐานจริง; outline rule ด้านล่างเป็น art proposal ไม่ใช่ค่าเครื่องยนต์ |
| Transparency | PNG images ประกอบผ่าน Phaser; alpha/tint actor ส่งต่อ head/gear | เสนอ RGBA transparent สำหรับชุด ไม่มี glow/background/text baked; ยังไม่ได้ audit PNG ทุกไฟล์ในรอบเอกสาร |

### A1. Idle anchor table — native pixels

จาก `apps/client/public/assets/character-v3/body-eight-02/manifest.json` โดยตรง Head pivot เป็น head-eight-01; layered-head path อาจเลือก `layer.pivot` แทน และ SSR ใช้ anchors ของ SSR part ของตนเอง ห้ามเอาตารางนี้แทนทั้งสาม path โดยไม่ตรวจ

V3 manifest order คือ S,SE,E,NE,N,NW,W,SW แต่ `SSR_DIRECTIONS` คือ S,SW,W,NW,N,NE,E,SE ต้องจับคู่ด้วยชื่อทิศ ไม่คัดลอก numeric direction index ข้ามสัญญา SSR clip IDs ใช้ action index×8 + SSR direction index

| Facing | bodyOrigin x,y | neckPivot x,y | headPivot x,y |
|---|---|---|---|
| south | 62,112 | 62,48 | 62,49 |
| south-east | 64,114 | 62,48 | 65,49 |
| east | 63,113 | 59,48 | 63,49 |
| north-east | 63,112 | 62,48 | 63,49 |
| north | 63,112 | 62,48 | 64,49 |
| north-west | 62,112 | 62,48 | 64,49 |
| west | 61,113 | 65,48 | 65,49 |
| south-west | 61,114 | 62,48 | 63,49 |

Head legacy-layer placement ใน V3: world x = actor.x + (neck.x − idle.bodyOrigin.x) × scaleX; world y = actor.y + (neck.y − idle.bodyOrigin.y − 0.5) × scaleY; head image origin `(pivot.x+0.5)/128,(pivot.y+0.5)/128`. SSR ใช้ coordinate conversion ของ `SsrHead.draw` แยกต่างหาก ต้อง regression ทั้ง SSR และ fallback head

### A2. Pixel art authoring rules — proposed acceptance rules

- ไม่เพิ่มขนาด canvas หรือสเกลร่างเพื่อให้เกราะดูหนัก ให้เปลี่ยน silhouette ของเสื้อผ้าในพื้นที่ที่ตรวจแล้วเท่านั้น
- ใช้ขอบสีมืดสัมพันธ์วัสดุ แยกผิว/ผ้า/เหล็กด้วย value; ไม่เพิ่มเส้นดำหนาอัตโนมัติรอบทุกชิ้น เพราะเมื่อประกอบจะเกิดเส้นซ้อน ตรวจ contour เทียบฐาน native และ gameplay scale
- ขอบ opaque-to-transparent คม ไม่มี halo จากสีพื้นเดิม ห้าม antialias/blurry resampling ตอน export; ขอบโปร่งบางที่ต้องใช้เป็นกรณียกเว้นต้องระบุ mask และเหตุผล
- สี concept เดิมคงไว้; shade ramps ต่อวัสดุต้องเสนอพร้อม swatch ก่อนผลิต ยังไม่มีจำนวนสีสูงสุดที่อนุมัติ ห้ามให้ validator แต่งเพดานสีขึ้นเอง
- รักษาผิว หน้า ผม สัดส่วน เท้า และ anchor เดิม byte-exact ในไฟล์ต้นฉบับ; composite comparison แยกจาก source ไม่แก้ฐานเพื่อซ่อน clipping

## B. Modular outfit layer contract — PROPOSED, not implemented

**Blocking dependency:** ลำตัวมีชุด Medium ติดอยู่แล้ว การวาดเสื้อใหม่ทับโปร่งอย่างเดียวไม่ลบชาย/แขนเสื้อเดิม ต้องเลือก production path ที่ G1: (A) replacement clothed-body frames บน geometry/timeline เดิมพร้อมแยกชั้นหัว/gear ต่อไป หรือ (B) authoring masks/part frames และ renderer ใหม่ที่ซ่อนชุดเดิมโดยไม่เปลี่ยน anatomy A ก็ต้องมี class-body selection implementation; ทั้งสองยังไม่รองรับใน V3 runtime ปัจจุบัน ห้ามเสนอ naked-base redesign เป็นเงื่อนไขบังคับ

### B1. Technical layer matrix

ชิ้นงาน author เป็น full-canvas 128×128 RGBA ต่อ `class/action/facing/frame/layer` ร่วม body origin เดิม **ไม่มี local skeletal pivot ใหม่** การขยับต้องมาจาก frame artwork ของ clip ที่ตรงกัน Slot ID ด้านล่างเป็น proposed namespace ไม่ใช่ SsrPartKind หรือ EQUIPMENT_VISUALS kind ที่นำไปใช้ได้ทันที

| Proposed layer slot | Coverage / binding | Order and split requirement | Missing policy |
|---|---|---|---|
| torso | เสื้อ/เกราะลำตัว ไม่รวมหน้า/มือ; full-frame canvas | ระหว่าง limb ที่อยู่หลังและ limb ที่อยู่หน้า | Required; ไม่แทนด้วย Medium เงียบ ๆ |
| sleeve-left-upper/lower | แขนซ้ายเชิงกายวิภาค ไม่ใช่ซ้ายจอ | per-frame behind/in-front torso; หาก sleeve เดียวพาดสองระดับให้ split | Required หรือ declared sleeveless; ไม่อ้าง joint interpolation |
| sleeve-right-upper/lower | แขนขวาเชิงกายวิภาค | เช่นเดียวกับซ้าย; sleeve cuff ต้องอยู่ใต้ fingers overlay ที่เกี่ยวข้อง | เช่นเดียวกับซ้าย |
| waist | เข็มขัด/ผ้าคาด ไม่รวมปลายชายผ้า | ปิดรอย torso/legs; ส่วนที่พันหลัง split ไป back segment | Required |
| leg-left / leg-right | กางเกงตาม pose เดิม | far leg ก่อน near leg ตาม frame; มือ/cloth อาจบังบางส่วน | Required; ไม่เป็นภาพขาสำรองจากอีก clip |
| boot-left / boot-right | รองเท้าเหนือ foot pixels เดิมตาม approved coverage | อยู่กับ leg ที่ตรงกัน; ไม่เลื่อน contact row | Required หรือ declared barefoot (ต้องอนุมัติ) |
| cloth-front | แผงหน้าหรือหางเสื้อที่มองจากหน้า | เหนือ legs/torso ที่ปิดจริง แต่ต่ำกว่ามือ/อาวุธหน้าที่ต้องอ่าน | Optional declared absent; ไม่ fabricate transparent substitute |
| cloth-back | ผ้าคลุม/ชายหลัง | อยู่หลัง torso เมื่อ far; เมื่อหัน north แผงหลังที่มองเห็นอาจต้องเป็น body-surface overlay | Optional; ชื่อ “back” ไม่ใช่ depth คงที่ |
| accessory-body | ถุง/ตะกรุด/ซองธนู/ปกขน | แยก near/far segment เมื่อทับหลายระดับ; ไม่รวม headgear/weapon | Optional with explicit absence |
| protected anatomy/head/gear | ไม่ใช่ outfit deliverable | ใช้ต้นฉบับและ resolver เดิม; ต้องมี coverage mask ตรวจว่าชุดไม่ลบมือ/หน้า | Reference required, no edits |

Upper/lower sleeve เป็นการแบ่ง artwork ไม่ใช่เพิ่มข้อศอก rig; boot/leg ไม่มี bone solver อยู่แล้ว ถ้าเลือก path A matrix นี้ใช้ในไฟล์ authoring แล้ว flatten เฉพาะ body fragments ที่ approved; ไม่ทำให้ per-layer runtime capabilities เกิดขึ้นเอง

### B2. Direction and animation order contract

| Facing family | Default visual expectation (proposal) | Mandatory exception review |
|---|---|---|
| S | front cloth/waist visible; rear cape behind torso | Attack arms crossing chest; two-handed staff/axe |
| SE / E / NE | far arm/leg then torso then near arm/leg; cloth split around visible arm | Screen-side is resolved from actual pose, not hardcoded anatomical left/right |
| N | back panel visible on body surface; front apron generally occluded | Raised arm/weapon crossing back; quiver versus long hair |
| NW / W / SW | independently authored side order | No automatic mirror of asymmetric sash, shoulder fur, quiver or weapon hand |

Logical painter order per pose: rear external fragments → far limb fragments → torso/legs surfaces → waist/visible cloth surfaces → near limbs → hand/weapon interleaving → head/hair/headgear as applicable. **Not one global stack:** a sash may split, an arm may cross torso, a back cape may become visible surface. A frame must supply an ordered fragment list with no cyclic ordering and explicit occlusion masks if a single fragment cannot satisfy it. Proposed tuple key `(classId, action, facing, frameIndex)` plus segment IDs; default inheritance only when visually checked and explicitly recorded. No numeric new depth slots approved here

Existing gear depths in `ModularRig.ts`: rear/main or off-hand `actor.depth−0.04`, front `+0.04`, hand overlay `+0.05`, headgear `+0.06`. Legacy layered V3 head uses `+0.01/+0.012/+0.014/+0.016`; SSR uses `+0.01 + item.order*0.0002`. Outfit renderer must negotiate space against **both** paths, not reserve these depths blindly. Current front/back weapon resolution uses frame hand data plus category/facing carry profile; retain it, never force all weapons in front

## C. Animation coverage and validation checklist

Measured manifest coverage, all eight directions in order S,SE,E,NE,N,NW,W,SW:

| Clip | Real frames per direction | Playback / production requirement |
|---|---|---|
| idle body-eight-02 | 1 | Static body; blinking head is separate, do not claim four-frame V3 idle |
| walk-eight-02 | 8 | Manifest fps=8; gameplay computes 8×WALK_SPEED/WALK_CYCLE_UNITS = 8×4/(8/3) = 12fps; preserve actual timeline |
| attack | 8 | Manifest16fps; generic fallback, body weapon style chosen by equipment |
| each published weapon attack | 8 | Manifest16fps; actual attack duration can be adjusted elsewhere; use current runtime cadence, no cloth-specific timer |
| cast | 12 | Manifest12fps; showCast index driven by authoritative cast timeline, not a separately running outfit loop |
| hurt | No V3 clip in inspected loader/manifests | Unsupported outfit animation; test existing game response only, no invented frames |
| death | No V3 clip in inspected loader/manifests | Existing world downed tint `0x7a7a86`, alpha0.55; not a collapse animation |

All 11 published weapon-action IDs exist, including generic attack-cast. Class-specific body actions: Achan=`attack-cast-staff`, Mor=`attack-knife`, Santet=`attack-cast-wand`, Keris=`attack-dagger`, Onmyoji=`attack-cast-fan`, Miko=`attack-cast-gohei`, Rune Seer=`attack-cast-rune`, Ullr=`attack-bow`, Juggernaut=`attack-axe-shield`, Taiga=`attack-axe-twohand`. Assignments from `weapon-action.ts`; preserve registry item IDs. Outfit selection follows **equipped weapon motion**, not class name alone, so a player swapping to another allowed weapon creates additional clip coverage requirements

**Keris exception:** attack-dagger art already contains blades and `v3WeaponFrame` returns undefined to suppress attachments; animation alternates frames0–3 and4–7. Preserve suppression and both half transitions; do not publish the generic “no weapon baked” rule as proof that existing Keris attack art has no blades

Per class, per direction, per supported frame:

- [ ] Exact source clip/frame binding, stable canvas/origin; feet, neck and hand references unchanged; no recentering by outfit bounds.
- [ ] Seam and material continuity at shoulder/elbow/waist/knee; no pixel popping from accessories changing identity or count.
- [ ] Frame scrub plus full-speed loop: idle→walk→idle, direction change during walk, idle→attack→rest, consecutive fast attacks and Keris A/B halves.
- [ ] Cast start/channel/release/cancel checked against current server-driven indices; cloth stops/changes with body, no autonomous release.
- [ ] Main/off grip contact, bow draw clearance, shield rim versus sleeve, two-handed shaft versus cuffs; use actual carry configuration.
- [ ] Every asymmetric element follows the correct body side through all eight facings; no assumed west mirror.
- [ ] SSR hairstyles and fallback head: no collar/face seam, quiver clipping or hood-induced disappearance. Existing intentional hair occlusion is not silently redesigned.
- [ ] Equipment swap mid-cycle keeps body phase and does not retain old hand/cloth fragments; unequip/missing texture cleans up.
- [ ] Actor tint/alpha/visibility propagate to all outfit parts; downed, stealth, hiding and respawn leave no floating accessories.
- [ ] Hurt/death marked unsupported as animations; verify current downed visuals and recovery without claiming missing clips complete.
- [ ] Desktop, portrait, landscape at actual map zoom, plus native and nearest enlarged review; physical mobile check stays open if unavailable.

Standard per-class own-weapon review covers 8×(1+8+8+12)=232 body poses, not 232 automatically approved assets. Extra weapon swaps/fallback actions expand the matrix; do not certify arbitrary equipment compatibility from these 232 alone

## D. Premium visual quality acceptance

Classic Ragnarok Online is a readability reference and Tree of Savior a costume-craftsmanship reference only: no sprites, costumes, textures, traced silhouettes or training inputs from either game. “2.5D” here describes crisp sprites in the existing elevated world camera, not a new 3D renderer or perspective redesign

| Gate | Reviewer evidence | Reject when |
|---|---|---|
| Class readability | Unlabelled silhouettes and grayscale of all ten, at gameplay scale; paired same-country comparison | Only color/weapon distinguishes the two outfits |
| Costume craft | Native/front/back/detail sheet: believable seams, fabric overlaps, metal fastening, weight and wear | Ornament is noise; hardware floats; unrelated symbols substitute for construction |
| Cultural identity | Country/class brief comparison and motif provenance; fictional vs verified cultural references labelled | Flags, stereotypes, mixed scripts or copied sacred motifs drive identity |
| Material/value | Cloth matte, metal restrained, fur in coherent clusters; inspect on light/dark map regions | Face/hands/weapon disappear into same-value clutter; bloom hides construction |
| Silhouette hierarchy | Face and weapon read first, class structure second, trim third | Shoulder/hat/cape dominates base or hides other players/target |
| Pixel finish | Native alpha edges and gameplay-scale recordings | Halos, resampling blur, doubled seams, accidental holes or contour flicker |
| Motion quality | Entire clip recordings plus contact sheets | Snapping, foot sliding introduced by outfit, changes in trim/pouch identity, unintended clipping |
| Model preservation | Base hash report + protected-region comparison | Anatomy, face, hair, feet or scale changed to accommodate costume |

No existing fixed outline thickness, palette count, clipping-area tolerance or perceptual score was found. Do not invent numeric pass thresholds. Visible unintended clipping/floating/halo requires correction or an explicit documented art exception. Technical validation and named art approval are separate; technical pass cannot set visualApproved

## E. Class appearance / equipment override — APPROVAL PROPOSAL

Proposed policy, not current functionality:

1. Class outfit is a visual identity selected by server-confirmed tier/branch, separate from combat armor stats. Stable proposal IDs `class2.<branch>.male.v1` use real branch IDs: achan-saiyasat, mor-phhee, santet, keris, onmyoji, miko, rune-seer, ullr-hunter, juggernaut, taiga. These are not currently registered items or runtime keys
2. Equipped body armor continues affecting existing stats/ownership exactly as now. Proposal default: class outfit remains visible; an explicitly approved full-body cosmetic may override its visual only. Body-item art versus class appearance precedence needs approval before migration
3. Precedence proposal: approved full-body cosmetic → class outfit → existing male novice visual when class assets unavailable. A partial missing outfit must fall back **as a complete coherent set** with a development diagnostic, never blend unrelated class clips. Release requires complete advertised coverage; fallback is resilience, not permission to ship incomplete art
4. Weapon/shield/second Keris always reflect authoritative equipped items and existing grip/depth behavior. Costume cannot replace weapon identity, conceal equipped weapons for readability, or change hitboxes/range. Preserve the intentional baked-blade Keris attack exception
5. Headgear remains an independent slot, haircut remains player selection. No forced class hat; no automatic hiding hair without approved per-headgear compatibility data. Cosmetic accessories must not hide the face, hands or target readability
6. Clipping resolution order: adjust costume coverage/cut → split near/far fragment → approve alternate accessory position → explicitly suppress optional accessory by authored compatibility rule. Never move grip, rescale body, change weapon scale or delete required head/hair pixels as an outfit workaround
7. Cloth/accessory visibility must be deterministic for the same authoritative look, facing and frame on all clients. No client-only “hide enemy shield” toggle in this proposal. Downed/stealth visibility remains existing gameplay presentation; parts inherit it
8. Save/load, class change, reconnect and observers must resolve identical appearance IDs without granting items or mutating gameplay rules. Protocol/schema mapping, body-equipment conflict handling and migration are future implementation dependencies, not changes authorized here

## F. Automated asset validation pipeline — DESIGN ONLY

No validator added/executed in this phase. Existing parsers check version, direction sequence, path prefixes, hashes and bounded integer pivots; they do **not** verify PNG dimensions, all bytes, outfit slots or visual clipping. Their fixed V3 paths reject new arbitrary outfit manifests; do not label a new manifest runtime-compatible merely because its JSON resembles them

Proposed stages and blocking behavior:

1. **Inventory/source lock:** record commit or file hashes of base, head, hands, source manifests, registry and equipment config; forbid changed protected sources and female paths. Discover required motions from current equipment resolver and supported swap policy, not a hardcoded ten-class guess
2. **Schema/naming:** proposed path `docs/design/equipment/class-2/<branch>/male/v1/<action>/<facing>/<frame>-<slot>.png`; sidecar includes source clip URL/hash, base ID, layer slot, expected frame, proposed order segments and explicit absent-slot declarations. This is an authoring path, **not a URL accepted by current loaders**. Reject unknown branch/slot/action, duplicate tuple, path traversal, bad case and undeclared missing layer
3. **Image decode:** read actual PNG width/height/channels/alpha and SHA-256; full canvas128×128, no corrupt data; compare declared hash. Check frame sequence0…n−1, eight exact facings, count matches bound source clip. Optional absent layer uses declaration, not a missing-file accident
4. **Pivot/frame audit:** compare origin/neck metadata to locked source per frame; integer native pixels within128 bounds; no new local pivot required for full-canvas fragments. Verify transformation matches Phaser origin conversion; never infer anchor from changing clothing bounds
5. **Layer audit:** require complete torso/waist/limbs or approved variant declarations, unique fragment IDs, acyclic complete draw order per pose, declared near/far splits. Verify coverage/protected masks do not erase exposed hands/face/feet; flag edge contact and temporal difference maps for review rather than asserting anatomy from alpha alone
6. **Palette/export audit:** compare against the **approved per-outfit swatch/ramp file when available**; prior to approval report histogram only, no fabricated color cap. Flag alpha halos/resampling patterns; preserve SSR hair ramp encoding untouched. Report outline variation for visual inspection, not an invented universal thickness limit
7. **Runtime compatibility gate:** separate offline authoring validity from loader support. Until G1/G4 adapter work is approved and implemented, result must say `runtimeCompatible: false / blocked: no V3 class-outfit resolver`. Later validate proposed contract using its own parser plus existing V3/SSR/gear composition tests; never silently relax existing parsers
8. **Behavioral integration gate (later authorized code phase):** real-renderer tests for phase/scale/pivots/depth, all advertised actions, fallback/cleanup, Keris suppression, equip/swap, SSR/fallback head, server look sync/save; existing typecheck/build and equipment tests. Fixture generation must run without PixelLab or network generation
9. **Visual gate:** deterministic contact sheets plus full-speed recordings, desktop/mobile-layout views, defect log and human approval attached. CI emits separate technical/visual/runtime statuses and evidence URLs; human review remains mandatory

Report fields proposal: classId, sourceHashes, coverageByActionFacing, required/absent layers, dimensions, pivot mismatches, palette diagnostics, order errors, runtimeCompatible, technicalPass, visualReviewStatus, reviewer/date, known exceptions. No invented command name implies this pipeline already exists

## G. Production milestones / explicit approval gates

| Stage | Deliverable | Approval / exit gate |
|---|---|---|
| G0 — this documentation phase | Existing ten concepts + audited baseline + layer/animation/policy/validation specifications | User chooses design direction and open decisions below; **no images/credits/code authorized by document completion** |
| G1 — technical path review | Compare replacement-frame versus split-layer feasibility on unchanged male base; source protection and resolver/depth design | Approve path, ownership policy, rig integration scope and required clip coverage before implementation or paid production |
| G2 — first pair concept proof | Achan Saiyasat and Juggernaut Volkhv SOUTH outfit proposal with existing weapons separately composited | Separate approval for generation tool, budget and attempt cap before any paid call; approve both costume silhouettes/materials before directional expansion |
| G3 — first pair directional art | Same two outfits eight static facings, front/back cloth decisions and source hashes | User approves all facings and head/weapon readability; failed directions remain failed, no bulk retries |
| G4 — first pair animation + adapter | Only after approved code scope: approved outfit selection/layer adapter, actual walk/own attack/cast coverage and automated validation | Technical suite + visual frame/transition review + two-client swap/save verification; hurt/death explicitly unsupported unless separately scoped |
| G5 — complex weapons | Keris and Ullr outfit proofs, dual-hand and bow compatibility | Review baked blades, half-stabs, quiver/head and bow-string clearance before expanding |
| G6 — remaining six | Mor, Santet, Onmyoji, Miko, Rune Seer, Taiga, individually gated through static→directions→actions | Per-class art approval and technical evidence; no auto-approval from first pair |
| G7 — release readiness | Ten-class complete compatibility matrix, save/load/observer evidence, responsive review and defect report | User acceptance; physical-device gaps/unsupported states explicit; no deployment authorized by art approval |

G4 may need proof implementation before animation assets can be honestly certified; do not generate complete libraries against an unproven layer architecture. A failed gate pauses dependent work, preserves old files, and records failure without spending retries by default

## H. Production readiness checklist

- [x] Scope locked to five existing nations/ten branches; original concepts, colors and weapons preserved.
- [x] V3 dimensions, idle origins, loader paths, action counts, existing depth values and scale formula inspected from source.
- [x] Existing head/gear modularity distinguished from unimplemented outfit composition; female pipeline excluded.
- [x] Technical matrix, animation checklist, override proposal, validator design and approval stages documented.
- [ ] User approves silhouettes/material direction and first-pair production scope.
- [ ] Technical production path and unchanged-anatomy coverage/mask strategy approved; no redesign of base.
- [ ] Appearance/body-armor/cosmetic precedence, persistence mapping and swap coverage approved.
- [ ] Palette/outline swatches visually approved; no unsupported numeric constraints assumed.
- [ ] Tool/budget/attempt authorization before images; receipts and source hashes retained.
- [ ] Renderer/manifest adapter implemented and tested in a later authorized phase.
- [ ] Automated pipeline implemented; actual image bytes/frame coverage/pivots checked.
- [ ] First pair passes eight directions and supported-action full-speed review.
- [ ] All ten pass release matrix; art approvals recorded separately from CI.
- [ ] Mobile review and unresolved hurt/death policy explicitly accepted or completed.

**Current disposition:** specification drafted; asset production, runtime integration and visual acceptance pending. Documentation readiness is not asset/runtime readiness

## I. Decisions requiring explicit approval

1. Approve the ten existing costume concepts and Achan/Juggernaut as first pair, without changing cultural palettes/silhouettes/weapons.
2. Choose replacement clothed-body frames or split-layer rendering. Both preserve male geometry, but require different authoring/adapter work; neither is currently outfit-ready.
3. Approve class appearance independent of body-equipment stats, cosmetic precedence and whether players can hide optional accessories/headgear; define UI intent versus authoritative visual state.
4. Define allowed equipment-swap visual coverage: every current weapon action on every outfit, or explicit restricted supported set plus truthful fallback. Gameplay item permissions cannot change silently to reduce art work.
5. Approve garment-specific ramps/outline treatment after actual-base comparison; no hard palette cap is presently justified.
6. Approve per-class near/far masks and optional clipping exceptions (especially quiver/hair, shields/cuffs, long front cloth); no global always-front rule.
7. Confirm hurt/death stay current visual states for this release, or authorize separate V3 clips later. Do not fabricate their availability.
8. Approve future implementation scope, generation budget/tool/attempt cap and visual reviewers at their gates; this document grants none of those actions.

### Inspected source index

`apps/client/src/game/characters/{V3Puppet,CharacterRig,ModularRig,SsrHead,ssr-head-config,body-eight-model,walk-eight-model,v3-weapon,weapon-action,weapon-carry}.ts`; `apps/client/public/assets/character-v3/{body-eight-02,walk-eight-02,actions-eight-02/*}/manifest.json`; `packages/shared/src/{sprite-rig,character,world,equipment,skill-registry}.ts`; `FoundationScene.ts` downed/stealth presentation. PNG IHDR inspection of those directories found 944 images at128×128 plus 15 larger overview sheets (13 at1024×1024, one1024×128, one1536×1024); these directory totals include review images and are not runtime frame inventory. The proposed validator must follow manifest URLs to distinguish frames from sheets. This phase did not fully decode every PNG, run gameplay or claim visual validation. Only this specification and roadmap documentation are changed
