# Worn path edges02



## Japanese worn path edges02 — 2026-10-15

User rejects uniformly straight/rounded path edges. Japan ground binding now follows connected dry-material contours with five hand-cut native-pixel wear brushes at unequal spacing. Existing painted moss/snow/soil/stone pixels supply all visible colors; no generated art, noise texture, gradient, alpha blur or source PNG edits. Intruding turf/snow lips and scattered soil/paving chips affect only a narrow visual border; center strips and water cells stay exact. All four Japanese maps share the change; other nations and authoritative map/layout/collision/portals/NPCs/residents are unchanged. Desktop actual-game before/after and mobile evidence: docs/design/maps/japan-three/edges02. Pure mask tests cover deterministic output, input immutability, exact water and center strips, plus both erosion and expansion. Gameplay geometry tests and build/typecheck run separately; visual approval remains user-owned.

Actual game screenshots use the same overview camera; moving actors, snowfall and HUD vitals differ with capture time. Native keyboard walked snow4,54→16,54→16,61→36,61 after the change. This refines material edges, not the authored route graph or water bank shapes. Native brush catalog lives in weathered-ground.ts and only selects owned painted source materials.

Verified staged-snapshot production build/typecheck; material wear fixture (both edge directions, deterministic/input unchanged/water/core intact); all4 Japanese live geometry/NPC/main+side route tests; original Indonesia quilt fingerprint/native shoreline regressions passed. Actual snow game desktop before/after,390×844 portrait and844×390 landscape checked: no document overflow, same map and36,61 retained. Cedar local review gate also inspected at gameplay scale. No authoritative source or asset PNG changed; no new generation.
