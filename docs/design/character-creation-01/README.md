# Character creation and hairstyle integration

2026-10-11. User requests all generated hair in the game and a character creator with actual previews.

- `/characters/create` plus first-entry creator before Phaser mounts. Existing entry map query stays intact when creating through GameShell.
- Eleven playable styles: four existing layered/SSR styles and seven latest complete eight-direction sets. Nine hair colours including true white and former white as gray. Three additional face identities use latest face-eight-03 parts.
- Shared server allowlists validate encoded appearance, sync changes to all players and preserve existing travel-ticket appearance behavior.
- PNGs unchanged. Published part JSONs namespace image IDs to prevent different hairstyles overwriting Phaser texture keys. Hair remains directional static art attached to existing idle/walk/attack/cast body anchors; no newly generated animation.
- Eight unfinished FRONT-only prototype designs appear in a labelled catalogue. Choosing one disables entering the game. Rejected earlier versions and duplicate revisions are not advertised as additional completed styles.
- Existing female body art has no matching V3 head rig; this creator currently uses the male V3 Medium novice body. No new art or PixelLab credits.
- Appearance is saved in this browser, not a persistent account/character database. Gameplay profile still follows existing session behavior.

Validation: repository typecheck/build; `node apps/client/scripts/character-creation-test.mjs` verifies exact PNG hashes, unique image IDs, head codec, eight-direction/action composition and two-client authoritative appearance synchronization/invalid-input fallback. Actual browser create -> game -> V appearance window verified online with red Swept Spikes and Violet Sharp face. Reload restores selections without hydration mismatch after initializing from default then reading the saved head on mount.

Desktop screenshots: desktop.png, in-game.png, gameplay.png, creator-final.png. Mobile CSS is implemented but the browser viewport capability did not change actual 1280x720 dimensions; phone portrait/landscape visual validation remains unverified. Temporary override reset.

Compilation also exposed an unrelated unused export pointing to nonexistent maps/mountain-sanctuary.ts. Removed that dangling export only; existing map source/layout was not changed.

## Sacred Talisman screen redesign
Selection view for the actual saved local appearance, edit/create tab, approved carved red/bronze frame art, medallion, dark wood/jade and parchment typography. Original Thai temple and flattened yantra map decal form menu scenery. No new image generation or credits. Real sprite preview, eight styles, colours/faces and entry behavior preserved. Typecheck/build passed. Desktop visual reviewed; mobile rules provided but phone visual remains unverified because the IAB viewport override previously did not resize the page.

