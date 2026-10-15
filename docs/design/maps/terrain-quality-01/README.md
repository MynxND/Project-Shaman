# Terrain artwork and before after review

2026-10-14 · review candidate, not user visual approval.
Open http://127.0.0.1:8793/ and choose ก่อน / หลัง / แบ่งครึ่ง.
First map is the existing Spiritwood, with unchanged terrain geometry,
objects, spawn regions, NPCs and collision. Style changes do not recreate
the scene, move actors or reset the inspection route.

## Inspection and scale

Inspected `MapRenderer.ts`, `Lighting.ts`, `NpcLayer.ts`, the three existing
Wang atlases, asset manifest, local preview and collision model.
Existing native tile16px ×2 =32px/world unit, upright facades and Classic RO
camera retained. Normal inspection zoom1× is the pixel-scale comparison;
overview uses nearest minification. No core dependency changes.

## Artwork and variation

New builtin-imagegen art: four grass, four damp earth and four irregular
stone variants, plus ten alpha ground details (tufts, moss, flowers, leaves,
pebbles and fern). Raw art and exact prompts are in `raw/`.
The first terrain atlas was too grainy in actual preview and is retained as
rejected history. Selected terrain is `terrain-atlas-v2.png`.
Three builtin calls total, no PixelLab calls or local GPU work in this stage.
These are AI-created pixel-art candidates, not a claim that a human painted them.

`build-terrain-quality.mjs` exports native256×192 material art,80×32 alpha
decorations and four4096×64 pair atlases into
`apps/client/public/assets/umbral/terrain-quality/`. Existing source PNGs
and original manifest are unchanged. Grass/road, water/grass and grass/dirt
reuse original Wang pixel masks. Added dirt/road uses the existing organic
mask with new material artwork. No CSS gradient or procedural noise textures.

The shared `terrain-variation.ts` uses a coordinate/map/seed hash with avalanche
mixing and weighted art selection, independent of game RNG. Seed31414 gives
stable rebuilds; default weights60/20/12/8 or60/18/14/8. Four artwork choices
combine with16 continuous64px texture phases:64 atlas variants per Wang tile.
A shared two-pixel rim keeps variants compatible; artist motifs can still
repeat and visual tiling acceptance remains pending.

Decoration and modest contact/ambient shadows are a separate cached ground
layer. Decoration uses small authored offsets near existing vegetation,
rocks and buildings with grass/entrance masks; no world objects/footprints are
added. The atmosphere/fog and actor layers remain independent.

## Existing game adapter

`MapRenderer.ts` delegates optional preload/variant frames/ground detail to
`terrain-quality.ts`. Development-only `?terrainQuality=1` opts into it;
default gameplay/production retains the old art while this review is pending.
No gameplay, networking, save, NPC interaction or monster AI changes.
Decoration on elevation maps is deferred; optional terrain frames preserve
existing height transforms. Existing multi-material junction simplification
remains and must be reviewed before calling every junction perfect.

Local preview also corrected NPC/inspector display scale to the game's existing
0.5 convention; both comparison halves use the same corrected sprite scale.

## Verification and remaining work

`node tools/map/build-terrain-quality.mjs`

`node tools/map/test-terrain-quality.mjs`

`node tools/map/test-leveling-first-four.mjs`

Tests cover deterministic selection/distribution, seed changes, phase/rim
invariants, alpha atlas dimensions, source asset hashes and unchanged
four-map geometry/42 routes, continuous movement, support/spawn/fog rules.
Typecheck/build pass. Actual8793 overview and normal camera inspected at
village and shrine, including stone/earth/grass joins, actor contrast and
split comparison. Screenshots in `screens/`.
Responsive390×844 and844×390 checked: no horizontal DOM overflow and no
browser errors; camera focus survives resizing. Default preview remains split.

Premium art acceptance remains for USER. Water, bridges, wall/building art
and biome-specific kits are still reused from existing assets, not newly
finished artwork. Live network-game appearance, height-map decorative masks,
physical mobile touch/performance and exhaustive junctions remain unverified.
