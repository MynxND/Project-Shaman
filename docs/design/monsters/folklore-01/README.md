# Folklore enemy batch — 2026-10-15

User authorized ImageGen for this40-species batch after PixelLab reported0 generations. These are enemy monsters, never playable classes. No third-party game sprite references were used. Original PNGs and exact prompts are preserved under `raw/`; `jobs.json` records generation provenance.42 calls produced40 original sheets and2 repair candidates.

## Runtime and placement

40 native transparent atlases have eight authored views and explicit idle/move/attack/hurt/death clips.34 species populate50 additions across20 existing live maps (Thailand, Japan, Russia, China, Norway, Ireland). All original camp entries, terrain, NPCs, collision and portals remain. Korea6 remain registered/previewable but unbound because no live Korean map exists. User corrected Iceland to Ireland: the six selected enemies now occupy the existing three Irish maps, two per map. Original names/art/prompts remain generation provenance; this fictional game placement does not claim Irish folkloric origin. Country/map lore, levels and formula-based statistics are provisional gameplay proposals.

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

Python requires Pillow. QA checks40 source hashes, transparent atlas dimensions, every action/view index and source-edge warnings. Tests cover unchanged legacy artwork, valid/walkable authored camps, all eight short-arrival/attack directions and rear hit geometry. The isolated local server test joins all20 rooms, checks actual residents and walkable spawns, then attacks/kills Phi Pop through authoritative gameplay. Shared regression suite, workspace typecheck and production build are required. Browser preview inspection is separate from server tests; no claim of physical-device performance or final user approval.

## User country correction

User confirmed **Ireland**, not Iceland. Golden Spiritwood receives Afturganga/camp0 and Sending/camp2; Stone Oath Moor receives Draugur/camp1 and Uppvakningur/camp2; Willow Wake Village receives Utburdur/camp0 and Tilberi/camp1. One additional enemy each, retaining all original residents and geometry. Existing eight-direction artwork is reused without generation.

## Detailed animation audit02

The earlier coarse runtime review did not establish correct walking biomechanics. User requested a full chronology audit: see [all40 findings and remaining artwork](audit-02/README.md). Nine attack sequences repaired using original indices;22 walking clips still need art, two dissolve deaths lack transition poses. Three generated walk candidates held out of runtime. Apply `node tools/monsters/folklore/apply-audit.mjs` after packing and before publishing to retain the audited orders.

## Current animation repair03

The user subsequently authorized all audit02 repairs. The current runtime adopts22 replacement walk cycles, hop/flight/hover/coil presentation, five death transitions, targeted attack views and uniform Sending attack scaling. See [repair03 sources, exceptions, evidence and reproduction commands](repair-03/README.md).28 versioned atlases preserve all40 originals; user visual approval remains pending. The original `pack.py` workflow above reconstructs the historical baseline only: use the repair03 pipeline afterward to retain current repairs. Do not equate technical validation or four timing beats with four new drawings or final gait approval.


## Current ranged encounters04

Reuse repair03 poses with17 ranged pixel-orb attacks and23 melee roles. Current34 species retain country-correct live placements; Korea6 have explicit planned habitats only. User reconfirmed Ireland grouping under game lore. Canonical encounter-04.json drives publishing, habitat guards and preview labels. See [implementation, validation and all40 placements](encounter-04/README.md). No new image generation.


## Current themed ranged attacks05

Supersedes encounter04 uniform orbs/range:17 species-specific silhouettes and17 different base ranges/speeds reuse existing poses and world/preview geometry. Thai adaptation notes and comparison table distinguish folklore motifs from invented gameplay; no added statuses. See [profiles, sources, runtime and validation](encounter-05/README.md). Canonical encounter-04.json now has version5;34 live/Korea6 planned unchanged.


## Live audit06 and revised VFX art07

User rejected thin procedural VFX during a230-case partial live audit; no full17 visual approval or completed289-case claim. Retain technical facing/impact/attachment fixes and add a guest-only isolated real-game review workflow. Three substantial ImageGen VFX prototypes (frost/water/curse) use lessons from the user-specified Godot library: material core, afterimages and server-confirmed impact.14 effects remain pending. See [source study, assets and real-game evidence](vfx-07/README.md).
