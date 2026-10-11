# Layered V3 head: hairstyles, hair colours, expressions (head-layers-01)

User request (2026-10-10): many hairstyles and changeable facial expressions, customizable at character creation. Approved scope: 4 short hairstyles first, 6 expressions (neutral, smile, angry, sad, surprised, eyes closed), used both at creation and as in-game emotes. A user-shown third-party hair sheet was a structural reference only and was not sent to any provider.

Layers (all 128 canvases on one per-direction neck pivot; runtime order): bald base -> expression overlay -> hair (multiply tint). Short styles need no hair-back layer; long styles (shoulder-length, braids...) will add one later.

Generation (PixelLab, actual 130 generations vs ~110 estimated; ledger.json):
- bald base: edit of approved head-eight-01 S (hair removed, face kept), rotated to 8 views; W/SW/NW published as mirrors of E/SE/NE so mirrored faces align exactly.
- hair: 4 edits on the bald S (pale silver so any colour can be tinted), each rotated to 8 views. Hair is extracted by colour (cool pixels r-b<25 in components >= 20 px, plus the topknot's red cord) and aligned onto the base by a silhouette-fit search; hair below the neck pivot is clipped.
- faces: 5 expression edits each on bald S, SE, E (15); overlays are the changed pixels inside the face band; W/SW are mirrors. Back views have no face.

Runtime: shared `head-appearance.ts` (catalog, 8 hair colour tints, encode/sanitize), `PlayerState.head` ("hair.color.face", validated on join, via travel tickets and the `head` message) and `PlayerState.emote` (server clears after EMOTE_MS). `V3Puppet` draws the three layers, tints hair, and blinks neutral faces. Appearance window: V key or the button in the character window; remembered per browser (localStorage) and sent to the server when connected.

Tools: tools/rig/build_head_layers.mjs, review_head_layers.mjs (layers-review.png), test_head_layers.mjs, poll_head_jobs.ps1, rotate_head_jobs.ps1.
Known limits: the women's rig is unchanged; no hair-back layer yet; some spiky/topknot views show a little scalp through gaps where the source rotation did.

## Fix 2026-10-10 (user review: cream scalp showing, unbalanced side views)
- Cause 1: hair threshold r-b<25 dropped silver hair pixels measuring 25-39, leaving holes onto one shared bald scalp, and each style rotation has its own skull shape. Now r-b<45, and every hairstyle gets its own base (bald face below the brow line, that style's own skull/skin above it). Source-rotation eyes and the face-band eye pixels are kept out of the tinted hair (they read as glasses on dark tints).
- Cause 2: the pivot came from the bald head's bottom edge. It is now fitted so each base face lands exactly where the user-approved head-eight-01 face sits (keeps the approved 3 px E/W balance).
- Check before delivery: tools/rig/review_head_on_body.mjs renders approved head vs every style on idle and walk frames in all 8 directions (head-on-body-review.png). Manifest is now head-layers/2.
