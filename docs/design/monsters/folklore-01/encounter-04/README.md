# Folklore encounters04 — ranged presentation and national habitats

User reconfirmed the six Ireland enemies stay in Ireland under fictional game lore. This does not assert historical folkloric origin. No new sprite generation or alteration of repair03 pixels.

40 species:17 ranged,23 melee.34 species already occur in50 additive bindings across20 live maps; their placements were correct against the current world atlas and remain unchanged. Korea6 are assigned to two existing planned Korean atlas locations, neither an authoritative game room. No false live status, new maps, geometry, portals, NPC changes or original resident replacement. Monsoon Ruins is Japanese in the current atlas.

## Combat

Ranged roles reuse existing directional attack poses. Impact pose controls authoritative launch time (3-pose fallback1,4-pose fallback2 unless explicitly authored). Server snapshots origin and aim, broadcasts flight duration and applies existing arrival/dodge logic; walking more than1 world unit away from aim misses. Range4.2, speed7, aggro5.5 and leash7.5 are provisional encounter tuning, not approved lore. Melee reach and other numerical stats remain unchanged.

The shared nine-rectangle pixel orb uses existing spirit jade, binding crimson and yantra gold family palettes. Phaser renders the body-origin flight toward the fixed launch-time target with two small trails; presentation does not calculate damage. Integer coordinates,48-flight cap, deadline disposal and scene shutdown cleanup. Legacy speed-only projectiles retain their original presentation. No passive VFX, gradients, artwork generation, or new faction symbols.

Preview: /monsters/folklore offers country/role filters, existing move/attack/death playback in8 directions and the extended projectile timing slider. Sprite frame labels still show actual pose counts; extra flight time is not extra artwork. Planned habitats are explicitly marked in Thai.

## Validation

Passed: workspace typecheck and production build (SHAMAN_BUILD_WORKERS=2); shared regressions; existing combat-system tests; folklore manifest/direction/ground/impact tests; isolated20-room resident/walkability and Phi Pop combat/death network test. encounter-test tests all40 habitat mappings, cross-country rejection and17 ranged types each for stationary-hit and dodge (34 authoritative timing cases). orb-test tests actual presentation class lifecycle, immutable target, pixel coordinates, flight deadline and cap.

Desktop and mobile portrait/landscape review UI visually inspected; screenshots accompany this report. Desktop proof shows jade balls in8 directions; mobile shows binding family and planned Korea label. These screenshots establish preview appearance, not final user artistic approval. New orb appearance in the actual Phaser game has not been manually inspected this revision; its integration and lifecycle are covered by code/tests.

Reproduce after shared/server builds:

~~~sh
node tools/monsters/folklore/encounter-test.mjs
node tools/monsters/folklore/orb-test.mjs
node tools/monsters/folklore/test.mjs
node tools/monsters/folklore/network.mjs
~~~

Canonical input: ../encounter-04.json. publish.mjs validates and emits public encounters.json, shared habitats and monster definitions; preserve the repair03 art workflow.

## Habitat registry

| Enemy | Game nation | Role | Habitat/status |
| --- | --- | --- | --- |
| phi-pret | thailand | melee | lantern-paddy (live), monsoon-marsh (live) |
| phi-pop | thailand | melee | whispering-spiritwood (live), lantern-paddy (live) |
| phi-krasue | thailand | ranged | moon-mangrove (live), monsoon-marsh (live) |
| phi-krahang | thailand | melee | lantern-paddy (live), mountain-spirit-sanctuary (live) |
| onryo | japan | melee | cedar-torii-shrine (live), monsoon-ruins (live) |
| yuki-onna | japan | ranged | snowbound-torii (live) |
| kuchisake-onna | japan | melee | monsoon-ruins (live) |
| rokurokubi | japan | melee | cedar-torii-shrine (live), spirit-waterfall (live) |
| ubume | japan | ranged | spirit-waterfall (live) |
| gashadokuro | japan | melee | monsoon-ruins (live) |
| cheonyeo-gwishin | korea | ranged | moon-ritual-ridge (planned) |
| mulgwishin | korea | ranged | spirit-funeral-road (planned) |
| dalgyal-gwishin | korea | melee | spirit-funeral-road (planned) |
| dokkaebi | korea | melee | moon-ritual-ridge (planned) |
| gumiho | korea | ranged | moon-ritual-ridge (planned) |
| chonggak-gwishin | korea | ranged | spirit-funeral-road (planned) |
| rusalka | russia | ranged | frost-pine (live), taiga-blood-trail (live) |
| leshy | russia | melee | taiga-blood-trail (live) |
| domovoi | russia | melee | frost-pine (live), winter-seal-kremlin (live) |
| kikimora | russia | melee | taiga-blood-trail (live), winter-seal-kremlin (live) |
| vodyanoy | russia | ranged | taiga-blood-trail (live), winter-seal-kremlin (live) |
| bannik | russia | melee | winter-seal-kremlin (live) |
| draugur | ireland | melee | stone-oath-moor (live) |
| afturganga | ireland | melee | golden-spiritwood (live) |
| utburdur | ireland | ranged | willow-wake-village (live) |
| uppvakningur | ireland | melee | stone-oath-moor (live) |
| sending | ireland | ranged | golden-spiritwood (live) |
| tilberi | ireland | melee | willow-wake-village (live) |
| jiangshi | china | melee | mist-bamboo (live), cloud-tea-slopes (live) |
| nu-gui | china | ranged | mist-bamboo (live) |
| e-gui | china | melee | cloud-tea-slopes (live) |
| shui-gui | china | ranged | mist-bamboo (live), cloud-tea-slopes (live) |
| wutou-gui | china | melee | cloud-tea-slopes (live) |
| huli-jing | china | ranged | mist-bamboo (live), cloud-tea-slopes (live) |
| draugen | norway | melee | storm-fjord (live), spirit-timber-harbor (live) |
| huldra | norway | melee | storm-fjord (live), aurora-pass (live) |
| nokken | norway | ranged | storm-fjord (live), aurora-pass (live) |
| fossegrim | norway | ranged | storm-fjord (live) |
| nisse | norway | melee | spirit-timber-harbor (live) |
| mare | norway | ranged | aurora-pass (live) |
