# Blender → 2D sprites proof of concept

CPU-only Blender 5.2.1 proof, 2026-10-14. One original rigid-skinned placeholder,
one skeleton walk action, eight orthographic views, twelve transparent128px frames
per view. Existing Pose Studio, comments, source sprites and gameplay are retained.
This tool does not queue AI video jobs or publish into game manifests.

## Run

Requires Blender5.2 and Python3 with Pillow. Set `BLENDER_PATH` and
`SPRITE3D_PYTHON` if the executables are not at their defaults. In PowerShell:

```powershell
$env:BLENDER_PATH = 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe'
$env:SPRITE3D_PYTHON = 'C:\Users\nikza\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
node tools/sprite3d/run.mjs poc
node tools/sprite3d/test.mjs
node tools/sprite3d/test_imports.mjs
& $env:SPRITE3D_PYTHON tools/sprite3d/test_gait.py
node tools/sprite3d/server.mjs
```

Preview: http://127.0.0.1:8792. Server binds localhost and serves read-only review.
Independent stages: `model`, `rig`, `import`, `animate`, `validate`, `render`,
`export`; each accepts `--config path`. Render uses4 CPU threads and no GPU.
Generated `.blend`, GLB/FBX fixtures, native renders, frames, atlas, manifest,
reference copies and QA evidence remain in `docs/design/sprite3d-poc`.

## Stage contracts

1. Model authoring is independent: placeholder geometry is deterministic original
   primitives, not a conversion of a2D image. Reconstruct the real character's
   geometry, silhouette, face, materials and costume in a later reviewed stage.
2. Rigging creates11 actual bones, vertex groups and armature modifiers. This
   placeholder uses rigid segment weights; production needs proper deformation.
3. Import requires one armature and a skinned mesh. GLB/FBX are both tested with
   exported original fixtures. Example:
   `node tools/sprite3d/run.mjs import --input character.glb --config my-config.json`.
   Use a separate config/output directory to preserve the proof checkpoints.
   Import reports bones/actions; it does not automatically normalize or retarget.
4. Animation uses a balanced left/right gait with half-cycle offset. Two-link IK
   solves feet; stance soles remain level. Forward is-Y; backward stance travel
   is+Y. Hermite swing matches stance velocity at both contacts. The closing
   key at frame13 is validation-only; render samples1…12 without a duplicate.
   Bone mappings identify names but cannot fix incompatible rest orientations,
   bind matrices or proportions. The authored adapter requires the placeholder's
   Z-up, unit-scale geometry/rest layout; normalize/retarget imported rigs first.
5. For other authored motions set `action` to `idle`, `run`, `attack` or `skill`
   and `sourceAction` to an existing skeleton action, with `startFrame`,
   `frameStep`, `frames` and `durationMs`. Same renderer/exporter handles them;
   those motions are not authored or visually validated in this proof. Walk
   telemetry/review QA currently applies only to the placeholder walk.
6. Rendering uses one fixed-size orthographic camera per directional batch,
   elevation25°, azimuth0…315° in45° steps. Scale and target never auto-fit per
   frame/direction. Transparent native64px renders are palette-stepped,
   alpha-thresholded and nearest-upscaled2×. Configure `size`, `pixelScale`,
   `paletteLevels`, `alphaThreshold`, camera and timeline in `config.json`.
   This creates crisp pixel blocks; detailed hand-authored pixel art is not claimed.
7. Export creates1536×1024 RGBA `sheet.png` and `shaman-sprite3d/1` metadata:
   rectangles, direction/angle/index, duration, projected world-ground anchor,
   alpha bounds, config, source reference and per-frame SHA256.

## Playback and visual validation

`playback.mjs` has a shared elapsed-time clock and a Phaser adapter. Load the sheet
with128×128 frames, create `PhaserSpritePlayer(sprite, manifest, textureKey)`,
call `tick(deltaMs)` once per update and `face(direction)` on turns. Turning
preserves elapsed time and frame phase. Ground origins come from the manifest.
This adapter is tested but is not enabled for live players; current gameplay
assets, equipment/head layering and server authority remain intact.

Preview all8 synchronized views, pause, step/scrub,¼× playback, onion skin,
projected foot contacts and treadmill. Green is stance, red is swing.
In-place stance feet move backward at the matched character travel speed:
`2*stride/(durationMs/1000)` =0.64 model units/s. In a game, distance-driven phase
must match world speed; otherwise even correct renders can slide. Ground anchor
is the projected root/world origin, not the lowest visible swing-foot pixel.

Check both legs in side views, contact/toe-off in all views, frame12→1 without a
freeze/pop, fast turns without phase resets and costume/face identity against
owned references. Tests reopen animation and inspect actual bones and deformed
sandal soles, target/contact error, left/right symmetry, loop position/velocity,
frame count/dimensions/alpha bounds, importer skinning and playback phase.
Technical passes do not approve visuals. `visualApproved:false` remains explicit.

## User-supplied reference folder

User directs use of
`C:\Users\nikza\.codex\generated_images\01a12fb0-f3fd-7c61-9a13-adb474158593`.
Audited217PNG files via eight contact sheets and an index in `reference-audit`.
Nine selected originals are copied byte-exact into `references/` with source
paths, SHA256 and matched repository copies in `provenance.json`. They include
Santet/Keris/Onmyoji/Rune Seer/Ullr directional art and motion studies. No source
image is overwritten. The main six-class sheet matches the documented approved
costume concept (`ab97b8d1…a2fa561`); its approximate faces do not replace the
authoritative existing character head. Other files are references, not newly
approved motions. The older apprentice concept is historical context only.

## Known visual limits

Blocky placeholder silhouette, minimal face/hair and rigid garment deformation
are intentional engineering simplifications; it does not yet match the supplied
production sprites. Low-resolution soles/contact timing and loop readability
still require human review. No full character migration or additional actions
are included before review of this one-character walk proof.

API basis: [Blender5.2 import operators](https://docs.blender.org/api/5.2/bpy.ops.import_scene.html)
and [render operators](https://docs.blender.org/api/main/bpy.ops.render.html).
