# Six male class outfits — eight-direction static assets

2026-10-13. User requests continuation of the approved Indonesia/Japan/Norway costume designs. Built-in imagegen used in place of PixelLab; female remains paused.

## Delivery

48 transparent128x128 headless idle frames: six reused SOUTH exports,42 new directional exports. Six independent eight-view generation calls, no retries in this stage,0 PixelLab calls/credits. Exact prompts and raw outputs are retained per class. South images are byte-identical to `class-2-imagegen-fit-01/south/*-body.png`; generated duplicate SOUTH cells are retained as raw evidence but not published.

| Country | Class | Eight-view original-head preview |
|---|---|---|
| Indonesia | Santet Master | [Santet](santet/eight-original-head-review-3x.png) |
| Indonesia | Keris Master | [Keris](keris/eight-original-head-review-3x.png) |
| Japan | Onmyoji | [Onmyoji](onmyoji/eight-original-head-review-3x.png) |
| Japan | Male Miko/Shinto Priest | [Miko](miko/eight-original-head-review-3x.png) |
| Norway | Rune Seer | [Rune Seer](rune-seer/eight-original-head-review-3x.png) |
| Norway | Ullr Hunter | [Ullr](ullr-hunter/eight-original-head-review-3x.png) |

Order: S,SE,E,NE / N,NW,W,SW. [All48 views](all-six-eight-original-head-review-2x.png). [Export and contact-candidate report](export-report.json). [Original-source lock](source-lock.json).

Local review: http://127.0.0.1:8768/ — class selector, head visibility, provisional coordinate overlays and before/after body comparison. The page displays static images; it does not imply walk/attack playback or join a game room. Start with `node docs/design/equipment/class-2-imagegen-eight-01/review.mjs`. The server binds localhost only and reads this directory plus the original body-eight-02 PNGs.

## Export contract and limitations

The requested1536x768 output was returned as1774x887 for all six classes. Export reads actual dimensions and splits the4x2 grid using integer floor boundaries; it never assumes provider dimensions. Raw art is retained. Visible alpha bounds, upper neck skin, original source neck and foot bounds guide crop/nearest scaling into128px canvases. No image pixels are manually repainted by the exporter. Provisional neck coordinates and original body origins/head pivots are reported explicitly. The generated anatomy is an approximation, not a protected-pixel reconstruction of the original male body.

Original head PNGs are reused directly without rescaling or redrawing; hashes match the locked manifest. Exposed wrists/hands remain separate candidate measurements. Nearest skin to inherited left/right hand targets is a diagnostic, **not a verified fist center, occlusion rule or equipment anchor**. Far hands can overlap or be hidden; final carry fitting must use actual item art and renderer evidence. No weapon illustration is baked into these body images. Ullr quiver/cape and Keris belt accessories are costume decoration, not a new equipment feature.

Visual inspection: all eight front/profile/back headings are present for every class and heads join in the original canvas. Rear art has its own straps/panels rather than front clasps repeated on the back. Pixel finish, trim consistency, exact asymmetric accessory placement, weapon contact and temporal behavior still require finishing/review. Native downscaling reduces fine generated ornament; do not call it final premium pixel polish. Concept-sheet approval does not automatically approve these new directions.

## Status and verification

-48 native128 RGBA bodies and48 original-head previews exported; six SOUTH bytes preserved.
- Original eight body/head hashes checked during export; no source files, female files, runtime code or live class manifest changed.
- No crop-cell edge warnings. All crops and composite placements stay inside128px.
- Export/preparation/review scripts pass syntax checks. HTTP review returns200 and the in-app browser loads all six class options and eight direction images.
- This is offline static coverage only. No walk, attack, cast, hurt or death frames are claimed. Existing Thai/Russian production and complete-set gameplay fallback remain unchanged.

Next work: finish native pixels and authored main/off-hand contacts against real equipment, then actual walk/own-weapon attack/cast motion sets. Keris must preserve the existing baked-blade attack exception; Ullr needs bow/two-hand clearance. No animation should be fabricated from repeated static frames, mirrored asymmetric decorations or original novice outfits. The six new sets are not registered as complete runtime outfits.

Tools: `tools/rig/prepare_class2_imagegen_eight.mjs`, `tools/rig/export_class2_imagegen_eight.mjs`. This stage adds6 built-in calls; cumulative concept/fitting/directional work adds9 built-in calls and0 PixelLab credits. Built-in calls are not PixelLab generation units or a financial cost estimate.
