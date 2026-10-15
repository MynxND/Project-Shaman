# Shared edge ecology — additive presentation brief
## 1. สถานะและขอบเขต
2026-10-15 user requests all existing maps share worn path/bank treatment plus little stones, grass and riparian saplings. Additive visual dressing, no new map layout/road graph/required building changes. Existing live maps and available review renderers; planned atlas nodes have no renderer/assets and are not claimed built. Existing own assets only, no new generation/GPU job. Fictional ecology art direction, not botanical identification.
## 2. ประสบการณ์และสเกล
Classic RO elevated3/4 rectangular world; U32/MAP_ASSET_SCALE2. Irregular dry-material lips and water bank toes share small hand-cut profiles. Pebbles12–20worldpx, grass16–28px, saplings30–46px; regional specimens remain subordinate to existing landmarks. Do not fill whole map or obscure actors.
## 3. ผังภาพรวมและ terrain
All source geography unchanged. Decoration mask is a narrow dry rim of authored water strokes; plants clustered by connected shoreline reaches rather than grid/hash scatter. Region group roles: Thailand humid reeds/fern/bamboo; China bamboo/pine; Indonesia sparse volcanic fern/trees; Japan cedar/grass; Snow dormant grass/snow cedar; war ruins sparse mutated saplings. No imported tropical tree kit as country identity.
## 4. Navigation graph และทางเข้า
All existing route nodes/edges/entrances retained. Exclude path centers and bridge/causeway approaches, every warp area/arrival/service safe zone, NPC radius, object footprint and cliff/stair transition. Small decorations never enter shared MapDefinition or collision. Projected placement must use shared elevation and reject uneven supporting patch.
## 5. รายการอาคารและสถานที่จำเป็น
Required IDs are every existing map.objects ID; preserve full source hashes before/after, not only counts. No required placement may disappear. Decoration IDs ecology:<map>:<kind>:<index> are cosmetic only. Rejected decoration candidates record counts/reasons, not silent removal of existing locations.
## 6. น้ำ หน้าผา และพืชพรรณ
Water animation/pond-river modes/flows remain; bank toes only cover existing wet samples, never add water on dry deck/land. Non-walkable painted bank lip remains explicit. Cliff/stair/elevation geometry untouched. Keep engineered retaining edges readable and plant-free around transitions. Five contour brushes, varied spacing, no noise textures/blur.
## 7. Asset kit และรอยต่อ
Reuse owned terrain-quality decorations, fern/mossy-rock/bamboo and original regional atlas crop frames (China/Indonesia/Japan/Snow/Violet). Original PNG/alpha unchanged; nearest filtering and uniform aspect ratio. No new generation. Source snapshots and runtime texture hashes retained.
## 8. Layer และ runtime mapping
React HUD unchanged; Phaser shared presentation helpers used by generic/China/Indonesia/Japan/ruin bindings. Original authoritative maps/collision/NPC/portals remain framework-independent. Water banks use exact display coverage including elevation projection; land patches use projected terrain height. Dispose generated textures on scene shutdown/re-entry. Decoration depth follows base y; visual layer separate from gameplay.
## 9. Gameplay locations
No new NPCs/monsters/warps or rewards. Preserve all old active gateways and service approaches. No decoration in arrival safety/monster camp access/path center. Regions with no water still get path wear; they do not get fabricated streams.
## 10. การตรวจและหลักฐาน
Before edits snapshot authoritative maps/asset hashes. Test shared wear backward compatibility, dry bridge/water modes, ecology support/exclusions/determinism/caps across all registered maps plus available extra previews. Build/typecheck and relevant existing geometry/network regression. Actual game screenshots representative hub/Thai/China/Indonesia/Japan/Snow and mountain elevation; portrait/landscape resize. Technical pass is not user visual approval; physical-device performance remains unverified. Failed placements/corrections appended as found.

Placement correction01: Hub safeZone spans the whole city; excluding all decorative pixels produced0 bank details. Permit low grass/pebbles in safe zones while retaining NPC3unit, gateway4unit, road, footprint and support exclusions. Saplings remain excluded from safe zones. This changes only decoration candidate policy, no gameplay safeZone data.

Hub planting exception: allow miniature saplings only within the existing formal garden pond mask x9..21/y7..19; NPC3unit/portal4unit/road/footprint/support filters still apply. All other service safe zones remain tree-free. Four hand-authored cluster offsets vary silhouette at connected shoreline reaches.
