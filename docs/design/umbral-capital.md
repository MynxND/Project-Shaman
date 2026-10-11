# Umbral Capital / นครมนตร์ทมิฬ (provisional)

User request 2026-10-08: replace Spirit Confluence with a capital city of black-magic shamanism as the first and main map, about 3-4 screens. Name, lore and layout below are **proposals, not approved design**.

## Theme (proposal)

The seat of the shaman schools that bargain with darker spirits: curse-craft, bone divination, spirit binding, blood rites. Still the shared hub for all 12 nations, so it reads as a crowded, lived-in city rather than a ruin.

Palette: basalt and obsidian stone, weathered dark wood, bone white, tarnished gold trim, crimson prayer banners, violet and sickly green spirit fire as the light sources. Night-leaning ambient. HUD palette (dark teal, antique gold, parchment) is unchanged.

Camera stays Classic RO: elevated three-quarter overhead, upright facades, continuous rectangular ground (docs/art-direction.md).

## Layout (80 x 60 world units, 32 px per unit, 2560 x 1920 px)

| Zone | Where | Contents |
|---|---|---|
| Temple of the Black Spirit | north centre | largest building, stairs facing south |
| Grand Ritual Plaza | centre | ritual circle decal, braziers, totems; player spawn |
| Academy of Curses | west | academy hall, steles, dead trees |
| Night Market | east | shops, stalls, cauldrons, lanterns |
| Residential lanes | north-west, north-east, south-west | houses |
| City Gate | south centre | spirit gate, banners, road leaving the map |

Streets are orthogonal (north-south avenue gate -> plaza -> temple, east-west street academy -> plaza -> market).

## Assets (ComfyUI, concept-to-sprite pipeline)

Generated with SDXL + Pixel Art XL in ComfyUI to save PixelLab generations (user decision). Each sprite is generated on white, downscaled /8 to the Pixel Art XL grid, background-keyed, then resampled to its target height at 16 asset px per world unit and drawn at 2x (one asset pixel = 2 world px), so the whole map shares one pixel density.

- Buildings: temple, academy, curse shop, apothecary, house A, house B, city gate.
- Props: spirit-fire brazier, bone totem, skull lantern post, cauldron, market stall, dead tree, stele, banner pole, well.
- Ground: basalt cobblestone, packed dark earth, ritual paving, dark grass (seamless textures).
- Decal: ritual circle.

Each object has a footprint (collision rectangle at its base) in the shared map definition; the server blocks movement into footprints.

## v1 status (2026-10-08)

- Map data: `packages/shared/src/maps/umbral-capital.ts` (ground regions, 48 objects, gate-pillar blockers). Rules: `isBlocked` / `stepMovement` in `packages/shared/src/world.ts` (slide along obstacles, map-edge margin 0.5).
- Assets: chosen ComfyUI outputs listed in `tools/sprites/build_umbral_assets.py` (CHOICES, HEIGHT_UNITS), built into `apps/client/public/assets/umbral/`. Workflows: `docs/design/comfyui/map-assets/` via `tools/comfyui/build-map-asset-workflows.mjs` (seed 2001) and `build-ground-workflows.mjs` + `wrap_ground.py` (seamless ground).
- Client: `apps/client/src/game/world/MapRenderer.ts`; camera follows the local player inside the map bounds (~22 x 16.5 units visible).
- Preview: `docs/previews/umbral-capital-v1.png`, collision overlay `docs/previews/umbral-capital-v1-collision.png` (rendered by `tools/sprites/render_map_preview.py`).

Density and lighting pass (2026-10-08): +55 decor objects (street lanterns, temple braziers and steles, gate totems, crates/barrels clusters from ComfyUI, trees in the grass, a second well) and ritual-paving forecourts at the temple and gate (103 objects total). `apps/client/src/game/world/Lighting.ts` adds contact shadows under every object and character, a night darkness layer, additive flickering glows per light-emitting asset (braziers, skull lanterns, cauldron, candles, charm pot, temple, apothecary, red-roof houses) and a warm light on the local player. Tweens run on real time, so flicker is refresh-rate independent. Seven more props (fence, rocks, gravestone, shrub, candles, bone pile, charm pot) are defined in the workflow script but were not generated: the PC lost power twice during ComfyUI GPU runs.

Known v1 gaps: the temple reads smaller than intended (source sprite was below its target height and is not upscaled); "dead-tree" came out leafy; the city gate sprite had white inside the arch, cleared by the build script; SDXL picks were by eye from 4-image batches, so style varies between assets. Not yet checked in a live browser: the in-app browser pane was throttled to ~1 frame per 3 s during this session.

Map UI landmarks (2026-10-09): `UMBRAL_CAPITAL.landmarks` labels the zones above for the minimap and world map (วิหารวิญญาณดำ, ลานพิธีใหญ่, สำนักศึกษาคำสาป, ร้านคำสาป, ร้านยาสมุนไพร, ตลาดราตรี, ประตูเมือง). Thai names are provisional.

Redesign 2026-10-09: see `docs/design/UMBRAL_CAPITAL_REDESIGN.md` (blueprint, PixelLab v2 assets, Great Yantra Plaza; spawn now (40, 36)).
