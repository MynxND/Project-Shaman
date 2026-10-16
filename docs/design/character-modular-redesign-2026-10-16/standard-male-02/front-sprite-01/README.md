# Front sprite layers — 2026-10-16

User approved the compact standard-male-02 proportions and authorized front-sprite preparation and head/face/hair/body separation. This is an offline art deliverable; gameplay is unchanged.

## Files and composition

All four transparent PNG layers use the same128×128 canvas, no trimming or per-layer scaling. Draw in order `body.png`, `head.png`, `face.png`, `hair.png` at the same origin. `front.png` is the prepared baseline; `recomposed.png` is the actual layer composition. Character occupies43×112 pixels within that canvas. `manifest.json` records crop, alpha threshold, nearest sampling, integer neck/foot anchors and RGBA hash.

Original1024×1536 artwork remains intact one directory above. Conversion removes low-alpha background/halo with threshold200 and samples nearest; the native128 result is a resampled sprite study, not hand-polished native pixel artwork. Reconstruction equality is against this prepared baseline, not the full-resolution source.

## Hidden base and provenance

Original visible pixels are retained. Head base gains hidden scalp and face-support pixels from `../hidden-head-source.png`, a separate built-in ImageGen edit. Its full request is `../hidden-head-prompt.txt` and receipt `../hidden-head-receipt.json`. Only registered hidden regions enter the head layer; the generated body never replaces the approved body. These additions are inferred anatomy, not original recovered pixels. The source silhouette is kept fixed so original hair and face cover them exactly.

Hair is one front-view layer. Face includes local skin patches around eyes/brows/mouth; it is not yet skin-palette-independent. Neck boundary is at the chin/upper-neck; body retains visible neck and shoulders. New hairstyle silhouette and face swaps still need art review; no new alternatives or other directions were made. This is not a complete eight-direction custom-character rig.

## Verification

- Build script exits with an error unless recomposed RGBA equals prepared baseline byte for byte:0 different bytes.
- `pnpm typecheck` and `pnpm build` passed after resuming with filesystem access.
- Actual headless Edge loaded all five image elements at128px source size. Desktop1280×800, portrait390×844, landscape844×390 had no horizontal overflow; hair checkbox correctly hides its layer. Captures are adjacent PNGs. Desktop screenshot and layer contact sheet were visually inspected.
- Physical devices, live Phaser integration, animation and new custom variants are unverified/outside this stage.

Open `review.html` for side-by-side baseline and interactive layer composition. `layer-review.png` order: baseline / body / head / face / hair / recomposed.
