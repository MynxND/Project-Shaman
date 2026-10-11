# Classic RO camera correction

User explicitly corrected the map camera to Classic Ragnarok Online on 2026-10-08 and requested a new PixelLab map concept.

## Camera contract

Elevated three-quarter overhead view: visible building roofs AND upright front walls/doors. Continuous town terrain fills the screen. Broad horizontal paving rows and town streets; do not default to a 45-degree diamond island layout or a directly-overhead architectural plan.

Original Global Shaman sanctuary: warm stone ritual plaza, small spirit fountain, Medium academy, talisman shops, turquoise spirit lights, gardens and spirit gate. No copied RO geography or assets.

## Generation

Provider: PixelLab MCP, create_image_pixflux, 400x300 opaque concept, one generation per draft. Prompt files and job/results are saved alongside this document.

Draft v1 de7313b7-8ac0-415a-b85e-1930af702ead was rejected during review: view too directly overhead and roofs too diagrammatic. Kept for provenance, not used in the scene.

Draft v2 f0ada808-8515-4701-b3d2-ad352a385fc5 completed and reviewed: sloping orange roofs, visible doors/walls, flat town plaza and crossing streets. Saved as apps/client/public/assets/pixellab/spirit-town-ro-v2.png and used in the preview. This is the selected draft for review by the user, not a final production map.

This is a raster map concept for camera/composition, not a playable collision map or a 3D RO renderer. Next implementation must define ground/object layers, walkability, depth and sprite anchors separately.

Validation: build/strict typecheck passed. Browser checked at 1366x768, 390x844 and 844x390, no console errors during review; static character repositioned to keep it clear of the HUD and fountain. Desktop screenshot: docs/previews/ro-town-desktop.jpg. No real-device gameplay or movement tested.
