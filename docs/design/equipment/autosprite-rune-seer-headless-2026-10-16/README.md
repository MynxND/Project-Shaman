# AutoSprite Rune Seer — headless, empty-handed walk

User cancels earlier walk-generation workflow and explicitly selects AutoSprite MCP. Before credit use, disclose cost and wait for authorization. Current authorized batch: a new Rune Seer based on user's headless/unarmed eight-direction sheet, eight-direction walk, budget15 credits. Do not queue paid retries or additional actions without asking.

Final input: `user-eight-directions.png`, user-supplied `image-1792163358040.png`. `input-front-unarmed.png` is its first512×512 cell, cropped only without redrawing/resizing. All original costume pixels are preserved in the uploaded cell. User-provided source is already headless and has empty hands. Earlier `source-headless.png` from game still has a staff; its free upload `cmvb4dgz8007mcyqriqncvxgo` is superseded and was never animated. An earlier ImageGen staff-removal experiment was superseded by the user's supplied artwork and is not the animation input.

`character.json` records the final new uploaded character, distinct from the user's older website character with the unwanted generated head. Upload is free. The base input contains no head; do not claim output compliance until generated frames have been inspected.

`generation-request.json` is the exact final call. `generate_isometric_pack` rejects `loop` and `prompt` for built-in walk; these were parameter-validation errors with no returned job. Use `action:custom`, `name:Headless Unarmed Walk`, `loop:true` to submit the explicit headless/unarmed walk instructions. All attempts reused the same idempotency key. Final accepted job receipt reports15 credits used and470 remaining. Do not poll get_account again; use the accepted generation receipt. No automatic paid retry.

Credentials remain only in the Windows user environment AUTOSPRITE_API_KEY. `mcp-client.ps1` reads that variable. Never store credentials or signed asset links in repository metadata. Poll at least30 seconds apart as required by the service. Preserve source atlas/native256 frames, metadata, prompt and receipt when complete. Visual quality and exact costume consistency remain reviewable; this is not live adoption.

## Delivered result

Job succeeded. Eight native256×256 sheets,56 frames per direction (448 total), transparent PNGs and JSON atlases downloaded unchanged. `all-directions.zip` is the service's original eight-direction bundle. `sheets.json` and `job-complete.json` retain identifiers/specs without signed URLs. `preview.html` provides direction selection, playback, pause, stepping, speed and native sheet/ZIP downloads; no head layer is added.

Visual inspection: the right sheet and32 contact samples across all eight directions show neck stumps and empty hands, with no added head or weapon in those inspected images. This is sampled visual verification, not a claim that every generated pixel matches the costume or that the gait is approved. Back-fur silhouette and embroidery may differ from the input and remain reviewable. Original sources are preserved for comparison.

Validation: eight-direction browser playback/step checks, desktop1200×900, portrait390×844 and landscape844×390, no page errors or horizontal overflow; desktop/portrait screenshots inspected. Root typecheck and build passed. No paid retries, no attack/cast generation, no live asset adoption. Generation receipt:15 used,470 remaining; account balance was not polled again.
