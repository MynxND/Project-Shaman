# Norway live adoption / 2026-10-15

USER authorizes all three reviewed maps into authoritative gameplay. No new art generation. Enter from **north edge of Snowbound Torii at x55** via its existing north garden branch, then travel east across the Norway maps. Walk back west to return; Fjord west returns to Snowbound north.

| Boundary | Source trigger | Destination arrival | Return arrival |
| --- | --- | --- | --- |
| snowbound-torii → storm-fjord | (54,0) 2×2 | (4,65) | snow(55,4) |
| storm-fjord → spirit-timber-harbor | (94,23) 2×2 | (4,51) | fjord(92,24) |
| spirit-timber-harbor → aurora-pass | (86,18) 2×2 | (4,65) | harbor(84,19) |

Each arrival is outside the destination trigger with a6×6 safe zone. All previous Japanese portals, NPCs, residents, objects, blockers and terrain remain; Snowbound gains one additive north approach/gate/safe patch. Norway reviewed layout/art/fog unchanged except short dry boundary roads and gameplay exclusions for bank decor. Native water geometry is retained. NORWAY_MAPS feeds existing MAPS/room registration; MapRenderer routes real world scenes through the same regional art as review, using the FULL gameplay map for ecology exclusions. Colyseus decides travel and signs tickets; no client-only portal simulation.

## Residents and services

3 NPCs/map: healer (talk/heal through existing NPC service), keeper/guide and watch/guard. All use existing owned traveling-service sprite art; this is not a claim of new Nordic NPC artwork. Each map has three explicit camps with3 residents each,27 total across Norway. New stable local monster IDs alias existing owned spirit-flame/shadow-macaque/clay-guardian sheets; original species/stats/images unchanged. Passive wisps, aggressive shadow/guardian variants. Levels55/60/65;60/65/70;65/72/80 and HP/ATK/EXP/drop values are provisional playable balance, not approved lore. NPC/monster placements avoid arrival and service clearings, all service approaches/main/side routes pass movement tests.

## World atlas

Preserve original33 nodes and add timber harbor:34 total,12nations,18live/16planned. Norway chain matches actual Snowbound→Fjord→Harbor→Pass portals instead of a fictitious direct mountain→Norway link. M details read actual NPCs/residents from shared catalogs. Old proposal levels/themes remain historical; current pass is still shore-level with no climbable highlands or aurora sky.

## Verification

Isolated staged build/typecheck and shared suite pass. Geometry checks compare reviewed objects/blockers/dimensions and original paint prefixes; reciprocal clear arrivals, service support/reachability, main+all side roundtrips, spawn sampling and existing Japan/Indonesia regressions pass. Camps have360/360/248,439/399/141,422/400/398 viable half-unit samples respectively. Ecology source geometry immutable; all20 registered maps including2 labs test successfully. Atlas/details34-record source tests pass.

Browser localhost3000 actual guest game (not local review): native Left/Up/Right movement traverses all six directions across the three boundary pairs. Observed map/arrival labels match the table with no immediate bounce. Desktop1280×900 overview screenshots for each map show water, localized mist, regional ground/objects and synced actors. M shows18live/16planned and all three Norway details, actual NPC/monster names and linked neighbors. Portrait390×844 and landscape844×390 preserve online map/position with no horizontal overflow; physical devices not tested. Normal player-camera and service dialog checks recorded alongside screenshots.

Authoritative network test verifies movement routes,9 residents/map, two-client observation, healer talk/heal, skill/basic kill and EXP; final roundtrip status is in network.json. Initial fixture had a fixed20-second limit for any straight route segment and stopped an80+unit walk; limit now derives from segment distance/WALK_SPEED plus network margin. No game movement speed or collision was changed to make this pass.

Sources: three original map/plan/layout briefs, live01-map.json for each, geometry.json, network.json and screens/. Prior preview README/evidence retained as history. This adoption does not assert new final visual approval for all assets or physical-device performance.
