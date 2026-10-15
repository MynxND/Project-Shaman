# VFX art07 — three real-game prototypes after visual rejection

User rejected the thin procedural effects during the17-enemy live audit and requested impressive, beautiful VFX, then specifically asked to learn from haowg/GODOT-VFX-LIBRARY. The previous run was stopped after230 technical cases; **it did not complete all289 cases and was not visually approved**. Historical record: ../live-06/rejected-partial-audit.json.

## What changed

Three reviewable prototypes: Yuki-onna frost-breath surge, Vodyanoy river-wave crest and Sending wraith curse claw. New ImageGen artwork follows the user's existing folklore-batch exception; PixelLab balance was rechecked at0 generations/0 credits. Original source PNGs, brief/prompts and measured packing metadata are retained here. No original monster PNG or old comments were deleted. Existing attack poses, stats, movement, camps, NPCs, portals and national lore remain.14 other ranged effects still use the rejected older presentation and require later art work; these three prototypes are not approval/completion of all17.

[Godot source study and MIT notice](../../../../research/godot-vfx-library/README.md). Exact upstream commit6e8fc84ef426f82f747cd540823e1d5e1fdc563a was inspected read-only. Learned separation of release, substantial moving core, residual trail, impact and dissipation; water spray/gravity and frost fragments; bounded transient lifetimes. No Godot runtime added. Artwork is newly generated original material, not copied from that repository or another game's sprites.

The Phaser layer uses three authored160px atlases,8 frames x8 baked directions each, nearest filtering. Frames0–3 form a flying material loop;4–7 are a distinct impact. Two faded afterimages add motion without sinusoidal string geometry. A short source flash precedes the mass. The pivot is the leading edge, so the front reaches the aimed point at arrival. A hit burst starts only when the server sends positive damage for that source; a miss dissipates. Waiting-for-authority timeout and280ms impact dispose all images. Budget32 art flights/128 images, with idempotent scene cleanup. Existing legacy presentation remains compatible. Map-scoped loading retains ownership of textures.

## Attachment and timing corrections

Server swing carries facing before the next position patch; the sprite is synchronized to the authored release pose when the shot launches.136 candidate native emission points were measured on existing attack frames. Visual inspection showed Yuki diagonal sleeves being selected instead of her mouth, and Sending front views emitting too low; emission-overrides.json now records manual mouth/raised-hand corrections, applied by measure-emission-ports.py. Ports are reviewable attachment design, not automatic anatomical rigging. No gameplay range derives from their pixels.

Camera capture initially ignored zoom-origin offsets and produced invalid empty terrain crops; those images were discarded. The corrected recorder uses camera.worldView with a centered case camera. Current proofs must show caster, effect and target, separate from numeric test success.

## Real-game validation workflow

Open /?map=lantern-paddy&rangedReview=1&vfxPrototype=1 as an unsaved guest; click the3x8 prototype audit. A separately registered development-only Colyseus room uses the actual Lantern Paddy geometry, FoundationScene renderer, authoritative CombatSystem/AI and stepMovement. Cases arrange actors before casting; dodge is normal MovementController steering after launch, not a teleport. Production registration and authenticated entry are rejected. Korean fixture enemies are never added to national live spawns.

Each prototype has8 stationary hits,8 real movement dodges and1 out-of-range case (51 cases total). The browser records actual rendered facing/frame, release/damage/arrival timing, walked distance and a Phaser scene snapshot. Export JSON with the visible control, then publish-live-audit.mjs --prototype validates coverage and builds the24-image evidence gallery at /monster-review/ranged-vfx-07/index.html. live-results.json contains the final measured metrics. These are local desktop results, not simulated latency or physical-device performance claims. User art approval remains open.

Tests cover the real art layer's linear travel,8 leading-edge directions, server-only hit, miss fade, object cap and disposal; dev-room authentication/production exclusion and actual movement; all40 manifests/legacy preservation, source-impact timing, habitat bindings and shared regressions. Workspace typecheck/build required. Preserve the alpha/nearest packing workflow in pack-vfx-07.py.

Final local run:51/51 passed (24 hits,24 normal-movement dodges,3 outside range); max visual-arrival/damage difference48.3ms; minimum walked dodge distance3.608 world units; launch-to-damage790.1–1036ms. Desktop and390px portrait/844px landscape gallery inspected. Workspace typecheck/build and art/live/legacy/orb/encounter tests passed; twenty bound real rooms and authoritative damage/death regressions passed. Screenshots frost-game.png, water-game.png, curse-game.png and mobile-review.png show current actual-game evidence. Mobile gallery checked in a browser viewport, not a physical phone.
