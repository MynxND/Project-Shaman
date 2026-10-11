# Russia, Indonesia, Thailand in the real game: slice 4 (2026-10-11)

Rules: `packages/shared/src/nations-combat.ts` (`JUGGERNAUT`, `TAIGA`, `SANTET`, `KERIS`, `ACHAN`, `MOR_PHHEE`).
Server: `apps/server/src/rooms/nations-effects.ts` (one module, shared hooks), wired in `combat-system.ts`.
Client:
- `NationVfxLayer.ts`: Russia, Indonesia and Thailand art, zones, puppet/colossus/clone, needle and prai labels, status pips.
- `JobGauge.tsx`: Guard or pamor stage.
- Stealth fade in `FoundationScene`.
- Buff names in `BuffBar`.

After this slice **every active skill of Medium and the 5 nations is castable on the server** (asserted in `skill-cast-test.mjs`).

## New shared behaviour
- **Monster statuses:**
  - stun (like freeze);
  - fear (flees from the caster, no blows);
  - taunt (forced onto the tank);
  - poison;
  - heal block (no healing on the way home);
  - cursed.
- **Player stealth:** monsters cannot notice or chase a hidden player. Others see the player at 25% opacity.
- **Lethal-blow saves:** Undying Rage and Absolute Soul Defense.
- **Player damage hooks:** damage dealt, damage taken (melee or ranged), dodge and attack speed are combined from every system for every source.
- **Synced state:** `PlayerState.gaugeKind/gauge` and `MonsterState.stacks` (`needles:n`, `prai:n`, `oil:1`).

## Russia
- **Juggernaut:**
  - **Guard:** +5 per blow taken (PROVISIONAL), +20 Taunting Howl, +10 Shield Bash. Titan Stomp spends it all for +1% damage per Guard. Colossus Blood: +2/s with an ally within 3 cells; at 100 Guard, damage taken −15%.
  - Wolf Armor (damage taken −half of DEF%), Snow Fort (ranged/magic taken −10%×Lv), ice ground from Frost Step (DEF +10% standing on it), Taiga Survivor.
  - Absolute Fortress: invulnerable. It does **not** stop moving or attacking yet.
  - Warlord's Command: melee reflect for allies.
- **Taiga:**
  - Axe Strike bleed (chance 10%+2%×Lv; bleed tick PROVISIONAL).
  - Rend, Frenzy ASPD and Wolf Blood scale with bleeding enemies nearby.
  - Blood Scent dashes to a bleeding prey; a kill within 3 s resets its cooldown and the next blow gets crit.
  - Leap Strike, Wolf Pack line, Berserker (HP cost), Wolf Frenzy (×3 ASPD + lifesteal).
  - Decapitate executes non-bosses under 30% HP.
  - Blood Moon (allies +20% damage); Undying Rage (once per 300 s).

## Indonesia
- **Santet:**
  - Black Magic Dart lands 1.5 s later and embeds 1 needle; Soul Pluck lands 1 s later, embeds 2 needles and applies heal block. Max 5 needles.
  - Endless Agony detonates the needles (per needle; Hex Amplify).
  - Voodoo Link shares damage and needles with the nearest monster within 7 cells.
  - Curse of Agony (DEF/MDEF down), Poison Cloud, Curse of the Archipelago (a zone that follows the caster), Mass Decay, Heart Stop (interrupts a blow and stuns).
  - Passives: Overlord's Curse (+% when the target has 2+ debuffs), Malice (SP back), Dark Aura, Santet Reach (+range), Shadow Ward.
- **Keris:**
  - Poison Blade: ATK + chance of deadly poison on basic hits. Venom Spit: blind + poison.
  - Keris Thrust: crits from behind; pamor stage 2+ adds 30% armour pierce.
  - Shadow Stealth: drops aggro; the next hit deals ×1.5 (× Shadow Master); it breaks on attacking or casting.
  - Assassinate (dash + interrupt), Shadow Flash Strike (a kill resets Stealth), Fatal Assassination (a poisoned target ignores DEF), Shadow Clone (a dagger clone that attacks every second for 15 s).
  - **Pamor:** every 3 poison or backstab kills = 1 stage (max 3). Stage 1: ASPD +10%. Stage 2: thrust pierce. Stage 3: the next ultimate deals +10%×Lv, then the stage resets.

## Thailand
- **Achan Saiyasat:**
  - Hun Phayon puppet: HP = caster Max HP × (1+0.2Lv); ATK = INT×Lv; strikes every 2 s; lasts 120 s (PROVISIONAL). Achan's Command teleports it to the target to strike and stun. Phayon Repair heals it. Guardian Link sends 4%×Lv of the caster's damage taken to it.
  - Giant Colossus: replaces the puppet, cleave around its target, 30 s (PROVISIONAL).
  - Sacred Thread square: half-size 2.5 + Ward Mastery Lv, drawn as cords on the ground. Monsters inside are slowed 30%; allies inside are protected.
  - Fortress of Sacred Thread: damage taken −10%×Lv (max 60%) inside 31 cells.
  - Underworld Soul Pull: pulls monsters to the centre, damages and roots them.
  - Curse Breaking: removes 1 debuff (no blessing; that is Miko's signature).
  - Passives: Sacred Aura (your debuffs are shorter), Iron Shield (allies on screen take less), Colossus Resonance (melee reflect), Transcendent Medium (cast time and cooldown −4%×Lv).
- **Mor Phhee:**
  - A prai possesses its host: curse damage every second for 10 s. When the host dies or the time runs out, it jumps to the nearest enemy within 4 cells (marked prey first), up to 3+Lv÷3 jumps, +15% per jump.
  - Ghost Possession: basic hits plant prai, ASPD +3%×Lv, dodge (Agile Spirit).
  - Soul Drain: +20% per jump, heals 30% of the damage. Prai Curse Explosion detonates every prai the caster owns (+20% per jump).
  - Terrorize Howl and Mass Fear (monsters flee), Shadow Snare (root), Ghost Avatar (HP cost, magic crit chance).
  - Passives: Vampiric Instinct, Soul Harvest (MATK stacks), Soul Harvester (cooldown resets), Blood Oil mark.
  - Absolute Soul Defense: sacrifices a prai to survive a lethal blow (once per 60 s).

## PROVISIONAL / not implemented
- **SP and ranges:** melee skills reach 2 units; spells 6–9 units.
- **Juggernaut:** Guard +5 per hit; shield DEF taken as 10 until shields exist.
- **Damage over time:** bleed tick 40% ATK × (1+0.1Lv); poison tick 30% ATK.
- **Summon durations:** puppet 120 s, colossus 30 s.
- **Monsters do not attack summons**, so the puppet and clone only lose HP through Guardian Link; the clone's "3 hits" rule is not used.
- **Passives needing the stat or equipment system have no effect yet:** Vitality Boost, Heavy Armor Mastery, Aggro Mastery, Axe Mastery's flat ATK, Keris Mastery's flat ATK, Phayon Durability.
- **Passives needing player CC or stealth detection have no effect yet:** Iron Will, Unstoppable Will, Pain Killer, Hunter's Mark, Silent Step.
- **Not implemented:**
  - Absolute Fortress does not lock movement or attacks.
  - Ghost Possession's 2-cell melee reach, and dark-element basic attacks.
  - Blood Moon's crit damage.
  - The puppet's "enchanted clay" item cost.

## Verification
- `nations-combat-test.mjs` covers all six branches:
  - Juggernaut: Guard, taunt, stun, the forts, Titan Stomp, Absolute Fortress, Warlord.
  - Taiga: bleed and its ticks, Rend, Frenzy, Berserker, the Blood Scent dash and reset, Leap, execute, Undying Rage.
  - Santet: the delays, needles and sync, Agony detonation, Voodoo Link, Heart Stop, heal block, Poison Cloud, Malice.
  - Keris: spit, stealth and aggro drop, the pamor stage, the clone.
  - Achan: puppet HP, Command, Guardian Link, Repair, the thread square and Ward Mastery, Soul Pull, Curse Breaking, Fortress.
  - Mor Phhee: prai possession, ticks, jumps, explosion, Possession, fear flee, Soul Defense.
- The full `pnpm test` passes.
- **Not seen in the browser.** The shared dev client never finishes loading: the network log shows the SSR head parts (`assets/ssr/parts/*.json`) re-requested in an endless loop. That is the head system another session is editing, not combat code. Slices 2–4 visuals still need a desktop and mobile check once that is fixed.
