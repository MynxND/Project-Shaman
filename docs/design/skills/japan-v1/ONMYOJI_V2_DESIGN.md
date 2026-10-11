# Onmyoji v2 — Five Phases invoker (approved by the user 2026-10-11)

User brief: make Japan's Onmyoji the most unique branch — complex mechanics, skills that combine with other skills,
many playstyles, hard to learn, **not stronger** than other branches (same power ceiling; mastery = more options, not
more numbers). Feel similar to Invoker. Replaces the Onmyoji section of `skill-database-source.txt` once approved.
All numbers provisional.

## Core idea in one line

The onmyoji inscribes **elements of the Five Phases (Gogyō: wood, fire, earth, metal, water)** on talismans, then
**invokes** a spell decided by which two elements are held. 2 elements from 5 → exactly **15 spells**, and the
elements' real relations in Onmyōdō decide what each pair does:

- **Generating cycle (相生 sōshō):** wood → fire → earth → metal → water → wood. Pairs that are neighbours here make
  **creation spells**: zones, wards, buffs, heals.
- **Overcoming cycle (相剋 sōkoku):** wood → earth → water → fire → metal → wood. Pairs here make **destruction
  spells**: damage and control.
- **Same element twice** summons that element's **shikigami**.

Players who know the two cycles can read every spell from its pair. That is the skill to learn.

## Controls

- 5 element buttons (each press puts that element in the 2-slot talisman ring, oldest one drops out). 0.15 s per press.
- **Invoke** button (急急如律令 "Kyūkyū nyoritsuryō"): turns the current pair into a spell and stores it in one of
  **2 held-spell slots** (the oldest is replaced). Cooldown 6 s → 2 s by skill level.
- Cast held spells from their 2 slots like normal skills.
- Mobile: the 5 elements sit on a pentagon wheel around Invoke (positions follow the generating cycle so neighbours =
  creation pairs), plus 2 spell buttons. Desktop: Q W E R T + Invoke + 2 slots. Optional **combo notebook**: up to 4
  saved pairs that press the two elements for you (same 0.3 s timing, so it is convenience, not power).

## Element passives while held (like orbs)

| Element | Held bonus (each copy) | Shikigami (pair of the same element) |
|---|---|---|
| Wood 木 | +HP regen | **Kodama** — tree spirit, heals nearby allies over time, roots enemies that touch it |
| Fire 火 | +MATK | **Kitsune-bi** — fox spirit, breathes a line of fire every 2 s |
| Earth 土 | +DEF/MDEF | **Nurikabe** — living wall, blocks movement and projectiles, taunts |
| Metal 金 | +magic crit / MDEF pierce | **Kamaitachi** — sickle weasel, dashes through enemies leaving cuts |
| Water 水 | −cast time | **Mizuchi** — water serpent, slows enemies in a ring around the caster |

Only 1 shikigami at a time (2 with Shikigami Pact Lv5). Summoning another replaces the oldest.

## The 15 invoked spells

Creation (sōshō neighbours)

| Pair | Spell | Effect |
|---|---|---|
| Wood + Fire | Bonfire Ward (篝火結界) | 5x5 zone: allies +ATK/MATK, enemies entering get Burn |
| Fire + Earth | Ash Barrier (灰の結界) | 5x5 ward: allies take −20% damage; leaves Fire residue |
| Earth + Metal | Kongō Talisman (金剛符) | Shield on one ally; when broken it bursts into metal shards |
| Metal + Water | Mirror Pond (水鏡) | Water mirror at a point: swap places with it or your shikigami; reflects one single-target spell |
| Water + Wood | Spring Rain (慈雨) | Party heal over time in 7x7 + removes one debuff |

Destruction (sōkoku pairs)

| Pair | Spell | Effect |
|---|---|---|
| Wood + Earth | Root Fissure (根裂) | Line of roots splits the ground, Root 2 s |
| Earth + Water | Mudslide (土石流) | Cone wave, knockback 2 cells + Slow |
| Water + Fire | Steam Burst (蒸気爆) | Single-target burst, Blind |
| Fire + Metal | Molten Swallows (熔燕) | 3 homing paper swallows of molten metal, ignore part of MDEF |
| Metal + Wood | Leaf Blade Storm (木葉刃嵐) | 5x5 storm of cutting leaves, damage over 3 s |

Shikigami (same element ×2): see the element table.

## Combo layer: residue, generate, overcome

Every spell leaves **residue** of its elements on the targets/ground it touches (6 s, shown as a small coloured mark of
the element's shape — leaf, flame, stone, blade, ripple; no text).

- **Generate:** a spell containing the element that the residue *generates* is **amplified** (+30% power, +2 s), and
  the residue changes into the new element. Chains keep going around the circle — the long-combo playstyle.
- **Overcome:** a spell containing the element that *overcomes* the residue **breaks** it for a one-time effect:

| Residue broken | By | Break effect |
|---|---|---|
| Wood | Metal | Splinter — Bleed |
| Fire | Water | Steam — Blind 3 s |
| Earth | Wood | Crack — DEF/MDEF −25% for 5 s |
| Metal | Fire | Melt — next hit ignores 40% MDEF |
| Water | Earth | Mire — Root 1.5 s |

Example combos: Fire residue (Ash Barrier) → Steam Burst breaks it for Blind → Root Fissure on the blinded target
breaks nothing but leaves Wood → Leaf Blade Storm (Metal breaks Wood) → Bleed. Or a support chain: Spring Rain (water
+wood) → Bonfire Ward (wood generates fire, amplified) → Ash Barrier (fire generates earth, amplified).

**Balance (Taikyoku):** alternating a creation spell and a destruction spell grants a Balance stack (max 3, +4% each);
casting 3 of the same kind in a row resets it. Rewards weaving support and offence, not spamming one combo.

## Skill tree (15 slots, replaces current Onmyoji list)

Class 2 actives (5): **Wood / Fire / Earth / Metal / Water Talisman** (Lv10 each). The level of an element scales
every spell and shikigami that uses it — skill points decide the build.

Class 2 passives (5)
1. **Onmyō Seal** — unlocks Invoke; Lv1–5 lowers Invoke CD 6 s → 2 s; Lv5 opens the 2nd held-spell slot.
2. **Sōshō Flow** — generate amplification +30% → +50%.
3. **Sōkoku Break** — break effects longer/stronger.
4. **Taikyoku Balance** — Balance stack bonus and cap.
5. **Shikigami Pact** — shikigami HP/duration; Lv5 allows 2 shikigami.

Ultimates (5, at most 2 passive)
1. **Gogyō Mandala** (active) — 8 s: Invoke has no cooldown and residue lasts 2× longer. The skill-ceiling window.
2. **Gogyō Ring Seal (五行環封)** (active) — draws the generating cycle as a ring of five points around the target area (a pentagon ring, never a star: the art bible forbids pentagrams) and detonates all residue on screen; damage scales by how many *different*
   elements are present (1–5); with all 5 it also Silences 3 s. Rewards using the whole circle.
3. **Shikigami Ascension** (active) — current shikigami takes its great form for 20 s (nine-tailed fox, great Nurikabe
   fortress, elder Kodama tree, twin Kamaitachi, Mizuchi dragon).
4. **Third Talisman** (passive) — a 3rd talisman slot; the 3rd element *flavours* the invoked spell (e.g. Steam Burst
   + earth = also knocks back). Expert option, small numbers.
5. **Onmyō Mastery** (passive) — each *different* spell cast within 10 s lowers Invoke CD by 0.3 s (max 1.5 s).
   Variety, not repetition, is rewarded.

## Playstyles (same branch, different builds)

| Build | Element focus | How it plays |
|---|---|---|
| Destruction nuker | Fire/Water/Metal | Breaks residue for Blind/Melt, bursts with Steam/Molten Swallows |
| Five-phase weaver | all 5 evenly | Long generate chains, Ring Seal finisher, highest skill ceiling |
| Shikigami master | 2 elements + Pact | Two shikigami (e.g. Nurikabe + Kitsune), spells as support |
| Ward support | Wood/Fire/Earth/Water | Spring Rain → Bonfire → Ash Barrier chain for the party, Mirror Pond saves |
| Controller | Earth/Wood/Water | Root Fissure, Mudslide, Mire breaks, keeps enemies in place |

## Power guardrails (so it is harder, not stronger)

- Damage per second over 30 s with a perfect rotation must sit within ±5% of Daoist Immortal / Rune Seer benchmarks;
  a simple 2-spell rotation reaches ~80%. Mastery gives versatility (right spell at the right time), not a higher cap.
- Every invoke costs SP; spells are individually weaker than a specialist's signature skill (Spring Rain < Miko heal,
  Root Fissure < Druid Root Bind).
- No invulnerability; Mirror Pond reflect is 1 spell; shikigami are fragile.
- Ranged branch: comfortable at 5–9 cells; inside 2 cells casting is slowed 20% (see range rules).

## Uniqueness check vs other branches

- Only branch with combine-to-cast (Invoke) and an element relation system. Other branches never use Gogyō cycles.
- Removed overlaps from the old Onmyoji: Boundary Ward (= Achan barrier), Ward Mastery name (duplicate), Kikyo Seal
  silence zone (folded into the Ring Seal), Four Divine Beasts (Chinese-style; replaced by Japanese yokai shikigami),
  Absolute Mandala invulnerable dome (cheat-death crowding).

## VFX language (for later, no generation yet)

Each element has one silhouette so players can read combos on screen: wood = vines/leaves in lines, fire = fox flames,
earth = stone slabs/walls, metal = blades/needles, water = ripples/mirror. Paper ofuda talismans and folded paper
swallows carry spells. Residue marks reuse one small kit per element (5 sheets, colour + shape). A new Japan VFX
language doc is needed before any generation.

## Job structure (user 2026-10-11: Japan keeps 2 classes, 3 jobs each)

| Job | Onmyoji line | Miko line |
|---|---|---|
| 1st (shared) | Medium — 10 Medium skills | Medium |
| 2nd (10 skills) | **Onmyoji** — 5 element talismans + Onmyō Seal, Sōshō Flow, Sōkoku Break, Taikyoku Balance, Shikigami Pact | **Miko** — see `MIKO_V2_DESIGN.md` |
| 3rd (5 ultimates) | **Grand Onmyoji Master** — Gogyō Mandala, Gogyō Ring Seal, Shikigami Ascension, Third Talisman, Onmyō Mastery | **High Oracle Priestess** |

At 2nd job the Onmyoji already has all 15 spells (an element needs Lv1 to be used) but only one held-spell slot until
Onmyō Seal Lv5, a 6 s Invoke and no residue amplifiers beyond Lv1 — learning curve follows the job curve. Skill points
cannot max all five elements, so the element split is the build.
