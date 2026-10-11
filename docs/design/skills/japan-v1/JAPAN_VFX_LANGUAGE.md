# Japan (Onmyoji / Miko) VFX language — draft 2026-10-11, awaiting user approval

Read with SHAMAN_WORLD_ART_BIBLE.md, SHAMAN_VFX_DESIGN_SYSTEM.md, `ONMYOJI_V2_DESIGN.md`, `MIKO_V2_DESIGN.md`.
Same production method as Russia: layered sprites (ground / behind / front / particles / aura), anticipation →
manifestation → impact → dissipation, a reusable kit first, REUSE/MODIFY/REGENERATE per skill, QA before approval.
No generation until this language and a production spec are approved.

## Design goal: every combo is readable on screen

The Onmyoji's 15 spells come from 5 elements, so **each element gets one shape and one colour** that appear in every
spell containing it. A player who sees "stone slabs + ripples" knows it was Earth + Water (Mudslide) without reading.

| Element | Shape (silhouette) | Colour | Residue mark (kit, small, on target/ground) |
|---|---|---|---|
| Wood 木 | vines and leaves moving in straight lines | moss green + new-leaf green | single curled leaf |
| Fire 火 | fox-fire flames (rounded, tailed) | vermilion + orange | small tailed flame |
| Earth 土 | stone slabs, packed earth walls | ochre + umber | square stone chip |
| Metal 金 | thin blades, needles, coins | pale silver + antique gold | crossed needle |
| Water 水 | ripples, mirror surface, rain lines | indigo + pale aqua | ring ripple |

Generate (amplify) = the residue mark **flows into** the next spell's colour; overcome (break) = the mark **cracks and
bursts** in its own colour. Two kit animations cover all 10 combos.

## Motifs to use

| Motif | Use |
|---|---|
| Paper ofuda talismans with *fictional* brush strokes (no real kanji or sutra text) | Invoke, ward edges, Ofuda Ward Shot |
| Cut-paper hitogata dolls and folded paper swallows | shikigami summon flash, Molten Swallows |
| Japanese yokai as shikigami: kitsune (fox), kodama (tree spirit), nurikabe (wall), kamaitachi (sickle weasel), mizuchi (water serpent) | the five shikigami, original designs |
| Heian court materials: black lacquer, vermilion lacquer, pine, wisteria, washi paper | Onmyoji trims, Mandala ground band |
| Miko: white and crimson cloth, gohei paper streamers, suzu bells, soft morning sunlight, rain | all Miko effects |
| Mist, moonlit night clouds | big ultimates |

## Avoid

Torii gates, real kanji/sutras or readable text, **pentagrams or the seiman star** (art bible), manji, rising-sun ray
patterns, Chinese taiji / four divine beasts (China owns those), Thai yantra, European runes, anime sparkles, neon,
lens flare, cute chibi yokai (keep them eerie and dignified). Shimenawa sacred rope: only if the user approves (it is a
sacred object, like the Thai sacred thread the user approved for Thailand).

## Palette

Onmyoji base: ink black, washi off-white, vermilion, antique gold, plus the five element colours above.
Miko base: shrine white, crimson, bell gold, warm sunlight, pale rain blue. Washed whites go through the existing
`post_thai_vfx.mjs` pale ramp (a Japan ramp will be added: washi off-white, never pure white).

## Proposed reusable kit (to size in the production spec)

1. 5 element residue marks (tiny loops) + generate "flow" and overcome "crack" pulses (code-driven where possible).
2. Ofuda burst (paper talismans fanning out) — Invoke flash for every spell.
3. Paper-swallow projectile.
4. Gogyō ground ring (five points in the generating order, a ring not a star) — Mandala, Ring Seal, Third Talisman.
5. Miko blessing glint (one sheet, recoloured per blessing type) and gohei sweep arc.

## Status

Draft for the user's approval. After approval: PRODUCTION_SPEC.md (per skill layers, phases, REUSE/MODIFY/REGENERATE,
sizes, credit estimate) and prompts.json (ASCII), then the usual step-by-step approvals before any PixelLab call.


## Update 2026-10-11: Japan exception and circle archetypes
Torii, yin-yang, hakke and ofuda are now allowed for Onmyoji/Shikigami (user exception, see SHAMAN_WORLD_ART_BIBLE.md); the Avoid list above is superseded for those motifs. Real kanji only when verified; otherwise fictional brush strokes. Circles follow the 8 visual archetypes by skill function in CIRCLE_SET_REFERENCE.md, coloured by Gogyō element.
