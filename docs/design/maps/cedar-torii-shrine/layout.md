# cedar-torii-shrine — ศาลเจ้าโทริอิกลางสน

## 1. สถานะและขอบเขต
User2026-10-15 authorizes exactly three Japanese previews before live adoption. Names/geography/levels are proposals. Local React/Phaser only; no MAPS/rooms/portals/NPC rewards/skills/atlas status changes. Preserve eleven live content maps and all earlier comments. Japanese cultural vocabulary explicitly requested: torii, shrine, Onmyoji/Miko; original fictional brush marks only, no invented real kanji or copied real shrine.

## 2. ประสบการณ์และสเกล
Classic RO elevated three-quarter orthogonal rectangle; upright facades, no diamond/floating diorama.32 worldpx/unit; ground32px/unit1x, objects and shared water16px/unit2x; movement4units/s. Desktop1280×720, phone390×844/844×390. No whole-layout scaling.

World: 96×76. Iconic vermilion torii avenue ends at a dark timber shrine under tall Japanese cedar; purification side court and asymmetrical mirror pond. Read Japan through architecture and plants without labels.

## 3. ผังภาพรวมและ terrain
Western moss clearing; north shrine/gravel court; cedar envelope; eastern pond/stream; lower transition grove.
Broad authored coves, bounded-radius corners and variable river turns; semantic strokes control both native water coverage and baked half-unit wet blockers. No grid/hash object composition.

## 4. Navigation graph และทางเข้า
west4,64→20,64→32,60→48,60→48,48→48,36→48,28→64,28→80,34→91,34. Side temizu20,40, shrine48,26, bridge74,54, pond84,44.
All required entrances connect to spawn and reverse routes; local proposal exits remain inactive. Entrance/court/bridge/turning space excluded from tree footprints.

## 5. รายการอาคารและสถานที่จำเป็น
| Stable ID | Asset | Anchor | Footprint / entrance |
|---|---|---|---|
| great-torii | torii | 48,60 | two piers, open center |
| inner-torii | torii | 48,44 | two piers, open center |
| cedar-shrine | shrine | 48,22 | 10×4; entrance48,27 |
| purification-pavilion | pavilion | 20,36 | 6×3; entrance20,40 |
| pond-bridge | bridge | 74,56 | flat deck, no blocking footprint |

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

Correction01: initial horizontal route32,60→48,60 hit the torii left pier on return. Keep gateway required, move approach to32,64→48,64→48,60; pavilion branch starts32,64. Both entry and return now pass through the opening.

Correction02: decorative bridge lantern62,54 blocked the crossing. Move paired lanterns to62,58/86,58 beside the bridge, keeping approach60,54→84,54 open.

Visual correction03: a single attempt to frame the entire long avenue cropped the shrine roof under world-cover zoom. Landmark inspection now frames shrine/forecourt only (center48*32,650;1000×760); gate inspection remains a separate walking view. No whole-layout rescaling. Moss sampling uses a muted solid undercoat beneath source art to keep cedar silhouettes legible, original PNG untouched.

Visual correction04: the ordinary close following camera cropped tall torii at its base. Gate inspection now has a dedicated950×650 framing center48,57, separate from the shrine inspection; manual walking resumes ordinary camera. Both required structures can be viewed intact without shrinking world layout.
