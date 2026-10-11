# Hair Layer Standard v1 (SSR heads)

Status: **adopted 2026-10-10** after the user reviewed the side-sweep test ("หู คิ้ว ตา ดูซ้อน", "หน้าขาด"). Every new hairstyle, hair colour and facial expression must follow this document. Code: `tools/rig/ssr-hair-standard.mjs` (rules), `tools/rig/pack_head_inpaint.mjs` (generation sheets), `tools/rig/ssr-convert.mjs` (build), `tools/rig/ssr-validate.mjs` (gates), `tools/rig/ssr-head-review.mjs` (review sheet). Architecture background: `docs/design/character-sprite-architecture.md`.

The model follows Ragnarok Online's *technical* convention (one head image per direction, left views mirrored from right views, head attached by anchor). No Ragnarok art is used or sent anywhere.

---

## 1. The one reference head

- **Reference = the user-approved default head** (`head-eight-01`). Its face, eyes, brows, mouth, ears and neck are the only face that exists. No hairstyle, expression or generation may change those pixels.
- **Left views are mirrors of right views** for every head layer: W = flip(E), SW = flip(SE), NW = flip(NE) (`mirrorOf` in the part; layers and anchors flip about the 128 px canvas). Only S, SE, E, NE, N are ever drawn or generated. Asymmetric styles accept the flipped part line in left views (Ragnarok does the same).
- **Neck anchor** of every head layer = the reference head's `neck` for that direction. Head placement on the body is always `offset = body.neck(frame) − head.neck`.

## 2. Layers and draw order

| Layer (bottom → top) | Content | Source | Recolour |
|---|---|---|---|
| `headBase.skin` | reference minus its hair and brows: face, eyes, mouth, ears, neck (no scalp) | reference, once per direction | never |
| `headBase.skin` brow layer | reference brows as hair-ramp steps | reference, once per direction | **hair palette** (brows match the hair, Ragnarok-style) |
| `face.<expression>` | changed feature pixels only (eyes, brows, mouth) | face-locked inpaint on the reference | never |
| `hairFront.<style>` ramp | hair pixels as 8 luminance steps (red = step × 32 + 16) | style generation, filtered by §4 | palette |
| `hairFront.<style>` accent | cords/ornaments (red-dominant), hole fills | style generation / reference skin | never |

Fringe draws over the expression. Long styles later add `hairBack` (behind the body when facing the camera).

## 3. Design rules for a hairstyle (check before generating)

1. Hair fully covers the skull in every direction; back views reach the nape. No scalp visible.
2. **Volume cap** (user-approved 2026-10-10, "head too big for the body"): hair reaches at most **4 px above and 3 px beside** the reference head silhouette. Composed on the idle body the head (hair top to bottom of the skin base) is **≤ 38 % of the character height** (approved look ≈ 37 %) and at most 4 px wider than the front-view body. The generation mask is built inside this envelope and the build trims anything outside it (`volumeTrim`, cut edges re-outlined with the darkest step). Back views additionally keep their nape extension.
3. The fringe may cover forehead and brows **but stops 1 px above the eye line**. Eyes, nose, mouth and cheeks are never covered.
4. Side locks may cover the outer ear edge, never the face interior.
5. Hair colour in the source art is pale silver-white with light-grey shading (colour comes from palettes, §6).
6. Ornaments (cords, pins) must be red-dominant or another non-hair hue so they stay in the untinted accent layer; they sit on hair, never on skin.

## 4. Build rules (automatic, `ssr-hair-standard.mjs`)

Reference analysis: eye line = first pale, neutral, skin-enclosed pixel **in the lower 45 % of the head** (pale fringe tips on the forehead are not eyes). Old hair = cool (r − b < 45) 4-connected masses ≥ 25 px outside the guarded eye rows (skin-enclosed, from 1 row above the eye line down) and not containing an eye white. Cool head-edge outline touching old hair above the eye line is hair too. Old locks hanging into the face band are hair and are removed from the base (left behind they showed as a grey strip under new hair). Stray cool specks with no skin within 3 px are hair. Brows = cool, skin-enclosed, darker pixels above the eye line; they live in their own ramp layer. Eye line = first pale neutral skin-enclosed pixel; face views (S, SE, E, SW, W) fall back to 62 % of the head height so face protection can never switch off.

| Rule | What happens to a generation |
|---|---|
| H1 | Only cool pixels can become hair. |
| H2 | No hair on interior face skin from the brow line (eye line − 1) down. |
| H3 | Fragments < 6 px, and pieces lying wholly at/below the brow band without reaching above it (stray brows, eye lines), are dropped. |
| H4 | Strongly saturated red (r > 140 and r − max(g, b) > 90) touching hair, above the brow band and not on/next to reference skin, becomes accent. Skin tones and brown outlines never qualify. |
| H5 | **Every other generated pixel is discarded** — face, ears, eyes and outlines always come from the reference … |
| H5b | … except inside the style's own generation mask: there the generation is one coherent drawing made against the locked face (fringe, forehead, brows), so its forehead skin is kept — only inside the reference head silhouette and above the eye line (no extra ears/faces possible). Its brows are cool pixels and follow the hair palette. The style therefore owns the brow rows it covers; an expression's brows under a low fringe stay hidden. |
| H7 | Back views: a straight horizontal hair bottom (mask cut, ≥ 4 columns) becomes hanging strand tips 1–5 px onto the back. Stop-gap for sheets generated before the back-view mask rule. |
| H8 | Volume trim: ramp/accent pixels outside the §3.2 envelope (and outside a back view's own mask) are removed; edges re-outlined. |
| H9 | Tone lock: a regenerated view of an existing style is quantile-matched to that direction's reference hair steps, so the style does not look lighter from behind. |
| H6 | Transparent pixels enclosed by the head are filled (neighbouring hair step, else neighbouring reference skin/accent). Old-hair outline that the new style does not cover may stay transparent. |

## 5. Generation procedure (credit-saving, user-gated)

1. **Front design first**: one inpaint on the reference front with the style text; show the user; continue only on approval.
2. **One packed sheet per style**: `node tools/rig/pack_head_inpaint.mjs hair <style> [dirs] [tag]` (e.g. `hair default north,north-east back` = 128 × 64 sheet, 6 generations) → 5 cells (S, SE, E, NE, N) of 64 × 64 native pixels in one 256 × 128 inpaint (≈ 9 generations; 128 × 128 single images cost 6 each). The approved front design is the context reference.
3. **Mask rules** (built by the script): old hair + room for volume + forehead/brows down to 1 px above the eyes; **never** the face interior below the brow line, the space in front of the face profile in SE/E, or anything below the neck anchor in face views. **Back views (N, NE) extend 10 px below the neck** so hair can fall onto the upper back instead of ending in a straight line.
4. Expressions: `pack_head_inpaint.mjs face <expression>` → S, SE, E in one sheet (mask = brows, eyes, mouth only).
5. Always one small sheet, then review, then the next. Never batch several styles without the user's go.

## 6. Colour

`/assets/ssr/palettes.json`: 8-step ramp cuts + hair palettes. `silver` is measured from the reference hair (mean error 5–7 / 255). Other colours are defined in HSL: one hue and saturation each, lightness following the reference hair's own light curve between a per-colour min/max, shadows 10° cooler. **Highlights must stay in the colour's hue — never wash to grey or white** (black tops out at #3d3a50). Recolouring changes ramp pixels only — eyes, skin and accents are untouched.

## 7. Gates — `pnpm rig:convert && pnpm rig:validate` must show none of these

| Code | Meaning |
|---|---|
| `face-lock` | base differs from the reference face (any pixel) |
| `brow-lock` | brow layer is not exactly the reference brows |
| `untinted-hair` | a cool pixel beside the hair that does not follow the hair palette (would stay grey/silver after recolouring) |
| `face-cover` | hair over interior face below the brow line |
| `generated-pixels` | non-hair, non-accent pixels from a generation survived |
| `hair-hole` | enclosed transparent pixel in a composite head |
| `scalp-gap` | > 3 % of the reference skull top not covered by the new hair |
| `ramp-index` / `ramp-overlap` | invalid palette data |
| `head-volume` (warn) | head > 38 % of character height, or > front body width + 4 px |
| `palette-drift` (warn) | silver default hair differs from the reference by > 12/channel per pixel **and** > 8 in mean tone (regenerated views are judged by tone) |
| `pivot-mismatch` | head layers disagree on the neck anchor |
| `mirror-*` | left view not an exact mirror / mirrored data missing |

## 8. Human review (still required)

Run `node tools/rig/ssr-head-review.mjs` (rows: reference, default hair in silver, each style, a style with an expression, default hair in black; columns: 8 directions) and check:
- design and volume per direction match the approved front design;
- fringe length and sweep look natural; no chopped strands;
- no doubled ears, brows, eyes or mouth; expressions read clearly;
- colours look right in at least silver and black;
- then the prototype `/characters/ssr` while walking (head bob, anchors).

## 9. Failure history this standard prevents

| Seen | Cause | Rule |
|---|---|---|
| Cream scalp through hair | hair threshold too tight (silver measures r − b 0–39) | H1 threshold 45; scalp-gap gate |
| Faces differ between styles | generations redraw the face | §1 single reference, H5 |
| "Glasses" / tinted eyes on dark hair | eye whites tinted as hair | palette ramp (§6), face band exclusion |
| Extra face beside the profile (W/SW) | mask offered space in front of the face | §5.3 mask rule, left views mirrored |
| Chopped fringe, 11–51 px holes | over-aggressive cleanup | H6 hole fill, `hair-hole` is an error |
| Doubled ears/brows | generated skin kept | H5 |
| Missing eye in SE | big eye blob read as hair; eye line not found | eye-white component rule, face-view fallback |
| Grey band between new hair and skin | grey brows not recoloured + old temple locks kept in the base | brows on the hair palette, old locks removed (`brow-lock` gate) |
| Grey streaks in black hair | palette highlights lerped toward white | HSL palettes (§6) |
| Silver strip under a recoloured fringe | a fringe tip touching an eye was guarded as "eye" | guard eye rows only; `untinted-hair` gate |
| Red dots beside the eyes | skin tones read as ornament red | strict ornament red (H4) |
| Back hair cut in a straight line | mask stopped at the neck anchor | back-view mask extends 10 px below the neck; H7 tips for old sheets |
| Head too big, body looks small and stocky | unlimited volume (14 px above / 10 px beside) | volume cap §3.2, H8, `head-volume` gate |
| Regenerated back hair paler than the front | new art has its own light curve | H9 tone lock, tone-aware `palette-drift` |
| Odd gaps / doubled brows under the fringe | generated forehead discarded and reference brows shown through the new fringe | H5b: keep the style's own forehead/brows inside its mask |

## 10. What "no new face" means

Re-building layers never calls PixelLab. Faces are never regenerated: the face below the brow line is always the reference pixels (`face-lock` = 0), and the only generated pixels kept are hair, ornaments and — inside the style's own mask, above the eyes — the forehead/brows the style was drawn with (H5b). Spend can be confirmed with the read-only balance check (`generations_used` unchanged).
