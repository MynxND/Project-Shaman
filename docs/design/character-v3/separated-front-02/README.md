# V3 identity-preserving whole-head FRONT candidate

USER correction: body like a headless character component; head like a complete face+hair component. Preserve Shaman V2's appearance and native proportions, not the rejected smaller new face/body. Current `/characters/v3` loads this revision. Previous separated-front-01 assets and15-credit receipts are retained as rejected-direction history.

## Real assets and provenance

- body.png:128 native independent headless body, derived from the owned approved neutral-male-02 with one FREE PixelLab Workbench exact patch. Removes skull/eyes/ears/face/jaw; reconstructs12 hidden neck pixels at48..49. Every torso, shoulder, arm, shorts and leg pixel y>=50 is unchanged. No runtime clipping mask.
- swept-head.png:128 native single complete head+face+ears+hair, reuses owned swept-spike-front-raw.png from the prior paid stage with no scaling, recolor or face paste. Face region x47..77,y35..49 stays exact V2. This hairstyle remains a visual candidate, not approved art.
- neutral-head.png: original bald head through jaw row49, only an identity comparison and whole-head swap control. It is not a newly designed face or a separate underlying face layer during styled-head rendering.

All runtime PNGs have their own manifest hashes and real independent textures. Assembled PNGs here are evidence only, never runtime character textures. No RO sheet input or sprite reuse in this task. Style references from user clarify component architecture only.

## Native rig

BodyRoot at61,112, body origin61,112, neck pivot62,49; both head pivots62,49. At rest body and complete head images register at0,0. BodyRoot -> NeckAnchor -> HeadRoot -> ONE complete head image. No bald face beneath the styled head and no added hair overlay. Head XY, integer bob and optional quarter-turn rotation affect only the head. Other equipment slots remain empty. Whole-head mode rejects separately selected hair layers. Guides are off by default so the anchor cross cannot be mistaken for anatomy.

The neutral-head rest assembly exactly reconstructs the original V2 RGBA image. The repaired neck is exposed only when the head moves or is removed. Torso pixels and approved proportions are conserved, not approximated. This is an explicitly reconstructed derivative, not a new generated body or a simple uncorrected row crop.

## Credit and validation

Additional paid calls0, credits0, retries0; free Workbench edits1. The tool's inline preview is enlarged, so the native authoritative image.png was downloaded from the returned PixelLab URL and validated at128. Previous88/88 and15/15 paid stages remain byte-exact. No ledger reset.

Tests: all original body pixels y>=50 exact; only12 neck pixels remain above50 in body; no torso pixels in the complete head; protected face pixels exact; neutral assembly original-identical;54 head movement/swap/bob cases preserve body; all frozen V2 and prior-stage hashes pass. Typecheck/build and desktop/mobile visual review remain required. Technical passes do not approve this hair design or anatomy.

Stop at FRONT IDLE with one existing hairstyle plus bald reference. No other directions, animation, outfit or weapon generation, automatic art approval or gameplay migration.

Verification completed: typecheck and production client build pass. Actual Phaser Inspector checked at native1x and nearest4x; whole-head offset12,-8 changes HeadRoot to74,41 while body61,112 and neck62,49 remain fixed. Swapped to bald identity reference and back without replacing the body. Desktop proof screenshots, movement proof and neutral identity comparison saved here. Mobile390x844 and844x390 show no page overflow; native4x preview scrolling is local, with four preview canvases retained. Visual approval remains user-only; stop here.
