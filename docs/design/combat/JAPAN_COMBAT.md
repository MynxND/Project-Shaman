# Japan (Onmyoji + Miko) in the real game: slice 3 (2026-10-11)

Rules: `packages/shared/src/japan-combat.ts` (`JAPAN`, residue/kind helpers, player debuffs and blessings).
Server: `apps/server/src/rooms/japan-effects.ts`, wired in `combat-system.ts` and `GameRoom.ts`.
Client: `NationVfxLayer.ts` (Japan circles, zones, shikigami, orbiting talismans, residue marks), `GogyoRing.tsx`, `BuffBar.tsx`, and an Invoke slot on the hotbar.

## Onmyoji: talismans → Invoke → 15 spells
- **Talismans (wood/fire/earth/metal/water):** the ring holds 2, or 3 with Third Talisman; the oldest drops. The ring stays after an Invoke, like Invoker. Others see it orbiting the caster (`PlayerState.held`).
- **Invoke:** unlocked by Onmyō Seal; it is a hotbar slot, not a tree skill. The newest two talismans pick the spell:
  - the same element twice summons a shikigami;
  - a generating pair casts a creation spell;
  - an overcoming pair casts a destruction spell.
- **Invoke cooldown:** 6 → 2 s by Onmyō Seal level. Onmyō Mastery cuts 0.3 s per distinct spell cast in the last 10 s. Gogyō Mandala removes Invoke and spell cooldowns for 8 s.
- **Spell level:** the average of its two talismans' levels. Each element's talisman level adds +3% per level to spells using that element.
- **Held bonuses (per talisman level):** wood regen 0.2% Max HP/s, fire spell damage +2%, earth damage taken −1.5%, metal MDEF pierce +3%, water cast time −3%.
- **Residue (8 s, 16 s in Mandala):** a creation spell leaves its generated element, a destruction spell its winning element, a shikigami its own element.
  - **Sōshō Flow:** the residue generates one of the spell's elements → +30–50% power.
  - **Sōkoku Break:** one of the spell's elements overcomes the residue. The break gives wood → bleed, fire → blind, earth → DEF/MDEF down, metal → +40% MDEF pierce, water → root.
- **Taikyoku Balance:** alternating creation and destruction gives +4% per stack, up to 3. Three of the same kind in a row clears it.
- **Spells:**

| Spell | In game |
|---|---|
| Bonfire Ward | Zone: allies ATK/MATK +10%, monsters burn |
| Ash Barrier | Zone: allies take −20%, monsters inside get a fire residue |
| Kongō Talisman | Shield of MATK×(2+0.4Lv); when it breaks, metal shards hit monsters around |
| Mirror Pond | Lays a pond; casting again swaps places with it |
| Spring Rain | Heal-over-time zone |
| Root Fissure | 7-cell line: damage and root |
| Mudslide | Cone: damage, knockback 2, slow |
| Steam Burst | Single target: damage and blind |
| Molten Swallows | 3 hits, MDEF pierce 20% |
| Leaf Blade Storm | Ticking zone |

- **Shikigami** (synced in `GameState.summons`): 30 s (+10% per Pact level); 1 at a time, or 2 at Pact Lv 5; the newest replaces the oldest. Each acts every 2 s:

| Shikigami | Behaviour |
|---|---|
| Kodama | Heals allies; roots monsters it touches |
| Kitsune | Fire line |
| Nurikabe | Pulls monsters in and pins them |
| Kamaitachi | Dash cut and bleed |
| Mizuchi | Slow aura around the owner, water bite |

- **Ascension:** the current shikigami becomes its great form for 20 s, with ×2.5 power and ×1.5 reach.
- **Gogyō Ring Seal:** damage scales with the number of distinct residue elements within 11 cells; all 5 also silences.

## Miko: purification becomes blessing
Monster blows can inflict debuffs on players (PROVISIONAL, `MONSTER_DEBUFFS`):

| Monster | Debuff |
|---|---|
| Spirit flame | burn |
| Leaf wisp | poison |
| Cursed strawling | curse |
| Clay guardian | weaken |
| Rootkeeper | blind |

Harae, Kagura, Cleansing Rain and Purify cleanse them, and each cleansed debuff becomes its paired blessing:

| Debuff | Blessing |
|---|---|
| burn | warmth |
| poison | vigor |
| curse | blessing (ATK/MATK +) |
| weaken | guard (damage taken −) |
| blind | clarity (damage +) |

Blessings last 5 s, and Blessing Craft makes them stronger and longer.

| Skill | In game |
|---|---|
| Harae Sweep | Cleanses 1+Lv÷3 debuffs from the caster and allies within 4 cells; each becomes a blessing |
| Kagura | Heals allies, cleanses 1 each, chance to reset the cooldown (Divine Grace) |
| Suzu Bell | Allies get ASPD +2%×Lv and dodge 1.5%×Lv for 60 s |
| Ofuda | Holy damage (×1.3 vs undead/demon), knockback 3 |
| Cleansing Rain | Cleanses everything and grants status immunity for 5 s |
| Divine Miracle Resurrection | Revives downed allies where they fell at full HP, invulnerable for 3 s |
| Kotodama | Allies ATK/MATK +5%×Lv for 30 s |
| Sun Pillar | Holy damage zone that also heals allies 10% per second |
| Holy Ward | Damage from undead/demon/spirit blows −2.5%×Lv |
| Priestess Grace | Heals +1.5%×Lv |
| Oracle's Vision | Damage vs bosses +2%×Lv |

All player buffs and debuffs go through one layer that every source reads (damage dealt, damage taken, regen, dodge, attack speed), and they are synced in `PlayerState.statuses`.

## PROVISIONAL (needs design review)
- **SP and ranges:** talismans 2 SP; spells 15–30; summons 30; Mandala 40, Ring Seal 50; Miko 10–100.
- **Spell level and held bonuses:** spell level = average of its two talismans; per-element +3% per level; the held-talisman bonus sizes above.
- **Timings:** residue 8 s; break statuses 4 s.
- **Ring Seal:** base damage MATK×(2+Lv) per distinct element.
- **Shikigami numbers:**
  - Kodama heals MATK×(0.4+0.08Lv) and roots 1.5 s.
  - Kitsune and Mizuchi bite MATK×(0.8+0.15Lv); Mizuchi deals ×0.6 of that.
  - Kamaitachi cuts MATK×(1+0.2Lv) and bleeds 3 s.
  - Nurikabe pulls 2 cells. It does **not** block walking, and monsters do not attack shikigami: their HP is shown only.
- **Not implemented:**
  - Mirror Pond's reflect (monsters cast no spells).
  - Seal Lv5 "hold 2 spell slots".
  - Shrine Path speed (client prediction would need it).
  - Third Talisman flavour for fire and metal; only wood, earth and water are applied.
- **Monster debuffs:** the debuffs on players are new monster behaviour added so Miko's mechanic has something to purify. Chances: 20–50%; durations: 3–6 s.

## Verification
- `japan-combat-test.mjs` drives the real CombatSystem and covers:
  - the ring and Invoke choice; residue Flow (+40%) and Break (blind); Balance;
  - lines, cones and zones; the Kongō shield and its shatter;
  - shikigami: two at a time, replacement, acting on their own, Ascension; Mandala; Ring Seal silence on all 5 elements;
  - Miko: purification → blessing, Kagura, Suzu Bell, Ofuda, Cleansing Rain + immunity, Holy Ward, resurrection, Sun Pillar.
- `invoke-network-smoke.mjs` runs a live server: job change, ring sync, the no-talisman refusal, Invoke → Spring Rain, its zone, and the Invoke cooldown.
- The full `pnpm test` passes.
- **Not seen in the browser.** The shared dev client did not finish loading on any map during this session, with no console error. Other sessions were changing the head-layer, map and renderer code at the time, so the cause is unclear. Japan VFX, the talisman ring and summons rendering still need a desktop and mobile check.
