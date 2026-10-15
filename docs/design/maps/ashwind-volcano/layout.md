# ashwind-volcano — ภูเขาไฟเถ้าลม / revision01 /2026-10-15

## 1. สถานะและขอบเขต
User prioritizes nations with existing character assets. Audit: production class outfit manifest has Thai Achan/Juggernaut; detailed draft manifest has Indonesia Santet/Keris, Japan Onmyoji/Miko, Norway Rune Seer/Ullr Hunter. Russia has skill trees but no corresponding outfit found in these manifests. Draft art availability is not approval of all motion or production publication. Start Indonesia ashwind-volcano, an existing WORLD-30 node (proposed50–65), one map preview; Japan/Norway next eligible. Preserve all8 live maps, Chinese ruins preview, character art, comments and gameplay. Local Phaser review only, no room/portal/NPC/rewards. PixelLab0 and ComfyUI8188 unavailable; one imagegen regional atlas fallback; no paid retry/GPU work. Name/levels/geography are proposals, not approved lore.

## 2. Experience / scale
90×74 rectangular world; WORLD_UNIT_PX32 / MAP_ASSET_SCALE2 →16native px/unit, speed4units/s. Indonesia distinct from Thailand's wet forest and China's limestone farms: wind-swept gray ash plains, angular black basalt, terracotta soil ribbons, sparse dark coastal highland trees/ferns, dark stepped volcanic stone and carved-timber archipelago architecture. Southeast overcast humid foothill, northern warm vent field. No cinematic perspective, diamond bases, Thai golden spires or Chinese ceramic roofs. Ground is level0; rock silhouettes do not imply climbable elevation. Desktop1280×720, phone390×844/844×390. One-way route time measured after authoring.

## 3. Terrain / functional zones
North↑. West entry(4,54)→foothill shelter(18,52)→split stone gate(30,46)→basalt crossing(43,42)→ritual court(55,33)→cinder overlook(67,23)→north-east caldera approach(84,16). Terrain masses: northwest cooled-lava ridges; north-east blocked vent shelf; central charcoal court; west ash gullies; southeast humid fern pocket and spring. Broad traversable ash clearings between masses, never one repeated forest. Water source(70,51)→spring basin(71,56)→outlet(64,74), with dry stone ford64,65. No real flowing lava or climbable caldera claim; original vent sprite with ember cracks is a decorative blocked rock.

## 4. Navigation / entrance graph
Main route width4–5units, asymmetric winding basalt trail. Branches gate→shelter18,49; crossing→forge35,33; court→stone sanctum55,28; court→spring-bank65,55→ford64,65→southern fern trail39,65→gate30,46. Bidirectional route and required destination BFS. No active boundary triggers. Safe west arrival4,54. North-east exit84,16 remains proposal for ember-caldera (existing roadmap ID), not a working warp. No stairs in flat revision01.

## 5. Required structures / composition
|ID|Base / prefab|Footprint|Entrance / clearance|
|---|---|---|---|
|basalt-sanctum|55,24 / stepped black-stone shrine|12×6|55,28, broad court south|
|split-gate|30,46 / open split gate|separate pier blockers|30,46; north exit30,42 before east turn|
|ash-shelter|18,45 / timber pavilion|7×3.5|18,49|
|keris-forge|35,29 / pavilion|7×3.5|35,33; no service implied|
|north-vent|76,12 / vent rock|6×3|overlook67,23, cannot enter vent|
|spring-marker|77,56 / basalt rock|2×1|65,55, dry bank|
Explicit ridge rock clusters align northeast/west boundaries; sparse tree/fern groups surround humid spring and southern windbreak, not uniform scatter. No required item silently dropped. Failed candidates recorded before correction. Buildings/pictured steps decorative, no interior or stair gameplay claim.

## 6. Water, vegetation, atmosphere
Original spring/stream WANG masks and wet blockers; ford lands on both dry banks. Sulfur steam localized at vent field; cool mist only humid hollow/spring. Ash motes restricted to authored wind corridors; no whole-screen particle blanket. No passive skill VFX or new damage rules. Native vent embers pulse modestly, red-orange geological light not a semantic spell family. Trees use separate archipelago highland silhouettes, ferns in sheltered damp soil only. Clear route/door/no-placement masks. Seeded randomness only painted-pixel texture assembly, never landmark/plant placement.

## 7. Regional asset kit
One original transparent3×3 atlas: stepped volcanic stone sanctum, split-stone gateway, dark timber tier-roof pavilion, angular basalt outcrop, wind-bent sparse highland tree, tropical fern clump, ember vent rock, basalt paving panel, ash/ochre ground panel. Original source PNG/alpha retained, frame bounds/hash/native sizes recorded. Nearest integer sampling, existing source-pixel quilting for ground. Water shore/corner masks reused; no generated backdrop substituted for collision. Reusable kit separate from new authored layout. PixelLab/Comfy unavailable fallback documented. No copied religious script, real sacred glyphs, Western symbols or third-party sprites.

## 8. Runtime / layers
Canonical map+plan JSON outside MAPS. Phaser independent regional art, React controls, shared stepMovement collision. Ground→water→contact shadows→base-Y sorted objects→local atmosphere. Existing WaterLayer accepts geometry with objects[] to avoid unsupported legacy object-reflection binding; no new custom reflection claim. Resize preserves position/runtime; update hooks/ResizeObserver destroyed. Scope is local; no Colyseus/schema changes. Camera follows elevated three-quarter orthogonal art, bounds clamp walking; explicit overview contains whole rectangle.

## 9. Gameplay scope
No NPC or actual monster spawns this revision. Monster arenas/spawn balance deferred; no creature art/levels/stats invented as existing. Existing Santet/Keris assets and behavior untouched. Local actor and focus selector explicitly review tools. Future integration requires reciprocal route decision and camp/balance/visual acceptance; current live atlas remains8/22.

## 10. Validation / evidence
Pending:6 required IDs, full footprint wet support,9 destination BFS, route and ford round-trip movement, label-off hierarchy, normal-camera occlusion and desktop/portrait/landscape inspection. Run typecheck/build, ashwind geometry/source and existing maps/atlas regression. Capture actual renderer screenshots; tests are not user art approval. Commit/push scoped map change after checks, retain unrelated pending work. No full-nation completion claim for one preview.

Pre-placement correction01: split-gate route travels north30,49→30,40 before turning east43,40, avoiding the right pier top at y42. Main crossing node is43,40 (not initial43,42). Spring ford spans59–72 at y65 and retains dry banks. All placements explicitly enumerated in generator.

### Final revision01 evidence
All6 required IDs/50 objects/9 locations pass;24,907 reachable samples;main96.409units/24.102s one way;main route and southern spring-ford loop go/return passed shared movement. Final failedPlacements empty, no silent drops. Actual browser2 one-way tour passes, manual ford64→70→63.9 both ways,24,665 native wet pixels, desktop label-off overview/sanctum/ford plus390×844 and844×390 inspected, no document overflow/position reset. Source/alpha/hash/prompt retained. Physical touch and final user visual approval open.

## Revision02 /2026-10-15 — national landmark and organic edges
User requires at least one instantly recognizable shaman-themed landmark map per nation and natural shoreline/layout contours. Scope: Indonesian3 previews only; existing live rooms/portals/monsters unchanged. Geometry rendered at native16px/world instead of whole-cell Wang silhouettes, nearest filtering retained. Author bounded-radius curved path centerlines, asymmetric caldera bays and a curved estuary coastline extending beyond outer world bounds; no noise/scatter or whole-layout scaling. Routes/endpoints/building IDs remain, wet blockers rebaked from the revised semantic shapes. Full support/BFS/main+side return checks required again.
Ember is the iconic Indonesian preview: reuse original own split-gate/pyramidal-stone art to compose a large original Bali-inspired gateway in front of the ritual sanctum at44,20; piers x38.5..41.5 and46.5..49.5, y17..20. Existing approach44,22 stays south of foundations, open axis preserved; original west-gate retained. Reference is architecture silhouette only, not a copy of a real sacred site. Source: https://www.indonesia.travel/id/en/travel-ideas/pilgrimage/pura-lempuyang . No new artwork/generation or scripture. Other maps keep their own composition. Required iconic-split-gate becomes seventh Ember object requirement.
Use the same semantic terrain raster for ground and native water coverage. Legacy WaterLayer.addTile behavior stays default for every existing game map; only these flat regional previews opt into native coverage. Explicitly reject elevated native-coverage misuse. No blur or antialiasing; small pixel steps expected, coarse cell blocks removed. Compare before/after at fixed review locations; desktop/phone and boundary/collision tests are visual-review prerequisites, not user art approval.


Revision02 result: native16px/unit ground and water now follow ordered semantic shapes with nearest2x sampling. Half-unit water blockers regenerated; all required locations and authored route round trips pass, no wet building footprints. Fixed source atlas and live world registration unchanged. Visual screenshots in revision02; technical checks are not user visual approval.
