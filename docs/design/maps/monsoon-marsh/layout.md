# บึงฝนลืมวิญญาณ — Map Design Brief & Layout

## 1. สถานะและขอบเขต

Draft review 2026-10-14 · Lv.17–25 · ผู้ใช้อนุญาต4แมพแรกเพื่อpreviewก่อนขยาย ไม่ใช่production approval
อ้างอิง World Art Bible/Map Design Standard และ assets ต้นฉบับในrepo; แมพใหม่ใช้geometryที่ระบุในplan.json ไม่มีการแก้ทะเบียน MAPS, combat หรือ save
งบภาพมอนสเตอร์ใหม่7งาน PixFlux งานละ1 รวม7; ภาพใหม่เป็นstatic candidates ไม่มี animation approval

## 2. ประสบการณ์และสเกล

ลานพักใต้ → วงสันดินสองแขนโอบบึงกลาง → เสาวิญญาณเหนือ ทางตรงและทางอ้อมเลือกความเสี่ยงได้
โลก88×64u · 32px/u · asset scale2 · tile16px native · ความเร็วตรวจ4u/s
พื้นที่ล่าแยกจากarrival และพัก ทางสู่landmarkอ่านได้เมื่อปิดlabel; กล้องoverview fitและกล้องเล่น1×
Route lengths/seconds วัดด้วยnavigationครึ่งunitหลังplacementในvalidation.json ไม่ใช้ระยะเส้นตรงแทน
Desktop/mobile portrait/landscape ตรวจที่preview; ทุกแมพระดับ0 ไม่มีบันไดหรือcliffปลอม

## 3. ผังภาพรวมและ terrain

Northอยู่ด้านบน; diagramมีscaleในpreview overlayเส้นทางและJSON planพิกัดจริง
สันดินคดล้อมแอ่ง ทางตรงเสี่ยงและทางอ้อมปลอดภัย
วัสดุ grass/road/dirt/water ใช้Wangคู่เดิม ขอบน้ำอ่านจากgeometryเดียวกับcollision
โซน arrival, rest, west, west-north, shrine, east-north, east, islet; canopyเป็นกลุ่มจากพิกัดเขียนมือ ไม่ใช้grid/hash scatter
เว้นแนวทางหลักและหน้าประตู ไม่มีการscaleทั้งlayoutให้พอดี

## 4. Navigation graph และทางเข้า

| Node ID | หน้าที่ | World x,y | Level |
|---|---|---|---|
| arrival | ทางเข้าบึง | 44,57 | 0 |
| rest | ลานพักสันดิน | 44,49 | 0 |
| west | ลานคางคก | 20,42 | 0 |
| west-north | คันดินเหนือซ้าย | 24,20 | 0 |
| shrine | เสาวิญญาณ | 44,15 | 0 |
| east-north | คันดินเหนือขวา | 66,20 | 0 |
| east | ลานปลิงหมอก | 68,42 | 0 |
| islet | ศาลกลางบึง | 44,32 | 0 |

| Edge ID | From→To | ชนิด | Width | Level | Direction |
|---|---|---|---|---|---|
| arrival--rest | arrival → rest | path | 4u | 0→0 | two-way |
| rest--west | rest → west | path | 4u | 0→0 | two-way |
| west--west-north | west → west-north | path | 4u | 0→0 | two-way |
| west-north--shrine | west-north → shrine | path | 4u | 0→0 | two-way |
| shrine--east-north | shrine → east-north | path | 4u | 0→0 | two-way |
| east-north--east | east-north → east | path | 4u | 0→0 | two-way |
| east--rest | east → rest | path | 4u | 0→0 | two-way |
| rest--islet | rest → islet | causeway | 3u | 0→0 | two-way |
| islet--shrine | islet → shrine | causeway | 3u | 0→0 | two-way |

เชื่อมspawn→nodesและentrancesด้วยเส้นเดินจริง ไปกลับ; น้ำห้ามข้ามยกเว้นcauseway/bridgeที่วาดพื้นเดียวกับcollision
ลานบอสเดิมแยกจากเส้นล่าปกติ; จุดfocusในpreviewไม่ใช่warp

## 5. รายการอาคารและสถานที่จำเป็น

| Stable ID | หน้าที่ | Base | Asset | Entrance→node |
|---|---|---|---|---|
| marsh-rest | เรือนหมอยาร้าง | 49,51 | stilt-house | 44,49 → rest |
| marsh-spirit-post | เสาวิญญาณเอียง: เสาหินทดแทน | 49,14 | stele | 44,15 → shrine |
| marsh-islet-shrine | ศาลกลางบึง | 48,32 | spirit-house | 44,32 → islet |

ฐานสำคัญ2.5×1.4u, level0; forecourtอย่างน้อย2u; boundsspriteจากmanifestตามscale2 ตรวจหลังคาในpreview
ทุกอาคารเป็นexterior landmark ไม่มีinteriorเข้าได้ในขั้นนี้; mill/bell/postใช้artทดแทนระบุชื่อไว้
Failed placementsต้องรายงานvalidation.json ไม่มีการskiprequired ID

## 6. น้ำ หน้าผา และพืชพรรณ

พื้นที่ชุ่มน้ำฝนหนัก; ฟ้าฝนเทาเขียว แสงไกลจากเสาวิญญาณ
ปานกลางเฉพาะผิวน้ำ หมอกบางในวงล่า; fogzonesระบุid/rect/alphaในplan ไม่มีfull-screen gray veil
ระดับน้ำ0; บึงเป็นแอ่ง/ช่องน้ำ ชายเลนเชื่อมทะเลนอกขอบ ไม่ใส่น้ำตกโดยไม่มีต้นน้ำ
ไม่มีcliffหรือstairในbatchนี้; no-placement: route nodes, landings, entrances, safe zones, combat clearings
มวลป่าแยกกลุ่มรอบterrainและช่องเปิด ไม่กระจายต้นไม้ทั้งแมพ

## 7. Asset kit และรอยต่อ

ใช้umbral manifestเดิม grass-road/water-grass/grass-dirt; ไม่มีคู่water-roadจึงทำgrass bufferรอบทางน้ำ
Objects native dims/anchorจากmanifest; bridgesใช้พื้นไม้modular2Dที่เขียนด้วยgeometryพร้อมราว ไม่ยืดspriteเดิมให้คร่อมช่อง
New monster seed128RGBA; อนิเมชันใหม่ยังไม่มี ใช้ภาพนิ่ง ไม่แสร้งว่ามีwalk cycle
ขาดfinal mill, mangrove-tree, bell-tower และtilted-post art: previewใช้assetเดิมตามรายการsites
ตรวจstraight/convex/concave water joinsและroute junctionsที่overview/normal zoom

## 8. Layer และ runtime mapping

JSON authored plan→isolated Phaser review; terrain cachednative canvas→nearest×2; objectsเรียงbaseY
Ground mistอยู่เหนือพื้นใต้actors; daylight/lightingvisual-only; graph/footprintsเป็นdebugเปิดปิดได้
Geometry sharedในleveling-preview-model.mjsสำหรับmaterial/collision/fogmasks; ไม่มีTiled importerเพิ่ม
Phaserดูแลworld/camera/effects, DOMเป็นreviewcontrols ไม่เก็บตำแหน่งentityในReact/Zustand

## 9. Gameplay locations ตามขอบเขตงาน

spawn 44,57; safeZones/spawnRegionsในmaps.json
คางคกอาคม / ปลิงหมอก / ภูตหนองน้ำ; ชนิดใหม่staticartcandidate การเดินตรวจและการขยับมอนสเตอร์เป็นlocalpreview
ไม่มีdamage, EXP, loot, quest, multiplayer หรือการเปลี่ยนเลเวลเดิม; portalปลายทางของแมพใหม่ยังdeferred

## 10. การตรวจและหลักฐาน

Required IDs, failed placements, arrival→ทุกnode/entrance, sourcehash และfog/safe-zoneตรวจในvalidation.json
ภาพoverlayและปิดlabelตรวจในbrowser; screenshotแต่ละแมพพร้อมdesktop/portrait/landscape
visual approval pending USER; technicalpassไม่ใช่artapproval
ยังต้องตรวจroofocclusionละเอียด, final props และfullmonsteranimations; networkintegrationนอกขั้นpreview

## Live adoption / refinement — 2026-10-14
User authorized actual portal integration and forest composition refinement. Current integration brief: ../spiritwood-refinement-02/README.md. Preserve this authored layout/required IDs; add reciprocal entrance/arrival contracts before runtime placement. Existing animated species temporarily fill new-map regions; candidate seed animation and final leveling balance remain open. No new generation.


## Edge travel and art revision3 — 2026-10-14
User authorizes boundary-based regional travel, three-map forest/ground/path polish and localized fog. Read ../leveling-refinement-03/README.md for explicit approaches/arrivals before placement. Preserve original NPC and monster contracts; rebuild shared wet blockers for authored land aprons. Required original sites remain mandatory; no whole-layout scaling.

