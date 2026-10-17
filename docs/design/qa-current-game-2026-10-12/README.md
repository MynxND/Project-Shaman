# Current-game QA — roadmap restart, 2026-10-12

Scope: start the active roadmap's first milestone, preserve unrelated existing work, and separate network/renderer verification from user visual approval. No artwork generation, credits, balance changes, deployment or player database changes.

## QA-01 — verified

New `apps/client/scripts/branch-equipment-network-test.mjs` runs its own server on port 2594 with an in-memory SQLite database. A female observer stays connected while ten male guest actors join the same room, one per branch. This tests body identity synchronization, not female-renderer artwork.

For each branch it exercises real room messages and schema patches:

1. Tier 2 job advancement grants/equips the correct branch weapon; observer receives branch and look.
2. Tier 3 advancement preserves one owned copy of that weapon.
3. Eight movement/facing changes and stops keep the correct equipment on the observer.
4. An unowned foreign branch weapon is refused.
5. Unequip → starter staff → branch weapon → unequip → branch weapon yields five correct peer patches, without changing Silver.
6. Observer progression/inventory/equipment remain unchanged; ordinary safe-town HP/SP regeneration is explicitly allowed.
7. Leaving removes the actor from the observer's state.

| Branch | Weapon | Network result |
|---|---|---|
| Taiga | axe-taiga | PASS |
| Mor Phhee | knife-mor | PASS |
| Keris | keris | PASS |
| Juggernaut | axe-juggernaut | PASS |
| Miko | gohei-miko | PASS |
| Ullr Hunter | bow-ullr | PASS |
| Achan Saiyasat | staff-achan | PASS |
| Santet | wand-santet | PASS |
| Onmyoji | fan-onmyoji | PASS |
| Rune Seer | staff-rune-seer | PASS |

Totals: ten branches, 80 direction changes, 50 equipment swaps. The server process is stopped by the test; the running development server is not touched. Included in `pnpm --filter @shaman/client test:equipment`; standalone command: `pnpm --filter @shaman/client test:branch-equipment` after building shared/schema/server.

The initial test assertion compared the entire observer profile and failed on legitimate HP/SP regeneration. The harness was corrected to compare stable progression/inventory fields and independently bound HP/SP; no gameplay fix was needed or claimed.

## QA-02 — technical regression coverage added; still open

The actual EquipmentLayers renderer test now also verifies:

- swapping shield/dual-keris equipment to a single staff removes the old off-hand image;
- missing textures clear old attachments rather than leaving stale art;
- hiding the body also hides all attachments;
- 512 real legacy main-hand frames preserve original grip positions, item scale and authored front/back flags;
- existing 1,568 V3 placements and carry endpoint checks still pass.

Existing [twelve-weapon browser boards](../combat/weapon-carry-2026-10-12/README.md) remain valid visual evidence. No new browser behavior was introduced in this round: only documentation and regression tests changed. No new screenshot is presented as proof of a runtime change.

### QA-F01 — female legacy off-hand gap

`CharacterRig.syncLayers()` uses the legacy layer table for female actors. Actual `rig-v2/manifest.json` frames have one `grip/tip/front` set but no `off` hand. `EquipmentLayers` draws off-hand art only when both the item and frame have off-hand data. Consequently current female legacy data cannot supply the shield/second-keris attachment used by V3. This is an inherited data coverage gap, not a claim of a new carry regression. Do not close female shield/dual-wield visual QA based on the female network observer.

Next: inspect the owned legacy skeleton/source and actual female frames for reliable second-hand anchors; make a reversible prototype and browser proof before broad publication. Do not fabricate anchors from V3 coordinates or generate new art without authorization.

## QA-03/04/05 — remaining

- Exhaustive two-client combat effect/variant matrix remains open. Existing effect tests and representative browser smoke review do not close every visual/state interaction.
- Real coarse-pointer device input/performance remains unverified; resizing screenshots is not a substitute.
- User art approval and full temporal/high-ASPD inspection remain pending. Release report must keep those limits visible.

## Checks

PASS: dedicated branch-equipment network test, expanded carry renderer test, final `pnpm typecheck`, `pnpm build`, and `pnpm --filter @shaman/client test:equipment` (including attack timing, grants, both equipment network tests and persistence/restart). Existing module-type warnings and the deliberate account-takeover/restart connection-close messages are non-failing. See the active roadmap for the current queue. Technical checks never grant visual acceptance.
