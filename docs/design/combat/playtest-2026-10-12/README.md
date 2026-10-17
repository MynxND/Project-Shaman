# Combat and weapon playtest — 2026-10-12

User scope: play the existing Claude integration, then fix weapon presentation issues. No paid generations,
new maps, balance changes or approved art replacements in this round. This is a smoke review, not approval of
every skill/frame or a physical-device certification.

## Fixes delivered

1. `preloadModularRig` now loads the existing eight `attack-cast` hand-overlay sheets. The renderer already
   requested these keys, but they were not queued, leaving weapons above the fingers during magic basic attacks.
2. Player `swing` events include the authoritative `attackDelayMs` (including ASPD modifiers). V3 one-shots
   speed up when necessary to fit that interval. The scale resets on returning to idle/walk. Dagger halves
   still alternate; minimum 33ms per frame preserves readability. At intervals shorter than that floor,
   successive events can still interrupt a pose; no claim of unlimited-ASPD visual coverage.
3. Chat/quest fold when entering a compact viewport, and minimap folds when entering a short viewport.
   Previously this happened only on mounting, so desktop → portrait/landscape left open panels over skills.
   Manually reopening a panel still works; listeners are removed on unmount.
4. Existing offline `?rig=preview&pose=attack` supports `&weapon=keris` / `staff-rune-seer` / other known item IDs,
   using the actual CharacterRig weapon selection in eight facings. No profile changes. Male row uses V3;
   female row remains the legacy rig, not evidence of female V3 support.

## Repeatable development QA

Open `/?map=whispering-spiritwood&combatReview=1&reviewBranch=rune-seer`, enter as guest, expand Combat QA,
and press เตรียมสายทดสอบ. Choose another branch before preparation, or reload for a fresh guest.
The panel only mounts in development and only appears for guests. It sends existing dev advancement messages
and ordinary `skill:learn` requests, waiting for server-confirmed profiles. No client-side skill unlocks,
damage, or profile writes. It prepares Base 60, tier 3, every branch skill Lv1, then offers the existing
warp/heal commands and ordinary casts. Therefore these are not progression/economy/balance playtests.

## Browser observations

Real localhost Phaser + Colyseus, in-app browser. Desktop captures at 1280×720; responsive checks at 390×844
and 844×390. DOM records and screenshots accompany this file.

| Branch | Observed |
|---|---|
| Keris | Tier 3, all 15 branch skills learned at Lv1; poison buff status; Q selects/moves to target; kill EXP; eight-facing rig preview |
| Rune Seer | Tier 3, staff assigned, four-slot rune queue; Ice Wall cast presentation and cooldown |
| Onmyoji | Tier 3, fan assigned; Wood+Water held ring; Invoke resolves Spring Rain and the player gains its status; selected distant monster correctly refused before retry |
| Miko | Tier 3, gohei assigned; Suzu Bell Blessing status and release art |
| Juggernaut | Tier 3, axe/shield assigned; Wolf Spirit Armor status/release; Guard gauge |
| Taiga | Tier 3, axe assigned; Berserker Blood status/release |
| Achan Saiyasat | Tier 3, staff assigned; Hun Phayon visible after uninterrupted casting; Sacred Thread cast |
| Mor Phhee | Tier 3, knife assigned; Ghost Possession status/release |
| Santet | Tier 3, wand assigned; initial Poison Cloud deliberately interrupted by walking/Q; separate stationary retry recorded |
| Ullr Hunter | Tier 3, bow assigned; Rune Trap cast, falcon visible and EXP from combat |

The initial batch immediately pressed Q after each representative skill. This can correctly cancel non-instant
casts while walking; those captures prove input/interruption, not successful release. Achan and Santet were
retested stationary. Some later captures occur after brief effects expired. Not every effect has a release-frame
screenshot. Browser console error checks during the seven-branch batch were empty.

After reloading updated client code, compact chat/quest and short minimap fold correctly. Onmyoji branch,
learned hotbar and HP remain across portrait/landscape resize; hidden small-screen class subtitle is not lost
profile data. No document horizontal overflow at portrait (scrollWidth = innerWidth = 390).
The browser retains a fine pointer: this checks small-window layout, not the coarse-pointer touch arc,
joystick/multitouch, physical phone performance, safe-area hardware, or every mobile skill page.

## Automated verification

- Workspace `pnpm typecheck` and `pnpm build` passed; final client build passed after HUD/review changes.
- Full `pnpm test` passed after attack cadence/overlay changes, including all nation effects, server cast
  timing/interruption, network, jobs, equipment and persistence.
- New `attack-timing-test.mjs`: normal cadence, fast dagger half, frame-readability floor, legacy events;
  real CombatSystem verifies broadcast delay equals the scheduler and changes with Wolf Frenzy.
- Phase 5 repeat: 20 players / 22 monsters, average tick 0.16ms, worst 1.3ms (server simulation only).
- Existing test SDK warnings about unhandled initial profile/vitals and the intentional hard-restart connection
  close remain non-failing. Node's direct TypeScript import emits a module-type warning in the new test.

## Still open, in recommended order

1. **Weapon-specific source animation:** bow, ritual knife, axe+shield and two-hand axe clips are now published
   (see ../../character-v3/weapon-class/WEAPON_ATTACK_03.md) pending user visual approval.
   Staff/fan/wand/gohei branch weapons now each have a distinct cast attack (same document); only novice staffs share
   the point-and-cast action.
2. **VFX readability (code fix, option B chosen by user; awaiting visual approval):** Wolf Spirit Armor and Ghost
   Possession now open in front of the caster for 280ms (fading), then continue behind the body (`revealMs` in
   RUSSIA_VFX_MAIN / THAILAND_VFX_MAIN). Casting/area circles turn inside a ground-squashed container, so the ellipse
   stays flat instead of standing upright. No new art. The release art still has an opaque figure at its centre; an
   art regeneration (option C, credits) remains possible. Captures: ../vfx-readability-2026-10-12/ (before-*/after-*).
3. **Mobile physical input + long skill lists:** portrait/landscape on real coarse-pointer devices, touch paging,
   Invoke access, target selection, cast interruption and joystick together. Narrow fine-pointer desktop hotbar
   still occupies several rows, although chat no longer opens over it after resize.
4. **Exhaustive combat QA:** every active and all variants with two clients, moving targets, wall collision/break,
   summon replacement, resurrection, stealth/aggro, repeated map travel and every weapon's eight-direction grip
   through a full frame scrub/high-ASPD sequence. Existing automated coverage does not replace visual review.

Technical passes and these screenshots do not constitute user visual approval.
