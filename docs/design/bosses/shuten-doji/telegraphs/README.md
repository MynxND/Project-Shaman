# Shuten — oni ritual attack warnings

2026-10-16. Replaces the plain pale drafting outlines in the complete boss renderer, in both the real room and `/boss-vfx/shuten`. No authority, combat data, hit deadline, network protocol, map or actor sprite changed.

## Design

Charcoal ink under a muted crimson boundary, inset bronze stitches, short inward curse scars and a warm contact-progress trace. Original oni-mask crests, torn ofuda, woven knots and directional fangs use four cells in `telegraph-marks.svg`. These are hand-authored geometric indicator graphics, not generated organic flames or claimed authentic kanji. They follow the documented Japan exception; no pentagram or Western runic script. Existing authored organic attack flipbooks remain unchanged.

- Cones: face crest and two torn seals within the sector. The 270° sweep keeps its rear safe wedge.
- Circles/ring windups: four ground stamps and an inset ritual border, translucent ground still readable. Active expanding rings remain hollow; no fill claims the safe center is damaging.
- Charge lane: a true capsule perimeter, paper-seal chain and directional fang, with rounded ends instead of the old rectangle plus intersecting full endpoint circles.
- Progress uses `(now-warnAt)/(startsAt-warnAt)`, not a tween or frame count. The outer boundary stays fixed throughout charging. Cancellation fades without release; reduced motion removes the mild alpha pulse.
- Identical simultaneous combo footprints display the earliest pending contact's warning once. Hazards, active impacts and later combo contacts remain independent; no damage or scheduling is suppressed.

`shuten-telegraph.ts` owns native-world contour sampling and indicator drawing. The original view's sprite slots4–7 are reused during warnings and returned to attack art at contact. No additional per-frame GameObjects, particle pool or shader was added. SVG rasterization is512×128; its four128×128 cells use nearest filtering. Graphics are used only for gameplay indicators, not substitute fire/smoke artwork.

## Evidence and checks

`before-cone.png` and `cone-south.png` are the same paused source timeline (~621ms), camera and direction before/after; these are preview captures, not online combat. `live-stomp-warning.png` is a real connected GameRoom capture during windup, with playerHP still4000/4000. No screenshot is repainted. The dedicated gallery distinguishes these sources: `/boss-review/shuten-telegraphs/index.html`.

Inspected eleven skill windups, cone and charge-lane orientation in all eight directions, the rear safe wedge, live Stomp warning, desktop and simulated portrait/landscape layouts. The eleven skill captures use recorded CombatSystem timing, not a new client damage simulation. This is technical/visual inspection, not user art approval or physical-phone GPU benchmarking.

Checks passed: workspace `pnpm typecheck`, two-worker `pnpm build`, `node apps/client/scripts/shuten-test.mjs` (179), and `node apps/client/scripts/shuten-vfx-complete-test.mjs` (139964). Added contour assertions cover all112 source clips: finite positions, unchanged radius, capsule endpoint/width geometry, sector angle/safe wedge, unchanged input cues, warning deduplication, existing pool reuse and cleanup. Local warm preview displayed adapter CPU p95 about0.10–0.20ms and frame p95 about16.68ms during this inspection; these are browser counters, not total CPU/GPU profiling or a universal frame-rate promise.

The compiled non-watching local game server remains in use so shared-package builds do not interrupt its sessions. No reconnect logic was modified for this visual task.

## Follow-up actual-room correction

[Three-phase combat QA](../combat-review/README.md) found that nominal perimeters omitted the existing .3 player-contact allowance. Current warnings now include that unchanged allowance, with real wave-band thickness and moving charge contact markers. The earlier nominal-edge screenshots remain historical evidence.
