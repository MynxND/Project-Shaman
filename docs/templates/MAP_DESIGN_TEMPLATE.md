# <map-id> — Map Design Brief & Layout

สำเนา template นี้ไปที่ `docs/design/maps/<map-id>/layout.md` ก่อนเริ่มแผนที่ใหม่หรือจัดผังใหม่
ใช้คู่กับ [Map Design Standard](../../SHAMAN_MAP_DESIGN_STANDARD.md)
เติม `TBD` พร้อมเหตุผลเมื่อยังไม่ทราบ ห้ามแปลงช่องว่างเป็นสมมติฐานที่อนุมัติแล้ว
เมื่อคัดลอกไฟล์ ให้ปรับ relative links ตามตำแหน่งปลายทาง

## 1. สถานะและขอบเขต

| Field | Value |
| --- | --- |
| Map ID / ชื่อชั่วคราว | TBD |
| Layout revision / วันที่ | TBD |
| สถานะ | draft / review / approved พร้อมหลักฐาน |
| คำขอผู้ใช้และข้อจำกัด | TBD |
| Art references / ที่มา | TBD |
| โลก/production ที่ห้ามแก้ | TBD |
| ขั้นงานนี้ / ขอบเขต gameplay | TBD |
| งบ generation ที่อนุมัติ / ใช้จริง | TBD หรือไม่ใช้ |
| สิ่งที่ผู้ใช้ต้องตัดสิน | TBD หรือไม่มี |

## 2. ประสบการณ์และสเกล

- กิจกรรมหลักและจุดหมายของผู้เล่น: TBD
- ลำดับการพบ landmark จากทางเข้า: TBD
- สิ่งที่ต้องอ่านออกเมื่อปิด label: TBD
- World width/height และเหตุผลจากสเกลอาคาร/กิจกรรม: TBD
- World unit, native tile size, asset scale, movement speed จาก runtime: TBD
- Route lengths / walking times ที่วัดตามเส้นจริง: TBD
- Camera / viewport ที่ใช้ตัดสินภาพ: desktop, portrait, landscape — ระบุขนาดและ zoom

## 3. ผังภาพรวมและ terrain

แนบ diagram/graybox ที่มีสเกล ทิศเหนือ zone IDs เส้นทาง entrance และเส้นขอบสำคัญ
อย่าใช้ screenshot overview อย่างเดียวแทนข้อมูลเส้นทางหรือขนาด

| Region ID | รูปร่าง/ขอบเขต | ระดับ | วัสดุ | เหตุผลทางภูมิประเทศ | ผ่านได้/ไม่ได้ |
| --- | --- | --- | --- | --- | --- |
| TBD | TBD | TBD | TBD | TBD | TBD |

| Zone ID | กิจกรรม | Landmark | ต้องอยู่ติดกับ | ต้องเว้นจาก | พื้นที่ว่างและแนวมอง |
| --- | --- | --- | --- | --- | --- |
| TBD | TBD | TBD | TBD | TBD | TBD |

## 4. Navigation graph และทางเข้า

| Node ID | ประเภท/ตำแหน่ง | ระดับ | เข้าถึงจาก spawn? | กิจกรรม/จุดหมาย |
| --- | --- | --- | --- | --- |
| TBD | entrance / plaza / landing / junction / rest | TBD | TBD | TBD |

| Edge ID | From → To | ทาง/บันได/สะพาน | ความกว้าง/clearance | ระดับต้น–ปลาย | เวลาเดิน | ทิศทาง |
| --- | --- | --- | --- | --- | --- | --- |
| TBD | TBD | TBD | TBD | TBD | TBD | two-way / one-way พร้อมเหตุผล |

เส้นทางรองที่มีเหตุผล, dead end ที่ตั้งใจ และทางที่ห้ามผ่าน: TBD
พื้นที่รับปลายบันได/สะพานและจุดพักระหว่าง flight: TBD

## 5. รายการอาคารและสถานที่จำเป็น

ตารางนี้เป็นรายการที่ต้องตรวจครบ ไม่ใช่รายการ candidate ที่ข้ามได้เมื่อชนสิ่งกีดขวาง

| Stable ID | หน้าที่ / Zone | Asset/prefab | Base / ระดับ | Footprint | Entrance → route node | Forecourt / clearance | Sprite/roof bounds |
| --- | --- | --- | --- | --- | --- | --- | --- |
| TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD |

กลุ่มอาคารสัมพันธ์กันอย่างไรและหันเข้าถนนใด: TBD
รายการ decorative-only / ไม่ให้เข้าโดยตั้งใจ: TBD
ตำแหน่งที่วางไม่ผ่าน พร้อมเหตุผลและการแก้ไข (ต้องไม่มีรายการสำคัญหายเงียบ): TBD

## 6. น้ำ หน้าผา และพืชพรรณ

- น้ำ: source → stream → fall → basin → outlet; ระบุระดับและจุดตัดทางเดิน
- หน้าผา: edge IDs, exposed directions, cap/body/base, convex/concave corners, stair cutouts
- ป่า: canopy cluster polygons, species roles, understory และ transition to clearing
- กลุ่ม props: zone/activity ที่รองรับ เหตุผลและจำนวนที่พอดีกับกล้องเล่น
- No-placement masks: ทางเข้า ทางแยก ชานพัก แนวมอง พื้นที่กิจกรรม และริมที่รองรับไม่ได้
- Seeded variation ที่อนุญาต: ขอบเขต/ชนิด; landmark และทางเข้าไม่อยู่ใน variation

## 7. Asset kit และรอยต่อ

| Module / prefab | Native dimensions / anchor | Reuse / missing | Adjacency / ทิศที่รองรับ | แหล่งที่มา / สถานะภาพ |
| --- | --- | --- | --- | --- |
| TBD | TBD | TBD | TBD | TBD |

Test patches ที่ต้องมี: straight, convex, concave, junction, stair/bridge joins ตามชนิด terrain ที่ใช้
Material pairs ที่ต่อได้/ต่อไม่ได้ และตัวเลือกกรณี module ขาด: TBD
หากสร้าง asset: tool schema, reference ที่รองรับจริง, จำนวนงานและงบที่ผู้ใช้อนุมัติ: TBD

## 8. Layer และ runtime mapping

| Design category | Authoring layer/data | Runtime field/renderer | รองรับแล้ว/ต้องทำ | Collision/occlusion policy |
| --- | --- | --- | --- | --- |
| Terrain / transitions | TBD | TBD | TBD | TBD |
| Elevation / cliff / water | TBD | TBD | TBD | TBD |
| Objects / roofs / canopy | TBD | TBD | TBD | TBD |
| Gameplay / debug | TBD | TBD | TBD | TBD |

Authoring format: TypeScript / Tiled TMX/JSON / อื่น ๆ พร้อมเหตุผล
หากใช้ Tiled: export subset, pixel→world conversion, templates, GID flags และ unsupported features
ระบบ shared/server ที่ใช้เป็น authority: TBD; สถานะ local/network: TBD

## 9. Gameplay locations ตามขอบเขตงาน

| ID | NPC / spawn / quest / warp / arrival | ตำแหน่ง/ระดับ | Route node | Interaction / trigger area | Integration status |
| --- | --- | --- | --- | --- | --- |
| TBD | TBD | TBD | TBD | TBD | deferred / local / server-integrated |

ไม่อ้างว่า marker หรือ focus teleport เป็น warp/gameplay ที่เชื่อมแล้ว

## 10. การตรวจและหลักฐาน

| Check | วิธีตรวจ / จุดตรวจ | ผล | Evidence / revision |
| --- | --- | --- | --- |
| Required IDs complete / failed placement report | TBD | not run | TBD |
| Spawn → ทุก entrance/interaction ที่จำเป็น | เดินไป–กลับตาม graph ที่ตั้งใจ | not run | TBD |
| Terrain support / collision / transitions | จุดมุม ริม บันได สะพาน และทางรอง | not run | TBD |
| Label-off hierarchy | overview + กล้องเล่นจริง | not run | TBD |
| Building/tree occlusion | หน้า–หลังอาคาร ทางแยก ทางเข้า และ canopy | not run | TBD |
| Desktop / portrait / landscape | ระบุ viewport/zoom และ resize | not run | TBD |
| Typecheck/build/behavior หรือ doc-only | ตามสิ่งที่เปลี่ยน | not run | TBD |
| Multiplayer เมื่ออยู่ใน scope | สอง client และ authority/warp correction | not run | TBD |

สิ่งที่ยังไม่ผ่าน/ยังไม่ได้ตรวจ: TBD
สถานะ visual review และหลักฐานคำตัดสินผู้ใช้: TBD
ขั้นต่อไปที่อยู่ในขอบเขตอนุมัติ: TBD
