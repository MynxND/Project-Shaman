# SOUTH Loose Long Silver-Ivory Hair

2026-10-10. Latest USER asks for long hair like our prior owned model, then
explicitly removes the red bow. This supersedes the crop design, not body approval.
Token permission does NOT expand paid PixelLab authority: zero paid calls, added
credits0, cap20/spent20/remaining0/reserved0/pending0. No quote/upload/job/retry.
Four approved body source/runtime PNGs stay byte-exact. Full visual acceptance,
hair visual approval and production readiness remain false. SOUTH review only.

## Original Art

[art.json](art.json) contains original integer polygon pixel clusters, rasterized
by [local builder](../../../../tools/rig/character_v2_long_hair.mjs). No sampled
texture, V1 extraction/transplant, rejected-output repair, noise or fake layer.
Owned concept sheet and character-rig are visual direction ONLY. Seven authored
gray/silver-ivory stops: #373A39 #525754 #70766F #969D8F #BBC2AF #DAE0CA #F3F1DE.
Upper-left highlights, lifted tuft, interrupted fringe, loose side falls and
tapered rear locks. No bow, ribbon, elastic, tie or colored decoration; red0.

Real transparent full native128 RGBA sources:
[hair-back.png](hair-back.png) and [hair-front.png](hair-front.png).
Their runtime copies under apps/client/public/assets/character-v2/hair-long-manual-01
are byte-identical; hashes and polygon hash are in [review.json](review.json).
Item ivory-long01-manual, method manual, jobId null, SOUTH/static idle/frame1,
timeline[null], unchanged pose ID neutral-male-02-idle-south and origin61,112.

## Depth And Protection

SOUTH order: hairBack/body/outfit/hairFront/headgear/mainHand/offHand/accessories/effects.
Existing shared contract and actual Canvas renderer already support complete
split pairs. No contract, gameplay renderer, equipment/server, motion or wardrobe
changes. Missing pair member or other hair direction fails closed. Outfit absent.

Rear2042 pixels, bounds x42..82/y18..78; front675, x43..81/y13..66. Rear1508 pixels
are legitimately hidden by the body, with116 rear pixels visible below the neck
and88 front pixels below the neck. These are distinct counts, not total visible
composite pixels. Rear reaches the waist/upper shorts region of the93px-tall body.
Front forelocks lie over the shoulder, rear mass behind torso/arms, not a cape on
top of the chest. All source RGB/alpha remain original; hair is never skin/body.

29 forehead pixels at y32..34 intentionally occluded. Eyes/brows from y35, nose,
mouth, jaw, both ears and neck composition mismatch0; ear occlusion false. Scalp
holes0 within the alpha-clipped authored scalp region y20..31. Red/skin-like/
copied-body-RGBA/hidden-RGB/partial-alpha0 in BOTH passes. The technical scalp
check is a defined region, not a claim of approved hidden-head reconstruction.

The former crop stays untouched in hair-manual-01, including PNGs, runtime copy,
review, diagnostics and historical browser captures. archivedHairDrafts retains
its original single-pass pose/assets with selectablefalse. It cannot be selected
in the new split SOUTH pose; no blank fake hairBack and no silently changed crop
binding. All rejected paid images/receipts and unknown ledger fields are retained.
manifest-before/ledger-before/frozen-hashes provide exact pre-long evidence.

## Review And Verification

Inspected actual [native comparison](comparison-native.png),
[nearest2x](comparison-nearest2x.png) and [nearest6x](comparison-nearest6x.png):
bare body / rear / front / correctly sorted composition. These are diagnostic
PNGs only, never runtime items. Rear strand geometry and forehead spike remain
manual art proposals requiring USER review, not automatically approved design.

Focused tests verify original raster replay, binary alpha/zero hidden RGB,
feature protection, long tail bounds, palette exclusions, wrong-depth differences,
exact nearest diagnostics, source/runtime hashes, body conservation, all historic
paid fields/unknown properties, archived crop binding and pair fail-closed behavior.
Publication regression, shared suite, workspace typecheck and build passed.
[browser-evidence.json](browser-evidence.json) records15 actual cases at1280x900,
390x844 and844x390: SOUTH both-pass on/off and E/N/W absent, source hashes0
mismatch, sorted canvas mismatch0, protected features0, no DOM overflow/page
errors. Hair-on body delta953, hair-off0. All six actual full-page screenshots
were inspected, including [desktop on](browser-desktop-hair-on.png) and
[desktop off](browser-desktop-hair-off.png), portrait and landscape counterparts.
Keyboard focus/Space works. Pointer attempt was intercepted by host capture
reflow; pointer verification and responsive screenshot fidelity remain false.
No real-device test. Screenshots prove hair rendering, not mobile visual sign-off.

```powershell
node --test tools/rig/character_v2_long_hair.test.mjs tools/rig/character_v2_manual_hair.test.mjs tools/rig/character_v2_hair.test.mjs tools/rig/prepare_character_v2_hair.test.mjs
node apps/client/scripts/character-v2-assets-test.mjs
pnpm --filter @shaman/shared test
pnpm typecheck
pnpm build
```

Inspector: http://localhost:3000/characters/v2. STOP for SOUTH visual review before
direction expansion. No automatic hair acceptance, live integration or paid work.