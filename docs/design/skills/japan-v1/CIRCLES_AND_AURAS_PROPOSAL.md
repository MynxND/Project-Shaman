# Japan casting circle, buff auras and "grander" skills — proposal 2026-10-11 (awaiting user approval)

User request (with a reference image of a glowing layered magic circle: a big ring with an inscription band, an inner
star, and two smaller satellite rings):
1. A magic circle like that under the feet while casting.
2. Some skills are not grand, not intimidating, not fun to use.
3. Buffs need an aura on the player for as long as the buff lasts; area buffs need a Japanese circle under the feet
   sized to the area the buff covers.

The reference sets direction only; it is never sent to PixelLab (third-party art). Prompts describe our own design.

## Conflict to decide

The reference has a **five-pointed star** and **rune-like letters**. SHAMAN_WORLD_ART_BIBLE.md (the user's rules,
2026-10-09) forbids pentagrams, Western spell circles and European runes. Options:
- **A (keeps the bible):** the same layered composition, but the inner shape is the **Gogyō pentagon** (five element
  nodes joined around the ring, no crossing star lines) and the band carries **fictional brush strokes** (no letters).
- **B (bible exception for Japan):** use the Onmyōdō **seiman** five-point star (Abe no Seimei's real mark) inside the
  circle. Needs the user to approve an exception; the bible and design-decisions get updated.

## 1. Japan casting circle (new kit, generated)

Composition from the reference: one large circle (outer inscription band, middle ring with the five element nodes,
inner geometric shape per A or B) + one small satellite circle used twice. Drawn **flat, seen from straight above**,
pale gold on transparent, so code can:
- squash it to the ground ellipse (container scaleY 0.5) while the child **rotates** — rotating circles on the ground
  plane like the reference, without regenerating per angle;
- **tint** it per element (Onmyoji: the spell's two element colours alternate) or crimson-gold (Miko);
- orbit the two satellite circles around the big one.

Timing (existing envelope rules): grows in during the first 20% of cast time, turns slowly and brightens while
channelling, flashes at release, fades in 180 ms; cancelled casts fade without release; instant skills show none.
Replaces the Thai yantra circle for Japan only.

| Asset | Size | Generation | Credits |
|---|---|---|---|
| jp-cast-circle-main (flat, top-down, pale gold) | 192×192 | seed only (motion in code) | ≈ 6 |
| jp-cast-circle-satellite | 64×64 | seed only | ≈ 6 |
| **Total** | | | **≈ 12** |

## 2. Buff auras (code, free)

| Kind | Skills | What shows while the buff lasts |
|---|---|---|
| Area buff | Bonfire Ward, Ash Barrier, Spring Rain, Mirror Pond, Kagura, Kotodama, Cleansing Rain, Sun Pillar, Gogyō Mandala | the **Japan circle on the ground sized to the skill's area** (cells → world size), slowly turning, low opacity, plus the skill's own loop |
| Single-target buff | Suzu Bell (ally), Kongō Talisman (ally), element talismans held (self) | an **aura on that player**: Onmyoji = held talismans orbiting in the element colours; Miko = blessing glint loop with a small bell; Kongō = the shell plates stay, dimmed |
| Converted blessing (Miko) | Harae / Kagura / Cleansing Rain results | small glint over each blessed ally for the blessing time |

Rules kept: one visible aura per actor by priority (existing budget), aura removed the moment the buff ends, no new
timers. The lab gets a "buff running" preview (aura loops for the buff's duration, capped at 6 s in the viewer).

## 3. Grander skills (code first, free)

| Skill | Now | Upgrade |
|---|---|---|
| All Onmyoji spells | small ofuda flash | casting circle under the caster + ofuda burst 1.2× + element-coloured flash ring at release |
| Steam Burst | single column | 1.6× scale, Japan circle under the target, second delayed steam column |
| Molten Swallows | one swallow | three swallows staggered in time and angle, trail copies |
| Mirror Pond | flat pool | 1.6×, circle rim around it, ripple pulse rings |
| Kongō Talisman | shell | 1.3×, gold flash on cast, shards burst at the end |
| Root Fissure / Mudslide | line / cone | 1.4×, residue marks along the path, ground circle at the caster |
| Suzu Bell | small bells | 1.4×, chime rings (circle satellite pulsing), aura while active |
| Harae Sweep / Ofuda Ward Shot | small arc / talisman | 1.5×, trail copies, blessing glint burst on the target |
| Gogyō Ring Seal | columns | 2×, big Japan circle under it turning fast, five-element flash |
| Resurrection / Sun Pillar | pillar | 1.7× / 1.6×, big circle at the base, glint burst |
| Shikigami Ascension | tinted flash | 2.2×, circle + orbiting talismans |

If something still feels weak after the code pass, a regeneration list can follow (separate approval).

## Ask

1. Circle style: A (no star, keeps the bible) or B (seiman star, bible exception for Japan).
2. Approve ≈ 12 credits for the two circle pieces.
3. Approve the free code work in 2 and 3.

## Result 2026-10-11
User chose style A (no star) and approved ≈12 credits: jp-cast-circle-main (6) + satellite (5) = **11 exact**.
Lab: Japan casting circle (squashed ground ellipse, rotating, two orbiting satellites, tinted by the spell's elements,
grows/flashes/fades per the envelope, cancel fades); buff phase after release (area circle sized by cells at 48 px per
viewer cell, zone art keeps looping; talisman/glint/shell auras on the buffed player); grand releases get a circle
(`JAPAN_RELEASE_CIRCLE`); bigger scales and extra layers (second steam column, three swallows). Evidence:
`circle-seeds.png`, `bonfire-buff-circle-in-lab.jpg`. Superseded next by the circle archetype set
(CIRCLE_SET_REFERENCE.md), prototype pending.
