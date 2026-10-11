# Hair redesign, all directions (head-layers-02)

User feedback 2026-10-10: v1 hair showed cream scalp from the side/back, side views looked wrong, and faces differed between hairstyles. Rules adopted (user): hair fully covers the skull in every direction (back hair to the nape, volume like classic sprites); the base face must be identical for every hairstyle.

Process:
1. Front designs: 4 edits on the shared bald front (front-designs.png) — user approved all four.
2. Directions: each view is an edit ON that direction's shared bald base (bald-<dir>.png) with the approved front as reference, so hair is pixel-aligned. natural-short and spiky-up generate SE/E/NE/N and mirror W/SW/NW; side-sweep and high-topknot (asymmetric part/cord) generate all seven. 22 edits.
3. Build (tools/rig/build_head_layers_02.mjs): only hair pixels are kept from an edit (cool 4-connected components, minus face-band eye pixels); the face, ears and skin always come from the one shared bald base, plus the head-layers-01 expression overlays. Red cord and filled seams go to an untinted accent layer. Automatic scalp-coverage check (top 30% of the head; back views top 60%, above the ears) must be >= 97% or the build fails (coverage-report.json).
4. Check on the body before delivery: tools/rig/review_head_on_body.mjs (head-on-body-review-a/b.png).

Spend: 24 (fronts) + 132 (directions) = 156 generations; 8 queue-full rejections were resubmitted (not charged). Runtime assets are published into apps/client/public/assets/character-v3/head-layers-01/ (manifest head-layers/2; per-style bases point at the shared base).
