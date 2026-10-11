# Ullr Hunter in the real game — slice 1 (2026-10-11)

The first nation branch whose skills run on the authoritative server (GAME_INTEGRATION_PLAN.md, slice 1).
The catalogue formulas (`packages/shared/src/skills-norway.ts`) are written once as code in
`packages/shared/src/hunter-combat.ts` (`HUNTER`). Nothing parses description text.

## Where things live
| Part | File |
|---|---|
| Formulas, derived stats, crit, bow basic attack, companion | `packages/shared/src/hunter-combat.ts` |
| Cast/cooldown rules for nation skills, combat specs (SP, range, aim), variants | `packages/shared/src/skill-cast.ts` (`castRule`, `NATION_SKILL_COMBAT`, `skillRange`) |
| Monster statuses (root, freeze, blind, mark…) in the AI | `packages/shared/src/monster-ai.ts` |
| Synced state: `MonsterState.statuses`, `PlayerState.branch/companion/statuses`, `ZoneState` | `packages/schema/src/index.ts` |
| Server effects (arrows, falcon, traps, dash, Great Hunt, storm) | `apps/server/src/rooms/hunter-effects.ts` |
| Bow basic attack, routing, status sync | `apps/server/src/rooms/combat-system.ts` |
| Cast validation, Hunter's Stride, `skill:learn`, dev commands | `apps/server/src/rooms/GameRoom.ts` |
| World VFX (same recipes as the /skills lab) | `apps/client/src/game/vfx/NationVfxLayer.ts` |
| Hotbar, skill tree window (K), job change at the trainer, class path | `SkillHotbar.tsx`, `skills/SkillTreeWindow.tsx`, `npc/NpcServices.tsx`, `character/ClassPath.tsx` |

## Skill by skill
| Skill | In game |
|---|---|
| Twin Shot | 2 arrows ATK×(1+0.1Lv), marks the prey 20 s (+2 s × Tracker's Eye Lv); this hunter deals +1%×Lv to its prey |
| Falcon Strike | (DEX÷10+INT÷2)×2×Lv; on a marked prey: revealed 8 s + blind 1 s |
| Ski Dash | 5 units back from the facing (stops at walls), snow trail zone slows 30% 3 s, next arrow +10×Lv crit % |
| Rune Trap Kit | Ground trap (choose the rune with the switch on the hotbar slot: ᚾ root · ᛁ freeze · ᚦ blast + bleed · ᛞ blind), 3×3 cells, 60 s, limit 3 (+1 at Trapper's Craft 3/5; the oldest breaks), every trap that fires adds "trapped" |
| Charged Rune Arrow | ATK×(2+0.4Lv)×2 (full charge = finished cast) ×(1+25% per hunt condition, max 75%); Rune Arrow Mastery: CT −6%×Lv, +4%×Lv dmg, pierces one prey behind |
| Bow Mastery | Range +1 per 2 Lv (max +5) on arrow skills and the bow basic attack, ATK +3×Lv, ASPD +1%×Lv |
| Falcon Bond | Permanent falcon beside the hunter (synced to everyone); basic shots have (LUK÷3)% to send it (×2 marked, ×2 Great Hunt) |
| Tracker's Eye | Mark duration (stealth parts wait for a stealth system) |
| Hunter's Stride | Arrow skills start/keep charging while walking; the bow keeps firing while walking |
| Trapper's Craft | Trap limit and +6%×Lv trap effect (picking traps back up: not yet) |
| Ullr's Volley | 6+Lv homing arrows over every prey this hunter marked within 12 units, ATK×(1.5+0.3Lv) each |
| Great Hunt | 20 s: every hunter attack marks; a marked prey counts all 3 hunt conditions; falcon dives ×2 (party parts wait for parties) |
| Falcon Storm | Zone following the prey, 5×5 cells, every 0.5 s for 4 s: falcon damage×(1+0.3Lv), blind 1 s |
| Rune Arrow Mastery, Hunter's Patience | As above; Patience cuts Charged Rune Arrow's cooldown by 0.5 s×Lv whenever a trap fires |

## PROVISIONAL (not approved design — needs review)
- **Stats:** there is no STR/DEX/INT/LUK allocation yet. `combatStats`: DEX = 5 + base Lv, INT = 3 + Lv÷2, LUK = 5 + Lv÷2, plus worn equipment.
- **SP costs and world ranges** (`NATION_SKILL_COMBAT`): Twin Shot 9 SP, Falcon Strike 12, Ski Dash 10, Rune Trap Kit 10, Charged Rune Arrow 22, Volley 45, Great Hunt 50, Falcon Storm 45. Ranges 6–12 units; only Twin Shot's "9" comes from the catalogue.
- **Bow basic attack:** every Ullr Hunter shoots a bow (range 8 + Bow Mastery). There is no bow item yet.
- **Crit:** LUK × 0.3 %, damage ×1.4.
- **Bleed:** DEX×0.4×Lv per second for 5 s (the catalogue names bleed but gives no numbers).
- **"Trapped" condition:** lasts 6 s after a trap fires.
- **Hunter's Stride movement penalty** (−20% speed while shooting) is **not applied**: client prediction would need the same speed factor.
- **Learning anywhere:** the skill tree window (K) learns skills anywhere, as in RO, with the same server checks as the trainer.

## Dev-only tools (never in production builds: `NODE_ENV !== 'production'`)
`dev:job` (reach the advancement Job Level and finish the job trial; also a "ทดสอบ" button in the trainer panel), `dev:advance {branch}`, `dev:warp {x,y}`. In the browser: `window.__shamanDebug.send(type, msg)` and `engage(monsterId)`.

## Verification (2026-10-11)
- `apps/client/scripts/hunter-combat-test.mjs` drives the real CombatSystem and covers every skill above, plus cast rules and cleanup. The full `pnpm test` passes.
- Browser, desktop: Apprentice → Ullr Hunter, learning in the skill tree, the purple falcon follows, the bow attack kills from range, Twin Shot shows the spirit arrow, impact, damage, cooldown and target frame.
- Browser, mobile portrait: the touch arc holds 8 buttons with a page switch, clear of the joystick.
- Not yet seen in the browser: traps, Volley, Falcon Storm, Great Hunt circle and Ski Dash VFX. These are covered by server tests only.
