# Mountain Sanctuary — Phase B

## Composition correction after USER feedback (2026-10-11)

USER accepts the elevated camera but finds left/right shoulders and blueprint
composition missing. The first two-shelf section was too reductive and is not
visually approved. Current section expands to 40x36 units with a bounded summit,
exposed lateral returns, western half-level shrine ledge/stairs/return ramp,
eastern teacher/viewpoint shoulder and forest descent. Two stream channels and
three physical bridge crossings use shared stream descriptors for art/blockers.
Secondary circuits join the main route and pass bidirectional shared-rule tests.
Paving reserves summit forecourt, ritual center and side sites; dark green terrain
masses indicate forest-floor composition only, not completed trees. Buildings,
actual vegetation sprites and settlement density remain unimplemented Phase D
work. No credits spent or camera rotation/diamond isometric projection added.
Current screenshots replace earlier evidence. This remains Phase B for review.

2026-10-11. USER approved Phase A and the proposed credit plan: “อนุมัติครับพร้อมเครดิตทั้งหมด”. The original phase boundaries remain: deliver and review the small terrain prototype before Phase C. No generation call, job polling or paid conversion was made in this stage. New spend: 0. Approval applies to the proposed proof budget (20–50 provider generations), not an unlimited whole-map budget.

## Approved direction and full-map draft

The supplied blueprint is visual direction, never a full-screen texture or collision map. It shows a broad inhabited foothill, an exposed ritual shelf, a narrower temple summit, side ravines, descending falls, dense perimeter forest and warm Thai architecture. Preserve upright facades and elevated three-quarter overhead perspective; do not adopt the side panels' diorama camera. The centered staircase in the illustration becomes a winding playable ascent with short flights and landings.

Full-map proposal: 96x112 world units at 32 render px/unit, existing assets remain at 2x (16 native px/unit). Polygon draft (before carving water and transition corridors):

- Z0: (14,73), (30,67), (52,72), (73,65), (88,78), (84,98), (63,105), (43,109), (20,101), (9,87).
- Z1: (16,48), (31,37), (53,40), (68,34), (83,47), (79,63), (64,70), (48,66), (33,72), (18,63).
- Z2: (29,16), (43,9), (60,12), (71,23), (68,34), (55,39), (41,35), (28,39), (23,28).
- Gate/warp (45,103), separate spawn (45,96), market (57,85), ritual center (49,55), training hall base (28,54), teacher residence base (69,51), temple base (49,26). Existing temple footprint 9.2x4.2 and training footprint 7.6x3.0 remain scale references.
- Main route uses west foothill ascent and east summit ascent. Secondary routes serve west shrine/stream viewpoints and east residences/forest exit. Exact side-route footprints remain provisional.
- Main stream: source near (64,18), upper fall (74,35), middle basin (80,49), lower fall (83,72), then southern drainage. Secondary western stream follows the shrine route.

Reuse buildings, plants, props, NPC IDs/sprites/services, player sprites and HUD. Move market services/guide/guard/teleporter to Z0 in the new data only, instructor/keeper to Z1, elder to Z2. Preserve production coordinates and quest/portal definitions. New-map quest anchors and destination links need Phase E validation.

## Implemented section

Open `/maps/mountain-prototype`. This is a separate local Phaser/Canvas scene, not a Colyseus room and not a registered gameplay map. There are no buildings, NPCs, character assets, UI-store changes or generated textures. The gold geometry marker is an explicit movement probe.

The 28x32 section contains two irregular elevation polygons, Z0 ground, two 3-unit stair corridors each with two flights and a middle landing, a winding connector, exposed continuous faces, two waterfalls and a bridge. Rise is provisionally 112 render pixels per level. Terrain and faces are authored from the same polygons; no scattered rock sprites stand in for cliffs. Flat shaded geometry is deliberately an unapproved placeholder, not final pixel art or a completed mountain city.

`ElevationDefinition.regions` is opt-in. `terrainHeight` tests transitions first, then ordered polygons, then legacy rectangles. Existing maps without polygons keep their prior height rules. The scene calls the same `stepMovement` / `elevationPassage` functions used by server gameplay. Cliff jumps and transition side entry are rejected. River blockers leave the bridge corridor open. Client graphics draw the same transition intervals and omit cliff faces inside them.

Keyboard, pointer direction buttons and a route tour perform real shared-rule movement. Overview/follow and optional level outlines are review controls. Resizing keeps one Phaser scene, position and controls. ResizeObserver, keyboard captures and game instance are disposed on unmount. High-frequency positions stay inside Phaser; React receives a status sample every 200ms.

## Verification

- Workspace `pnpm typecheck` and `pnpm build` pass (including client production build).
- `node packages/shared/scripts/mountain-prototype-test.mjs`: two-way full route, levels, stair sides/landings, cliff rejection, stop correction, river/bridge and unregistered gameplay map pass.
- Existing `node packages/shared/scripts/elevation-test.mjs`: S1–S6 and legacy object/NPC/spawn invariants pass.
- Real Edge/Playwright browser: 1440x1000 desktop, 390x844 portrait, 844x390 landscape. Keyboard ascent, pointer controls, scene/position persistence after resize, single canvas, no horizontal overflow or page errors pass. See `evidence/qa.json` and screenshots. Tests are local simulation, not multiplayer validation or an FPS benchmark.
- Existing production map/manifest and character image files were not edited by this stage. Pre-existing unrelated workspace changes remain.

## Next gate

USER visual approval of this concrete terrain section is required by the requested Phase B stop. Phase C can then use the already authorized initial proof budget. Required kit: 32x32/32x48 caps and corners, 64x64/64x96 continuous faces, 32x64 ends/joins, 48x64 short stairs, 64x32 landings, 32x32/64x32 ramps and 32x32/32x64/64x32 waterfall components. Dimensions are native, rendered at 2x.

Live MCP schema inspection: `create_topdown_tileset` has no direct image-reference field; it accepts descriptions and base-tile IDs. `create_image_pro` accepts up to four labelled references and style reference, costs 10–25 generations/call. Initial one-module proof followed by one joining module only after inspection: 20–50 generations total. Pro Flash 128x128 provisional quote is 6, but native style art must fit its canvas; the full blueprint cannot be passed there unchanged. No tool promises seamless modular output. Never request a decorative sheet and assume it is a usable kit. Full-kit pricing remains a later scoped proposal.
