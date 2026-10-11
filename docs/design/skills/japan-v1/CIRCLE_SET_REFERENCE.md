# Onmyoji / shikigami circle set — user reference (2026-10-11, decisions pending)

The user sent a reference sheet in chat ("ชุดวงเวทย์หลัก – องเมียวจิ / ชิกิงามิ (8 รูปแบบ)") and asked that the
Onmyoji/shikigami circles follow it, with its elements. The image arrived in chat only (not saved in the repo; the
user can drop it at `docs/design/skills/japan-v1/reference/circle-set.png`). Direction only — never sent to PixelLab.

## What the sheet shows

Eight circle styles, each = an upright ornate circle over a flat ground ring, talismans hanging around it, element
smoke, and a small torii at the base:

| # | Name (sheet) | Element / role | Look | Palette (light · mid · dark) |
|---|---|---|---|---|
| 1 | ยันต์แห่งสวรรค์ | light · buff / protect | neat bright pattern, lotus-like centre | #FFF7D6 · #E8C876 · #8A6D3B |
| 2 | ยันต์แห่งความมืด | dark · curse | sharp dark-red lines, inner yin-yang | (pale) · #B31F2A · #3A0F12 |
| 3 | ยันต์แห่งวิญญาณ | spirit · summon shikigami | floating lines, spirit smoke, inner torii | #D8B6FF · #8A4DE0 · #2B1A4A |
| 4 | ยันต์แห่งวารี | water · heal / cleanse | flowing wave lines | #AEE5FF · #4FB5E6 · #1A3E5A |
| 5 | ยันต์แห่งอัคคี | fire · attack zone | strong flame pattern | (pale) · #FF4B3A · #601A0E |
| 6 | ยันต์แห่งพายุ | wind · control / movement | fast spinning wind lines | #D8EAD8 · #8EBEA5 · #3A5A4A |
| 7 | ยันต์แห่งมิติ | dimension · seal / control | broken layered lines | #C9B5FF · #7A3EFF · #2B1A4A |
| 8 | ยันต์แห่งจันทรา | moon / sakura · enhance / balance | soft sakura pattern, crescent | #FFD6E8 · #FF8FB6 · #7A3B5A |

Shared parts: torii, base ground ring, Japanese clouds, sakura petals, talisman paper, 8-direction bagua (hakke),
element smoke, script strokes, ornament bands. Layer order: top floating effects → middle talismans/script → main
circle → ground smoke/shadow. 8-frame build-up: ring draws → talismans rise → circle lights → burst.

## Conflicts with earlier decisions (need the user's call)

1. **Elements.** Onmyoji v2 (approved) is built on the five Gogyō elements (wood, fire, earth, metal, water): 2 of 5
   → exactly 15 spells, and the generating/overcoming cycles decide each spell. The sheet uses 8 different themes
   (light, dark, spirit, water, fire, wind, dimension, moon).
2. **Torii, yin-yang, bagua, kanji-like script.** The art bible forbids real religious symbols and readable sacred
   writing; JAPAN_VFX_LANGUAGE.md (approved) lists torii as avoid, and taiji/bagua as China's.
3. **Upright circles.** The bible's camera rule: ground VFX lie flat; no vertical portals. The sheet's main circle
   stands upright above the ground ring.

## Credit estimate (if approved)

8 circle styles as flat ground circles + one upright "floating crest" each, seeds + short animations:
8 × (seed ≈6 + animation ≈3.5) ≈ 76; shared parts kit (clouds, sakura, talisman strip, smoke ×1 tinted) ≈ 4 × 9.5 ≈ 38.
Total ≈ 115 (cap 135). The current two circle pieces (style A) stay usable as the plain base ring.

## Prototype result 2026-10-11 (exact spend 17 of the 20-credit cap)
Generated (seeds only, one at a time, exact charge read after each): master Onmyoji ground circle 6, floating ofuda
crest 5, spirit smoke 6. Gameplay-scale preview (world scale: characters 0.5, effects × 0.5/0.72, shown at 2× = the
on-screen size at 1080p): `prototype-gameplay-scale.png` (as generated) and `prototype-gameplay-scale-lines.png`
(free code variant: pale fill made transparent). Inspection:
- Master circle: eight-direction hakke bars, five Gogyō nodes with ofuda tabs, yin-yang centre, no star. As generated
  its wide off-white band is opaque, so at real scale it reads as a solid plate and the detail is lost; the lines-only
  variant is airier but low-contrast on dark ground. At 0.5/0.72 scale it is about 127 px wide in world space — smaller
  than the reference's proportion to the actor.
- The hakke trigram order was not checked against a real arrangement (Earlier/Later Heaven); needs verification
  before it is called authentic.
- Ofuda crest: abstract brush strokes (no real kanji), vermilion seal, tassel, shide — reads clearly at scale.
- Spirit smoke: two Japanese cloud-curl clumps; tints well.
The other 7 archetypes are not generated (waiting for approval of the master).

## Master circle fix (user 2026-10-11: line-only, brighter, bigger) — free
Pale band fill removed, remaining lines remapped to a bright pale-gold ramp (tints read on dark ground), published as
`jp-master-circle` and made the main Japan casting/area circle (`JAPAN_CIRCLE_ASSETS.main`); casting circle 1.3× (was
0.95×), area circles 56 px per viewer cell. Evidence: `master-circle-lines.png`, `master-circle-in-lab.jpg`.

## The 8 archetypes (user approved the master, then "ทำวงเวทย์อีก 7 แบบต่อเลย") — 42 credits exact
Ultimate Ritual = `jp-master-circle`; generated (flat top-down 192×192, thin open lines, same free line pass):
Protection (eight-petal lotus, four ofuda, hakke), Summoning (flat torii emblem, spirit wisps, ofuda chain),
Purification (wave rings, seigaiha arcs, in-yo centre), Attack (curling flame tongues, angular marks), Binding (woven
cords, knots, inward hooks), Sealing (broken offset rings, square seal frame, ofuda across it), Spirit Manifestation
(crescent moon, sakura outlines — the faintest of the set). Skill → archetype in `skills-japan.ts`
(`japanCircleArt`); the casting circle and the area/release circles swap art per skill, the Gogyō element only tints.
Evidence: `circle-archetypes.png` (raw row, line row), `summoning-circle-in-lab.jpg`.
