# Indonesian ground detail04 — authorized2026-10-15

Problem: source352px terrain cells were downsampled to ash128/road64, then displayed at2x. The native ground was16px/world unit, losing original crack/grain detail before display.

Implement32px/unit ground at1x with ash256/road128 source samples and2x quilting patch/overlap dimensions. Maintain physical stone size, source artwork, terrain geometry, water16px/unit at2x, all props/anchors/collision/rooms/portals/inhabitants. Composite one material plane at a time to limit peak memory. Preserve nearest filtering; no blur/noise or invented sharpened details. Existing China quilting default remains1x and must match the old output byte for byte.

New generations0. This preserves more original painted detail; it does not claim unlimited source resolution or a newly hand-painted tileset. Inspect actual before/after and mobile runtime before delivery. Ground-only presentation revision; no new map composition or vegetation placement.


Actual desktop game inspection: before-game/after-game capture the same Estuary ford at approximate43,36 and1280×720. Water/actors/HUD/time vary; not a pixel-aligned photographic comparison. After image shows smaller resolved crack/grain pixels and coherent stone outlines. Ashwind spring and Ember landmark additionally inspected at60FPS snapshot (not a benchmark). Comparison slider0/100 endpoints tested; phone390×844 no horizontal overflow. Live guest walking to ford and off-road water collision retained.

Tests: test-indonesia-ground-detail (fixed legacy SHA + source-color/opacity/seed invariants), test-china-art, test-native-terrain, test-indonesia-live; pnpm build/typecheck. Region data/PNG/camera/server code not modified.


Phone-sized actual guest game:390×844 spawned Estuary4,20 and walked to7,20; resized844×390 with session retained, no horizontal document overflow or browser errors. Screenshots game-phone/game-landscape. These are desktop-browser viewport checks, not physical-phone memory/performance certification. Regional ground source/frame scaling changes are shared by live and preview.
