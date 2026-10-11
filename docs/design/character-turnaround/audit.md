# Shaman original male turnaround audit

2026-10-09. Scope: audit, proportion template and static turnaround only.
Hairstyle, equipment and animation generation are stopped for this task.

Latest continuation: one narrow existing-master hair/tie repair was submitted
after rotation-experiment-01 and failed on the service with no output. No retry.
Observed additional charge0; cumulative8, reserved0, pending0. East candidate
remains null; latest actual rejectedPreview stays the rotation east PNG, with
rejection history and failed-attempt evidence retained. Main UI/TS untouched.
See right90-hair-repair-01/README.md. No after image or corrected identity claim.

Previous continuation: one supported owned-front native character rotation was
actually submitted, completed and rejected for east hair/tie identity drift.
It improved the right-facing projection and matched the shared foot baseline,
but did not supply a coherent same-identity profile. Original front stays
byte-exact and unapproved; back/left review stopped. Details below and in
rotation-experiment-01/README.md. No universal service-inability claim.

## Master selection and approval

Selected best ORIGINAL for the current review: rig-v2 male base idle-south,
frame 0, native 128x128. This is the source already used by head-proof, not
its reconstructed body/head/hair composite. The archived head-proof source PNG
is copied byte-for-byte after verifying its decoded RGBA equals strip frame 0.
The strip, source PNG and reference sheet are hash-locked on the first build.
Selection is a source-history decision, NOT explicit user approval. The user's
64x96 inspector concept is not an approved 64px sprite source. No downsampling.

Comparison: the user's shamen-base-sheet.webp defines the spiky light hair,
warm skin, mantle, crimson ties, patterned apron and sandals. Main-v1 south
and rig-v2 south are existing derivatives of that identity, not the concept
sheet itself. Character-rig.md records repeated front stance/face corrections
and lost ribbon/lightness in the earlier settle pass. The current full-body
rig frame is retained rather than substituting an unrelated newly generated head.

## Falsifiable local hypothesis

Mismatch is present in source artwork and compounded by incompatible extraction
and presentation conventions. Check frame-0 RGBA, native alpha bounds and all
four originals at identical scale before changing artwork. If native views agree
but a composed preview differs, the defect belongs to that composition instead.

Evidence already observed: east exposes front chest/apron and a turned face,
not a clean right90 profile. North has a large crimson bow and long light tail;
these details differ from the front/concept and cannot be silently normalized.
Main-v1 documentation records variable animation canvases and nonmatching
front helper frames. Modular proof pads native128 into192 at offsets32/44;
head-proof uses native128. A 64x96 UI mockup is a third coordinate convention.
These do not justify per-direction scaling, stretching or rotating artwork.

Head-proof README documents the corrected rear long-hair occlusion: north tail
must overlay the torso, not sit behind it. The archived north short texture-copy
cap is superseded by a paid masked proposal. Hair-collection README explicitly
declares west mirrored about x64. That reflection is not an authored left270
view and reverses asymmetric ties, hair chirality and lighting. This audit uses
the independent original rig west, never the collection reflection.

## Review and generation gate

Front stays exact. Sequence: inspect template/front, use a supported owned
full-body reference-rotation or protected source-edit workflow, inspect right90
identity/silhouette/landmarks first, then back180, then left270. Stop on the first
identity or angle failure. No bulk retries. A rotation tool may generate eight
views in one request; that does not authorize assessing or promoting later
views after a right-side failure.
All original side/rear images are audit references, not accepted turnaround
candidates. Byte tests prove retention and geometry only, not semantic anatomy,
face absence, identity or camera angle. User four-view approval is mandatory.

Landmarks in proportion-template.json are visible-art anatomical estimates;
hidden wrist/hip locations remain provisional, not automatically detected bones.
Profile widths must reflect depth rather than match the frontal bounding width.
One shared canvas, pixel density, origin and foot baseline apply to every view.
Any original baseline disagreement is reported, never corrected by moving art.

## Modular readiness

This is baked clothed full-body reference art. A clean anatomical base and
independent garment/hair separation are NOT delivered. Future base, hair,
outfit, headgear, main-hand, off-hand and accessory layers must share direction,
pose, frame count, native canvas, origin and foot baseline. Layer occlusion and
protected skin/face masks need separate user review before equipment/animation.

Rebuild: node tools/rig/build_character_turnaround.mjs
Independent checks: node tools/rig/test_character_turnaround.mjs
Inspector entry: /assets/character-turnaround/manifest.json. Main owns UI.
Inspector UI is now `/characters/modular`. All originals use native128 at exact2x,
with optional head/silhouette bounds, origin, body centerline and baseline overlay.
Original/candidate/50% comparison never substitutes absent candidates. Browser
verified desktop1280, portrait390 and landscape844 with four nonblank originals,
fixed256x256 display, smoothing disabled and no horizontal overflow. Screenshot:
`previews/inspector-audit-desktop.png`. It is ORIGINAL AUDIT evidence, not a corrected
or approved turnaround. The earlier extraction animation viewer is archived below.

## Original measurements and superseded preflight

Equal-scale originals inspected: both side views expose front garment planes;
neither is certified true90/270. Front remains the only packaged candidate,
and its PNG bytes equal the archived source and its RGBA equals strip frame0.
Native silhouettes: south66x119 (lowest123), east61x120 (lowest124),
north66x117 (lowest120), west59x119 (lowest123). Shared ground edge124
means deltas0,+1,-3,0. These are failing original alignment evidence, not
accepted candidate baselines. No image was moved or shrunk to conceal them.

Live tools/list was retrieved through existing credential-safe PixelLab RPC.
inpaint_image_pro_flash preserves unmasked RGBA exactly, uses a pure black/white
native mask, always crop_to_mask, and supports a context image up to3x native
with a bounding_box locating the source. A native256x128 source+front context
would fit. Changes-only output can be tested for mask escape. However the
schema exposes no identity, anatomical landmark, camera angle or silhouette
lock INSIDE the editable mask. This is capability evidence, not a claim that
an unsubmitted generation failed.

The initial preflight stopped without an attempt because inside-mask identity
and angle locks were absent. That was NOT sufficient evidence of inability and
is superseded by the user's requested actual reference-guided attempt below.
The initial zero-cost state and internal18 ceiling are historical only.

Main can load every original for comparison; candidate is null for east/north/
west. Do not label the four-original contact sheet an approved turnaround.
Animations and equipment stay gated on explicit user approval of all four
corrected static directions. Back/left now stop on the observed right90 failure.

## One actual right90 attempt: rejected, STOP

Live schema retrieved before submission: pixellab-right90-live.json.
Service description: "Replace white-mask pixels with Pro Flash, preserving
unmasked RGBA bytes exactly." Optional context requires bounding_box locating
the source; native dimensions are not rescaled. No guarantee of identity or
anatomy inside editable pixels is claimed.

Actual method: inpaint_image_pro_flash, Modify current layer, crop_to_mask=true,
no_background=true. Source is original rig-v2 male base idle-east frame0 native128.
Context is native256x128: exact east left, immutable rig-v2 idle-south frame0
right. Bounding box x0,y0,width128,height128. Owned reference sheet was visually
consulted; only the exact native front, not the full sheet, was sent as context.
The preserved front and proportion-template.json supplied explicit anatomical
rows, origin(64,124), foot edge124, palette and outfit structure instructions.
The pure BW mask permits actual head/torso/cloth-tail repainting, including
transparent surroundings, and local foot contour correction. It does not
translate, resize or stretch the source. Request and mask: right90/request.json,
right90/mask-binary.png. No source/template was replaced with generated pixels.

Job1963d87f-6474-472e-bcaa-f8aeaf09d6e3 completed with ONE raw image.
Image ID11285eac-dcda-55bb-93ba-dfee443e1e5c. Raw is right90/raw.png, unchanged;
SHA2569275e46622ea3d93acf47e84896bec2820e4800ed25afe589aee092a4b5cfe5f.
Comparison order: front, original east, raw output, all at identical placement
and native scale; right90/comparison-native.png and comparison-2x.png inspected.
The doubled image is exact nearest-neighbor2x, never a candidate transform.

Observed failure: output reads FRONT, not right90. Paired ears/visible face
planes replace a right-projecting nose profile; both arms and shoulder pieces
spread about a broad frontal chest. Apron is a centered frontal embroidered
panel rather than edge-on. Chest/shoulder ornament arrangement is redrawn, not
a coherent side projection of the preserved outfit. Front-like resemblance
does not demonstrate identity-preserving profile anatomy. No ambiguous
three-quarter angle is accepted. Native bounds raw52x118, top5,bottom122;
master66x119,top5,bottom123. Raw head-band39x34, master45x34 (ornaments included,
not skull measurements). Raw ground-edge delta-1 fails the shared origin;
original east delta+1 also remains unchanged. No alignment transform applied.

Technical evidence: 4749 RGBA pixels changed, 984 cleared, 845 added; all8596
black-mask pixels retained exact RGBA, mask escape0. Pixel protection works,
but this observed reference-guided result fails requested inside-mask anatomy,
direction and outfit projection. This is not proof of universal service inability.
Review: right90/review.json; measurements: right90/measurements.json.
East candidate=null; raw archive only. Back180 and left270 blocked by sequential
gate. No retry, hairstyle, armor, weapon or animation request. Front untouched;
no main UI edit or generated runtime asset packaging.

## Cost, provenance and verification

Fresh quote right90-capability-quote.json reports image6, rotations0, total6
provisional credits. Completed result right90/result.json explicitly reports
charged_generations6. Balance receipts independently show remaining177->171,
used1823->1829: actual6 subscription generations, not a cash charge. Internal
additional cap6 is not a user numerical budget. Additional charged6, reserved0,
pending jobs0; one completed rejected job. Builder now retains the actual ledger
and rejected review instead of resetting to the old preflight values.
Decoded comparison
confirms rig-v2 south frame0 is NOT RGBA-identical to main-v1 south. Therefore
the template cannot mix main-v1 dimensions/face pixels with the rig-v2 master.
The older outfits.json phrase "approved appearance" is historical metadata,
not evidence of explicit user approval of this four-view set.

Validation completed after the actual attempt: deterministic builder and
independent pixel test pass, including actual6 receipt, native raw hash,
all protected RGBA and exact native/nearest2x attempt comparisons.
pnpm typecheck and pnpm build pass; touched scripts have no editor diagnostics.
Native/2x originals AND raw output were visually inspected and the raw rejected.
No new inspector UI/browser behavior is claimed; main owns that work. The
independent test saves validation.json with measured baseline failures and
semantic review still required. Test success does not promote blocked views.

## Actual native character rotation: rejected, STOP

Fresh live100-tool schema archive: rotation-experiment-01/tools-live.json.
create_character_pro_flash explicitly accepts first_frame_base64/URL or an
owned source_image_id, preserves the chosen source with transparent V3 padding,
and bills only rotations. Its n_directions is fixed8; there is no right-only
selector. create_character also supports V3 south-reference rotation and
direction_images, but no documented selective-cost quote was substituted for
the directly quoted Pro Flash reuse path.

Live native128 quote: image6 + rotations2 = total8 for new creation. Existing
first-frame reuse skips image creation. Submit receipt reports
first_direction_generated=false and estimated_generations2. One job only:
e3004236-7c93-436a-9a6b-c3139e60edd2; character
40ffc152-8925-492a-8b5a-e7c296d5deac. Completed in163s; result-final.json lists
eight static native128 rotations, animations:none. All raw PNGs archived unchanged.
Service south RGBA equals the supplied rig-v2 frame0; its PNG is re-encoded.
Runtime front therefore remains the original PNG, not the service's south file.

East inspected first at native and exact nearest2x. The rightward nose/near eye,
overlapped arms and narrower torso are substantially more profile-like than the
failed frontal inpaint. However it invents a long loose white hair tail behind
the shoulders and loses the master's crimson hair ties. Costume hem/side-panel
and embroidery construction are also redrawn. Matching colors and sandals do
not establish identity. Exact90 anatomy is still unapproved; identity failure
alone is enough to reject. No back/left assessment after this failure; their
independent raw outputs remain unreviewed archives, never accepted candidates.

Native east bounds: left33,top6,right82,bottom123,50x118; head assembly37x33,
feet25x16. Master bounds66x119,top5,bottom123; head assembly45x34. East ground
edge124 matches master exactly. The one-pixel top difference is NOT the rejection
reason. No shifting, rescaling, stretching, mirroring, head transplant or manual
pixel correction was applied. Small source-palette sole corrections remain
permitted in principle, but cannot repair this substantive hair identity drift.

Observed balance171->169 remaining,1829->1831 used: additional2 matches quote
and submit estimate. get_character has no charged_generations field. An unrelated
already-running account animation completed during wait-01, so the balance is
corroborating usage evidence, not a job-exclusive billing receipt. No animation
was requested by this task. ledger totals:8 including prior actual6, reserved0,
pending0. Internal additional ceiling8 for this invocation is NOT a user numerical
budget; historical ceiling6 retained in rotationInvocation.priorInternalCeiling.
Final service jobs receipt shows the rotation completed and no active jobs.

Manifest keeps canvas/views/original/candidate/status/landmarks contract. East
candidate remains null; optional rejectedPreview and rejectedMeasurements expose
the raw failed comparison honestly. review.approved=false and source selection
is not approval. No client TypeScript/UI changes or main-world migration.

Tests verify all raw hashes, exact source reuse, untouched runtime front bytes,
original audit bounds, rejected-preview byte equality, null candidates and both
comparison scales. Contact sheets use direct RGBA row copies and pixel replication:
alpha compositing/Sharp resizing otherwise erase hidden RGB under alpha0. Raw
source artwork is unchanged. These checks certify evidence retention, not anatomy.

Final continuation verification: deterministic collector/builder and independent
pixel test pass; pnpm typecheck and pnpm build pass. All touched scripts have no
editor diagnostics. Final native and nearest2x east comparison manually inspected.
No client UI edits or new browser behavior claimed; main can consume the optional
rejectedPreview URL. Master approvalfalse, corrected candidates null, pending0.

## Narrow existing-master hair repair: service failure, STOP

One accepted inpaint_image_pro_flash job65f45f7e-199e-4079-ade4-6a56f5da0095,
native128, Modify current layer, pure BW mask1351 selected/15033 protected.
Mask excludes the exposed profile/ear/neck regions; old loose-hair removal
footprint plus stepped upper hair/crimson bow destination only. Owned original
east and immutable master front are boxed native384x128 context; no transforms.
Live quote and submit estimate6. This is an INTERNAL six-extra ceiling, not
a user numerical budget. Result reports temporary-server-failure, no PNG.
Balance169->169 remaining /1831->1831 used: observed charge0. There is no
job-specific charged_generations field, so balance evidence is labelled observed.

No output conservation, corrected hair identity or scalp-gap verdict is possible.
Input/raw rotation and master front PNG bytes remain exact, selected protected
profile pixels0. Before/context/mask native and exact2x evidence is retained.
Original east and raw east head/pose silhouettes do not align exactly, so no
manual transplant, scaling, rotating, texture copying or body repaint was used.
Any future cloth revealed from beneath old hair remains provisional geometry;
this full-body source is not a clean head/body or garment-layer implementation.

Builder retains the complete current ledger, failed attempt and rejection history.
It supports only an explicit unapproved proposed-right90-awaiting-user-review
record with native128, baseline0 and exact unmasked/profile RGBA checks; it never
promotes approval. Here east/north/west remain null. North/west generated raw
were not visually assessed or rendered. No new style/equipment/animation request.