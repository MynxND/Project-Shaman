# Koschei — Boss5 VFX contract

Standard: [v1.1](../../../../SHAMAN_BOSS_VFX_STANDARD.md).
Source: [shared Word rules and Boss5 only](source.md). Russia, frozen necropolis;
externalized death in nested relic. Implemented and visually inspected for review;
user art/balance acceptance pending. See [delivery/evidence](README.md).
User authorizes ImageGen, full combat, actual-room testing, preview, commit/push.
Other bosses, unrelated comments, player skills and existing portals stay intact.
Detailed stats, choreography, relic positions and balance below are provisional
game adaptations, not canonical folkloric attacks or approved geography.

## Audit and identity
Phaser3.90 world, React HUD, Colyseus authoritative CombatSystem and schema.
Existing BossHazardState supports world geometry and timestamps; separate boss
state/FSM required. Reuse pooling/clock/preview separation, not dream realms or
Japanese motifs. Owned Russia terrain/stone/snow may be reused. Missing boss,
cast/death and11 organic ability materials use original ImageGen sources.
Cold soul fire, weathered bone, silver-blue chain, dark fur and a spectral oak;
original Slavic-inspired carved ornament, no copied religious script/runes,
Thai crowns, torii, neon lasers or generic geometric flame substitutes.

## Coverage and proposed clocks
|Phase/skill|Source/geometry|Tell/active/recovery ms|Counterplay/art|
|---|---|---|---|
|1 Gravefrost Spear|staff/3 staggered spear lanes|1400/400/1200|step between cold lance lanes|
|1 Deathly Chains|hands/crossed locked capsules|1300/500/1400|sidestep iron frost links|
|1 Necropolis Guard|tomb guards/2 independent predicted rushes|1500/450/1500|leave marked guard routes|
|1 Soul Lance|staff/long narrow locked ray|1200/350/1300|move sideways from soul lance|
|2 Immortal Rebirth|body/ring and bounded healing channel|1600/900/1600|open next relic to interrupt healing|
|2 Cursed Needle|relic/three staggered aimed needles|1200/300/1400|each aim locks before tell|
|2 Royal Necromancy|three tomb nodes/delayed eruptions|1500/600/1500|move between bone courts|
|3 Deathstorm|body/three concentric expanding rings|1500/900/1500|cross bands or use inner refuge; spent ground safe|
|3 Throne of Bones|body/ordered sectors|1600/500/1600|follow visible judgment order|
|3 Soul Severance|body/three re-aimed rushes|1400/400/1600|sidestep separately locked soul cuts|
|3 The Last Needle|oak/relic challenge/finale safe pocket|five stages,32s counter window|open oak/chest/hare/duck/egg then destroy needle|

All skills have separate shared definitions with intent,target,animation,damage,
cooldown,status,cancel,AI,audio and layer mapping. Damage from world geometry,
not artwork. Contact allowance provisional.28 units, ring starts1.2; exact values
must be shared by server/renderer and tested rather than inherited implicitly.

## Exclusive relic rules
One nested relic object at a time on a compact authored route. Interactions
validate stage, distance, living player and rate. No memorized dream symbol
sequence: opening each container releases the next physically identifiable
object. Timed hatch stages are stationary and reachable solo; no chase softlock.
Phase1 teaches opening oak/chest to stagger. Phase2 Rebirth can be interrupted
by opening the next layer; phase3 exposes hidden needle and damage vulnerability.
Ultimate resets to oak, grants visible safe paths, exposes needle; destroying it
cancels pending finale and opens punish window. Failure has a marked safe refuge.
Boss cannot die until needle is broken; never reset player progress indefinitely.
Death/wipe/leave/reset remove pending hazards and restore relics deterministically.

## Presentation/runtime
Independent anticipation,main,trail,contact,secondary,aftermath material clocks.
Authored8-direction actor,3 unique poses/direction across4 timing beats (idle,
raised-staff windup, directional release, reused idle recovery),8 death poses,
11 distinct8-frame organic effect atlases. Preserve original PNG/prompts/receipts.
Ground geometry stays below actors; constrained highlights never hide refuge.
No shader dependency; WebGL ADD highlights only, Canvas normal fallback.
Reduced motion limits flashes/shake; resize preserves session. No PASSIVE_STAT VFX.
Late joins use persistent timestamps, never replay expired contact bursts.

## Budgets and verification plan
24 critical views/64 cosmetic particles; actual choreography max4 hazards.
Each view owns1 Graphics,1 Text and5 images;64 pooled particle images plus1
court-mask Graphics:233 GameObjects. Cosmetic overflow may drop, important tells
throw rather than silently disappear. No per-update GameObject creation;
particles use delta-time age and bounded lifetimes, cancellation purges owners.
Shutdown destroys owned views/mask/particles/textures/listeners. Measurements
are in evidence/performance.txt/png; adapter CPU is not whole-frame/GPU time.

876 behavior checks pass;248 PNG/alpha/hash and directional port checks pass.
All10 attacks have actual-room positive and walk-dodge controls:20cases pass,
all walking dodges0damage and remain in court. Eight real-room lance facings
deal80 each. Ultimate outside refuge190, real walk to refuge0; solo ordered
containers plus ordinary basic attacks destroy needle at~14.3s before32s finale.
Normal AI sampled11s per phase with QA HP/phases, not continuous balanced victory.
Late join sees relic stage, second-client review commands rejected, production
QA commands blocked. Threshold/cooldown/interrupt/deathless/respawn/cleanup tests
pass. Browser desktop and emulated phone portrait/landscape inspected; hardware
phone, GPU, high-latency conditions and Canvas visual certification unverified.
Dedicated preview replays88 real CombatSystem clips at50ms, with pause,seek,
replay,speed and8directions. Network damage receipt uncertainty ±125ms (30Hz
simulation,50ms patches,75ms observer). Nominal33.3ms charge sweep is not a
guarantee of zero visual/network latency. No PASSIVE_STAT presentation added.

19 ImageGen sources retained with prompts/receipts, including2 rejected candidates;
45 PNGs total include originals and packed runtime modules.11 distinct organic
8-frame flipbooks, regional crypt/tombs/frost floor/mist and6 relic props adopted.
No core ASSET_REQUIRED placeholder remains. Royal locomotion is idle-based glide;
death is one shared south-east collapse, not8 separately authored death clips.
Three synthesized cold-bell cues are original functional audio, not recorded
Russian instruments/voice/music. Extra locomotion/in-between/cinematic/audio
polish and user art approval remain explicit;60Hz rendering is not60 drawn poses.

## First actual-room inspection
Gravefrost Spear POC opened in GameRoom with21000HP boss and prepared4000HP
unsaved guest. Three staggered lane warnings/readable countdowns render below
player. Found crown obscured by the existing top HUD at the initial court camera;
Koschei-only lookahead changed from4.5 to7units for a follow-up inspection.
This is not art acceptance or proof that the remaining materials are complete.

## Corrections found during validation
- Rectangular endpoint clamping bent diagonal spear/lance rays away from target.
  Clip by one common ray distance instead; actual8direction damage and unit
  regression pass. Damage/range is not derived from pixels.
- QA phase transition and Rebirth shared a name; the test prematurely sampled
  old phase timestamps. Wait for a new actionAt; no damage/hitbox nerf to pass.
- Authored source crypt crossed its nominal cell; measured cuts preserve roof
  and remove floor gaps. Source release staff crossed column gutters; opaque
  component ownership preserves whole authored staff without adjacent fragments.
- Bright connected flame ports measured separately in idle/windup/release, all
  eight views; source charge uses the matching pose, independent of ground hit
  geometry. World actor scale.9 and lab210/256 are explicit, not camera-dependent.
- Short landscape uses a cover-clamped zoom and10unit lookahead; guest badge
  moves away from actor. Desktop/portrait retain7unit bias. Existing maps unchanged.
- Main organic layers remain below actors; brief restrained highlights do not
  overwrite the gold refuge. Court mask prevents effects on safe arrival.

- Final WebGL inspection found radial tessellation seams in thick warning-ring
  strokes. Use exact thin outer/inner contours; show only the earliest coincident
  future footprint. All repeated damage events/active waves remain authoritative
  and intact. Updated deathstorm screenshot verifies clean boundaries.
