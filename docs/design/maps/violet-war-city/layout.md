# violet-war-city — นครเถ้าม่วง / Map Design Brief

## 1. สถานะและขอบเขต
Revision01 /2026-10-15. User requests one additional Chinese city ruined by occult warfare, grand civilization ruins, localized mist, smoldering violet fire and mutated purple trees. Name/story/levels are provisional. Stage: isolated walking preview before live adoption. Preserve all8 live maps, portals, NPCs, monsters and existing comments. No server registration or world-atlas replacement. This is China's third designed map, additional to current WORLD-30 catalogue; atlas expansion/connectivity needs later adoption. PixelLab balance0 and ComfyUI8188 unavailable: one original imagegen modular atlas fallback; no paid PixelLab/GPU queue. Human art approval pending.

## 2. ประสบการณ์และสเกล
96×76 rectangular world,32px/world unit,16native terrain px,2× sprite scale,4units/sec. Classic elevated three-quarter overhead, upright facades; flat logical terrain0, no fake climbable levels. Encounter sequence: breached city gate→ruined merchant quarter→war-scar square→imperial archive ruins. North palace must dominate skyline; cropped charcoal roofs, gray stone foundations, broken walls and purple mutation remain recognizably Chinese. No Thai thatch, torii, Western runes or copied sacred text. Label-off overview and player camera desktop1280×720/portrait390×844/landscape844×390. Route time measured after implementation.

## 3. ผัง terrain / zones
North↑. West tea-road candidate entrance(4,60)→dry moat crossing(16,60)→breach(24,55)→market junction(36,55)→square(48,47)→archive approach(48,35)→palace forecourt(48,24). East exit proposal from square→(68,47)→(86,38)→(92,38). No active portal.
|Zone|Bounds/shape|Materials/activity|Sightline|
|---|---|---|---|
|moat-west|x10–15, north→south, dry crossing y57–63|stagnant teal water, ruined bank|entrance readable|
|merchant-west|x20–38,y30–56|ash soil, broken Chinese shop fronts|south-facing doors reach side branch|
|war-square|x39–61,y37–54|fractured limestone, wreckage perimeter|open center, fire outside travel spine|
|imperial-north|x33–66,y9–29|large ruined archive and twin wall fragments|palace facade visible along central avenue|
|mutation-east|x70–93,y10–34|purple trees, isolated fire pockets, ruined east quarter|irregular authored canopy groups|
|south-barracks|x29–67,y60–73|ruin cluster, purple root creep|secondary route loop|

## 4. Navigation graph and entrances
Main bidirectional graph follows points above; road width5–6units, court width12units. Side paths: (36,55)→(30,43)→(28,35); square→(62,35)→(76,26); market→(36,65)→(58,65)→(68,47). Moat has one deliberate dry causeway16,60. Required approaches: archive48,24; market28,43; barracks43,65; east pavilion76,31; gate24,55; square48,47; east look-out92,38. Every node reachable from spawn, route round trip validated. No stairs/cliffs in revision01. Closed door facades are decorative; do not claim building interiors.

## 5. Required location inventory / composition
|ID|Prefab/base|Footprint|Entrance|Clearance|
|---|---|---|---|---|
|imperial-archive|palace48,20|18×8|48,24|central avenue clear|
|breached-gate|gate24,55|two separate piers at19/29,55|24,55|open middle6units|
|market-shell|house28,39|7×4|28,43|south-facing court|
|barracks-shell|house43,61|8×4|43,65|south loop clear|
|east-pavilion|house76,27|8×4|76,31|east mutation overlook|
|war-scar|debris55,43|4×2|48,47|outside central walking spine|
North wall fragments flank archive; merchant ruins cluster along winding street, eastern grove follows war contamination. Gate art has no full-width invisible blocker. Failed placements explicit: pending, none silently dropped. Details added only at authored coordinates, no grid/hash layout scatter or whole-map rescale.

## 6. Water / vegetation / environmental effects
Moat source north-left→west channel→south outlet; dry crossing has matching land paint and blockers. Small eastern basin86,63,r5: environmental visual, no artificial waterfall claim. Authored mutated tree groups east/north and sparse broken roots south, not recolored Thai forest. Mist only moat, grove hollow and south basin. Fire sites at war rubble, collapsed shops and palace flank, finite additive overlays anchored on debris; cosmetic environmental remnants, no damage or passive/skill VFX. User explicitly requests violet, scoped to this war contamination rather than changing semantic skill colors. Foot-level light modest, actors/routes remain legible.

## 7. Asset kit / joins
One original transparent3×3 atlas: ruined palace, breached Chinese city gate, ruined house, wall segment, mutated violet tree, war debris, purple flame, fractured limestone paving, ash-earth. Source PNG/alpha retained with hash/frame metadata/prompt. Native nearest crops; minimum-error painted-pixel quilting for terrain; existing WaterLayer handles wet masks/shore joins. Test material road/dirt and straight/concave/convex shore joins at crossing/basin. Native sprite bounds measured from actual output before binding, no assumptions of exact model output size. Reuse owned fog/shadows, no new creatures.

## 8. Layers / runtime mapping
Canonical map/plan JSON isolated from MAPS. React review UI, Phaser world/camera/water/fire/mist and shared stepMovement/collision. Terrain beneath WaterLayer; anchored objects sort by world Y; trees/roof occlusion inspected walking. Gameplay blockers from footprints/wet geometry, separate from fire/fog. Scene shutdown removes update listeners; ResizeObserver resizes existing runtime, never recreates session. No Colyseus or profile changes.

## 9. Gameplay locations
West/east are proposed future reciprocal gates only, no active triggers. Camps optional future design, no fake live monster/NPC services or loot. Review actor and focus reposition explicitly local tools. Future tea connection/endgame balance TBD. All unchanged production portals remain intact.

## 10. Evidence / stage gates
Required IDs, full wet footprint support, all entrance BFS, actual shared-movement round trip, normal-camera occlusion, label-off hierarchy and desktop/portrait/landscape inspections pending. Build/typecheck + relevant existing map regressions required. Capture actual preview; tests are not human visual acceptance. Commit/push only scoped map work; retain unrelated working tree edits. Next authorized deliverable: walking preview, not automatic live adoption.

### Pre-placement correction01
Gate right pier would obstruct an immediate east turn at24,55. Main route now continues north through24,50 before turning east to36,50 and48,47. Merchant/loop junction updates36,50. This is an explicit route correction, not hidden rejection of required piers.

Correction02 from navigation test: market debris at32,51 touched route y50. Move this nonrequired rubble/fire pair to32,53, clear of road; no required landmark removed. Failed candidate recorded here, final validation rerun.

### Visual pass03
Overview shows isolated east trees rather than a contamination grove. Add six explicitly authored eastern companion trees (75,9;88,10;78,20;88,27;67,18;74,22), keeping door76,31 open. Widen irregular moat bends, retain existing dry crossing. Reduce paving sample96→64 so slabs match actor scale. Palace inspection needs a full facade frame; selecting that review location frames its sprite plus forecourt, and manual walking restores player camera. This is a local camera helper, not a gameplay warp or cinematic perspective.

### Final revision01 evidence
57 objects/6 required IDs/9 reachable locations;25,588 reachable samples;73.803unit route/18.451s one way; no final failed placements. Browser route4 one-way passes, manual walk, palace/overview/grove and390×844/844×390 resize inspected with no horizontal document overflow and position retained.110,402 native wet pixels. Screens in screens/. Source/provenance/prompt retained. Technical pass and agent visual inspection only; user acceptance open.
