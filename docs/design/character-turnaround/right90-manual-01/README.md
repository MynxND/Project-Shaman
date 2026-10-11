# Right-only manual correction 01

Status: `manual-right90-proposal-awaiting-review`, `approved:false`,
`productionReady:false`. Stop for right-only user review. Original rig-v2 male
idle-south frame0 is now explicitly user-approved and remains byte-exact.
No back/left promotion, equipment generation, gameplay/registry migration or
inspector UI change. This is a clothed reference, not a clean modular body.

## Starting source and meaningful correction

`before.png` is the untouched archived PixelLab owned-front rotation east,
NOT the original rig-v2 east. It has the cleaner visible nose/jaw/neck profile
and lowest occupied row123, but lost the original crimson ties and invented
continuous loose hair. `original-right.png` separately retains rig-v2 east
frame0, whose garment is still three-quarter and feet reach row124.

`after.png` uses the raw rotation face/body. Explicit local native scanlines
remove its rear loose locks. Precisely masked owned original-east rear spikes,
crimson bow and segmented tied ivory tail are copied at their existing native
coordinates; no resizing, translation, rotation, recoloring, texture sampling,
whole-head overlay or body swap. Source region boundary x57 touches retained
rotation scalp x58; exact contacts are recorded in `provenance.json`. No face
or exposed neck is replaced. Upper crown/bangs remain the rotation's own pixels.

The first probe left a redundant loose lock; enlarged inspection led to a
tighter recorded removal contour. The final images are the refined patch.
Native, nearest2x, nearest6x and browser checker-backed evidence were inspected.
Bow and separated tied-tail silhouette are visibly restored; no anatomy
approval is inferred from the byte checks.

## Measured checks and remaining failures

- Native128 transparent RGBA; 1 source pixel per output pixel.
- 1,033 actual changed/selected pixels; 15,351 unmasked RGBA pixels exact.
- Separately protected profile and garment/arm rows are checked independently.
- Front PNG bytes exact; original rig strips and prior raw PNG hashes retained.
- Lowest occupied foot row123, ground-edge baseline124, delta0; no foot shift.
- Actual after silhouette x22..82/y6..123, 61x118, 3,557 occupied pixels.
- Head assembly y0..38: x40..82/y6..38, 43x33, 1,006 occupied pixels.
- Front head assembly45x34; width ratio0.9556, height ratio0.9706; top delta+1.
- These are occupied hair/bow/head bands, NOT a certified50px anatomical head.
- Unchanged feet x52..76/y108..123; 335 occupied pixels.

**Production-quality full turnaround is NOT met.** The retained rotation's
chest/mantle construction, coat hem/apron, belt ornament and sandal pose differ
from the approved front's costume projection. Rear spikes use original texture
while upper bangs use rotation texture; that join, bow seat and tail spacing
need user review. The original full head was not overlaid. Unknown hidden side
face identity cannot be established from the frontal master. No extracted
base/outfit pose is approved or registered. Further authoring is gated on the
user's right-only decision, not automatically extended to north/west.

## Files and deterministic validation

Run `node tools/rig/build_right_profile_correction.mjs`, then
`node tools/rig/test_right_profile_correction.mjs`. The test independently
replays every source-mask write, verifies protected RGBA, independently computes
after bounds, checks exact native panel rows/nearest2x replication and confirms
unchanged north/west plus old ledger fields and unknown top-level metadata.
Run the existing turnaround builder/test to verify rebuild retention and old
failure receipts too. Workspace `pnpm typecheck` and `pnpm build` pass.

Artwork/evidence mirrored under
`apps/client/public/assets/character-turnaround/right90-manual-01/`:

- `front.png`, `original-right.png`, `before.png`, `after.png`.
- `comparison-native.png`, `comparison-2x.png`, `after-2x.png`.
- `after-6x.png`, `before-6x.png`, `mask-overlay-2x.png`.
- `edit-selection.png`, `pixel-diff.png`, `protected-body.png`.
- `protected-profile.png`, `loose-hair-removal-mask.png`.
- `original-hair-source-mask.png`, `original-hair-source-layer.png`.
- `manifest.json`, `provenance.json`, `validation.json`, `review.html`.
- `browser-comparison-native.png`, `browser-comparison-2x.png`.
- `browser-2x-front-original.png`, `browser-2x-before-after.png`.

The wide2x PNG remains1024x256. Browser screenshot uses two512px panel pairs
in two rows: each sprite still256x256, no resampling. Each pair was separately
scrolled into view and captured; exact RGBA row concatenation forms the complete
2x evidence. This avoids the integrated browser's wide/tall screenshot clipping
despite its reported viewport. The native
screenshot shows four128px sprites. Checker transparency was visibly checked.

Design-only snapshots: `inspector-metadata-before.json` and
`generation-ledger-before.json`. Current inspector metadata preserves the top
schema, old original landmarks/source/rejections and unknown fields; accurate
after bounds are in `views.east.candidateLandmarks` and `rightOnlyReview`.
Overall review remains false. Main agent owns the inspector UI.
The actual `/characters/modular` inspector now includes a dedicated right-only
panel: approved front, original rig-v2 right, raw rotation before, manual after.
Native1x and nearest2x toggles preserve the same128 canvas and shared foot origin.
After overlays use independently measured candidate landmarks; before overlays
are withheld rather than displaying inaccurate original landmarks. Browser checks
passed at desktop1280, portrait390 and landscape844: no horizontal overflow,
all four canvases nonblank, smoothing disabled. The in-game renderer and equipment
registry are not migrated. UI changes: `TurnaroundInspector.tsx` and
`turnaround-inspector.css`. Production-quality identity/costume remains unapproved.

Edited tools: `build_right_profile_correction.mjs`,
`test_right_profile_correction.mjs`, `build_character_turnaround.mjs`,
`test_character_turnaround.mjs`. Turnaround builder preserves extra metadata
and reloads this candidate rather than silently clearing it. Rebuild outputs:
runtime turnaround `manifest.json`, design `proportion-template.json` and
`validation.json`. Existing source/contact assets are regenerated identically.

## PixelLab and accounting

Live read-only MCP schema inspection used initialize/notifications/tools/list,
with user-level credentials kept out of files and output. No tools/call, paid
job, retry, asset generation or additional credit. Observed schemas summarized
in `provenance.json`: inpaint has image/mask/context inputs, crop_to_mask=true
and three output modes; character source reuse fixes first direction south
and n_directions8. Schema support is not an identity/profile guarantee.

Observed prior failures retained: first masked edit became frontal and changed
costume, rotation improved profile but lost hairstyle/ties, later narrow repair
failed with no image and observed charge0. Those are observations, not a claim
that the service can never work. This task changes only a zero-cost manual task
note in the ledger, preserving all existing fields/accounting: cumulative8,
reserved0, pending0; no account balance call or billing adjustment.