# Ranged VFX art08 — remaining fourteen

User requested completion of the fourteen effects after the three art07 prototypes. Original ImageGen material atlases replace the rejected thin procedural presentation for every remaining ranged species. This is enemy basic-attack art, not migration of non-Medium player skills or PASSIVE_STAT generation.

## Distinct motifs and preserved reach

The motifs adapt existing game lore/encounter-05; projectile powers and numerical ranges are game design, not claims about historically documented supernatural attacks. Ireland placement follows the user's game lore.

| ID | Enemy | Attack | Base reach / speed (world units) |
|---|---|---|---|
| phi-krasue | ผีกระสือ | สะเก็ดไฟกระสือ | 2.6 / 5 |
| ubume | อุบุเมะ | ห่อผ้ามายาใบไม้ | 3.1 / 4.5 |
| cheonyeo-gwishin | ผีสาวอาลัย | เส้นผมอาลัย | 3.4 / 6.5 |
| mulgwishin | ผีน้ำเกาหลี | มือผีน้ำ | 3.8 / 5.5 |
| gumiho | จิ้งจอกเก้าหาง | เปลววิญญาณเก้าหาง | 6.1 / 8 |
| chonggak-gwishin | ผีหนุ่มอาลัย | ชายแขนเสื้ออาลัย | 3.2 / 6 |
| rusalka | รูซัลกา | ปอยผมธารา | 4.4 / 5.8 |
| utburdur | อูตบูร์ดูร์ | เสียงครวญผ้าห่อ | 4.1 / 6.2 |
| nu-gui | นฺหวี่กุ่ย | แพรอาฆาต | 4.2 / 6.4 |
| shui-gui | สุ่ยกุ่ย | กรงเล็บสายน้ำ | 3.9 / 5.4 |
| huli-jing | หูหลีจิง | เงาลวงจิ้งจอก | 5.7 / 7.8 |
| nokken | เนิกเคน | สายกกลวงน้ำ | 5.4 / 5.2 |
| fossegrim | ฟอสเซกริม | คลื่นซอแห่งน้ำตก | 6.8 / 9 |
| mare | มาเร | เงากดทับฝันร้าย | 4.6 / 6.8 |

Krasue has jagged phosphorescent fire tongues; Ubume has an empty cloth/leaf bundle; Cheonyeo a dark hair veil; Mulgwishin a five-finger water hand; Gumiho a nine-tail flame fan; Chonggak a tied sleeve knot; Rusalka wet tresses/willow; Utburdur cloth-edged wail crescents; Nu Gui embroidered crimson silk; Shui Gui three water talons; Huli Jing a fox-head/three-plume mirage; Nokken hooked reeds; Fossegrim waterfall sound crescents; Mare overlapping shadow palms. No new freeze, sleep, pull, AoE or client-side damage.

## Assets and renderer

Each original transparent source and exact built-in ImageGen prompt is retained in sources/ and prompts.json. Fossegrim's first output contained divider lines and was corrected with ImageGen before use; rejected output is identified in provenance. No monster character frame, existing comment, NPC, portal, map layout, resident count, attack range/speed or damage formula is replaced. The three art07 assets remain intact.

pack-vfx-08.py measures the returned dimensions, cuts4x2 authored material frames, nearest-scales each to112px within160px, then bakes8 rotations. The diagonal112px square fits the160px cell without clipping. This is eight orientations of one authored material animation, not independently generated character poses. Source alpha remains untouched; no background removal or AI frame interpolation in code.

Map-scoped Phaser loading consumes only required styles. The shared art layer retains a32-flight/128-image budget, short source flash, coherent travelling core, two faint afterimages, and separate hit/disperse phases. The leading edge reaches fixed aim at the existing server deadline; a positive server damage event starts the impact. Misses fade without a hit burst. Scene disposal removes images and owned textures.

ports-0.png and ports-1.png are BEFORE diagnostic sheets of existing native impact poses (red marks are attachment annotations). Manual corrections now place Krasue at mouth/head edge, Cheonyeo at the hairline and Fossegrim at fiddle/bow rather than the lower water arc. Hidden rear attachments use the visible actor edge; they do not magically become a3D rig. Current ports/overrides remain canonical in ../live-06/ports.json and ../emission-overrides.json.

## Actual-game review

Open /?map=lantern-paddy&rangedReview=1&vfxBatch=remaining as an unsaved guest. The development-only isolated room uses the actual FoundationScene, Colyseus CombatSystem/AI and normal MovementController/stepMovement. Four Korean enemies here are test fixtures only; their national maps remain planned. The fourteen matrix is238 cases:112 stationary hits,112 actual walking dodges and14 out-of-range checks. Normal game rooms and saves remain separate.

The recorder now saves both flight and server-confirmed impact snapshots. Export through the UI, then run node tools/monsters/folklore/publish-live-audit.mjs <export> --remaining. It rejects missing cases, failures or missing flight/impact images and builds /monster-review/ranged-vfx-08/index.html with monster and phase selectors. Local metrics go into live-results.json. Technical checks never substitute for visual review or user approval.

## Validation

Art-layer tests cover all17 unique styles x8 views, direction/pivot, linear fixed aim, authoritative impact, miss fade, object budgets and teardown. Existing folklore, ground origin, source-impact deadline, encounter/range/dodge and legacy orb tests pass; typecheck and guest-only real-room/production exclusion tests pass. Final browser audit, screenshots and production build are recorded after completion.


## Final evidence

All238 unique cases passed:112 hits,112 normal walking dodges,14 outside range. Final maximum arrival/damage difference 48.6ms; minimum walked dodge distance 2.672 world units; launch-to-damage 561.3–1081.9ms. These are local-machine observations, not simulated internet latency or physical-phone performance claims.

Visual inspection covered all14 x8 flight and hit views via actual-game contact sheets. Initial360px crops cut long-range north/south actor/effect tips; all28 vertical hit cases were replayed from a freshly loaded scene using520px crops. merge-vfx-08.mjs validates actual PNG height and unchanged range/flight/frame, replaces only those28 matching cases and retains238 unique cases. framing-rerun.json records provenance; no missing pixels were fabricated. Earlier stale-recorder crops were discarded from final evidence.

The final gallery contains224 actual Phaser images; desktop-impact.png shows its controls/context, overview.png compares14 east-facing flights from actual scenes. Desktop and390px portrait/844px landscape selectors/readability were inspected; screenshots retained. Report supports selecting14 enemies and flight/confirmed-impact phases, with a link to the existing animated preview. Workspace typecheck/build,17-art-profile lifecycle tests, alpha/diagonal-border checks, legacy folklore/orb/encounter tests and the real guest/production-exclusion room tests passed. User art approval remains open.
