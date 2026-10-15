# ป่าใบผลัดอาคม — golden-spiritwood layout brief

## 1. Status / scope
Draft2026-10-15 from MAP_DESIGN_TEMPLATE.md and SHAMAN_MAP_DESIGN_STANDARD.md. USER requests next roadmap country, three previews before live adoption. Ireland follows Norway in world roadmap; golden-spiritwood and stone-oath-moor are existing planned IDs. Third village/name/geography/levels provisional. Existing outfit audit only covers Thailand/Indonesia/Japan/Norway; Ireland environment work does not imply new player outfits. Preserve18 live maps,34 atlas nodes, portals/NPCs/monsters/comments. No server room or live atlas adoption this stage.

## 2. Experience / scale
90×74 world units, U32, native16px/unit, scale2, walk4units/s. Main routes4.6units; side approaches4units; large monument court10units clear. Measure full graph route lengths after graybox, not straight map width. Desktop/player camera and mobile390×844/844×390 required.

## 3. Terrain / scaled overview
North ↑, continuous rectangle. Copper oak groves frame a winding river crossing; small thatched lodge north of the west path, original ancient stone monument in eastern clearing. Forest composition uses canopy masses with two open hunting fields.
Zone order: entry resting clearing → fork → monument/village court → encounter margins → proposed exit. Exact scaled polygons/route vertices follow in map.json/plan.json. Water blocked by matching native semantic geometry, not sprite alpha. No climbable cliffs, stairs, real-site replica or religious-practice claim.

## 4. Navigation / entrances
west4,58 → fork26,51 → bridge45,43 → grove62,29 → east86,21. All branches bidirectional and every required front reachable from spawn. Review focus is local positioning, not a server warp. Fields separated from service/entry/court masks. River bridge only on first map: dry lane cuts same water polygon in authoritative mask, shore abutments explicit, visual deck fits road. No whole-layout scaling or final grid/hash/random scatter.

## 5. Required structures
Stable IDs: grove-dolmen, west-lodge, river-bridge. Separate bottom-center base anchor, blocking footprint, crop rectangle/sprite roof bounds, entrance/front approach and forecourt. Monument solid base with reachable SOUTH court, not a walk-through magic portal. Cottages/round tower decorative interiors, front doors accessible; walls are solid bases outside lanes. Failed IDs/reasons must be recorded and repaired, never dropped silently.

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
Main path 93.2world units /23.3s at WALK_SPEED4. Required IDs complete; no unresolved failed placements.

waylight-5/6 at57,29 and67,29 interrupted the diagonal main route. Moved to57,32 /67,33; all same IDs retained. Bridge follows authored diagonal37,47→53,39, matching source deck, instead of a horizontal road under an angled sprite.

| Required ID | Base / blocking w×h | Sprite native width | Access node |
| --- | --- | --- | --- |
| grove-dolmen | (62,23) Z0 / {'w': 7, 'h': 3} | 148px crop dolmen | plan.locations + sideTours |
| west-lodge | (20,32) Z0 / {'w': 7, 'h': 3} | 138px crop cottage | plan.locations + sideTours |
| river-bridge | (45,47) Z0 / None | 208px crop bridge | plan.locations + sideTours |

### Scaled geometry and graph
North ↑. All coordinates world units; exact scaled polygons in map.json. Every edge below bidirectional, width4.6 unless bridge deck.

- E0: (4,58) ↔ (18,58) ↔ (26,51) ↔ (33,49) ↔ (39,46) ↔ (45,43) ↔ (51,40) ↔ (56,37) ↔ (62,29) ↔ (74,25) ↔ (86,21)
- E1: (26,51) ↔ (22,44) ↔ (20,37)
- E2: (56,43) ↔ (64,54) ↔ (75,53)
- E3: (18,58) ↔ (17,64) ↔ (28,65)

Roof bounds/anchors come from ireland-01/manifest.json at scale2; independent base footprints above. Entrances and foreground courts remain separate from roofs. Decorative-only interiors, no active portals/NPCs/monsters. Ground sampling/native bridge support and all main+side shared-movement roundtrips pass. Visual review evidence is in ../ireland-three/.


## Live adoption brief /2026-10-15
USER authorizes Ireland3 into real game before Russia previews. Additive chain: Aurora Pass east(90,19) ↔ Golden Spiritwood west(0,57); Forest east(88,20) ↔ Stone Oath Moor west(0,59); Moor east(94,21) ↔ Willow Village west(0,47). Arrivals4units inside,6×6safe areas,2×2triggers. Keep all reviewed objects/blockers/water and original Norwegian gates/NPCs/camps. Only short dry edge roads added. Each Irish map3 NPCs/3 camps×3residents with explicit original IDs/provisional40–55,50–65,45–60balance; owned sprites reused. No new art/combat/VFX. All main/side paths and service fronts must remain reachable; water membership unchanged. Validate real signed-ticket travel both directions, no bounce, NPC heal/talk, observer synchronization, combat/EXP/profile, desktop/mobile. Prior preview status historical; no Russia live adoption yet.
