# Headless eight-class preview — 2026-10-16

User requests a viewer for the latest eight existing headless class outfits. Open `preview.html` directly; it loads existing repository PNGs through relative paths and requires no server, account, GPU or new artwork. Distribution copy and ZIP live under `artifacts/headless-outfits-2026-10-16/` and `artifacts/headless-outfits-preview-2026-10-16.zip`.

Eight classes: Achan/Juggernaut production pair, and Santet/Keris/Onmyoji/Miko/Rune Seer/Ullr Hunter detail candidates. Controls: eight facings, idle/walk/attack/cast, play/pause, frame slider, stepping, clickable frame thumbnails,4/8/12/16FPS,1–4x zoom and background selection. No head/face/hair or separate weapons are composed. Original Thai/Russian hand overlays are included. Existing baked weapons remain visible in detail artwork.

This is an offline asset viewer; playback loops are inspection timing, not authoritative server attack/cast timelines or live adoption. Original PNGs remain unchanged. Asset cache avoids repeated network/file loads; selection revisions suppress stale image completions. Playback timer is stopped on selection, hidden tab and page teardown. Errors show a visible failed-file message.

Validation:2000 referenced body/hand files exist; actual headless Edge visits256 class/facing/action combinations; play/pause/step/thumbnail controls exercised; desktop1280×900, portrait390×844 and landscape844×390 fit without horizontal overflow. No page errors. Evidence in adjacent JSON/screenshots. Root typecheck/build passed. Playback continuity and final art acceptance remain reviewable; no physical-device validation claimed.
