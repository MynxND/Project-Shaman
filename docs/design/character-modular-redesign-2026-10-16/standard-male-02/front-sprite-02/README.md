# Front sprite revision02 — 2026-10-16

User rejected revision01's noisy point-sampled pixels and explicitly authorizes correcting the artwork before layer separation. Approved compact male identity/proportions remain the reference; approval of the new sprite is still pending.

## Visual correction

Two built-in ImageGen calls: new simplified sprite art and registered bald/featureless hidden-head support. Broad contiguous skin shading, simplified hair clusters, quiet chest/abdomen, fewer clothing details. Raw provider outputs are1254×1254 despite the requested1024 enlarged logical128 grid. `build.cjs` recovers128 cells by area voting, then maps to an authored26-color palette with no dithering; final full figure uses23 opaque colors. This is a controlled derivative of low-detail source artwork, not a claim that the provider returned a native128 sprite or perfect global pixel grid. No third-party game sprites were used as generation inputs.

`front.png` is the baseline128×128 derivative. `front-4x.png` is an exact nearest enlargement. Transparent areas are cleared to RGBA0; foreground is binary alpha. Compare revision01 and02 side by side in `review.html`; revision01 remains preserved as rejected history.

## Layers

Draw body → head → face → hair on the same128 canvas/origin. Do not trim each file independently. `manifest.json` records provisional integer neck/foot anchors. `recomposed.png` is byte-identical to prepared `front.png`, not to the old approved high-resolution image. No original01 assets are overwritten or adopted into gameplay.

Hidden skin pixels are inferred from the separately generated support and quantized to the same skin palette. They are not recovered original pixels. Face includes local skin patches around the eyes and mouth; hair is one front-view layer and includes original surrounding contour pixels. A forehead/skin-shadow transition remains visible on the bald preview and deserves art refinement when adding an actual replacement hairstyle. This stage does not claim arbitrary hair/skin-color compatibility, front/back hair separation, eight directions or animation.

## Validation and limits

- Build assertion:0 different RGBA bytes on original-layer reconstruction; SHA256 and palette count recorded in `validation.json`.
- Native-size and4x output, layer contact sheet and desktop browser capture inspected visually. Cleaner broad skin regions and readable eyes replace prior stippled detail; this assessment is not user visual approval.
- Actual Edge: desktop1280×900, portrait390×844 and landscape844×390 load all images without horizontal overflow; all four layer switches exercised. Evidence in `browser-validation.json` and screenshot PNGs.
- Project `pnpm typecheck` and `pnpm build` passed. No live Phaser/runtime modifications, physical-device tests or animation verification.

Exact prompts, raw source PNGs and tool receipt filenames remain in this directory. Rebuild with Node+sharp, then open `review.html`.
