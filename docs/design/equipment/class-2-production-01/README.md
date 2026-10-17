# Thailand / Russia production closure — 2026-10-13

User authorizes real production and integration of the existing male Achan Saiyasat and Juggernaut outfits, stopping paid test-image rounds. This supersedes the earlier offline-only phase for this pair. Female work remains paused. No other country is generated here.

## Production scope

- Reuse the16 native128 static directions, the three guarded Thai rear tattoo derivatives, Russian NW hand derivative, exact user head offsets and previously reflected SOUTH axe. Original base, heads, weapon art and historical attempts remain untouched.
-48 real production skeleton clips: two outfits × eight directions × walk/own-weapon attack/cast × eight frames =384 motion frames. Add16 existing idle frames =400 body frames.
- The existing server cast uses12 presentation steps. The eight newly authored cast poses sample that timeline in order; server CT, hit timing and release/cancel behavior do not change. Hurt/death clips are not supported by V3 and are not invented.
- Native128 throughout, nearest filtering and unchanged render size/origin conversion. Each costume uses its measured static foot row; original base origins are not edited. Independent SSR head/face/hair remain customizable. Head motion uses authored neck deltas; the eight Russian manual offsets are retained exactly.
- Original weapon/shield items remain separate runtime attachments. Costume hands have per-frame positions and source-pixel shaft-contact overlays. SOUTH axe uses the separate reflected art together with its reflected grip origin. Directional front/back equipment layering is preserved.
- This is a replacement headless clothed-body set on the existing rig, not an implementation of separately simulated torso/sleeve/cape garment layers. No new animation bones, cloth simulation, headgear crown, or gameplay capabilities are claimed.

## Credit control

`queue.json` is the production request inventory. Opening balance151; maximum authorized queue spend144 (48×3). No automatic paid retries. Known or ambiguous submissions are never resubmitted. Provider receipts, prompts and raw PNGs stay here; `progress.json` records actual submitted cost and downloaded clip count. Technical local checks cost no PixelLab credits.

Run `node tools/rig/run_class2_pair.mjs` to resume the existing inventory; do not rerun the request authoring script over submitted requests. Run `node tools/rig/publish_class2_pair.mjs` only after all48 completion receipts and384 raw frames exist. Publication rejects incomplete, clipped or non-native files and keeps the live registry empty until the complete set is available. No credit call occurs during publication.

## Runtime appearance policy implemented for this pair

Server-synchronized `PlayerState.branch` selects the male cosmetic; stats, equipment ownership and combat remain unchanged. Achan uses `staff-achan`; Juggernaut uses `axe-juggernaut` and its existing shield. An explicit body-slot item disables this class cosmetic and preserves the original body-item path; there are no registered V3 body-equipment outfits today, and this does not invent support for them. An unsupported swapped weapon retains the existing original body/motion system for every action, rather than mixing novice and class frames during one animation. Returning to the supported weapon restores the class set. Missing assets also fall back as a complete set.

This bounded first-pair behavior is authorized by the current production request. Broader cosmetic hide/show controls, additional weapon motions, separated garment layers, other classes and female pipeline changes remain future work. They are not silently approved or implemented.

Actual-renderer boards after publication:

- Thailand: `http://localhost:3000/?carryReview=1&outfit=1&weapon=staff-achan`
- Russia: `http://localhost:3000/?carryReview=1&outfit=1&weapon=axe-juggernaut`

The development boards do not connect to a room; gameplay uses the same CharacterSprite selection through the synchronized branch.

## Status

**Completed locally, 2026-10-13:** All48 clips downloaded and400 body frames published. Male branch selection, independent head/hand attachments, exact Russian saved offsets, outward SOUTH axe, walking/attack/cast and complete-set fallback are implemented. Cast channels lean the weapon around its grip and draw equipment between torso and head while hands are near the face; scale stays fixed. Four generated fists required measured grip overrides (`grip-overrides.json`). Free guarded Workbench cleanup removes1,839 unwanted baked-knife pixels across24 derivatives; paid raw art is retained, every outside-mask pixel verified unchanged. Total paid production144, final balance7, additional paid test images0.

Verification: root typecheck and build pass;400 native dimensions/hashes,464 actual V3 puppet head/timeline cases and existing1,568 carry/512 legacy cases pass. Before/after screenshots, supported-motion recording and portrait/landscape browser captures are in `runtime-evidence/`. Technical checks and browser inspection are separate from user visual acceptance. Physical touch and a new two-client visual session were not performed; existing branch synchronization/persistence is reused without protocol changes.

## Delivered evidence and files

- [Thailand before](runtime-evidence/achan-idle-before.png) / [after](runtime-evidence/achan-idle-after.png)
- [Russia before](runtime-evidence/juggernaut-idle-before.png) / [after](runtime-evidence/juggernaut-idle-after.png)
- [Motion recording](runtime-evidence/pair-supported-motions.webm), [runtime report](runtime-evidence/report.json), [publication report](publication-report.json), [pixel repair report](knife-cleanup-report.json).
- Runtime: `apps/client/src/game/characters/{class-outfit,V3Puppet,CharacterRig,v3-weapon,ModularRig}.ts`, `FoundationScene.ts`, and the development-only board branch in `GameShell.tsx`.
- Assets: `apps/client/public/assets/character-v3/class-outfits/manifest.json`,400 body PNGs, source-pixel hand overlays and the separately reflected axe. Original base/head/female/equipment PNGs remain unchanged.
- Production tooling: `tools/rig/{produce_class2_pair,run_class2_pair,publish_class2_pair,clean_class2_weapon_pixels,unpack_class2_cleanup}.mjs`, `capture_class2_pair.cjs`; existing carry test import adapter plus `class-outfit-test.mjs`.
- Documentation: outfit specification, architecture, design decisions, roadmap and the existing localhost8767 review page, with historical proof art retained separately.
