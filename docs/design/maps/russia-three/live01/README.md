# Russia live adoption — 2026-10-15

User authorized all three Russian previews into actual gameplay. Chain: Willow Wake Village east → Frost Pine west; Frost Pine east → Taiga Blood Trail west; Taiga east → Winter Seal Kremlin west. Reciprocal signed-ticket edge travel uses the existing authoritative room system; safe arrivals sit outside triggers. No direct mountain shortcut or fake travel to planned maps.

| Map | Provisional levels | West arrival | East arrival | NPCs / residents |
| --- | --- | --- | --- | --- |
| frost-pine |60–75|4,63|88,23|3 /9|
| taiga-blood-trail |70–85|4,60|90,20|3 /9|
| winter-seal-kremlin |75–90|4,63|none|3 /9|

All reviewed objects, blockers, source artwork, native water masks, main/side routes and regional material/vegetation placements are preserved. The same Russia renderer drives game/review: animated open water, localized drifting basin mist,64 bounded cosmetic snowflakes on frost/fortress, none on thaw-taiga. No new generation or image edits. Bank decorations remain cosmetic. Flat world/interiors unchanged; no new weather gameplay or ice-walking system.

Three NPC services/map use owned herbalist/elder/guard sprites. Nine residents/map use existing complete wisp/strawling/guardian animation sheets under new explicit regional names and provisional60–90 stats; no unique Russian monster art or new player outfit is claimed. Existing combat, rewards, ticket inventory persistence, NPC service, collision and other country maps remain in place.

## Validation

Isolated selectively staged snapshot pnpm build/typecheck and shared gameplay suite passed. test-russia-live verifies original objects/blockers/dimensions/material water, reciprocal safe gates, reachable service fronts, all main/side movement roundtrips and viable camp spawns. test-russia-three verifies original required landmarks/native wet samples/source crops/immutable ecology. Existing Ireland/Norway/Japan/Indonesia, world atlas/details and shared edge/shore regressions pass. One atlas expectation was updated35→36 for the adopted third Russian node; no runtime failure was hidden.

Authoritative two-client real server test on owned port2597 passed all6edge trips, healer talk/heal on3maps,9residents each, all reviewed main-route destinations, observer synchronization, skill/basic kill/EXP and carried inventory/silver. See network.json. Server stops at test completion.

Actual game browser onlocalhost3000 inspected all3 rendered maps, six native-arrow boundary trips, F NPC dialog and M details showing real residents/NPCs and24playable/12planned. Normal follow-camera walk4,63→10,63;390×844 portrait/844×390 landscape retain online session with no horizontal document overflow. Water/mist and snow use exact previously inspected preview presentation. Screens/ and browser.json record evidence. Physical devices and final user art approval remain unverified.

Atlas preserves old35nodes and adds winter-seal-kremlin:36nodes/12nations/24live/12planned. First2Russia nodes are adopted, fictitious mountain→Russia planned link replaced by actual Willow→Frost edge chain. Endgame route remains planned and labelled as such.

Commands: node tools/map/adopt-russia-live.mjs; pnpm --filter @shaman/shared build; node tools/map/build-world-atlas.mjs; node tools/map/build-world-art-details.mjs; node tools/map/test-russia-live.mjs; node tools/map/test-russia-network.mjs. Production build/typecheck on isolated snapshot excludes unrelated pending character/skill work.
