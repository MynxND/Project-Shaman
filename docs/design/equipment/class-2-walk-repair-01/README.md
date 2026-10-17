# Walk repair in progress — 2026-10-14

## Simplified three-direction cycle at user request

User rejects north/north-east/south-west gait and explicitly requests simple alternating left/right. These24 preview frames now select existing leg poses in `[left,left,neutral,neutral,right,right,neutral,neutral]`, with phase labels in the preview. NORTH uses original motion source1/0/2; NORTH-EAST uses repaired source1/0/4; SOUTH-WEST uses original motion source2/0/1 (front-view anatomical sides differ from screen sides). No new imagegen/PixelLab calls. Frozen reference PNGs and prior per-frame uppers in `simple-reference/` make reruns idempotent.

`tools/rig/simplify-santet-steps.mjs` uses full-width lower composition below y88 and retains original opaque lower-staff pixels. Every upper pixel above y88 remains exact. Same8-frame count deliberately holds each simple phase twice; does not claim8 unique biomechanical poses. Three strips `simple-<direction>.png` visually inspected for distinct opposite legs and neutral reset. `simple-step-report.json` records source hashes/phases and updated output registry hashes. Other5 directions, head offsets/orders and gameplay manifests untouched. These revised three clips await user visual acceptance.

## EAST horizontal bounds correction

User reports frames1/3/5/7/8 still visibly clipped. Previous seam fix addressed y88 attachment but retained x38 patch boundary, while generated rear feet extend to x31–32. EAST now replaces full canvas width below y88 (x0..127,y88..127), preserving existing opaque staff pixels. All8 measured generated lower-body bounds lie inside the native canvas (x31..92,y88..114). Export now asserts zero lost opaque generated lower pixels outside protected staff/recorded residue cleanup; all8 pass. Original source sheet, head offsets and other directions unchanged; no generation/credits. Earlier x38 EAST descriptions are superseded.

## EAST seam fix — 2026-10-14

User confirms EAST generated art is correct and reports missing leg in native preview. Cause: replacement began at y94, below the new rear-leg attachment, and the whole lower-staff rectangle retained old transparent gaps. EAST now includes the lower hem/attachment from y88; staff protection retains only existing opaque pixels in x54..68,y88..103, allowing new leg pixels into old transparent gaps. Regenerated all8 native EAST exports from the existing approved source, with no AI calls/credits. Upper pixels above y88, original opaque protected staff pixels, neck/head metadata and other directions unchanged. `east-before-seam-fix/` preserves previous exports; `east-seam-fix-comparison.png` shows old left/fixed right at frame3. This supersedes earlier blanket y94 ROI/whole-rectangle protection description for EAST.

## Eight-direction Santet review — 2026-10-14

Added remaining7 Santet facings,56 new native leg-repair frames;64 total including approved SOUTH.9 built-in imagegen requests this stage (7 first edits,2 opposite-half corrections for NE/NW); cumulative12 in this repair folder; PixelLab0. All prompts/raw candidates retained. Per-facing `export-<direction>.json` records original/candidate SHA, replacement ROI, protected lower-weapon rectangle and isolated residue cleanup. Non-SOUTH uses ROI x38..96,y94..125, preserving upper body/neck and the recorded weapon crossing rectangle. This is a bounded technical composition, not a claim of unchanged whole costume below the hem.

Preview `/head-walk-repair` now has all8 facing choices, synchronized original/repaired playback and frame scrub. Browser switched through all7 new facings successfully and decoded all16 images per facing. Original source report/fingerprint, gameplay manifests, head offsets and user frame orders remain untouched. SOUTH approval retained; new7 directions remain visual-review pending. Other five classes'40 walk clips are outside this stage and unmodified.

NE/NW first edits still repeated a same-foot half-cycle; second edits changed the support/swing side in the lower row. Native before/after boards for all7 inspected. Side-view near/far leg occlusion, patch seam/depth and footfall continuity still need user review at playback;64 files/technical passes alone are not physics certification. No gameplay publication in this stage.

Checks:64 native128px RGBA files, protected-region byte comparisons, atlas isolation, source SHA report; browser8-facing loading/scrub UI; workspace typecheck/build passed.

## User approval and detached-foot cleanup

User approved the displayed Santet SOUTH walk on2026-10-14, with a lower-left fragment correction requested. This approval supersedes the earlier candidate rejection below for this one clip only; other47 clips remain untouched. Native connected-component inspection found old-foot remnants outside the leg replacement ROI: frame6 x42..43,y107..111 (8 opaque pixels), frame7 x40..43,y105..112 (23 opaque pixels). Removed only those detached components via `gait-residue.mjs`; main body and staff component preserved. Pre-cleanup native6/7 saved in `user-approved-before-cleanup/`. No regeneration or credits. All other protected pixels remain exact; export report explicitly records the cleanup exception to the legs-only ROI. Earlier blanket no-outside-ROI-change claim applies before this authorized cleanup.

User authorizes correcting physically inconsistent walking. Three built-in imagegen edits attempted Santet SOUTH; PixelLab calls/credits0. Prompts and all three source outputs retained here. Candidate01 retained repeated same-side half-cycle. Candidate02 establishes opposite legs in the second half. Candidate03 tries passing poses but the requested frame indices and knee/ankle passing are not reliably followed. **None is approved as a physically correct finished walk.** Other47 directional/class clips remain unmodified; do not claim all gait issues resolved.

`tools/rig/export-santet-gait-candidate.mjs` exports8 native legs-only candidates in `santet/south/`. Replacement ROI x44..89,y95..123 preserves every pixel outside the ROI byte-exact, including neck and upper body. Existing source PNGs, head offsets, source report/fingerprint, saved frame orders, female pipeline and gameplay manifests remain untouched. Generated material within ROI can still have seams/depth/contact issues requiring review; geometric preservation is not anatomy approval.

`export-report.json` records source/candidate SHA and protected-region checks. Current candidate03 is shown on local `/head-walk-repair`, alongside original motion,6fps and manual frame scrubbing. Preview is body-only to inspect gait; original separate heads have not been redesigned or moved. `santet-south-before-after.png` has original top row and candidate bottom row.

Remaining: authored passing/recoil poses, grounded contact, stable leg length, seamless cycle, native-scale playback acceptance; then repair other rejected directions/classes. Do not mass-generate48 clips using an unverified prompt or publish the current candidate. Current generative edits did not reliably supply requested anatomical phases; further regeneration alone has not proven a dependable solution.

Validation: all8 candidate images128×128; exact protected-region comparison; local preview routes; workspace typecheck/build. No claim of successful gameplay gait correction.
