# Modular equipment validation — 2026-10-09

**User visual review failed:** bronze-ward changes the character's face/hair/proportions. Passing structural and network checks did not validate identity. Rejected outfits are now excluded from runtime manifests, look serialization and equip transactions; tests cover stale look/profile rejection. The previously recorded clothed screenshots below are historical failed-art evidence, not accepted results. Automatic generation has been stopped.

## Behavior checked

- Shared equipment unit tests: ownership, valid slot, immutable profile update, unequip, look encoding/decoding and removal of unavailable equipped items.
- Two-client authoritative room test: initial equipment, weapon/head/outfit changes, peer synchronization, malformed or unowned item rejection, and equipment changes during Spirit Bolt without cancelling its release. Currency does not change when equipping.
- Full repository behavioral suite passed after the equipment protocol and renderer integration.
- TypeScript and production build passed, including `/characters` and `/characters/responsive`.
- Actual browser bag/status/world: bronze outfit, bamboo hat and bone staff worn simultaneously; status portrait matches the world look. `screens/live-equipped-status.png` and `screens/live-equipped-world.png`.
- Frame inspector: manual attack frames preserve the matching weapon attachment frame; cast staff tilted away from the face. `screens/layered-attack-preview.png`.
- Browser viewport harness: portrait/landscape keep the same character canvas runtime id and selected outfit, without horizontal overflow. The live world keeps its status sheet open across the same orientation change. This is browser layout coverage, not a physical phone or touch test.

## Native art review

`coverage.json` records packaged coverage as generation proceeds. `reviews/*-all-directions.png` and `.gif` are contact sheets and animated overviews, generated from retained PixelLab frames and the authored weapon pivots. Pending cells are explicit. Male base and the available male bronze/female base views have been inspected for identity, direction and held weapon placement. Final complete-set review must follow packaging of the remaining female sets.

Generated bodies may not exactly follow requested skeleton joints. The structural verifier checks dimensions, transparency, distinct animation frames and valid attachment data; it cannot establish aesthetic approval or perfect anatomical alignment. Final art acceptance remains with the user.

## Explicit gaps

Independent hair/top/pants require reconstructed artwork. Equipment combat bonuses, durable inventory persistence and physical mobile control/performance testing are outside this completed integration pass.
