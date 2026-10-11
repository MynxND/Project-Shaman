# Separated V3 FRONT IDLE review

## What changed

New independent original PixelLab body64 and two bald heads32. Body is not cropped from V2; runtime PNGs match each new raw generation byte for byte. No flattened full character is used by the renderer. The assembled PNGs in this evidence directory are diagnostics only, never runtime assets.

Audit and specification were written before renderer edits and before paid calls. User explicitly approved the new15-credit/3-attempt/no-retry stage after the specification. Actual completion receipts charge5+5+5=15; reservations0; retries0. See ledger.json and each result.json. Previous88/88 ledger remains unchanged.

## Actual rig and measured coordinates

Phaser nested display objects: BodyRoot -> NeckAnchor -> HeadRoot -> independent head/backHair/frontHair/headgear nodes. Body, outfit and hand-attached components have independent nodes on BodyRoot. Empty component slots have no fabricated images. FRONT attachment is native coordinates, not CSS placement; CSS only chooses display magnification. Quarter-turn rotation is pixel-exact support, not new facing art. Runtime bob rounds to native pixels and cleans up with the scene.

Scene foot64,112. Body local origin32,61, neck32,17 (scene64,68). Head A local chin pivot16,27; B16,28. Body opaque bounds16..47 /16..61; head A4..27 /4..27; B4..27 /4..28. Head shapes24px wide,24/25px tall. Composed figure ~68px tall, approximately2.8 head heights. Front left/right hands are anatomical left46,36 and right17,37; visual candidate landmarks, not approved skeleton data. Hair16,8; headgear16,4; foot baseline61. These measured values supersede provisional targets in the initial specification.

## Visual observations and tests

Body image shows intact short neck socket, shoulders, torso, arms, undergarment shorts and legs; no skull, scalp, face or ears. Both separate head images show bald skull, face and ears only; no neck, shoulders, torso or clothes. Warm skin palette, one-pixel cluster size and upper-left shading are coherent; the neck join is inspectable at1x/4x. Heads A/B differ subtly in brows, eyes and jaw. These are candidate observations, not user approval.

Inspector `/characters/v3` uses the actual Phaser hierarchy with these independent textures. A body only, B head only, C attachment, D moving head and E replacement are demonstrated. D offset12,-8 produces HeadRoot76,60 while BodyRoot64,112 and neck64,68 stay fixed. Native desktop screenshot proves visible separation; additional4x, replacement, bob and mobile evidence are saved here. The body-only draw and body coordinates do not change on head selection. Pixel positions round to integers; no interpolation or clipping masks.

F is explicitly pending: current strict scope prohibits hairstyle generation and no old hairstyle is approved to fit the new24px head. Hair replacement slots and inheritance exist, but no hair PNGs were added and no visual hair-swap pass is claimed. Headgear/outfits/weapons/offhand/accessories also remain empty. No other directions, walking/combat frames or gameplay migration.

Behavior tests verify216 head transforms without body/neck movement, distinct real head files, exact original PNG usage, invalid manifest rejection, all frozen V2/runtime/component file hashes and15/15 budget. Typecheck and client production build pass. Technical tests do not grant visual acceptance.

Stop at this FRONT rig for user visual approval; do not create more art automatically.

Mobile checks: portrait390x844 and landscape844x390 keep page scroll width within viewport;4x images scroll inside their own preview. Four Phaser preview canvases remain mounted across viewport changes. Live provider balance after stage is22 generations remaining; actual stage charges are15, independently recorded in three completion receipts. Visual art acceptance is still pending.
