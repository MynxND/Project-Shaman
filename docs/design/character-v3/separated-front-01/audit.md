# Phase 1 — existing implementation audit (before implementation)

2026-10-10. Visually inspected actual `/assets/character-v2/body-front-02/raw.png`: bald face, skull, ears, torso, arms, shorts and legs are baked into the same image. The `body` label is not anatomical separation.

| System | Real separation | Limitation / code |
|---|---|---|
| V2 manifest | Hair PNGs and optional item slots | Body includes full head; no independent head asset or neck joint. `apps/client/public/assets/character-v2/manifest.json`, body item neutral-male-02. |
| V2 static Inspector | Explicit image draw passes | `CharacterV2Inspector.tsx` effect iterates frame.order and draws full128 images at0,0. HairBack/body/outfit/hairFront are overlays; body still contains face. |
| HairFrontEditor | Own hair layer images | Draws unchanged full V2 base; offsets move only hair. This is not a separated anatomical rig. |
| HeadWardrobeInspector | Independent head+hair images plus derived headless V2 body | Body derived by zeroing rows above49 in `tools/rig/head_wardrobe.mjs`; fixed split does not reconstruct shoulders/neck. All transforms are flat drawImage offsets; no parent-child NeckAnchor. Front authoring locked old face. |
| V3 proportion-front-01 | Separate comparison images A/B/C | Complete bald character PNGs; unapproved, no independent head/body. `V3Comparison.tsx` renders full image per panel. |
| LayeredCharacter Phaser proof | Images in one Container; per-pass textures | `game/characters/LayeredCharacter.ts` shares foot origin across layers; not a body-neck-head hierarchy. Not V2 runtime. |
| Gameplay CharacterSprite | Main-v1 whole-character textures/frames | `game/characters/CharacterRig.ts` and `FoundationScene.ts`; unrelated to static V2 Inspector. No migration in this task. |

Outfit/headgear/weapon/offhand/accessory fields in a schema are not proof of independent usable assets. V2 current reviewed FRONT only proves complete-body plus some separate hair passes. No existing source will be cropped into the new V3 base.

Audit completed before changing renderer or assets. V2 stays immutable for this task. New work uses separate paths and FRONT IDLE only.
