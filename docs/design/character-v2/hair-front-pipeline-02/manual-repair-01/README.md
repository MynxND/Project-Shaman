> USER REJECTED ALL THREE IMAGES. Historical only; superseded by ../redesign-02/. Original PNGs and receipts remain unchanged.

# Three FRONT hair manual repairs — 2026-10-10

USER: “แก้ไขต่อไปครับ”, following inspection of three rejected FRONT prototypes.
This authorizes repair of the existing prototypes, not new paid generation,
new hairstyles, other directions, animation or visual approval.

These are **manual derivatives of PixelLab output**, made through free PixelLab
Workbench `edit --changes` with guarded exact RGBA pixel patches. They are not
clean raw AI outputs. Original three PNGs, provider receipts, requests, accounting,
base body, historical ledger and gameplay manifest are preserved byte for byte.
`frozen.json` records their hashes before repair.

## Actual changes

- wind-crop: remove explicitly reviewed warm skin/eyebrow palettes; fill missing
  scalp target with hair shades; break the mask's flat upper ceiling into tufts.
- curtain-bob: remove skin and annotated dark brow remnants; restore crown volume;
  add narrow side locks to jaw height outside the protected ear regions.
- ritual-knot: remove skin tones; fill the scalp target behind existing knot;
  author diagonal gray/ivory sweep bands and a small lower hairline.

Exact source palette selections and guarded pixel replacements are saved in each
`*-edits.json` and `*-workbench-request.json`. Source palette tables and enlarged
raw images were inspected before decisions. No broad color-distance classifier
silently guesses skin. All output colors belong to the reviewed hair palette.
Scalp coverage means the original conservative270-pixel target is covered; this
is not a claim of approved anatomy or an optimal hairstyle hairline.

| FRONT | Opaque pixels | Hair colors | Scalp gaps | Protected overlap |
|---|---:|---:|---:|---:|
| wind-crop | 523 | 13 | 0 | 0 |
| curtain-bob | 572 | 8 | 0 | 0 |
| ritual-knot | 482 | 8 | 0 | 0 |

All alpha is binary; transparent RGBA bytes are zero. Warm skin-like heuristic
count0 is supporting evidence, not a semantic proof. Raw and repaired isolated
layers plus composites were visually inspected. The original face, eyes, ears,
neck and body stay exact. No translation, resampling, head proportion changes,
third-party pixels or other direction art.

## Visual limitations

These are review drafts. Lower short-hair crown/fringe still has a broad gray
plane; bob side-lock transitions are straight/angular; knot lower cap shows
diagonal banding and can read like a cap. The repairs resolve skin isolation and
coverage, but do not demonstrate professional-final shading, cross-view topology,
accessory fit, animation or USER approval. All visualApproved/productionReady
flags stayfalse. Do not adopt into gameplay.

`heads-4x.png`: bare/short/bob/knot. `hair-only-4x.png`: repaired isolated layers.
`comparison-4x.png`: complete equal-scale composites. Native runtime files128x128.
Inspector `/characters/v2` defaults to manual repairs; version selector retains
hash-verified raw outputs. New “ผลดิบ / ซ่อมด้วยมือ” mode compares both on exact
same base. Existing bare/composite/isolated/head modes, offsets and guides remain.
Raw-mode diagnostics never display repair measurements as if they applied to raw.

## Cost and validation

**Additional paid generations0**, no paid retries/jobs. Three free exact edit
calls. Previous paid stage remains18/18. Balance after repair125 generations,
matching the previous stage's125; USD credits$0.00.

Workbench inline images are labelled preview sheets384x146. Actual128 native
`image.png` files were downloaded from each returned Workbench URL. Native decoded
RGBA is verified byte-for-byte against replayed patch decisions; no sheet resizing.
`*-workbench-result.json` retains service text/preview, `*-workbench-native.png`
is actual downloaded output. Rebuild publication: `node tools/rig/repair_hair_front.mjs publish`.
Preparation creates patches only and never submits edits or paid requests.

Focused repair and previous pipeline tests pass; workspace typecheck/build pass.
Browser180 cases:3 styles ×2 versions ×2 scales ×5 modes ×3 viewports
(1280x900,390x844,844x390): native dimensions, exact128/512 CSS size, pixelated
filtering, expected1/2 canvases, no page horizontal overflow. Source RGBA equality
is tested in Node; browser read-only DOM API cannot expose canvas pixel buffers.
Actual screenshot inspection is separate from numerical checks and does not
approve artwork or replace real-device testing.

STOP for USER FRONT visual review. No paid continuation, RIGHT/BACK/LEFT or animation.
