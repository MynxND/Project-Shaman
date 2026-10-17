# Detailed male head placement — 2026-10-13

Implemented: local integer translation tracker compares three collar patch sizes (9×7,13×11,19×15), uses their median and checks reverse matching. Search is ±18 native pixels. Acceptance requires all three original similarity/margin checks, maximum vote distance1.5px and reverse error≤1px. These thresholds are tool heuristics, not anatomical accuracy guarantees. No OpenCV dependency, generative service or paid requests were added.

`proposals.json` contains1,152 motion proposals tied to exact source fingerprint and body SHA;763 satisfy conservative image-matching criteria. Existing editor loads proposals without overwriting confirmed offsets. Low-confidence frames remain visible as orange proposals and can be adjusted manually with onion skin and integer nudges.

Actual placement started: all144 SOUTH walk/attack/cast frames across six male classes were inspected in the six `*-south-before-after.png` sheets and saved/applied to the isolated detailed Phaser manifest. Existing saved entries take priority. This is agent review, not user visual approval. Other1,008 motion frames remain proposals; idle48 remain unchanged. No claim of all-direction completion or final animation approval is made.

Each comparison sheet has six rows: walk before/after, attack before/after, cast before/after. Columns are frame0–7. Walk landmark sheets have green original and yellow proposed neck crosses. Original body/head PNG bytes, published gameplay, Thai/Russian outfits and female pipeline are unchanged. Only detailed draft neck metadata changed, with previous manifest snapshot in `../head-history/`.

Reproduce: `node tools/rig/propose-detail-heads.mjs` then `node tools/rig/review-detail-head-fit.mjs`. Applying is separate via editor; `apply-reviewed-detail-south.mjs` is explicitly limited to the visually inspected SOUTH set. Do not apply all image-match candidates without reviewing anatomical attachment, occlusion and playback.

Checks passed: known translated pattern and empty-patch rejection; hash/fingerprint/range guards;1200 detailed runtime frame compatibility checks; six-class browser editor and desktop/portrait/landscape checks; workspace typecheck. Remaining: review seven other facings, resolve ambiguous/occluded necks and inspect animation transitions in Phaser before publication.

Research: [OpenCV template matching](https://docs.opencv.org/4.x/de/da9/tutorial_template_matching.html) and [optical flow](https://docs.opencv.org/4.x/d4/dee/tutorial_optical_flow.html) were evaluated. The implemented tool uses existing local JavaScript patch matching; optical flow was not installed or claimed as implemented.
