# Seven additional headless AutoSprite walks — 2026-10-16

User approved 105 credits (7 × 15) before submission. All seven jobs completed; final receipt reports 350 credits remaining. No paid retries were submitted. Rune Seer's existing headless generation is reused as the eighth preview class.

The supplied PNGs are copied unchanged into each class folder with SHA-256 provenance in plan.json. Requests and sanitized receipts are retained. User-level environment configuration supplies authentication; no credentials belong here. Native transparent 256px spritesheets, atlases and ZIPs are retained. Each class has eight directions and 56 original frames per direction.

Run prepare-preview.cjs with Sharp available to rebuild the main preview at artifacts/headless-outfits-2026-10-16/preview.html. The existing main integration prepare.cjs also invokes it. The 128px compositing preview uses nearest sampling and a fixed scale/translation for each direction; no limbs are reconstructed. Per-frame exposed neck measurements support optional original-system head overlays and saved fits. Original native ZIP downloads preserve source detail.

The default clip is a candidate full cycle selected from the 56 source frames using pose similarity and seam discontinuity. Full source playback and a last/first toggle remain available. Pixel scores do not prove natural motion or constitute user visual approval. Loop-export-report.json records every selected range and score. Hair/face/head fitting remains experimental and is not adopted into live gameplay.

Visual issue found: Miko has an unwanted weapon-like diagonal object behind the body in sampled directions, despite the explicit unarmed prompt. It is labelled as not passing in the main preview. Do not present all seven outputs as approved or spend additional credits to retry without user authorization. Other samples retain headless outfit silhouettes; full artistic approval remains pending.

Validation: root pnpm typecheck and pnpm build passed. Browser and regression results are recorded in check-report.json and the integration check reports. Screenshots/contact sheets are review evidence, not approval.
