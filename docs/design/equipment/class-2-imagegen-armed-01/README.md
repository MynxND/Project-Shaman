# Held-weapon costume animation — six male classes

2026-10-13. User explicitly requests generating weapons together with visibly gripping hands, replacing floating separate weapon attachments for the Indonesia/Japan/Norway draft. This authorizes body+weapon artwork for these six male sets and supersedes the former separate-weapon art requirement for this stage. Original male head remains separate. Female and the published Thai/Russian pair are unchanged.

## Scope and output

Santet/wand, Keris/two daggers, Onmyoji/fan, Miko/gohei, Rune Seer/stone staff and Ullr/bow. Every set contains8 idle views plus8frames ×8facings ×walk/own attack/cast:200 poses per class,1,200 total.24 main imagegen requests (six classes ×four action sheets), plus4 targeted fan-decoration cleanup requests. PixelLab calls/credits:0. Original requests, raw PNGs and cleanup derivatives are retained. No paid PixelLab proof or reroll occurs.

These are generated clothed bodies **with weapon, gripping fingers and arm occlusion already in the same pixels**. Weapons are not pasted onto the final outputs by the exporter. Original item art serves as shape/material reference, rather than a promise of pixel-identical weapon reproduction. Keris carries both blades in all actions; Ullr attack includes bow/string and drawing-hand poses. The head remains independently drawn by the existing V3/SSR path.

Owned reference item hashes are in `inventory.json`. Fan stars/writing inherited from the reference are removed in separate cleanup derivatives, replaced with plain ivory/red edge lines to meet project art constraints. No other item definition or source equipment PNG is overwritten.

## Rendering contract

`OutfitFrame.bakedWeapon` names the exact existing branch weapon ID. The class-outfit parser rejects a mismatched item ID. The frame resolver suppresses separate equipment layers for a baked frame, including the second Keris; it does not merely place another weapon on top. When unequipped or switched to another weapon, selection restores a complete compatible original rig so the previous baked weapon does not remain visible. New weapon classes need their own approved armed art; no automatic recolor/hidden wrong item is claimed.

Optional `manifest-imagegen-armed-draft.json` uses separate `*-armed` texture IDs. It loads only in development with `carryReview=1&outfitDraft=1&outfitBaked=1`. Default gameplay/default manifest is unchanged, and existing class/equipment authority, hitboxes, casts and damage do not change.

The exporter reads actual atlas dimensions, crops cells, and applies the previous body-based canvas registration uniformly per clip. It **does not fit scale to the new weapon bounding box** or shrink different frames independently. Native128 PNGs retain body+weapon pixels together; original source head pixels are composed only for comparison. Exact subpixel/hand/neck preservation by the image generator is not claimed. Raw alpha and edge/canvas clipping flags remain auditable in `export-report.json`.

## Review and validation

http://127.0.0.1:8770/ — before/after motion viewer with frame scrub, all directions and links to actual Phaser armed drafts. The left side reuses the previous separately attached weapon composition; the right side uses the newly generated single body+weapon layer. Original comparison8769 remains available.

`validate_class2_armed.mjs` checks1,200 native/hash/nonblank frames, exact baked-item tags, separate-layer suppression for every frame, unequip/swap fallback, incomplete texture fallback and default-manifest conservation. Real Phaser capture additionally asserts zero visible separate equipment images on all six boards; screenshot evidence/report is under `phaser-evidence/`. Technical success does not certify every generated fingertip, motif or timing transition as visually approved.

Known inherited art limitations: small generated costume/weapon variation and NW torso-facing consistency still need visual review. Canvas-edge flags can refer to weapon tips or detached source fragments and must be inspected before normal-game adoption. Unsupported hurt/death clips remain unsupported. This stage replaces the attachment method in isolated review; it does not silently declare all prior art issues solved or publish new costumes to normal gameplay.

Tools: `tools/rig/{prepare_class2_armed,export_class2_armed,stage_class2_armed,validate_class2_armed}.mjs`; `review.mjs` here. `capture_class2_imagegen_phaser.cjs --armed` records real renderer evidence. Original exported drafts and unrelated temporary files remain intact.

## Completed verification — 2026-10-13

- Export/staging:1,200 frames,24 complete action sheets, no missing jobs. All four Onmyoji cleanup derivatives are used; raw originals remain retained.
- `verification.json`:6 outfits,1,200 hash/dimension/nonblank checks and1,200 separate-layer suppression checks pass. Unequip, unsupported swaps and missing-texture fallback pass; normal gameplay manifest is unchanged.
- `phaser-evidence/report.json`:all6 real Phaser boards load96 costume sprites each, zero separate equipment images and zero page/asset errors. Desktop boards plus portrait/landscape screenshots are retained. These are representative renderer captures, not certification of every temporal transition or physical mobile play.
- Root `pnpm build`, client class-outfit and weapon-carry behavioral checks pass. The build includes TypeScript checks across the workspace.
- Local before/after viewer8770 loads and plays the new sheets; screenshot `phaser-evidence/before-after-review.png` records the comparison.

Visual review still finds detached source fragments in some Keris/Onmyoji poses (including thin fan slivers beside the intended character), plus generated size/pose changes between action sheets. These are image/export polish issues, not a second runtime equipment attachment: the separate-image count is zero. Two canvas-edge flags remain in Keris attack (SE frame5:1 opaque pixel; E frame3:13). Do not mark this batch production-approved or promise perfectly smooth animation until those defects and temporal continuity are resolved. No additional generations were requested for these findings.

## Atlas isolation follow-up — 2026-10-13

The preceding paragraph records the **pre-isolation** findings. `export-report-before-isolation.json` preserves that export. Current export separates source-cell connected components before canvas registration, removing only small components (less than10% of the main component) lying at least4 source pixels outside the main component's bounding box. Low-alpha residue (alpha≤16) is transparent. Connected hands/weapons, nearby details and all retained RGBA values are preserved; no per-frame translation, scaling, drawing or recoloring is added. Original raw image files stay immutable. This is technical atlas extraction, not regenerated character art.

Current result:567 detached components removed across434 frames; all1,200 frames re-exported and re-staged. Onmyoji attack contact-sheet inspection confirms the previously visible neighbour fan slivers are removed. Keris E attack frame3's13-pixel clipping flag is cleared. The SE attack frame5 single-pixel canvas flag remains. `check-armed-atlas-isolation.mjs` checks retention of a connected weapon tip at the canvas boundary and nearby detached details, removal of a remote fragment, and source-buffer immutability. Complete asset/fallback validation passes again.

The viewer adds **เทียบรอยต่อ ยืน → เดิน / โจมตี / ร่าย**:13 representative poses with frame scrub and unchanged world origins, for all8 facings. This is a comparison sequence, not the gameplay action timeline. `phaser-evidence/transition-review.png` records the Onmyoji comparison; viewer loading and controls produce no page errors. Real Phaser captures are refreshed for the cleaned asset revision.

Remaining art dependency: costume thickness, proportions and some neck/body poses differ between independently generated action sheets. Atlas isolation cannot correct anatomy or establish visual approval. No automatic per-frame fitting or runtime crossfade is introduced to conceal those differences. Normal-game publication remains pending. This follow-up uses0 imagegen requests and0 PixelLab credits; original head, female pipeline, gameplay code and default manifest remain unchanged.

## Per-frame head editor and local tracking — 2026-10-13

User authorizes extending the existing web tool. Open **http://127.0.0.1:8770/head-editor** or follow the editor link on the comparison page. All6 male sets,8 facings and idle/walk/attack/cast are selectable. Drag the head, use arrow keys for integer-pixel nudges, or enter ΔX/ΔY. Previous-frame onion skin, grid, neck guide, frame thumbnails, scrub and playback support manual alignment. `[` / `]` changes frames and Space toggles playback while the canvas has focus.

Workflow:align a representative frame → **ตั้งเฟรมนี้เป็นหลัก** → **เสนอจุดคอทั้งท่านี้** → inspect orange proposals → **รับข้อเสนอที่มั่นใจ** or manually correct individual frames → **บันทึกร่าง**. Tracking compares a13×11 local body patch centred on the selected neck, searching±8 native pixels around each target frame's expected neck. It uses mean absolute RGBA difference over reference opaque pixels, not a learned anatomical detector or an installed OpenCV dependency. Fewer than20 reference samples is rejected; similarity below.75 or an alternative-match margin below.015 stays an uncertain proposal. These are tool heuristics, not rig/art technical standards or anatomical accuracy guarantees. Existing confirmed frames are not overwritten; proposals are never saved until accepted. Frames occluded by weapons or substantially changed collars require manual adjustment.

**บันทึกร่าง** writes only `user-head-offsets.json`. **บันทึกและใช้ใน Phaser พรีวิว** additionally updates only `manifest-imagegen-armed-draft.json` neck metadata, retaining a pre-apply manifest in `head-history/`; reload the linked Phaser page to see it. Default gameplay and the published Thai/Russian outfits are unaffected. The offline before/after page's precomposed PNGs are not regenerated by this action; use the head editor or refreshed Phaser for adjusted heads. Head/body/weapon PNG bytes do not change. `stage_class2_armed.mjs` preserves valid saved offsets during restaging; stale source fingerprints/hashes cause rejection rather than silently transferring coordinates to different art.

Edits are integer deltas±24 relative to each exported neck, bound to its body SHA256 and complete export fingerprint. Browser local draft is restored only for matching source data; downloading JSON is also available. Server saves require the exact localhost origin, bounded request size, known frame IDs, unique entries, matching hashes, integer bounds and confirmed statuses. Writes are serialized and use temporary files plus rename. Applying the same packet twice is idempotent; clearing an entry restores its exported neck. No generation, PixelLab credit, gameplay code or female pipeline changes.

Validation:`check-armed-head-editor.mjs` verifies a known synthetic3,-2 patch translation, empty-patch rejection, stale/malformed/hash/proposal guards, idempotent application/reset and preservation of the Thai/Russian entries. `capture-armed-head-editor.cjs` verifies all6 class editors, nudges, seed protection, reload persistence, outgoing save payload, real API origin/stale-data rejection and desktop/portrait/landscape layouts. Synthetic QA offsets are not written into project art. Evidence:`head-editor-evidence/`. This validates the tool, not all1,200 head placements; human alignment is still needed.
