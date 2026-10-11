# Norway — production result 2026-10-11 (163 of the 210 cap, exact)

Made: kit (falcon, rune arrow, trap, snow burst, Norway circle), 12 own effects (Rune Seer: Blizzard, Runestone, Cast the
Lots, Frost Bolt, Ice Wall, Absolute Zero, Shatter; Hunter: Charged Rune Arrow, Great Hunt, trap blast/snare/flash),
30 icons, 9 real rune glyphs drawn in code from the Unicode Runic block (Segoe UI Historic): Isa, Hagalaz, Perthro, Kenaz,
Naudiz, Thurisaz, Dagaz, Uruz, Raidho.
Composed in code: Twin Shot (two arrows), Ullr's Volley (5 homing arrows), Falcon Strike/Bond/Storm (falcon ×1/×3),
Rune Trap Kit (trap + the 4 trap runes and their trigger bursts, one per preview loop), Charged Rune Arrow (bow charge
stays at the hunter with the Uruz rune, the arrow flies), Fimbulwinter (Blizzard 2.6× + snow bursts + ice prisms),
rune overlays on Runestone / Cast the Lots / Shatter / Frost Bolt. Norway circle tinted per branch for casting and area
buffs (Great Hunt 11, Blizzard 7, Fimbulwinter 15, traps 3).

QA notes:
- Fimbulwinter seed came back as an opaque landscape painting → rejected, not animated (saved ≈4); built in code.
- Blizzard seed had an opaque white background → cleared free (`--clear-edge-white`); a snowy ground patch stays inside the ring.
- Falcon animation submission failed once without creating a job (nothing charged); resubmitted.
- Lab bug fixed: a kit main-art override now wins over the skill's own sheet (Charged Rune Arrow showed the bow flying).
- Rune overlays are small at preview size (24×32 glyphs); can be scaled up in code if wanted.
Evidence: `seeds-1.png`, `seeds-2.png`, `rune-glyphs.png`, `animated-check.png`, `charged-arrow-in-lab.png`, `rune-trap-in-lab.png`.

## Runes bigger (user 2026-10-11, free)
All rune overlays about 2× (1.2–2.8× the 24×32 glyph), moved to the front layer (self-centred "particles" are drawn
under the actor, which hid them) and lifted above the head on caster-centred skills; the pulse fade was removed so the
letters stay readable. Evidence: `rune-bigger-in-lab.png` (ᚾ Naudiz over the Rune Trap Kit).

## Ullr Hunter spirit pass (user 2026-10-11: plainer than wanted, not shaman enough, arrows too slow, ghost falcon, permanent companion)
- Arrows: travel 8–20% of the release (was 70%); the arrow hides on arrival and a **spirit impact** (purple ghost-fire,
  skull wisps, bone shards) plays on the target for Twin Shot, Charged Rune Arrow, Ullr's Volley, Falcon Strike.
- New art (29 credits exact): **skeletal falcon wrapped in purple ghost-fire** (one master, two 16-frame animations: glide
  for the companion, dive for attacks), **spirit arrow** (ghost-fire shaft, wisp trail), **spirit impact**.
- **Falcon Bond companion is permanent**: the bone falcon glides beside the hunter on every Hunter skill (`NATION_COMPANIONS`).
- Free fixes: dive strike flash washed pale → violet only on the flash frames (`--violet-flash`); ghost-fire white cores → lilac.
Evidence: `spirit-seeds.png`, `spirit-frames.png`, `dive-flash-fixed.png`, `spirit-hunter-in-lab.png`.

## Rune Seer power + Ice Wall rule + circle colours (user 2026-10-11, free)
- Stronger ice: Blizzard 2×, Frost Bolt 1.5×, Absolute Zero 1.5×, Shatter 1.8×, Fimbulwinter 2.8×; extra ice prisms on
  Blizzard and Shatter, snow burst + shatter on Absolute Zero, Frost Bolt hits with an ice shatter + snow burst (the
  spirit impact had been applied to it by mistake in the Hunter pass — reverted).
- Ice Wall rule `iceWallSpec(level)` (source + user): length 3 + Lv cells (4/6/8), taller each level (1 + 0.12 × Lv),
  nobody walks through while it stands, HP 3,000 × Lv breakable, melts after 15 s (catalogue fixed from 10 s). Test added.
  Viewer shows the max-level wall (art repeated along the line).
- Circles: `NATION_CIRCLES` tints can be several colours and per skill. Hunter = purple ↔ white; Rune Seer per skill
  (ice blues/whites, Runestone teal, Cast the Lots gold/teal). The Norway circle art was redrawn in neutral white-grey
  lines (`circle_lines.mjs --neutral`) so cool tints read true. Known: the shared satellite rings are warm gold art.
Evidence: `ice-wall-max-in-lab.png`, `hunter-circle-white.png`, `hunter-circle-purple.png`.
