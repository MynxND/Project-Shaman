# SOUTH Hair Proof 01: One Paid Attempt, Rejected

2026-10-09. Latest USER approval answers the explicit four-body-view and
cap18-to20 questions. Scope is ONE SOUTH `ivory-crop-01` cap-only masked proof,
maximum6, no retry. [authorization.json](authorization.json) records the decision.
Body4views are now visually approved, byte-exact and untransformed; anchors/fit
remain provisional. Historical FRONT approval and rotation diagnostics remain
unchanged. Full `userVisualAccepted` remains **false**.

## Result And Stop

Job `b8fa5d1b-b7dd-43ac-bd3c-885fef12afe1`, image
`b31fc043-d49b-5421-9c68-fe4931d8f591`, tool `inpaint_image_pro_flash`.
Live native128 quote6, actual job receipt6; V2 **cap20/spent20/reserved0/pending0/
remaining0**. Observed account149 to143 corroborates only; the job-specific
`charged_generations` establishes charge. Prior jobs6+6+2 remain unchanged.

**REJECTED: visible skin/scalp is baked into the returned layer.** Untouched
[raw.png](raw.png) is128x128 RGBA,355 visible pixels, binary alpha,0 outside-mask
pixels,0 hidden RGB pixels.94 visible warm-skin-like pixels and18 exact source
RGBA matches support the semantic inspection: ivory hair above a warm scalp band.
Changes-only alpha confinement does NOT establish hair-only semantic isolation.
No skin removal, recolor, cropping, resizing, copied V1 art or fake modular layer.
No runtime hair PNG or hair binding was published. Other directions fail closed.
No retry, other paid jobs, outfit, equipment, animation or live renderer changes.

Mask remains exactly374 pixels at x48..76/y16..31, no face/ear/neck overlap.
Protected anatomy361+80+47=488; all16,010 outside-mask pixels are frozen.
Diagnostic recomposition has protected mismatch0, body source/runtime hash remains
`0ed1ddf448b70a93dc5f624617e832a0af593779b6b7257d65db39b61be35958`.
This conservative cap-only mask forbids natural bangs/full hairstyle coverage.
No mask expansion or face editing is authorized. Outfit remains absent and needs
a future scope/budget decision; remaining0 is not permission for any new work.

## Evidence

- [raw.png](raw.png): untouched provider output, rejected, NOT isolated hair.
- [rejected-composite-diagnostic.png](rejected-composite-diagnostic.png): diagnostic
  overlay on an exact body copy, NOT a candidate/game asset.
- [comparison-native.png](comparison-native.png) and
  [comparison-nearest2x.png](comparison-nearest2x.png): bare body / rejected raw /
  rejected recomposition, direct RGBA copies and exact nearest replication.
- [review.json](review.json): hashes, dimensions, palette observations, confinement,
  source matches, contamination, conservation, visual verdict and stop.
- [live-schemas.json](live-schemas.json), [quote.json](quote.json),
  [request.json](request.json), [submit-intent.json](submit-intent.json),
  [submit.json](submit.json), [wait.json](wait.json), [result.json](result.json),
  [accounting.json](accounting.json), [balance-before.json](balance-before.json),
  [balance-after.json](balance-after.json): transport, single submission and receipt.
  Auth remains in user configuration; no credentials/base64 are archived.
- [ledger-before.json](ledger-before.json), [manifest-before.json](manifest-before.json):
  exact pre-authorization snapshots matching preparation's initial hashes. All parent
  preparation artifacts remain historical and untouched, not silently reapproved.
- [browser-desktop-body-only.png](browser-desktop-body-only.png),
  [browser-portrait-body-only.png](browser-portrait-body-only.png),
  [browser-landscape-body-only.png](browser-landscape-body-only.png): actual inspector
  screenshots, inspected. DOM viewport1280x900/390x844/844x390; host screenshots
  are full-page and do not constitute real-device testing.

## Validation And Changed Files

Preparation6/6, paid-proof2/2, current publication and historical FRONT01/FRONT02/
rotation regressions, shared suite, workspace typecheck/build PASS.
Browser12 combinations (four body directions by three viewport sizes): nonblank,
source/canvas RGBA mismatch0, smoothingfalse, nearest2x256px, no horizontal overflow,
all body approvals true, full visualfalse, hair/outfit disabled. Hair on/off cannot
be demonstrated: rejected hair was deliberately excluded. No candidate acceptance.

Changed accounting/publication: `docs/design/character-v2/cost-ledger.json` and
`apps/client/public/assets/character-v2/manifest.json` only; body PNGs untouched.
Contract: `packages/shared/src/character-v2.ts`, shared V2 test.
Adapters/checks: `tools/rig/character_v2_hair.ps1`,
`character_v2_hair_evidence.mjs`, `character_v2_hair.test.mjs`, preparation utility/
test, historical FRONT02/rotation evidence checkers, client V2 asset test.
Historical checks retain exact cap18 snapshots; new check verifies cap20 authority,
prior unknown fields, actual cumulative20 and rejected raw, never relaxes budgets.
Architecture/art/design/roadmap/spec documents have current result entries.

```powershell
node --test tools/rig/prepare_character_v2_hair.test.mjs tools/rig/character_v2_hair.test.mjs
node apps/client/scripts/character-v2-assets-test.mjs
pnpm --filter @shaman/shared test
pnpm typecheck
pnpm build
```

STOP. A future hair investigation needs a new explicit authorization. Minimum
native128 quote6 was provisional for this attempt, not a future guaranteed price
or approval. No full modular milestone or live adoption is claimed.