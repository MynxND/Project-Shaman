# Six male class outfits — SOUTH fitting assets

2026-10-13. User authorizes fitting the approved six-class concept sheet to the original male base using built-in imagegen instead of PixelLab. Female untouched. No gameplay/runtime changes.

## Delivered

- Six separate headless transparent128x128 SOUTH body candidates in `south/`, plus six previews reusing the byte-identical original head image.
- [Original-head comparison4x](south-original-head-review-4x.png): top Santet/Onmyoji/Rune Seer; bottom Keris/male Miko/Ullr.
- Exact original body reference grid and [source lock](source-lock.json), two retained raw generations, exact prompts and [export measurements](fit-report.json).
- Preparation/export scripts: `tools/rig/prepare_class2_imagegen_fit.mjs`, `tools/rig/export_class2_imagegen_fit.mjs`.

Built-in imagegen calls:2 (initial fitting plus targeted alpha/placement correction). PixelLab calls/credits:0. Both outputs contain real alpha: raw01 has1,260,702 fully transparent pixels; raw02 has958,090 out of1,572,864. Dark gradients visible in the tool preview were not reliable evidence of an opaque background. Raw01 was selected for its closer source scale; raw02 is retained as an unused larger derivative.

## Export and honest limits

The generator did not preserve exact requested source coordinates. Crop/nearest scaling exports each headless body to66px height from row47 to112, with the neck-stump centroid aligned to x62. These coordinates come from the original128px SOUTH source, not a new runtime capability. This is static costume fitting, not a protected-pixel reconstruction: exposed generated arms/hands and costume anatomy approximate the source and need grip fitting. Foot shapes can differ although the export baseline is shared. Original body/head files remain untouched. Original head is composed directly without redrawing or rescaling.

The approved clothing design remains the target. Fine generated ornament loses detail on128px export; manual pixel finishing and a material/outline review remain necessary. No face generated in this stage. No held weapons are baked into these body candidates. The quiver is costume decoration, not a new weapon slot.

Coverage: SOUTH idle candidate only,6 classes. Seven other directions, walk, own-weapon attack and cast are not produced in this directory. Hand anchors are not verified; no new manifest is published to the game. Existing complete-set runtime fallback is untouched. Do not register these static files as complete class outfits or fabricate animation by repeating a still. Hurt/death remain unsupported native clips.

Next asset work: finish native128 pixels/contact points, author the remaining facings from each fitted costume, then real motion coverage using original head/weapon attachments. Concept approval is already recorded; this fitting stage has not independently received visual approval. No additional PixelLab spend is authorized or needed for this deliverable.
