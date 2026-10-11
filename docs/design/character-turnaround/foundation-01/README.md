# Four-view foundation 01

Scope expanded by the user on 2026-10-09: RIGHT90 costume/hem/belt/shading,
BACK/LEFT identity, clean body/head/outfit, hair/headgear anchors, and animation
on the new base. The previous right-only stop is superseded as a scope limit,
not as visual approval or financial authorization.

## Delivered

- `review.html`: standalone static review retained.
- `/characters/modular`: React foundation evidence panel above the unchanged
  right-only inspector. Source/visible body/head/hair/outfit, native1x/nearest2x,
  four provisional anchor overlays and all 24 state/view coverage records are
  available. Archived strip links and per-frame head/seat coordinates are
  evidence only; the foundation panel has no animation playback or fallback.
- `four-view-native.png` and `four-view-2x.png`: original native pixels and exact
  nearest doubling, ordered FRONT / RIGHT90 / BACK / LEFT.
- Per-view source, four visible partition PNGs, ownership map, conservative
  costume edit mask, and anchor overlay. Source sprites are never overwritten.
- `manifest.json`: framework-independent shared contract; source approval is
  distinct from partition/anchor approval. Only the FRONT source is approved.
- `evidence.json`: input hashes, pixel counts, native mask rules and limitations.
- `generation-plan.json` and `requests/`: unsubmitted, cost-gated repair recipes.

These are exact visible-pixel partitions, NOT a clean hidden anatomical body.
The body residual includes wraps; the garment partition includes accessories
and footwear; the hair mask is not a complete occluded silhouette. Transparent
holes must not be filled by the renderer or presented as recovered anatomy.
LEFT uses the owned west artwork, not mirrored art; only its draft segmentation
coordinates reflect the earlier east mask. That mask needs material review.
FRONT PNG bytes and original rig strips are retained unchanged.

## Native Anchors

All coordinates use native128 top-left pixels. Foot origin is `(64,124)` in
every view, the ground edge, not a detected anatomical joint. Seats are
provisional proposals; overlays do not prove equipment fit.

| View | Neck | Hair Root | Headgear Seat |
|---|---|---|---|
| FRONT/south | 64,38 | 64,22 | 64,16 |
| RIGHT90/east | 66,38 | 58,26 | 65,15 |
| BACK/north | 63,41 | 63,25 | 63,15 |
| LEFT/west | 61,38 | 69,26 | 62,15 |

## Honest Coverage

| Requirement | Actual State |
|---|---|
| RIGHT90 costume, hem, belt, shading | Unresolved; hair-only manual source retained, repair mask/recipe prepared |
| BACK/LEFT consistent identity | Existing owned references exposed for review; no new corrected art or approval |
| Clean body/head/outfit separation | Lossless visible evidence delivered; occluded anatomy, scalp, garment underside and masks unresolved |
| Hair/headgear anchors | Four static coordinate sets plus archived per-frame head/crown evidence; fit unapproved |
| Animation on new base | ZERO clips delivered; 24 explicit state/view records, 16 archived clips, hurt/death absent |

Archived idle/walk/attack/cast strips are never silently selected by
`foundationAnimation`. Their frame-specific head/crown coordinates belong to
the original rig, not to the manually corrected static RIGHT90. There is no
repeat-frame stand-in, head transplant, new look registration, gameplay
migration or animation approval.

Visual inspection: RIGHT90 still has a front-like broad pale hem/apron edge and
different belt/chest construction. BACK shows a large cream rear panel. LEFT's
side construction differs from RIGHT90. Visible head residuals lack hidden
scalp and LEFT masking does not establish a complete bald head. Arm residuals
include wraps and some garment pixels. These defects are preserved as evidence,
not repaired by arbitrary recoloring, texture sampling or silhouette scaling.

## Costs And Gates

Client integration authorization: **ZERO paid jobs**, no generation, no new
dependencies and no additional credits. User unavailable for budget approval.
The following quotes are historical provisional estimates, NOT authorization.

Free live `get_pro_flash_capabilities` query, 2026-10-09:
`operation=inpaint,width=128,height=128`, revision
`pro-flash-presets-48-128-2026-09-29`. Quote: image6 + rotations0 = **6 credits**,
explicitly provisional. No jobs submitted; no added credits.

Smallest bounded next stage: sequential RIGHT90, BACK, LEFT costume repairs,
**18 estimated credits**, no retry allowance. Stop at each rejected result.
Recipes use `inpaint_image_pro_flash`, native binary masks, `context_image`
containing the target and untouched FRONT reference, and a bounding box locating
the target. The context is 256x128, within the service's 3x native limit.
Mask RGB is white=generate / black=preserve; alpha is ignored. The conservative
mask excludes head/hair and y114+ footwear and cannot expand the silhouette.
Review the mask before submitting. Schema capability is not an identity guarantee.

Four subsequent bald-head/hidden-clothed-body edits would provisionally cost
24 credits, but do NOT establish a true unclothed modular body or full outfits.
True anatomy and layer reconstruction need their own approved design/masks.

Animation pilot tool: `animate_image`, local approved PNG as
`first_frame_base64`, action, eight generated frames, transparent output.
Catalog says it returns the unchanged input plus eight generated frames (nine
playback frames). Pixel-cost examples imply about **2 credits** for 128x128x8;
this is an estimate, not a live quote. `animate_with_skeleton_v3` is an alternate
pose-guided tool, catalog estimate3 for eight frames, but still no protection
mask/identity guarantee. No paid pilot until numerical cost approval and static
identity/clean-layer review. No whole-job total is fabricated for missing diagonal
views, full layer animation, hurt/death and retries.

## Rebuild And Verify

```powershell
pnpm --filter @shaman/shared build
node tools/rig/build_character_foundation.mjs
node tools/rig/test_character_foundation.mjs
node packages/shared/scripts/character-foundation-test.mjs --assets
pnpm typecheck
pnpm build
```

Tests verify input hashes, exact FRONT, native dimensions, disjoint visible
ownership, complete RGBA reconstruction including transparent RGB, mask
protection, nearest2x, archived sheet dimensions/counts/anchors, 24 explicit
coverage records, schema field names and rejection of false approval/completeness.
Existing right-only and turnaround tests remain applicable and untouched.

Standalone browser review loaded all nine images with no horizontal overflow
at 1280x900, 390x844 and 844x390. Sprite/anchor pairs and direct raster evidence
were visually inspected. This is technical review, not user art approval.

## React Inspector Verification - 2026-10-09

Workspace `pnpm typecheck`, `pnpm build`, the focused foundation pixel test and
shared contract test with `--assets` passed. Production prerender includes
`/characters/modular`; browser reload reported no page errors. Editor diagnostics
for the three touched client files are clear.

Browser checked 30 combinations: 1280x900 / 390x844 / 844x390, both scales and all
five layer selections. Four native128 images loaded in each combination, with
nonzero visible alpha and no document horizontal overflow. Sparse body/head
partitions remain sparse; no hidden pixels are invented. All 16 static overlay
coordinates match the manifest; the anchor toggle and archived per-frame details
work. Coverage is 24 records / 16 archived / ZERO new-base; the existing right-only
review remains present. These are browser viewport checks, not physical-device tests.

Actual saved and visually inspected React source/anchor capture:
[`inspector-review.png`](inspector-review.png). This is an element capture of the
four-view grid (two-column integrated-browser host), not a fabricated contact
sheet or a claim of art approval. The host clips viewport captures independently
of requested Playwright dimensions, so the review grid was captured directly to
retain all four actors.

Readiness remains BLOCKED by corrected costumes, cross-view identity review,
clean anatomy/scalp/full hair/outfit reconstruction, anchor fit approval and all
new-base animation. No gameplay equipment registry, shared contracts, original
FRONT bytes or source assets were changed by this client integration.