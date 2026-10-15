# cloud-tea-slopes — Map Design Brief & Layout

## 1. Status / scope
Revision01 /2026-10-15 / review draft. Next WORLD-30 Phase2 China Lv30–45 after mist-bamboo; user asks to move beyond Thai-looking maps. Preview first; no room/portal/atlas live changes. All seven existing maps stay intact. Architecture from root template/standard; fictional geography not approved lore. One original PixelLab tea-house96×64, quoted5 daily units (plan0/$0, daily5); local ComfyUI8188 unavailable. Other owned art reused. No characters/skills/GPU clips. Country-specific review remains human-owned.

## 2. Experience / scale
86×64 world units /32px/unit /native16px terrain at2× /walk4. Lower west arrival from bamboo leads to tea drying court, irregular crop bands, irrigation ford and east mist lookout. Primary landmark is a low gray-tile Chinese tea hall, not Thai thatch/shrine. Tea bands have short hand-authored contours and breaks, rather than an all-map regular grid. Overcast sage/jade foliage, gray cobbles/rock, small amber lamps, dark crimson ritual ties. No torii/copied sacred scripts. Flat logical terrain in this first review; sloping crop contours are visual landscape, no false stair/elevation claim. Future elevation must use shared rules.

## 3. Terrain / zone blueprint
North↑;86×64; exact source coordinates below, not scaled from bamboo.
```text
 N tea groves(20..60,10..26)         spring(69,11)
 west entry(2,47)→drying court(21,43)→ford(47,36)→lookout(77,23)
                  tea hall(23,38)   stream↓    east exit(84,23)
 south crop bands(16..40,51..60)     outlet(58,64)
```
Zones: entry rest0..12/42..52; tea court16..29/39..47; north leaf camp30..43/13..23; ford43..51/32..40; east camp64..74/29..39; south camp30..43/49..58. Drying court and arrivals safe; three proposed monster zones clear of crop trunks/water. Paths grass↔dirt↔road existing Wang assets. Spring circle69,11/r5 connects stream69,15→62,23→52,30→47,36→51,49→58,64/r1.8. Exact dry cobble ford crosses43..51,y36. No waterfall/raised bridge claim.

## 4. Navigation graph
Main2,47→12,46→21,43→34,43→40,39→47,36→56,34→64,27→77,23→84,23; width4–5, two-way. Branches court→north camp36,20; court→south camp36,54; east turn→east camp69,34; lookout→spring bank74,15. Two edge receiving aprons and ford abutments remain clear. Route time measured in validator. Both exits are local review markers only: west mist-bamboo; east destination unresolved (not a fabricated approved link).

## 5. Required objects / entrances
tea-hall at23,38 footprint6×3, entrance23,41 from court21,43; new tea-house sprite96×64 bottom center/native2×. drying-store at17,39 decorative baskets/low owned prop, no invented service. spring-marker at75,13 mossy-rock footprint1×.5, approach74,15. east-lantern at82,21 nonblocking, approach82,23. Each stable ID required; no silent placement discard. Tea house roof bounds and approach inspected at walking camera.

## 6. Water / vegetation / masks
Single source→stream→south outlet, canonical wet blockers; ford is the sole authored river crossing. Individual tea-bush anchors follow explicit crop contour polylines (agricultural rows are intentional land use), with gaps for harvest access. Bamboo is background windbreak only. No crops in arrivals/court/ford/main route/monster clearings. Mist limited to upper spring and southeast hollow, bypassing approaches. Existing environmental water/mist, not new skill VFX.

## 7. Asset kit / joins
New original Chinese tea hall (PixelLab source/prompt/receipt preserved). Existing owned garden-understory used as low tea crop proxy (not unique tea artwork); bamboo, mossy rocks and lamps reused. Premium ground seeded variation only within material masks. Need grass/dirt fork, grass/road ford and convex/concave shore joins. Missing specialist tea leaves/baskets/custom residents explicitly provisional.

## 8. Layers / runtime
Canonical JSON plus local review plan; ground/terrain paint, wet blockers, objects/footprints, plan guides/camps/fog. Existing MapRenderer/WaterLayer, shared stepMovement. React controls; Phaser world; no Colyseus. Local module preload for tea hall and native anchored sprites; source PNG untouched. Resize retains runtime/position; cleanup listeners/observer.

## 9. Planned gameplay
Three proposed campsLv30–35/36–40/41–45; existing creature idle art demonstrates size, no actual skills/rewards/room authority. West bamboo connection planned only. No NPC service implied by tea hall. Preview focus is a local inspection helper, not warp.

## 10. Evidence
Required IDs/failed placements, full footprint wet support, all entrances BFS and shared route return pending. Desktop/portrait/landscape actual-renderer review, typecheck/build pending. Visual approval distinct from tests. Commit/push after verification; exclude unrelated dirty work.

## Revision02 — live adoption and China identity /2026-10-15
User authorizes live bamboo east-edge→tea west-edge reciprocal travel, residents30–45 and reviewed water/fog. Preserve all world dimensions, routes, wet blockers, entrance locations and footprint geometry. Tea west bamboo-gate area0,46.4/2×1.2, arrival4,47. Bamboo east tea-gate area80,16.4/2×1.2, arrival78,17. Extend bamboo's existing endpoint78,17 to81,17 only. Tea east continuation stays inactive. Three reviewed camp areas become9 authoritative residents at30/38/45, with separate provisional definitions and existing animation art, no original stats overwritten.

User additionally requests distinctive terrain/trees/buildings when entering a nation. China material/foliage palette is now independent of Thai tropical forest: cool slate-soil meadow, pale irregular limestone path, new mountain pine/bamboo/tea bush, gray ceramic roof tea hall and stone seal stele. These are country-specific assets rather than a tint of Thai originals. One imagegen native atlas with isolated source panels and sprites; render native crops/nearest sampling and world-anchored corner transitions. No layout scatter/rescaling. Existing building foundations/hitboxes remain fixed while visual silhouettes change; inspect approach occlusion. Mist/water positions remain the preview's. ComfyUI unavailable and PixelLab daily exhausted; no paid PixelLab retry or GPU work. Required IDs/failed placement and browser/network evidence pending this revision.

Revision02 verified: original74 object placements and all wet blockers retained; no failed placements. Nine destinations and all3 camp areas reachable, reciprocal gate approaches dry, route84.827 units/21.207 seconds. See README/live-network.json and final live-screens for browser evidence; no human visual approval inferred.
