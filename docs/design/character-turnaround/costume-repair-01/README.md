# Costume repair 01 - actual artwork, rejected

2026-10-09 continuation: the coordinator interprets "proceed" as bounded
costume-stage authorization, maximum18 credits, RIGHT then BACK then LEFT,
one submission per view, no retry. This does not authorize anatomy or animation.
Historical foundation recipes/accounting remain unchanged.

## Actual result

RIGHT job `17af3205-7375-42c3-9567-8f50af1de725`, image
`c280516d-09d7-5645-a5f0-2c4faaea5ba6` completed. Live native128 inpaint
quote6 provisional; submit estimate6; result receipt `charged_generations:6`.
Actual stage charge6, reserved0, pending0, unused authorization12. Prior
turnaround ledger remains byte-exact at8: prior8 + this stage6 =14, not a
project-wide generation total. No BACK/LEFT, retries, anatomy or animation jobs.

Review `review.html`, `east/raw.png`, `east/comparison-native.png` and
`east/comparison-2x.png`. Contact order: approved FRONT / prior RIGHT / generated
RIGHT / binary mask. Native PNG and direct nearest2x preserve all RGBA bytes.
Request, live schemas, quote, submit intent, submission, provider wait/result,
balance receipts, hashes and pixel checks are retained under `east/`.
Credentials are not stored in any of these artifacts.

The output changes1261 of1552 editable pixels. All14832 unmasked pixels remain
RGBA-exact, including head, hair, face and footwear. FRONT PNG remains exact.
Technical conservation PASS; visual garment construction FAIL. The broad pale
triangular side hem remains, and apron/mantle/sash construction does not
convincingly project the approved FRONT. Profile remains genuine; no whole-body
reroll or source-overpainting was used to fabricate protection compliance.

`east/review.json` rejects this actual art. Candidate null, user approval false,
productionReady false. BACK/LEFT stop here. Runtime review copies and manifest
are under `/assets/character-turnaround/costume-repair-01/`; these are optional
review evidence only, not a registered outfit, replacement source, gameplay
selection or change to the existing foundation/turnaround inspector.

## Reconstruction blockers and next dependencies

The current visible-garment mask preserves the source's broad silhouette and
does not authorize garment occlusion or recover hidden material. Before any
new paid attempt, author and review a side-seam/apron/hem construction sketch
against FRONT, with legitimate garment-removal/occlusion regions and explicit
protected head/skin/foot masks. Do not horizontally squash the body, transplant
heads, or treat texture edits as repaired garment topology.

Clean body and bald scalp are not available for free extraction: the flattened
source has no pixels for torso/limbs under cloth or skull under hair. Visible
partitions and transparent hair gaps are NOT bare body/scalp. Next proposed
plan is one native128 reconstruction proof, with approved skull/neck/shoulder/
waist landmarks and explicit coverage/occlusion masks, inspected before other
views. Minimum tool quote for one masked128 edit is6 provisional (live query
in `east/quote.json`). Four separate scalp edits would estimate24, and four
separate hidden-body edits another24 at that rate, but this is NOT a complete
anatomy/outfit quote or authorization; separate layers, masks and possible
provider failures remain unresolved. No total for the entire request is claimed.

Headgear fit needs approved reconstructed scalp/head silhouette, reviewed
four-view crown seat and foreground/background hair occlusion before animation.
Existing crown/anchor evidence is provisional, not a fit pass. Animation then
needs approved static inputs, its own numerical budget, a single native pilot
and per-frame face/hair/garment/baseline/attachment checks. Historical estimate2
for8 generated `animate_image` frames is not a live quote or current approval.
New-base clips delivered0; hurt/death and diagonal views still unresolved.

## Verification

```powershell
node tools/rig/costume_repair.mjs check east
node tools/rig/costume_repair.mjs result east
node tools/rig/costume_repair.mjs test-final east
node tools/rig/test_character_foundation.mjs
node packages/shared/scripts/character-foundation-test.mjs --assets
pnpm typecheck
pnpm build
```

The submission script rejects duplicate attempts, pending work, higher quotes,
budget overflow and a failed prior-view review. Preparation rejects existing
view evidence and an existing east ledger, so reruns cannot clear accounting.

All listed focused checks and workspace typecheck/build passed. Editor
diagnostics are clear. Browser geometry checks at1280x900,390x844,844x390 loaded
all5 images with no document overflow or clipped text. Element screenshot
timed out waiting for stability; no successful browser screenshot is claimed.
Native/raw and exact2x raster images were inspected directly. These are viewport
checks, not physical-device tests. Full evidence: `verification.json`.