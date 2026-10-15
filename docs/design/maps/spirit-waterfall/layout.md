# spirit-waterfall — น้ำตกม่านวิญญาณ

## 1. สถานะและขอบเขต
User2026-10-15 authorizes exactly three Japanese previews before live adoption. Names/geography/levels are proposals. Local React/Phaser only; no MAPS/rooms/portals/NPC rewards/skills/atlas status changes. Preserve eleven live content maps and all earlier comments. Japanese cultural vocabulary explicitly requested: torii, shrine, Onmyoji/Miko; original fictional brush marks only, no invented real kanji or copied real shrine.

## 2. ประสบการณ์และสเกล
Classic RO elevated three-quarter orthogonal rectangle; upright facades, no diamond/floating diorama.32 worldpx/unit; ground32px/unit1x, objects and shared water16px/unit2x; movement4units/s. Desktop1280×720, phone390×844/844×390. No whole-layout scaling.

World: 88×78. Moss ravine, tall cedars and wet slate path crossing a winding stream below a localized animated cascade. Small wayside shrine rather than another city.

## 3. ผังภาพรวมและ terrain
North spring pool with scenic cascade; sinuous river; forest shoulders; central bridge clearing; lower basin and moss path.
Broad authored coves, bounded-radius corners and variable river turns; semantic strokes control both native water coverage and baked half-unit wet blockers. No grid/hash object composition.

## 4. Navigation graph และทางเข้า
west4,62→22,58→27,44→30,38→58,38→72,28→83,18. Side shrine21,31; basinlook60,58; waterfalllook34,22.
All required entrances connect to spawn and reverse routes; local proposal exits remain inactive. Entrance/court/bridge/turning space excluded from tree footprints.

## 5. รายการอาคารและสถานที่จำเป็น
| Stable ID | Asset | Anchor | Footprint / entrance |
|---|---|---|---|
| ravine-shrine | shrine | 21,27 | 8×4; entrance21,32 |
| river-bridge | bridge | 44,40 | flat deck, no blocking footprint |
| stream-torii | torii | 29,46 | two piers, open center |
| cascade-left | rock | 44,15 | 3×1.5 |
| cascade-right | rock | 51,15 | 3×1.5 |

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

Correction01: both cascade abutment footprints touched the spring polygon. Move required cascade-left44,15→40,15 and cascade-right51,15→56,15 onto the banks; scenic water ribbon stays47,10. No required ID removed.

Correction02: diagonal22,58→27,44 struck the torii left pier. Main approach now22,58→29,52→29,48→29,44, through the open center; side shrine path remains joined within road width.

Correction03: lantern30,41 obstructed the north approach; move32,42. Anticipated bridge-side approach clash resolved by moving lantern60,40→62,39. Both stand beside, rather than on, the walking line.

Visual correction04: tiling the existing32×96 waterfall icon repeated disconnected bars; replace with one intact source image plus subtle alpha shimmer. Main river water continues its shared flow animation. Scenic fall is an illustrated cascade with shimmer, not a newly generated multi-frame waterfall or climbable terrain.
