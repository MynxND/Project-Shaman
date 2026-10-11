# Right hair/tie repair 01

2026-10-09. ART ONLY, existing master identity correction, not a new hairstyle.

## Result

Single job `65f45f7e-199e-4079-ade4-6a56f5da0095` accepted, estimate6,
then failed with a temporary service error. No returned PNG and no retry.
Observed balance169->169 remaining,1831->1831 used: additional0, cumulative8.
Result has no job-specific charged_generations field. Reserved0, pending0.
The six-extra ceiling is internal, never a user-approved numerical budget.

East candidate=null. Latest actual rejected preview remains the raw rotation
east, with earlier rejections and this failed attempt retained in the manifest.
Original front is byte-exact, separate from the unchanged raw east. Right still
fails the master hair/tie identity: loose long hair instead of short upper spikes,
crimson bow and segmented tied ivory tail. No north/west inspection or generation.

## Mask and References

Live tool/schema: tools-live.json; free quote: quote.json. Method:
inpaint_image_pro_flash, Modify current layer, crop_to_mask=true, native128.
Binary mask1351 selected pixels,15033 protected. Stepped upper hair/bow destination
plus traced old long-hair footprint; exposed profile, near ear/neck and visible
body excluded. Protected-profile mask and explicit row regions retained.
Context native384x128: raw east edit target, original owned east identity,
immutable master front. Exact row copies and nearest2x pixel replication only.
No source translation, scaling, rotation, mirrored art or texture transplantation.

Original east and rotated east skull/pose silhouettes do not align exactly, so
manual transplantation was not used. Hidden cloth under removed old hair would
remain provisional geometry, not a clean garment/head-body reconstruction.

## Evidence

- request.json, submit.json, result.json, wait-01.json: full sanitized receipts.
- input.png and input-2x.png: byte-exact raw-before and nearest2x full body.
- context-native.png and context-2x.png: all three owned full-body references.
- mask-binary.png, protected-profile.png, mask-overlay-2x.png: selection evidence.
- preparation.json: source/mask hashes, native controls and selected row regions.
- review.json: failed result, accounting caveat and explicit no-output limitations.
- balance-before.json and balance-after.json: unchanged account evidence.

No raw-after or before/after output comparison exists because the service returned
no image. Output body conservation, corrected identity, scalp continuity and
missing-face checks are unavailable, not passing. Input/front/mask conservation
checks pass; they do not certify a correction or approve the reference pose.

## Rebuild

`node tools/rig/build_character_turnaround.mjs`

`node tools/rig/test_character_turnaround.mjs`

Builder reads the full latest ledger, retains this failure and the rejected image
history. An explicit credible right proposal can persist as
proposed-right90-awaiting-user-review only with native128, baseline0 and exact
unmasked/profile RGBA. Tests never grant approval; north/west stay null/blocked.
No main UI, TypeScript, new hairstyles, equipment or animation changed.

Verification: focused turnaround pixel regression, `pnpm typecheck`, and
`pnpm build` passed. Touched scripts/ledger have no editor diagnostics.
Native/2x references and selection overlays were visually inspected before
submission. No corrected output or new browser/UI behavior was available to inspect.