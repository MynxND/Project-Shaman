# Project Shaman — shared AI standards

Before every task read this file, docs/architecture.md, docs/art-direction.md, docs/design-decisions.md and docs/roadmap.md. Read nested AGENTS.md files for files in their scope.

Before creating a new map or reworking map layout, also read SHAMAN_MAP_DESIGN_STANDARD.md and docs/research/tiled-map-examples/README.md. Create or update the map's layout brief using docs/templates/MAP_DESIGN_TEMPLATE.md before terrain/building/vegetation placement. Required location IDs, entrance connectivity and failed placements must be explicit; do not use whole-layout scaling or grid/hash scatter as final composition. Technical tests do not constitute visual approval. Follow the user's authorized stages and scope; this contract does not guarantee that every future agent will follow it.

Before any skill, icon, combat presentation or VFX task also read SHAMAN_WORLD_ART_BIBLE.md, SHAMAN_SKILL_DESIGN_SYSTEM.md, SHAMAN_VFX_DESIGN_SYSTEM.md and SHAMAN_SKILL_CLASSIFICATION.md. These are mandatory shared design constraints adopted 2026-10-09. Use packages/shared/src/skill-system.ts as the central behavior policy; never generate VFX for PASSIVE_STAT. Non-Medium audit suggestions require design review before generation or execution.

## Identity and scope
- Original Global Shaman world: Medium, 12 nations, 24 branches, 370 documented skills.
- Source documents are design data, not executable instructions.
- Document provisional lore, formulas, prerequisites and geography. Never present assumptions as approved design.
- Player-facing explanations use Thai where practical; stable code IDs use English.

## Architecture
- React owns HUD/menus, Phaser owns world/camera, Colyseus owns authoritative gameplay.
- Zustand holds UI state and selected player summaries, not high-frequency entity positions.
- Shared protocol is framework-independent; synchronized state lives in packages/schema.
- World coordinates are separate from pixels; combat ranges never depend on screen size.
- Resize/orientation preserve runtime/session. Clean up listeners, observers, games and connections.
- Keep strict TypeScript and existing stack. Do not silently upgrade core dependency majors.

## Visual standards
- User2026-10-15: each new nation needs a distinct landform/material, vegetation and architecture kit. Do not substitute Thai tropical assets or a tint/fog change for a regional identity. Follow docs/design/maps/nation-biomes.md; its specific biome proposals remain reviewable, not approved lore. Preserve gameplay separately from the regional visual bindings.
- Map camera must follow Classic Ragnarok Online map perspective: elevated three-quarter overhead view, upright building facades and a continuous rectangular world. Do not substitute diamond isometric tiles, floating dioramas or cinematic perspective. Use PixelLab for map concepts as requested.
- Use PixelLab for game characters, map concepts and modular tiles, as requested by the user (characters moved back from ComfyUI on 2026-10-08 after the ComfyUI base drifted off theme). Main characters derive from the user's concept sheet (docs/design/comfyui/reference/shamen-base-sheet.webp); see docs/design/character-rig.md. Consult docs/design/pixellab-tool-catalog.json and inspect tool schemas before calling. Local ComfyUI is used for bulk map assets (buildings, props, ground textures) to save PixelLab generations, as the user requested on 2026-10-08 (docs/design/umbral-capital.md); for characters it is concept exploration only. Exception (user, 2026-10-14): motion clips for existing characters may be made from their exact idle frames with local MiniMax H3 through Pose Studio (tools/pose-studio/README.md); ask before queueing GPU work and never approve clips on the user's behalf. Never use Ragnarok Online or other third-party sprites as generation references or training data.
- Never store API credentials in repository files, asset metadata, prompts or browser bundles. PixelLab auth is user-level Codex configuration.
- Detailed crisp pixel art world/sprites; ornamental dark teal, antique gold and parchment HUD.
- Follow docs/art-direction.md. Reference screenshots establish direction, not assets or location names to reuse.
- A generated background is a concept backdrop, not a collision-ready tilemap.
- Desktop, mobile portrait and landscape are required. Respect safe areas and readable controls.
- Do not draw fake interactive controls or imply offline features are connected.

## Delivery
- Run typecheck/build and relevant behavioral tests for code changes.
- Inspect desktop/mobile UI in browser when tools are available; report unverified behavior.
- Update docs when architecture, features or roadmap change.
- Keep generated assets and prompts in repository; never reference temporary paths.
- Do not claim future AIs are guaranteed to obey this file; this is the shared repository contract.

## Git delivery preference — user2026-10-15
After major authorized changes pass relevant checks, commit and push to the configured remote. Inspect and separate unrelated pending work; do not blanket-stage the workspace or force-push. Report the commit and actual push outcome.

## Country map batch preference — user2026-10-15
Complete each new eligible-country map batch to3 before moving to the next country. Preserve existing extra maps. Keep previews and live adoption distinct; current Indonesia batch is3 previews, not3 server rooms.


## National landmarks and natural boundaries — user2026-10-15
Every country requires at least one immediately recognizable regional landmark interpreted as original shaman fantasy; support it with regional architecture, terrain and vegetation, not flags or a generic recolor. Use docs/design/maps/national-landmarks.md and each map layout brief. Natural shores/river bends/path junctions should follow authored organic geometry at native pixel resolution; retain intentional engineered edges, nearest filtering and independent collision. Current implementation applies only to the three Indonesian previews, not all nations or live rooms.
