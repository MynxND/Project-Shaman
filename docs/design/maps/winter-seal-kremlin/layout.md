# ป้อมไม้ผนึกเหมันต์ — winter-seal-kremlin layout brief

## 1. Status and authorization
Draft2026-10-15, MAP_DESIGN_TEMPLATE.md / SHAMAN_MAP_DESIGN_STANDARD.md. USER asks Ireland live adoption and then Russia. Russia is3 local previews before any server integration; preserve21live/35atlas after Ireland adoption. First2IDs existing planned nodes, third location/name/levels provisional. Russia skill catalog exists; player outfits not asserted.

## 2. Experience / scale
96×82 world units, U32/native16px/unit/scale2/walk4units/s. Main lane4.6units, sides4units, large hall court12units with clear front. North ↑ rectangular elevated-three-quarter RO-style world, upright facades. No full-layout scaling or grid/hash scatter. Measure route lengths after authored graybox. Desktop/player camera and portrait/landscape required.

## 3. Terrain / zones
Snow-covered timber fortress settlement with original Russian-inspired tiered ceremonial hall roof silhouette, solid side stockades, low log cottages, birch court and southeast open-water basin. Iconic region landmark is the fortress hall, not a real church or site replica.
Authored forest screens and glades, separate rest/ritual courts, route forks and proposed encounter margins. Scale/zone polygons in map.json; masks follow the same semantic native terrain as collision. Snow banks are land, all visible open water remains blocked; no walkable frozen-lake illusion. Flat level0, no fake climbable mountains/elevation.

## 4. Connectivity
west4,63 → stockade court28,56 → fortress forecourt48,36 → east street72,28 → east92,21. All side tours bidirectional to service fronts, shoreline viewpoints and encounter fields. No bridge required; roads stay on dry land. Entrances are proposed future edge links, not working warps or new server nodes. Widths/clearance accommodate actors around solid bases.

## 5. Required locations / buildings
Required stable IDs: winter-hall, west-izba, east-store, watch-bell. Each bottom-center anchor has separate base footprint, source crop/roof bounds, SOUTH front approach and clear forecourt; decorative-only interiors. Stockade segments flank but never close the streets. Report failed ID/support/route candidates and repairs explicitly, no silent pruning.

## 6. Water / vegetation / atmosphere
Author curved coves/stream bends, not rectangular ponds or noise borders. Shared native water and weathered bank ecology; spruce/birch saplings/rock details independent of blockers. Dense explicit spruce masses for forest, thinned bare birch near settlement. Local mist over low water only, clear main approaches. Bounded existing-style cosmetic snow for frost/fortress previews; no gameplay weather effect. Taiga is a different thaw-ground material, not a snow-map recolor.

## 7. Art kit / references
One original Russian-inspired winter atlas proposed: timber tiered shaman hall, carved log izba, bell shelter; snow spruce/white birch/amber beacon; stockade, frost rock, log store; snowy moss/slush gravel/packed snow-stone swatches. Additional thaw-peat swatch is missing at brief creation; reuse a suitable owned dirt source or isolate a calm snow-free region of the new source only after visual inspection, not claim a new painted texture exists.
General architecture text reading: Kizhi museum architecture catalog https://site.kizhi.karelia.ru/architecture/pages/about.html and Novgorod Vitoslavlitsy https://novgorodmuseum.ru/muzei/vitoslavlitsy . Original fictional composite, no site replica, crosses, sacred scripts or borrowed training/reference pixels. PixelLab0/Comfy8188 unavailable; imagegen fallback, original alpha/prompt/hash preserved. Existing Nordic/Japanese tree/building sprites must not be substituted as Russian kit.

## 8. Runtime layers
Independent JSON/React gallery/Phaser preview. Native terrain → seeded quilt of painted materials → hand-cut edge wear → WaterLayer / regional bank ecology → y-sorted props / contact shadow → localized mist and bounded weather → local actor / debug names. Resize preserves scene/position; clean events/textures on shutdown. Collision is independent shared isBlocked/stepMovement, no server authority claim.

## 9. Gameplay proposals
No NPC/monster spawn/reward/live portal in review. Mark service/encounter clearings only; ranges60–75/70–85/75–90 provisional and earlier frost67–75proposal remains historical. New lore/geography unapproved. No skill/VFX policy changes.

## 10. Verification
Required IDs/full support, no wet footprints, every destination BFS, main+side roundtrips, water coverage/blocking, immutable ecology, source hash/crop bounds, desktop/portrait/landscape and label-off landmark/entrance/field screenshots, build/typecheck and existing-country regressions. Not run at brief creation, user visual review pending.


## 11. Measured placement and route audit — 2026-10-15

North ↑. Canonical scaled coordinates/zone polygons are in map.json; graph and all side links are in plan.json. This is a flat continuous rectangle, not an isometric diorama. Main lane4.6units; side approaches4units; no stairs or bridge. Every listed location reaches spawn in both directions.

| Edge | World coordinates | Length / nominal walk seconds | Direction |
| --- | --- | --- | --- |
| main | 4,63 → 20,62 → 28,56 → 36,48 → 48,36 → 61,33 → 72,28 → 92,21 | 100.9u / 25.2s | two-way |
| side-1 | 28,56 → 23,45 | 12.1u / 3.0s | two-way |
| side-2 | 48,36 → 48,33 | 3.0u / 0.8s | two-way |
| side-3 | 72,28 → 74,25 | 3.6u / 0.9s | two-way |
| side-4 | 36,48 → 42,58 → 55,66 | 26.9u / 6.7s | two-way |
| side-5 | 61,33 → 68,42 → 78,48 | 23.1u / 5.8s | two-way |

| Required ID | Asset / anchor | Native display width / source crop | Base footprint | South approach |
| --- | --- | --- | --- | --- |
| winter-hall | hall / 48,25 | 230px / 360×390px | 12×4u | hall 48,33 |
| west-izba | izba / 23,39 | 150px / 302×340px | 7×3u | izba 23,45 |
| east-store | store / 74,20 | 120px / 278×281px | 6×3u | store 74,25 |
| watch-bell | bell / 78,42 | 74px / 225×390px | 3×2u | bell 78,48 |

Roof/source bounds are original atlas manual crops; anchors bottom-center, world display2×native. Interiors decorative-only. South forecourts connect via explicit branch edges; all required bases fully supported at quarter-unit samples, clear of wet samples. Ground/road/slush/snow-water joins share native terrain semantics. Bank grass/rocks/saplings cosmetic; landmarks and entrances never seeded. Seed711/712/713 only quilt owned painted swatches, never compose layouts.

Failed candidate: winter-lamp-2 at55,36 blocked reverse main route. Moved to56,38, same ID retained; rerun passes. No unresolved failed placements.

Generation resolved the originally missing peat and unsnowed pine with dedicated atlas crops. Full source alpha remains unchanged; no recolor of Nordic or Japanese assets. Overviews/landmark/player screenshots and mobile evidence are in ../russia-three/screens/. Provisional encounters/services remain empty, not hidden live functionality. Final user visual review pending.


## Live adoption brief — user2026-10-15

User explicitly authorizes Russia3 into actual game, reciprocal boundary walking, NPCs/residents and exact reviewed water/mist/snow. Existing world objects, blockers, material masks, required IDs, source alpha, art scale and prior gates stay intact. No new asset generation or layout scaling. New features are additive dry boundary stubs, safe arrivals,3services/3encounter areas per Russian map. Levels60–75/70–85/75–90 are provisional balance.
West entrance0,62 size2×2; arrival4,63; back to previous Russian next-gate. Retain all required landmark IDs and all south building approaches. Services placed beside existing courts/entry lane, never on main/side centerlines. Camps occupy authored northern glades and southern encounter clearing; safe service/gate buffers excluded by authoritative spawning. Every new destination/service front, all original route roundtrips and wet blocking must pass before delivery. Failed candidates recorded explicitly; no silent removal.

### Live placement audit

| Service ID | Position | South service front |
| --- | --- | --- |
| winter-healer | 19,47 | 19,48.5 |
| winter-keeper | 52,32 | 52,33.5 |
| winter-watch | 11,61 | 11,62.5 |

| Encounter ID | Authored area x,y,w,h | Resident kind × count |
| --- | --- | --- |
| winter-camp-1 | 13,8,12,10 | winter-wisp ×3 |
| winter-camp-2 | 64,8,12,10 | winter-shadow ×3 |
| winter-camp-3 | 43,64,12,10 | winter-guardian ×3 |

Every service front/gate reaches spawn; main and all side roundtrips remain clear. Three six-unit service safe buffers and each arrival buffer are independent from cosmetic bank plants. No failed service/gate/encounter candidates in live adoption; earlier preview lamp repair remains recorded. Owned herbalist/elder/guard and wisp/strawling/guardian animations reused explicitly; this adoption does not supply new Russian character/monster artwork.
