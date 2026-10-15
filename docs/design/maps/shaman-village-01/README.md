# Shaman Village — first playable reference revision

2026-10-14. Working revision for visual review, **not visually approved or a claim that the full reference has been matched**.

## What changed

The actual `umbral-capital` map registry now uses `umbral-village.ts`. The original city source and its comments remain intact. Same map ID, name, 80×60 bounds, spawn, eleven NPC definitions/services, safe zone, portals/arrival and water blockers. The forest map, monster definitions, quests, skills and persistence are unchanged. The existing 8793 four-map review is a separate local proposal and is not the playable map registry.

Village land routes are authored as irregular dirt/stone polylines and a ritual clearing, with training/market/elder/dwelling zones. Ornate main buildings become thatched huts; five isolated new asset families include a sacred rooted skull tree, small hut, communal lodge, timber ritual gateway and dark tropical tree. Canopy positions are authored by enclosure rather than seeded scatter. Existing pots, bamboo, ferns, moss rocks, stalls, ritual textiles and fires are reused. The exact user reference and full request are saved here.

Illustrated terrain-quality 01 now runs by default for this village; other maps retain their previous renderer unless explicitly reviewed with the existing development flag. Weighted tile interiors remain seed 31414 with shared transition rims and nearest filtering. Ground dressing is visual only. Phaser retains foot-anchor/Y-depth rendering and caches ground/detail textures; Colyseus uses the same shared layout collision for movement and services. Warm light strengths and village darkness were reduced after rendered inspection; no blanket fog added to an inhabited plaza.

## Open in game

- Play: `http://localhost:3000/` → existing guest/sign-in entry; WASD/arrows, existing NPC talk/service controls, original south exit to forest.
- Whole-map composition: `http://localhost:3000/?villageReview=overview`. Development camera framing only; player stays at authoritative coordinates.
- Before/after board: `http://localhost:3000/village-review.html` once evidence images have been published.

## Evidence and verification

`node tools/map/test-village.mjs`: same gameplay fields, fifteen reachable service/bridge/pier/portal destinations, reciprocal forest portal, five unblocked citizen routes, all asset records/native dimensions/alpha. Distances and times are in `validation.json`; routes are measured with shared point collision at 0.125-unit edge samples. This does not imply building-roof clearance or visual approval.

`node tools/map/test-terrain-quality.mjs`: stable weighted variation, distribution, shared rims, original tileset PNG hashes and original manifest records preserved (additive village records excluded from the old catalogue hash). `pnpm typecheck` and `pnpm build` pass. Live existing NPC network test passes range/role checks, heal/save, buy/sell, two-client state and citizens. Existing zone network test passes portal travel/ticket/profile handling, no portal loop, monster attacks, skill damage, EXP/level-up, respawn and return.

Screenshots are actual game renders. `before-game.png` was captured before registry change; `after-game.png` uses the same spawn/framing. Overview is additional evidence, not a same-scale before comparison. Browser desktop/portrait/landscape checks and observed console/performance are recorded separately in `visual-review.json`. Physical phone/GPU performance is not verified.

## Remaining fidelity gaps and actionable production work

1. **Natural waterside composition:** original narrow rectangular canals and old collision bridge gaps remain. Design a connected southwest pond/bank and pier with terrain/blocking/bridge abutments together; update the layout brief and verify all service/citizen/portal routes. Do not replace water visuals alone while leaving misleading collision.
2. **Hut variety:** two roof silhouettes currently serve multiple buildings. Add a lean-to stall and compact waterside stilt hut from the same reference, including measured entrances and base footprints. Avoid indiscriminate generations before the direction is reviewed.
3. **Ritual enclosure and low vegetation:** old fences/incense/ritual posts are mixed with the new kit. A rough timber-and-bone fence corner/straight kit and connected fern/root understory need a dedicated authored kit to match the reference's finer small details.
4. **Occlusion and pixel texture:** normal camera sees only the lower part of the large tree near spawn; inspect the elder approach behind/right of canopy in actual walking review. Existing small repeated grass clumps remain more conspicuous than the reference's continuous painted undergrowth. A quiet contiguous floor texture and authored edge vegetation should be assessed together.
5. **Other three reference panels:** Sacred Forest maps to existing `whispering-spiritwood` combat role; Cursed Swamp and Ancient Ruins need explicit identity/transition/spawn/quest briefs before registration. Existing numbered paddy/mangrove/marsh leveling proposals are not automatically these four reference locations. Their development follows the user's first-village review stage.

These are visible outstanding items, not silently replaced with generic geometry. New files are candidates and prompts/source PNGs remain in `raw/`; `asset-receipt.json` records hashes and native anchors. Built-in imagegen used five calls, no local GPU queue and no PixelLab purchase. Re-export: `node tools/map/build-village-assets.mjs`, then rebuild shared and run the village/terrain checks.
