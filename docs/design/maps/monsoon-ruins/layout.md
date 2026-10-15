# monsoon-ruins — นครร้างใต้พายุ

## 1. สถานะและขอบเขต
User2026-10-15 authorizes exactly three Japanese previews before live adoption. Names/geography/levels are proposals. Local React/Phaser only; no MAPS/rooms/portals/NPC rewards/skills/atlas status changes. Preserve eleven live content maps and all earlier comments. Japanese cultural vocabulary explicitly requested: torii, shrine, Onmyoji/Miko; original fictional brush marks only, no invented real kanji or copied real shrine.

## 2. ประสบการณ์และสเกล
Classic RO elevated three-quarter orthogonal rectangle; upright facades, no diamond/floating diorama.32 worldpx/unit; ground32px/unit1x, objects and shared water16px/unit2x; movement4units/s. Desktop1280×720, phone390×844/844×390. No whole-layout scaling.

World: 96×74. Abandoned Japanese timber street and weathered shrine courtyard, storm-water canal and muted red maple. Collapsed machiya roofs/debris read as Japanese ruins rather than Indonesian basalt.

## 3. ผังภาพรวมและ terrain
West arrival cedar fringe; broken town court; central canal/causeway; north archive shrine; eastern maple garden with flooded hollows.
Broad authored coves, bounded-radius corners and variable river turns; semantic strokes control both native water coverage and baked half-unit wet blockers. No grid/hash object composition.

## 4. Navigation graph และทางเข้า
west4,56→20,56→31,47→40,40→59,40→73,35→88,25→92,25. Side northshrine40,22; abandonedmarket22,37; garden77,54.
All required entrances connect to spawn and reverse routes; local proposal exits remain inactive. Entrance/court/bridge/turning space excluded from tree footprints.

## 5. รายการอาคารและสถานที่จำเป็น
| Stable ID | Asset | Anchor | Footprint / entrance |
|---|---|---|---|
| storm-shrine | shrine | 40,17 | 10×4; entrance40,23 |
| ruin-west | house | 20,31 | 7×3; entrance20,35 |
| ruin-east | house | 74,28 | 7×3; entrance74,32 |
| ruin-south | house | 24,60 | 7×3; entrance24,64 |
| canal-bridge | bridge | 53,42 | flat deck, no blocking footprint |
| storm-torii | torii | 40,31 | two piers, open center |

Failed placements: none yet; record actual corrections below, never silently omit an ID. Decorative grove/lantern/rock placement will be explicitly authored around this graph.

## 6. น้ำ หน้าผา และพืชพรรณ
Cedar silhouettes, restrained red maple/sakura and moss granite; no Thai jungle or Indonesian volcanic art. Water shared animation, curved native shores; fog confined to pond/ravine/drainage hollows and excluded from roads. Waterfall is an animated scenic surface with no climbable elevation claim; other maps no fake falls.

## 7. Asset kit และรอยต่อ
New original Japan atlas: torii/shrine/temizu pavilion, cedar/sakura/stone lantern, horizontal timber bridge/moss rock/abandoned machiya, moss/soil/stone road. Preserve original PNG/alpha; native crops/nearest sampling; source and prompt in japan-three. PixelLab balance0,Comfy8188 unavailable: one built-in imagegen fallback, no paid retry. Architecture reference text only: https://www.japan.travel/en/guide/shrine-and-temple-traditions/ and https://www.japan.travel/en/spot/630/ . Original composition, not a real shrine replica.

## 8. Layer และ runtime mapping
Semantic ground32px/unit; water16px/unit native mask; bridge under actors; standing objects depth by base; localized fog separate from collision; optional labels/debug guides separate. Phaser owns local world/camera, React owns preview controls, no server connection or fake NPCs.

## 9. Validation
All required IDs, full footprint land support, graph/BFS/local walking round trips, river crossing/collision, original atlas bounds/hash; build/typecheck; actual label-off overview and landmark, desktop/mobile screenshot and resize/lifecycle inspection. Technical checks are not user visual approval.

## 10. Deferred
Live portals, inhabitants/combat balance, new shikigami/skill effects and real elevation wait for separate authorization. No existing Japan character art regenerated.
