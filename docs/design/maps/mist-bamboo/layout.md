# mist-bamboo — Map Design Brief & Layout

## 1. สถานะและขอบเขต
Revision01 / 2026-10-14 / review candidate. User requests the next roadmap map as preview before live integration. Phase2 China: หุบไผ่หมอกคราม, proposed Lv20–35. Existing WORLD-30 links mountain-spirit-sanctuary → mist-bamboo → cloud-tea-slopes. Geography and inhabitants remain proposals. No live registry, portal or server edits; six existing playable maps stay intact. Generation budget/use:0; reuse owned PixelLab bamboo, terrain, ritual props and existing creature art. No new map concept generation required for this reusable-kit review.

## 2. ประสบการณ์และสเกล
82×62 world units,32px/unit; native terrain16px at2×, WALK_SPEED4. A low bamboo valley differs from the sanctuary's stacked terraces. Walk from west shelter through a central ford causeway to the ritual clearing, then wind northeast toward the tea exit. Primary landmark: weathered seal totem in open clearing; secondary: spring grotto. No torii, copied sacred text or western runes. Main route 82.48 units/20.62 seconds, measured accurately in validation. Desktop/portrait/landscape review uses real renderer and shared movement.

## 3. ผังภาพรวมและ terrain
North ↑. Coordinates define composition, not a scaled previous layout.

```text
82×62; each coordinate pair is in world units
 NW bamboo(12,12)       spring(39,9)       NE thicket(69,12)
       watcher camp(23,17)    stream↓       tea exit(80,17)
 west entrance(2,45)→shelter(13,44)→ford(39,35)→seal(52,34)↗
    SW bamboo(13,57)    stream↓    stalker camp(58,49)
                       outlet(43,62)       SE bamboo(74,55)
```

Regions: grass valley level0; circle spring center39,10 radius6; winding stream39,10→35,23→40,35→36,47→43,62 radius2.2, all level0. Ford is a visible stone causeway at x35–45/y35 width5, not a raised wooden bridge. No waterfall or elevation claim. Paths dirt, causeway stone; water/grass/dirt/stone transitions use existing Wang assets.

Zones: west rest area x3..19/y39..49; watcher clearing x18..29/y13..24; central landmark x47..58/y29..38; south combat x52..66/y43..54; eastern combat x62..74/y24..34; tea receiving apron x74..82/y13..22. Approaches and active combat clearings are kept free of trunks. Bamboo cluster positions are individually authored around these masks, no grid/hash scatter.

## 4. Navigation graph และทางเข้า
Main nodes: west2,45 → shelter13,44 → west-bank28,39 → ford39,35 → seal52,34 → east-turn64,22 → tea80,17. All two-way, widths4–5; side route shelter→watcher23,20; seal→stalker58,49; east-turn→guardian69,30; seal→spring inspection48,14. Future arrivals4,45 and78,17 are outside boundary-trigger proposals. Nothing warps in this review. Safe margins at west entry/shelter/east receiving apron prevent future spawn overlap.

## 5. รายการอาคารและสถานที่จำเป็น
Required stable object IDs: west-shelter (owned herbalist hut, anchor13,42, footprint7×5, entrance13,44); valley-seal (owned sacred totem,52,31, footprint4×3, approach52,34); spring-marker (stone ritual prop48,12, footprint2×2, approach48,14); tea-waypost (lamp78,14 decorative-only, approach78,17). Main landmark has a six-unit clear forecourt; shelter faces south toward west trail. Bamboo rear canopy must not hide these approaches. Full roof bounds are drawn from manifest dimensions/anchors at native2×. Failed placement list starts empty; validation must report every required ID and correct failures explicitly.

## 6. น้ำ หน้าผา และพืชพรรณ
Spring→winding stream→south outlet; stone causeway interrupts water only inside exact walking corridor. Wet blockers derived from the same material paint. No stairs/cliffs needed for this valley; rock outcrops are props, not implied elevation boundaries. Five asymmetric bamboo groves form north rim, western screen and southern/eastern edges. Low ground detail is separate from collision. Mist only at spring hollow and lower outlet banks; main route/safe areas stay readable. Reuse existing environmental mist, no new skill or VFX art.

## 7. Asset kit และรอยต่อ
Bamboo47×78 anchor24,76; all objects use owned manifest dimensions/anchors at2×, no reshaping sprites. Existing premium grass/dirt/stone variations enabled by the seal prefab; seeded detail only within terrain, no randomized composition. Existing river surface animation, shoreline Wang transitions. Missing: dedicated China valley shelter/unique resident designs; these stay explicitly reused art. Test spring convex shoreline, stream bends/concavity, grass–dirt forks and both causeway abutments.

## 8. Layer และ runtime mapping
Independent JSON MapDefinition; TerrainBase/Transitions → ground/terrain; wet collision → blockers; WorldObjects → objects/footprints; GroundDetail → existing quality renderer; atmosphere → local profile; ReviewGuides → toggle labels/camp overlays. No Tiled importer. React controls, Phaser world, shared stepMovement/isBlocked; no Colyseus connection. Resize preserves scene/local position and listeners/observer are cleaned up.

## 9. Gameplay locations ตามขอบเขตงาน
Proposed boundary exits west mountain sanctuary/east cloud tea slopes, displayed as preview-only locations. Monster planning: watcher clearing Lv20–25/4, lower grove Lv26–30/4, east ridge Lv31–35/3. Show existing leaf-wisp/shadow-macaque/clay-guardian idle art for sizing only; no attack, rewards or invented server services. Three camps avoid safe entry/exit/forecourt zones and water. No live NPC required in this stage.

## 10. การตรวจและหลักฐาน
Required IDs, footprint wet support, spawn→all locations BFS, route round-trip, camp walkability/water exclusion, preview-source equality, typecheck/build and desktop/phone screenshots pending. Multiplayer is outside authorized preview scope. Technical results are not visual approval. Next stage requires user's review before live integration; current task ends with functioning preview.

Placement correction01: spring-marker at46,12 touched the spring shoreline during full-footprint validation; moved to48,12, its approach/branch to48,14. No required ID skipped. Initial label-off overview showed groves too sparse; individually authored overlapping thickets now reinforce grove edges while retaining all clearances.

Visual correction02: close camera exposed the provisional stone material as an unsupported Wang pair. Changed only this preview to the existing road terrain token, which selects the actual premium cobblestone tiles. No procedural texture or live-map change.

Occlusion correction03: close camera revealed springScreen bamboo48,18 covering the tester at the shrine approach48,14. Relocated that specific trunk to55,24 off the access branch. All required IDs remain.

Final validation: four required IDs/148 objects/nine locations/three camps/11 preview seeds,18,383 reachable samples, no remaining failed placements; main route both directions/typecheck/build pass. Browser local route at least one full round-trip; desktop,390×844 portrait,844×390 landscape inspected, phone overflow false and position retained. Evidence screens; physical touch and user visual approval open. Live integration deferred as requested.

## Revision02 / live adoption authorized — 2026-10-15
User authorizes reciprocal boundary travel and real monsters20–35 with existing water/mist. Preserve all valley terrain/148 objects/three camps. West sanctuary-gate area0,44.4/2×1.2, safe arrival4,45; return to sanctuary bamboo-gate at east edge72,42.4/2×1.2, safe arrival70,43. Tea exit remains planned/inactive. No new NPC/quest or artwork in this stage. Camps use independent provisional definitions bamboo-wisp20, bamboo-shadow28, bamboo-guardian35 with existing animation silhouettes. Three existing area/count plans become authoritative spawn regions; safe west arrival and seal forecourt remain.

Mountain link follows a new low foothill branch from51,53→55,48→61,45→66,43→73,43; it skirts the spring and stays level0 rather than crossing the middle terrace cliff. Existing west marsh gate, stairs, NPCs, monster regions, map size and major landmarks stay fixed. One nonblocking foreground tree east-canopy-5 at68,44 moves to69,38 to keep the new approach readable. Corridor and boundary lamps are explicit additions, not whole-layout scaling. Required entrance checks extend through this branch. Old source snapshots retained under revision01 before adoption. Live browser/network/old-world regressions pending; technical checks do not approve art/balance.

Revision02 final: authorized live registration, snapshot-preserved geography/old mountain features,11 residents20/28/35, reciprocal tickets/profile/no bounce/causeway both ways/observer/combat/EXP pass. Native browser reaches4,45 and returns70,43; water collision checked. Typecheck/build/shared/old zone and atlas tests pass. Actual phone browser390×844/844×390 checked; physical touch/final balance and art acceptance open.
