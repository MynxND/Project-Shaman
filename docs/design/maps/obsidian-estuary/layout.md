# obsidian-estuary — ปากน้ำออบซิเดียน / revision01 /2026-10-15

## 1. Scope / authorization
User requests THREE maps per eligible nation, continue Indonesia from existing ashwind-volcano. This is one of two additional independent previews; full Indonesian set now3. Preserve all8 live maps, original ashwind geometry/comments and unrelated work. No room/portal/NPC/monster or production character publication. Reuse original owned ashwind-01 art/source alpha unchanged; zero new generations/GPU jobs. Name/geography/levels provisional. Ember is existing WORLD-30 planned node; estuary is additional proposed node, no silent replacement of another nation. Atlas expansion/live links deferred to explicit adoption.

## 2. Experience / scale
90×80; west entry4,20→18,20→30,27→34,34→49,34→54,49→49,62→58,69→45,76. Broad eastern sea has authored scalloped coastline x60–72. River24,0→27,14→35,26→42,36→53,42→sea65,42. Dry basalt ford34–49/y34 and terminal stone quay58,69; forest and fern pockets on western sheltered banks. WORLD_UNIT_PX32/MAP_ASSET_SCALE2/native16px; speed4. Orthogonal elevated three-quarter, upright facades; level0 shoreline/court walking. No climbable cliff, stairs, ship or interior claim. Desktop1280×720/portrait390×844/landscape844×390; measure route/time after authoring. Caldera uses sparse hot ash margins and a mineral-lake circuit; estuary uses broad sea, inlet/ford, dense sheltered regional plants and activity-facing timber buildings. Distinct from the other Indonesian maps by composition, not a copied/scaled layout.

## 3. Terrain and zones
North↑, continuous rectangular world. Caldera: west threshold/arrival; north ritual court and vent pockets; central blocked mineral lake; east bypass; south spring rest/outlet. Estuary: northwest watch precinct; west workshop grove; central river ford; south harbour court/quay; east water boundary. Coast/lake shapes authored explicitly before dressing. Open walking spine separate from contact shadows/foliage. No grid/hash scatter or whole-layout scaling.

## 4. Routes / entrances
Main graph follows listed spine; bidirectional. Side paths connect every required entrance, court and overlook. Gate pier foundations exclude open center and have a north/south approach before lateral turns. Water support sampled after final dry ford/quay paint. Main road width4–5units, forecourts6–10units. Fixed endpoints are future route proposals; selector is local preview navigation, not active gameplay warp. All destinations BFS and main route both ways required before delivery.

## 5. Required inventory
watch-shrine28,13/9×4→28,18; harbour-hall54,58/8×4→54,62; west-workshop18,52/8×4→18,56; harbour-gate40,53/two piers→40,55; quay-marker59,70/1×.5→58,69; tide-rock69,53/2×1→60,53. Sprite dimensions read from shared atlas and widths authored per instance; south-facing entrances and stopping space distinct from blocking footprints. Decorative rocks do not substitute for collision cliffs. Named vegetation groups and building clusters respond to water/arrival/ritual/harbour activity. Required IDs may never disappear on failed placement. Failed candidates initially none; corrections recorded explicitly below.

## 6. Water / vegetation / atmosphere
Water source/shore/outlet described above. Existing WaterLayer/native masks handle motion and corner shore joins; bake half-unit wet blockers, road/ford/quay remain dry. Caldera steam confined to vents and spring margins, no global fog blanket. Estuary uses coastal/hollow mist, no volcano embers on the working harbour. Trees/ferns use original Indonesian kit, dense only in moisture shelter, sparse on hot ash ground. Ground variation seeded inside terrain masks; all objects explicitly placed. No new skill or passive VFX, damage or visibility debuff.

## 7. Asset kit / joins
Shared public/assets/umbral/ashwind-01 original9-frame atlas/prompt/provenance. Basalt paving/ash ground, sanctum/gate/pavilion/rock/tree/fern/vent. Integer native nearest crops, original source-pixel quilting; no repaint or tint pretending a new nation. Reuse original water/mist/shadows; no custom-object reflection or new animation-sheet claim. Test fork, river crossing, convex/concave shore and quarry/stone-quay joins used by actual layout.

## 8. Runtime mapping
Map/plan JSON outside MAPS; React three-map gallery owns selection, Phaser one world runtime per explicit map choice, shared stepMovement owns collision. Resize retains selected map/runtime/position. Explicit selection destroys old game/listeners/observer; remount resets local actor intentionally. Parameterized Indonesian art profile separates geography and atmosphere from reusable sprites. Ground/water/shadows→base-Y objects→local mist/particles→guides. Gameplay geometry independent of atmosphere. No Colyseus/schema changes.

## 9. Gameplay scope
Proposed west/east continuation markers only; no active tickets, monsters, stats, loot, shops or NPCs implied by buildings. Local actor/focus/tour explicitly review-only. Existing Santet/Keris and all gameplay stay unchanged.3 previews do not mean3 live areas. Third estuary geography and expanded atlas count remain design-review items.

## 10. Evidence / gates
Pending: required inventory, full footprint wet support, all entrances/overlooks BFS, source/client equality, main/side path round trips, normal-camera and label-free overview occlusion, desktop/portrait/landscape/resize. Typecheck/build +3-map and old-region tests required. Save actual browser screenshots, report technical checks separately from human art approval. Commit/push scoped map work after verification. Country batch target3 is now standing workflow preference, other nations not claimed complete.

Pre-placement correction: watch-shrine moves from28,13 to14,14 to avoid river support and keep full roof inside world; entrance14,18. tide-rock moves69,53→64,53 onto dry shore. No required item dropped.

Correction02 from full footprint wet-support check: decorative south-breakwater63,76 crossed sea edge. Move to60,76 on supported shore; retain ID and footprint.

Correction03 from actual shared movement: the diagonal49,34→54,49 left its land ribbon and attempted a second river crossing at the mouth. Main tour now visits the north-bank ford lookout49,34 and returns34,34, then follows west bank34,44→40,44→40,57→harbour49,62. The ford spur is an intentional overlook; no extra invisible bridge or second dry crossing added. Southern gate passed vertically through its opening.

Correction04 from side-route walk: workshop approach from north crossed its foundation. Route now uses26,40→26,55→18,56 to reach the south door, retaining both workshop and adjacent grove.

### Final revision01 evidence
52 objects,6 required IDs/9 destinations;18,849 reachable samples; main131.417units/32.854s one way. Actual browser3 one-way passes,569,962 wet pixels; manual54,62→51.9,62 and portrait/landscape retain51.9,62. Main and every authored side edge shared-movement go/return pass, all entrances reachable, full footprint support checked, final failedPlacements empty. Actual label-free overview/landmark/player camera and390×844/844×390 inspected; no horizontal document overflow. Screens in screens/, shared evidence ../indonesia-three/browser-review.json. Build/typecheck/regressions pass; final user visual acceptance remains open.
