# Current status — live adoption03 /2026-10-15

All three maps are adopted in actual gameplay. Enter from the south edge of Mountain Spirit Sanctuary at42,63, through Ashwind west; continue Ashwind east89,16→Ember west, Ember east95,47→Estuary west. Every connection is reciprocal. Safe arrivals are outside activation rectangles. Existing sanctuary routes and inhabitants remain.

Three service NPCs and nine authoritative monsters per new map (27 total). Levels Ashwind50/58/65,Ember60/68/75,Estuary55/63/70 are provisional balance. Owned NPC/monster animation silhouettes are reused, not newly generated regional artwork. Unique regional inhabitants are future work. Water, localized fog, vents and native organic shores share the reviewed production art implementation. No generation used.

Original30 atlas nodes retained plus extra Estuary:31 total,11 playable/20 planned. M details use actual residents/NPCs. Tests and actual game evidence are in live-network.json, live-geometry.json and each map's live03/. Preview gallery remains a local layout tool, not server gameplay.

Regeneration: run original map builders then tools/map/adopt-indonesia-live.mjs, build shared, build-world-atlas.mjs and build-world-art-details.mjs. Re-run live snapshot/geometry/network checks; authoring builders alone intentionally do not authorize/recreate gameplay. Do not overwrite pre-adoption snapshots.

Failed placements corrected: healer74,66 blocked Ember side route→74,69. Initial sanctuary south gate8,63/arrival8,60 hidden by canopy→42,63/42,60 with lower apron route; all original trees retained. Browser scene re-entry exposed global ground texture-key reuse→per-map key and shutdown cleanup.

## Historical preview record (superseded by live adoption above)

# Indonesia — three-map review /2026-10-15

User requests3 maps per eligible country. Gallery http://localhost:3000/maps/indonesia includes original ashwind-volcano and two additional independent authored layouts. Direct /maps/ember-caldera and /maps/obsidian-estuary initialize the corresponding gallery selection. Explicit selection resets a local review actor and destroys old runtime; it is not a gameplay portal. Resize preserves current position/map.

1. ภูเขาไฟเถ้าลม: existing90×74 foothill/ash landscape,50 objects,6 required/9 destinations,4 fumaroles; original geometry retained.
2. ปล่องพิธีอัคคี:96×76,35 objects,6 required/9 destinations; mineral lake circuit, ritual north shore, west threshold and southeast spring. Main110.912units/27.728seconds one way.
3. ปากน้ำออบซิเดียน:90×80,52 objects,6 required/9 destinations; broad eastern sea, river/stone ford, western workshop grove, southern harbour/quay. Main131.417units/32.854seconds one way includes the deliberate ford overlook spur.

Source briefs, explicit failed candidates/corrections, canonical/client map+plan and validation.json live in each map directory.0 new artwork/generation/GPU jobs; original ashwind-01 atlas/prompt/PNG/alpha retained unchanged. Indigenous-looking architecture is fictional game art, not verified real-world sacred sites. No new skills or character sprites. Nearest native crops and painted-pixel quilting reused; WaterLayer shoreline/animation and localized fog separate from wet/footprint collision. Ember has4 vent sources/ash corridors; coastal estuary has0 vents/ash sites. Flat logical shore/court worlds: no crater descent/elevation/interior/ship claim.

Scope: all3 local previews, no new MAPS/room/portal/NPC/monsters/rewards. Old8 live maps and30-node planning atlas retained. Third estuary is additional proposed geography outside original WORLD-30, pending future atlas/live adoption decision. Per-country3 preference supersedes earlier two-map allocations for new batches, while existing extra maps are preserved. Japan/Norway remain future batches.

Checks: node tools/map/build-indonesia-three.mjs; node tools/map/test-indonesia-three.mjs; node tools/map/test-ashwind-volcano.mjs. New main and every side graph edge shared-movement round trips, full blocking-footprint wet support, all18 destinations BFS,12 required IDs/native art bindings and client/canonical equality pass. Technical tests are not human art approval. Actual desktop/portrait/landscape screenshots are stored per map; physical touch/performance not certified. Typecheck/build plus old map/atlas regressions run before commit.

Actual gallery QA: both new maps complete3 one-way passes each (at least one full round trip); original Ashwind returns ready at4,54/24,665 wet pixels. Exactly one canvas after explicit map switches; desktop and both phone sizes inspected with no horizontal document overflow and frozen review position retained on resize. Evidence browser-review.json and per-map screens. No new generation, paid assets, GPU job, character publication or gameplay grants.


Live03 browser evidence: native-key guest game travel Ashwind→sanctuary42,60→Ashwind4,54; successful same-map render re-entry after texture cleanup. Live caldera walking16,60→28,24→44,24, server-backed guard dialog; live estuary route4,20→18,27→30,34→43,34 and blocked off-ford downward movement43,36. Screenshot evidence per-map live03.390×844/844×390 preserve44,24 with no horizontal overflow; M shows11 live/20 planned and actual estuary residents/NPCs. Existing high-detail NPC outfits remain reused proxies, unique national silhouettes pending.

Final isolated staged snapshot: build/typecheck, live geometry/native terrain/atlas checks and full two-client six-trip network test passed without unrelated pending edits. Original Spiritwood↔paddy↔mangrove↔marsh network travel passed. Main workspace shared gameplay suite and old mountain/bamboo/tea/water checks passed.
