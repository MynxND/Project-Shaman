# Umbral Mountain — Environmental Art Pass 02

2026-10-11 · Prototype only · รออนุมัติภาพจากผู้ใช้ · PixelLab actual spend: **0 credits / 0 generation calls**

## เปิดตรวจ

- เล่น: http://localhost:3000/?map=umbral-elevation-lab
- ภาพรวมหลัง: http://localhost:3000/?map=umbral-elevation-lab&mountainReview=wide&mountainMetrics=1
- ภาพรวมก่อน: http://localhost:3000/?map=umbral-elevation-baseline&mountainReview=wide&mountainMetrics=1
- รายละเอียดวิหาร: เปลี่ยน mountainReview เป็น temple (กล้อง 40,19 world units, zoom .9)
- รายละเอียดเมืองล่าง: mountainReview=lower (กล้อง 40,43, zoom .9)
- Prototype และ baseline ถูกปฏิเสธโดย production server; default map ยังเป็นเมืองเดิม

## สิ่งที่ดีขึ้น

1. เปลี่ยนขอบชานตรงเป็น ridge profile ที่ออกแบบมือ มีเว้า/ยื่นและช่วงระดับต่างกันจริง ไม่ใช่ภาพลวง ขอบภาพและ shared collision ใช้ height field เดียวกัน กำแพงเดิมที่ลากยาวทั้งเมืองเปลี่ยนเป็นหน้าหินแยกตาม contour
2. กลุ่มหิน 13 กลุ่มวางเป็น crown/toe สองฝั่งขอบชาน มี fern, understory และดินเชื่อมกัน ไม่สุ่มกระจาย เพิ่มต้นไทรฝั่งตะวันตกและต้นไม้ฝั่งตะวันออกไม่สมมาตร และ canopy เมืองล่างเพื่อสร้าง foreground
3. ใช้ Wang grass/dirt/road เดิมเพิ่มดินรอบกลุ่มหิน ขณะคงลำดับ paint ถนนและน้ำเดิมให้ทางเดินอ่านได้
4. เพิ่ม stone cap, moss rim, หินซ้อนและเงาที่ฐานหน้าผา ก้อนหินเดิมเป็นวัสดุชั่วคราวสำหรับรอยต่อ ไม่สร้าง PNG ใหม่ บันไดหลักมีขอบข้าง ขั้นและแสงบนขอบหินที่ชัดขึ้น
5. ลดความแรงแสงลานและร้านค้าใน prototype เพิ่มน้ำหนักแสงอุ่นวิหารเล็กน้อย เปิดรายละเอียดเงาจาก night alpha .50 → .42 ไม่มี postprocess/blur/bloom ใหม่

อาคาร NPC จุดเกิด object เดิม และ landmark อยู่ world coordinates เดิมทั้งหมด ระดับของอาคารและ NPC ทุกตัวตรง Phase 1 รักษา S1–S6 และขนาด/ปลายทางเดิม เส้นหลัก LOWER0 → S2 → MIDDLE1 → S1 → UPPER2 ยังเดินได้

## พิสูจน์ทางเทคนิค

- `mountain-art-test.mjs`: คง original objects/NPC/spawn; อาคารและ NPC ระดับเดิม; S1–S6 ไม่มี footprint ขวาง center lane และเข้าออกได้; ขอบ cliff 93 ช่วงห้ามข้ามทั้งสองทิศ/stop correction; เดินขึ้นลงสองชั้นต่อเนื่อง
- `elevation-test.mjs`: Phase 1 baseline regression ยังผ่าน
- `two-clients.json`: สอง Colyseus SDK clients เดินขึ้น/ลงพร้อมกัน และชน cliff ที่ไม่ใช่ corridor แล้วหยุดบนระดับล่างเหมือนกัน client ส่ง elevation=999 ก็ไม่มีผล ไม่ฉีด/teleport ตำแหน่ง
- Shared regression/typecheck/build ผ่าน
- `baseline-fps.json`, `after-fps.json`: เก็บจาก Phaser update จริงด้วย performance.now หลัง warmup3s, 10s ต่อหน้าต่าง ไม่รวมเวลาที่ document hidden ค่า FPS เป็นของ browser/device นี้ ไม่ใช่ benchmark ของมือถือทุกเครื่อง
- ภาพ before/after ใช้ viewport1280×960, กล้อง world(40,30), zoom0.5 เท่ากัน รายละเอียด temple ใช้กล้อง world(40,19), zoom0.9 เท่ากัน ตัวละคร/ชาวเมือง/แสง flicker อาจอยู่ต่าง animation time เพราะเป็นเกมจริง
- Preservation: sourceเมืองจริง/NPC/manifest SHA256 ตรง backup และ map assets93ไฟล์ตรง backup ไม่มีการเปลี่ยน approved image bytes, character sprite หรือ HUD source

## ข้อจำกัดของ asset เดิม

หินที่มีเป็นก้อนเดี่ยว ไม่ใช่ cliff wall ที่ต่อชิ้นได้ จึงยังเห็นการซ้ำของก้อนและบางมุมเป็นชั้นตัด โดยเฉพาะด้านข้างแคบ การยืม textureพื้นเป็น substrate ไม่ทดแทนผิวหน้าผา native ได้ทั้งหมด ใต้ชานยังต้องการรอยแตก/มอสที่ต่อกันได้จริง

ต้นไม้มีรากติดกับภาพต้นไม้และ understory เท่านั้น ไม่มี root overlay แยก จึงใช้ได้เพียงจัดกรอบองค์ประกอบ ไม่ฝืนตัดรากออกจาก approved PNG พื้นน้ำและคลองเดิมยังไม่ใช่น้ำตก ไม่มี waterfall asset ถูกสร้างหรือแสร้งว่าน้ำตกใช้งานแล้ว ทางเดิน/อาคารบางส่วนยังเป็นเส้นตรงตามเมืองเดิมที่ต้องรักษา

Collision และ network ที่ผ่านไม่ใช่การรับรองว่าภาพผ่านเป้าหมาย ผู้ใช้ต้องอนุมัติ visual pass นี้ก่อนแตะ Production Map

## Modular kit ที่จำเป็นจริง (ข้อเสนอเท่านั้น)

Free live quote `quote-128.json`: create128×128 = **6 credits/image provisional** ราคาต้องยืนยันอีกครั้งเมื่ออนุมัติสร้าง ไม่ได้สั่ง generation

| หมวด | ชิ้นที่ต้องมี | จำนวนภาพ | ประมาณเครดิต |
|---|---|---:|---:|
| Natural cliff | หน้าตรงต่อแนวนอน, มุมเว้า, มุมนูน, ด้านข้าง (mirror reuse) | 4 | 24 |
| Stone stair | ช่วงบันไดต่อซ้ำพร้อมขอบ, ชานพัก/จุดต่อหัวท้าย | 2 | 12 |
| Terrain edge | atlas หญ้า–หิน/มอส, atlas ดิน–หิน พร้อม corner variants | 2 | 12 |
| Waterfall | ต้นน้ำ/ปากตก, ช่วงน้ำตกต่อแนวตั้ง, ฐานกระทบ/แอ่งรับ | 3 | 18 |
| รวมขั้นต่ำ | 11 native128 source images; ไม่เพิ่ม tree/rock/building kit ที่มีอยู่แล้ว | **11** | **66** |

นี่คือภาพต้นทาง 11 ภาพ ไม่ใช่คำรับรองว่า provider จะส่งชิ้น seamless ผ่านทุกชิ้นในการเจนครั้งเดียว ต้องตรวจ native pixel density16px/unit, กล้องสามส่วน, แสงซ้ายบน, alpha, edge joins, stair dimensions และ collision profile หลังประกอบ ไม่รวม retry/animation ไม่มีการอนุมัติหรือใช้66เครดิตในรอบนี้

## ย้อนกลับ

Phase1-map.ts เก็บค่าก่อน art pass; baseline map/render branch ยังดูของเดิมได้ Source Production ไม่ถูกเขียนทับ หากยกเลิก pass ให้เปลี่ยน lab alias กลับ baseline geometry และปิด artPass โดย review diff ก่อน ไม่ต้องย้อน approved asset หรือ UI

