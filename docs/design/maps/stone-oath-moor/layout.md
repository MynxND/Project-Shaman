# ทุ่งคำสัตย์หิน — stone-oath-moor layout brief

## 1. Status / scope
Draft2026-10-15 from MAP_DESIGN_TEMPLATE.md and SHAMAN_MAP_DESIGN_STANDARD.md. USER requests next roadmap country, three previews before live adoption. Ireland follows Norway in world roadmap; golden-spiritwood and stone-oath-moor are existing planned IDs. Third village/name/geography/levels provisional. Existing outfit audit only covers Thailand/Indonesia/Japan/Norway; Ireland environment work does not imply new player outfits. Preserve18 live maps,34 atlas nodes, portals/NPCs/monsters/comments. No server room or live atlas adoption this stage.

## 2. Experience / scale
96×78 world units, U32, native16px/unit, scale2, walk4units/s. Main routes4.6units; side approaches4units; large monument court10units clear. Measure full graph route lengths after graybox, not straight map width. Desktop/player camera and mobile390×844/844×390 required.

## 3. Terrain / scaled overview
North ↑, continuous rectangle. Open pale limestone/heather moor, enormous original capstone monument north of court, ruined round tower at west rest stop. Broad organic pond southeast, sparse wind-bent broadleaf rather than conifer forest.
Zone order: entry resting clearing → fork → monument/village court → encounter margins → proposed exit. Exact scaled polygons/route vertices follow in map.json/plan.json. Water blocked by matching native semantic geometry, not sprite alpha. No climbable cliffs, stairs, real-site replica or religious-practice claim.

## 4. Navigation / entrances
west4,60 → field27,53 → oath court48,37 → eastern trail74,30 → east92,22. All branches bidirectional and every required front reachable from spawn. Review focus is local positioning, not a server warp. Fields separated from service/entry/court masks. River bridge only on first map: dry lane cuts same water polygon in authoritative mask, shore abutments explicit, visual deck fits road. No whole-layout scaling or final grid/hash/random scatter.

## 5. Required structures
Stable IDs: great-dolmen, moor-tower, moor-cottage. Separate bottom-center base anchor, blocking footprint, crop rectangle/sprite roof bounds, entrance/front approach and forecourt. Monument solid base with reachable SOUTH court, not a walk-through magic portal. Cottages/round tower decorative interiors, front doors accessible; walls are solid bases outside lanes. Failed IDs/reasons must be recorded and repaired, never dropped silently.

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
Main path 98.8world units /24.7s at WALK_SPEED4. Required IDs complete; no unresolved failed placements.

Landmark inspection camera at y27 clipped the tall capstone; center moved to y25. No terrain/layout scaling.

| Required ID | Base / blocking w×h | Sprite native width | Access node |
| --- | --- | --- | --- |
| great-dolmen | (48,28) Z0 / {'w': 12, 'h': 4} | 240px crop dolmen | plan.locations + sideTours |
| moor-tower | (18,42) Z0 / {'w': 3, 'h': 2} | 72px crop tower | plan.locations + sideTours |
| moor-cottage | (75,21) Z0 / {'w': 6, 'h': 3} | 120px crop cottage | plan.locations + sideTours |

### Scaled geometry and graph
North ↑. All coordinates world units; exact scaled polygons in map.json. Every edge below bidirectional, width4.6 unless bridge deck.

- E0: (4,60) ↔ (18,60) ↔ (27,53) ↔ (35,45) ↔ (48,37) ↔ (61,32) ↔ (74,30) ↔ (92,22)
- E1: (27,53) ↔ (18,53) ↔ (18,47)
- E2: (74,30) ↔ (75,26)
- E3: (35,45) ↔ (44,55) ↔ (49,64) ↔ (55,67)

Roof bounds/anchors come from ireland-01/manifest.json at scale2; independent base footprints above. Entrances and foreground courts remain separate from roofs. Decorative-only interiors, no active portals/NPCs/monsters. Ground sampling/native bridge support and all main+side shared-movement roundtrips pass. Visual review evidence is in ../ireland-three/.
