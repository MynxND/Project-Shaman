> Historical pipeline. Latest USER-authorized Hair V3 study/candidates: ../../hair-v3/front-01/README.md. This stage remains archived evidence.

# V2 FRONT modular hair pipeline — 2026-10-10

**Current revision:** [redesign-02](redesign-02/README.md) replaces all three USER-rejected manual repairs. New natural hairlines and proper bob layering are current drafts, awaiting visual approval. Earlier outputs remain history. Added paid generations0.

The USER explicitly selected **V2 neutral-male-02** for this task, superseding the
V3 availability gate, and explicitly approved a new maximum **18 generations,
three attempts, no retries**. This is separate from the unchanged historical
V2 cap20/spent20 ledger. No other direction, animation or live adoption.

## Deliverables and review state

- `template.json`: measured visible head alpha rows, scalp boundary, conservative
  provisional eye/ear/face protection, head anchor62,26, origin61,112, native128.
- `head.png`: exact original visible head pixels on the original128 canvas;
  `head-silhouette.png`, `scalp.png`, `protection.png`: reusable masks.
- `design-system.json`:14 genuinely distinct silhouette specifications. Every
  record specifies volume, hairline, fringe, sideburns, back length, layering,
  silhouette and accessory compatibility. These are proposals, not approved lore.
  Eleven remain specifications only; no generation requests exist for them.
- `/characters/v2`: the new FRONT editor appears first. Actual game asset copies
  are loaded with source hashes and native dimension checks. Base head, returned
  hair layer, composite and before/after; integer X/Y per style, reset; pixel grid,
  scalp/eye/ear guides, anchor/origin; native1x and exact nearest4x with local scroll.
  Offsets are local preview state, never silently written into assets/gameplay.
- Three unchanged raw PixelLab outputs, their composites, requests, masks,
  submissions, completion/billing receipts and comparison sheets.

**All three outputs fail isolated hair-only quality.** PNG validity, passing
typecheck/build, exact alignment and visible face preservation do not approve art.
The editor displays rejected outputs as diagnostic evidence, not usable hair.
No warm skin pixels were erased, no palette cleanup, scaling, face alteration,
head transplant or automatic regeneration was performed.

## Real geometry

Source `body-front-02/raw.png` SHA256
`0ed1ddf448b70a93dc5f624617e832a0af593779b6b7257d65db39b61be35958`.
Native128x128. SOUTH pose `neutral-male-02-idle-south`, origin61,112.
Visible scalp270 pixels, y20..31, x49..75, row widths9..27. Head including ears
reaches31px width. Visible head extraction y20..49 is an annotated head envelope;
it does not reconstruct occluded anatomy. Head anchor62,26 is a **provisional
attachment point**, not an approved skeleton bone. Eye/ear rectangles inherited
from inspected V2 annotations are conservative regions, not precise segmentation.
The lower scalp boundary y31 is a conservative design annotation; upper alpha rows
are actual measurements. Forehead y32..34 can be occluded; all opaque face/ear
pixels y35..49 and neck57..68/y49..52 are protected from generated overlap.

## Different workflow

Inspect source pixels → retain exact head reference/masks → specify14 silhouettes
→ submit only3 blank-layer inpaint requests with exact native head context
→ retain raw provider output → numerical AND visual inspection → USER review.

Unlike whole-character variant generation, the source layer is completely
transparent. The context is only the owned V2 head at its unchanged128 coordinates.
Three different permitted envelopes surround the same measured scalp. Binary masks
exclude protected anatomy. Context reference and source bytes are saved in requests.
Actual MCP tools/list schemas were inspected before submission. The tool exposes
changes-only transparency, but cannot guarantee that generated content is hair.
This limitation was demonstrated by all three outputs here.

## Quality findings

| FRONT prototype | Scalp gaps | Protected overlap | Visual result |
|---|---:|---:|---|
| wind-crop / ผมสั้นเปิดลม | 0 | 0 | Short asymmetric pointed silhouette reads clearly; crown is cut flat at mask ceiling. Warm forehead and eyebrow-like dark marks contaminate the layer. Reject isolation. |
| curtain-bob / บ๊อบแสกกลาง | 0 | 0 | Distinct open central curtain shape; sides stop short of intended jaw-length bob. Upper boundary clips volume. Warm forehead/eyebrow-like marks contaminate the layer. Reject isolation. |
| ritual-knot / มวยผมพิธี | 146 | 0 | Tall narrow knot is distinct, but cap does not cover the required scalp; warm skin pixels near hairline remain. Reject fit/isolation. |

All use crisp binary alpha at native density.22/13/12 colors respectively; ivory
highlights and gray shadows broadly follow upper-left lighting, but knot cluster
texture is busier and silhouettes remain constrained by mask clipping. None is
visually approved. Actual eyes/ears remain unobscured at0,0; clean base bytes are
unchanged. Partial alpha0 and outside-mask0 are technical facts, not proof of good
shading or complete modular compatibility. Warm skin-like counts124/101/22 are a
color heuristic, supported separately by visual inspection of the raw layers;
they are not exact anatomical segmentation. Topknot scalp gaps are exact target
mask occupancy failures. No rear/front split or cross-direction compatibility is
claimed. Recoloring these raw layers would incorrectly recolor skin; do not equip.

`heads-4x.png` shows bare/short/curtain/knot, left to right. Compare against raw
layers as well as composites: skin contamination can hide when layered over skin.

## Cost and verification

Actual completion receipts:6+6+6=**18 subscription generations**, pending0,
attempts3, retries0. Account balance143→125; USD credit balance stays$0.00.
Jobs634c3548-7111-4c12-b391-c70a64c2f35a,
3c328e1d-8742-4d88-b621-1e449ba91834,
8bbcc047-2d6a-4b8c-9b0b-2e9dea8f638f.
`accounting.json` records the new budget separately. `frozen.json` verifies original
base, old ledger and old gameplay manifest are byte-identical. Credentials remain
in user-level configuration, never in artifacts or browser bundles.

Workspace typecheck/build and six focused pipeline/history tests passed. Browser
tested72 style/mode/scale/viewport combinations at1280x900,390x844,844x390:
no page horizontal overflow, canvas128x128, CSS128/512 and pixelated filtering.
X/Y movement, per-style offset state, reset and overlay controls were exercised.
Browser's read-only canvas API does not expose getContext: browser pixel-buffer
equality was **not verified**. Source/native pixel invariants are checked in Node.
Actual desktop and portrait screenshots are retained; the host capture can reflow
or blur. Screenshot inspection is not real-device sign-off or artistic approval.

Reproduce publication without new paid requests:
`node tools/rig/hair_front_pipeline.mjs publish`.
Tests: `node --test tools/rig/hair_front_pipeline.test.mjs tools/rig/character_v2_front01_rows_verify.test.mjs`.
Preparation intentionally refuses to overwrite evidence after a submission exists.
`poll_hair_front_pipeline.ps1` only fetches existing jobs, never regenerates.

**STOP.** Editor and exactly three FRONT attempts delivered for review. Hair-only
production quality remains unmet. No RIGHT/BACK/LEFT, animation,11 other styles,
retry, cleanup or paid continuation until further user direction after visual review.
