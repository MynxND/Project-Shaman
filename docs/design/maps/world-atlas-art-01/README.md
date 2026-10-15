# Illustrated world atlas preview — 2026-10-14

Preview: http://localhost:3000/maps/world-atlas-art

User rejected the abstract diagram aesthetic and supplied an illustrated reference. One new original bitmap landscape now shows12 regional terrain masses, mountains, forest, sea, settlements and volcanic islands. Generated with built-in image_gen; reference and exact prompt preserved alongside original PNG/provenance. UI clips the outer decoration margin, keeping artwork/text layers independent. Country labels,30 locations and all32 existing atlas links are real SVG/DOM controls, not text/buttons baked into a screenshot.

`IllustratedWorldAtlas` is a sibling preview only. The existing M window, original atlas, gameplay map definitions, NPCs, portals and combat are untouched. Five currently registered content maps are ready;25 nodes remain plans. Preview-specific cartographic anchors align illustration and do not modify gameplay world-unit positions. Geography/new names/level bands remain proposals, not approved lore or real Earth geography.

Click/keyboard/dropdown selects a map and reveals the detail panel. It includes country, climate, landmark, activities, actual source-bound residents/NPCs where live, clearly marked proposed residents where planned, and connections. Connection buttons open details, never teleport. Returning to the picture, region filter, route toggle, zoom and scroll are real. Regional crop thumbnail is an illustration excerpt, not a screenshot of a new playable map. Nine extra detail briefs are explicitly new proposals in `build-world-art-details.mjs`; old20-map suggestions and actual MAPS/MONSTERS remain distinguished in details.json.

## Validation
Typecheck/build and atlas/detail contract checks; browser verifies30 clickable locations,12 region labels and32 route paths, planned/live data, cross-country selection consistency, route toggle/zoom, detail reveal and desktop/portrait/landscape. Screenshot evidence in `screens/`; physical phone not verified. Artwork and country placement remain user visual-review pending. No gameplay adoption or creation of25 gameplay maps is claimed.

Regenerate details with `node tools/map/build-world-art-details.mjs`; run `node tools/map/test-world-art-preview.mjs` and `node tools/map/test-world-atlas.mjs`. PNG source remains non-destructive; no paid API/CLI fallback or credential storage was used. One built-in generation, no retries.


## Gameplay adoption / readable overlay — 2026-10-14
M opens the illustrated atlas by default; local-map toggle retained. Existing PNG retained byte-for-byte, subdued in presentation rather than regenerated; larger opaque location labels alternate above/below points, solid gold/live versus dashed planned. No gameplay/shared portal or map edits in this task.

Validation: full typecheck/build; atlas30/12/5-live/25-planned and actual sourced detail checks pass. Browser online guest: M close/open, all30 detail selections, actual SVG Spiritwood click, live residents/NPCs and local-map toggle checked. Portrait390×844 dialog fits viewport with no body overflow; landscape844×390 inspected; viewport reset. Screens game-desktop.png/game-details.png/game-portrait.png/game-landscape.png. Physical touch hardware not tested. Zone network portal/combat/profile/EXP/respawn return passes. Leveling chain network first attempt timed out walking; unchanged second run passes all3 reciprocal pairs/profile/no-bounce/residents. Human acceptance of readability remains user-owned.


## World atlas fit overview / phone UI — 2026-10-14
User requests complete12-country artwork on opening M before zoom, phone usability and MAX somsin. A cleaned-up ResizeObserver measures the atlas viewport and uses contain-fit width/height, zero initial scroll,1× relative fit zoom through4× and an explicit overview reset. No1200px minimum: aspect ratio is preserved. At small scale only nation labels/markers remain; map names appear upon zoom and the selected map always has a readable DOM name, native44px select controls and detail button. Region selection centers/zooms for readable names. Small-scale nation label positions are UI-only; no geographic/map/portal data moves. The embedded atlas is a bounded flex view; detail panel opens on selection and closes independently, without scrolling the atlas out of view. Existing local-map footer remains for local mode, hidden in atlas mode to give image space. MAX somsin original font is local/scoped to atlas headings/countries, Noto Sans Thai retained for body/controls. Original font/source/terms: design/fonts/max-somsin/. No imagery or gameplay/server changes.


Fit-overview validation: online game M close/reopen resets to fitted1×; desktop1280×720, portrait390×844 and landscape844×390 show whole SVG inside its viewport with zero horizontal/vertical scroll at overview. All30 native-select entries open matching detail headings. Phone region zoom, readable map labels, close detail/overview reset and font load checked. MAX somsin document.fonts check true. Screens fit-desktop.png, fit-portrait.png, fit-landscape.png and fit-phone-details.png. Normal viewport reset; no physical touch device test. Country and selected map names stay available in overview; crowded location labels are revealed on zoom instead of shrinking30 names onto a phone. No claim that every30 label is simultaneously readable at phone overview.
