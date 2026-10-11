# Sacred Spirit Garden — corrective proposal, 2026-10-09

Scope: remove the failed latest landscape additions; implement only the northwest garden. Other districts receive no new garden design until visual approval. This proposal is not approved lore or geography.

## Actual map grid

Read from `packages/shared/src/maps/umbral-capital.ts`: 80 × 60 world units, one terrain cell per unit; 32 rendered px / unit, 16 native asset px / unit. Coordinates below are world/tile coordinates, x east, y south; object coordinates denote the centre of the base. Building sprites extend north of their base.

No Git history is available. Preserve the current source as `docs/design/umbral-v2/backup/umbral-capital.before-garden-fix.ts.txt`. Compare with the existing pre-landscape backup; do not restore that whole file because later lights and wall work must survive.

## Keep / remove / relocate

- Keep sacred tree (23.6,16.4), pond centre (15,13), radius 3, all three lotus pads at their current coordinates, house (11,22.6), all buildings, lights outside the garden, spawn, roads, bridges and canal blockers.
- Keep major blossom sprites at the temple and SW house in their current positions; these precede the failed pass. Keep the garden blossom but move (10,10.2) → (9.6,11.2) as the western canopy mass.
- Remove failed `LANDSCAPE` additions: every `shade-tree`, `stone-bed`, `reed-planter`, loose cypress and planter bush. Remove the latest clay-pot placements outside the garden. Preserve assets on disk for reference. Do not repopulate other districts with the older scattered vegetation.
- Garden: remove the two saplings, four cypresses, three planter bushes, two reed planters, clay pots and raised lotus flowerbed.
- Move garden shrine (18.4,17.6) → (25.8,18.9); incense (26.4,17.6) → (26.9,19.5); spirit lamp (20.4,11) → (18.8,13.2). These form one offering area at the tree, with a visible approach from the south. Route clearance testing moved the incense off the curved path before delivery.

## Manually authored garden boundary and planting

Envelope: x 6.2–28.5, y 6–21.5, south opening towards (28,21). West is bounded by the existing canal; north by the wall. No new fence across the entrance.

Use one missing PixelLab organic low planting cluster: dark moss, connected low shrubs, small pale/crimson flowers and mossy rocks; transparent irregular outline, no raised platform, pots, trees or straight edging. Three supporting masses, deliberately different offsets/orientations:

| Cluster | Base coordinate | Intended silhouette |
|---|---|---|
| West bank | (9.5,17.7) | wraps below blossom, beside pond; leaves house access south |
| North bank | (16.4,8.2), mirrored | low northern boundary behind pond; does not cover lotus water |
| Tree east shoulder | (24.9,13.4) | backs the sacred canopy; avoids tree foot and offering approach |

All low clusters are walk-through dressing. Use the existing blossom trunk footprint 1.6 × 0.9; sacred trunk remains 2.4 × 1.2. Shrine 1.2 × 0.6; incense 0.7 × 0.4; lamp 0.9 × 0.5. Do not block broad canopy silhouettes.

## Paths and negative space

Replace only the old NW earth stroke. Stone path radius 1.1 follows `(33,23) → (28,21) → (24,19.3) → (21,18.4) → (18.5,17.1) → (15.4,16.9) → (12,18)`; reuse the approved grass/road Wang tiles for rounded transitions. Pond and tree now share a continuous pedestrian route. A short stone spur radius 0.9 follows `(24,19.3) → (24.7,17.8) → (24.9,16.8)` to the sacred tree's existing steps. No paving over water.

Keep open lawn between pond east bank and tree; no miniature tree enclosures. Preserve house approach at (11,23.6), tree interaction at (24.9,17.2), shrine approach (25.8,20.8), pond overlook (16,17). Existing water footprint is unchanged; no additional invisible planting blockers.

## Verification and review gate

Run typecheck/build, city footprint/flood-fill tests, network smoke and garden route clearance checks against shared authoritative collision. Verify all non-landscape objects against the preserved baseline. Capture maximum permitted zoom-out, normal gameplay framing and close-up; inspect desktop, portrait and landscape without altering runtime/session on resize. Save images in `docs/design/umbral-v2/screens/garden-fix-*`. Revise if masses remain visually disconnected. Stop after this garden; remaining district garden types (restrained temple, household courtyards, market herbs, natural canal banks, low plaza edges) are future proposals only.

## Implementation and review evidence

- Implemented 152 map objects (208 before correction), with original building/district blocks verified unchanged byte for byte by `packages/shared/scripts/garden-test.mjs`. The low planting sprites have no blocking footprint; sacred tree, water, shrine and incense use shared collision.
- PixelLab trials `4c1de8a4-e576-45f7-a58b-9e13e43e495f` and `f53f068d-468f-48e3-9e06-d64ab4cb49c1` were rejected on visual inspection: they enclosed empty ground and still read as miniature garden islands. Raw outputs and prompts are retained, excluded from runtime.
- Selected sprite: `27380409-63ab-478e-b95b-943ab1266bb8`, `raw/garden-thicket.png`, prompt `garden-thicket.prompt.json`. Native 128 × 48; alpha crop (3,4,124,43) yields 121 × 39; no resampling. Runtime asset `garden-understory` is reused three times with different offsets and mirroring, alongside the existing sacred tree, mature blossom, mossy shrine and lotus pads.
- `pnpm typecheck`, `pnpm build`, `pnpm test` passed. Tests cover preserved district objects, 0.9-unit route clearance, offering/house/tree/pond approaches, trunk/water/shrine collision, unique IDs, flood-fill reachability (83%), and two-client authoritative network behavior. NPC/quest/shop systems remain prototype or future features; reserved access spots are tested.
- Browser review: desktop 1280 × 720, portrait 390 × 844, landscape 844 × 390. One canvas remains after viewport rotation; online status remains visible. Real-device touch/performance has not been checked.
- Captures: `garden-fix-wide.jpg` (maximum permitted zoom-out, city walls remain the camera limit), `garden-fix-normal.jpg`, `garden-fix-close.jpg`, `garden-fix-portrait.jpg`, `garden-fix-landscape.jpg` in `docs/design/umbral-v2/screens/`. HUD panels were collapsed using existing controls for review. Development review query only controls camera framing, not player position.
- **Awaiting user visual review.** No other district garden has been redesigned.
