# Three-map refinement, edge travel and 30-map atlas

User authorized 2026-10-14. Existing gameplay stays authoritative; preserve NPCs/monster stats/regions and existing map source comments. Extend travel corridors before changing edge portals. Original portal IDs retained for compatibility, even when the displayed geographic direction changes.

## Layout brief before placement
Spiritwood eastern trail70,33.6 extends to east edge79,34; gate centre79,34, safe return76,34. Paddy west entry1,55 returns to Spiritwood; arrival4,55, connects existing rest38,48 via4,55→28,55→38,48. East exit75,19, arrival72,19, connects north38,19→75,19. Mangrove west gate1,51, arrival5,51; land apron connects existing15,51. East gate79,51, arrival75,51, connects existing69,51. Marsh west gate1,57, arrival5,57; land causeway to44,57. Bidirectional chain is geographically eastward; legacy village return stays south of Spiritwood. No central teleport pads between these regions. Edge trigger rectangles stay inside rectangular bounds and separated from arrival by3–4 units.

Required sites remain authored in the four original layout briefs. Water/land sampling and blockers must be rebuilt for new causeway aprons before registration. New approach polygons are explicit hand-authored corridors, not whole-layout scaling. Safety pockets only at transit entrances; existing hunting regions retained. Failed placements and routes reported in validation; no silent required-site omission.

## Art plan
Paddy: shade/leaf litter around western mill and rest-house, damp earth at rice-bank edges, broken paving only at trail junctions; sparse bamboo groves on west/east boundary, open crop clearings retained. No fog over main fields; two small dawn-water mist pockets in upper irrigation pools.
Mangrove: denser dead-root/leaf canopy on west-bank and east-bank margins, mossy humid ground, worn stone at shrine approach. Fog only in water channels, never bridge landings. Keep existing deck paths/passability. No full-screen gray veil.
Marsh: shaded groves on outer banks, mossy pebbles around rest house and island shrine, wet banks cut out of water coverage. Local basin fog; central causeway and arrivals readable. All extra canopy/dressing cosmetic, no new blocking footprints; existing blocking roots remain intact. Native artist ground/tree/fern/rock assets reused, nearest filtered. No generated art in this stage.

## World atlas scope
30-map regional atlas, 12 nations confirmed from skill-system/classification.json and approved current branch names. Fictional spirit-route geography, location names, adjacency and level bands are proposals; do not present them as approved lore or real Earth geography. Five maps currently playable; 25 planning nodes have no teleport controls. Original20-map proposal stays historical; new30-map plan supersedes its count. Gameplay lab maps are excluded from the30 content budget. Atlas opens from existing M map window without replacing local map controls. No automatic gameplay implementation of planned nodes.

## Evidence
Before images are actual game captures from the immediately preceding revision, same1280×720 overview framing; live actors/time differ. After captures, real edge travel checks, reciprocal gates/navigation/water/source checks and desktop/mobile review recorded here. Human art approval and physical phone validation remain separate.

## Completed validation
Typecheck/build pass. Shared checks pass for30 unique connected nodes,12 source-bound nation records,5 live/25 planned status, all four gameplay layouts/required routes, boundary gate reciprocity, wet blocking, spawn capacity and preserved original Spiritwood source/comments. Isolated live-server test traverses all three pairs both ways, keeps profile, observes residents and no bounce. Existing combat/EXP/respawn/village return and NPC heal/save/shop/two-client regressions pass. Browser captures all three maps and M→world atlas; real browser west-edge marsh→east-edge mangrove return confirmed. Atlas planned-node selection/filtering and fresh-load hydration checked; transient stale phase data during authoring cleared and fresh browser console clean. Portrait390×844 and landscape844×390 checked; physical phone not tested. Comparison /map-review/leveling-03/index.html and standalone /maps/world-atlas. No new generated art/credits used; bespoke terrain/bridge art and monster animation remain further polish, not claimed complete.

