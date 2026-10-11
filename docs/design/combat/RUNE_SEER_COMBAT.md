# Rune Seer in the real game: slice 2 (2026-10-11)

The second nation branch whose skills run on the authoritative server. The catalogue formulas (skills-norway.ts,
Rune Cast rework) are written once as code in `packages/shared/src/rune-seer-combat.ts` (`RUNE_SEER`).

## Where things live
| Part | File |
|---|---|
| Formulas, rune queue rules, Ice Wall cells, `withBlockers` | `packages/shared/src/rune-seer-combat.ts` |
| Cast rules (Rune Reading CT, Rune Mastery CD), combat specs | `packages/shared/src/skill-cast.ts` |
| Chilling Aura (`attackDelayMul`) | `packages/shared/src/monster-ai.ts` |
| Synced state: `PlayerState.runes`, `ZoneState.hp/hpMax` | `packages/schema/src/index.ts` |
| Server effects | `apps/server/src/rooms/rune-seer-effects.ts` |
| Walk map with walls, hearth shield, routing | `apps/server/src/rooms/combat-system.ts`, `GameRoom.ts` (`rune:order`, `rune:set`) |
| World VFX (zones, wall cells, orbiting runes, flares, shield) | `apps/client/src/game/vfx/NationVfxLayer.ts` |
| Rune queue HUD | `apps/client/src/components/hud/RuneQueue.tsx`, `stores/rune-store.ts` |
| Local prediction stops at walls | `FoundationScene.walkMap()` |

## Rune Cast
The server keeps a queue of 4 runes drawn from ᛁ ice, ᚺ storm, ᛈ fate and ᚲ hearth. The seer sees 3 of them, or 4 with Rune Reading. Frost Bolt, Blizzard and Shatter Rune consume the front rune and get its effect:
- **Ice:** freeze chance ×2.
- **Storm:** a single target is knocked back 2 cells; an area grows by +1 cell.
- **Fate:** magic crit and a 20% SP refund.
- **Hearth:** a shield worth 5% of Max HP.

A spell cast within 3 cells of the seer's Runestone gets the rune effect twice. Shatter Rune consumes the whole visible queue: +15% damage per rune, and it applies every rune's effect.

## Skill by skill
| Skill | In game |
|---|---|
| Frost Bolt | MATK×(1.5+0.3Lv), freeze 5%+1%×Lv for 3 s (+0.5 s × Winter's Grasp) |
| Blizzard | 7×7 zone, MATK×(1+0.2Lv) every 0.5 s for 5 s, slow 20%+3%×Lv |
| Ice Wall | 3+Lv cells perpendicular to the cast and taller per level. Blocks players and monsters (server and client prediction). HP 3000×Lv, cracked by monsters pressed against it, melts after 15 s. Cells on blocked ground or on a creature are skipped |
| Runestone | 2 stones, 60 s, echo radius 3 cells |
| Cast the Lots (Prophecy) | Redraws the queue. The three front runes can be reordered for 10 s. The next 3 rune spells deal +5%×Lv |
| Shatter Rune | MATK×(10+2Lv)×(1+15% per rune); a frozen target ignores MDEF |
| Absolute Zero Field | Freeze 2+0.6Lv s, works on bosses |
| Fimbulwinter | Zone of 15 cells following the caster, MATK×(2+0.5Lv) every second for 10 s, slow 90%; every rune drawn meanwhile is ice |
| Passives | Frost Mastery dmg +2.5%×Lv · Rune Reading 4 visible runes and ground spells' cast time −4%×Lv · Chilling Aura: monsters within 3 cells attack 3%×Lv slower · Winter's Grasp: freeze +0.5 s×Lv and frozen targets' MDEF −20% · Rune Mastery: water/ice spell cooldowns −6%×Lv and the front rune can be changed every 10 s · Frost Penetration: ignores 10%×Lv of MDEF |

## PROVISIONAL (needs design review)
- **SP costs:** Frost Bolt 12, Blizzard 32, Ice Wall 25, Runestone 15, Cast the Lots 20, Shatter 35, Absolute Zero 40, Fimbulwinter 80.
- **Ranges:** 6–9 units.
- **Rune effect sizes:** the hearth shield lasts 10 s; the fate crit deals ×1.5.
- **Cast the Lots:** "rune effect +10%×Lv÷2" is applied as +5%×Lv damage on the next 3 rune spells.
- **Ice rune on spells without a freeze:** they get a base 5% freeze chance (×2), so the rune is never empty.
- **Ice Wall damage:** monsters crack walls with their attack value every attack delay. Players cannot attack walls; there is no PvP.
- **Cold Blood:** no effect yet; there is no element or freeze on players.

## Verification
- `apps/client/scripts/rune-seer-combat-test.mjs` covers:
  - the queue and all 4 rune effects, the Runestone echo (double shield), Cast the Lots reordering and Rune Mastery;
  - Frost Bolt and Blizzard (including the storm rune's +1 cell);
  - Ice Wall: blocks, melts and is cracked by monsters;
  - Shatter, Absolute Zero on a boss, Fimbulwinter's ice-only draw and Chilling Aura;
  - cleanup when the seer leaves.
- The full `pnpm test` passes.
- **Not seen in the browser.** During this slice the dev client would not finish loading on any map, with no console error. Another session was changing map, renderer and elevation code at the time, so the cause is unclear. The VFX, Ice Wall visuals and rune HUD still need a desktop and mobile check.
