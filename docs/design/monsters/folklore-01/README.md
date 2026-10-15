# Folklore enemy batch — 2026-10-15

User authorized ImageGen for this40-species batch after PixelLab reported0 generations. These are enemy monsters, never playable classes. No third-party game sprite references were used. Original PNGs and exact prompts are preserved under `raw/`; `jobs.json` records generation provenance.42 calls produced40 original sheets and2 repair candidates.

## Runtime and placement

40 native transparent atlases have eight authored views and explicit idle/move/attack/hurt/death clips.28 species populate44 additions across17 existing live maps (Thailand, Japan, Russia, China, Norway). All original camp entries, terrain, NPCs, collision and portals remain. Korea6 and Iceland6 are registered and previewable but unbound: neither has a live map in this registry. Iceland is not silently renamed Ireland. Country/map lore, levels and formula-based statistics are provisional gameplay proposals.

`folklore-releases.ts` is generated from the separately recorded maintainer runtime review. `review.json` does **not** grant user visual approval. Existing monsters keep their original east/west art and behavior; only new definitions opt into eight-way facing. Server movement and attacks own facing; the client preserves movement phase when switching views, holds one-shot actions and waits for the complete death clip before fading. Textures load per map and are removed on scene shutdown.

## Measured artwork, not assumed grids

The generator did not consistently obey requested dimensions/row counts. `cuts.json` records actual row bands, extra columns and action ranges. Clip lengths vary: move3–4 distinct poses, attack3–4, death2–4. Repeated passing poses and reused neutral idle/reaction hurt frames are explicit; this is limited-key animation, not a claim of four unique poses for every action. All directional art is authored, not front/back mirroring.

Packing uses native nearest-neighbor scaling, one scale per original creature, fixed ground pivot, and connected-source ownership extraction to exclude neighboring sprites. It never paints missing character pixels or keys away a flat background. Native frame192×192 (Rusalka/Sending224×192), atlas height3840, within4096 texture dimension. Each source is retained byte-exact and checked by SHA256.

Krahang's full-sheet repair `source-v2.png` was rejected because it omitted the complete death sequence. Original complete sheet retained; torso rotates in attack windup and remains available for user review. Sending's original long attack overlapped neighboring cells; `attack-v2.png` replaces only that action with a shorter strike. All32 repair poses share one scale and a normalized baseline; other actions retain original pixels. Some dissolve deaths finish with smoke/remains rather than a corpse. Final animation polish and artistic approval remain user review items.

## Preview and verification

Open `/monsters/folklore`: choose country, species and action, replay attack/death, pause and scrub; all eight views share one clock. The source sheet is separately expandable. Desktop1280×1000 and mobile390×844 inspected; contact sheets cover all40 packed creatures. See `desktop-preview.png`, `mobile-preview.png`, `packed-contact-*.png` and `network.json`.

Commands from repo root:

```text
python -X utf8 tools/monsters/folklore/pack.py
python -X utf8 tools/monsters/folklore/qa.py
node tools/monsters/folklore/publish.mjs
pnpm --filter @shaman/shared build
node tools/monsters/folklore/test.mjs
node tools/monsters/folklore/network.mjs
```

Python requires Pillow. QA checks40 source hashes, transparent atlas dimensions, every action/view index and source-edge warnings. Tests cover unchanged legacy artwork, valid/walkable authored camps, all eight short-arrival/attack directions and rear hit geometry. The isolated local server test joins all17 rooms, checks actual residents and walkable spawns, then attacks/kills Phi Pop through authoritative gameplay. Shared regression suite, workspace typecheck and production build are required. Browser preview inspection is separate from server tests; no claim of physical-device performance or final user approval.
