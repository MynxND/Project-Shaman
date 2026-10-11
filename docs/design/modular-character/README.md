# Modular Character Rebuild: Audit and First Proof

Status: engineering proof, not approved art and **not a main-player migration**. User request: 2026-10-09. No original assets were deleted or overwritten. The supplied RO-like sheet is a pose/layout reference only, never generation input or extracted game art.

## Architecture Audit

| Surface | Existing owner and limitation |
| --- | --- |
| Character rendering | `apps/client/src/game/characters/CharacterRig.ts`: `CharacterSprite` chooses a whole-body rig-v2 outfit strip, otherwise main-v1 frames. Hair, face, skin and clothes remain flattened; changing appearance fields does not create independent layers. |
| Animation | Phaser body animation; walk timing comes from shared `WALK_SPEED / WALK_CYCLE_UNITS`. Facing changes preserve cycle progress. `setLook` calls redraw, so exact within-frame accumulator preservation was not demonstrated by the old renderer. |
| Directions | Eight explicit `FACINGS`. Older main-v1 fallback supports mirrors; rig-v2 male base currently packages eight actual directions. No front-sprite rotation is used in the new proof. |
| Combat states | Idle, walk and one-shot attack use body strips; cast uses `SkillCastLayer`, server events and shared `castPoseFrame`. No authored hurt/death strips. `FoundationScene` currently dims/tints downed players. |
| Equipment | `ModularRig.ts` has two persistent images: weapon and headgear. Grip/tip/front and crown/tilt sample the current body frame. Weapon rendering currently always uses its south image and rotates it; hair, independent clothing, off-hand and accessory visuals are absent. |
| Inventory/network | `packages/shared/src/economy.ts` validates immutable equip/unequip; `equipment.ts` encodes visible body/weapon/head slots; `GameRoom` validates requests and publishes `PlayerState.look`. Bag controls use this existing pipeline. Do not replace item IDs or invent client-authoritative equipment. |
| Saved data | Profiles are session-only, with portal travel handoff, not durable character saves. Existing equipment IDs and profile data are untouched by this proof. |
| Assets | Native rig-v2 artwork is 128px. Male base manifest has 4 idle, 8 walk, 8 attack, 12 cast frames per facing: 256 total. Packaged counts are not proof of source quality. Raw art and rejected bronze-ward remain archived. |
| Identity | Bronze-ward is blocked because it changed face/hair/proportions. A common skeleton alone did not preserve identity. Existing art direction and the source head/skin must remain the authority. |
| VFX | Server-driven skill presentation remains owned by `SkillCastLayer` / `RitualVfxLayer` and the central skill policy. No passive-stat VFX added. |

## Working Prototype

Open `/characters/modular`. The original `/characters` and world renderer are unchanged.

`packages/shared/src/modular-character.ts` defines a framework-independent pose template and clock. All layers consume one state, facing, frame and elapsed time. Turning preserves elapsed time; state changes restart; nonloops hold the last frame. Equip is separate from the clock. Unsupported pose selection returns false rather than pretending idle is hurt/death.

`LayeredCharacter.ts` owns eight reusable Phaser images in one container: body, hair, outfit, headgear, mainHand, offHand, accessories and effects. Local depth comes from the frame's order; world depth belongs to the container. Every asset must match the template ID, canvas, foot and frame counts. Texture changes occur only for changed layer keys/frames. Equipment bindings map existing slots to asset IDs; unequip resolves defaults. This adapter consumes profile-shaped data but the lab never modifies a server profile.

`tools/rig/build_modular_proof.mjs` deterministically extracts existing source pixels and packages per-item strips, not per-combination characters:

- One residual body layer, one partial hair layer, original textile and jade textile palette, two existing staves and two existing headgear.
- 32 clips covering idle/walk/attack/cast in eight directions; all eight equipment combinations can be inspected.
- 192x192 transparent padding around unchanged 128px artwork, source offset `(32,44)`, foot `(96,168)`. This is padding, not an art upscale. Source foot `(64,124)` is unchanged.
- Weapon art uses the requested direction, baked once along frame grip/tip; headgear follows frame crown/tilt. No runtime rotation of a front body substitutes for directional art.
- One source/pose template per character; one sheet per layer/state/direction. Asset count does not multiply by equipment combinations.

**Limitations:** extraction masks are deterministic drafts, not reviewed garment boundaries. The body retains nonextracted clothing; the hair is a fragment, not a complete hairstyle. Two cloth palettes are not two approved full outfits. Hidden body pixels cannot be recovered from flattened art. Off-hand anchor is provisional, with no art; accessories/effects have empty reusable slots. Hurt/death have no art and selecting them hides the actor with a missing-art status. Cast in this lab is a pose loop, not authoritative cast/channel/release integration. Existing source wobble or clipping is inherited, not claimed solved.

## Repeatable Checks

Run from the workspace root:

```powershell
pnpm --filter @shaman/shared build
node tools/rig/build_modular_proof.mjs
node packages/shared/scripts/modular-character-test.mjs
pnpm --filter @shaman/client test:modular
pnpm typecheck
pnpm build
pnpm --filter @shaman/shared test
pnpm --filter @shaman/client test:equipment
```

The builder checks exact original reconstruction, compatible counts, finite anchors, fixed foot and gear canvas bounds. The asset test checks all 256 RGBA sheets and 256 source frames, including partitioning and variant RGBA outside the draft garment mask. That mask-relative check **does not prove skin/head safety** without independent art review. `extraction-report.json` records counts, draft protection checks and zero clipped gear pixels; `pose-template.json` is reusable generation/packaging input.

Development-only browser probe on `.modular-stage.modularProof.verify()` checked 2,048 frame/loadout cases and 256 equipment swaps. Visible layer frames matched; swaps preserved pose clock and actor position. It reports the 16 missing hurt/death directions instead of counting them as passed.

Browser resize checks observed 1280x900, 390x844 and 844x390: same runtime ID, one canvas, nonblank art, no horizontal overflow, controls within parent bounds. Browser-tool pointer-coordinate instability prevented reliable end-to-end pointer certification; real device controls and visual review remain open. Screenshots were inspected through the browser tool, but no browser screenshot file is claimed stored in the workspace. Workspace typecheck/build, shared suite, modular asset tests and the existing two-client equipment smoke passed. Existing smoke emitted early unregistered profile/vitals handler warnings but passed assertions.

## Migration Gates

1. Review one native frame: independently protected head/skin mask, garment silhouette and occlusion mask. Reconstruct covered body and full hair from original identity; never resurrect rejected whole-body variants.
2. Approve two genuinely independent outfit layers, two weapons, two headgear and a complete hairstyle. Review every frame in eight directions, including native-size contact sheets and gameplay-scale motion. Inspect planted feet, body center, cloth deformation, hand contact, near/far arms and crown clipping. Pixel equality outside a garment mask is necessary, not sufficient.
3. Author hurt and death pose clips on the same body template. Validate entry, interruption, terminal death frame and authoritative respawn. Do not fabricate motion by rotating/scaling idle art.
4. Extend masks per frame and use the changes-only pipeline in `PIPELINE.md`. Preserve provenance; no asset regeneration on equip.
5. Bind approved garment item IDs to the existing server registry and inventory; test equip/unequip during idle, walking, attack, casting and downed restrictions. Verify both clients see the same appearance and stats/progression/equipment IDs survive travel unchanged.
6. Adapt the existing `CharacterSprite` API behind an explicit feature gate, preserving prediction, movement, facing smoothing, combat events and `castPoseFrame`. Use the same renderer for world casts and portraits; do not run a second clock. Keep the old renderer as an explicit complete fallback for unsupported/missing assets.
7. Only claim migration complete after the actual running world supports outfits, weapons and headgear from inventory without generating character combinations, and technical plus visual acceptance has passed. No durable-save claim until persistence exists.

The current implementation stops before these gates. Main-world clothing remains blocked.