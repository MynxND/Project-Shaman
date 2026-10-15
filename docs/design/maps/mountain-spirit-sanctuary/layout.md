# mountain-spirit-sanctuary — สำนักผนึกบนภูเขา

## 1. สถานะและขอบเขต
Draft revision01,2026-10-14. Next Phase2 map after monsoon-marsh per world-30 roadmap. User authorizes building next map; this stage delivers a fresh walkable visual/layout preview before live adoption. Old rejected96×112 Phase D stays inactive. Names/level25–35/inhabitants/geography proposed. Reuse owned assets; generation0. No MAPS registration, server/portal mutation, NPC service or quest promises.

## 2. ประสบการณ์และสเกล
74×64 world units;32px/unit, native art2×, walk4units/sec. Enter west foothill from proposed marsh approach → foothill rest → lower landing → middle ritual court → summit stair → seal academy forecourt. A quiet spring detour returns to the main route; east lookout is a proposed future China/Philippines route, visibly closed. Elevated three-quarter rectangular map; shrine facade upright. Labels optional; route/hierarchy visible through clearings, stairs and planted forest masses. Main route approximately78units/~20sec before detours; measure actual route lengths in QA.

## 3. ผังภาพรวมและ terrain
```text
N ↑       ridge canopy          summit academy / altar
           [Z2, level2]      south facade + open forecourt
                         S2 (x32..38,y22..30)
west forest   [Z1 ritual court, level1] —— east lookout (closed)
                         S1 (x27..33,y38..46)
W entry —— [Z0 foothill rest,level0] —— spring pool / stream → S outlet
```
Z2 asymmetric shoulder polygon within x18..56/y5..26; Z1 broader wooded apron within x8..64/y8..42; Z0 valley below42. Regions ordered highest first. Cliff boundaries are continuous sampled boundaries from identical elevation geometry, not scattered rock substitution. Lower stairs2landings(30,46)/(30,38), upper landings(35,30)/(35,22), width6. Side walls forbidden by existing elevationPassage. Stream/pool at level0 eastx56..70,y49..64; never under a building or stair.

## 4. Navigation graph / entrances
entry(4,54)→rest(18,54)→lower-foot(30,46)→lower-top(30,38)→court(38,35)→upper-foot(35,30)→upper-top(35,22)→academy-door(38,18).
Side circuit court→lookout(60,35), rest→spring(51,53)→rest; optional ruined-shrine forecourt(19,35). Road widths3–4; stairs6. Reciprocal entry reserved but no active warp this stage. Future exits closed markers only. All required locations reachable both directions with shared collision/elevation movement. Cliff crossing outside stairs forbidden.

## 5. Required IDs / buildings
seal-academy: temple asset anchor38,16; base footprint8×4 at level2; door38,18 → academy-door; frontcourt x31..45/y18..22 kept clear. seal-altar: sacred-totem anchor49,18, footprint2×1; approach49,20, off academy sightline. foothill-lodge: thatched-lodge at18,49, footprint6×3; approach18,52, faces rest. ritual-rest: hut at13,35, footprint3×2; approach13,37. old-shrine: ruined-shrine at19,32, footprint3×2; approach19,35. spring-pool, west-entry, lower-stairs, upper-stairs, middle-court, east-lookout are required stable IDs. Entrances have2unit clear forecourt; no roof/trees across stairs. Decorative lanterns frame landings, no blocking footprints. Placement failure report mandatory; no silent skip. Actual object inventory/support/navigation checked separately.

## 6. Water / cliff / vegetation
Pool center62,54 radius5; outlet polyline62,57→66,61→67,64 radius2; water at0 only and baked half-unit water blockers. No fake waterfall to an elevated pool. Ground mist at spring and low western hollow; avoid stairs/courts/entrances. Forest polygons west shoulder/north ridge/east slope; explicit authored tree instances form canopy edges, with clearing masks around the route. No grid/hash scatter as final composition. Ground seeded texture variation only. Ridges remain prototype cobblestone retaining faces until an approved modular mountain kit replaces them.

## 7. Asset kit / seams
Reuse manifest temple, ruined-shrine, village lodge/hut/totem, shade-tree, bamboo, mossy-rock, garden-understory, talisman-lantern plus current grass/dirt/road/water Wang sets and premium weighted variants. Native anchors/scales preserved. Landscape/new cliff kit, distinct mountain tree palette and new25–35 monster art are missing, explicitly deferred; no generation queued. Preview is actual renderer terrain, not a single backdrop. Check dirt/grass/stone/water convex and concave transitions, stair cutouts and water support. No biome balance tuning.

## 8. Layer / runtime mapping
Independent review JSON typed as MapDefinition; logical elevation/shared stepMovement are authority for local walking. Existing Phaser preloadMapAssets/renderMap, WaterLayer and pixel-nearest assets; special boundary renderer opt-in to this map ID only. React owns preview controls/diagnostics; ResizeObserver and scene listeners cleaned up. No global camera/session recreation on resize. No Colyseus room this stage.

## 9. Gameplay locations
West marsh connection and east global branches reserved concept locations, no active portals. Monster/NPC/quest definitions deferred until layout review. Player marker is a local movement tester, not a live character. Planned spawn/camps may be marked as proposals only. World atlas remains5live/25planned.

## 10. Validation
Required inventory/failed placements; full-footprint elevation/water support; shared BFS from spawn to all entrances/landings; forbidden cliff movement; manual traversal of main climb and return; desktop/portrait/landscape and labels-off overview plus close view; typecheck/build. Record evidence/report after implementation. Technical tests are not visual approval. Human review pending; next stage is live marsh reciprocal portal+authoritative occupants after layout review, not automatic30-map rollout.


### Revision01 evidence
validation.json:5 required structures present,74 unique objects,13 reachable locations,18,008 reachable samples,0 failed footprint/support placements. Main route simulated both climb and return through unchanged shared stepMovement; off-stair cliff shortcut rejected. Client canonical JSONs compare equal. Full typecheck/build pass after dynamic no-SSR boundary repair. Browser screenshots overview/summit/portrait/landscape; rendered water coverage29,028 native mask pixels. Local focus tool verified level2 at(38,18), position/level preserved across390×844 and844×390 resizing; body horizontal overflowfalse. Existing five-map registry unchanged. Browser tour progressed along initial approach but a complete real-time climb/return was not observed; rendering was background-throttled at times, so FPS display is not an acceptance benchmark. Physical touch and human visual approval pending. Reused tropical canopy and Phase C cliff/stair candidates; new biome-specific final kit remains missing.


## Revision02 / user-authorized live adoption and new kit
User explicitly requests edge travel from monsoon-marsh, NPCs, monsters25–35, live stair testing and replacement stair/cliff art; attached written brief preserved in art-02/user-brief.txt.74×64 dimensions, major buildings/pool/forest anchors retained. Summit and middle front polygons now have irregular shoulder bends around fixed stair cutouts. Each existing6×8 stair transition uses middleLanding=.25: two3-unit flights separated by2-unit flat landing, same authoritative continuous elevation function. Main valley path gets gentle bends between fixed nodes. New original imagegen atlas has two cliff faces/cap/landing/three single step variants/abutment; source untouched, explicit native-frame crops/nearest sampling, no static backdrop. Prompt/source SHA/provenance preserved. All labels stay real DOM/SVG.

West mountain marsh-gate atx0..2/y53.4..54.6 returns to added marsh mountain-gate atx86..88/y55.4..56.6; arrivals4,54 and83,56 outside triggers. Marsh west gate/objects/spawn regions retained; new hand-authored east path overlays wet terrain with shared blockers rebaked from exact paint. No invisible pass-through water. Reversible travel uses original room tickets/profile authority.

NPCs: mountain-healer(20,53), existing healer service; mountain-keeper(41,20), guide; mountain-watch(57,35), guard. All same-level supported approaches, no quest/trainer/shop grants invented. Camps: foothill-wisps30,51/16×9 (4 passiveLv25); ridge-shadows47,32/8×7 (4Lv30); summit-guardians23,12/7×8 (3Lv35). New independent monster definitions, existing animated silhouettes explicitly reused; original species/stats unchanged. Stats/EXP/drop tuning provisional. Entry/healer/stairs/shrine forecourt safe; monsters use elevationPassage and projected rendering with logical targeting coordinates. Server's old lab-only skill prohibition now exempts this authorized live map. City citizen simulation excluded from mountain.

World readiness6live/24planned; only real reciprocal marsh link becomes gold/live. Other-country edges remain planned/closed. Live validation, actual screenshots and remaining art/balance limitations recorded below after implementation.


## Live adoption03 — authorized2026-10-15 (before placement)
Adopt reviewed Indonesian geometry/art and natural native shores. Add reciprocal boundary chain: sanctuary south (8,63) ↔ Ashwind west(1,54); Ashwind east(89,16) ↔ Ember west(1,64); Ember east(95,47) ↔ Estuary west(1,20). Arrivals outside triggers: sanctuary8,60; Ashwind4,54/86,16; Ember4,64/92,47; Estuary4,20. Extend only short dry approaches; sanctuary lower branch4,54→6,55→6,60→8,63 avoids elevated terraces. Preserve every old portal/resident/required landmark.
NPC IDs required: ash-healer/ash-keeper/ash-watch, ember-healer/ember-keeper/ember-watch, estuary-healer/estuary-keeper/estuary-watch. Existing owned service/monster sprites reused (regional outfit/unique monster art remains future work). Three explicitly bounded camps per new map,9 inhabitants each; provisional ranges Ashwind50–65,Ember60–75,Estuary55–70 (new proposal, no old species rebalance). Safe entrances, services and main routes excluded from spawn samples. No new generated assets.
Required map object IDs remain those in plan.json. Native coast geometry/wet blockers/source atlas preserved. NPC approaches, camp samples, return paths, real server tickets/no bounce/profile/observer/combat and actual game desktop/mobile must be verified. Failed placements must be explicit and corrected before delivery. Atlas retains original30 nodes plus additional estuary (31 total), no nation/node deleted.

Live03 visual failure: initial south gate8,63/arrival8,60 was hidden by retained west canopy in the actual game. Reject that gate position, preserve canopy. Final south gate42,63/arrival42,60 uses clear lower apron connected from existing40,56 via42,59→42,63. No old objects/blockers/terraces/portals move.
