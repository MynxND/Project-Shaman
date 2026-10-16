# Shuten-dōji — VFX contract

Standard: [SHAMAN_BOSS_VFX_STANDARD.md](../../../../SHAMAN_BOSS_VFX_STANDARD.md), v1.0 · 2026-10-16.

Existing implementation and real-room evidence adopted as the first reference for this standard. This records what was implemented/tested; it does not invent new artistic approval or approve final balance. Three phases/ten skills/five ultimate stages are Shuten's design, not universal boss requirements.

## Scope and identity

`shuten-doji`, Japan, Mount Ōe oni king. Original armored/frenzied/headless body and floating head; supernatural sake, kanabō, spectral oni, charcoal ash, crimson spirit fire and violet sake ignition. Ofuda/fictional marks follow the World Art Bible's Japan exception. No imported third-party sprites. Player-facing HUD is Thai.

Live room: `mount-oe-fortress`. Preview: `/boss-vfx/shuten` (and legacy `/boss-vfx/stomp`). Review: `/boss-review/shuten-combat/index.html`. User authorized complete boss adoption and commit/push. No further artwork or runtime changes are part of this documentation task.

## Coverage and contracts

| Phase | Attack/stage | Authority / tell | Presentation and evidence |
| --- | --- | --- | --- |
| 1 | Oni Crusher | Three cones at900/1250/1600ms | Authored weapon trails, final upright impact, shared padded sector tells |
| 1 | Demon Sake | Liquid1200ms, ignition2300ms, damage repeat500ms | Distinct liquid and violet-fire material; liquid is non-damaging |
| 1 | Mountain Stomp | Two expanding rings from1100ms,450ms apart | Hollow moving damage bands, authored ash/fire, center safe after passage |
| 1 | Oni War Cry | Locked frontal cone,1000ms tell | Measured eight-view mouth ports, spectral faces, real knockback |
| 2 | Hellfire Sweep |270° primary1000ms, delayed1700ms | Rear safe wedge, clipped crescent and upright secondary flames |
| 2 | Demon Legion | Ground portals1200ms, drums control adds | Portal itself non-damaging; destructible drums and real minions |
| 2 | Blood Moon Leap | Predicted locked landing1400ms and three rings | Actor lift cosmetic, authoritative landing/collision, hollow rings |
| 3 | Cursed Head |900ms warning,700ms charge | Full capsule warning; moving active swept segment and measured mouth port |
| 3 | Headless Rampage | Five contacts900–2500ms | Independent head/body AI, per-hit warning/contact/recovery |
| 3 | Mount Ōe Cataclysm | Sequential fist circles1100ms then650ms apart | Authored descent/impact, real terrain collapse, preserved routes |
| 3 | Ultimate | Moon → faces → marked fire → breath → three waves | Five stages, real altars/seal/rejoin; source/timings and limits linked below |
| 2/3/death | Armor break, severing, dissipation | Authoritative phase/action/death timestamps | Eight-view key poses, layered eruption/blade/head lift/fade; not a new full locomotion flipbook |

Detailed geometry/asset/layer tables: [complete implementation](complete/README.md). Timing and counterplay code: [shared boss shapes](../../../../packages/shared/src/shuten.ts), [authoritative encounter](../../../../apps/server/src/rooms/shuten-encounter.ts). Player-skill classification is not changed; no PASSIVE_STAT VFX is generated.

## Architecture, assets and resource limits

- [ShutenCombatVfx](../../../../apps/client/src/game/vfx/boss/ShutenCombatVfx.ts): bounded32-view pool, eight sprites per view plus indicator/clipping geometry;96 reserved/live particles. These are this implementation's caps, not default budgets for new bosses.
- [Timing model](../../../../apps/client/src/game/vfx/boss/shuten-vfx-model.ts), [telegraphs](../../../../apps/client/src/game/vfx/boss/shuten-telegraph.ts) and [actor presentation](../../../../apps/client/src/game/vfx/boss/ShutenPresentation.ts) remain separate from damage/FSM. Original sprite slots4–7 carry warning stamps; no per-frame GameObjects.
- `SHUTEN_CONTACT_PADDING=.3` shares the existing player allowance between collision and visible extents. Warning cone/circle/capsule/ring geometry follows actual collision rules; active ring shows its inner safe boundary and active charge follows the current head.
- Seven independently timed semantic layers, nearest textures, floor marks below actors, upright art sorted by ground origin, SCREEN flash guarded by WebGL, NORMAL fallback, reduced motion and bounded lifetime/cancellation/late-join cleanup.
- Ten sixteen-frame effect atlases and two eight-view key-pose atlases:176 new cells, original source/provenance/hashes in [complete sources and manifests](complete/README.md#assets-and-provenance). Four hand-authored geometric warning cells in `telegraph-marks.svg`; not organic procedural flames or claimed authentic script.
- Observed local adapter CPU p95 about0.10–0.20ms, peak14/32 views and48/96 live particles in the recorded complete review. These are local scoped counters, not GPU profiling, physical-phone results or a universal60FPS promise.
- Conformance limit to check before increasing density: the current adapter skips a whole view when its32 slots are exhausted, including its tell. Synthetic80-cue stress establishes bounded allocation, not guaranteed warning coverage. Observed encounter counts are below capacity, but future density changes must prove worst-case coverage or add a critical-tell fallback to satisfy the standard; do not cite the historical stress pass as proof of that fallback.

## Verification and limits

- [Complete evidence](complete/README.md):112 real CombatSystem clips,88 actual-room skill/direction receipts, transitions/death, pool/cancel/late-join tests and desktop/simulated-mobile inspection.
- [Telegraph review](telegraphs/README.md): original plain-line before/after and all-eight-direction cone/charge inspection; earlier nominal-radius images are historical and superseded by the collision-aware correction.
- [Combat review](combat-review/README.md):22 real GameRoom stand/walk controls, all dodge paths within the arena with0 damage,29 damage receipts checked against live windows with explicit100ms schema-clock uncertainty. Actual UI captures include a late diagonal step taking60 damage; it is not described as a zero-damage dodge.
- Normal AI27s per phase includes independent head/body overlap and the ultimate. The stationary phase2 guest dies to sustained/minion attacks. Phases/HP were arranged using guest-only dev controls; this is not a continuous normal-character victory or final difficulty approval.
- Collision allowance, inner wave hole and passed charge lane were corrected without changing damage/range/timings. Ground tells stay below actors; inspected impact samples retain player readability, with brief normal damage flashes. No claim that every organic effect can never overlap a character pixel.
- Latest runtime verification: workspace typecheck/build,140749 VFX assertions over112 clips,179 authority checks, coordinated-AI/heal/death tests, real-room controls and receipt validation. Commands, exact scope and remaining physical-device/latency/balance limits live in the linked reports; reproduce instead of copying these numbers for a future boss.
- Runtime baseline commit `e517f9bd` was pushed to `origin/develop`. This contract is a documentation-only adoption; future implementations must record their own changes and actual push outcome.


## Motion / identity v3 — in progress
User requested real authored locomotion and full animation upgrades plus distinct combat decisions.
Shared audit, provisional design, production queue and acceptance: ../motion-identity-v3/README.md.
Old evidence remains historical; no v3 completion or visual approval is claimed.
