# Headless eight-class preview — 2026-10-16

## Original-head fitting mode — user-authorized extension

`preview.html` now loads `preview-data.js`, `preview.js` and `preview.css` without fetch so direct file URLs work. Toggle the original SSR head; eight existing runtime hairstyles and seven supported faces are selectable (white palette).448 directional head images are deterministic composites of owned existing SSR parts using the shared `ssrCompose`/`ssrRampIndex` policy; no new generator calls or redrawn faces. `prepare-head-preview.cjs` rebuilds these derivatives, embeds the existing outfit/base metadata and prepares eight class ZIP downloads. It also refreshes the artifact copy at the original user-facing URL.

Baseline head follows each outfit frame's authored neck and per-direction headOffset, with the same V3 idle-head attachment delta. User adjustments translate X/Y in native pixels and scale about the original neck anchor. No claim of exact Phaser depth/occlusion parity: preview head sits over body, with existing hand overlays above it; baked weapons remain in body art.

Two saved scopes: class+direction defaults, or class+direction+action+frame overrides. The override takes priority. Each scope includes offsets, scale, hairstyle and face. Click Save to persist all current records and enabled mode in localStorage. Selection alone never writes to disk or game manifests. JSON export/import provides portable backup. Saved packets are schema/range/ID validated and bound to SHA256 of exact source outfit/base/head-part data, so changed sources cannot silently reuse offsets. Import replaces the in-memory packet only after successful validation; it requires Save for browser persistence. Reset affects only the selected scope and is also unsaved until Save.

Downloads contain original128 headless sprites, all8 directions and idle/walk/attack/cast, plus hand overlays where present. Preview fitting is not baked into those ZIPs. The initial headless view remains available; current localStorage settings are private to this preview origin/path and are not a durable account/cloud database.

Additional actual Edge tests in `check-head-preview.cjs`:448 hairstyle/face/direction combinations, save/reload, class/frame isolation, JSON export/import, incompatible-fingerprint rejection,8 download links and responsive viewports. JSON results/screenshots are retained. Full live-game adoption and artistic approval remain outside this request.

User requests a viewer for the latest eight existing headless class outfits. Open `preview.html` directly; it loads existing repository PNGs through relative paths and requires no server, account, GPU or new artwork. Distribution copy and ZIP live under `artifacts/headless-outfits-2026-10-16/` and `artifacts/headless-outfits-preview-2026-10-16.zip`.

Eight classes: Achan/Juggernaut production pair, and Santet/Keris/Onmyoji/Miko/Rune Seer/Ullr Hunter detail candidates. Controls: eight facings, idle/walk/attack/cast, play/pause, frame slider, stepping, clickable frame thumbnails,4/8/12/16FPS,1–4x zoom and background selection. No head/face/hair or separate weapons are composed. Original Thai/Russian hand overlays are included. Existing baked weapons remain visible in detail artwork.

This is an offline asset viewer; playback loops are inspection timing, not authoritative server attack/cast timelines or live adoption. Original PNGs remain unchanged. Asset cache avoids repeated network/file loads; selection revisions suppress stale image completions. Playback timer is stopped on selection, hidden tab and page teardown. Errors show a visible failed-file message.

Validation:2000 referenced body/hand files exist; actual headless Edge visits256 class/facing/action combinations; play/pause/step/thumbnail controls exercised; desktop1280×900, portrait390×844 and landscape844×390 fit without horizontal overflow. No page errors. Evidence in adjacent JSON/screenshots. Root typecheck/build passed. Playback continuity and final art acceptance remain reviewable; no physical-device validation claimed.
