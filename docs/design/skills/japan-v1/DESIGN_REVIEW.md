# Japan (Onmyoji v2 / Miko v2) — production result 2026-10-11

User approved the full set in one go (cap 260). Spend ≈ 237 (LEDGER.md; seeds estimated, animations from charged
lines). Visual approval stays with the user.

## Made
- Kit (7): element residue marks (sliced into kit-mark-wood/fire/earth/metal/water, pulsed in code), held talisman
  (tinted per element), ofuda burst (Invoke flash on every spell), paper swallow, Gogyō ring (ring of five nodes, no
  star), blessing glint, gohei sweep.
- Effects (16): Bonfire Ward, Ash Barrier, Kongō Talisman, Mirror Pond, Root Fissure, Mudslide, Steam Burst, Leaf
  Blade Storm, shikigami summon flash (tinted ×5 + Ascension), Gogyō Ring Seal, Kagura, Suzu Bell, Cleansing Rain
  (also Spring Rain, tinted green), Resurrection, Kotodama, Sun Pillar.
- Icons: 45 (15 Onmyoji tree, 15 invoked spells for the hotbar, 15 Miko).
- Code: `skills-japan.ts` (30 tree skills + 15 invoked spells, `invokedSpell()` pair → spell, Gogyō cycles,
  `JAPAN_VFX_LAYERS` / `JAPAN_VFX_MAIN` with kit main art + runtime tint), test `skills-japan-test.mjs`, lab tabs
  (Onmyoji, invoked spells with a five-element wheel + Invoke, Miko), Japan washi pale ramp, `publish_jp_vfx.sh`.

## QA notes (free fixes possible, or user decision)
1. Bonfire Ward's fox-fire flames have small fox faces that read slightly cute (language: eerie, not cute).
2. Kongō Talisman came out as an upright hoop-shaped shell, not a closed oval shell.
3. Sun Pillar: a paper crane inside the pillar reads like a small star in some frames (bible: no star shapes).
4. Cleansing Rain is sparse at native size (enlarged 1.8× in code).
5. A network outage failed 10 animation submissions; no job was created for 9 (nothing charged), Steam Burst resumed.

Evidence: `kit-seeds.png`, `kit-animated.png`, `effect-seeds-1.png`, `effect-seeds-2.png`, `effects-animated-1.png`,
`effects-animated-2.png`, `bonfire-ward-in-lab.jpg`, `steam-burst-in-lab.jpg`.

## QA fixes (user 2026-10-11: "fix the 4 points with free code")
1. Bonfire Ward: cream fox bodies with faces → flame colours, enclosed eye specks filled (`post_thai_vfx.mjs --fox-to-flame`); fox-fire keeps its silhouette, no faces.
2. Kongō Talisman: the hoop is drawn twice, mirrored, 30 px apart (main `offsetX`, layer `flipX`) so two plates close a shell around the ally; the mirrored half is slightly translucent so the ally shows.
3. Sun Pillar: paper shapes inside the light column (the star-like crane) take the column's pillar colour (`--clean-pillar`).
4. Cleansing Rain and Spring Rain: two offset, mirrored copies of the rain thicken it (layers with `offsetX`/`flipX`, Spring Rain tinted green).
Lab layers now support `offsetX`, `flipX` and `tint`. Evidence: `qa-fixed.png`, `kongo-shell-fixed-in-lab.png`, `spring-rain-fixed-in-lab.png`.
