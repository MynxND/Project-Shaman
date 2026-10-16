# Maiyarap — VFX contract

Standard: [Boss VFX Standard](../../../../SHAMAN_BOSS_VFX_STANDARD.md), v1.1.
Source: [selected shared rules and Boss13](source.md). Only Boss13 is in scope.

## Scope and status
Implemented for review; technical checks pass, user visual acceptance pending. Thailand,
original game adaptation of the underworld yaksha sorcerer. Three phase thresholds
70% and35%, ten skills and Eternal Slumber. Other bosses remain untouched.
ImageGen is authorized for sprites and authored VFX; source PNGs/prompts retained.
All numerical balance, palace geography and the following sleep rules are
provisional implementation decisions, not claims from mythology or approved lore.

## Audit
Installed Phaser3.90 renders the world; React owns HUD; Colyseus GameRoom owns
combat through CombatSystem. Existing BossHazardState carries authoritative
world geometry and timestamps. Existing ShutenEncounter and its Japanese assets
are preserved, not copied as Maiyarap's signature mechanic. Add an independent
Maiyarap encounter state and renderer. Existing monster selection/damage/movement
are retained. Do not create a second client-authoritative combat implementation.

## Dream contract
Sleep transfers the affected player's encounter view into dream without disabling
movement. Damage hazards carry awake/dream/both realm filters. A visible gold
lotus, knot and flame sequence stays consistent across phases. Reach matching
shrines and interact in order, then attack the revealed spell source to wake and
stagger Maiyarap. Wrong symbols do not erase all progress or imprison a player.
A bounded fallback wakes players after the dream timer. Death, leaving, reset
and transitions clean realm state and pending hazards. Ultimate renews the
sequence and exposes its own source; completing it cancels the damaging finale.
Awake allies can contribute source damage after a dreamer reveals it. Solo is
always possible. No permanent blockers or mandatory multiplayer split.

## Coverage matrix — implemented choreography
|Phase|Skill|Geometry / targeting|Tell / active / recovery ms|Counterplay|
|---|---|---|---|---|
|1|Sleep Enchantment|targeted sleep blossom disk|1400/500/1200|walk out; solve dream if hit|
|1|Underworld Chains|two intersecting capsule lanes at locked target|1200/500/1300|leave lanes sideways|
|1|Phantom Doppelganger|three delayed phantom thrust lanes|1400/350/1500|move between staggered attacks|
|1|Patal Gate|paired shadow mouths with expanding annuli|1500/900/1500|cross before the band arrives; safe centers|
|2|Dream Theft|targeted returning tether and source vulnerability|1500/500/1400|break line; dream symbols if caught|
|2|False Awakening|false exits marked crimson; gold route stays safe|1600/600/1500|recognize persistent gold symbols|
|2|Nightmare Passage|alternating lane sweeps with open corridor|1500/700/1500|use marked corridor|
|3|Lucid Seal|three sequential lotus seals; interrupt at source|1400/500/1400|step through safe centers; stagger source|
|3|Underworld Court|four royal spectral judgments, staggered|1500/500/1600|read order and change quadrant|
|3|Sleepwalker Hunt|three locked predicted charge capsules|1400/350/1600|side-step each locked charge|
|3|Eternal Slumber|premonition/split/lanes/symbols/finale|five stages; long interactive counter window|sequence then destroy source; safe finale pocket even on failure|

Each skill binds its own authored anticipation/active/impact/decay atlas;
source/body animation, ground stamp, aura, primary animation, trail, contact,
secondary particles and aftermath have independent clocks/depth. Numeric damage,
ranges and deadlines will be recorded in shared data, never inferred from pixels.

## Art and runtime constraints
Emerald dream mist, aged gold Thai chada/royal armor, indigo yaksha skin, fictional
woven seals and shadow gates. No Japanese oni/torii, Western runes or copied script.
Transparent crisp pixel assets, consistent foot anchors, elevated overhead view.
Ground tells use shared collision geometry including player allowance; organic
mist/spirits use authored artwork. Ordinary sprites use NORMAL; restrained ADD
only for highlights. No shader requirement; Canvas fallback remains playable.
Important tells never drop when cosmetic pools fill. Late joins do not replay
expired contact bursts. Resize preserves game/session. PASSIVE_STAT stays absent.

## Budgets and verification
24 hazard views, each with one danger Graphics, one timer Text and five image
layers;64 pooled cosmetic particles and one mask Graphics:233 GameObjects.
Measured choreography peaks at4 simultaneous hazards. Critical overflow throws
rather than silently hiding warnings; particles may drop on cosmetic overflow.
No GameObjects are allocated during update. Cancellation purges owned particles;
backward seek clears burst history; shutdown destroys views, mask and textures.
The court mask excludes safe arrival ground. Organic layers stay below actors;
contact highlights are brief and restrained. Canvas uses normal blending, with
ADD contact highlights only under WebGL. No shader dependency.

Evidence: [delivery and checks](README.md), evidence/behavior.json (620 checks),
network.json (20 positive/walk-dodge cases, solo counter and normal AI in3phases),
network-extended.json (8 actual room facings, ultimate failure/safe pocket,
phase3 lucid damage and late join), production.json, art.json.
Damage timing receipt uncertainty is ±125ms (30Hz simulation,50ms patches,
75ms observation);50ms recorded clips are not perfect network synchronization.
The moving contact graphic depicts one nominal30Hz sweep, not a lag-free guarantee.
Desktop1280×720 and emulated390×844/844×390 inspected; orientation preserves
session. Hardware phone/GPU and continuous balanced victory remain unverified.
No user visual approval or balance approval is implied.

## Asset requirements
ImageGen sources, prompts and receipts are retained for8 idle views,32 cast poses
(4 per facing),8 dissolution poses,11 distinct8-frame ability atlases and palace
kit. Source art is unchanged; measured component packing fixes irregular cast
rows that previously clipped crowns. No procedural stand-in remains for these
core materials. Runtime idle-based royal gliding is not an authored walk cycle;
the shared south-east death dissolve is not8 separate death directions. Phase
transitions reuse cast/aura material rather than unique cinematic animation.
Audio is three original synthesized chimes, not recorded Thai instruments,
voice acting or a bespoke score. Additional locomotion/cinematic/audio artwork
is a polish requirement if those capabilities are desired. Eight artwork frames
and60Hz rendering do not imply60 authored animation frames or final art approval.

## Integration and reuse
maiyarap-encounter.ts owns the FSM and hit events; shared maiyarap.ts owns geometry
and skill parameters. Independent schema maiyarap state reuses BossHazardState;
its actor tag denotes awake/dream/both only within this encounter. MaiyarapVfx
and maiyarap-pose are shared between world and the88 recorded-clip preview.
React HUD receives summaries, never authoritative hit decisions. The new palace
is an actual GameRoom review arena, not a new atlas/portal adoption. Shuten and
other bosses are unchanged. Reuse this separation for future bosses, not this
boss's Thai motifs, provisional balance or dream-puzzle rules.
