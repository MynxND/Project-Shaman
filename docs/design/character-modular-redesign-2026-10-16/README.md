# Modular character redesign — 2026-10-16

Status: visual design proposal requested by the user. No gameplay assets or renderer replaced. Male first proof; female adaptation and production animation are not delivered by this study.

## Request and references

User wants a redesigned main character with easily swappable hair and faces, because current separate heads do not visually match generated class costumes. The attached `R1-walk-trimmed.png` was inspected for proportions and head/body coherence only; ownership is unspecified and it was NOT supplied to ImageGen. The owned `../comfyui/reference/shamen-base-sheet.webp` is the actual generator reference and identity source. Do not copy the attachment's knight costume into the shaman design.

## Evidence from current implementation

`apps/client/src/game/characters/V3Puppet.ts` already composes separate head/face/hair or SSR parts. Costume rendering uses per-frame costume neck coordinates and per-direction headOffset, then draws the idle SSR head at a translated neck. This supports placement but does not itself reconcile generated costume perspective, cranial scale, neck anatomy, lighting or pixel treatment. The fallback head-layer base is selected by hairstyle, which also deserves review before making skull geometry independent of hair. These are code observations and design risks, not proof that every current frame is defective.

## Proposed visual contract

- One approved anatomical master per body type, with a single scalp/jaw/ear silhouette per facing. Approximate study target: 4.5 heads tall including hair; final native measurements must be authored after visual review.
- The face controls permanent eyes/brows/mouth appearance; expressions are a separate overlay/state. Swapping a face or hair must preserve skull, ear, chin and neck anchors.
- Hair uses back and front layers, plus optional untinted ornaments; long hair needs explicit body/collar overlap. No skin, ears or face baked into hair parts.
- Define neck ownership once: proposal gives head base a short neck stub and the body a receiving shoulder/collar socket. Specify overlap mask and front collar per facing. Never paint duplicate necks into both halves.
- Shared camera, upper-left light, outline palette, skin ramp and native pixel density for body and head. No per-frame bounding-box normalization or arbitrary head resizing to hide mismatch.
- Every costume is drawn against the same master anatomy, initially with the full approved head visible as a guide; export headless only after overlay verification. Reuse the exact head pixels in the compositor rather than redrawing identity for each outfit.
- Each motion frame declares facing, neck anchor, foot origin and necessary collar/hair occlusion. Real head turns require a matching authored facing; translating an idle head cannot fix body yaw drift.

## Concrete first study

One ImageGen board: male apprentice front / three-quarter / profile; illustrative part breakdown; three hairstyles; three facial variants; same head on apprentice, Thai occult master and northern coat. This is concept artwork, not an aligned modular atlas or runtime-ready sprites. Prompt is preserved verbatim in `prompt.txt`; generation metadata in `generation-receipt.json` when output is available.

## Production validation still required

Extracting actual separate layers, native-size pixel cleanup, integer anchors and masks, all eight facings, walk/attack/cast contact review, costume compatibility, actual Phaser swapping and desktop/mobile review remain unimplemented. The conceptual layer diagram does not establish pixel-exact separation. A small proof should exercise three hairstyles × three faces × three costumes at identical head scale, first on idle front/three-quarter/profile and then a short walk with collar and long-hair stress cases before expanding the catalogue.
