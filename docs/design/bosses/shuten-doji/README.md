# Shuten-dōji — first playable boss encounter

User-authorized three-phase Japanese oni encounter, original SHAMAN art. Implementation/review, **not user visual approval**. Numerical tuning outside the user's explicit timings is provisional. The previous fourteen ranged effects remain wired into the production renderer; ten species have national live bindings and four Korean ranged species remain review-only pending Korean maps.

## Enter and review

Play `/?map=mount-oe-fortress`. The normal boundary connection is Snowbound Torii's east edge, portal `oe-gate`, returning through the fortress south boundary `snow-gate`. Existing Snowbound Torii exits, residents, NPCs and map geometry remain intact. This adds a Japanese boss arena; it does not replace the three-map country batch or remove extra maps.

Local development review: `/?map=mount-oe-fortress&bossReview=1`, choose an unsaved guest, expand **ตรวจบอสในเกมจริง · DEV**, **เตรียมทดสอบ**, choose a phase and skill, then **ใช้สกิล** or **เริ่ม AI**. These controls arrange the actual GameRoom encounter; the client does not decide damage or completion. Review commands are absent in production, rejected for saved accounts and when another client occupies the room. Manual scheduling automatically releases when its reviewing guest leaves or another player joins. The ritual-seal button is normal production gameplay.

## Authority and mechanics

Colyseus owns one encounter FSM and two MonsterState actors. Body/head share one HP pool and one reward attribution. Exact phase gates are 70%/35%; burst damage cannot skip a threshold. Transitions last3.2s and are invulnerable. Windup, active, recovery, stagger, dormant and dead modes cancel/clear scheduled work appropriately. Leaving the court/wiping resets after5s. Normal boss respawn remains180s.

| Phase | Skill | Tell | Main counterplay |
|---|---|---:|---|
|1|Oni Crusher|900ms|Three locked-direction cones; final larger shock cone,1200ms final recovery|
|1|Demon Sake|1200ms|Three ground puddles; ignition at2300ms, leave before periodic flame damage|
|1|Mountain Stomp|1100ms|Two expanding annuli; hollow centre and passed wave are safe|
|1|Oni War Cry|1000ms|Locked frontal cone; collision-aware knockback|
|2|Hellfire Sweep|1000ms|270° sweep and delayed explosion;90° rear wedge stays safe|
|2|Demon Legion|1200ms|Two destructible taiko drums,5.5s reinforcement cadence, six living adds maximum|
|2|Blood Moon Leap|1400ms|Locks a bounded velocity prediction; move away before landing and three waves|
|3|Cursed Head|900ms|Separate head warning and swept charging-bite capsule|
|3|Headless Rampage|900ms|Five-hit body combo while head has its own scheduler and warning|
|3|Mount Ōe Cataclysm|1100ms|Sequential fists, four outer ledges collapse; counterplay/exit routes remain|
|3|Wrath of the Severed King|multi-stage|Moon/head → faces → marked flames → head breath → three body shockwaves|

Destroy all three sake altars to reduce ultimate damage to35% of its unweakened value. After that, stand within2 world units of the southern seal and channel2s; movement, damage or death interrupts it. Success prevents head rejoining/healing after the ultimate. Without sealing it rejoins for5s and restores1120HP, capped below the35% boundary. Poise1800 opens a1.8s stagger with25% extra incoming damage, except transitions/ultimate. Damage, ranges and HP are provisional; telegraphs use shared world-unit geometry and never screen size.

Destroyed floor is shared collision state mirrored into client movement prediction. Any actor trapped by collapse is relocated into the court. Summoned adds use existing monster AI, target selection, defense, death and cleanup. Altars/drums yield no EXP/loot farming. A dead boss clears the head, adds, objects, warnings and pending skill tasks.

## Rendering, art and provenance

React owns the Thai HUD and seal/review controls. Phaser reads schema timestamps/geometry, retains64 reusable warning/VFX slots (graphics + material + additive sprite), and uses existing MonsterLayer actors for selection/targeting. Ground warning is below feet; material impact is above. Head actor positions stay authoritative on the ground, with a visual flight lift. Reduced-motion suppresses shake/hover; shake is local and bounded. No player skill registry/classification changes or PASSIVE_STAT VFX.

Original art: armored/frenzy/headless forms, separate floating head and elite oni each have eight real views; each body form has authored windup and strike poses. Five eight-frame material atlases cover impact, sake flames, sweep, spectral breath/faces and falling fist; an eight-prop atlas supplies altars, drums, barrel, shattered gate, wall, banner, blood moon and blade. Body height is about3× player height. Contact anchors and nearest filtering remain separate from hit geometry. Locomotion uses the existing actor movement, not a newly drawn full walking cycle; the three combat poses are not advertised as fluid frame-by-frame motion capture.

PixelLab receipts and original views are archived; initial headless/head-only outputs failed requirements and are not runtime art. The previously authorized ImageGen monster exception supplied corrections and combat materials using only our own art references after PixelLab credits were exhausted. `sources/authored` retains accepted RGBA source sheets; `prompts.json` and `attack-prompts.json` retain captured requests; `material-directions.json` records reproduction directions for the three material requests whose full text was not retained across the restart. `tools/bosses/pack_shuten.py` rebuilds runtime atlases/manifest from repository sources with nearest-neighbor packing, no repainting or third-party art. Japanese ground/cedar/lantern art reuses the existing owned regional kit. [Layout brief](../../maps/mount-oe-fortress/layout.md) records composition and connectivity. [Shader study](../../../research/gdquest-shaders/README.md) records principles and license boundaries.

## Validation

`node apps/client/scripts/shuten-test.mjs` exercises the real CombatSystem with a controlled clock:179 checks for all11 skills, no early hits, locked-aim dodge, sake timing, three real combo hits, threshold gating, shared head/body damage, drum counterplay, interrupted/successful seal, death/wipe cleanup and connectivity under all16 collapse masks. `node tools/bosses/live-test.mjs` boots actual development/production servers to test persistent hazards/head/phase on late join, multiplayer review rejection, normal authoritative movement and absence of production review commands.

Desktop/mobile visual evidence is recorded in `evidence/`; the delivery report records the final inspection and checks. A technical pass does not approve art. Physical mobile hardware, network-stress performance, encounter difficulty and long-duration group balancing require subsequent playtesting.

### Final inspection — 2026-10-16

Typecheck and production build pass. Shared test suite and client test:zone pass. Boss179 authority/geometry/counterplay checks, actual development/production GameRoom tests (including reciprocal portal travel), and136 RGBA atlas-cell checks pass. Desktop1440×900, portrait390×844 and landscape844×390 were inspected in the actual client; resize retained phase/room state. Browser keyboard walking avoided delayed sake ignition at4000/4000HP. HUD overlap, same-tick duplicate death attribution, stale wipe contributions, invalid review skill after phase change and manual-review ownership were corrected. North moon placement was revised after visual occlusion. The public gallery contains23 recorded game views plus original eight-view combat poses.

No claim of final human art acceptance, full bespoke drawn locomotion/death animation, physical-phone GPU measurements or group-difficulty balance. Additive highlights are not physically computed lighting; scenery is an original modular ridge/fortress composition, not a real-site reconstruction.

## Complete VFX migration — 2026-10-16

The later [complete implementation and evidence](complete/README.md) supersedes the historical 64-slot visual renderer and Stomp-only POC scope. All ten skills, ultimate, transitions and death now use the bounded asset adapter. Earlier evidence remains historical.

## Ritual warning redesign — 2026-10-16

The complete renderer now uses [oni ritual telegraphs](telegraphs/README.md) in the real room and lab. Nominal geometry and server collision tolerance remain unchanged; warning progress/deduplication is presentation only.

## Three-phase combat review — 2026-10-16

[Real-room QA and collision-aware warning corrections](combat-review/README.md) follow the ritual redesign. Guest phase arrangements, positive/negative damage controls, AI observations and visual/transport limitations are explicit.
