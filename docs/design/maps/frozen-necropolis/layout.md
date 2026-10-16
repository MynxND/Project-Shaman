# Frozen Necropolis — Koschei review arena

Implemented review arena, not approved Russia geography. Boss5 only.
48×48 world units,32px/unit. Elevated three-quarter continuous rectangular
world, upright regional facade. Actual review GameRoom, no atlas/travel changes.

## Composition and graph
North ruined stone crypt landmark at24,10, combat court x7–41/y11–38, safe
arrival24,42. Open two-way entry24,38. No stairs, elevation changes or bridges.
Clear combat rectangle; all relic points level1, nonblocking with2unit clearance.
Oak16,27 → chest20,30 → hare24,31 → duck28,30 → egg32,27 → needle24,25.
Total route~30units =7.5s at WALK_SPEED4, plus interaction and attack budget;
ultimate32s window must be verified with actual walking and normal attacks.
Boss24,20; finale refuge24,35 radius2.8. Every point connects to both court sides.
These IDs are required; no hash scattering or whole-layout scaling.

## Placement and layers
Crypt base24,10 footprint18–30/y3–10; roof stays inside world. Four weathered
tombs at8,13/40,13/8,36/40,36, outside combat routes. Existing regional dark
stone/snow materials; frozen pools outside x6–42 court boundary, localized mist
at4,18/44,30 only. Sparse snow is cosmetic, collision shared and independent.
ImageGen crypt/tomb/frost floor/mist and relic sprites are generated and inspected.
All containers and released animals are interaction/combat objects, no permanent
blocker or moving chase target. Shrine rings are not portals.

## Validation
All required relic IDs placed and route walked in actual GameRoom; solo normal
attack counter~14.3s before32s deadline. Desktop1280×720 and emulated390×844/
844×390 inspected. Failed placement: source crypt crosses nominal grid midpoint;
explicit measured cuts preserve its roof/stairs and remove floor tile gaps.
Failed framing: desktop/short-landscape top HUD obscured crown; scoped lookahead,
cover-clamped zoom and guest-badge relocation corrected it without collision or
whole-layout scaling. Sources and pixel cuts retained in pack_art.py/manifest.
Existing maps/NPCs/monsters/portals remain unchanged. Technical tests and our
visual inspection do not grant user art approval. See boss README for evidence.
