# Hair V3 FRONT candidates — 2026-10-10

USER reauthorized V2 neutral-male-02 for this candidate round after the V3
approval gate was raised. V3 bodies remain unapproved. This exception applies to
these three FRONT tests only, not final gameplay adoption or future directions.

Read ../reference-catalog.md, ../style-guide.md and ../silhouette-catalog.md.
Fourteen original design specifications exist; only A/B/C have shaded candidates.
The RO galleries were viewed remotely for techniques. No RO sprite/image appears
in requests, production assets or this folder. Source art is original polygon
and cluster authoring on a blank native canvas, using our exact head template.

Silhouette-first review: silhouette-4x.png was viewed before publication. A has a
low broken asymmetrical crown, B a longer feathered ear/nape frame, C a compact
pulled-back cap with upright knot. These are artist checks, not USER approval.
Then draft-shaded-4x.png was reviewed with five dark colors per style. Limited
upper-left cluster highlights replace the previous white-wig material. Small
angular planes remain a visual-review question; no claim of matching RO polish.

Six original free PixelLab Workbench exact edits plus one guarded1px cleanup publish main+fringe (A), back+main+fringe
(B), and main including knot (C). Native PNGs are downloaded from provider return
URLs, never from the provider preview sheet. Guarded patches replay byte-exact
RGBA. Body/head/source origin are unchanged. Back is a FRONT occlusion layer,
not a BACK-facing sprite. No accessory layer is required by these tests.

Technical diagnostic: front overlap with protected face/ears/neck is0. All three root targets now have0 gaps. Inspection identified one pixel
at66,20 between the knot root and crown. A single guarded exact pixel edit
joined that mass using the existing outline color, without a paid retry. The
first output and cleanup receipt remain archived. Visible scalp31/34/68 includes
intentional hairline openings.
No asset is automatically approved. User review must judge fit, silhouette,
cluster flow, hairline, palette, proportions and modularity separately.

Cost: paid calls0, retries0, free exact edits7. Live balance before/after125,
actual consumption0. Prior paid18 remains historical and unchanged.
Production/gameplay readiness and all visualApproved fields remainfalse.
STOP for USER review; no directions or animation.

Reproduce locally: node tools/rig/hair_v3_study.mjs prepare produces exact edit
requests and flat diagnostics (no service calls); publish verifies returned
native PNGs and immutable snapshots. Do not resubmit historical requests.
Tests: node --test tools/rig/hair_v3_study.test.mjs.

Validation completed: workspace typecheck and production build passed; eight
current/history focused tests passed. Browser108 cases covered all three styles,
six modes,1x/4x across1440x1000,390x844,844x390; document overflow0 and native
canvas/CSS dimensions matched every case. Main/back/fringe controls, scalp guide
and offset reset were exercised. Actual desktop/mobile screenshots are stored
here. DOM checks do not read browser canvas buffers; native PNG tests validate
contents. These checks are not art approval or physical-device sign-off.

The previous draft comparison preserves its real rear/front ordering too.
Flat silhouette intentionally shows all hair layers; visibility toggles isolate
shaded layers and do not rewrite the flat candidate file.
