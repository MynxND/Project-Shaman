# Koschei / Maiyarap — designed ground warnings

2026-10-16. Client presentation revision; user visual acceptance remains pending.

## Audit and changes
Both adapters previously drew a plain gold contour and a central 10px square.
Maiyarap had not received the bespoke warning treatment used by Shuten.
Koschei now has cold silver/bone chain stitching, needle teeth and a chained
mortality seal. Maiyarap has antique gold/emerald interlacing and a four-petal
lotus dream seal. These are original game motifs, not documented historical seals.
A fixed outer contour identifies the full danger area from the first warning;
an inset perimeter trace advances from authoritative warnAt/startsAt timestamps.
No animated resizing of hit boundaries, generic neon bloom or organic Graphics VFX.
Existing authored PNG attack effects remain intact. No missing new artwork.

`ritual-telegraph.ts` is a shared presentation helper with two distinct profiles.
It decorates padded pixel-space footprints, clips ornamental segments inside the
shape, preserves wide-sector safe wedges, and avoids central stamps on annuli or
finales. Existing court masks/depth remain. It adds no GameObjects, textures,
tweens, listeners or particles to either existing 24-view pool.
Maiyarap additionally uses thin annulus warning contours to remove broad-stroke
WebGL tessellation seams and shows the earliest coincident pending tell only.
Repeated hits and all active waves remain unchanged. Server/shared/schema files
were not modified by this revision.

## Evidence
- [Koschei before](koschei-before.png) / [after](koschei-after.png): same south
  Throne clip, requested 900ms, 1.5 zoom, 1103x884 browser viewport.
- [Maiyarap before](maiyarap-before.png) / [after](maiyarap-after.png): same south
  Sleep clip, requested 900ms, 1.5 zoom, same viewport. Old scene was intentionally
  captured before reload; preview HUD timing statistics can lag a seek by one
  UI update. Canvas countdown/pose correspond to the requested warning frame.
- [Koschei real room](koschei-real-game.png): spear warning with guest/player.
- [Maiyarap real room](maiyarap-real-game.png): sleep warning with guest/player.
- [Ring](koschei-ring.png), [ultimate refuge](koschei-ultimate.png),
  [Maiyarap sectors](maiyarap-sector.png): representative geometry review.
- [Portrait390x844](maiyarap-portrait.png),
  [landscape844x390](maiyarap-landscape.png): actual Maiyarap room resize with
  the same guest session. QA panel is deliberately open and occupies screen
  space; this is not a claim that the developer panel is mobile game UI.

Real-room casts used existing DEV guest prepare/skill controls; no continuous
victory or fresh all-skill dodge sweep is claimed. Authoritative movement/damage
regressions below complement the representative in-game visual inspection.
No physical phone, GPU trace or high-latency multiplayer measurement this revision.

## Verification
- pnpm typecheck: PASS (all workspace packages).
- pnpm build: PASS (40 client routes plus server/shared/schema).
- node tools/bosses/ritual-telegraph-test.mjs: PASS768 geometry/render cases,
  209546 bounded ornamental line segments;6 shapes,8 facings,90/270 degree
  sectors,2 themes,3 windup times. This is a geometry check, not visual approval.
- Koschei behavior: PASS876,88 actual CombatSystem clips.
- Maiyarap behavior: PASS620,88 actual CombatSystem clips.
- Browser WebGL,1103x884, paused representative4-view court warnings:
  adapter CPU p95 up to1.5ms; RAF interval p95 16.68ms,rolling1800 samples.
  Includes seek/clip switching; CPU is the VFX adapter only, not GPU or a
  sustained combat benchmark. Existing views24 and particles64 caps unchanged.
- Inspected disk, capsule spear, sector, ring and ultimate refuge presentations.
  New ornament geometry tested for8 directions; this revision does not claim a
  fresh visual review of every skill/direction combination in both real rooms.

Preview: /boss-vfx/koschei and /boss-vfx/maiyarap. Both use the live-room adapter.
Future bosses should supply their own motif profile rather than copying these
national symbols or changing combat geometry to fit art.
