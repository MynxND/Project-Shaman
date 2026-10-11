# FRONT Manual Hair Draft 01

2026-10-10. Latest USER proceed follows the explicit recommendation to author a
new manual hair layer, not retry generation. SOUTH only; stop for visual review.
Actual additional cost **0**. Dedicated paid ledger remains **20/20**, remaining0,
reserved0/pending0. No provider tool, upload, quote, submission or paid job called.
Paid receipts and every hair-proof-01 file are frozen by SHA-256; rejected raw
still contains its original94 skin-like pixels. Four approved bodies are byte-exact.

## Authorship And Protection

[front-rowmap.json](front-rowmap.json) is newly hand-authored explicit pixel rows;
the Node/Sharp rasterizer uses no sampled texture, rejected raw, V1 hair, circles,
SVG mockup or procedural noise. Seven gray/ivory stops, upper-left highlights,
lifted asymmetric left tuft, swept crown clusters and interrupted pointed fringe.
Native128 RGBA; common origin61,112; one static idle frame, timeline[null].
Single `hair` pass above body, item `ivory-crop01-manual`, method `manual`, jobIdnull.
Only SOUTH has this item; E/N/W hair fail closed, outfit/animation remain absent.

[front.png](front.png) is the real transparent hair-only source; runtime copy at
apps/client/public/assets/character-v2/hair-manual-01/front.png has identical bytes.
SHA-256 `24b0061560578f58b5e0b888479decf1d1fd3e887c037b518454719f7bee0d5a`.
Original FRONT02 body SHA-256 remains
`0ed1ddf448b70a93dc5f624617e832a0af593779b6b7257d65db39b61be35958`.

427 visible pixels, bounds x45..78/y13..34; seven-color palette disjoint from
protected face/skin palette. Skin-like0, copied source RGBA0, hidden RGB0,
partial alpha0. Expanded manual silhouette has83 pixels outside the historical
374-pixel provider mask. Deliberate21-pixel forehead occlusion at y32..34;
eyes/brows from y35, nose, mouth, jaw, both ears, neck and lower body mismatch0.
Underlying body file is never edited. This is NOT provider-output skin cleanup.

## Art Review

Inspected standalone and recomposition at6x, native/2x diagnostics and actual
browser hair on/off. The ivory material and lifted tuft are readable; dark fringe
tips are angular, the central bang is pointed and right crown weight remains a
review concern. This is a credible manual **draft**, not approved finished art.
`hairVisualApproved`, asset `visualApproved`, full `userVisualAccepted` and
`productionReady` stay false. No direction, outfit or animation expansion.

[comparison-native.png](comparison-native.png),
[comparison-nearest2x.png](comparison-nearest2x.png),
[comparison-nearest6x.png](comparison-nearest6x.png): bare body / isolated hair /
recomposition, exact native and nearest replication. Composite and comparisons
are **diagnostics**, never registered game assets. Standalone enlargement files:
[hair-native.png](hair-native.png), [hair-nearest2x.png](hair-nearest2x.png),
[hair-nearest6x.png](hair-nearest6x.png).

## Validation

Focused manual tests, historical preparation/paid rejection tests, V2 publication
regressions, shared suite, workspace typecheck/build and editor diagnostics pass.
[browser-evidence.json](browser-evidence.json) records actual15 browser cases:
SOUTH on/off and E/N/W bare at1280x900,390x844,844x390. Source hash verified,
canvas mismatch0, hair-on delta427, hair-off delta0, protected-feature mismatch0,
smoothingfalse, nearest2x256px, no DOM horizontal overflow, no page errors.

Six real browser captures are retained as browser-{desktop,portrait,landscape}-
hair-{on,off}.png. **Responsive screenshot fidelity is NOT verified**: the host
browser capture backend reflows to its own surface size during capture even with
isolated contexts/CDP clips; PNG dimensions alone do not prove viewport layout.
The portrait image crops a host layout. Landscape was scrolled to the primary
canvas. Captures were actually inspected and are useful for hair rendering only;
DOM/canvas/normal pointer interactions were checked before capture separately.
Real-device mobile testing was not performed. Do not claim full responsive visual
sign-off. No CSS changes were made to compensate for this tooling limitation.

```powershell
node --test tools/rig/prepare_character_v2_hair.test.mjs tools/rig/character_v2_hair.test.mjs tools/rig/character_v2_manual_hair.test.mjs
node apps/client/scripts/character-v2-assets-test.mjs
pnpm --filter @shaman/shared test
pnpm typecheck
pnpm build
```

Inspector: http://localhost:3000/characters/v2. STOP for USER FRONT hair review.
No live equipment registry, world renderer, server, outfit or animation changes.