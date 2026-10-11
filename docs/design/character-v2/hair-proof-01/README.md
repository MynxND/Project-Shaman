# SOUTH Hair Proof 01: No-Credit Preparation

Preparation only, 2026-10-09. **No new hair artwork exists. No provider submission,
upload, paid quote, rotation, retry, outfit, animation or runtime publication.**
`realCandidate: null`, `visualApproved: false`, `productionReady: false` and
`submittable: false`. The existing V2 inspector and every existing manifest/body
remain untouched. No old hair pixels, cached body layer or hand-painted hair
are presented as a new candidate. Synthetic controls exist only in test memory.

## Exact Source And Proposed Edit

- Approved owned FRONT02: [raw.png](../body-front-02/raw.png), native128 RGBA,
  SHA-256 `0ed1ddf448b70a93dc5f624617e832a0af593779b6b7257d65db39b61be35958`.
  Runtime PNG has the identical byte hash. SOUTH pose origin remains `(61,112)`;
  no translation, padding, scaling or body edits.
- Proposed `ivory-crop-01`: short ivory scalp-fitting crop, a small upper-left
  asymmetrical tuft, crisp clusters and upper-left light. No bow, crown, long tail,
  sideburns, clothes or copied V1 silhouette. Proposed ramp only:
  `#686C65`, `#A9ADA0`, `#D9DCCD`, `#F1EEDB`.
- Inspected bald dome begins at `y20, x58..66`, widens to `x53..71` at `y22`
  and `x49..75` at `y28`. Editable mask is a stepped dome plus small tuft allowance,
  `374` pixels, bounding rectangle `x48,y16,width29,height16`. Exact row spans
  are recorded in [preparation.json](preparation.json), not a face-covering rectangle.
- Protect all source-visible forehead/face from `y32..48`, ear protrusions near
  `x47..51 / x73..77, y35..43`, and neck `x57..68,y49..52`. Protection masks are
  clipped to actual FRONT02 alpha. Face `361`, ears `80`, neck `47`: union `488`,
  mutually disjoint and hair overlap `0`. All `16,010` pixels outside the edit mask
  are frozen, including transparent canvas, the remaining scalp and entire body.

**Deliberately conservative cap-only prototype:** facial features start around
`y35`, but the whole visible forehead from `y32` is protected. Legitimate bangs
that occlude the face are consequently forbidden. This is not a complete hairstyle
proof or USER-approved mask; revising that boundary needs review, not a relaxed
validator or a fake completed proof. No E/N/W hair is prepared or approved.

## Request And Capability Limits

[request.json](request.json) contains ONE local preparation recipe for cached
`inpaint_image_pro_flash`: `New layer with changes`, `crop_to_mask: true`,
`no_background: true`, seed `0` from FRONT02's original request, and its owned
source image ID. Local image/mask/context paths are explicit; no secret/base64,
network request or credential is stored. `mask_image_url` is unresolved `null`:
the file is intentionally **not an executable provider payload**.

The repository's actual catalog schema supports changes-only output, seed,
`context_image` and `bounding_box`. Context is the same owned full128 image;
bounding box `(0,0,128,128)` locates the full native source in context, NOT the
small edit-mask rectangle. Catalog path/hash and inspection status are recorded.
Schema was inspected locally only: no live capability/price check was made.
Changes-only isolation is documented but **not demonstrated for this hair**.
No transport adapter or tool-submit function exists in the preparation utility.

## Budget And Stops

Actual ledger remains **cap18 / spent14 / reserved0 / pending0 / remaining4**.
The proposed single native128 inpaint cost is **6 provisional**, not a current
provider quote; deficit is `2`. Nothing raises the cap, reserves funds or changes
the ledger. Initial and final ledger SHA-256 are both:
`8d9383e47822bafb4a6b969273edb7f72f006e89c337e12231591d32b404636a`.

SOUTH is approved; E/N/W are still unapproved. Four-view USER approval, a separate
explicit hair-stage authorization and a budget decision are missing. A general
instruction to continue, an unavailable user or an unanswered cap/four-view
question is NOT approval. No paid work can proceed from these files.

## Candidate Gate

A future candidate is decoded and evaluated independently, never accepted by
body/composite appearance alone. Require native128 PNG with actual RGBA alpha,
nonempty binary-alpha hair, editable-mask-only pixels, zero protected-anatomy
overlap, and only the provisional hair ramp. Reject skin under hair, full-body
RGBA, cached source RGB even under zero alpha, partial alpha, empty/wrong-size
layers, face/ear/neck overlap and out-of-mask pixels. The strict ramp is a
prototype isolation guard, not a general future hairstyle material policy.

Recomposition overlays accepted opaque hair pixels on a copy of the exact body;
every pixel outside hair stays byte-exact and the original body is never mutated.
Technical acceptance never grants visual approval or publishes assets. Actual
provider output, its silhouette/material quality and real hair composition remain
unverified because no candidate exists.

## Files And Checks

- [hair-allowed-mask.png](hair-allowed-mask.png): native128 pure BW provider mask,
  white=editable, black=frozen.
- [protected-face-mask.png](protected-face-mask.png),
  [protected-ear-mask.png](protected-ear-mask.png),
  [protected-neck-mask.png](protected-neck-mask.png),
  [protected-anatomy-mask.png](protected-anatomy-mask.png),
  [protected-all-mask.png](protected-all-mask.png): diagnostic protection masks,
  white=PROTECTED. Never send these as an edit mask.
- [body-mask-diagnostic-native.png](body-mask-diagnostic-native.png) and
  [body-mask-diagnostic-2x.png](body-mask-diagnostic-2x.png): exact owned body plus
  cyan editable / pink face / yellow ears / green neck overlays. Exact nearest2x,
  inspected locally; **diagnostics, NOT hair or game assets**. No public copy.
- [request.json](request.json), [preparation.json](preparation.json),
  [ledger-initial-sha256.txt](ledger-initial-sha256.txt): blocked recipe, source/
  runtime/manifest/catalog/cardinal hash evidence, mask metrics and initial ledger hash.
- Local utility: [prepare_character_v2_hair.mjs](../../../../tools/rig/prepare_character_v2_hair.mjs);
  focused tests: [prepare_character_v2_hair.test.mjs](../../../../tools/rig/prepare_character_v2_hair.test.mjs).
  Preparation refuses an existing
  directory or changed ledger, protecting user evidence. Evaluation is read-only.

```powershell
node --test tools/rig/prepare_character_v2_hair.test.mjs
node tools/rig/prepare_character_v2_hair.mjs --evaluate <future-local-candidate.png>
```

Preparation has already run; do not rerun `--prepare` over this evidence. Tests
check real emitted mask dimensions/BW pixels, anatomy disjointness, source/runtime
hashes, body conservation, exact diagnostic overlays/2x, budget blocking, entire
ledger/manifest/cardinal byte conservation, duplicate-preparation rejection and
independent rejection/control probes. Controls are never written or published.

Verified this preparation: focused Node tests **6/6 PASS**, existing
`node apps/client/scripts/character-v2-assets-test.mjs` **PASS**, `pnpm typecheck`
**PASS**, workspace `pnpm build` **PASS**. Native mask and nearest2x diagnostic
were visually inspected. No new browser workflow was introduced or tested;
the runtime inspector is unchanged. No actual hair candidate was evaluated.