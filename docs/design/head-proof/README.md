# Medium head proof: three-view review, unapproved

Static native128 art with an isolated interactive review route. Runtime manifest:
`apps/client/public/assets/head-proof/manifest.json`. All 27 required PNG URLs
exist. `coverage.complete:true` means PNG coverage, NOT visual approval.
`review.approved:false`, `stage:three-view`. No animations generated.
Shared head/palette contracts and the React/Phaser `/characters/head` review were
added. Main-world renderer, equipment and authoritative gameplay remain unchanged.

## Delivered Layers

- South/east/north original Medium clothed body, headless with attached neck.
- Independent hair-free Shaman head; all 215 south and 105 east authored
  face/ear pixels restored exactly. North has no visible face.
- East/north masked scalp and hidden cloth reconstruction, replacing tail
  holes. East upper scalp is completed from generated skin samples inside the
  scalp mask at native coordinates. Original face/body positions never move.
- Original spikes/tied tail and separate short layered crop. South/east short
  are authored PixelLab head-only changes layers, NOT chopped original hair.
  North now uses a PixelLab head-only masked changes layer with our own south/east
  short heads as native context: a connected rounded crop and tapered nape.
  The old texture-copy cap and north-short-authored.json remain archived,
  unapproved fallback evidence; a completed job takes precedence over that branch.
- One existing ritual crown in three views; anchors in manifest, native pixel
  bounds/provenance in validation.json.
- Four palettes: silver, ink, chestnut, jade. Only exact neutral RGB stops
  48/104/168/232 recolor. Crimson original ties retain source pixels; main
  renderer exact-gray-stop recoloring preserves other materials without changes.
  Neutral material masks, fixed-material overlays and uncolored hair backups
  are separately archived under masks/ and source-edits/.

Order remains hairBack/body/head/hairFront/crown. Visible cap hair is in front
of scalp. North original long hair MUST overlay the body in hairFront: from
the rear the tail is nearer the camera, and hairBack hides it beneath the torso.
The builder's north exclusion from backSelection is preserved. South/east
original rear locks remain in hairBack. Every runtime
layer is a full native128 canvas at original position. South neck gap is joined
with a recorded native connector mask, not translating head or rescaling body.
East/north connector uses generated pixels. This is the original class-clothed
headless body, not a naked anatomical base.

East derived body cleanup clears exactly six disconnected generated remnant
pixels at x39-40, y64-67 inside the existing editable hidden-cloth mask.
east-body-cleanup.json records coordinates and original RGBA; the builder checks
them and emits masks/east-body-cleanup.png. Raw generation is untouched. The
separate original-source pixel at (35,73) is outside the mask and remains protected.

## Actual Generation Costs

The previous six-credit cap was an internal constraint, not user-provided.
The prior continuation used 24 additional credits, reaching 30 total. This
focused north correction has a separate INTERNAL cap of six additional credits,
36 cumulative maximum; this is not a user-specified budget. Live schema
and capabilities queried; identical completed cost receipts checked per action,
and short prompt fields checked against actual schema before submission.
Every request estimated and actually charged six generations:

| Job | ID | Actual credits |
|---|---|---|
| Earlier south scalp | 8507f082-b8a6-4087-b777-6d909a10965b | 6 |
| East scalp/cloth | e0262c2e-bf4d-4548-8ffe-4b69257b2f00 | 6 |
| North scalp/cloth | f28b7ce8-408d-470f-99b4-a98d87dd3094 | 6 |
| Short south head-only | cdb863e3-86ed-47a1-9510-1ebd995fad69 | 6 |
| Short east head-only | 80f93812-c70b-42a4-8302-8d10bb2939f5 | 6 |
| North short correction | 5fd50da4-ec4a-445d-aaaa-c534484cdc40 | 6 |

Prior additional **24/24**, correction **6/6**, cumulative **36/36** charged,
zero pending/rejected jobs. No further generation submitted or budget remaining.
Current live capabilities expose no estimator; four identical native128 inpaint
receipts provided the six-credit cost check before submission. The new receipt
estimated six and completion charged six. Sources/context were never resized.
The actual request is prompts/short-north-correction-request.json, separate from
the builder-generated prompts/short-north.json (that generic prompt was NOT submitted).
Source input/context, tighter rear-ear/neck mask and metadata use explicit
*-correction-* filenames. Complete submit/result RPCs are jobs/short-north-*.json;
raw/short-north.png retains the original changes-only output. The earlier archives
remain intact. Credentials remain user-level; artwork and segmentation unapproved.

## Rebuild And Checks

Run `node tools/rig/build_head_proof.mjs` from workspace root. Assertions:

- Original strip/equipment SHA-256 retention and exact source partition.
- Raw scalp unmasked RGBA: south 14,702, east 14,215, north 13,943 pixels.
- Final head/body outside union of edit masks byte-identical to source.
- Exact face restoration; body no head-region pixels except neck connector.
- Head pixels reconstructed or exact face, not copied old hair.
- Physical head/body pixel contact, protected outfit and original proportions.
- Hair changes-only alpha zero outside masks; zero protected face overlap.
- North correction alpha zero outside its tighter mask, zero rear-ear/neck
  overlap, and submitted bald-head RGBA equal to the unchanged independent head.
- Short upper scalp coverage, distinct silhouette, fixed materials unchanged.
- Crown/face overlap zero; native clipping zero. Crown removes 2 south and
  7 east face-intersecting pixels, none north.
- All 27 URL PNGs native128 transparent RGBA; actual credit caps checked.

Evidence: validation.json, runtime coverage.json, output-hashes.json. Do not
delete source-retention.json to bypass changed-source failures.

## Review Images And Limits

`previews/contact-2x.png`: labelled south/east/north rows; columns source,
headless body, head, head+body, original, original+crown, short, short+crown.
Native contact sheet retained. Each view also has decomposed native/2x,
palettes native/2x, original/short head-only and crowned head PNGs, and
`*-original-crown-seat-8x.png` / `*-short-crown-seat-8x.png`.

Crown-seat enlargements inspected: rims cross upper hair caps, not face skin.
Zero face clipping is only a safety gate, not proof of an approved seat.
Native/enlarged contact sheets and all four north palettes were inspected after
correction: rounded connected rear crop, no copied vertical-stripe cap, and
original long tail visible over the rear body. North crop contrast is softer
than front/profile, and cross-view consistency still needs user review. Crown
seat enlargements show a broad rim overlapping upper hair; fit is not approved.
Scalp/cloth reconstruction, neck
connector, masks, shoulder charm boundaries and crown fit remain proposals.
Pixel checks are not semantic proof or visual approval. No animations or
main-world integration before user visual review and approval.

## Runtime Review

Open `/characters/head` for simultaneous front/side/back inspection in one Phaser
scene. Choose either hairstyle, four palette swatches and crown on/off. The layer
selector shows composite, headless body, hair-free head, isolated hair or original
source. Palettes recolor exact neutral hair stops only; head/body/crown remain
unchanged and crimson ties retain their colors. Resize preserves the scene.
The old `/characters/modular` extraction experiment and main player are retained.

Run `pnpm --filter @shaman/client test:head` and
`node packages/shared/scripts/head-rig-test.mjs` after shared build. The asset test
checks native canvases, actual file coverage, original protected face bytes,
headless-body separation, distinct hair alpha silhouettes, fixed materials and
crown/face disjointness. No automatic check marks artwork approved.

Review the three angles, both styles and crown seats first. User visual acceptance
is the gate for an eight-direction idle/walk expansion on the same native neck,
head and foot contract. Attack/cast/hurt/death follow only after that second gate.