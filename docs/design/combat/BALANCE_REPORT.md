# Balance report: Phase 5 (2026-10-12)

`apps/client/scripts/balance-sim.mjs` runs every branch's **real server effects** (CombatSystem plus the effect modules) against training dummies for 60 s. Run it with `node scripts/balance-sim.mjs --branch <id>` for a per-skill breakdown.

How it works:
- Greedy rotation: it cycles every ready damaging active the caster can pay for. Basic attacks fill the gaps, cast times block, and there is a 300 ms global cooldown.
- Dummies have Clay Guardian defences (DEF 14, MDEF 4) and face the caster, as in a real fight.
- Two scenarios:
  - **early**: base Lv 15, job tier 2, actives Lv 5, no passives.
  - **late**: base Lv 60, tier 3, every skill at max.
- It measures 60 s of DPS against 1 dummy and against 4 dummies (area value).

**Read the numbers relative to each other.** The stat system does not exist yet: DEX, INT and LUK are derived from base level (`combatStats`). The rotation is not optimal play, and the area numbers depend on how tightly the 4 dummies stand.

## Before → after (single target, × of the median branch)
| Branch (role) | early before | early after | late before | late after |
|---|---|---|---|---|
| Keris (melee DPS) | 132 · ×2.24 | 108 · ×1.71 | 915 · ×0.98 | 938 · ×1.00 |
| Taiga (melee DPS) | 97 · ×1.64 | 108 · ×1.71 | 1565 · ×1.67 | 1764 · ×1.88 |
| Ullr Hunter (ranged DPS) | 83 · ×1.41 | 97 · ×1.54 | 1279 · ×1.37 | 1328 · ×1.42 |
| Rune Seer (caster) | 62 · ×1.05 | 66 · ×1.05 | 1534 · ×1.64 | 1715 · ×1.83 |
| Onmyoji (caster) | 47 · ×0.80 | 49 · ×0.78 | 1180 · ×1.26 | 1228 · ×1.31 |
| Santet (caster) | 47 · ×0.80 | 54 · ×0.86 | 936 · ×1.00 | 936 · ×1.00 |
| Mor Phhee (melee caster) | 59 · ×1.00 | 63 · ×1.00 | 585 · ×0.63 | 631 · ×0.67 |
| Achan Saiyasat (summoner / support) | 30 · ×0.51 | 40 · ×0.63 | 652 · ×0.70 | 702 · ×0.75 |
| Miko (healer) | 27 · ×0.46 | 31 · ×0.49 | 498 · ×0.53 | 517 · ×0.55 |
| Juggernaut (tank) | 27 · ×0.46 | 27 · ×0.43 | 289 · ×0.31 | 327 · ×0.35 |

All damage branches gained a little from the in-combat SP trickle; Keris lost its early outlier.

## What was changed (provisional values only)
1. **`FLAT_ATK_SCALE = 0.4`**
   - Catalogue flat ATK bonuses ("ATK +20 + Lv × 5" Poison Blade, "+3 × Lv" Bow Mastery) were written for RO-scale stats.
   - With the provisional ATK curve (about 52 ATK at Lv 15) they almost doubled basic attacks. Early Keris was ×2.24, coming mostly from basic hits.
   - They are scaled until the stat system exists. The catalogue numbers themselves are unchanged.
2. **In-combat SP trickle:** 1% of max SP every 4 s (`REGEN.combatSp`). Every branch used its whole SP bar within 60 s; now skills last longer in a fight.
3. **Shared EXP** (`SHARED_EXP`, `expShares`). There is still no party system. Rules:
   - Everyone who damaged a monster shares its EXP and Job EXP in proportion to damage.
   - The pool grows +10% per extra helper, up to +50%.
   - The top damage dealer gets the loot.
   - Helpers with ≥10% of the damage get the quest kill.
   - A solo kill gives exactly what it gave before.
4. **Boss (Cursed Rootkeeper) HP 1400 → 3200.**
   - Measured with level-10 apprentices kept alive (Spirit Bolt + Amulet Blast + basic attacks). Before: solo ~15 s, trio ~5 s.
   - After: solo ~70 s, duo ~17 s, trio ~11 s (asserted in `phase5-test.mjs`, solo band 20–90 s).
   - Slam and summons are unchanged.

## Needs design review: outliers from approved catalogue formulas (not changed)
- **Taiga late ×1.88:**
  - Bloodthirsty Wolf Frenzy "ASPD +200%" for 12 s makes basic attacks about 420 DPS.
  - Slavic Axe Strike and Decapitate add about 240 DPS each.
  - Options: shorten Frenzy, lower its ASPD, or accept Taiga as the top single-target bruiser.
- **Rune Seer late ×1.83 (×3567 on 4 targets):**
  - Blizzard deals MATK×(1+0.2Lv) every 0.5 s for 5 s on a 7 s cooldown, about 645 DPS alone.
  - Shatter Rune ×(10+2Lv) adds about 425 DPS.
  - Options: tick every 1 s, or a longer cooldown.
- **Ullr Hunter late ×1.42:** Charged Rune Arrow (×2 charge × up to +75% hunt conditions) is about 510 DPS. It is probably fine for a precision class.
- **Mor Phhee late ×0.67:**
  - The prai mechanic is multi-target; on one dummy it never jumps. In packs it scales with jumps (+15% each).
  - Single target is weak. Option: a higher base curse DOT.
- **Tank / support (Juggernaut ×0.35, Miko ×0.55, Achan ×0.75):** looks role-appropriate. A target band, for example 50–70% of damage branches, needs your decision.
- **Early physical vs caster:** physical branches (Keris, Taiga, Hunter ×1.5–1.7) get free basic attacks, while casters are capped by SP. The stat system (INT, DEX allocation) and weapons will move these numbers more than any skill change.

## Performance (`phase5-test.mjs`)
- Setup: 20 players (every branch, tier 3, max skills) casting nonstop, with 22 monsters fighting.
- Result: average combat tick 0.21–0.24 ms, worst 1.3–1.5 ms, with about 23 zones and 4 summons live. The budget is 33 ms per tick.

## Mobile polish
- The account badge covered the status panel name on phones. It now sits under the minimap in portrait and at the bottom centre in landscape.
- The rune queue, talisman ring and job gauge were checked in portrait above the skill arc.
