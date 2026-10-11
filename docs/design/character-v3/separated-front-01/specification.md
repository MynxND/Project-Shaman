# V3 separated FRONT IDLE specification and implementation plan

Completed before paid generation. Original standalone art, not a cutout of V2. Native pixel coordinates, integer positions, nearest rendering. Review stage only; no gameplay migration or automatic art approval.

## Component contract

Independent PNG slots: body, head, backHair, frontHair, headgear, outfit, weapon, offhand, accessories. Empty slots are null, never fabricated blank art. Base body has only anatomical body and modest neutral undergarment; no head/scalp/eyes/ears/hair. Head has bald skull, eyes, face, ears, chin; no neck/torso/shoulders/clothing. Two independently generated heads prove swapping.

Scene canvas128x128. Body asset64x64 local. Head asset32x32 local. No sprite scaling in composition. Target ~80px total height, compact ~3-head character, elevated three-quarter overhead FRONT, upper-left light, dark warm outline, restrained skin clusters, no antialiasing. Final landmarks must be measured against actual generated pixels before publication; planned coordinates below are provisional art targets.

| Landmark | Native coordinates | Space |
|---|---|---|
| Body origin |32,60|body local (feet)|
| Foot baseline |y60|body local|
| Neck pivot |32,6|body local, top of neck|
| Head pivot |16,29|head local, chin attachment|
| Hair pivot |16,8|head local|
| Headgear pivot |16,4|head local|
| Left hand |11,30|body local, viewer right corresponds anatomical left in FRONT; measured replacement required|
| Right hand |53,30|body local, measured replacement required|
| Scene foot |64,112|scene native|

Hierarchy: BodyRoot at scene foot -> body image drawn at -bodyOrigin -> NeckAnchor at neckPivot-bodyOrigin -> HeadRoot (independent integer offset and optional quarter-turn pixel rotation) -> backHair/head/frontHair/headgear. Body-attached outfit and hand items remain on BodyRoot. Draw order FRONT: backHair, body, outfit, head, frontHair, headgear, weapon, offhand, accessories. Children inherit head translation, bob and rotation. Body never inherits head transform. No clipping or flattened character fallback. 90-degree rotation support is pixel-exact capability, not a generated direction.

## Implementation sequence

1. Freeze V2 source/runtime/code hashes; save audit.
2. Framework-independent typed rig graph and native transform resolver; behavioral tests prove body invariance and inherited transforms.
3. Phaser renderer with BodyRoot/NeckAnchor/HeadRoot containers, nearest textures, separate image replacement and draw order. Inspector uses this renderer, not a substitute flattened Canvas.
4. Only after this spec/plan: request new generation budget, one original headless body64, two bald heads32, one attempt each, no retry. Live quotes5 each, total15 provisional. Prior88 cap exhausted; do not reuse that authorization.
5. Inspect provider outputs visually. No automatic rescale/face paste. Local registration may translate pixels without scaling; retain raw output and report measured pivots. Reconstruct geometry manually if needed. Reject invalid anatomy rather than fake separation.
6. Inspector A body-only, B head-only, C attached, D independent integer XY/bob, E two heads; show V2 reference read-only, anchors,1x/4x. F hair slot swapping only using existing original hair assets if compatible; strict no-new-hairstyles means no hair generation. If none fits, clearly mark F pending rather than fake art or claim completion.
7. Verify real PNG anatomy and attachment in desktop/mobile portrait/landscape; technical tests and typecheck/build; stop for user visual approval.

## Budget and acceptance

No new paid calls during specification. Missing art or incompatible existing hair blocks full acceptance, even if code compiles. Separate credits, receipts and provenance. No other directions, outfit/weapon generation or frame animation. Head bob is a runtime transform of one static sprite.
