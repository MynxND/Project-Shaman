# Original V2 FRONT Head-Fit Review

Controlling request: use original approved neutral-male-02, not V3. Exactly three
FRONT manual drafts: Classic Adventurer, Thai Shaman Apprentice, Ritual Topknot.
All previous hair is retained and unselectable. No red bow, borrowed hair pixels,
provider-skin cleanup, outfit, animation, other hair direction or live migration.

## Actual Measurement

Original body SHA-256: 0ed1ddf448b70a93dc5f624617e832a0af593779b6b7257d65db39b61be35958.
Native128, SOUTH pose neutral-male-02-idle-south, origin61,112, timeline[null].
Visible scalp270 pixels, y20..31; actual alpha spans9..27 pixels wide, x49..75.
Head alpha including ears reaches31 pixels wide. Semantic scalp/eye/ear/neck
annotations are manual, conservative and provisional, not approved anatomy.
The alpha rows themselves are measured facts. No hidden anatomy is claimed.

All three are authored as integer scanlines inside the same measured template.
Working-on-template PNGs show the actual body plus authored hair; transparent
extraction is the authored hair buffer only, not a skin-removal operation.
The six runtime PNGs are full128, byte-identical to their source PNGs.
Layer order stays hairBack/body/outfit/hairFront; all body4 records and files exact.

## Active Files

- classic-adventurer-01-hair-front.png and classic-adventurer-01-hair-back.png
- thai-shaman-apprentice-02-hair-front.png and thai-shaman-apprentice-02-hair-back.png
- ritual-topknot-03-hair-front.png and ritual-topknot-03-hair-back.png
- Each *-rows.json is the original manual scanline source, with palette and template.
- row-comparison-native.png: body bare, then the three composites, equal native size.
- row-comparison-nearest4x.png: exact nearest4x of that native sheet.
- row-heads-nearest4x.png: diagnostic crops only; game assets are never resized.
- head-template.json, scalp-mask.png, protected-mask.png: shared fit/protection evidence.
- review.json: active row-based review. fit-review.json belongs to a separate
  concurrent preliminary draft, preserved with its PNGs, not the active selection.
- publication-before.json and publication-preserved-hashes.json conserve that draft.

## Technical Checks And Art Limits

All styles: scalp gaps0, protected face/ear/neck mismatch0, skin/red/hiddenRGB0,
source-body pixel copies0, binary alpha. Front counts373/397/376; rear550/683/540.
Forehead-only occlusion27/21/0 pixels; short crown3px above scalp, topknot6px.
Medium rear endsy49: no chest/waist cape. Genuine rear art is nonempty and visible.
Compact bounds are technical fit constraints, NOT aesthetic approval.

Three distinct manual silhouettes remain DRAFTS. Short highlights still look
somewhat geometric; medium tie is mostly occluded by the FRONT head and its
traditional-fantasy identity is understated; topknot shading can read like a cap.
No professional-quality or USER visual approval is claimed. Hair/full milestone,
production readiness, further direction and animation gates all remain false.

## PixelLab Cost Gate

Actual tools/list schemas inspected: get_pro_flash_capabilities (readOnlyHinttrue),
inpaint_image_pro_flash, create_image_pro_flash. Schema inspection preceded two
free capability calls (general and inpaint128 quote). Live quote: image6, total6,
provisionaltrue. Three new attempts would estimate18 new credits, NOT authorized.
One attempt per style is a count limit, not a numerical credit approval.
Paid cap20/spent20/remaining0 and ledger bytes stay unchanged. Generation attempts0,
paid submissions0, actual credits0. These assets are MANUAL, not PixelLab generated.
Actual schema/quote/receipt JSONs are in this folder; no credentials recorded.

## Browser And Verification

/characters/v2 loads the real verified runtime PNGs. Thai selector has exactly3
FRONT choices. Bare, hair-only, composite, native before/after, head4x and separate
guide overlay reuse those same images. Side/back hair fails closed, no fallback.
45 actual style/view/viewport cases at1280x900,390x844,844x390: nonblank, native
pixel mismatch0, SHA mismatch0, horizontal overflow0. Additional12 cases verify
hair-off body equality0, absent directions, and center/scalp/baseline guide pixels.
Guide toggles change0 clean pixels. Nearest filtering is disabled on all canvases.

row-browser-*-head.png and row-browser-head-detail.png are actual captures.
Host capture reflows/clips desktop/portrait and partly clips landscape: NOT
responsive screenshot sign-off or real-device evidence. Native source sheets are
primary visual evidence. Screenshots were inspected; limitations are disclosed.

Focused row replay/provenance tests, V2 publication/history regressions and workspace
build passed. See tools/rig/character_v2_front01_rows_verify.test.mjs. Stop at these
three FRONT drafts for USER review; no further generation or gameplay adoption.