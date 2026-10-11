# Umbral Capital (นครมนตร์ทมิฬ) — redesign blueprint

User brief 2026-10-09 ("Umbral Capital complete map redesign"). Target art direction: the user's Image B (a dense Thai
shaman city around a yantra plaza, temple, canals, sacred trees, lanterns). Image B is direction only; nothing from it
is traced, cropped or used as a generation reference. Names, layout and lore here are **proposals**, not approved
design.

## Phase 1 — what exists (inspected 2026-10-09)

| Area | Current state |
|---|---|
| Size | 80 x 60 world units, 1 unit = 32 px (`WORLD_UNIT_PX`). The brief assumed 256 x 256 tiles; the real map is 80 x 60 and is **kept** (no size change without approval). |
| Pixel density | Map art is drawn at 2x (`MAP_ASSET_SCALE`): 16 asset px per unit. New art keeps this. |
| Ground | `MapDefinition.ground`: a base material plus rectangles, each a seamless 128 px texture (`MapRenderer.renderMap`). No tilemap. |
| Objects | `MapDefinition.objects`: sprite id + base position; depth-sorted by y like characters; contact shadow each. |
| Collision | Object `footprint` rectangles + `blockers`; `isBlocked` / `stepMovement` in `packages/shared/src/world.ts`, used by both server and client prediction. No pathfinding (direct movement). |
| Spawn | `spawn` (40, 33); one map, no transitions. |
| NPCs / quests | None existed at the time of this audit. Now implemented: see "Town NPCs" and "Working services and citizens" below. |
| Lighting | `Lighting.ts`: night overlay + additive glows per light-emitting asset id. |
| Minimap | Rendered from the live scene once (`renderMapArt`) + `landmarks`; it follows any map change automatically. |
| Old art | ComfyUI SDXL sprites (European-looking houses, mixed styles); to be replaced. |

PixelLab tools verified in this environment (catalogue `docs/design/pixellab-tool-catalog.json`): `create_topdown_tileset`
(16/32 px Wang tilesets with corner autotiling, 1-4 generations, chainable via base tile ids), `create_map_object`
(transparent map objects, views low/high top-down, up to 400 px, style matching by inpainting), `create_image_pro_flash`
(up to 256 px, style image), `create_1_direction_object`, `edit_image`, `inpaint_image`. `create_map_object` rejects long
descriptions, so prompts are kept short.

## Engine changes (adapting the brief's layer list to this engine)

| Brief layer | Here |
|---|---|
| Base ground, terrain variations, roads and plaza | **Terrain grid** (new): one terrain id per map vertex (81 x 61), painted from region shapes in map data; drawn with PixelLab Wang tilesets (16 px tiles at 2x = 1 unit per tile). Pairs of terrains are joined by chained tilesets (grass ↔ road ↔ plaza, grass ↔ dirt, grass ↔ water). |
| Water | A terrain in the grid plus `blockers` for the unwalkable part; bridges are walkable gaps in those blockers with a bridge sprite on top. |
| Decals | **New** `decals` list: flat ground sprites under everything (yantra disc, mosaics). |
| Buildings, large props, decorations | `objects` (unchanged contract). |
| Foreground occlusion | Already: y-sorting puts the player behind a building's facade when north of its base. |
| Collision | `footprint` + `blockers` (unchanged). |
| Navigation / interaction metadata | `landmarks` (minimap names) now; NPC spots are reserved in this plan for when NPCs exist. |

## City plan (world units; north is up)

```
 y  0 ┌───────────────────────────────────────────────────────────────┐
      │ NW garden / temple dormitory      N  BLACK SPIRIT TEMPLE   NE shrine garden │
   10 │                                (40,14) courtyard 29-51 x 15-23 │
      │                   ║ avenue x 37-43                             │
   20 ├── W TRAINING QUARTER ──┐   ║   ┌── E TALISMAN MARKET ──────────┤
      │ hall (14,27)           │ ╔═╩═╗ │ herbal (58,27) talisman (68,27)│
   30 │ yard 6-24 x 33-41 ═════╪═╣ ◉ ╠═╪═════ market lane y 37        │
      │ dummies, instructor    │ ╚═╦═╝ │ stalls, exchange (71,40)      │
   40 ├────────────────────────┘   ║   └───────────────────────────────┤
      │ SW SPIRIT GARDEN           ║        SE COMMUNITY QUARTER       │
   50 │ sacred tree (14,50)        ║        varied Thai houses         │
      │ lotus pond, spirit house   ║                                   │
   60 └──────────────── S  CITY GATE (40,58) ─────────────────────────┘
```

- **Great Yantra Plaza (centre, built first).** Circular sandstone platform, radius 9, centre (40, 32), engraved yantra
  disc decal (16 units across). Central spirit pillar shrine at (40, 30) with a small footprint (2.5 x 1.2) north of
  centre; **spawn moves to (40, 36)**, 6 units clear of any collision. Four ritual pillars at the diagonals (±6, ±5),
  bronze braziers and lanterns on the ring, talisman banner poles at the four road mouths, two guardian statues
  facing the gate road, trees and flowerbeds only outside the ring. The ring stays walkable all round the pillar.
- **Main roads** 6 units wide: avenue x 37-43 (gate → plaza → temple), street y 30-35 (training quarter → plaza → market).
  Secondary paths curve through the garden and the community quarter.
- **North — Black Spirit Temple**: layered-roof temple, stone stairs, guardian pair, spirit altar off-axis, courtyard
  paving, cloth banners; future main quest NPC spot (44, 21).
- **West — Shaman Training Quarter**: training hall, dirt practice yard with ritual dummies and a target post, wooden
  platform, small gardens; future instructor spot (12, 36).
- **East — Talisman Market**: herbal shop, talisman merchant, equipment merchant, ritual material stalls, exchange booth
  near the market lane, hanging signs, lanterns; future merchant spots by each shop.
- **South — City Gate**: carved wooden gateway, two guardian statues, watch posts, banners; the avenue leaves the map
  (future transition point (40, 59.5)).
- **Southwest — Spirit Garden**: ancient sacred tree with a spirit house, incense offerings, curved stone path, lotus pond
  (water terrain + blocker), benches.
- **Southeast — Community Quarter**: 4-6 different Thai wooden houses, fences, pots, lanterns, a small gathering yard.

First 30 seconds: the player spawns on the plaza facing north with the spirit pillar in front, the temple roof straight
ahead up the avenue, and the gate visible down the avenue behind.

## Asset families (PixelLab; `tools/map/generate_city_assets.ps1`, prompts in `docs/design/umbral-v2/assets.json`)

- Ground tilesets (16 px): grass ↔ stone road, stone road ↔ plaza paving, grass ↔ dirt, grass ↔ water.
- Plaza: yantra disc decal, spirit pillar shrine, ritual pillar, brazier, lantern, banner pole, guardian statue, flowerbed.
- Architecture: spirit temple, training hall, herbal shop, talisman shop, market stall variants, exchange booth, 3+ house
  variants, city gate, watch post, spirit house.
- Nature: sacred tree, large trees, bushes, lotus, flowers.
- Decorations: incense burner, ritual bell, offering table, training dummy, benches, fences, pots.

## Phases

1. Inspection (above). 2. This blueprint. 3. Style test: plaza tileset, spirit pillar, lantern, Thai house, sacred tree,
validated in the running game. 4. Great Yantra Plaza with real sprites, tiles and collision; screenshots.
5. Districts. 6. Polish (gardens, lighting, storytelling props). 7. Gameplay validation (routes, collision, spawn,
minimap). Districts start after the plaza is approved.

## Progress log

### Phase 3 — style test (2026-10-09)
PixelLab assets (raw in `docs/design/umbral-v2/raw/`, ids and prompts in `docs/design/umbral-v2/assets.json`, contact
sheet `docs/design/umbral-v2/screens/style-test-sheet.png`): ritual lantern, spirit pillar, sacred bodhi tree with spirit
house, road→plaza Wang tileset. Findings:
- `create_map_object` matches the pixel density (16 px per unit) and the three-quarter look for props and trees.
- It drew the Thai house **isometric on a grass diamond**, which breaks the camera rule (AGENTS.md: no diamond
  isometric). Buildings therefore use `create_image_pro_flash` with a straight-on facade prompt (`house-front`, kept
  as `teak-house`).
- PixelLab fills the canvas, so the **canvas size decides the in-game size**. The first brazier (3.5 units), guardian
  (7 units) and flowerbed were far larger than the 1.9-unit player and were regenerated at smaller canvases (`*-s`).
- The first plaza paving read as orange wicker; the second (chained to the same road tile) has a text-like glyph in
  its solid tile, so sandstone is only painted under the yantra disc and never shows on its own.

### Phase 4 — Great Yantra Plaza (2026-10-09, awaiting review)
- Engine: `MapDefinition.terrain` (vertex terrain grid painted from rect/circle strokes, `terrainVertices` /
  `cellCorners` in `packages/shared/src/world.ts`, tests `scripts/terrain-test.mjs`), drawn by `MapRenderer.renderTerrain`
  into one texture with the matching Wang tile per cell; `MapDefinition.decals` (flat ground sprites); `MapObject.flip`.
  v1 region textures stay underneath, so unpainted areas look as before.
- Art pipeline: `tools/map/generate_city_assets.ps1` (generation) → `tools/map/build_city_assets.py` (crop, anchor,
  tileset corners → `apps/client/public/assets/umbral/manifest.json`, merged with the v1 entries).
- Plaza (`packages/shared/src/maps/umbral-capital.ts`): v2 stone road tiles on the avenue, street and a 22x22 square;
  engraved yantra disc (14.5 units, walkable); spirit pillar shrine at (40, 31) with two incense urns; four ritual
  pillars on the diagonals; four bronze braziers; ritual lanterns at the road mouths; talisman banners at the temple
  road; a guardian pair facing the gate road; four lotus flowerbeds. v1 skull lanterns and banner poles that clashed
  with the plaza were removed. Lights added for the new lanterns, pillar and house.
- Spawn moved to (40, 36): the 4x4 units around it are free; the nearest collision is 4.5 units away. Walking a loop
  round the pillar, and from spawn to the west street, east street and gate, all work (script check); the temple is
  reached by stepping round the pillar (unit test `character-test.mjs`).
- Camera: the view centre sits 2 units north of the player so the pillar and the road ahead are visible at spawn.
- Minimap and world map pick up the plaza automatically (they render from the scene).
- Screenshots: `docs/design/umbral-v2/screens/` (before: `before-v1-map.png`).
- Generation spend: 15 `create_map_object` calls, 3 Pro Flash images, 2 tilesets; map-object and tileset responses do not report their cost,
  so the exact spend is not logged.

Open before Phase 5: the v2 road tile is busy (blue-violet grid lines); a calmer stone road tileset and a
grass↔road tileset are the first district assets. The spirit pillar reads dark under the night overlay.

## Level design overhaul (user brief 2026-10-09, "Umbral Capital level design overhaul")

Backup of the map data before this pass: `docs/design/umbral-v2/backup/umbral-capital.before-level-design.ts.txt`
(copy it back over `packages/shared/src/maps/umbral-capital.ts` to revert). Full-map captures come from the dev hook
`window.__shamanDebug.mapArt()` (the scene's minimap picture: ground, shadows, buildings, no night overlay).

### Phase 1 — problems in the current layout (`screens/city-before-level-design.png`)
- The map is hand-authored data (no procedural generation); the repetition is in the data itself: 13 v1 houses in a
  grid (rows at y ≈ 14-18 and 50-55, x every ≈ 9-10 units), each with a crate pile and a barrel pile beside it, and
  12 trees on a regular sprinkle over the corner grass.
- The whole city is mirrored left/right; roads are one perfect cross of equal width; the four corners are flat
  rectangles of grass and earth with nothing tying them together.
- Plaza: 25 props on a 22 x 22 square (8 pillar/lantern posts, 4 braziers, 2 banners, 2 guardians, 4 flowerbeds...)
  — crowded, while the temple north of it is small and dark.
- Mixed architecture: one Thai teak house among European-looking v1 houses, shops and academy.
- No NPCs, shops, portals or quest triggers exist in the game yet; the spots below are reserved for them.

### Phase 2 — coordinate blueprint (80 x 60 units, north up; spawn stays (40, 36))

| District | Area (x, y) | Composition |
|---|---|---|
| Great Yantra Plaza | circle r 11 at (40, 32) | open stone floor, disc, spirit pillar; ceremonial symmetry only here: 4 ritual pillars on the disc, braziers at the temple road, guardians at the gate road, lanterns at the east/west mouths, 4 corner flowerbeds |
| Black Spirit Temple | 28-52 x 2-21 | new large Thai temple at (40, 12); paved forecourt 33-47 x 12-21 rising from the avenue; guardian pair at the stairs; lantern pairs along the approach; banners flank the hall; spirit altar off-axis at (46, 17); tree clusters behind (NW, NE). Quest NPC spot (43, 18). |
| Training quarter | 3-28 x 17-29 and 6-24 x 36-45 | training hall (13, 27) facing the street; earth yard south of the street with dummies and steles as spell targets, braziers, fence on its south edge; instructor spot (12, 38); dormitory pair NW of the hall on a side path |
| Talisman market | 50-78 x 20-46 | east street widens into a market square 55-73 x 35-44; herbal shop (57, 28), talisman shop (67, 28) and equipment shop (75, 29, row house) face the street; stalls ring the square; storage crates and barrels behind shops and stalls; lanterns at shop doors; an alley at x ≈ 62 to the north quarter; trader spot (64, 40) |
| North-east lane houses | 55-76 x 4-16 | cluster of 4 varied houses round a small courtyard with a well, fenced gardens, path to the market alley |
| Community quarter (SE) | 50-76 x 47-58 | 3-4 houses in two loose groups on a winding earth path from the avenue, fences, pots, shared yard |
| Spirit garden (SW) | 4-32 x 45-58 | sacred tree at (14, 50) with offerings and flowerbeds, winding path from the avenue past a shrine stele, tree clusters, open lawn |
| North-west grove | 2-27 x 2-14 | open lawn with tree clusters and one small house pair: deliberate negative space |
| City gate | 33-47 x 52-60 | gate (40, 58.5) with banners and lanterns; portal spot (40, 59.5) |

Roads: main avenue x 37-43 (straight for orientation); west street narrower (4 units) with a slight jog; east street
widens into the market square; secondary earth paths are drawn as `path` terrain strokes (curved polylines).

### Phases 3-8 — implementation (2026-10-09)

The user added a city prototype image mid-task (walled city, canals with bridges, temple up north, Great Yantra
Plaza in the centre, named districts round it, dense planting, warm lanterns) and asked for canals and a lively city.
It was used as layout direction only (district placement and names); no part of it was traced or used as a reference
image for generation.

New PixelLab assets, generated only where the layout could not be built from existing art. The user approved about
45 generations; including the canal set this pass cost **55 generations** (balance 1,396 → 1,341):
- Buildings (Pro Flash, front-facing): Thai temple hall, training sala, stilt house, teak row house.
- Map objects: fence, training dummy, two footbridges, wall tower, cypress, blossom tree, flower bush, lotus pads, plus
  a Pro Flash wall section.
- Tilesets, chained so their edges match: grass ↔ road (the existing road tile), water ↔ grass and grass ↔ earth (both on
  the new grass tile).
- Rejected and kept in raw/ only: neon-green grass (`tiles-grass-road`) and a "pine" that came with a small house.

Engine additions:
- A `path` terrain stroke for winding paths.
- Junction cells where three terrains meet are folded to the two most common, so a Wang tile always exists.
- A muted tint on the terrain layer.
- Dev hooks `__shamanDebug.mapArt()` (whole-map picture) and `lookAt(x, y)` (point the camera for district screenshots).

The layout (`packages/shared/src/maps/umbral-capital.ts`) has 177 objects, each placed by hand and grouped by
district constants. Nothing is scattered or generated.
- **Walls and canals.** North and south wall runs with towers at the corners and beside the gate. Long canals run along
  both sides, and branch canals cut off the southern quarters. Two footbridges are the only crossings to the south-west
  and south-east, which makes those quarters destinations.
- **Temple.** Large Thai temple hall at the head of a paved forecourt that reaches its stairs. Guardian pair, lanterns
  lining the approach, banners, an off-axis spirit altar (quest NPC spot), blossom trees and cypresses behind.
- **Plaza.** The only symmetric composition: disc, spirit pillar, 4 ritual pillars, 4 fire bowls, guardians to the gate
  road, lanterns at the side mouths, corner planting.
- **Spirit garden (NW).** Lotus pond, sacred tree with offerings, a winding earth path down to the plaza.
- **Training quarter (W).** Hall with a paved apron on the street, a dormitory, and an earth yard with dummies, target
  pillars and a fire bowl. A fence closes the yard, with a gap to the south bridge.
- **Market (E).** Herbal brewery and talisman shop front the market street. Storage sits behind them, and an alley leads
  to the brahmin lane. Stalls ring an open square with a trader spot.
- **Quarters.** Brahmin lane (NE) has houses round a well courtyard. The shaman houses (SW) and the community quarter
  (SE) are loose house groups on winding paths with fences, wells, barrels and lanterns.
- **Gate (S).** Gate with guardians, banners and lanterns. Portal spot (40, 59.2).
- **v1 assets removed.** The European houses, shops, academy, skull lanterns, bone totems and gothic steles are all gone.
  The v1 city gate, well, crates, barrels, cauldron and market stalls stay.

Validation:
- `packages/shared/scripts/city-test.mjs`, part of `pnpm test`:
  - floods the walkable grid from spawn with the server's own collision;
  - checks every landmark and reserved NPC spot (temple quest, instructor, two merchants, trader, gate portal, both
    southern quarters) is reachable;
  - checks spawn has 2 units of clearance;
  - checks no solid footprints overlap and nothing solid stands in water;
  - checks 82% of the map is reachable.
- Movement and HUD checks in the running game:
  - keyboard and joystick walking move the player (X 40 → 44);
  - the world map and minimap show the new city;
  - no HUD overlaps.
- Screenshots in `docs/design/umbral-v2/screens/`:
  - `city-before-level-design.png` → `city-after-level-design.png`;
  - `district-*.png` (plaza, temple, training, market, garden, south-west, south-east, gate);
  - `ingame-*.png`, `worldmap-level-design.png`.

Still open:
- The road tile's busy grid pattern.
- The v1 city gate sprite is dark and plain next to the new architecture.
- East and west edges have canals but no wall (there is no side-view wall art).
- The plaza circle steps on the tile grid.
- There are no NPCs yet to place on the reserved spots.

### Review fixes (2026-10-09): camera zoom, Thai gate, calm road

- **Camera zoom** (`apps/client/src/game/input/CameraZoom.ts`):
  - Controls: mouse wheel, `-` / `=` (with `0` to reset), and a two-finger pinch on the game canvas. The joystick is a DOM
    element, so it never starts a pinch.
  - Range: zoom is a level times the normal play zoom. It goes from "whole map fits the screen" (0.28 at 1280x720) to
    1.6x, with easing.
  - Once zoomed out past the map, the camera bounds widen evenly on both sides so the city stays centred.
  - It is visual only: rules never read it.
  - Checked in headless Edge with real input:
    - wheel out to 0.28;
    - `=` back in;
    - `0` resets to 1;
    - wheel in to 1.6;
    - pinch 220 → 60 px on 375x812 gives 0.3;
    - the joystick still walks.
- **City gate**: new Pro Flash Thai gate (`thai-gate`, 8.4 x 9.4 units). Its pillar blockers are measured from the
  sprite's bottom rows, and the passage x 38.6-41.4 stays open.
- **Road**: new chained tileset `tiles-road-calm` (grass ↔ worn grey flagstones, on the same grass tile as water and
  earth). It replaces the busy blue-violet grid road. The plaza paving terrain was dropped, because the yantra disc
  covers that ground.
- `build_city_assets.py` rebuilds the tileset list on every run, so superseded sets leave the game.
- About 10 generations.
- Screenshots: `screens/gate-thai.png`, `road-calm-market.png`, `zoom-out-1280x720.png`, `zoom-pinch-375x812.png`,
  `city-after-gate-road.png`.

### East and west walls (2026-10-09)
- A new Pro Flash piece, `wall-side` (48 x 128). It shows a wall running north-south in the three-quarter view: a long
  vertical strip with the crenellated walkway on top and the stone face down one side.
- A `create_map_object` try (`wall-side-obj`) came back as a tower and was not used.
- The strip leans near its top. `build_city_assets.py` therefore takes rows 87-118, which are straight and have the
  smallest seam (found by searching start row and length), and tiles them into an 8-unit segment `city-wall-side`.
- Seven segments are stacked end to end along each map edge, outside the canals, so no footprint is needed. The east
  run is flipped so the stone face looks into the city.
- Corner fillers close the gap between each corner tower and the first north and south wall sections. The city is now
  enclosed on all four sides.
- Cost: about 10 generations.
- Screenshots: `screens/city-after-side-walls.png`, `wall-west.png`, `wall-south-east-corner.png`.
- The repeat in the side walls is visible close up. There are no banners on them yet.
- Banner sections (2026-10-09, no generation): `city-wall-side-banner` is the same tiled segment with the strip's
  own red banner pasted on its middle. The banner comes from the leaning top rows 43-70 and sits on the same face
  columns, so its colours and outline match. Sections alternate plain and banner; west and east are offset by one so
  the pattern is not mirrored. Screenshots: `screens/city-after-wall-banners.png`, `wall-east-banner.png`,
  `wall-west-banner.png`.

### Lighting redesign (user brief 2026-10-09)

**Before.** The map had 51 light sources:
- 22 identical amber `ritual-lantern` posts, set in pairs along every road and at all four plaza mouths;
- 6 bronze braziers (4 on the plaza, 1 in the training yard, 1 in the market);
- glows on every building (7 stilt houses, 3 row houses, 2 teak houses, the hall, temple and gate);
- 6 wall towers and the spirit pillar.

All glows were full strength (alpha 1) with radii of 2-5.5 units, so the plaza did not stand out.

**New assets.** `create_map_object` (about 4 generations each):
- `talisman-lantern`: short teak post with a bronze lantern, red thread and a talisman cloth.
- `spirit-lantern`: carved stone pedestal with a jade spirit crystal.
- `ritual-fire`: carved bronze ritual brazier.
- `hanging-lantern`: red paper lantern on a bracket. Map objects can now be drawn `lift` units above their base, for
  eaves and awnings; lifted objects get no contact shadow.

**Placement.** The 22 amber posts are gone. What replaced them:

| Place | Lights now |
|---|---|
| Plaza | 2 jade spirit stones (west and east mouths, diagonal) |
| Temple | 1 ritual fire pair at the stairs |
| Gate | 1 ritual fire pair |
| Training yard | 1 ritual fire |
| Spirit garden | 1 jade spirit stone by the pond |
| Roads | 6 talisman posts at junctions and bridge heads, none opposite each other; 2 on the avenue, offset |
| Market and houses | 7 hanging lanterns on shop eaves, stall awnings and one house per residential group |

The market brazier was removed. Free-standing light props went from 28 to 18; including hanging lanterns, from 28 to
25 lights in different roles.

**Lighting system** (`apps/client/src/game/world/Lighting.ts`).
- Each light now has a `strength` (glow alpha) as well as a radius.
- Tuned to the brief's hierarchy:
  1. Plaza spirit pillar: jade, radius 5.2, strength 0.95.
  2. Temple and ritual fires: warm, 0.6-0.7.
  3. Market hanging lanterns and shops: 0.55-0.7.
  4. Houses and towers: 0.25.
- All radii are smaller than before, so glows never wash out the art.
- The night overlay is 0.5 (was 0.42). The player's own light keeps the character readable.

**Validation.**
- Collision layout test passes (193 objects, 82% reachable, every district and NPC spot reached).
- Keyboard and joystick walking work; minimap and world map are correct.
- Before/after screenshots at maximum zoom-out, normal zoom, and close-ups of plaza, market and temple:
  `docs/design/umbral-v2/screens/light-{before,after}-{zoomout,normal,plaza,market,temple}.png`.

**Cost.** About 20 generations (balance 1,341 → 1,321 across this and the wall work).
- Follow-up (2026-10-09). Four more hanging lanterns in the market: two stall awnings and the shop eaves.
  Screenshot: `screens/light-after-market-more.png`.
- Zoom-out rule (user): the view must never go past the city walls. `CameraZoom.minLevel` now uses the level at which
  the map *covers* the screen on its tighter axis, instead of fitting the whole map. The camera bounds stay the map
  rectangle.
  - Checked with real wheel input plus a forced zoom of 0.01 at 1280x720, 1920x1080, 375x812 and 844x390. The camera
    world view stayed inside 0..2560 x 0..1920 every time.
  - New dev hook: `__shamanDebug.camera()`.
  - Screenshots: `screens/edge-*.png`.

### Landscape and garden pass (user brief 2026-10-09)

**Superseded / rejected by user.** The pass below failed visually: repeated planters and isolated small trees. Its historical validation does not imply art approval. The corrective implementation is `LANDSCAPE_LAYOUT_PLAN.md`; only the northwest garden is redesigned and all other district garden work waits for review. The pre-correction source is preserved at `backup/umbral-capital.before-garden-fix.ts.txt`. Mature blossoms, sacred tree, pond, buildings, walls and lighting survive.

**Audit and backup.** The audit before this pass is in `docs/design/umbral-v2/backup/vegetation-before-landscape.txt`
and the old map data is in `backup/umbral-capital.before-landscape.ts.txt`. The map had 61 vegetation pieces:
- 27 cypresses, many set singly along the canals and walls;
- 7 pink blossom trees spread over every district;
- 15 lone bushes;
- 4 flowerbeds and 7 lotus pads.

**New low-layer pieces.** These are `create_map_object` calls (about 7 generations); no trees were regenerated:

| Asset | Result |
|---|---|
| `shade-tree` | used as the small tree |
| `stone-bed` | stone-bordered planting bed |
| `clay-pots` | used |
| `reed-planter` | reeds in a stone edge; used on canal banks and as herb planters |
| `garden-shrine` | asked for mossy stones, got a small mossy spirit shrine; used as one in the spirit garden |
| `stepping` | rejected (came out as drums) and kept in `raw/` only; the existing earth paths serve as stepping paths |
| `shrub-low` | rejected (drawn on a ground tile) and kept in `raw/` only |

**Composition.** All scattered vegetation was removed from the district lists and recomposed in one `LANDSCAPE` group in
`umbral-capital.ts`, by zone:
- **A. Spirit garden (NW).** The sacred tree is the focal point. Around it:
  - supporting trees: one blossom across the pond and two shade trees beside the sacred tree;
  - a three-cypress clump at the wall plus one on its own;
  - two uneven shrub clusters;
  - reeds on the pond banks;
  - a spirit shrine between the pond and the tree;
  - pots at the house.
- **B. Temple garden (N).** Mirrored about x = 40: a blossom pair, two cypress pairs behind, and stone beds flanking the
  forecourt. The altar flowerbed was removed so the off-axis altar reads clearly.
- **C. Plaza.** The loose bushes, cypresses and flowerbeds were removed. Four stone beds now sit on the outer corners,
  with ornamental trees only on the temple side. The ceremonial ring is open.
- **D. Households, each different:**
  - SW: blossom shade tree, pots, a bed in front of the row house, a tree by the last house, a corner cypress.
  - SE: shade tree at the path, a bed by the first stilt house, a shrub corner, a tree by the wall.
  - NE: bed and tree screen the lane, cypress clumps at the wall, pots at the door.
- **E. Canals and market.** Reeds in clumps on the long and branch canal banks (no even spacing), and herb pots and
  planters at the shops; no large trees in front of entrances.

Totals: pink trees 7 → 4, lone bushes 15 → 8 (all in clusters), cypresses 27 → 19 (all in groups).

**Validation.**
- The layout test passes: 208 objects, 81% reachable, all districts and NPC spots reached, no overlaps.
- Walking works.
- Screenshots in `docs/design/umbral-v2/screens/`:
  - `landscape-before-*.png` and `landscape-after-*.png` (city, garden, temple, south-west, south-east);
  - `landscape-after-zoomout.png`.

### Town NPCs (2026-10-09)

**Cast.** Eleven NPCs cover the services most MMORPG starting towns have. They are defined in
`packages/shared/src/maps/umbral-npcs.ts` (types and helpers in `packages/shared/src/npc.ts`). Names, lines and
services are provisional.

| NPC | Role | Where |
|---|---|---|
| นวลจันทร์ | guide | beside spawn |
| แม่ศรีเรือน | save point / shrine keeper | on the yantra disc |
| หลวงตาธรรม | main quest giver | temple altar |
| อาจารย์คง | class trainer | training yard |
| ป้าบุญมี | consumables | herbal brewery |
| ช่างเพียร | equipment / talismans | talisman shop |
| เถ้าแก่ทอง | gold exchange | market square |
| ลุงมั่น | storage | market entrance |
| ช่างเหล็กอินทร์ | refine / enchant | market alley |
| แม่มดเรไร | teleporter | gate |
| พลทหารเสือ | gate guard | gate |

**Sprites.** Eleven `create_image_pro_flash` 128 px front-facing sprites, each using the main character's south frame as
the style image so proportions and outline match. About 69 generations (1,314 → 1,245). Raw art is in
`docs/design/umbral-v2/raw/npc-*.png`; `build_city_assets.py` writes `assets/umbral/npcs/` and `manifest.npcs`.

**World layer** (`apps/client/src/game/world/NpcLayer.ts`).
- NPCs are drawn like the player: the 128 px frame at half scale, y-sorted, with a contact shadow.
- Above each head: the Thai name, the title, and a bobbing role marker (yellow `!` for quests, `?` for the guide, jade
  `◆` for shops, `✦` for save and teleport). These stay above the night overlay.
- NPCs are collision: `MapDefinition.npcs` feeds `isBlocked`. Server and client agree: walking into the guide stops both
  at y 38.26.

**Interaction.**
- Within 2.6 units a "คุยกับ… · กด F" prompt appears. It is a real button, so it can be tapped on phones.
- F, Space, Enter, the prompt or clicking the NPC opens the dialog. Clicking from too far shows a toast instead.
- The dialog (`components/npc/NpcDialog.tsx`, a kit `Window`, exclusive with the other centre windows) shows a portrait,
  the greeting and the options. Walking out of range or pressing Esc closes it.
- The first version only linked existing windows and showed every other service disabled. That is superseded: every
  service now runs on the server (see "Working services and citizens" below).

**Minimap and world map.** NPCs appear as a yellow `!` for quest givers and amber dots for everyone else.

**Validation.**
- `city-test.mjs` checks no NPC overlaps an object, each NPC can be approached and none stands on the spawn.
- In-game, with real keys:
  - the prompt appears near the guide;
  - F opens the dialog, and its map option opens the world map and closes the dialog;
  - F reopens it, and walking away closes it.
- No HUD overlaps at 375x812.
- Screenshots: `screens/npc-{dialog,prompt,plaza,market,temple,gate,training}.png`.

### Working services and citizens (2026-10-09, completed by Codex)

The user asked for working NPCs and for children and elders who walk around town without interaction. Codex finished
this work; the summary here reflects the shipped code.

**Services.** Each button in `components/npc/NpcServices.tsx` sends an `npc` request. `GameRoom` checks the NPC role,
the server-side player distance, the shop stock and the profile balance (`apps/server/src/rooms/npc-services.ts`, rules in
`packages/shared/src/economy.ts`). The panel redraws from the profile snapshot the server returns.

| NPC | Working service |
|---|---|
| แม่ศรีเรือน | heal HP/SP, set save point |
| ป้าบุญมี, ช่างเพียร | buy / sell (stock in `SHOPS`), carry weight shown |
| ลุงมั่น | deposit / withdraw storage |
| ช่างเหล็กอินทร์ | refine +0 → +REFINE_MAX with Silver and dark ore; +0..+3 always succeed, failure never drops a level |
| หลวงตาธรรม | quest `first-steps` (talk / visit steps, Silver, skill point and item rewards) |
| อาจารย์คง | learn Medium skills with skill points (unlock records only; no combat yet) |
| แม่มดเรไร | teleport to the save point (free) or to town spots for Silver |
| เถ้าแก่ทอง | fixed-rate NPC Gold exchange (separate from the sample player market) |
| นวลจันทร์, พลทหารเสือ | talk only (town tour, map shortcut) |

- Profiles are session-only. Leaving or restarting the server resets them; there is no authentication or database.
- Prices, rates and rewards are provisional design data, not an approved economy.

**Ambient citizens.** Three children and two elders (`UMBRAL_CITIZENS`) walk safe loops with pauses, simulated by the
server. `CitizenLayer.ts` draws them; they have no prompt and no collision footprint. Their art is original PixelLab
idle rotations plus 8-frame east/west walks (`docs/design/citizens/`, built by `tools/sprites/build_citizens.py`).

**Archived walkers.** Before Codex took over, `tools/map/make_walkers.ps1` generated four PixelLab walkers (boy, girl,
grandpa, grandma), stored in `docs/design/umbral-v2/walkers/`. They are kept as provenance only. The runtime uses
Codex's citizens, so these walkers are not wired in.

**Tests.**
- `pnpm --filter @shaman/client test:npc`: service unit tests plus a two-client network smoke (range, transactions,
  profile isolation).
- `pnpm test`: the existing movement smoke.
- Details: `docs/design/citizens/README.md`.
