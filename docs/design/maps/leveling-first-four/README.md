# สี่แมพแรก — ผังและบรรยากาศสำหรับตรวจ

## Current live adoption — 2026-10-14
User subsequently authorized the three new maps and reciprocal portals. The preserved review below describes the original isolated stage. Current playable adoption is generated separately by `tools/map/build-leveling-live.mjs`; original plan/maps/art remain unchanged. Spiritwood↔Paddy↔Mangrove↔Marsh now uses authoritative rooms and tickets. Current composition/travel evidence and temporary existing-monster policy: [revision 2](../spiritwood-refinement-02/README.md). Seven static seeds still lack complete gameplay animation; proposed level bands are not approved combat balance.

Preview: http://127.0.0.1:8793/ · revision1 · 2026-10-14

ชายป่าวิญญาณ Lv.1–10 ใช้ผังเดิม; ทุ่งนาประทีป Lv.7–15,
ป่าชายเลนจันทร์ดับ Lv.12–20 และบึงฝนลืมวิญญาณ Lv.17–25
เป็นแมพใหม่แยกจากทะเบียนเกมจริง สถานะ visual review pending ทั้งชุด

## ลำดับออกแบบ

1. กำหนดหน้าที่แมพ ภูมิอากาศ landmark และความสัมพันธ์ระหว่างพื้นที่
2. เขียน briefครบ10ส่วนก่อน placement พร้อมพิกัดโลก ระดับ เส้นทาง ทางเข้า และพื้นที่พัก
3. วาง terrain จากพื้นที่ที่เขียนมือ: ทุ่งนาเป็นวงคันนา,
   ชายเลนเป็นเกาะสามผืน/สะพานสองช่วง, บึงมีสันดินโอบน้ำและเกาะศาล
4. วาง landmark/กลุ่มต้นไม้และเปิดพื้นที่ต่อสู้ตามผัง ไม่ใช้whole-layout scaleหรือscatterเป็นองค์ประกอบสุดท้าย
5. ตรวจ collision/support, เส้นเดินจริง, เขตเกิดมอนสเตอร์และหมอก แล้วตรวจภาพปิดlabelที่กล้องเล่น

Briefแต่ละแมพอยู่ที่ `../<map-id>/layout.md`;
`plan.json` เป็นข้อมูล authoring, `maps.json` เป็นผล placement สำหรับpreview,
`validation.json` มีเส้นทาง/ระยะ/เวลาและfailed-placement report
ทุกแมพระดับ0; ไม่มีระบบความสูง/บันไดหรือinteriorที่แสร้งว่าเชื่อมแล้ว

## สิ่งที่ดูได้

- เลือกทั้ง4แมพ ดูoverviewหรือกล้องเล่น1× เปิดกราฟ/ฐานชน/พื้นที่พักและชื่อจุด
- เดินตรวจด้วยWASD/ลูกศร/ปุ่มมือถือ หรือปุ่มเดินตามทางไปศาล
- คลิกจุดสำคัญเพื่อfocusกล้อง; ไม่มีteleport/warpจริงจากปุ่มนี้
- หมอก8โซนรวม อยู่ในป่าคำสาป/ศาล/น้ำ/ช่องชายเลน ไม่คลุมทุ่งนา
- สลับfog, low-qualityและหยุดการเคลื่อนไหว; mistอยู่ใต้actorsและdebug ไม่กระทบcombat

ภาพต้นแบบมอนสเตอร์ใหม่7ชนิดสร้างด้วยPixelLab PixFlux128RGBA งานละ1
รวม7generations ไม่มีretry (balance7→0). Raw PNG, promptsและreceiptsอยู่ใน
`monsters/<id>/`. มีควายดิน ปูอาคม ตะเกียงน้ำ รากโกงกาง คางคก ปลิงหมอก
และภูตหนองน้ำ ยังเป็นstaticseed ไม่ใช่ชุดidle/walk/attackครบ
มอนสเตอร์เดิม6ชนิดใช้แอนิเมชันที่มีอยู่ จำนวนตัวในpreview23/13/13/14
บทบาทและช่วงเลเวลใหม่ยังเป็นข้อเสนอ ไม่มีการปรับHP/EXP/lootเดิม

## ข้อจำกัดภาพและการเชื่อมระบบ

โรงสีใช้เรือนไม้เดิม หอระฆังใช้ศาลร้าง ต้นโกงกางใช้ต้นคำสาป
และเสาเอียงใช้เสาหินตรง เป็นartทดแทนที่ระบุไว้ ไม่ใช่assetเฉพาะที่เสร็จแล้ว
สะพานใช้โมดูลพื้นไม้/ราวจากgeometry2D ไม่ยืดภาพสะพานเก่า
พื้นน้ำ/ดินใช้Wangkitเดิมและปรับบรรยากาศที่runtime ภาพterrainใหม่ยังไม่ได้เจน
มอนสเตอร์บางภาพยังต้องปรับความน่ารัก/วัสดุและยืนยันขนาด โดยเฉพาะคางคก
หลังคา/ต้นไม้บดบังแบบละเอียดและความสมบูรณ์ศิลป์ยังต้องตรวจโดยผู้ใช้

Phaser owns world/camera/motion; DOM owns review controls. Shared localmodel
คำนวณmaterial/collision/fogmasks ไม่มีReact/Zustandentityตำแหน่ง
การขยับมอนสเตอร์เป็นlocalpresentation ไม่ใช่AIcombat server
ยังไม่มีquests,damage,EXP,loot,respawn authority หรือportal ใหม่
การเปลี่ยนขนาดจอไม่สร้างsceneใหม่; scene-owned objects/ResizeObserverถูกcleanupเมื่อออกหน้า
Production MAPS, sourceart, original Spiritwood geometry และเกมเดิมไม่ได้แก้

## ตรวจซ้ำ

`node tools/map/build-leveling-first-four.mjs`

`node tools/map/test-leveling-first-four.mjs`

`node tools/map/leveling-preview-server.mjs`

Typecheck/buildผ่าน; checksครอบคลุม4maps/42destinations, continuousเดิน
ทุกnode, requiredobject IDs, ฐานอาคาร/ต้นไม้ใหม่มีพื้นรองรับ, bridge/water collision,
spawn capacity, fog safe masks,7sprite hashes และผัง/assetแมพเดิมตรงต้นทาง
Browserตรวจ4แมพ/กล้องเล่น/fog toggle/debug/resize/390×844และ844×390;
ภาพอยู่ในscreens. Physical-touch/frame-timeบนอุปกรณ์จริงและmultiplayerยังไม่ได้ตรวจ
Technicalpassไม่ใช่visualapproval ยังไม่ขยายงานอีก16แมพ
