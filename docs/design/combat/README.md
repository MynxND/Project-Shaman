# Combat rules (provisional, 2026-10-09)

The starter-zone brief asked for monster combat, EXP and levels, and to "adapt numerical stats to the game's actual
combat balance". No combat numbers existed, so every value below is a placeholder sized for a level 1-10 zone. All of
them live in `packages/shared/src/combat.ts` and are easy to change. The source skill formulas from `design.json` are
used as written; only their missing inputs are provisional.

## Player

| Rule | Value |
|---|---|
| Max HP | `120 + 30 x (Lv-1)` |
| Max SP | `40 + 8 x (Lv-1)` |
| ATK (basic staff strike) | `10 + 3 x (Lv-1)` |
| MATK (skill formulas) | `14 + 4 x (Lv-1)` |
| EXP to next level | `round(20 x Lv^1.7)`: Lv1 20, Lv2 65, Lv5 307, Lv9 838 |
| Level-up | +3 status points (no stat system yet), +1 skill point, full HP and SP |
| Basic attack | reach 1.8 units, every 0.9 s; walking cancels it; a skill pauses it |
| Regeneration | +3% HP and +4% SP every 4 s, after 5 s out of combat |
| Downed (0 HP) | no actions for 3 s, then back at the map spawn with half HP; no EXP penalty |

Damage is `(ATK or skill value − DEF/MDEF) x 0.9..1.1`, with a minimum of 1.

## Skills (formulas from the source; SP and range provisional)

| Skill | Effect | SP | Range |
|---|---|---|---|
| Spirit Bolt | `MATK x (1 + Lv x 0.15)`, x1.3 vs Undead/Demon; hits about 0.4 s after release | 6 | 9 |
| Soul Heal | self heal `MATK x (1 + Lv x 0.2) + MaxSP x 0.05` | 10 | self |
| Amulet Blast | `MATK x (1.5 + Lv x 0.2)` to every monster within 1.5 units (3x3 cells, one cell taken as one unit) | 12 | 7 |
| Binding Thread | movement −(20% + 10% x Lv) for 5 s, provokes | 10 | 7 |
| Ghost Sight | no effect yet (no hidden monsters exist) | 8 | self |

**Casting.**
- SP is checked at cast start and spent on release.
- A cast that can no longer pay fizzles.
- Without a selected monster, offensive skills still cast but hit nothing.

## Monsters and rewards

- **Leaf Wisp, Lv 1.**
  - HP 40, ATK 6, DEF 0. Speed 1.2.
  - Passive. Leash 8. Reach 1.3, attacking every 1.7 s with a 0.45 s wind-up.
  - 8 EXP. Drops: herb bundle 50%, spirit flower 5%.
- **Rewards.** EXP, loot and quest kills go to the player who lands the killing blow. Loot goes into the bag if carry
  weight allows.
- **Monster AI** (shared `monster-ai.ts`, run by the server):
  - Idle and wander stay inside the spawn region.
  - Aggressive monsters aggro within range. Passive ones fight back only when hit.
  - Chase and attack with a wind-up. They return home past the leash, healing on the way.
  - Never act on a player inside a safe zone. Blocked ground is respected.
  - Dead, then respawn at a fresh valid point in the region.

## Full starter roster (2026-10-09, provisional)

| Monster | Lv | HP | ATK | DEF/MDEF | Speed | Behaviour | Reach / delay | EXP |
|---|---|---|---|---|---|---|---|---|
| Leaf Wisp | 1 | 40 | 6 | 0/0 | 1.2 | passive | 1.3 / 1.7 s | 8 |
| Cursed Strawling | 3 | 95 | 11 | 2/0 | 1.0 | aggro 3 | 1.4 / 2.0 s, 0.7 s wind-up | 18 |
| Wandering Spirit Flame | 4 | 70 | 14 | 0/8 | 1.4 | aggro 6, ranged | 5 / 2.2 s, projectile 6 u/s | 24 |
| Shadow Macaque | 5 | 130 | 17 | 4/2 | 3.2 | aggro 5, leash 6 | 1.3 / 1.1 s | 36 |
| Clay Guardian | 7 | 260 | 26 | 14/4 | 0.8 | aggro 3.5 | 1.6 / 2.6 s, 0.9 s wind-up | 60 |
| Cursed Rootkeeper (boss) | 10 | 1400 | 34 | 10/10 | 0.9 | aggro 4.5, leash 12 | 2.2 / 2.4 s; slam 40 in 2.2 u every 8 s (1.2 s warning); summons wisps below 60% | 420 |

Races feed Spirit Bolt's ×1.3: Strawling and Rootkeeper are Demon; the Spirit Flame is Undead.
