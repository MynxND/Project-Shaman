# Live eight-class automatic head adoption — 2026-10-17

User authorized actual gameplay adoption for all8 classes, supplied user-miko-preset.json, and confirmed the same Miko offsets can initialize the other7 classes. The exact supplied preset is retained. No generator or paid API is called. Native existing AutoSprite clothing and SSR head assets are reused with original attribution.

prepare.cjs packs56 body frames at128px per direction (nearest sampling), preserving source ordering/neck measurements and loop ranges. Eight classes map to authoritative player.branch. Miko retains its sword per the user's later choice. Default class presets share the user's direction/source-frame correction records, while fingerprints stay class-specific. Idle holds a source walk pose; no new idle, attack or cast art is invented. Existing attack/cast rendering is retained.

AutoHeadActor is a gameplay renderer, selected through CharacterSprite.setAutoHeadBranch in the actual FoundationScene player update, not a preview-only flag. It lazily loads only encountered class atlases, draws into one160px canvas texture per actor, and uses the existing SSR part composer/palettes for head, hairstyle, hair color, expressions, blinking and mirrored directions. Existing head changes remain server-validated and network-synchronized. Branch, wardrobe/body override and unsupported-head transitions restore the old renderer while new assets load or when unavailable. Generated canvases/listeners are destroyed per actor; shared head-canvas cache is bounded64. Walk playback uses 24 fps (user 2026-10-17; was 16 fps, `AUTO_WALK_FPS` in AutoHeadActor.ts) and existing source loops; world position, collision, movement speed and combat authority remain unchanged.

The game's V appearance window retains hair/color/face controls and adds a per-class preset JSON import/reset panel. Public default calibration is shared by all clients. Additional imports are fingerprint-validated before storage and apply locally to that machine (all rendered actors of that class); they are not falsely advertised as synchronized server state. The selected hair/face from imports goes through the existing head store/server channel. Local alignment changes take effect immediately through an event with periodic fallback polling. Cross-origin preview browser storage is not read silently: exported JSON is the bridge. The original Miko file is already installed globally as the baseline for all8.

Only the existing male V3 costume rig has these supplied male assets. Female/legacy body presentation remains its existing renderer. Unsupported pre-existing hairstyles retain their fallback; older style IDs are preserved while the8 preview hairstyles and7 preview faces are adopted. Body overrides opt out of automatic costumes. Physical-phone GPU/memory performance and human visual approval of shared Miko offsets on every class remain unverified.

Validation receipts: model-check.json checks presets, source-frame overrides and invalid imports. live-check.json records eight actual guest clients in an isolated in-memory development server on2597, all8 movement directions per class, received auto-actor textures, head/face updates observed by a second Colyseus client, preset import and desktop/emulated mobile screenshots. Root typecheck/build checks are run after changes. QA guest rooms do not alter player accounts or persistent data. No external deployment is implied.

Normal local game is available at http://127.0.0.1:3000 with the regular server on2567. QA2597/8781 processes were stopped after checks. Open V → ค่าต่อหัวอัตโนมัติ to import a newer class-specific JSON. The provided file is already the global default and need not be imported again. No public production deployment was performed.


## Side-walk stabilisation and speed — 2026-10-17

User reported the body shaking when walking left/right.

**Measured causes**
- East/west source frames were not ground-locked: the planted foot moved up to 4 px between frames.
- Neck detection had spikes, up to 10 px on Santet west.

**Fixes in `prepare.cjs`** (no art redrawn)
- **Ground lock:** east/west frames are shifted vertically in whole 128-px pixels so the planted foot sits on one ground line (residual 1–2 px). The neck moves with its frame, and the direction origin uses that ground line.
- **Neck spikes:** every direction's neck track gets a 5-frame temporal median along the playback loop.
- **Unchanged:** other directions' PNGs are byte-identical.
- **Script repair:** the script was missing a `;` before the action-preparation call and did not run. That is now fixed.

**Speed:** walk playback is 24 fps (`AUTO_WALK_FPS`).

**Verification:** `check-model.cjs` passes. In-game feel at 24 fps still needs the user's review.
