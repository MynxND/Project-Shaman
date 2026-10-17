# Option 1+ carry poses — 2026-10-12

Continuation of the user's Copilot task: improve existing modular weapons without generating art or spending credits.
Production artwork, combat rules, hitboxes and unrelated working-tree changes are retained.

## Implementation

- `weapon-carry.ts`: category/facing configuration, diagonal art for east/west axes, shields, bows, knives and fans; category size multipliers; short-arc rotation interpolation. South keeps its original item scale and neutral category pose.
- `ModularRig.ts`: grip origins use the selected artwork's horizontal grip and the item's vertical grip. Equipment rotates/scales around the hand. Removed the inherited shield's 18-body-pixel translation, which detached its grip. Main/off-hand depth remain independent. Finger overlays also show when only the off-hand equipment is in front.
- `v3-weapon.ts` (inherited continuation): authored attack hand is reused for rest/walk, carry weights return to 1 at attack endpoints. Attack art is kept at a constant per-facing equipment scale. No rest/attack texture switching.
- Shared `equipment.ts` (inherited continuation): categories are metadata, with separate off-hand categories. Unknown future categories keep normal size/placement. Dual keris preserves the existing baked-weapon attack exception.
- `FoundationScene.ts` and `GameShell.tsx`: development-only `/?carryReview=1&weapon=axe-juggernaut` board uses real CharacterSprite + EquipmentLayers, with no room connection, HUD or map dressing. Rows: idle, looping walk, attack frames 0/1/3/7, repeated live attack. Columns: S/SE/E/NE/N/NW/W/SW. Resize fits the existing board without rebuilding the scene; its listener and readiness marker are removed on shutdown. Enter as guest after opening the URL.
- `scripts/weapon-carry-test.mjs` and client `package.json`: actual production renderer runs against recorded Phaser image calls and real anchors/assets. It checks 1,568 weapon/facing/pose combinations, exact main/off grip attachment, unchanged south size, constant attack scale, equal rest/attack-endpoint rotation, finite transforms, available textures, retained back layers and clearing attachments on unequip. No duplicate placement implementation in the test.

The category multipliers combine with existing item sizes: axe 0.7×1.2=0.84, two-hand axe 0.7×1.15=0.805, staff 0.75×1.05=0.7875, wand 0.75×1.1=0.825. Short weapons and shields retain their category-specific proportions. These boosts exclude south and are constant across idle/walk/attack for a given facing.

## Evidence

Before files were already present when Codex resumed Copilot. They are preserved, not recreated or relabelled as new captures:

- [Juggernaut before, eight directions](juggernaut-before-8dirs.png)
- [All weapons before](all-weapons-idle-before.png)
- [Inherited gameplay walk/idle check](after-ingame-juggernaut-walk-idle-8dirs.png)

New actual-browser captures live in `codex-review/`, separately from inherited files:

- [Final Juggernaut board](codex-review/axe-juggernaut-desktop.jpg)
- [Two-hand axe](codex-review/axe-taiga-desktop.jpg), [bow](codex-review/bow-ullr-desktop.jpg), [knife](codex-review/knife-mor-desktop.jpg), [dual keris](codex-review/keris-desktop.jpg)
- [Achan](codex-review/staff-achan-desktop.jpg), [Rune Seer](codex-review/staff-rune-seer-desktop.jpg), [Santet](codex-review/wand-santet-desktop.jpg), [Onmyoji](codex-review/fan-onmyoji-desktop.jpg), [Miko](codex-review/gohei-miko-desktop.jpg)
- [Novice bell staff](codex-review/staff-bell-desktop.jpg), [bone staff](codex-review/staff-bone-desktop.jpg)
- [Portrait resize](codex-review/axe-juggernaut-portrait.jpg), [landscape resize](codex-review/axe-juggernaut-landscape.jpg)

Before/after boards use different framing and labels: compare equipment silhouette/layering, not pixel distance between screenshots. South baseline is independently checked in renderer coordinates. Desktop viewport override requested 1280×900; browser capture dimensions can differ with panel sizing. Responsive captures test the review board only, not physical touch controls.

## Validation and limits

`pnpm typecheck`, `pnpm build`, `pnpm test`, `pnpm test:weapon-actions`, and the dedicated carry test pass. Browser error log was empty during capture. Existing network harnesses emit unregistered-message and deliberate takeover/restart warnings while their assertions pass.

Visual inspection: diagonal art improves east/west silhouettes; shield and weapon grips remain hand-pinned; far-side equipment still passes behind the body. Some authored weapon/body poses overlap hair/face or partly obscure a far-side weapon, especially the two-hand axe and dual keris. Those are recorded for user art review; the implementation does not claim every frame is clipping-free or visually approved. Body frames still change discretely as authored. Endpoint rotation/scale continuity is tested; screenshots alone do not prove absence of every temporal pop. No generated artwork, paid calls or gameplay changes in this continuation.
