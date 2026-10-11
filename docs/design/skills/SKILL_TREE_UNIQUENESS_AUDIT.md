# Skill tree uniqueness audit (2026-10-11)

Requested by the user after Thailand, Indonesia and Russia: "skills of many nations look alike". Source:
`docs/design/skill-database-source.txt` (24 branches × 15 skills). This is an audit and proposal only — no catalog,
formula or asset changes. Non-Medium changes need design review/user approval (AGENTS.md).

## Why the nations feel alike

1. **One template for every branch.** 5 actives + 5 passives + 5 ultimates, and inside it the same slots repeat:
   weapon/school mastery, "reduce cast/SP/CD", "+range/+area of my zone skill", "cheat death", "transform into dark
   form". About a third of the "ultimates" are really passive number boosts (Transcendent Medium, Colossus Resonance,
   Necrotic Mastery, Mandala Resonance, Aura Resonance, Rune Mastery, Death Scythe Mastery, Wolf Blood Mastery,
   Merchant King, Legion Commander…), so the exciting slots are fewer than they look.
2. **Small status vocabulary.** Almost everything is Stun / Root / Slow / Fear / Poison / Bleed / Heal Block / DEF
   down / Reflect / Invulnerable. Different stories end in the same mechanic.
3. **Theme clusters overlap.** Five branches are "dark curse + DOT" and three are "voodoo doll"; several are "lower HP =
   more damage"; two healers both mass-resurrect.
4. **Our VFX grammar is shared too.** Every nation got "ground ring under the feet + rising particles + aura", so even
   different mechanics read alike on screen. (The kit approach is right; the silhouette of each branch needs to differ.)

## Overlap map (whole tree)

| Cluster | Branches | Clearest duplicates |
|---|---|---|
| Dark curse / DOT / lifesteal | Mor Phhee (TH), Santet (ID), Voodoo Master (HT), Blood Mage (MX), Mangkukulam (PH) | Prai Whispering Curse ≈ Voodoo Curse ≈ Blood Drain Hex; Soul Drain ≈ Soul Pluck; Mass Decay ≈ Soul Decay; Endless Agony ≈ Cruelty; Prai Curse Explosion ≈ Voodoo Mastered |
| Voodoo doll | Santet (Voodoo Link), Mangkukulam (Voodoo Doll Hex), Voodoo Master (Voodoo Curse, Needle Stab) | Indonesia even uses the word "Voodoo" |
| Pull enemies to a centre | Achan (Underworld Soul Pull), Maoshan (Underworld Gate) | same skill, same "underworld" story |
| Corpse/summon explosion | Maoshan (Corpse Explosion), Necromancer (Corpse Explosion, Mass Explosion) | identical name |
| Summoner | Achan (phayon), Maoshan (jiangshi), Onmyoji (shikigami), Necromancer (skeleton), Voodoo (zombie) | "command summon to charge + stun" appears 3× |
| Melee assassin | Keris (ID), Jeoseung Saja (KR) | stealth/blink behind, execute low HP, ignore DEF, dark weapon |
| Low HP = stronger / HP as cost | Taiga (RU), Blood Mage (MX), Jaguar (MX), Mor Phhee (Shadow Ghost Avatar) | Wolf Blood Mastery ≈ Hemomancy Mastery ≈ Blood Price; Berserker Blood ≈ Blood Sacrifice |
| Blood Moon | Taiga (Blood Moon), Blood Mage (Blood Moon Annihilation, Blood Moon Blessing) | same image, two nations |
| Roar-taunt + stomp tank | Juggernaut (Taunting Howl, Titan Stomp), Wild Shape (Primal Roar, Colossal Slam, Alpha Howl), Jaguar (Jaguar Roar) | wolf howl vs bear roar |
| Cheat death | Mor Phhee, Taiga, Mangkukulam, Seidr ×2, Jaguar (Nine Lives), Blood Mage | 7 versions of "survive the killing blow" |
| Possession self-buff | Mor Phhee (Ghost Possession), Gut Shaman (Divine Possession), Achan (Transcendent Medium) | |
| Dark form ultimate | Mor Phhee (Shadow Ghost Avatar), Jeoseung Saja (Abyssal Form), Jaguar (Eclipse Form), Necromancer (Lich) | |
| Party crit buff | Gut (Ancestral Buff), Rune Seer (Prophecy), Taiga (Blood Moon) | |
| Mass resurrection | Miko, Arch Druid | |
| Duplicate names | Heavenly Strike (CN, KR), Ward Mastery (TH, JP, both "5x5 → 7x7"), Soul Harvest (TH, KR), Spirit Ward (KR, US), Corpse Explosion (CN, HT) | |

Inside the three finished nations: **Mor Phhee vs Santet** is the biggest overlap (both are ranged dark curses with DOT,
lifesteal and an AOE curse finisher); Mor Phhee's Blood Oil Coating overlaps Keris poison; Absolute Soul Defense
overlaps Undying Rage; Shadow Ghost Avatar's HP cost overlaps Berserker Blood.

## Proposal: one signature mechanic per branch

Give every branch one rule nobody else has, and rewrite the overlapping skills to feed it. Numbers stay provisional; the
role (tank/DPS/support) of each branch does not change. Where possible the existing VFX are kept (repurposed), so
finished art is not thrown away.

### Finished nations (concrete)

| Branch | Signature (new) | Skills to rework | VFX impact |
|---|---|---|---|
| Achan Saiyasat (TH) | **Sacred thread lines**: barriers are lines/polygons drawn between the caster, phayon and thread pegs; enemies crossing a line are hit/slowed, allies inside are warded. Shapes, not circles. | Underworld Soul Pull → "Thread Snare Web" (pulls along threads, no underworld); Ward Mastery → "Thread Weaving" (+1 peg, longer lines) | Barrier/Fortress art kept; Soul Pull art reused as the web's centre knot |
| Mor Phhee (TH) | **Haunting (พรายสิง)**: a prai ghost attaches to one enemy and *jumps* to the next when it dies or after N seconds; fear and drain grow with jumps. A spreading-possession class, not a DOT stacker. | Prai Whispering Curse → applies the prai; Soul Drain drains more per jump; Prai Curse Explosion → detonate all jumping prai; Blood Oil Coating → "Prai Lure" (attacks mark targets for the next jump), drops poison; Absolute Soul Defense → "Prai Takes the Blow" (sacrifices one active prai instead of a % chance) | Ghost/fire art kept; jump = existing tether art |
| Santet (ID) | **Sending (teluh)**: curses are slow unseen objects (needles, nails, black balls of light) sent to a target; they land after a delay and can be stacked as "nails in the body", then cashed in. Delay + stack + cash-in, not DOT. | Black Magic Dart / Soul Pluck → send needles (delayed); Voodoo Link → "Bound Fate" (no voodoo word; shares *sent* objects between 2 targets); Endless Agony → "Teluh Barrage" (sends all stored objects at once); Mass Decay keeps Heal Block | Projectile art kept, timing changes |
| Keris (ID) | **Keris spirit (pamor)**: the keris awakens in 3 stages from poison kills/backstabs; each stage changes Keris Thrust and the ultimate. Poison stays Keris-only. | Venomous Overdrive → "Pamor Awakening"; Shadow Clone → "Keris Soul" (the floating keris fights, not a dark clone — splits from Korea's shadow); Backstab Expert stays | Clone art can be retinted as a floating keris (or 1 new seed) |
| Juggernaut (RU) | **Shield guard + frost ground**: a Guard meter fills from blocking; tank skills spend it. Frost Step/Snow Fort leave frozen ground the tank stands on for bonuses. Tank by *position*, unlike the bear (form) and jaguar (evasion). | Taunting Howl → "Shield Clang" (shield clash taunt; keeps wolf only in armor/ultimate); Titan Stomp spends Guard; Colossus Blood → "Hold the Line" (Guard while allies are behind you) | Howl art reused as the clash shockwave; stomp kept |
| Taiga (RU) | **Bleed hunt**: bleeding enemies leave a blood trail; the berserker chains dashes along trails, each kill resets Blood Scent. Keep low-HP only in Berserker Blood; Wolf Blood Mastery → "Pack Hunt" (more damage per bleeding enemy nearby) so Mexico can own "low HP = power". | Wolf Blood Mastery, Undying Rage → "Last Howl" (on lethal hit: dash to the nearest bleeding enemy, heal from it); Blood Moon stays (see note) | All art kept; Undying Rage shards reused |

Note on Blood Moon: Russia already has the art; recommend Mexico renames to "Obsidian Sun"/"Eclipse" variants (Aztec
sun theme fits better) and Russia keeps Blood Moon.

### Upcoming nations (one line each, to design before generation)

| Branch | Signature |
|---|---|
| Maoshan (CN) | Talisman *sticking*: talismans stuck on enemies/jiangshi are commands (freeze, explode, obey). Drop "Underworld Gate" pull; rename Corpse Explosion → "Talisman Burst". |
| Daoist Immortal (CN) | Flying swords as an orbiting resource (count 0–9), spent by every attack skill. Keep Heavenly Strike name here. |
| Onmyoji (JP) | Five-element (gogyo) cycle: casting elements in the order wood→fire→earth→metal→water empowers the next. Ward Mastery → "Boundary Mastery". |
| Miko (JP) | Purification + dance tempo; keep the only full-party mass resurrection. |
| Gut Shaman (KR) | Drum rhythm: channel skills with timed beats (bigger buffs on beat). Heavenly Strike → "Thunder Drum". |
| Jeoseung Saja (KR) | Soul ledger: marks the names of enemies; execute works only on "registered" names; scythe chain pull. No stealth (Keris owns stealth). |
| Mystic Merchant (PH) | Zeny economy (already unique, keep). |
| Mangkukulam (PH) | Mind control/confusion only; the voodoo-doll word stays here (Philippine *kulam* dolls), Haiti uses vèvè and loa. |
| Rune Seer (NO) | Rune *words*: placing 2–3 runes in order combines them. |
| Seidr (NO) | Fate threads on allies (single "fate reversal" kept; other cheat-death removed). |
| Arch Druid (IE) | Growth over time: plants/trees grow stages while standing; resurrection moved to World Tree only. |
| Wild Shape (IE) | Form switching combos (bear ↔ eagle switch bonuses); no roar-taunt copy of Juggernaut — use "Bear Hug" grab-taunt. |
| Totem Guardian (US) | Totems (already unique, keep). |
| Spirit Archer (US) | Distance-based damage (already); add spirit animal shot types. |
| Voodoo Master (HT) | Loa possession and vèvè drawn on the ground (pain reflection kept); drop doll mechanics. |
| Necromancer (HT) | Army size (already); rename Corpse Explosion → "Bone Burst". |
| Jaguar (MX) | Day/night sun cycle + evasion (already partly); drop Nine Lives (cheat death crowded). |
| Blood Mage (MX) | Owns "HP as resource / low HP = power"; rename Blood Moon skills to sun/obsidian names. |

### Global rules (proposed)

- No two branches share a skill name or a core mechanic word ("voodoo", "underworld", "blood moon", "soul harvest").
- At most 2 of the 5 ultimates per branch may be pure passive boosts; the others must change how the branch plays.
- "Cheat death" exists in at most 3 branches; "transform into dark form" in at most 2.
- Each branch's VFX must have a **branch silhouette** other than "ring under feet": e.g. Achan = straight thread lines,
  Mor Phhee = ghosts that jump, Santet = slow incoming objects, Keris = floating blade, Juggernaut = shield shockwave
  fronts, Taiga = blood trails on the ground.

## Decision needed from the user

1. Approve the signature-mechanic approach for the 3 finished nations (rework list above), or pick only some branches.
2. Approve the global rules for the remaining 9 nations before their skills are designed.
No catalog, formula or asset changes have been made.

## Follow-up 2026-10-11: melee/ranged split, bow nation, Onmyoji

The user approved the signature-mechanic direction (items 1–2 above) and added three requirements: a clear melee vs
ranged split, exactly one bow "hunter" nation (Europe preferred, in our theme), and an Onmyoji rebuilt as a complex
combine-to-cast branch (Invoker-like, not stronger). Onmyoji: see `japan-v1/ONMYOJI_V2_DESIGN.md`.

### Range classes (proposed rule)

- **MELEE:** main damage needs ≤ 2 cells. Gets a gap-closer and damage reduction.
- **MID:** works best at 3–6 cells (zones, summons, thrown/short casts).
- **RANGED:** works best at ≥ 7 cells. Gets one disengage; inside 2 cells casting/shooting is slowed 20%.
- Every nation has one melee-or-mid branch and one ranged-or-mid branch where possible, and no branch is "both".

| Nation | Branch A | Branch B |
|---|---|---|
| Thailand | Achan Saiyasat — MID (summoner/guard) | Mor Phhee — **MELEE** (proposed: possessed fighter with a *mor* ritual knife; prai jumps from enemies it hits — separates it from Santet) |
| China | Maoshan — RANGED summoner | Daoist Immortal — RANGED burst |
| Japan | Onmyoji — RANGED invoker (v2) | Miko — RANGED healer (Evil Warding Arrow becomes a gohei/ofuda shot, no bow) |
| Korea | Gut Shaman — MELEE battle-shaman support (blade-walking *jakdu* rite) | Jeoseung Saja — MELEE scythe |
| Indonesia | Santet — RANGED | Keris — MELEE |
| Philippines | Mystic Merchant — MID | Mangkukulam — RANGED control |
| Norway | Rune Seer — RANGED ice | **Ullr Hunter — RANGED physical (bow)** (replaces Seidr Witch, see below) |
| Ireland | Arch Druid — RANGED healer | Wild Shape — MELEE |
| Russia | Juggernaut — MELEE tank | Taiga — MELEE |
| USA | Totem Guardian — MID | Spirit Archer — needs a decision (see below) |
| Haiti | Voodoo Master — RANGED | Necromancer — RANGED summoner |
| Mexico | Jaguar — MELEE | Blood Mage — RANGED |

### Bow nation: Norway — Ullr Hunter (นักล่าแห่งอุลล์)

Why Norway: Ullr is the Norse god of the bow, hunting and skis, so a bow hunter is native to the myth rather than
borrowed; it is in Europe; Norway's other branch is a mage, so the nation gets one physical and one magic branch.
It replaces **Seidr Witch** (an evasion support; supports are already plentiful: Miko, Druid, Gut, Totem, Merchant,
Achan). Alternative: Ireland's Fianna hunters replacing Wild Shape — rejected because Ireland would lose its only
melee branch.

Signature mechanic — **the hunt**: mark one prey → your **falcon** (Freyja's falcon-cloak motif; no wolves, Russia owns
wolves) circles and reveals it → **snares** set on its path → a **charged rune-arrow** gets bonus damage on marked,
revealed, snared prey. A mobile skirmisher that sets up kills, unlike a stand-still sniper.

Draft 15 (names only, to be detailed in its own proposal): Prey Mark, Falcon Strike, Ski Dash (disengage), Snare
Trap, Charged Rune Arrow · Bow Mastery, Tracker's Eye, Falcon Bond, Winter Fletching, Quiet Breath · Ullr's Volley,
Great Hunt (party-wide mark), Falcon Storm, Rune Arrow Mastery (passive), Hunter's Patience (passive).

### USA Spirit Archer: decided (user 2026-10-11) — option 1, keep both bows, split clearly

The tree already has a bow branch in the USA. Options:
1. **Keep both bows, split clearly** (recommended): Norway = mobile hunter (traps, falcon, marks); USA = stationary
   long-range spirit sniper (range and armour pierce, no traps, no pet). Different play, same weapon type.
2. Make Norway the only bow and rework USA Spirit Archer into a different ranged role (thrown weapons or a spirit-animal
   caller), so the game has exactly one bow branch.
