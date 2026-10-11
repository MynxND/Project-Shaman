# Game + server integration plan — 5 nations (2026-10-11, proposal awaiting user approval)

Goal: make the Thailand, Indonesia, Russia, Japan and Norway skills **learnable and castable in the real game**, with
the server (Colyseus) as the authority, and the world showing the same VFX as the /skills lab.

## Where we are (survey)

| Area | Today |
|---|---|
| Server | Colyseus 0.18, one `GameRoom` per map, 30 Hz tick, movement + monsters + auto-attack + loot + EXP are authoritative. Skill casting works end-to-end, but only for the **5 Medium actives**; effects are hard-coded per skill in `combat-system.ts` |
| Synced state | Players, citizens, monsters only. No buffs/statuses, ground zones, summons or projectiles in state (casts go out as events) |
| Profiles | In memory per session; lost on restart. Profile has `skills`, `skillPoints`, but **no job / nation** |
| Nation skills | Data + VFX for the lab only. Formulas are text (`formula: string`). Nothing can learn or cast them |
| Client world | `SkillCastLayer` plays Medium VFX only. The lab has the full composer (layers, circles, auras, companions, Japan circles) but it lives inside `MediumSkillLab.tsx` |
| UI | Hotbar (Medium only), trainer learn UI, static class path. No job change, no skill tree window |

Rules kept (architecture.md): server owns combat, cooldowns, resources; client sends intent only; world units, never
screen pixels, decide range; effects run through **typed effect families on the server**, never by parsing description
text; unresolved values block a skill instead of guessing.

## Phases

### Phase 1 — Job system + skill registry (foundation)
- Shared `SKILL_REGISTRY`: every skill (Medium + 5 nations, 160 entries incl. invoked spells) by id → nation, branch,
  job tier, behaviour, cast/cooldown/duration, area (cells), placement, statuses.
- Profile gains `nation`, `job` (`medium` → branch), `jobTier` (1–3), `jobLevel`, `jobExp`. Job change rules as data
  (provisional, user to confirm): Medium job Lv 10 → pick nation + branch at a trainer; branch job Lv 40 → tier 3.
- Skill points per job level; learn/level skills in the branch tree; prerequisites as data.
- One unit = one source cell (`CELL_TO_UNITS = 1`) so `areaCells` and ranges map straight to world units.
- Tests: job change, learning limits, registry completeness (every skill has an effect spec or is marked blocked).

### Phase 2 — Server effect engine (typed families)
`SKILL_EFFECTS[skillId]` = typed specs with formula functions (from the Thai text, written once as code):

| Family | Covers (examples) |
|---|---|
| damage / heal (single, area, projectile, line, cone) | Twin Shot, Frost Bolt, Steam Burst, Slavic Axe Strike, Soul Heal… |
| status (buff/debuff/CC, ticking DOT/HOT) | stun, root, slow, blind, bleed, poison, heal-block, taunt, freeze, marks |
| zone (ground area for a duration, triggers, **blocking**) | Ice Wall (blocks movement, has HP), Rune Trap Kit, Bonfire Ward, Sacred Thread |
| summon / companion | Hun Phayon, shikigami, Falcon Bond falcon (permanent), Keris Soul |
| displacement | dash, pull, knockback (Ski Dash, Thread Snare Web, Mudslide) |
| transformation / mode | Ghost Possession, Gogyō Mandala, Berserker Blood |
| special mechanics | Japan Invoke (2 elements → spell), Norway Rune Cast queue, Santet needle stacks, Guard meter, prai jumps, pamor stages |
| revive / resource | Divine Miracle Resurrection, SP effects |

Schema adds synced `StatusState` (on players and monsters), `ZoneState`, `SummonState` (and the companion), so every
client sees the same buffs, walls and summons. Movement checks `ZoneState` blockers (Ice Wall). Families land one at a
time with representative skills and tests, never as a generic script engine.

### Phase 3 — Client world integration
- Extract the lab's composer into a shared `SkillVfxComposer` used by both the lab and the world `SkillCastLayer`
  (nation manifests, layers, circles by nation/branch/skill, buff auras, companions, Japan archetype circles, rune
  overlays, fast projectiles + impacts). The lab keeps working on the same code.
- Hotbar shows the current job's learned actives; Japan gets the five-element wheel + Invoke; Norway shows the rune queue.
- New windows: **skill tree** (branch tree, points, learn), **job change** at the trainer, status icons on player/target
  frames, zone/summon rendering in the world.

### Phase 4 — Persistence + accounts
Profiles, jobs, skills, inventory survive restarts. Proposal: PostgreSQL (or SQLite for local dev) behind a small
repository layer in the server; simple account login (dev: name + password; later a real auth provider). No credentials
in the repo (env vars only).

### Phase 5 — Balance + polish
Damage curves per job, party EXP, boss tuning, mobile hotbar layout, performance (status/zones at 20 players per room).

## Rollout order (vertical slices — each slice = shared + server + client + tests + browser check)
1. **Job change + Ullr Hunter (Norway)** — the branch the user cares most about; exercises projectile damage, marks,
   trap zones, the permanent falcon companion and fast arrow VFX.
2. **Rune Seer** — Ice Wall (blocking zone with HP), freeze, Rune Cast queue.
3. **Onmyoji + Miko (Japan)** — Invoke input, residue combos, shikigami summons, purification → blessing.
4. **Russia** (Guard meter, bleed hunt), **Indonesia** (needle stacks, pamor), **Thailand** (thread lines, prai jumps).
Each slice ends with a commit to `develop` (never `main`).

## Verification
Shared unit tests per family; server tests driving a real room with the Colyseus client (cast → state/events → damage);
client checks in the browser (desktop + mobile) for each slice; nothing called "done" without a passing run.

## Decisions needed
1. Persistence now or later (Phase 4 before or after the skill slices)?
2. Job change requirements (proposal: Medium job Lv 10 → branch, job Lv 40 → tier 3) and skill points per level.
3. Start order (proposal: Ullr Hunter first).

## User decisions (2026-10-11)
- Persistence after the skill slices. First slice: Ullr Hunter.
- Progression: Ragnarok-inspired, separate Base / Job Level. Tier 1 Apprentice Shaman (Job Lv 10 + advancement quest)
  → tier 2 nation branch (Job Lv resets; Job Lv 40 + branch quest) → tier 3 (Job Lv resets). Base Level never resets;
  1 skill point per Job Level; learned skills/points kept; separate trees per tier; nothing auto-unlocked; prerequisites
  and points validated; thresholds configurable; approved skill data untouched.

## Phase 1 inspection — migration / save-data risks found (before implementation)
1. No database: profiles live in memory (and in travel tickets), so no stored saves break today. Risk later → added
   `profileVersion` + `migrateProfile()` now; every profile entering a room is migrated.
2. Skill points came from **base** levels (+1 each) — conflicts with the rule. Changed: base levels give status points
   only (`LEVEL_UP_REWARD.skillPoints = 0`), Job Levels give skill points. One existing test updated accordingly.
3. Monsters gave base EXP only → Job EXP added (explicit `jobExp` per monster, else base × `jobExpRatio` 0.75).
4. `learnSkill` only knew Medium → registry-driven checks (tier, branch, max, points, prerequisites).
5. Quests had no job filter → `QuestDefinition.job` so branch trials only appear for that branch.
6. Client Character window still uses sample data (`sample-character.ts`), not the profile → Phase 3.
7. Kept unchanged: quest skill-point rewards, starting 3 points + Spirit Bolt Lv1 (existing data, not overwritten).

## Phase 1 result (2026-10-11)
`skill-registry.ts` (10 Medium + 10 branches × (10 tier-2 + 5 tier-3); Japan invoked spells excluded),
`job-progression.ts` (`JOB_PROGRESSION` config, `jobExpToNext`, `gainJobExp`, `advanceJob`, `learnError`,
`migrateJobProfile`), profile job fields, job quests (apprentice trial + one trial per branch), server: migration on
join/travel, Job EXP on kills, trainer `advance` action. Tests: `job-progression-test.mjs`, NPC advancement test; all
shared, server and network smoke tests pass. Client UI for job change / skill tree comes with the Ullr Hunter slice.

## Slice 1 result — Ullr Hunter (2026-10-11)
Job change at the trainer (pick nation + branch), skill tree window (K, per tier), job-aware hotbar (learned actives,
trap-rune switch, touch paging), class path from the profile; nation cast rules + combat specs; typed Hunter effects on
the server (arrows + prey mark, falcon strike/auto-dive/storm, 4 rune traps, Ski Dash, Volley, Great Hunt, bow basic
attack); synced monster statuses, zones and player companion/buffs; world VFX composed from the lab recipes
(NationVfxLayer). Other nation skills answer "not in game yet". Details + provisional numbers:
docs/design/combat/ULLR_HUNTER_COMBAT.md. Next: slice 2 Rune Seer.

## Slice 2 result — Rune Seer (2026-10-11)
Rune Cast queue (4 rune effects, Runestone echo, Cast the Lots reorder, Rune Mastery), Frost Bolt, Blizzard, Ice Wall
(blocks walking on server and in client prediction, HP, melts/cracks), Shatter Rune, Absolute Zero Field, Fimbulwinter,
passives; synced rune queue and wall HP; world VFX and rune HUD. Server tests pass; browser check pending (dev client
did not finish loading during concurrent map work). Details: docs/design/combat/RUNE_SEER_COMBAT.md. Next: slice 3 Japan.
