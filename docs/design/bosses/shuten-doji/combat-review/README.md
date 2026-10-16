# Shuten — three-phase actual-room combat review

2026-10-16. Guest-only development arrangement in the **real Colyseus GameRoom**, with authoritative collision, damage, AI, input expiry and movement. Review commands set starting phase, health4000 and position; they do not determine damage or disable collision. This is isolated phase testing, **not a claimed continuous natural-progression victory or approved balance playthrough**.

## Results

The recorded network run contains22 controls: eleven skills × stationary-in-marked-area / walking dodge. All walking paths stay inside the arena and take0 damage. Positive controls: Crusher220, Sake210, Stomp160, Roar45, Sweep180, Legion0 (summons only), Leap295, Head70, Rampage330, Cataclysm120, Ultimate640. Cataclysm's stationary positive control first walks into a fixed fist marker; its unmarked center is correctly safe. Movement uses real `move` packets, normal speed, normalized diagonals and collision; no teleport after casting, invulnerability or damage suppression.

Twenty-nine real boss damage receipts have live damaging hazards within the recorded window. The latest schema clock can precede combat events; validation explicitly allows100ms around snapshot timing. This establishes transport/timeline consistency, not frame-perfect GPU synchronization or arbitrary-network-latency fairness. All damaging windows remain server-owned.

Each phase's normal AI then runs27s. Phase1 uses all four attacks. Phase2 uses sweep, drums/adds, leap and crusher; the intentionally stationary guest dies to continued combat/minions. That is an expected positive control, not proof that phase2 can be tanked. The test waits for natural respawn before the next arrangement. Phase3 shows rampage overlapping the independent cursed head, fists, ultimate, head rejoin and roar; the guest remains alive. See `evidence/network.json` for per-tick paths, received damage, actual hazards and AI samples.

Browser inspection uses the actual game renderer in all three phases. `phase1-stationary-hit-220.png`, `after-phase2-fire.png`, `after-phase3-ai.png` show real HP changes and character readability. `phase1-late-side-step-hit.png` records a late diagonal approach that takes the first60 damage and escapes later hits; it is not labelled a successful zero-damage dodge. The zero-damage proofs are the real transport movement receipts. Historical-before and current-after screenshots have different gameplay zoom/timing and are not synchronized comparisons.

## Defects corrected

1. **Warning omitted the player-body allowance.** A real player at radius3.56 (outside the old3.4 first-cone line) took60 damage, as expected by existing collision up to3.7. `boundary-probe.json` retains that receipt. `SHUTEN_CONTACT_PADDING=.3` is now shared by collision and presentation. The same unchanged value replaces existing server literals; no radius, damage, angle or timing balance changed. Circle/sector warnings include this allowance; charge capsules include width+.3; ring warnings include radius+width+.3. Rear safe wedges retain the original angle.
2. **Active wave was drawn as a zero-width circumference.** The indicator now shows the actual annulus, including its inner safe boundary. The ground center behind a wave stays unfilled. Source fire/ash art remains cosmetic and is not itself a hitbox.
3. **Active charge retained the entire warned lane.** During windup the full future capsule is visible. After contact starts, its ground marker follows the head's current swept segment at the server's nominal30Hz cadence. A passed portion of the lane is no longer shown as currently damaging. Server collision remains authoritative under timing jitter.

Warnings/marks remain beneath actor depth; no opaque HUD fill or added bloom is introduced. Actual phase2/3 impact samples still show the player's location/silhouette; brief normal damage flashes are retained. This is inspection of these cases, not a claim that no organic effect can ever overlap any character pixel. No unrelated character, map, server-room, networking or balance rewrite.

## Reproduce

```
pnpm typecheck
SHAMAN_BUILD_WORKERS=2 pnpm build
node apps/client/scripts/shuten-vfx-complete-test.mjs
node apps/client/scripts/shuten-test.mjs
node tools/bosses/complete-behavior-test.mjs
node tools/bosses/three-phase-playtest.mjs
node tools/bosses/validate-playtest.mjs
python tools/bosses/publish_combat_review.py
```

The actual-room runner starts its own server on2601 and cleans it up. `SHUTEN_QA_PORT=2602 ... --probe` isolates the boundary receipt. Extended VFX tests pass140749 assertions over112 clips, collision allowances, hollow rings, moving head markers, warning depth, pool lifecycle and cancellation. Original179 authority checks, coordinated-AI checks, workspace typecheck and two-worker production build pass. Desktop and simulated phone portrait/landscape are inspected; physical-phone GPU measurements and final encounter balance remain outside this QA result.
