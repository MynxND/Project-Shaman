# Animated water prototype + bounded zoom

2026-10-14. User request saved in `source-request.txt`. This is a working visual prototype using existing art, not final premium-art acceptance.

## Implementation

Existing Phaser3.90 `MapRenderer` uses native16 Wang cells at scale2, one cached terrain texture, base-Y objects and shared Colyseus collision. Previously water was baked into the static ground. New `WaterLayer` receives the exact resolved tile corners from that renderer, derives immutable coverage from the existing illustrated water/grass tiles and draws a single map-wide WebGL shader below props and ground dressing. Neighboring cells share one world-space pixel grid and a clock retained per Phaser game. No per-tile timers or texture uploads per WebGL frame.

The mask records water coverage, global shoreline distance, contact sites, water mode and channel direction. Circles default to pond; rectangular channels default to river with horizontal/vertical flow and faster narrow channels. `WaterControls` can override type, flow vector, tint, ripple intensity, shoreline and clock speed/pause. Independent rates default to river8 nativepx/s, pond0.14 rad/s, swamp0.07 rad/s and waterfall40 nativepx/s. Native-pixel sampling and dual texture phases animate existing illustrated strokes; no random noise bitmap is generated. Seeded ring sites share the clock. Trees/houses/bridges contribute faint mirrored lower artwork, clipped to water; reflected pixels gently wobble. Bounds and silhouettes never move.

Nearest/min/mag and clamp are explicit for every sampler (Phaser Shader defaults otherwise overwrite texture filtering). Coverage is stored opaque for wet pixels, preventing premultiplied-alpha loss of mask data. Elevation uses the same cached-ground vertical offset as the existing renderer. Scene shutdown removes listeners and owned mask/reflection/fallback textures; shared source textures remain cached.

Canvas fallback updates the same fixed coverage and illustrated surface at8fps with flow, coherent highlights, shoreline and faint reflections. It has reduced effects compared with WebGL and no GPU shimmer rings; performance is hardware dependent. The preview waterfall uses the existing transparent candidate at scale2 with a shared clock, downward motion and retained receiving foam; it is not added to gameplay maps. A Canvas waterfall path is included for inspection.

## Preview and capture

`http://localhost:3000/maps/water-preview` uses the actual production renderer and registered map data. Controls switch modes/maps, flow direction, speed, ripple, tint, shore, before/after, pause/resume, step125ms, zoom and camera pan. This review scene does not simulate combat or claim markers are server gameplay. `?renderer=canvas` selects the fallback without changing the live game renderer.

`water-preview.gif` is a finite three-second clip assembled from25 actual Phaser screenshots with controlled125ms timeline steps. It is not an artist-generated simulation or a proof of a finite sprite-sheet loop. The real shader runs continuously and never resets to a first frame. Original PNGs remain in `screens`; `capture-analysis.json` verifies changes in all24 adjacent pairs, including a water-interior probe away from lamps/UI. Static screenshots alone are not used as animation proof.

Rebuild assets: `node tools/map/build-water-assets.mjs`. Pure/time/mask checks: `node tools/map/test-water.mjs`. Assemble captured frames with `tools/map/export-water-capture.py` and bundled Python/Pillow. Source art hashes and binary16-corner mask tests are preserved. No paid art or local GPU generation.

## Zoom correction

The previous development village overview used contain-fit and removed camera bounds, exposing blank space on mismatched aspect ratios. It now enters at the existing `CameraZoom` cover minimum, retains world bounds and accepts the existing wheel/key/pinch controls. Cover = max(viewport width/map width, viewport height/map height). Overview keeps the camera centered; normal play keeps player follow. Aspect-ratio differences crop the longer map dimension rather than reveal outside space. Resize clamps without recreating the game/session. `CameraZoom` also permits a cover minimum above its normal max-level when a future small map requires it.

## Validation and limits

Typecheck/build and water clock/mask tests pass. Equal elapsed time at15/30/60/120fps, pause/single step, deterministic phases, source PNG hashes and all registered-map cover bounds are tested. Existing village navigation/gameplay invariants, original terrain assets and live NPC multiplayer/services tests pass. Browser map switches preserve paused clock; actual image evidence and subsequent motion/viewport results are saved separately.

The original bank artwork, limited16px surface motif, rectangular village canal geography and mixed old prop art remain. See `asset-specification.md` for a concrete premium kit. New reflections are lower-sprite approximations, not physical reflections. True foam sprites/mist, authored waterfall cliff geometry and mobile-device GPU profiling remain future art/validation work. The separate8793 leveling-map draft renderer is not silently claimed to be the registered game renderer. Full long-duration precision/context-loss soak testing is unverified. Technical evidence is distinct from user art approval.
