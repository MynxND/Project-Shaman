# Indonesia skill VFX — design review (proposal, 2026-10-10)

Status: **proposal awaiting user review. Nothing generated.** User chose Indonesia next for its melee assassin branch.
Source: `docs/design/skill-database-source.txt` lines 677–837. Catalogue: `packages/shared/src/skills-indonesia.ts`
(30 skills, tests `skills-indonesia-test.mjs`), lab tabs in `/skills`. Visual language: `INDONESIA_VFX_LANGUAGE.md`.
Process learned on Thailand: nation language first, batch proposals, one approval per batch, ASCII prompts, icon sheets.

## Behaviour (changes from the automatic audit marked ★)

Branch A Santet Master → Santet Overlord (ranged curses): Black Magic Dart (cast, projectile), Curse of Agony (cast,
target, DEF/MDEF down), Soul Pluck (cast, heal block), Poison Cloud (cast, zone 5×5), Voodoo Link (cast, tether),
Curse of the Archipelago (cast, screen-wide), Mass Decay (cast, zone 9×9), Heart Stop (instant). Passives: Dark Aura,
Santet Reach, Hex Amplify, Shadow Ward, Overlord's Curse = stat (no VFX); Malice, Endless Agony = trigger (reuse art).

Branch B Keris Master → Keris Shadow Blade (melee poison assassin): Poison Blade (instant buff 60 s, aura), Keris
Thrust, Venom Spit (projectile), Assassinate (dash), Shadow Flash Strike (all instant), Shadow Stealth (instant, stealth
cue), Fatal Assassination (cast 0.5 s), Shadow Clone (cast; the clone is a tinted copy of the caster, only the summon cue
is new art). Passives: Venom Mastery, Keris Mastery = stat; ★ Silent Step, ★ Backstab Expert, ★ Shadow Master =
stat (pure modifiers, audit said trigger); Toxic Blood (poison status), Venomous Overdrive (reuses Poison Blade aura).

16 new effects + 2 icon sheets. Dual keris (two blades) is a visual choice the source does not specify — pending.

## Batch 1 (prompts.json) and estimate

| Effect | Size | Seed ≈ | Animation ≈ |
|---|---|---|---|
| black-magic-dart | 128×64 | 4 | 2 |
| curse-of-agony, poison-blade, shadow-stealth, shadow-clone | 128×160 | 6 each | 4 each |
| soul-pluck, heart-stop | 128×176 | 6 each | 4 each |
| poison-cloud | 192×128 | 6 | 5 |
| voodoo-link, assassinate | 192×64 | 4 each | 3 each |
| curse-of-the-archipelago, mass-decay | 256×160 | 8 each | 8 each |
| keris-thrust | 160×96 | 5 | 3 |
| venom-spit | 96×48 | 3 | 1 |
| shadow-flash-strike, fatal-assassination | 160×160 | 6 each | 5 each |
| **Total** | | **≈ 90** | **≈ 67** |
| Icon sheets (2 × 15) | 256×256 | 18 | — |

Thai names proposed for all 30 skills (`skills-indonesia.ts`), pending approval.

## Batch 1 result (2026-10-10/11)

User approved theme (black-indigo + antique gold + poison green), dual keris, all 16 seeds, both icon sheets and all 16
animations. Animations charged 69 in total (per-job lines in LEDGER.md); two submissions were refused transiently and
resubmitted once. All 30 icons and 16 effects are published in `apps/client/public/assets/skills/indonesia-v1/` and shown
in the `/skills` Indonesia tabs (lab now handles projectile, dash trail and impact placements).
Free post-passes (`publish_indo_vfx.sh`): per-nation pale ramp (bone-white smoke for Indonesia instead of Thai lilac),
Shadow Stealth white silhouette cleared, Fatal Assassination's off-theme red/yellow arcs retinted to poison green/gold
(`post_thai_vfx.mjs --retint`). Evidence: `batch1-animated-santet.png`, `batch1-animated-keris.png`, `dart-in-lab.png`.
