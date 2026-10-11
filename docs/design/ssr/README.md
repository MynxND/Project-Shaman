# Shaman Sprite Rig (SSR) — Phase 1

Phase 1 of docs/design/character-sprite-architecture.md: shared contract, validator, converter and a validation report of today's assets. **No PixelLab generation; the running game is unchanged.**

| File | Purpose |
|---|---|
| `packages/shared/src/sprite-rig.ts` | Contract: 8 directions (0 = south, clockwise), fixed action table (idle 1, walk 8, attack 8 + `hit` event, cast 12), clip id = action×8+direction, part kinds and required anchors, `offset = parentAnchor − childAnchor`, static head parts, mirroring rules, `validateSsrPart` |
| `packages/shared/scripts/sprite-rig-test.mjs` | Unit tests on synthetic data (part of `pnpm --filter @shaman/shared test`) |
| `tools/rig/ssr-convert.mjs` (`pnpm rig:convert`) | Converts existing original V3 assets to `parts/*.json`; slices the head-layers-03 test sheets into layer PNGs in `assets/` |
| `tools/rig/ssr-validate.mjs` (`pnpm rig:validate`, `--strict` to fail on errors) | Contract checks + pixel checks; writes `validation-report.md/json` |

Converted parts: `body.medium-novice` (232 frames), `headBase.default` (approved head), `headBase.default-cleared` + `hairFront.side-sweep` (face-locked test), `face.cold|sad|closed`.

## What the first report shows (existing assets, anchors copied as-is)
- **3 errors: neck anchor jumps** — walk W loop 8 px (frame 7→0), attack N 5 px, attack SE 5 px; plus 10 warnings of 3–4 px. These are the head "jumps" seen in game; they come from measuring the neck from generated pixels.
- Feet are on the ground origin in every frame (ground lock works); no missing clips or frames; all files match their hashes.
- **Face lock holds:** 0 approved-face pixels changed in all 8 directions for the face-locked test.
- Zone overlap (3 warnings): the side-sweep fringe zone and the expression zone share the brow rows in S/SE/E → draw order between fringe and expression must be a rule (proposal: fringe over expression).
- Hair holes (2 warnings): a few old-hair pixels are not redrawn by the side-sweep test; would show as see-through.
- Attack has no `hit` event frame yet (8 warnings) — timing is still implicit.
- Runtime scale 0.608 is non-integer (1 warning).

## Verified automatically vs needs eyes
Automatic: clip/frame completeness, anchor presence/range/stability, ground contact, file hashes, face lock (byte equality), zone containment and overlap, holes, mirror rules, events, scale. Needs a person: whether anchor positions look natural, motion quality, design and colour.

## Next (Phase 2, needs approval)
`/characters/ssr` prototype: generic composer from these parts, an anchor editor to fix the flagged neck jumps by hand (saved into the part JSON), face-locked head with default face + side-sweep + expressions.

## Phase 2 — prototype (2026-10-10)
- Route `/characters/ssr` (`SsrPrototype.tsx`): one generic composer (`ssrCompose` in shared, also used by `tools/rig/ssr-render.mjs`) draws the converted parts with Canvas 2D at integer scale 1–4x; action / direction / play-step / head set (default, face-locked side-sweep) / face (neutral, cold, sad, closed) / blink / anchor guides.
- Anchor editor: nudge the body neck per frame, copy the previous frame's value, reset; saved through the dev-only route `app/api/ssr/anchors` into `docs/design/ssr/anchor-overrides.json` (404 outside `next dev`). `pnpm rig:convert` folds the overrides back into the parts; `pnpm rig:validate` re-checks.
- Draw order is data (`ssrDrawOrder`): fringe (hairFront) over expression (face); hairBack behind the body when facing the camera.
- Live checks in the page use the same `validateSsrPart` as the CLI (data checks; pixel checks stay in the CLI).
- Parts and sliced layers are published under `/assets/ssr/` (prototype only; the game does not load them).
Not done yet (Phase 3): palette-ramp hair colour, more hairstyles, swapping the game's V3Puppet to SSR.

## Phase 3 — palette-ramp hair colour (2026-10-10)
- `ssr-convert` splits every hair layer into a **ramp** layer (red channel = 8-step luminance index, `palette: 'hair'`) and a **fixed** layer (skin, brows, cord — never recoloured). The approved default hair is now its own recolourable part (`hairFront.default` over `headBase.default-cleared`).
- `/assets/ssr/palettes.json`: luminance cuts + 8 hair palettes. **silver = measured from the approved default hair** (mean error vs the original 5.2–7.0 per channel out of 255); black, brown, gold, red, teal, blue, white share the same light curve.
- Shared: `SsrLayer.palette`, `SSR_HAIR_PALETTES`, `ssrRampIndex`; the prototype bakes a palette per layer on a canvas (cached); `tools/rig/ssr-render.mjs <out> colors` renders all colours offline.
- Validator: ramp index validity, ramp/fixed overlap, silver drift vs approved hair.
- Replaces the old multiply tint: eyes, skin and the cord are not touched by hair colour any more.
Phase 4 done 2026-10-10 (see the end of this file): the game draws V3 heads through the SSR composer, legacy switch kept.

## Fix 2026-10-10 — side views (user: "หน้ายังซ้อน / หน้าขาด"), no credits
- Cause: the side-sweep W/SW generations drew an extra face where the fringe should be; an earlier clean-up rule then left 11–51 px holes in every face view and chopped the fringe (the validator warned, but holes were only a warning).
- Ragnarok convention adopted: **W/SW/NW head layers are mirrors of E/SE/NE** (`mirrorOf`; shared `ssrPartFrame` flips layers and anchors). Approved heads overlap 95–98 % with their flipped opposite. The original approved head stays available as the reference part.
- A head is one complete image: the converter fills every uncovered pixel of the reference silhouette (skin from the reference, old-hair spots continue the neighbouring hair ramp); non-hair pixels drawn by a generation are replaced by the reference face.
- Validator: `hair-hole` is now an **error**; face-lock and holes are checked per hairstyle and direction, mirror-aware. Result: face lock 0 px and holes 0 px in all 8 directions for every style; remaining errors are the 3 body neck jumps.

## Phase 4 (2026-10-10, user: "ทำ phase 4 เลย")
Game V3 heads now draw through the shared `ssrCompose` (apps/client/src/game/characters/SsrHead.ts): SSR skin base + expression part + palette-recoloured hair, mirrored left views and SSR body neck anchors (anchor overrides baked by `rig:convert`). Body sprite/animations, server and protocol unchanged except the shared expression list gains `cold`. Hairstyles without SSR parts (spiky-up, high-topknot) and the switch `?rig=legacy` / localStorage `shaman.rig=legacy` use the head-layers-01 head. Appearance window (V) previews with the same parts (ssr-canvas.ts) and lists only SSR styles (natural-short, side-sweep) and faces (neutral, cold, sad; closed = blink/emote). Back views regenerated (12 credits, approved) and volume cap/tone lock added to the hair standard. Remaining: 3 neck anchor jumps (walk W, attack N/SE) to fix in /characters/ssr; female characters still use the previous rig.
- Phase 4 gate check 2026-10-10: full `pnpm test` passes (network, NPC, skill, zone/combat, equipment). Neck anchors match the measured neck in every frame; attack/cast jumps are real lunges and are now warnings (one-shot actions). Remaining error: walk W frames 7->0 bob 7 px in the body art itself (E bobs 4 px) — needs an art decision.
