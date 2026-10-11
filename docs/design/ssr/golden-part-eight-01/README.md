# Golden Apprentice — eight static directions

Original compact soft side-part. User accepted the FRONT design with “ทรงนี้ผมโอเคครับเริ่มเลย”. `front-approval.json` records its frozen source hashes. This accepts FRONT only; the eight-view candidate still waits for visual approval. No gameplay selection or production SSR index was changed.

## Art and attachment

`prepare_golden_eight.mjs` packs only the four remaining right/back views into a native128×128 sheet of64×64 crops (x32,y0 of the original128 canvas, never scaled). Context is the approved silver FRONT and the four target cells, all original Project Shaman assets. No Ragnarok sprite was downloaded, traced or supplied to generation.

FRONT hair ramp/fixed pixels are reused exactly. SE/E/NE/N use one inpaint. SW/W/NW are exact mirrors through SSR `mirrorOf`, including neck anchors. A flipped part line is intentional under Hair Layer Standard v1; `asymmetric:false` permits this convention, not a claim that the drawn part is geometrically symmetric.

Canonical `ssr-hair-standard.mjs` builds the hair ramp and forehead/hole-fill layer; generated face pixels outside the mask are discarded, the existing `headBase.skin` and brow ramp stay frozen. Mask limits4px top/3px sides, protects face interior below the brow line and the space in front of a profile. Rear mask permits nape tips up to10px below the neck. Build filled7 enclosed pixels total across the four new views. No new art attempt or automatic retry.

Runtime candidate: `apps/client/public/assets/ssr/candidates/golden-part-eight-01/part.json`. Five source directions with ten independent PNG layers resolve to eight views. Ninety-six preview PNGs (three palettes × eight directions × body/head/before/silhouette) are composed by the shared `ssrCompose` using current `body.medium-novice` and its native neck anchors. Previews are inspection artifacts; the SSR part uses independent layers, never flattened previews as rig inputs.

## Credits and evidence

Live quote6. One job `c0a20837-6417-4e5e-81f3-b1660985620a`, charged6. `ledger.json` reports the actual provider `generations_used` delta; one attempt, zero retries. This is6 additional credits after the earlier FRONT's5 (style total11).

`validation.json` covers all8 directions: face-cover0, foreign generated pixels0, enclosed holes0, protected face changes0; skull coverage98.6–100%. Exact FRONT reuse, fixed source hashes, mirrored pixels/anchors, valid8-step ramps, image hashes and native sizes checked. Technical success is not visual approval.

Inspector `/characters/v3` and `/characters/ssr`: new review first; palette gold/silver/black, native/4x, head/body/before/silhouette. Historical approved FRONT panel retained. No new walking/combat art or other hairstyle was generated.

Validation commands: `node tools/rig/test_golden_eight.mjs`, `pnpm typecheck`, `pnpm --filter @shaman/client build`. Existing global SSR validator's unrelated body anchor-jump errors remain outside this candidate task.

Stop here for visual review of the additional views before production publication.

## Golden Apprentice eight directions — USER APPROVED 2026-10-10
User reviewed the V3 Inspector and replied “ผ่านครับ”. All eight static views are visually approved. Exact part/image hashes and the user's statement are recorded in docs/design/ssr/golden-part-eight-01/approval.json (runtime copy beside part.json). Manifest and Inspector now reflect approval; publisher refuses overwriting this approved version. No extra PixelLab credits, new assets, animations or live selection changes in this approval step.