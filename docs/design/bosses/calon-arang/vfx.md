# Calon Arang — Boss15 VFX contract
Standard: [v1.1](../../../../SHAMAN_BOSS_VFX_STANDARD.md).
Source: [shared Word rules + Boss15](source.md). Indonesia, Javanese ruined temple.
Scope: this boss only,3 phases,10 named skills and multi-stage ultimate;
ImageGen artwork, preview, actual-game tests, commit/push. Status: implemented for review; user art/balance acceptance pending.
All numerical balance, geography, motifs and specific attacks below are original
provisional game adaptations; no canonical folkloric ability claims.

## Audit / identity
Existing Phaser3.90 world, React summaries and Colyseus authoritative CombatSystem;
BossHazardState has timestamped world geometry, independent encounter records.
Reuse lifecycle, geometry policies, bounded pools and existing sprite loading;
not Maiyarap dream sequence or Koschei deathless/relic ordering.
Primary vocabulary: cursed floral growth, spectral moths, Javanese-inspired woven
ritual ornament, charred cloth and ash; muted viridian/saffron/soot, no neon lasers,
Japanese torii/oni or Thai crowns. Readable geometric ritual tells below actors;
organic material exclusively authored PNG flipbooks, not flat Graphics substitutes.
ImageGen skill used, original sources/prompts/receipts/hashes retained in repo.
No third-party sprite reference. Missing assets initially: actor8views, windup,
release,death,11 distinct effect atlases,temple/effigy/quarantine/source props.
Owned Indonesia ground/vegetation is reusable; no relabeled Russian/Thai artwork.

## Exclusive gameplay / counterplay
An unordered4-edge infection network surrounds a clear central circulation space.
Each connection has a destructible effigy using normal combat targeting/attacks.
Cutting a connection disables its warned pulse; no mandatory fixed relic sequence.
Phase1 teaches2 connections; phase2 awakens4 and adds cross-contagion; phase3
periodically pulses surviving edges and strengthens infection pressure.
Infection is bounded0..3 with expiry; specific hits add stacks. Quarantine wells
at12,33 and36,33 cleanse via proximity interaction, without blocking movement.
After all current connections are cut, hold a server-validated purification intent
near the central source24,26 for2.4s; moving away/hit cancels progress. Success
cleanses, staggers, and cancels ultimate. Normal boss defeat is not deathless-gated.
Ultimate resets4 connections, gives~40s interactive counter window with safe
routes; failed finale retains explicit southern refuge24,35 radius2.8+.28.
All interactions validate living player, room, distance and rate on server.
Objects never block walk collision. Solo routes and attacks must be measured.

## Skill coverage / provisional clocks
|ID|Phase|Geometry / targeting|Tell / active / recovery ms|Counterplay|
|---|---:|---|---|---|
|plague-bloom|1|disk: locked target bloom|1400/500/1200|leave locked footprint; sever network / quarantine|
|cursed-effigy|1|capsule: crossed effigy threads|1400/500/1400|leave locked footprint; sever network / quarantine|
|spirit-swarm|1|capsule: three staggered moth lanes|1500/400/1500|leave locked footprint; sever network / quarantine|
|black-ritual|1|ring: body ash annulus|1600/900/1500|leave locked footprint; sever network / quarantine|
|graveyard-procession|2|charge: two independently moving funeral spirits|1500/600/1600|leave locked footprint; sever network / quarantine|
|soul-withering|2|capsule: locked siphon ray|1500/600/1400|leave locked footprint; sever network / quarantine|
|cursed-altar|2|disk: target offsets spare quarantine routes|1600/600/1500|leave locked footprint; sever network / quarantine|
|thousand-cursed-hands|3|sector: ordered hand quadrants|1600/500/1600|leave locked footprint; sever network / quarantine|
|plague-eclipse|3|ring: three expanding moth bands|1600/900/1600|leave locked footprint; sever network / quarantine|
|soul-harvest|3|charge: three separately locked harvest rushes|1500/500/1600|leave locked footprint; sever network / quarantine|
|night-of-a-thousand-curses|3|finale: five stages and live sever/purify challenge|1600/800/2000|leave locked footprint; sever network / quarantine|

Each definition also specifies cooldown,damage/status,source actor,animation,
audio,layers,AI/cancel policy. Ultimate stages: omen → growth → marked procession
lanes → sever/purify challenge → interrupted/failed finale. All stages independent.

## Runtime / authored presentation
Shared world-unit hit geometry includes .28 player allowance; annulus starts1.2.
Publish actual contactStep for swept annulus/charge and pass recorded50ms step in
preview. Fixed warning extents, inset floral/batik ground ornament and timestamp
progress; earliest coincident future tells only. All hit events preserved.
24 pooled important views,64 cosmetic particles; budget violation explicit,
no silent missing hazards. Seven independently timed layers supported; authored
16-frame attack atlases, measured actor ports, nearest filtering, NORMAL ground
and restrained WebGL ADD contact with Canvas fallback/reduced motion.
No per-frame GameObjects/tweens/listeners. Cancel on phase/reset/death/reconnect;
late join reads current cues and never replays old contact. Preview shares runtime.

## Planned verification and limits
Every normal attack stand/dodge, all phases, ultimate fail/refuge/sever/purify,
source interruption,wrong-distance rejection,expiry/death/wipe/latejoin/cooldowns;
shared geometry edges and variable-step sweeps; full real-room visual capture.
Desktop/portrait/landscape,object/particle caps,adapter CPU vs frame interval;
physical-device/GPU/latency soak unverified unless separately measured.
Current results and evidence are in README.md and evidence/. User visual acceptance remains pending.


## User motion / spatial VFX correction request — 2026-10-16
Static idle translation and sparse cast poses are rejected. Before expansion,
follow [motion/spatial audit](../motion-vfx-audit-2026-10-16/README.md): authored
locomotion with real contacts and in-betweens, distance-driven preserved gait
phase, explicit release sync, geometry-aware materials and genuinely animated
organic VFX. Existing damage/telegraph checks are not animation-quality approval.
At the initial audit Calon had idle/windup/release sources without a complete walk or
cast cycle. No shared standard claims those sparse sources are production motion.

### Revised motion/material plan after user priority confirmation
Complete Calon first; existing boss motion remains separate future work.
Target16 unique walk poses per facing,16 unique casting poses per facing,8
chronological collapse poses (shared southeast death), no FPS-only upgrade.
World-travel-driven gait phase survives facing changes; teleport corrections
must not advance gait. Cast frames0..9 anticipate,10 is release,11..12 follow
through,13..15 recover; final runtime pacing must be visually reviewed.
Effect atlases target16 genuine frames, windup0..7, contact8 and active8..15,
with independent authored aftermath/moth/ash motion; not3 active frames.
Use reusable bounded geometry masks for ground material strips/fields and
geometry-aware sizing without arbitrary400px clamp. Elevated organic feature
and ground coverage have separate anchors. Optional textured ropes/mesh/particles
only after checking installed WebGL APIs; Canvas keeps authored sprite fallback.
Initial proof may contain explicitly temporary missing-direction/material guards;
those must be eliminated before delivery and may not be counted as authored art.


## Delivered coverage / final audit
Current implementation and measured evidence: [README](README.md). Required
visual assets are present; temporaryMissingDirections is empty and all11 organic
materials have16 distinct frames. Actor atlas272 frames at240px; shared SE death
is explicit, not eight-direction collapse. Packer selects the4 corrected rear
motion v2 sources and bounds every pose under one scale per action.

Each of24 views also reserves12 natural-aspect pieces;64 cosmetic particles are
pooled. Capsules use clusters, sectors rotate, moving spirits have a cosmetic
vertical anchor, and the finale uses12 native-scale patches. Ground contact masks
remain authoritative. Audio intent plague-chime resolves to guarded ca:charge /
ca:contact / ca:relic cues using owned neutral WAVs with original provenance.
The Calon-only camera eases toward the southern refuge during ultimate; portrait
HUD leaves the lower central floor clear. No gameplay range changed for framing.

1028 behavior,905 art,52 motion,58 geometry checks;10 required placements;88 real
GameRoom skill/facing timelines;20 stationary/dodge cases; solo normal-attack
counter; fail/refuge; production/latejoin gating and3 phase AI samples pass.
Full typecheck/build and shared/previous-boss behavior regressions pass. Actual
attack/ultimate and desktop/emulated-phone screenshots are in evidence/. Human
art/balance approval, physical-phone/GPU/Canvas output and adverse-network soak
remain unverified; these are not a continuous balanced-character victory.
