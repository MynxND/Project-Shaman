# Shaman Village — reference rebuild 01

## 1. Identity and authorization

2026-10-14, draft; user requested a playable village before extending the direction to the other three reference panels. `reference.png` and `source-request.txt` are the supplied source. No visual approval is implied.

Preserve stable runtime identity `umbral-capital`, its 80×60 bounds, spawn (40,36), eleven NPC definitions and their coordinates/services, safe zone, southern portal and arrival. The original capital source remains intact; a separate layout module records this revision. The existing capital's institutional functions remain in village buildings rather than being deleted. Forest combat and quests remain in `whispering-spiritwood`. The other three maps in the local 8793 review are proposals, not registered authoritative maps; they must not be described as connected gameplay.

## 2. Experience and scale

World units remain 32 screen pixels, 16 native asset pixels, asset scale 2, speed 4 units/s. Main routes 4 units wide; service approaches 2.4–3; pier 2.4. Spawn faces the sacred rooted totem; the ring has west/east exits leading to training and market. Southeast houses frame the return route to the original gate. Judge at gameplay zoom 1 and overview, desktop 1280×900, portrait 390×844, landscape 844×390.

## 3. Terrain and zones

North up; scale below in world units, no whole-layout scaling.

```text
0   dense forest shoulder — elder ritual lodge — NE houses
15  pond + sacred garden      /       / garden route
25  training lodge       TOTEM        smith + market huts
35  practice yard     ritual ring     market courtyard
45  waterside pier    southern lane   community homes
55  reed bank         original gate   teleporter clearing
60
    0             20       40       60             80
```

| Region ID | Bounds / shape | Level | Material and purpose |
|---|---|---|---|
| forest-shoulder | authored northern and outer clusters | 0 | grass/root understory, frame clearings |
| ritual-ring | curved path through (31,29),(34,38),(42,42),(49,35),(48,26),(40,23) | 0 | aged dirt with stone approaches |
| western-water | original west canal and southwest water strip | 0 | teal water; retain blockers/bridge gap |
| service-courts | around original NPC positions | 0 | compact dirt/stone masks, leave interactions clear |
| southern-return | original gate to spawn, curved central route | 0 | stone/dirt, preserve portal corridor |

Zones: ritual core, elder lodge, training yard, market, waterside dwellings, gate approach. Dense forest belongs to outer shoulders and gaps between these zones, never the clear interaction circles.

## 4. Navigation graph

Required nodes: spawn (40,36), keeper (37,33.8), guide (42.8,38.8), elder approach (44.6,21), instructor approach (13.2,35.6), herbalist approach (53.6,33), talisman approach (71.2,31.4), trader approach (64.6,42), storage approach (52.6,38), smith approach (60.6,26.8), teleporter approach (46.6,54.8), guard approach (34.4,53), portal (40,59), arrival (40,55.6), west bridge (16,45), east bridge (64,45), pier head (8,43).

Edges: spawn↔ring west↔training (width 4), spawn↔ring east↔market (4), ring north↔elder (3), market↔smith (2.6), market↔equipment (3), spawn↔southern lane↔gate (4), west service↔west bridge↔waterside homes (2.4), east service↔east bridge↔community (2.4), west bridge↔pier head (2.4). All two-way and level 0. Actual route distances/times and failed connections must be measured by shared collision sampling before delivery; conceptual straight-line distances are not validation.

## 5. Required locations and placement

| Stable ID | Asset | Base | Footprint | Entrance / approach |
|---|---|---|---|---|
| plaza-spirit-pillar | rooted sacred totem, new | 40,31 | 4.2×2 | south, keep keeper west and spawn south clear |
| temple | thatched elder lodge, new | 40,15 | 8×3 | south to elder NPC |
| training-hall | thatched lodge, new | 19.6,28.6 | 7.6×3 | south to instructor yard |
| herbal-brewery | thatched hut, new | 56.4,28.8 | 6×2.6 | south to herbalist |
| talisman-shop | thatched hut, new | 67.2,29 | 6×2.4 | south/east to equipment NPC |
| pier | existing timber bridge modules | west bridge shoulder | walk-through | original water blocker gaps only |
| city-gate | ritual timber gate asset audit | 40,58 | preserve original gate passage | original south-gate |

Other named structures retain stable IDs where replaced. Decorative-only huts have no interiors; NPC services stay active outside. Roof bounds use measured PNG dimensions/anchors, not blocking rectangles. Failed placements must be listed explicitly in validation, never silently skipped. Interaction and spawn clearances take priority over props.

## 6. Water, vegetation and placement masks

Retain original canal geometry, blockers and bridge gaps for this slice. A more natural shore requires authored terrain/collision changes together, not water art over walkable ground. No cliffs or new elevations in village. Tropical canopy clusters are explicitly authored north/west/east and behind dwelling groups; undergrowth follows those groups. Keep 1.5-unit NPC service circles, 4-unit southern corridor, bridge heads, spawn and plaza loop clear. No random scatter decides trees/buildings. Seeded variation may choose terrain artwork inside fixed masks only.

## 7. Asset inventory and production plan

| Kit | Reuse / missing | Action |
|---|---|---|
| grass/dirt/moss cobbles | illustrated terrain-quality 01 available | reuse nearest Wang transitions and seed 31414; inspect grass repetition |
| rooted skull totem | missing | generate isolated transparent sprite from supplied reference; save prompt/source/native output |
| thatched service huts | missing | generate small hut and elder/training lodge separately; no pagoda substitution |
| tropical trees/bamboo/fern/moss rock | existing | inspect palette and density at actual camera before choosing |
| pots/stalls/incense/red cloth/fences | existing | reuse suitable timber/ritual assets with exact anchors |
| rough timber skull gate | existing gate may be off-reference | inspect; explicitly defer if unsuitable, never call it finished |
| swamp stilt hut/boardwalk/reeds | later map | distinct production kit after village direction review |
| ruin walls/stairs/falls | later map | missing coherent boundary/corner kit, not random rock substitution |

Current generation choice: built-in imagegen skill for isolated missing village artwork. No local GPU queue or PixelLab credit purchases. Source and prompts stay under this directory. Assets are candidates until rendered inspection. Required tile patches include convex/concave grass-dirt-road and existing water/bridge joins.

## 8. Layer and authority mapping

Terrain → shared terrain paints / cached Wang texture; GroundDetail → separate visual decoration, never collision; Objects → shared objects with base-Y depth, measured image anchors and blocking footprint; Gameplay → unchanged NPC/portal/safe zone definitions, shared collision consumed by Colyseus and Phaser; review guides → debug only. React retains HUD/services, Phaser camera/world, Colyseus movement and interactions. No baked scene backdrop replaces the navigable world.

## 9. Gameplay locations

Preserve all `UMBRAL_NPCS`: guide, keeper, elder, instructor, herbalist, talisman, trader, storage, smith, teleporter, guard. Preserve their role, sprite, dialogue, coordinates, service contract. Preserve `south-gate`→`whispering-spiritwood/village-gate`, arrival (40,55.6), whole-city safe zone. No town monsters added; existing forest monster types/spawns/quests untouched.

## 10. Verification and status

Before/after actual game screenshots, label-off overview, normal camera and mobile required. Shared navigation tests must cover spawn↔every NPC approach/bridge/portal, spawn and arrival unblocked, reciprocal portal, new asset alpha/anchors, source gameplay invariants. Run typecheck/build and existing relevant NPC/network tests. Inspect player behind/in front of huts/totem/canopy. Record FPS and browser errors as observed samples, not guaranteed performance. Status: plan drafted; generation, placement, rendered visual and network verification pending. Other three reference panels remain subsequent work after first village direction review, as requested.

Implementation update: five isolated sprite families exported with native dimensions/anchors in asset-receipt.json; original object IDs required by services remain. Shared navigation validates fifteen destinations and five citizen routes; NPC network and forest round-trip/combat tests pass. Actual normal-camera/overview/desktop/portrait/landscape screenshots inspected. Browser movement opened keeper services and reached elder talk prompt around the ritual enclosure. Village light and overview centering corrected after inspection. Observed desktop sample approximately60 FPS, not a device guarantee. See visual-review.json and README.md for remaining waterline/kit/occlusion work. Full roof-bounds/support audit and label-off art approval remain open; technical passes are not user visual approval.
