# Modular Character V2 - Technical And Asset Specification

## Latest Long Hair Without Bow - 2026-10-10

USER requests long hair like our own prior model, then "ไม่ต้องมีโบว์แดง".
New original loose silver-ivory SOUTH hair replaces the short-style proposal,
not the approved bodies. Native128/origin61,112/one idle frame/timeline[null],
same pose ID with hairBack/body/outfit/hairFront sorting. Real rear/front PNGs,
manual/jobIdnull, seven gray-ivory colors, rear to y78/front locks to y66. No bow,
tie, elastic or colored decoration; red0/skin0/hiddenRGB0, scalp gaps0. Forehead
29 intentional pixels at y32..34, eyes/ears/jaw/neck mismatch0. Hair/full visual
approval false. Owned prior art is direction ONLY; no extraction/transplant.
Crop draft retained byte-exact with original single-pass binding in archive,
not selectable in the split pose and not converted to an empty fake rear layer.
Token permission does not expand PixelLab budget20/20; zero paid calls/additional0.
Other hair directions/outfit/animation/live changes absent; STOP for visual review.
See hair-long-manual-01/README.md. Earlier crop specifications are historical.

## Current Manual FRONT Draft - 2026-10-10

Latest proceed follows manual hair authoring recommendation: zero-credit new
SOUTH ivory-crop01-manual pixel rows, not another provider job or rejected scalp
cleanup. Singlehair pass/body-before-hair; native128/origin61,112/frame1/null.
Manual silhouette may exceed old374 mask, with deliberate21 forehead pixels
covered only at y32..34. Face features/ears/neck/body protected; exact bodies and
paid receipts retained. Methodmanual/jobIdnull, hair/full approvalfalse. Other
directions/outfit/animation absent. Paid20/cap20/remaining0 unchanged. STOP for
USER visual review; see hair-manual-01/README.md. Prior paid-stage stops below
remain history, not permission for new paid work.

## Current Bounded SOUTH Hair Result - 2026-10-09

USER "อนุมัติทั้งหมดเลยทำได้เลย" approves exact body4views and cap18-to20,
ONE SOUTH ivory-crop-01 isolated cap-only proof, max6/max1/no retry. Existing374
mask is authorized, not expanded; face/ear/neck protected. Live128 quote6 and actual
receipt6, cumulative20/cap20/remaining0/pending0. Actual provider PNG contains
visible scalp/skin inside mask, so isolation failed: raw archived rejected, no
hair publication or body edits. All four bodies visually approved; actual feet
and anchors stay provisional, no alignment transforms. Full userVisualAccepted
remains false until real all-view body/hair/outfit complete and approved. No
other directions/outfit/equipment/animation/live integration authorized. STOP.
See hair-proof-01/paid-stage/README.md; earlier stage records below are historical.

2026-10-09. **ASSET SPEC ACCEPTED; FRONT02 VISUALLY APPROVED; FOUR-VIEW REVIEW PENDING.**
Latest USER "ผ่านแล้วครับทำขั้นต่อไปเลย" approves byte-exact FRONT02 and ONE
reference-reuse rotation, capped2. Completed actual2 with job-specific receipt;
cap18/spent14/reserved0/pending0/remaining4. Accepted FRONT02 estimated3.1-3.33
heads supersedes target3.5 for THIS source only; no front regeneration. Four real
static cardinal bodies share canvas128/origin61,112; actual E/N/W foot deltas are
separate provisional diagnostics, never hidden by alignment transforms. SOUTH
approved; E/N/W unapproved; independent hair/outfit absent, milestone incomplete.
STOP for USER four-view approval, no retry/hair/outfit/animation/live integration.
See `body-rotation-01/README.md`, authorization, receipt and measurements.

## Historical FRONT02 Gate (Superseded Only As Above)

2026-10-09. **ASSET SPEC ACCEPTED; FRONT ART NOT APPROVED.** Latest user explicitly
accepts this specification. FRONT01 completed/charged6 and was rejected for
elongated muscular anatomy. Latest proceed separately authorized ONE revised
FRONT02 maximum6, completed/charged6; SOUTH-only candidate awaits USER review.
Current cap18 / spent12 / reserved0 / pending0 / uncommitted6.
Asset-spec acceptance, job spending authorization and user visual acceptance are
separate decisions. Dedicated cost-ledger.json records the narrow stage authorization.
Earlier proposal/blocker sections below are historical cost discussion, superseded
only by these FRONT-only decisions. No rotation, hair, outfit or further retry
is authorized. See `body-front-02/README.md`, `authorization.json` and actual
`review.json`: estimated3.1-3.33 heads, provisional anchors, visualApprovedfalse.

## Scope And Stops

Build from scratch: one new neutral male bald body, four cardinal static idle
views, one independently interchangeable hair and one outfit, and a separate
real-asset inspector at `/characters/v2`. Head may remain part of body: eight
semantic slots are body/hair/outfit/headgear/mainHand/offHand/accessories/effects.
No old repair continuation, deletion, 14-hair collection, new animations, runtime
registration, live renderer migration, inventory/server/network changes or V1
fallback. Archived assets are identity/measurement references ONLY, never V2
output, copied layer pixels, pose clips or provenance under a new name.

## Source Evidence

- Owned identity: `docs/design/comfyui/reference/shamen-base-sheet.webp` and
  `docs/design/character-rig.md`; chibi apprentice Shaman, roughly 3.5 heads.
  No third-party sprites, sacred writing or copied game art as generation inputs.
- `packages/shared/src/modular-character.ts`: independent pose clock and eight
  layer slots; `apps/client/src/game/characters/LayeredCharacter.ts`: frame-order
  composition. They remain unchanged and are not V2 dependencies.
- `apps/client/src/game/characters/ModularRig.ts`: equipment samples body frame
  grip/crown/tilt and depth. Whole-body clothing is not isolated outfit evidence.
- Existing rig-v2 native source128; old modular proof padded192 with offset32/44
  and proof foot96/168. These are distinct coordinate spaces, not V2 templates.
  Recorded native source foot64/124 is reference evidence, not approved V2 anatomy.
- Existing world32 px/unit and actor scale0.5 are reference measurements. V2
  proposed scale0.5 makes native128 canvas64 screen px; this is not body height or
  combat range, and this task changes neither world scale nor live actor sizing.

## Proposed Asset Design (Needs User Approval)

**Body `neutral-male-01`:** original owned-identity face, restrained chibi anatomy,
same head size/limb proportions in all views. Bald, modest opaque plain charcoal
under-shorts; no hairstyle, armor, hat, weapon, sash, mantle, jewelry or effects
baked in. Plain coverage is anatomical base modesty, not a selectable garment.
Exposed neck, shoulder, torso and scalp must support future layers cleanly.
South square frontal, north square rear; east/west true profiles with low
top-down world visibility, not three-quarter substitutions or automatic mirrors.

Proposed ramps: outline `#293330`, skin shadow/mid/light `#916C59/#BF9270/#E2BA91`,
neutral coverage `#394744/#586360`. Upper-left light, crisp pixel clusters and
transparent RGBA; no blurred shading or baked background. Swatches/anatomy are
proposals, not approved visual design.

**Superseded Hair `ivory-crop-01`:** one short ivory Shaman crop with a small asymmetrical
tuft, using owned identity's silver-white material. No crown, bow, long tail or
copied V1 silhouette. Proposed ramp `#686C65/#A9ADA0/#D9DCCD/#F1EEDB`. Author an
isolated transparent scalp-fitting layer; front/back subpasses are allowed only
if both exist for the same item/pose. No extracted V1 hair.

**Outfit `woven-apprentice-01`:** independent cream short tunic, moss woven panel,
small brick-red waist tie and bronze trim, simplified owned apprentice identity.
No hair/head/skin/weapon in the garment image; no whole-character recolor. Proposed
ramps cream `#B5A781/#ECE3BF`, moss `#4F6550/#879474`, crimson `#7D3E44/#B55058`,
bronze `#967844/#D6B46C`. Preserve body/face outside legitimate cloth occlusion.
Garment isolation is an unresolved production capability, not guaranteed by a
PixelLab character call. Review one south garment before extending directions.

## Coordinates, Poses And Bindings

Proposed source canvas128x128, transparent PNG; origin64/124 starts the discussion
only. Runtime pending manifest has **no approved coordinates, poses or URLs**.
Measure actual accepted front feet/scalp/hands before authoring per-frame foot,
hairRoot, headgear, mainHand, offHand and accessories anchors. All layers use the
same full native canvas/origin; no padding, arbitrary fitting or screen-derived
coordinates. Preserve the newly accepted source bytes and record SHA-256.

Contract version `shaman-character-v2/1` is distinct from rig-v2 and modular-proof.
Each pose has stable ID, direction, state, canvas/origin, frame anchors/order and
timeline. Six states idle/walk/attack/cast/hurt/death are declared; this milestone
permits only idle, one static frame, duration null, loop false. No breathing,
fake idle-duration loop or reuse of archived motion. Future animation needs
separate scope/budget/visual gates; every layer must share exactly the same pose
ID, direction, frame count, timeline and origin. HairBack/hairFront are rendering
subpasses, not extra semantic slots. Per-frame order can put long rear hair over
torso in north; never prescribe universal hair-behind-body ordering.

One shared sample index drives all assets; equip replaces only its target slot,
without resetting time. Item/pass bindings must be unique and complete. Missing
pose, direction, subpass or frame fails closed; never mirror/fallback implicitly.
V2 URLs must stay under `/assets/character-v2/`; new-source provenance stays under
`docs/design/character-v2/`, with SHA-256, method and job ID where applicable.
The source PNG and runtime PNG must have identical bytes for hash verification.
Technical validation does not certify visual quality or truth of provenance.

## Historical Cost Discussion (Superseded)

This subsection retains pre-authorization discussion, not current accounting.
Current accepted spec and two FRONT-only stage decisions are recorded above and
in the ledger; actual spent12, pending0, remaining6 does not authorize more work.

Parent's read-only live inspection: native128 create/inpaint estimate6;
Pro character estimate8, of which owned approved-front reuse rotations estimate2.
These are inspected tool/request-specific estimates, not universal prices or
guaranteed charges. Recheck schema/quote before each separately authorized job.
Four hair plus four outfit image proofs were estimated about56 in that inspection;
that is not a universal exact cost and does not fit cap18. No reliable equipment
isolation capability has been demonstrated.

Reduced option A: front body6 + reused approved-front body rotations2 + isolated
south hair6 = estimated14; remaining4 cannot fund a quoted6 outfit proof.
Option B: body front6 + reuse rotations2 + isolated south outfit6 = estimated14;
remaining4 cannot fund quoted6 hair. Neither option delivers the full milestone,
nor four-direction hair/outfit. No budget silently expanded or borrowed from old
repair ledgers. Current dedicated ledger remains18/0/0, specAcceptedfalse.

Decision required: accept/revise this asset spec and select a reduced proof scope
or separately reconsider budget. Even after spec acceptance, first paid proof
may only be body south estimate6 with explicit job approval. STOP for user front
visual review; body rotations estimate2 ONLY after approved front and separate
authorization. No automatic retry, bulk rotation/hair/outfit submission or
animation generation. Reject and archive a failed proof; do not treat balance
remaining as permission. Actual receipts update this dedicated ledger only.

## Inspector And Acceptance

React owns this static diagnostic route and local controls; Canvas2D composes
static review PNGs only. It imports no Phaser, room, player store or live registry.
Four directions, eight layer checkboxes/item selectors, idle-only state controls,
nearest1x/2x/3x, pixel grid and recorded anchor overlays. Selectors stay disabled
until complete real image bindings decode with exact dimensions, hash and nonempty
alpha. PNG coverage is not user visual acceptance. Absent/failed/loading are
explicit; empty manifest never becomes ready or displays a synthetic character.
Current pending preview proves readiness handling only, not real art rendering.

Focused synthetic contract tests cover pose/time alignment, static duration,
layer order, split hair, target-slot replacement, provenance, budget and V1 URL
rejection. Synthetic fixture URLs never enter public manifest. A real-asset
readiness test verifies files/dimensions/hash/provenance when present. Run shared
tests, client typecheck, workspace build, desktop/portrait/landscape inspection.
Actual new PNG composition, silhouette/anchors/material consistency and clothing
identity protection remain unverified until new assets and user review exist.

Future migration is gated and reversible: approved all-view body/hair/outfit,
approved motion/equipment coverage and parity tests before any proposed feature
flag or integration. No migration/fallback implementation belongs to this task.