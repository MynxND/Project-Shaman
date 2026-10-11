# Project Shaman — central skill design system

Mandatory policy adopted 2026-10-09. Source: [user rules](docs/design/skill-system/source-rules.md). Source formulas remain in [370-skill database](docs/design/skill-database-source.txt); unresolved design is never treated as zero cost, unlimited range or approved balance.

## Ownership

`packages/shared/src/skill-system.ts` is the framework-independent behavior/VFX policy and Medium presentation registry. React owns menus, Phaser owns visuals/camera, Colyseus must own learned skill validation, targets, costs, cooldowns, interruption and damage. The visual lab never grants skills or applies client-side combat. Selected summaries may enter Zustand; entity positions do not.

Each presentation references skill ID, one explicit behavior, one VFX family, source cast duration, shared circle ID or null, release effect or null and aura or null. `validateSkillPresentation` rejects incompatible presentation data. `SKILL_BEHAVIOR_POLICY` is the common generation, cast and hotbar policy. Do not copy these decisions into per-skill render branches. The legacy `SkillDefinition.kind` remains a compatible source label; it does not replace explicit behavior.

| Behavior | Required runtime behavior |
|---|---|
| ACTIVE_CAST | pose + ground circle synchronized to CT; success release, cancellation no release |
| ACTIVE_INSTANT | immediate action/brief flash; no full pose or circle |
| ACTIVE_CHANNEL | controlled loop during authoritative channel; stop on end/interruption |
| PASSIVE_STAT | stat/modifier only; no cast/circle/release/aura/new VFX/hotbar |
| PASSIVE_TRIGGER | condition/event only; significant cue permitted, no inactive loop or casting |
| PASSIVE_AURA | subtle state-bound aura; no repeated cast; remove when inactive |
| TOGGLE_BUFF | activation cue + state-bound aura; off removes it; UI reflects actual state |

Medium's five passives are PASSIVE_STAT, including race resistance, equipped-weapon modifiers and out-of-combat regeneration. Existing passive animations are archived experiments and must not be rendered as skill effects. Keep their icons for the tree. `spiritSenseDamageMultiplier` implements the source 2%/level reduction for Undead/Demon (cap 20%) as a pure modifier, with no VFX. It is tested but combat integration is pending the authoritative combat system.

All 370 source entries have audit records with exact text and provenance. The 360 non-Medium suggestions require design review, including the source's passive-labelled toggle Blood Magic. A skill name containing Aura does not establish an aura requirement. The passive-aura preview is a **visual test fixture**, not a newly approved Medium skill or new gameplay formula.

## Known gameplay decisions

SP costs, target range in world units, tile-to-world size, Ghost Sight detection area, cast interruption rules and ambiguous percentage bases remain unresolved. Do not change supplied damage/heal/slow/cast formulas to make a demo playable. Authoritative *effects* (SP cost, targets, damage, healing, slows, reveals) stay blocked until these are specified. Exception approved by the user 2026-10-09: **cast-only execution** (`packages/shared/src/skill-cast.ts`). The server checks the skill is learned, runs the source CT and cooldown, rejects casting while moving or busy, and cancels on walking (no release, no cooldown). It broadcasts start/release/cancel so every client draws the cast. Superseded the same day by the starter-zone brief, which asked for skill damage against monsters. The server now spends SP and applies source formulas on release, using the provisional MATK, SP costs and world ranges in `packages/shared/src/combat.ts` (docs/design/combat/README.md). Those inputs remain open design decisions, not approved balance. Without a target, offensive skills still cast at the presentation point ahead of the caster and hit nothing. Instant preview and aura toggle controls are explicitly demos.

## Delivery gate

Audit → bible/policy → classify → one gold PixelLab circle → one existing CT skill → test timing/layering/interruption → family variants → stat modifier without VFX → state-bound aura prototype → remaining migration. Require typecheck/build, behavioral policy tests, desktop/portrait/landscape UI inspection and saved screenshots. Do not claim 370 combat skills are implemented merely because 370 records are classified.

