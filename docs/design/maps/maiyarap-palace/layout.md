# maiyarap-palace — Map Design Brief & Layout

Draft review arena, 2026-10-16. User requests Boss13 only. Provisional Thai-inspired
underworld palace, not an approved addition to world geography. Other bosses,
existing map layouts and their portals remain unchanged. Actual GameRoom entry by
?map=maiyarap-palace; world-network portal adoption is outside this boss review.

## Experience / scale / terrain
48×48 world units,32px/unit, continuous rectangular elevated overhead perspective.
Z0 south arrival (24,42), Z1 open encounter court x7–41/y11–38, Z2 palace backdrop
north y0–10. No stairs or deceptive walkable height. Aged dark stone court bordered
by water gardens; facade blocks match north blockers. Generated facade is a prop,
never a collision-ready background. Existing Thai ground/water kit reused.

## Required places and routes
|ID|Position|Purpose|Connectivity|
|---|---|---|---|
|arrival|24,42|safe spawn|court entry at24,38|
|court-entry|24,38|engage boundary|open two-way court|
|lotus|16,29|first dream symbol|entry, knot, source|
|knot|24,33|second dream symbol|lotus, flame|
|flame|32,29|third dream symbol|knot, source|
|source|24,25|destroy sleeping spell|all symbols, boss|
|throne|24,22|Maiyarap starting position|source, entire court|
|finale-refuge|24,35|gold safe pocket|entry and both flanks|

All puzzle points share Z1 and are directly reachable with at least4units clearance;
no blockers, props or permanent hazards occupy those edges. The18unit symbol walk
plus~9unit source approach fits the ultimate counter window at actual movement
speed; measure and adjust the deadline after testing. Arrival exits/atlas links
are intentionally not fabricated. Required locations explicit; no failed placement
may be silently dropped. No whole-layout scaling or grid/hash prop scatter.

## Placement / collision / art
North facade anchored24,11; footprint x18–30/y4–10 behind combat. Four perimeter
pillars at8,13;40,13;8,36;40,36, decorative only outside routes. Three shrine props
at matching symbol nodes are nonblocking interaction pads. West/east water gardens
x2–5 and43–46, unwalkable perimeter; no combat arena water collision change.
No density scatter; per-object authored positions. Material transitions use existing
terrain connections, intentional palace stone boundaries remain engineered.

## Review
ImageGen facade/shrines are generated and inspected in the actual game. The solo
symbol/source counter succeeds at about17.7s before the22s final warning; real
walking and normal attacks are used. Desktop/portrait/landscape checked; user
art approval remains pending. Technical tests do not grant visual approval.
Rejected placement: facade width26units at24,11 placed its roof north of the
world boundary. Corrected that prop alone to12units (~10units tall), keeping
its11unit base anchor, collision, court, routes and all puzzle positions unchanged.
This is not whole-layout scaling. Source atlas uses explicit measured cuts
because the generated facade occupied more than one nominal cell.
