# Calon Arang — Boss15 review delivery

Implemented only Calon Arang from the selected shared rules and Boss15 Word section.
Indonesia/Javanese ruined temple; all ability choreography, geography and numbers
are provisional original game adaptations. Human visual/balance review is pending.

## Open and play

- Preview: `/boss-vfx/calon-arang` —11 attacks ×8 recorded facings, pause/replay,
  0.25×/0.5× speed, numeric seek and zoom; separate walk/cast/idle/death inspector.
- Actual GameRoom: `/?map=girah-ruined-temple&calonReview=1`.
  Join an unsaved guest, open **ทดสอบในเกมจริง · DEV guest**, prepare, select phase,
  skill/facing, then use the skill or enable normal AI. Direction arrangement is
  accepted only outside active hazards. QA is development-only and single-guest.
- Move with the existing controls, attack effigies normally, use E/interaction
  button beside quarantine wells to cleanse. Cut all current connections in any
  order, approach the source and start a2.4s purification; movement/hits interrupt.
  During the ultimate this cancels pending attacks and grants a4.5s punish window.
  The southern marked refuge remains an alternative to failed counterplay.
- This is a real isolated combat room, **not a new atlas portal or progression adoption**.

## What shipped

Three70/35% HP phases, ten named abilities, five-stage Night of a Thousand Curses,
cooldowns, bounded infection/spread, attackable unordered network, quarantine,
server-validated purification, phase/death/wipe cleanup and normal AI. Colyseus
owns damage; React owns summaries; Phaser reads published hazard timestamps and
actual swept contact intervals. Existing boss mechanics and portals were preserved.

Owned ImageGen artwork:8 idle views;16 unique walk and16 unique cast poses for
each of8 facings;8 chronological shared southeast death poses;11 distinct
16-frame organic VFX atlases; Javanese temple/effigy/well/source props. Sources,
prompts, receipts and hashes are retained under `sources/` and runtime manifest.
Earlier idle/windup/release and rejected NW/NE motion sources remain historical.
No mirrored direction substitution or idle-frame duplicates remain in motion.

Travel-driven gait keeps support phase across facings and ignores teleports.
Cast release is frame10 at authoritative startsAt, with authored recovery.
Anticipation0..7/contact8/active8..15 VFX support ground/charge/main/trail/impact/
particles/aftermath. Materials respect geometry; capsule clusters keep natural
aspect, moving spectres have a separate elevated cosmetic anchor, sectors rotate
with their attack, and the finale uses native-scale clusters instead of enlarging
one256px image across the arena. Exact ground masks preserve the safe hole.

## Tests and evidence

| Check | Result / evidence |
| --- | --- |
| Authoritative behavior |1028 assertions,88 complete50ms clips; `evidence/behavior.json` |
| Artwork/export |905 checks,16 distinct poses per walk/cast facing,11 materials; `evidence/art.json` |
| Motion clock/release |52 checks; `evidence/motion.json` |
| Geometry edges / variable sweeps |58 checks at±.001 units; `evidence/geometry.json` |
| Required placements/routes |10 locations reachable; `evidence/layout.json`; no failed placements |
| Actual GameRoom full timelines |88 skill/facing combinations, real clocks, every ultimate stage; `evidence/facings-0.json`, `facings-1.json` |
| Stationary positive / normal walking dodge |20 cases, all10 attacks damage stationary targets and all walking dodges take0; `evidence/network.json` |
| Normal-attack ultimate counter |Severed4 connections in reverse order, walked to source, countered in16066ms; same network report |
| Ultimate fail/refuge +8 ray facings + late join gate |PASS; `evidence/network-extended.json`;180 final damage outside refuge,0 final damage after walking into refuge |
| Production QA isolation |PASS; `evidence/production.json` |
| Existing boss regressions |Koschei876 and Maiyarap620 behavior assertions pass |
| Shared regression / delivery |Shared test suite, full typecheck and41-route build pass |

Network tests use real movement/attacks in actual GameRoom, with DEV phase/position
arrangement before casts, not post-cast teleport/invulnerability.88 facing tests
run in isolated single-guest rooms, at normal time. Simulation30Hz, schema patches
50ms, observations50–75ms; damage receipts have approximately±125ms uncertainty.
This is **not a continuous balanced-character victory** or approved encounter balance.

Actual-game screenshots cover all ten skills and all ultimate stages. The shared
renderer also has88 contact stills (`lab-matrix.json`) and64 motion keyframe stills
(`motion-visual.json`). Contact sheets are inspection aids, not screenshots of an
online battle. UI numeric seek/report can differ by one paint/report interval;
these images are not frame-exact timing receipts. The automated clock tests and
network receipts establish timing independently.

## Problems found and fixed

- Infection schema lacked zero defaults and produced NaN stacks: explicit defaults
  plus infection/cleanse tests fixed it.
- Some cloth/hair poses exceeded atlas bounds: one enclosing scale per action,
  never independent per-frame scaling. Foreign props at measured crop edges removed. Actor export also removes detached neighboring-cell slivers outside the main silhouette bounds; originals remain unchanged.
- NW/NE walk/cast initially faced sideways:4 replacement sheets use isolated rear
  reference views; original generation is preserved.
- Capsule artwork stretched into thin artificial rays: natural-aspect pooled
  clusters replace anisotropic stretching; funeral spectres stay upright.
- Sector material faced east regardless of quadrant: profile rotates with angle.
- Full-field ultimate enlarged low-resolution art:12 authored clusters at240px
  retain detail. Before/after actual shots are `game-ultimate-41750.jpg` and
  `final-ultimate-41750.jpg`; similar elapsed times, not identical simulation ticks.
- Southern refuge cropped/covered: Calon-only eased follow offset and portrait HUD
  spacing corrected it. `phone-portrait-ultimate.jpg` shows the full escape pocket;
  landscape orientation was inspected during the same actual ultimate.
- A development hot-refresh mixed old/new metrics snapshots: HUD tolerates a
  temporarily absent frame metric; fresh runtime has no new reported error.
- Death now disables residual effigies as well as delayed hazards/tasks.

## Performance / limits

Fixed24 important views,12 reusable material pieces per view,64 cosmetic particles;
overflow of important tells throws rather than silently dropping damage indicators.
No GameObjects or tweens allocated in update. All scene listeners, masks, images,
particles and ResizeObserver handles have explicit cleanup. Exact ground/masks
use Graphics; organic imagery uses authored textures. WebGL-only ADD is guarded;
ordinary sprite/Graphics rendering remains the Canvas path. Owned neutral charge/contact/counter WAV cues are reused from Koschei with guarded unlocked-cache playback; they are not new Indonesian music/voice artwork. Reduced motion omits
the stronger contact flash; there is no fullscreen shader requirement.

IAB desktop1280×720 and emulated390×844/844×390 actual-game inspection used WebGL.
Actual game showed624 scene objects unchanged through repeated attacks and resize,
up to6 simultaneously displayed views in the sampled ultimate, adapter CPU p95
about0.5–2.9ms across sampled attacks and1.1ms in the portrait ultimate; whole-frame
interval p95 about16.8ms over1800 samples. Preview reports adapter CPU separately
from frame intervals. These are local browser observations, not GPU timings or a
guaranteed60FPS result on physical phones. See screenshot HUDs and JSON AX records.

The3840×4080 actor RGBA atlas is about59.8MiB uncompressed;11 VFX atlases add44MiB
before props/other scene assets. Textures are loaded only for this arena/lab.
Physical mobile memory/performance, Canvas pixel output, adverse-network soak,
multiplayer balance, dedicated music/voice production and human art approval
remain unverified/outside this delivery. Death intentionally uses one shared SE
collapse sequence; no eight-direction death claim. No required walk/cast/VFX asset
is currently a placeholder. Other bosses' motion upgrades remain separate work.

## Reproduce / extend

Run from repository root after shared/schema/server builds:

```text
python tools/bosses/calon-arang/pack_art.py
python tools/bosses/calon-arang/art-test.py
node tools/bosses/calon-arang/behavior-test.mjs
node tools/bosses/calon-arang/motion-test.mjs
node tools/bosses/calon-arang/geometry-test.mjs
node tools/bosses/calon-arang/layout-test.mjs
node tools/bosses/calon-arang/network-test.mjs
node tools/bosses/calon-arang/network-test.mjs --extended
node tools/bosses/calon-arang/facings-test.mjs 0
node tools/bosses/calon-arang/facings-test.mjs 1
node tools/bosses/calon-arang/production-test.mjs
pnpm typecheck
pnpm build
```

Reuse the published geometry/timing policy, texture profiles and pool lifecycle
for future bosses, with their own regional materials and actor sockets. Do not
copy Calon's motifs, numeric budgets or test results as another boss's approval.
Read `SHAMAN_BOSS_VFX_STANDARD.md` and fill that boss's vfx contract first.
