# FRONT IDLE — preserve Shaman identity, whole-head attachment

Latest USER correction: preserve original V2 body/face proportions and appearance; body is an independent headless sprite, head is a single independent face+ears+skull+hair PNG. Switching hairstyle switches this whole head. This supersedes the previous new small body/bald-head art direction and separate hair selection for this review. Only FRONT IDLE, one existing hairstyle candidate, no new generation.

Use owned original V2 neutral-male-02 torso/arms/shorts/legs byte-exact at128 native, scene foot61,112. Remove the entire old head including jaw row49. Reconstruct a short intact neck at rows48-49,12 pixels, using observed original skin ramp; shoulders/torso y>=50 unchanged. Body origin61,112. Neck pivot62,49. Head source: existing owned swept-spike-front-raw.png, a complete face+hair asset from prior paid stage. Preserve its native128 canvas and all pixels. Head pivot62,49. Optional bald identity reference is extracted through jaw row49; not a second newly generated face. At rest all source images register at0,0 with no scale or deformation.

Phaser BodyRoot -> NeckAnchor -> HeadRoot remains. HeadRoot owns the single full-head image. Hair is contained in that asset for this mode; hair slots are disabled and no extra face or hair is drawn underneath. Headgear is still a separate optional component. XY/bob/rotation act on the full head only. V2/runtime and all previous ledgers/assets remain frozen; old rejected small V3 rig is retained as history.

PixelLab Workbench exact guarded edit is free; paid calls0, retries0. No RO sprite input, no external sprites reused. Existing head/hair remains a candidate and requires user visual approval; modular technical success does not approve its art.
