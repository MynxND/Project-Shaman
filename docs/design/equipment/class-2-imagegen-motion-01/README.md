# Indonesia / Japan / Norway — motion production candidates

2026-10-13. User authorizes continuing all three countries/six approved male outfits, using built-in imagegen instead of PixelLab. Female remains paused. **File production and isolated renderer staging are complete; visual finishing and gameplay adoption are not complete.**

## Delivered assets

18 real generation requests:6 outfits × walk/own-weapon attack/cast. Each returned an8-direction ×8-frame atlas.1,152 headless native128 motion frames exported,144 eight-frame clips. Reuse48 static idle frames from the preceding stage:1,200 costume body poses total. All144 clips contain different byte frames; this is a file diagnostic, not proof of natural animation. No repeated stills are fabricated as whole motion clips.

Countries/classes: Indonesia Santet/Keris; Japan Onmyoji/male Miko; Norway Rune Seer/Ullr Hunter. Own attack IDs follow the shared current equipment mapping. Keris retains the existing baked-blade attack exception; it does not attach duplicate daggers during those frames. Actual registered item art is used in equipment previews; no new weapon design replaces it.

Built-in imagegen calls this stage:18; PixelLab calls/credits:0. Cumulative concept + fitting + static directions + this stage:27 built-in calls,0 PixelLab credits. Built-in image calls are not a financial cost or account quota estimate. Raw outputs and exact prompts remain in each class folder. The first walk prompts preceded a stronger explicit NW facing constraint, recorded verbatim; do not treat all NW motion as visually approved.

## Review

- http://127.0.0.1:8769/ — six-class motion viewer, pause/frame scrub/speed, original-head body sheets, real item artwork and diagnostics. Includes links to actual Phaser draft boards.
- Offline equipment placement uses the real `EquipmentLayers`/`v3WeaponFrame` calculation code but rasterizes SVG; that stage alone is not Phaser certification.
- `?carryReview=1&outfit=1&outfitDraft=1&weapon=<item>` on localhost3000 loads the optional draft manifest **only in development carry review**. Production and normal gameplay URLs always retain the default manifest. No accounts, class grants, stats, hitboxes, server timelines or protocol change.
- Default `class-outfits/manifest.json` remains byte-identical with only the original Thai/Russian pair. `manifest-imagegen-draft.json` includes those plus the six draft sets for isolated review. Availability of all files is not visual acceptance or permission to call them production-ready.

## Source and export contract

`source-lock.json` records original motion PNG hashes/neck/origin bindings. Cast samples source indices0,2,3,5,6,8,9,11 from the actual12-step cast; the existing puppet still maps eight costume images to the original12-step display timeline. Each generated motion atlas returned1254x1254, rather than the requested2048x2048. The exporter reads actual sizes and uses integer cell boundaries.

Crop/nearest export uses a **constant scale and registration per action/facing**, calibrated from the first frame. It does not resize independently to each moving frame's clothing bounds. Main connected-subject bounds are used for cropping away separated fragments outside the rectangle; raw art is retained and no pixels inside the rectangle are repainted. Detached foreground components are retained in the report for review: a crop is not proof that every excluded fragment was unwanted. Original male body/head files are unchanged; independent original head pixels are cropped/translated for previews, not redrawn.

Neck estimates and bounded nearest-skin hand contacts are provisional. Candidate fallback anchors are explicitly logged in `draft-staging-report.json`. Source-pixel contact masks copy only existing skin pixels around candidate grips; no new fingers are drawn. Blade geometry in generated Keris frames still needs comparison with the registered dagger, despite preserving the exception's architecture.

## Open defects — must resolve before gameplay adoption

`verification.json` records230 source-cell edge-contact flags,2 frames using original-pose neck fallback and10 frames without visible main-hand skin near inherited targets. These are automatic review flags, not a count of independently confirmed art defects. The equipment placement pass has14 main-hand fallback flags. `export-report.json` and `equipment-review.json` identify every tuple.

Visual inspection also finds torso-facing changes within some NW walks, small costume/trim changes between poses and remaining cuff/weapon/head overlap candidates. Constant clip export scale does not prove identical apparent size at idle/action transitions. The large-atlas generator approximates anatomy and cannot certify locked hand/neck pivots. Native pixel polish, art repairs, authored grip/occlusion metadata and full-speed carry/attack/cast transitions remain unfinished. No silent fallback is called a finished new costume. No hurt/death animation is invented.

## Files and checks

Tools: `prepare_class2_imagegen_motion.mjs`, `export_class2_imagegen_motion.mjs`, `review_class2_imagegen_equipment.mjs`, `stage_class2_imagegen_draft.mjs`, `check_class2_imagegen_motion.cjs`, `capture_class2_imagegen_phaser.cjs` under `tools/rig/`.

Client change scope: `class-outfit.ts` adds a guarded development draft URL; `FoundationScene.ts` resolves board-only branch selection through the existing shared `BRANCH_WEAPONS`. `class-outfit-test.mjs` verifies the development/production gate. The normal game selection and original Thai/Russian manifest do not change.

Native hashes/dimensions:1,152 motion frames passed;144 complete clips;1,200 equipment previews. Review browser loaded24 class/action selections ×8 facing canvases with no page/PNG errors; responsive screenshots in `browser-evidence/`. These are UI/loading checks, not art approval. Real Phaser evidence is tracked separately in `phaser-evidence/`. Physical mobile and multiplayer sessions are not newly verified.

Actual Phaser check completed: six boards ×96 confirmed outfit sprites =576 real costume instances across8 facings and12 idle/walk/attack/cast rows. No page/asset errors; each class's full board plus portrait/landscape captures are in `phaser-evidence/`. Representative Ullr/Keris boards were visually inspected and still expose carry/cuff/body-transition candidates; this is renderer availability, not visual approval. Root `pnpm typecheck`, `pnpm build`, class-outfit publication/head/fallback tests and weapon-carry regressions pass. Draft URL gate is tested for production, normal gameplay and explicit development review. Default Thai/Russian manifest hash remains `c864f21634f9d5dd2000badd6800e0c07da14441130ac7b00a2c8426ad6e5e88`.
