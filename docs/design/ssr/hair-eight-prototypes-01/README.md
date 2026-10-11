# Eight new hairstyle FRONT prototypes

User rejected Kid Stripe (“ไม่สวยเลยครับมันเหมือนคุณแค่เอาอะไรมาขีดๆ”) and requested eight hairstyles from the supplied prototype illustration. Kid Stripe is archived with `../kid-stripe-01/rejection.json`, not approved or extended. The earlier user-approved Golden Apprentice remains unchanged.

## Designs

| # | ID | Design and silhouette | Layers |
|---|---|---|---|
|1|plain-short|ผมสั้นธรรมดา — compact short rounded crown, small layered fringe, short temples|front|
|2|medium-part|ผมกลางแสกข้าง — smooth side part, broad diagonal fringe, curved ear-length locks|front|
|3|long-pony|ผมยาวมัดหาง — gathered crown, split fringe, red tie, long ponytail on viewer right|front + back|
|4|round-bun|ผมรวบมวย — gathered crown, compact round bun, curved split fringe|front|
|5|wild-layer|ผมยุ่งเท่ ๆ — angular chunky outward spikes, uneven tousled fringe|front|
|6|eye-sweep|ผมปัดยาวปิดตา — asymmetric diagonal fringe with reversible viewer-left eye occlusion|front|
|7|loose-long|ผมยาวปล่อย — center part, loose layered masses on both sides to upper back|front + back|
|8|ritual-tuft|ผมทรงจุก — gathered crown and upright pointed tied fan, distinct from round bun|front|

`specs.json` records native masks, silhouettes, layering, pivots and dimensions, prepared before generation. The user's new instruction explicitly requests eight prototypes together, superseding the single-style-at-a-time procedure for this sheet only. These are eight hairstyles in FRONT, not eight directions or variants of one style. The other directions still wait for visual review.

User illustration was studied for written hairstyle descriptions only. It was not sent as an AI image input or traced. Only the owned approved Shaman head was used. All new art remains original to this generated sprite set, with no copied sprite pixels from the supplied illustration or Ragnarok.

## Geometry and scope

Native canvas128x128, head neck(62,49), current SSR body and reference skin/brows. One256x192 input sheet contains eight64x96 native crops at original(32,0), four columns/two rows; no resizing. Hair core stays within the existing4px-top/3px-side envelope. Per-design explicit prototype exceptions: tied round bun/tuft use local top masks10/12px above the old hair, and long tails extend to y84. These silhouette exceptions require user review, not automatic production approval. Style6 has its own narrow eye-occlusion mask requested by its reference label; reference face pixels remain intact underneath. Other styles keep protected eyes/ears/jaw unchanged.

One packed inpaint job `c3d4a103-72f5-48dc-a33a-42e1783653a0`, quote9 and actual9 (provider charge and generations_used delta), one attempt, zero retries. `raw.png` preserves the provider image. `ledger.json`, `request.json`, source/mask and tool schemas record provenance. No other paid generation or credit call was made to repair the output.

Canonical hair build extracts ramp/fixed accents; compact pixel cleanup protects exposed skin, restores6 connected skull-edge pixels for the bun and fills12 enclosed nape gaps after trimming the long hair. Cleanup counts are per-style in the manifest; source generations remain preserved. Tail/long hair below the neck becomes independent `hairBack` PNG layers, drawn behind the body. Head/face is never regenerated or flattened into the new hair parts.

## Review and checks

`/characters/v3` and `/characters/ssr` show the new eight-style panel first; rejected Kid Stripe is collapsed as history. Ninety-six native128 preview PNGs (eight styles × three palettes × four modes) use shared `ssrCompose`, actual independent hair parts, frozen headBase.skin and current body.medium-novice. Modes: assembled body, head, hair only, flat hair silhouette; native/4x plus selected-style4x. Hair ramp supports silver, black and gold comparisons. No gameplay part index or selection changed.

Run `node tools/rig/test_hair_eight_prototypes.mjs`. Checks include file hashes, frozen sources, valid ramp indices, non-overlapping fixed/ramp layers, real back layers, exact neck anchors, unchanged protected face outside style6 mask, no enclosed holes and97.2–100% skull coverage. SSR parts deliberately contain only FRONT; the shared full-production validator correctly reports the seven missing direction clips, and the local test asserts exactly those missing clips rather than fabricating them. Technical success is not visual approval.

Typecheck/client build and desktop/mobile browser inspection accompany this delivery. Stop here for visual approval before any directional extension or live integration.
