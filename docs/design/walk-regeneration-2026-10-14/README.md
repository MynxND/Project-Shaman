# Generated walk candidates — 2026-10-14

User authorized regeneration of problematic poses from the64-clip audit.
36 clips now have new lower-body art: Santet, Keris, Onmyoji, male Miko,
Rune Seer and Ullr Hunter; SOUTH, SOUTH-EAST, NORTH-EAST, NORTH,
NORTH-WEST and SOUTH-WEST. EAST/WEST retain original art because anatomy
is occluded; Achan/Juggernaut keep their existing production frames.

## Actual output and limits

Each clip has four newly authored contact/passing key poses, held twice in
eight timing slots: A contact, B passing, B contact, A passing. These are
**not eight unique authored phases**, and are not certified as complete,
smooth, planted-foot cycles. Missing swing/recoil intermediate art remains.
No output is automatically approved or published to gameplay.

`manifest.json` references288 transparent128px candidates. `plan.json`
records scope, source fingerprint, prompts and guides. Raw images and
per-class contact sheets stay here. `receipts.json` records35 bulk calls;
Keris SOUTH used three proof calls (38 built-in imagegen calls total,
PixelLab0; billing token totals unavailable).

The initial full-eight-phase proof repeated limbs; a second attempt and a
separate opposite-passing pair formed the Keris SOUTH four-key proof.
Remaining jobs use a four-pose guide and exact existing idle references.
Guides are original2D diagrams, not rigged3D models.

Export copies source upper rows0–87 byte-exact and replaces full lower
rows88–127 with nearest-scaled generated art at the existing clip scale.
Head translations remain paired to source identity in the review. Original
PNGs, saved head offsets/orders and all runtime manifests remain unchanged.
Lower weapon/hem pixels can change; only upper grip/neck protection is exact.

Contact-sheet inspection shows opposite passing silhouettes in many clips,
but footprint size/depth, garment seams and ground contact vary. Alpha-bottom
variation is reported per clip (includes weapons, so it is not a foot-contact
measurement). Some contact poses still look lifted rather than two-foot
contact. **Keris NORTH/NORTH-WEST idle references and original upper poses
show the front of the outfit**, so lower-only replacement cannot repair their
facing identity. These must not be presented as correct rear-facing clips.

## Preview and validation

Open http://127.0.0.1:8771/head-walk-review. Select an existing class, switch
between generated candidates and the old reduced sequence, pause/step,
show the original head, enlarge legs and compare onion overlays. No save or
approve action exists on this review page.

Check source identity/facing first, then A/B alternation, supported foot
height and sliding, knee continuity, lower hem/weapon seams and7→0 loop.
Compare at2/4/8fps. Human acceptance remains pending for every new clip.

Commands: `node tools/rig/export-walk-regeneration.mjs`,
`node tools/rig/check-walk-regeneration.mjs`,
`node tools/rig/test-walk-cycle-review.mjs`,
`node tools/rig/check-armed-head-editor.mjs`, `pnpm typecheck`, `pnpm build`.
All passed.288 output hashes/dimensions/alpha, protected upper rows and old
source hashes checked;64-clip audit verifies saved offsets/orders and original
runtime manifests. Browser checked all eight classes with eight cards each,
generated/existing switch, heads, stepping and390×844/844×390 layouts without
horizontal DOM overflow. Screenshots are evidence, not art approval.

## Head/hair recommendation

Keep the existing modular system. Five styles×five colors means25 variants.
For one eight-direction/eight-slot body cycle, baking every combination means
1600 frame variants; modular bodies use64 body slots plus reusable heads.
Five static head styles×eight facings means40 head views; palette colors can
reuse those views. This compares maintenance/file counts, not billed tokens.
No new heads/hair were generated in this stage.
