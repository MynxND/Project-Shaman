# Shuten-dōji — complete combat VFX integration

2026-10-16. User expanded the one-attack proof of concept to the complete boss. This supersedes the Stomp-only scope in `vfx-stomp-v2/`; historical sources/evidence remain intact. All ten skills, the five-stage ultimate, phase changes and death presentation now use the complete runtime. Human art acceptance remains the user's decision; this report does not claim physical-phone GPU testing or final encounter balance.

## Coverage

| Skill | Final presentation | Preserved authority |
|---|---|---|
| Oni Crusher | Three clipped kanabō trails, final upright flame/basalt impact ahead of the feet | Three cones, 900/1250/1600ms contact windows |
| Demon Sake | Authored amber wine splash/puddle, then independent violet flame loop | No damage from liquid; ignition at 2300ms and 500ms damage cadence |
| Mountain Stomp | Sixteen-frame ash/fire annulus, inset trail, dust and residue | Two linear expanding rings, 450ms apart; hollow center safe |
| Oni War Cry | Horned spectral faces and pressure plume from body mouth height | Locked frontal cone and collision-aware knockback |
| Hellfire Sweep | 270° textured crescent with rear gap; delayed upright violet flames spread across arc | Original primary and delayed secondary hit areas |
| Demon Legion | Horizontal burning ground breaches, emerging spirit hands and actual taiko/adds | Destructible drums, reinforcement cadence and six-add cap |
| Blood Moon Leap | Visual airborne arc to the locked landing, contact crown and three waves | Original velocity prediction, landing teleport and annuli |
| Cursed Head | Real floating head sampled along the same authoritative charge as its spectral bite/trail | Swept capsule, 900ms warning and 700ms travel |
| Headless Rampage | Five separate clipped trails/contacts, per-strike anticipation and recovery pose | Original five-hit combo; normal AI independently schedules the head |
| Mount Ōe Cataclysm | Fist descent before contact, authored knuckle impact, dust and detailed collapsed-floor scars | Original sequential damage and collision mask; all exit/ritual routes retained |
| Wrath of the Severed King | Blood moon/head, four spectral faces, marked violet eruptions, head-mouth breath, three large waves | All five original stages, altar damage reduction, seal and rejoin behavior |

Phase 2 adds eight-view drinking art before the armor/fire eruption. Phase 3 retains the spectral blade and choreographs the head leaving the neck while the body changes form. Death adds eight-view kneeling headless art, timed fading and authored spirit-smoke dissipation. Existing eight-direction body ready/windup/strike poses remain and receive restrained time-based anticipation, lunge, breathing and stagger motion. These are pose animation plus secondary motion, not a newly authored full locomotion flipbook. None of the original character PNGs were repainted.

## Architecture

- `shuten-vfx-model.ts`: framework-independent material selection, original world-coordinate shape sampling and independent texture clocks. Linear damaging wave radius is never eased. One-shot frames are scheduled around real contact; fist contact begins at frame 4.
- `ShutenCombatVfx.ts`: lazily allocated pool, maximum 32 hazard views, eight sprites + visible gameplay indicator + non-rendered clipping geometry per view, one shared 96-instance reserved emitter. Pool overflow drops cosmetics only. Reuse, interruption, tail expiry and destruction are tested.
- `ShutenPresentation.ts`: existing MonsterLayer sprites remain selectable actors; offsets never move gameplay colliders. Separate transition/death/ritual objects have explicit lifetimes.
- `ShutenLayer.ts`: reads synchronized room clock/hazards, dispatches Thai HUD summaries and binds the renderer. Legacy rendering remains behind development-only `bossVfx=before`; normal gameplay always uses the complete asset renderer. No other bosses or nation VFX were migrated.

Seven semantic layers have independent timing, alpha, size, rotation, anchor and depth: ground marking, charge, main art, trails, contact flash, particles/smoke/debris, lingering energy. Ground layers sort below feet, upright material above its ground source. The amber outline is geometry information; smoke skirts never enlarge damage. Weapon masks preserve the rear safe wedge. Mouth effects originate above ground but terminate toward the authoritative ground target; ground indicators remain the range contract.

No organic flame/smoke/roar is drawn from plain polygons. Graphics remain for readable tells, clipping and seal progress. New atlases explicitly use nearest filtering. A short textured SCREEN flash is guarded by `renderer.type===Phaser.WEBGL`; Canvas uses NORMAL. No custom shader, excessive bloom or unverified WebGL FX pipeline is required. Particle motion uses Phaser delta-time updates; frame selection and movement follow timestamps. Reduced-motion reduces debris and removes shake/hover. Late joins do not replay old contact bursts; interrupted warnings fade without release.

## Assets and provenance

`generations.json` records exact prompts, built-in ImageGen job IDs and repository source paths. `sources/` retains all original RGBA output. Runtime `public/assets/vfx/boss/shuten-complete/` has ten sixteen-frame material atlases and two eight-view actor-pose atlases: **176 new cells**. Actor references are the project's own armored/headless Shuten sheets; no third-party sprite art or model training data was used. Small ember/basalt particles reuse the owned first Stomp atlas. Existing Japanese terrain, actors, props and UI remain.

`pack_complete_vfx.py` crops equal source cells, preserves aspect ratio, aligns authored ground anchors and scales with nearest sampling; it never repaints motion or manufactures fake extra animation frames. The manifest records native dimensions and SHA256 for sources/runtime. `test_complete_art.py` verifies all 176 distinct cells have real transparency and that provenance hashes match. Existing actor/motion sources remain unchanged. There are no missing material families or unconnected placeholder VFX in the eleven-skill runtime.

## Review and evidence

- `/boss-vfx/shuten`: dedicated Phaser lab, eleven skills plus phase 2, phase 3 and death; eight target directions; pause/resume, restart, slow playback, seek slider and overview/detail zoom.
- `/boss-vfx/stomp`: now opens that complete lab with Stomp selected, so the user's old link no longer displays the old POC. Historical POC source files are retained.
- `/boss-review/shuten-complete/index.html`: actual-room before/after gallery, 88 skill/direction screenshots and additional phase/ultimate/preview evidence. Before images are historical captures, not frame-synchronized comparisons.
- `evidence/`: PNGs and 88 JSON receipts captured through real in-game controls. Receipts identify skill, target direction, requested capture delay, HUD state and measured CPU/pool/particle counters. Browser capture latency is not a frame-accurate hit measurement. A few captures show warning/recovery rather than peak contact; frozen lab shots are explicitly labelled `preview-*`.

The lab uses **112 clips captured from the real CombatSystem** with a 50ms controlled clock (`capture_vfx_clips.mjs`), not invented damage simulation. Lab snapshots carry authoritative times, actor/head positions, hazards and phase/death state. Individual skill clips isolate manual scheduling; the separate behavior test verifies normal head/body AI overlap. A preview is not an online combat session. Browser screenshots are unpainted captures; no generated mockup is presented as gameplay.

Problems found and fixed during visual inspection: the crescent's original opening faced toward the attack rather than the rear, so clipping hid much of it; rotate its material 180° before the actual cone mask. Upright explosion art must sit at the contact ahead of the body rather than be rotated/clipped like flat ground art. The delayed sweep uses upright flame clusters along its arc instead of one rotated vertical pillar. Head bite visuals and head position now sample the same charge path. Transition smoke/fist art no longer stretches eight frames over several seconds.

Two authority corrections close existing edge cases: healing from an unsealed ultimate can no longer reduce a boss at 4900HP to 4899HP, while the intended 1120 heal/cap otherwise stays the same; the dead state now records its authoritative `actionAt`, preventing late join or preview seek from restarting death dissipation. No protocol fields, hit geometry, damage amounts, cooldowns, phase gates or map connectivity were changed.

## Measurements and validation

Actual local-room desktop review at 1280×720 reported VFX-update CPU p95 **0.10–0.20ms**, a peak lazy pool of **14/32**, and peak live particles **48/96** during the ultimate. These are this effect adapter's CPU/counters, not total game frame cost, GPU time or memory profiling. Timer precision is limited. The dedicated WebGL lab reports frame intervals (observed warm p95 about 6.96–16.68ms depending on focus/viewport) separately; no universal 60FPS guarantee or measured speedup is claimed. Scene resize preserves state and rejects zero render-target dimensions. Simulated mobile checks do not substitute for physical phones.

Verified commands:

```
pnpm typecheck
SHAMAN_BUILD_WORKERS=2 pnpm build
node apps/client/scripts/shuten-test.mjs
node apps/client/scripts/shuten-vfx-complete-test.mjs
node apps/client/scripts/stomp-vfx-test.mjs
node tools/bosses/complete-behavior-test.mjs
node tools/bosses/aim-live-test.mjs
node tools/bosses/live-test.mjs
python tools/bosses/test_complete_art.py
```

The suites cover original 179 boss authority/geometry/phase/counterplay checks, all clip directions/material clocks and sampling rates, pool/cancellation/late-join behavior, normal coordinated AI, intended healing, death cleanup, actual GameRoom join/travel and production review rejection. The dev aim arrangement exists only through the existing unsaved-guest/solo/development review guard; invalid directions and multiplayer attempts are rejected.

To reuse the architecture: keep a new boss's authority independent, provide explicit timed cues and source anchors, author a separate material profile, bind its region preload and actors, and test real geometry and counterplay before adoption. Never route PASSIVE_STAT into this enemy-effect adapter or migrate unrelated player skill policy as a side effect.

## Final continuity and device review

Native atlas mouth anchors are authored independently for all eight body/head views; north-facing plumes sort behind the hair. The last patch was inspected across sixteen frozen mouth-direction frames plus actual-room east roar. Desktop gallery and 390x844 portrait / 844x390 landscape preview were inspected; landscape uses normal page scrolling, and no physical-device performance claim is made.

During the interrupted session the development tsx watcher restarted when schema/shared dist files were rebuilt (log entries at 11:49:55 and 11:49:56). The final local review now runs `node dist/index.js` from apps/server, without a watcher, on the existing port2567. No reconnect-loop code was changed without evidence. A real SDK session stayed connected for60000ms:0 drops,0 reconnects,0 unexpected leaves,944 state updates; see evidence/connection-stability.json. This addresses observed game-server restarts, not a claim to repair the Codex application's own connection. After future server edits, build first and restart this compiled process deliberately; `pnpm --filter @shaman/server dev` remains the normal watch workflow.

Final workspace typecheck and two-worker production build passed after the mouth-port patch. Authority179, Stomp776, complete VFX111170, normal-AI/healing/death, actual GameRoom/travel/production guards, aim/multiplayer guards and176 transparent-cell/hash checks passed. Cosmetic CPU and frame measurements above retain their limited scope.
