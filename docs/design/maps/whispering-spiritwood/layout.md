# ชายป่าวิญญาณ — Map Design Brief & Layout

## Playable visual integration — 2026-10-14
User explicitly authorized adopting the existing four-map review's Spiritwood presentation into the actual game. No new layout placement: all original object IDs, footprints, NPCs, monster regions, safe zones, spawn, portals and blockers are retained byte-for-byte in the shared definition. Required approaches remain arrival→rest→junction→training/cursed/shrine as below. Failed placements: none (no new object placement). The original source and historical brief below remain intact.

Runtime now enables the existing seeded terrain-quality atlas/decorations by this stable map ID, retains WaterLayer animated pond coverage, applies review object tint and teal ambient lighting, and adds the two authored ground-mist zones (`cursed-fog`:57,20,17,21; `shrine-fog`:30,4,20,13). Mist is cosmetic, below actors, avoids central approach/safe areas/warp triggers, uses one cached nearest-filtered texture and cleans up its update listener on travel. No generation or gameplay changes. Visual acceptance remains user review, not implied by technical checks.

Verification: workspace typecheck/build, water/terrain source checks, live server portal/profile/ticket/monster combat/EXP/respawn/return test pass. Browser guest walked through the actual village south portal; HUD confirmed Whispering Spiritwood online. Evidence in `live-integration/`. Physical phone testing remains open.

2026-10-14 terrain-quality revision: visual-only alternate art/ground decoration
on the same layout. Coordinates, objects, entrances, routes and collision are
unchanged. See [before/after scope](../terrain-quality-01/README.md).

## 1. สถานะและขอบเขต

Draft review 2026-10-14 · Lv.1–10 · ผู้ใช้อนุญาต4แมพแรกเพื่อpreviewก่อนขยาย ไม่ใช่production approval
อ้างอิง World Art Bible/Map Design Standard และ assets ต้นฉบับในrepo; แมพแรกใช้ผังและspriteเดิมทุกชิ้น ไม่มีการแก้ทะเบียน MAPS, combat หรือ save
งบภาพมอนสเตอร์ใหม่7งาน PixFlux งานละ1 รวม7; ภาพใหม่เป็นstatic candidates ไม่มี animation approval

## 2. ประสบการณ์และสเกล

หมู่บ้านอุ่น → ป่าฝึกตะวันตก / ป่าคำสาปตะวันออก → ศาลเหนือ
โลก80×64u · 32px/u · asset scale2 · tile16px native · ความเร็วตรวจ4u/s
พื้นที่ล่าแยกจากarrival และพัก ทางสู่landmarkอ่านได้เมื่อปิดlabel; กล้องoverview fitและกล้องเล่น1×
Route lengths/seconds วัดด้วยnavigationครึ่งunitหลังplacementในvalidation.json ไม่ใช้ระยะเส้นตรงแทน
Desktop/mobile portrait/landscape ตรวจที่preview; ทุกแมพระดับ0 ไม่มีบันไดหรือcliffปลอม

## 3. ผังภาพรวมและ terrain

Northอยู่ด้านบน; diagramมีscaleในpreview overlayเส้นทางและJSON planพิกัดจริง
หมู่บ้านปลอดภัยแยกจากลานฝึก วงล่าสองฝั่งกลับถึงหมู่บ้าน
วัสดุ grass/road/dirt/water ใช้Wangคู่เดิม ขอบน้ำอ่านจากgeometryเดียวกับcollision
โซน arrival, rest, junction, training, cursed, shrine; canopyเป็นกลุ่มจากพิกัดเขียนมือ ไม่ใช้grid/hash scatter
เว้นแนวทางหลักและหน้าประตู ไม่มีการscaleทั้งlayoutให้พอดี

## 4. Navigation graph และทางเข้า

| Node ID | หน้าที่ | World x,y | Level |
|---|---|---|---|
| arrival | ทางเข้าหมู่บ้าน | 40,59 | 0 |
| rest | หมู่บ้านชายป่า | 40,50 | 0 |
| junction | แยกชายป่า | 40,35 | 0 |
| training | ป่าฝึก | 15,34 | 0 |
| cursed | ป่าต้องสาป | 63,32 | 0 |
| shrine | ลานศาล | 40,19 | 0 |

| Edge ID | From→To | ชนิด | Width | Level | Direction |
|---|---|---|---|---|---|
| arrival--rest | arrival → rest | path | 3u | 0→0 | two-way |
| rest--junction | rest → junction | path | 3u | 0→0 | two-way |
| junction--training | junction → training | path | 3u | 0→0 | two-way |
| junction--cursed | junction → cursed | path | 3u | 0→0 | two-way |
| junction--shrine | junction → shrine | path | 3u | 0→0 | two-way |

เชื่อมspawn→nodesและentrancesด้วยเส้นเดินจริง ไปกลับ; น้ำห้ามข้ามยกเว้นcauseway/bridgeที่วาดพื้นเดียวกับcollision
ลานบอสเดิมแยกจากเส้นล่าปกติ; จุดfocusในpreviewไม่ใช่warp

## 5. รายการอาคารและสถานที่จำเป็น

| Stable ID | หน้าที่ | Base | Asset | Entrance→node |
|---|---|---|---|---|
| shrine | ศาลวิญญาณเดิม | 40,9.4 | ruined-shrine | 40,19 → shrine |

ฐานสำคัญ2.5×1.4u, level0; forecourtอย่างน้อย2u; boundsspriteจากmanifestตามscale2 ตรวจหลังคาในpreview
ทุกอาคารเป็นexterior landmark ไม่มีinteriorเข้าได้ในขั้นนี้; mill/bell/postใช้artทดแทนระบุชื่อไว้
Failed placementsต้องรายงานvalidation.json ไม่มีการskiprequired ID

## 6. น้ำ หน้าผา และพืชพรรณ

ป่าเขตร้อนชื้น; ฟ้าปิด เงาป่าเขียวหม่น โคมหมู่บ้านทองเก่า
บางเฉพาะป่าต้องสาปและศาล ไม่คลุมลานฝึก; fogzonesระบุid/rect/alphaในplan ไม่มีfull-screen gray veil
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

spawn 40,59; safeZones/spawnRegionsในmaps.json
ภูตใบไม้ / หุ่นฟางต้องคำสาป / ลิงเงา; ชนิดใหม่staticartcandidate การเดินตรวจและการขยับมอนสเตอร์เป็นlocalpreview
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

