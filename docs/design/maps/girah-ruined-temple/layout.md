# Girah ruined temple — boss review arena layout
Status implemented review arena, original provisional Indonesia geography, not atlas/portal adoption.
48x48 world,32px/unit,WALK_SPEED4, elevated three-quarter continuous rectangle.
Purpose: Calon Arang combat and quarantine routing; no new NPC/travel scope.
Zones: south arrival y40..46, clear combat court x7..41/y11..38, northern Javanese
split-brick sanctuary at24,10, volcanic jungle/lotus drainage outside court.
Primary landmark: original red-brick candi gate and cursed floral source24,26.
Required IDs: arrival24,42; source24,26; boss24,20; quarantine-west12,33;
quarantine-east36,33; effigies nw18.5,21/ne27,21/se28.5,27.5/sw20,27.5.
Graph: arrival → south refuge24,35 → source24,26; source connects to all4 effigies
via clear central routes >=3units wide; both quarantine wells connect south route.
Four edges form a skew diamond between15,24 /22,18 /32,24 /25,31.
These are deliberate ritual geometry, not grid scatter. Broken effigies are
attack targets, not collision walls. No root closes the central approach or refuge.
Gate/trees/ruin masses frame the court outside combat space; no tall prop over
quarantine, source, arrival or view of enemy feet. Terrain/collision independent.
Required placements cannot silently fail: validate every listed ID and BFS route.
No whole-layout scaling. Missing modular art initially temple gate/effigy/well;
reuse owned Indonesia ground and perimeter vegetation with explicit source.
Technical tests are not art approval. All10 required placements are reachable; evidence/layout.json records BFS validation. Failed placements: none. Visual approval remains pending.
