# ember-caldera — ปล่องพิธีอัคคี / revision01 /2026-10-15

## 1. Scope / authorization
User requests THREE maps per eligible nation, continue Indonesia from existing ashwind-volcano. This is one of two additional independent previews; full Indonesian set now3. Preserve all8 live maps, original ashwind geometry/comments and unrelated work. No room/portal/NPC/monster or production character publication. Reuse original owned ashwind-01 art/source alpha unchanged; zero new generations/GPU jobs. Name/geography/levels provisional. Ember is existing WORLD-30 planned node; estuary is additional proposed node, no silent replacement of another nation. Atlas expansion/live links deferred to explicit adoption.

## 2. Experience / scale
96×76; entry4,64→16,64→16,50→28,50→36,60→54,62→72,58→83,47→91,47. North loop28,50→24,38→28,25→44,22→64,22→79,29→83,47. Mineral lake52,40/r13 plus61,43/r8; southeast spring84,64/r4→outlet90,76. Dry south/north ring clear of lake; no artificial flowing-lava or crater-height claim. WORLD_UNIT_PX32/MAP_ASSET_SCALE2/native16px; speed4. Orthogonal elevated three-quarter, upright facades; level0 shoreline/court walking. No climbable cliff, stairs, ship or interior claim. Desktop1280×720/portrait390×844/landscape844×390; measure route/time after authoring. Caldera uses sparse hot ash margins and a mineral-lake circuit; estuary uses broad sea, inlet/ford, dense sheltered regional plants and activity-facing timber buildings. Distinct from the other Indonesian maps by composition, not a copied/scaled layout.

## 3. Terrain and zones
North↑, continuous rectangular world. Caldera: west threshold/arrival; north ritual court and vent pockets; central blocked mineral lake; east bypass; south spring rest/outlet. Estuary: northwest watch precinct; west workshop grove; central river ford; south harbour court/quay; east water boundary. Coast/lake shapes authored explicitly before dressing. Open walking spine separate from contact shadows/foliage. No grid/hash scatter or whole-layout scaling.

## 4. Routes / entrances
Main graph follows listed spine; bidirectional. Side paths connect every required entrance, court and overlook. Gate pier foundations exclude open center and have a north/south approach before lateral turns. Water support sampled after final dry ford/quay paint. Main road width4–5units, forecourts6–10units. Fixed endpoints are future route proposals; selector is local preview navigation, not active gameplay warp. All destinations BFS and main route both ways required before delivery.

## 5. Required inventory
ember-sanctum44,17/10×5→44,22; west-gate16,58/two piers→16,58; west-shelter10,40/6×3→10,44; north-vent70,12/6×3→67,20; south-rest76,62/6×3→76,66; spring-marker77,64/2×1→77,68. Sprite dimensions read from shared atlas and widths authored per instance; south-facing entrances and stopping space distinct from blocking footprints. Decorative rocks do not substitute for collision cliffs. Named vegetation groups and building clusters respond to water/arrival/ritual/harbour activity. Required IDs may never disappear on failed placement. Failed candidates initially none; corrections recorded explicitly below.

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

Correction01 from side-route shared movement:72,58→76,66 crossed south-rest foundation. Approach now goes via70,63 and72,66 before the south entrance76,66. Required building retained, route repainted before wet blockers.

### Final revision01 evidence
35 objects,6 required IDs/9 destinations;25,475 reachable samples; main110.912units/27.728s one way. Actual browser3 one-way passes,171,359 wet pixels; portrait/landscape retain44,22. Main and every authored side edge shared-movement go/return pass, all entrances reachable, full footprint support checked, final failedPlacements empty. Actual label-free overview/landmark/player camera and390×844/844×390 inspected; no horizontal document overflow. Screens in screens/, shared evidence ../indonesia-three/browser-review.json. Build/typecheck/regressions pass; final user visual acceptance remains open.
