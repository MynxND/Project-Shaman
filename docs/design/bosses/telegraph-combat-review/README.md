# Koschei / Maiyarap — full live-room telegraph audit

2026-10-16. Every10 normal skills and each ultimate across the3 phases of both
bosses were tested in actual Colyseus GameRooms. DEV single unsaved guests arrange
phase and starting position before casting; no post-cast teleport, invulnerability
or out-of-court escape. These are controlled tests, not continuous balanced wins.

## Findings and corrections
1. **Swept ring mismatch:** the server includes the interval since its preceding
   simulation tick, but the renderer used instantaneous radius for its safe inner
   edge. Both encounters now append `contactStep` to their encounter schema and
   publish the actual room-clock interval. Shared presentation helper
   `boss-contact-footprint.ts` uses the same earlier radius for the inner edge.
   Charge sweeps also use this reported interval instead of hardcoded1/30s.
   Recorded previews use50ms, matching the actual CombatSystem recording step.
   The central hole/passed lane remains safe; no collision/damage/clock tuning.
2. **Desktop refuge obstruction:** the bottom hotbar hid part of the southern
   refuge before approach. Only these two boss rooms move their non-touch
   desktop hotbar to the lower-right free space with wrapping; other rooms and
   touch layouts are preserved. Retested both ultimate refuges with real Down
   key movement1250ms: position24,35; HP4000/4000 after impact.

The schema fields are appended only to these two encounter records, defaulting
to1/30s before an observed step; older room deployments must be restarted with
this server build. No Shuten, player skills, map collisions or portals changed.
The owned local server was rebuilt/restarted and actual browser rooms rejoined.

## Actual-room matrix
Damage is the total across all landed sub-hits, not nominal per-hit damage.
All walk-dodge trajectories remain inside their arena. Raw positions, hazard
snapshots, hit receipts and inputs remain in each boss's `evidence/network.json`.

|Boss|Phase|Skill|Stand/control damage|Walk-dodge damage|Result|
|---|---:|---|---:|---:|---|
|koschei|1|gravefrost-spear|65|0|PASS|
|koschei|1|deathly-chains|120|0|PASS|
|koschei|1|necropolis-guard|140|0|PASS|
|koschei|1|soul-lance|80|0|PASS|
|koschei|2|immortal-rebirth|65|0|PASS|
|koschei|2|cursed-needle|165|0|PASS|
|koschei|2|royal-necromancy|75|0|PASS|
|koschei|3|deathstorm|240|0|PASS|
|koschei|3|throne-of-bones|85|0|PASS|
|koschei|3|soul-severance|255|0|PASS|
|maiyarap|1|sleep-enchantment|55|0|PASS|
|maiyarap|1|underworld-chains|130|0|PASS|
|maiyarap|1|phantom-doppelganger|180|0|PASS|
|maiyarap|1|patal-gate|70|0|PASS|
|maiyarap|2|dream-theft|65|0|PASS|
|maiyarap|2|false-awakening|70|0|PASS|
|maiyarap|2|nightmare-passage|75|0|PASS|
|maiyarap|3|lucid-seal|150|0|PASS|
|maiyarap|3|underworld-court|85|0|PASS|
|maiyarap|3|sleepwalker-hunt|240|0|PASS|

|Ultimate|Outside refuge|Walk into refuge|Ritual/source counter|
|---|---:|---:|---|
|Koschei / The Last Needle|190|0|PASS, normal relic interactions/basic attacks|
|Maiyarap / Eternal Slumber|180|0|PASS, symbols/source and normal basic attacks|

Fresh network results:40 stand/walk cases,4 ultimate failure/refuge cases,
2 solo ritual counters,6 normal-AI phase samples. Extended suites also cover
8 facings per boss, late join and QA isolation (Koschei11 / Maiyarap12 cases).
See [machine summary](results.json) and the two per-boss evidence folders.
`telegraph-receipt-test.mjs` verifies34 positive damage receipts lie within a
corresponding server contact window with±150ms observation tolerance. This is
not a claim of frame-exact network delivery:30Hz requested simulation uses actual
elapsed room time,50ms patches and75ms test sampling; interpolation/transport can
shift the visible contact. No public-network/high-latency acceptance is claimed.

## Visual evidence — actual live Phaser rooms
Every normal skill was cast in its corresponding QA-arranged phase and observed
from warning to aftermath. Timed screenshots sample350,950,1400,1800,2400ms and
recovery; long pursuits add later samples through8200ms. Ultimate samples cover
all5 stages through36.5s /27s, both stand and real-keyboard refuge branches.
These are live room images, not the recorded dedicated preview or generated art.
Raw suffix times are elapsed after UI dispatch and include network scheduling;
`ui-cases.json` stores actual capture elapsed times and AX deltas. Its early
preliminary records are retained as history; last complete sample set per case
is authoritative for this review. Final full AX receipts confirm both refuge HP.

- [Phase1,8 skills](phase1-contact-sheet.jpg)
- [Phase2,6 skills](phase2-contact-sheet.jpg)
- [Phase3,6 skills](phase3-contact-sheet.jpg)
- [Both ultimates: warning/contact before HUD correction](ultimate-contact-sheet.jpg)
- [Real keyboard refuge controls after HUD correction](refuge-proof.jpg)
- [Mobile portrait](mobile-portrait-warning.jpg) /
  [landscape](mobile-landscape-warning.jpg): Maiyarap ring, same session retained.

Warning contours/ornaments remain below actors. No persistent VFX cover over
player silhouettes was observed in the collected casts; the small restrained
contact flash and physical boss/player overlap at a landed rush are expected.
Ring centers and spent charge paths remain readable. Distant boss portions can
leave the camera view during southward movement; this is not proof of unrestricted
visibility at every camera/player position. No authored art acceptance is implied.
QA panels are intentionally expanded and occupy space; they are development UI.
Normal desktop hotbar correction was checked during both refuge control casts.
Mobile viewport simulation is not a physical device certification.

## Checks and performance scope
- pnpm typecheck: PASS; pnpm build: PASS,40 client routes and workspace packages.
- Koschei behavior876 / Maiyarap620: PASS,88 recorded clips each regenerated.
- ritual geometry/render768: PASS.
- swept-contact1273: PASS, both server policies, variable16–250ms intervals,
  inner/outer edge controls and real CombatSystem contactStep publication.
- production review/relic/symbol gate tests: PASS for both bosses.
- Live desktop browser adapter CPU p95 values in collected HUD samples up to1.4ms,
  max4 pooled warning views; no new textures/objects/tweens/particles allocated.
  Active CPU observed during repeated screenshots is not a whole-frame/GPU or
  sustained60FPS benchmark. No physical-phone/GPU/network soak measured here.
- User visual/balance acceptance remains pending. No new artwork was needed.

Existing previews share the corrected adapter: /boss-vfx/koschei and
/boss-vfx/maiyarap. Server-authoritative geometry and all phase mechanics remain.
