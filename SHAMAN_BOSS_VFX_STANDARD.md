# Project Shaman — Boss VFX Standard

Version 1.1 · 2026-10-16 · มาตรฐานที่ผู้ใช้กำหนดสำหรับบอสใหม่และการแก้ VFX บอสทุกครั้ง

## Combat identity acceptance — user2026-10-16

ก่อนยอมรับบอส ต้องระบุวงจรการเล่น บทบาทผู้เล่น และการตัดสินใจที่ต่างจากบอสเดิม
อย่างชัดเจน การเปลี่ยนสี/radius/cooldown ของวง คลื่น หรือการพุ่งชุดเดิมไม่ถือว่าเป็น
mechanic ใหม่ พรีวิวสกิลเดี่ยวไม่ใช่หลักฐานความยาก ต้องทดสอบการตอบโต้ด้วยระบบจริง
รวมความล้มเหลว การกู้สถานการณ์ และช่องสวนกลับ ระบุ solo/party และจำนวนคนเป้าหมาย
รายบอส ไม่บังคับใช้ปาร์ตี้3–5คนของ Calon กับบอสอื่นโดยอัตโนมัติ QA HPสูงใช้ตรวจ
geometry/timing เท่านั้น ห้ามอ้างเป็นผลบาลานซ์หรือชัยชนะด้วยตัวละครปกติ

ใช้คุณภาพและวิธีตรวจของ Shuten-dōji เป็น baseline ของระบบ ไม่ใช่ให้ทุกบอสใช้หน้าโอนิ สีแดง สัญลักษณ์ญี่ปุ่น สามเฟส หรือสิบสกิลเหมือนกัน เอกสารนี้เป็นข้อกำหนดการทำงาน ไม่ได้อนุมัติ asset บาลานซ์ หรือผลทดสอบที่ยังไม่มีหลักฐาน

อ่านร่วมกับ [AGENTS.md](AGENTS.md), [World Art Bible](SHAMAN_WORLD_ART_BIBLE.md), [Skill Design](SHAMAN_SKILL_DESIGN_SYSTEM.md), [VFX Design](SHAMAN_VFX_DESIGN_SYSTEM.md), [Skill Classification](SHAMAN_SKILL_CLASSIFICATION.md), [architecture](docs/architecture.md) และ [art direction](docs/art-direction.md) คำสั่งผู้ใช้และขอบเขตที่อนุญาตมีลำดับเหนือเอกสารนี้ ไม่เพิ่มการหยุดขออนุญาตทุกขั้นโดยไม่มีเหตุ

## 1. เริ่มงานและเอกสารประจำบอส

ก่อนสร้างหรือแก้บอส ให้ตรวจ renderer, animation, authoritative combat, schema, installed Phaser APIs, asset เดิม และปัญหาที่เกิดจริงก่อนสรุปสาเหตุ รักษาฟีเจอร์และคอมเมนต์เดิม แยกงานอื่นที่ค้างใน workspace

สร้างหรืออัปเดต `docs/design/bosses/<boss-id>/vfx.md` จาก [BOSS_VFX_TEMPLATE.md](docs/templates/BOSS_VFX_TEMPLATE.md) ก่อนลงมือ implementation และเติมผลจริงก่อนส่งงาน ต้องมี:

- อัตลักษณ์ ประเทศ/lore และส่วนที่เป็นการตีความของเกม พร้อมสถานะข้อมูลที่ยังไม่ยืนยัน
- รายการทุกเฟส ทุกสกิล ท่าย่อย อัลติเมต การเปลี่ยนร่างและท่าตายที่อยู่ใน scope
- ตาราง geometry, source anchor, timeline, hit window และ counterplay ของแต่ละการโจมตี
- แหล่ง asset, animation frames, budgets, code bindings, วิธี preview และหลักฐานตรวจ
- ข้อผิดพลาดที่พบ การแก้ ผลทดสอบ ข้อจำกัด และสถานะที่ยังไม่เสร็จอย่างชัดเจน

ห้ามใช้คำว่า complete เมื่อยังมีสกิลที่ไม่ได้เชื่อมจริงหรือใช้ placeholder โดยไม่ระบุ ห้ามยกตัวเลขผลทดสอบของ Shuten ไปอ้างว่าเป็นผลของบอสใหม่

## 2. อัตลักษณ์ภาพและวัสดุ

- Detailed crisp pixel art ในโลกหมอผี ใช้วัสดุและสัญลักษณ์ที่เข้ากับประเทศและ lore ของบอสนั้นตาม Art Bible ไม่เปลี่ยนสีชุดเดียวแล้วถือว่าเป็นบอสใหม่
- เน้นอาคมเก่า วิญญาณ ไฟเหนือธรรมชาติ เถ้า ควัน เศษวัสดุ และสัญลักษณ์เฉพาะเรื่องเมื่อเหมาะสม หลีกเลี่ยงวง neon ทั่วไป เลเซอร์ sci-fi ระเบิดการ์ตูน และ bloom ที่กลบตัวละคร
- ใช้ PNG โปร่งใส, sprite sheet/flipbook และ particles ที่มี artwork สำหรับไฟ ควัน สายฟ้า ลมหายใจและภาพอินทรีย์ซับซ้อน ห้ามแทนด้วยวงกลม/เส้น/รูปหลายเหลี่ยมล้วนแล้วเรียกงาน production
- Graphics/vector ใช้ได้กับขอบเขตอันตราย ตราอาคมเชิงเรขาคณิต debug และ masks งานเตือนต้องออกแบบให้เข้ากับบอส ไม่ปล่อยเป็นเส้นร่างสีเดียว แต่ต้องอ่านขอบอันตรายและช่องหลบได้ชัด
- Reuse asset เดิมที่เหมาะสมก่อน หากขาดให้บันทึกรายการและระบุ placeholder ชั่วคราว ผู้ใช้กำหนดเมื่อ 2026-10-16 ให้ใช้ ImageGen เป็นค่าเริ่มต้นสำหรับงานภาพใหม่ทั้งหมด รวม sprite และ VFX ของบอสทุกตัว เช่น Maiyarap โดยไม่ต้องขอข้อยกเว้นรายบอสอีก ไม่เรียก PixelLab หรือเปลี่ยนไปใช้ generator อื่นเอง อ่าน imagegen skill ก่อนสร้างภาพ เก็บ provenance ของ asset เก่าตามจริง
- เก็บ source, prompt/job ID เมื่อมี generation, ขนาด/จำนวนเฟรม, anchors และ provenance ใน repository ห้ามอ้าง runtime ไปยัง temporary path หรือฝัง credentials

## 3. ชั้นเอฟเฟกต์และ choreography

การโจมตีหลักต้องรองรับชั้นต่อไปนี้ โดยเลือกใช้ตามเหตุผลของสกิล ไม่บังคับให้เปิดทั้งเจ็ดชั้นพร้อมกันทุกท่า:

| ชั้น | หน้าที่ |
| --- | --- |
| Ground | รอยอาคม/เขตอันตรายบนพื้นและช่องปลอดภัย |
| Anticipation | สะสมพลังและท่าบอสที่บอกทิศ/จังหวะก่อนโจมตี |
| Main attack | ภาพการโจมตีจาก artwork/animation ที่เหมาะสม |
| Trails | ร่องรอยอาวุธ/พลังรองที่ไม่สับสนกับ hitbox |
| Contact | จุดกระแทก แฟลชที่ควบคุมได้ และ shockwave |
| Secondary | สะเก็ด ควัน เถ้าและเศษวัสดุที่มี lifetime |
| Aftermath | พลังตกค้าง/รอยพื้นหลังโจมตี แยกจากช่วงที่ยังทำดาเมจ |

แต่ละชั้นต้องกำหนดเวลา alpha scale rotation anchor และ depth แยกกัน มี anticipation → contact → recovery/aftermath ไม่เล่นทุกชั้นพร้อมกันด้วย tween เดียว การเปลี่ยนเฟส/ตาย/ถูกขัดจังหวะต้องปิดภาพเก่าอย่างถูกต้อง และไม่มีภาพโจมตีหลงเหลือที่สื่อว่าทำดาเมจอยู่โดยไม่มี hazard

## 4. เส้นเตือนต้องตรงกับการโดนจริง

Colyseus เป็นผู้ตัดสิน geometry, hit timing และ damage; Phaser อ่านสถานะและเวลาจากเซิร์ฟเวอร์ React ดูแล HUD ไม่ย้ายการตัดสินผลไปอยู่ใน preview หรือ tween

1. ระยะและตำแหน่งใช้ world units ไม่ผูกกับ screen size/zoom แปลงเป็น pixel ครั้งเดียว พื้นที่เตือนต้องอยู่บนระนาบพื้นตามมุมกล้องโลก
2. ใช้ geometry และ collision allowance เดียวกับ authoritative code รวมขนาดตัวผู้เล่น/ความหนาคลื่น/ปลาย capsule ตามกฎจริง ห้ามวาด nominal radius ที่เล็กกว่าพื้นที่โดนจริง ห้าม hardcode ค่าของ Shuten ให้บอสอื่น
3. วงขยายต้องแสดงแถบอันตรายและขอบด้านในที่ปลอดภัย ไม่ระบายกลางวงเป็นอันตรายหลังคลื่นผ่าน เส้นทางพุ่งเตือนทางที่จะผ่านล่วงหน้า แต่ active contact ต้องตามตำแหน่ง/swept segment จริง ไม่ค้างทั้งทางราวกับยังโดนได้ทั้งหมด
4. Sector/cone ต้องรักษามุมและช่องด้านหลังที่ปลอดภัย รวมถึงมุมกว้างกว่า180° งานตกแต่งไม่ปิด safe wedge หรือสร้างขอบอันตรายปลอม
5. เตือนให้เห็นขอบเขตเต็มตั้งแต่เริ่ม windup ใช้ความสว่าง/รอยอาคมบอก progress ไม่ทำขอบเตือนหด/ขยายจนผู้เล่นเข้าใจระยะผิด เว้นแต่ hazard จริงเปลี่ยนระยะเช่นนั้น
6. Progress/contact/ดับภาพผูกกับ authoritative timestamps และ animation hit events แยก stage ไม่ทำดาเมจกับ stage ที่ทำดาเมจจริง เช่น ของเหลวก่อนติดไฟ และ portal ที่มีไว้เรียกลูกสมุน
7. เขตเตือนที่ซ้อน geometry เดียวกันต้องอ่านจังหวะที่จะถึงก่อนชัดเจน deduplicate ได้เฉพาะภาพ ห้ามตัด hit, repeat, combo หรือ head/body scheduling
8. การหลบต้องทดสอบด้วย movement/collision จริง ในสนาม ด้วยความเร็วและความสามารถที่เกมมี ห้ามพิสูจน์ด้วยการ teleport ออกวงหรือออกนอกสนามจนระบบหยุดทำดาเมจ

ตัวอย่าง `SHUTEN_CONTACT_PADDING=.3` เป็น allowance เดิมของ encounter นี้ ไม่ใช่ค่า default ของบอสทุกตัว และไม่ใช่เหตุให้เพิ่มระยะหรือแก้บาลานซ์โดยไม่อยู่ใน scope

## 5. ตัวละครและภาพเคลื่อนไหวต้องอ่านออก

- Ground tells/ตรา/คราบพื้นอยู่ใต้ actor วัด origin จากปาก มือ อาวุธ เท้า หรือส่วนร่างที่ใช้โจมตีจริง แยก ground anchor ออกจากภาพที่ลอยอยู่ ตรวจครบ8ทิศสำหรับท่าที่มีทิศทาง ไม่ mirror สัญลักษณ์/อาวุธที่ไม่สมมาตรผิดด้าน
- ตรวจตัวผู้เล่น บอส มอนสเตอร์ร่วมฉากและช่องหลบในช่วง warning, contact และ aftermath อย่าใช้แฟลช ควันหรือ bloom บังตำแหน่ง/เงาร่างนานจนเล่นหลบไม่ได้ หากพบให้แก้เฉพาะ layer/alpha/depth/mask ที่มีปัญหา รักษาสัญญาณ hit ที่จำเป็น
- ใช้ delta-time/authoritative clock; easing ใช้กับภาพตกแต่ง ไม่เปลี่ยนความเร็วขอบดาเมจที่เซิร์ฟเวอร์กำหนดเป็น linear
- ใช้ authored in-betweens สำหรับ organic motion การถือเฟรมซ้ำหรือ crossfade ไม่ใช่เฟรมใหม่ จำนวน16เฟรมของบางวัสดุ Shuten ไม่ใช่ข้อบังคับสากล; ต้องตรวจ source frame rate, hit pose และความต่อเนื่องจริง
- ท่าเดินต้องมี contact/down/passing/up และการรับน้ำหนักซ้าย–ขวาที่อ่านออก ผูกเฟสกับระยะเดินจริงและรักษาเฟสเมื่อเปลี่ยนทิศ ห้ามนับการเลื่อนภาพยืน การโยกทั้งภาพ หรือเพิ่ม FPS เป็นท่าเดินใหม่ ตรวจลูปและเท้าที่รับน้ำหนักในพรีวิวช้าและเกมจริงก่อนขยายชุด
- รักษาสัดส่วนวัสดุอินทรีย์ อย่ายืดภาพสี่เหลี่ยมเป็นเส้นแคบจนผีเสื้อ ใบหน้า หรือมือผิดรูป ใช้กลุ่มภาพตามแนวทางหรือ material profile ที่เหมาะกับแต่ละ geometry แยกความสูงของวิญญาณจากพื้นที่สัมผัสพื้น และให้ release pose ตรง startsAt รวมการร่ายซ้ำและ recovery ระหว่างการโจมตีย่อย
- ใช้ nearest filtering/pixel scale ที่เหมาะสม จำกัด camera shake และรองรับ reduced motion ตรวจ desktop, phone portrait/landscape และรักษา scene/session เมื่อ resize/orientation

## 6. สถาปัตยกรรมและประสิทธิภาพ

- แยก behavior/FSM, timed hazard data, art profile, actor presentation, renderer และ preview ให้ reuse ได้ ไม่สร้างสำเนาตรรกะดาเมจในแต่ละสกิลหรือใน React
- ตรวจ APIs ของ Phaser ที่ติดตั้งจริงก่อนใช้ ParticleEmitter, animations, timelines/tweens, blend modes, RenderTextures หรือ WebGL FX ตรวจ WebGL capability และมี fallback เมื่อใช้ effect ที่ Canvas ไม่รองรับ
- Pool VFX/particles และกำหนด maximum views, live particles, burst rate, lifetime, textures และ overflow policy ไว้ใน `vfx.md` ห้าม allocate GameObjects ทุกเฟรมหรือทิ้ง listeners/tweens/masks/emitter หลังจบฉาก
- Overflow ตัดได้เฉพาะ cosmetics ห้ามตัด gameplay hazards หรือทำเขตเตือนสำคัญหายเงียบๆ ถ้ารองรับ tells ไม่ครบตาม worst case ต้องมี fallback หรือลดภาระโดยยังเตือนครบ
- ทดสอบ interruption, late join/reconnect, reset, wipe, death และ teardown ไม่ replay contact burst ย้อนหลัง ไม่ปล่อยภาพเก่าข้ามเฟส/ห้อง
- วัด frame intervals และ CPU ของส่วนที่วัด พร้อม viewport, renderer, active effects, pool/particle peaks และวิธีวัด แยก adapter CPU ออกจาก whole-frame/GPU อย่าใช้ตัวเลข FPS widget หรือผลจำลองมือถืออ้างว่าเครื่องจริงผ่าน
- เป้าหมายภาพลื่นประมาณ60FPS เมื่อทำได้ ไม่รับประกัน60FPSจากจำนวนเฟรม source หรือตัวเลขของบอสอื่น Shuten32 views/96 particles เป็น reference ที่วัดในฉากนั้น ไม่ใช่ budget อัตโนมัติของทุกบอส

## 7. ขั้นตอนส่งงานและเกณฑ์ตรวจ

เริ่มจาก audit และตารางสกิลใน `vfx.md` → ทำหนึ่ง attack ให้ครบตั้งแต่เตือนจนจบ → เปิดเกมตรวจภาพ/แก้ timing ก่อนขยายทั้งชุด ทำต่อใน scope ที่ผู้ใช้อนุญาตได้โดยไม่ต้องหยุดถามย้ำ เมื่อ scope ระบุ preview ก่อน live ให้รักษาขอบเขตนั้น

ก่อนระบุว่าการส่งงานครบ ต้องมีหลักฐานตามส่วนที่เกี่ยวข้องทั้งหมด:

- Dedicated preview ที่ใช้ renderer/timeline ร่วมกับเกม มี pause, replay, slow motion, seek และเลือกทิศตามความจำเป็น แยก simulation/recorded clip ออกจาก online combat ให้ชัด
- ตารางตรวจทุกเฟส ทุกสกิลและอัลติเมต: warning → hit → recovery, positive control ในพื้นที่โดน, negative control ด้วยการเดินหลบจริง รวม repeat/delayed hits และส่วนที่ไม่ทำดาเมจ
- ตรวจ edge/radius/width/body allowance, safe wedge, wave inner hole, moving charge, anchor8ทิศ และ head/body หรือหลายแหล่งโจมตีเมื่อมี
- เดิน/โจมตีด้วยระบบจริง เปิด normal AI ในแต่ละเฟส และตรวจ transition/death/wipe/reset หากใช้ QA จัด HP/ตำแหน่ง/เฟส ให้บอกตรงๆ ห้ามเรียกว่าเล่นชนะต่อเนื่องหรือผ่านบาลานซ์แล้ว
- ภาพในเกมจริงพร้อมคำอธิบายและผล HP/damage เมื่อทำได้ เก็บ source/timestamps/test inputs และแยก before/after ที่ซิงก์เฟรมกับภาพต่างเวลาหรือจาก preview ห้ามใช้ภาพเจนเป็นหลักฐานเกมจริง
- บอกความละเอียดเวลาและ network/snapshot uncertainty ของ receipts; automated timing tests ไม่ทดแทนการตรวจภาพ และ visual inspection ไม่ทดแทน authoritative collision tests
- รัน typecheck/build และ behavioral tests ที่ตรงกับโค้ดที่แก้ บันทึกผล performance และ desktop/mobile inspection ตามจริง ระบุสิ่งที่ยังไม่ตรวจ/asset ที่ขาด/ข้อจำกัด ไม่อนุมัติศิลป์แทนผู้ใช้
- เมื่อแก้ไขใหญ่ผ่าน checks ให้ commit/push ตาม AGENTS.md แบบแยกงานอื่น ไม่ blanket-stage หรือ force-push

## 8. Reference implementation และสถานะ

- [Shuten per-boss contract](docs/design/bosses/shuten-doji/vfx.md)
- [Complete asset architecture/artwork](docs/design/bosses/shuten-doji/complete/README.md)
- [Ritual telegraph redesign](docs/design/bosses/shuten-doji/telegraphs/README.md)
- [Three-phase real-room QA และข้อผิดพลาดที่แก้](docs/design/bosses/shuten-doji/combat-review/README.md)

มาตรฐานนี้บันทึกไว้ใน repository และเชื่อมกับ AGENTS.md เพื่อให้ผู้พัฒนาหรือ AI งานต่อไปต้องอ่าน ไม่ใช่การรับประกันว่าทุก agent ในอนาคตจะทำตามโดยอัตโนมัติ การขาดข้อกำหนด/หลักฐานต้องระบุเป็นงานคงค้าง ไม่ซ่อนด้วยคำว่า standard หรือ complete
