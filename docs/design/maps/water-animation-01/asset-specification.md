# Water art production specification

Prototype reuses the exact existing `tilesets/water-grass.png` surface and its illustrated Wang shore geometry; `waterfall-01.png` is an existing Phase C candidate. Source hashes are in the runtime manifest. No new image generation, GPU job or paid credit consumption in this task.

These native-art improvements remain desirable for the requested premium target; do not substitute noise or bland geometry:

| Asset | Native specification | Artwork requirements / integration |
|---|---|---|
| River surface | 64×64 seamless PNG, 3 authored variants | dark teal; long irregular ripple clusters, occasional restrained ivory foam strokes; opposite edges agree; upper-left light; readable at 2× world scale |
| Pond surface | 64×64 seamless PNG, 3 variants | mostly stationary cloudy water, gentle broad clustered highlights, no strong diagonal flow or TV-static grain |
| Cursed swamp surface | 64×64 seamless PNG, 3 variants | muddy blue/deep olive, sparse jade shimmer; neutral flow direction so the renderer controls motion |
| Grass/mud/water Wang edges | 16×16 native pieces, all 16 corner masks per material pair | continuous wet bank, roots/reeds/pebbles on land side; publish explicit water coverage masks and anchors; no moving land pixels |
| Foam/ripple sprites | 8 frames, 32×16 horizontal ellipses | original hand-painted pixel clusters; same volume/centroid around loop; contact foam distinct from open-water rings; transparent RGBA |
| Waterfall modules | lip/body/base, 32×96 body or matching authored cliff dimensions | downward ribbons; body top/bottom compatible; separate receiving foam footprint and optional mist; fixed bank silhouette; no sky-blue glossy bloom |

Palette proposal for this water pass: deep `#0c2024`, body `#1a3d40`, shadow `#142c30`, muted jade highlight `#3d6660`, sparse foam `#91aaa0`. Keep native asset scale2, 16px/world-unit geometry, Classic RO elevated overhead perspective and crisp nearest filtering. Physical fall height must match an authored elevation edge; the preview's fall sprite is an asset-motion test, not collision-ready waterfall geography.

Suggested asset prompt: “Original dark Southeast Asian shaman MMORPG water surface, elevated overhead plane, crisp hand-painted pixel clusters, dark teal and muddy blue, irregular quiet ripple groups, restrained aged-jade highlights, no noise, no text, no baked glow, seamless opposite edges, native64×64.” Motion should derive from one synchronized renderer timeline rather than inconsistent separately assembled surfaces.

Do not approve or queue these future assets on the user's behalf. Existing mask, collisions and clock remain usable when the new illustrations are supplied.
