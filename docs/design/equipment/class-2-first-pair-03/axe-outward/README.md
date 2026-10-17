# SOUTH axe blade outward correction

User corrected the inward-facing axe blade in the offline outfit preview. Original SOUTH artwork has its blade screen-right, but the weapon occupies the screen-left hand, so the blade points into the torso. Candidate `../axe-south-outward.png` is an exact horizontal reflection made using free PixelLab Workbench guarded pixel patches (image d442dabf-5067-47f8-9c05-d627bdc2bf73). Source remains unchanged.

Preview also reflects normalized gripX0.371→0.629. GripY0.8, item scale0.7, world hand position, shield, body and head are unchanged. Byte comparison of every pixel verifies exact reflection. Offline raster rounding remains as documented by the rig audit; not a live Phaser screenshot or runtime fix.

![Outward blade](equipment-comparison-3x.png)

Reproduce with AXE_OUTWARD=1 when running ../rig-audit/audit.mjs. Default audit continues using production art. No paid generation or runtime/gameplay changes. The future runtime integration must carry art orientation and mirrored origin together, scoped to the relevant art view/hand; do not flip all weapon classes or every facing. Attack/other facings still require review.
