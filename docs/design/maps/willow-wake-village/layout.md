# หมู่บ้านวิลโลว์ม่านฝน — willow-wake-village layout brief

## 1. Status / scope
Draft2026-10-15 from MAP_DESIGN_TEMPLATE.md and SHAMAN_MAP_DESIGN_STANDARD.md. USER requests next roadmap country, three previews before live adoption. Ireland follows Norway in world roadmap; golden-spiritwood and stone-oath-moor are existing planned IDs. Third village/name/geography/levels provisional. Existing outfit audit only covers Thailand/Indonesia/Japan/Norway; Ireland environment work does not imply new player outfits. Preserve18 live maps,34 atlas nodes, portals/NPCs/monsters/comments. No server room or live atlas adoption this stage.

## 2. Experience / scale
88×74 world units, U32, native16px/unit, scale2, walk4units/s. Main routes4.6units; side approaches4units; large monument court10units clear. Measure full graph route lengths after graybox, not straight map width. Desktop/player camera and mobile390×844/844×390 required.

## 3. Terrain / scaled overview
North ↑, continuous rectangle. Low whitewashed thatched cottages form an asymmetric village around a curved cobbled lane. Dry-stone wall clusters edge gardens; willows follow a southern pond; no tropical huts or Nordic high gables. New third location/name proposed only.
Zone order: entry resting clearing → fork → monument/village court → encounter margins → proposed exit. Exact scaled polygons/route vertices follow in map.json/plan.json. Water blocked by matching native semantic geometry, not sprite alpha. No climbable cliffs, stairs, real-site replica or religious-practice claim.

## 4. Navigation / entrances
west4,48 → village court32,43 → market49,39 → willow lane67,29 → east84,20. All branches bidirectional and every required front reachable from spawn. Review focus is local positioning, not a server warp. Fields separated from service/entry/court masks. River bridge only on first map: dry lane cuts same water polygon in authoritative mask, shore abutments explicit, visual deck fits road. No whole-layout scaling or final grid/hash/random scatter.

## 5. Required structures
Stable IDs: village-hall, west-cottage, east-cottage, rain-tower. Separate bottom-center base anchor, blocking footprint, crop rectangle/sprite roof bounds, entrance/front approach and forecourt. Monument solid base with reachable SOUTH court, not a walk-through magic portal. Cottages/round tower decorative interiors, front doors accessible; walls are solid bases outside lanes. Failed IDs/reasons must be recorded and repaired, never dropped silently.

## 6. Water / vegetation
Authored river bends/coves/pools with worn irregular native-pixel bank toes; regional oak saplings/grass/pebbles use common independent ecology. Explicit copper-oak canopy groups, willow riparian groups and sparse moor margins; avoid doors/courts/route centers. Localized mist only water/hollows; no screen-covering fog. Ground details non-colliding, no seeded placement of landmarks/forest composition. Level0 across previews; no implied height from depth sort.

## 7. Regional kit / adjacency
One original Ireland atlas: dolmen/cottage/roundtower, oak/willow/beacon, low wall/limestone/stonebridge, leaf moss/peat gravel/limestone paving. Nearest filtering and owned painted quilting; grass↔dirt↔stone edges use shared wear, water mask exact at bridges. Iconic moor composition uses original monumental capstone and low drystone walls, no copied sacred symbols/writing or site replication.
PixelLab balance0/resetNov8 and Comfy8188 unavailable; built-in imagegen fallback. Prompt/receipt/sourcealpha/hash/crops retained in ireland-01. General architectural reading: heritageireland.ie/unguided-sites/poulnabrone-portal-tomb/ and National Museum of Ireland traditional architecture FAQ; no external image pixels downloaded or given to generator.

## 8. Runtime layers
JSON authoring, no TMX importer claim. Native terrain/quiltPaint/weatherGroundEdges → WaterLayer and independent bank ecology → y-sorted regional props/contact shadows → local water-side atmosphere → actor/debug labels. Shared stepMovement/isBlocked for local actor. React controls + Phaser world, ResizeObserver preserves scene/session, shutdown cleanup. No shared/server gameplay mutation.

## 9. Gameplay locations
Mark service fronts and open encounter clearings as proposals only. No NPC interaction, rewards, monster instances or working portals in these local previews. Existing planned levels40–55/50–65 retained as proposals; village45–60 provisional. Do not invent approved branches/lore/geography.

## 10. Validation
Before delivery: required IDs/full footprint support; all locations BFS and main/side walk roundtrips; native water samples vs independent geometry; bridge span/deck/abutment; source SHA/crop bounds and immutable ecology; build/typecheck/regressions; label-off overview and player-camera entrance/landmark/field; desktop/portrait/landscape. Not yet run at brief creation. User visual approval pending; technical tests do not approve art.


## Measured graybox / placement corrections
Main path 86.5world units /21.6s at WALK_SPEED4. Required IDs complete; no unresolved failed placements.

waylight-7/8 at71,48 /79,48 blocked the tower approach; moved to71,50 /79,50. Herbal-cottage8,59 lay across the first south approach; branch rerouted via4,53→4,64→8,64 around its west base, preserving the required building.

| Required ID | Base / blocking w×h | Sprite native width | Access node |
| --- | --- | --- | --- |
| village-hall | (36,24) Z0 / {'w': 10, 'h': 3} | 190px crop cottage | plan.locations + sideTours |
| west-cottage | (18,34) Z0 / {'w': 6, 'h': 3} | 120px crop cottage | plan.locations + sideTours |
| east-cottage | (65,22) Z0 / {'w': 6, 'h': 3} | 120px crop cottage | plan.locations + sideTours |
| rain-tower | (75,43) Z0 / {'w': 3, 'h': 2} | 76px crop tower | plan.locations + sideTours |

### Scaled geometry and graph
North ↑. All coordinates world units; exact scaled polygons in map.json. Every edge below bidirectional, width4.6 unless bridge deck.

- E0: (4,48) ↔ (18,48) ↔ (32,43) ↔ (49,39) ↔ (60,35) ↔ (67,29) ↔ (84,20)
- E1: (32,43) ↔ (36,35) ↔ (36,30)
- E2: (18,48) ↔ (18,39)
- E3: (67,29) ↔ (65,27)
- E4: (60,35) ↔ (64,43) ↔ (75,48)
- E5: (49,39) ↔ (51,49) ↔ (56,59)
- E6: (18,48) ↔ (12,53) ↔ (4,53) ↔ (4,64) ↔ (8,64)

Roof bounds/anchors come from ireland-01/manifest.json at scale2; independent base footprints above. Entrances and foreground courts remain separate from roofs. Decorative-only interiors, no active portals/NPCs/monsters. Ground sampling/native bridge support and all main+side shared-movement roundtrips pass. Visual review evidence is in ../ireland-three/.
