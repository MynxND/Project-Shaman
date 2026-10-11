# Monster design system (proposal, 2026-10-09)

**Identity.** Every monster is a Thai-folklore creature with:
- one readable silhouette;
- its own palette inside the world palette;
- a clear combat role.

No generic Western fantasy monsters. No third-party sprites as references. The roster and prompts are in
`monsters.json`.

**Scale and perspective.**
- 128 px canvas, the same as the main character, drawn at 0.5 in the world, so pixel density matches.
- Three-quarter view facing right (east); the client mirrors it for west. This follows the classic MMORPG convention for
  creatures. 8-direction monster sheets would multiply generation cost and are not needed for wandering and melee.
- The anchor is the ground point under the monster: `(64, 114)` for the Leaf Wisp.

**Pipeline.**
1. `tools/monsters/generate_monster.ps1 -Id <id> -Stage seed` makes a Pro Flash seed, styled on the main female south
   sprite (outline, density, palette only).
2. Review the seed, then record `seedUrl` in `monsters.json`.
3. `-Stage anim` runs PixelLab `animate_image` for idle (4 frames), move (8), attack (8), hurt (4) and death (8).
4. `python -I tools/monsters/build_monsters.py` packs one row per animation into
   `apps/client/public/assets/monsters/<id>.png` and `manifest.json`.
5. Each frame is checked for size and transparency. Raw frames, prompts and job ids stay in `raw/<id>/`.

**Runtime polish.**
- Hurt: a red tint for 140 ms.
- Death: fades out after the death frames.
- Respawn: fades in.
- HP bar shows when damaged or targeted.
- The target ring is drawn on the ground.

## Roster

| Monster | Lv | Role | State |
|---|---|---|---|
| Leaf Wisp ภูตใบไม้ | 1 | passive, slow, low HP | **Implemented**: art, AI, spawns, quest |
| Cursed Strawling หุ่นฟางต้องคำสาป | 3 | slow, telegraphed melee | **Implemented** |
| Wandering Spirit Flame ผีไฟพเนจร | 4 | ranged ghost-fire shot, dodgeable | **Implemented** |
| Shadow Macaque ลิงเงา | 5 | fast melee, short leash | **Implemented** |
| Clay Guardian ทวารบาลดินเผา | 7 | DEF 14, slow heavy hit | **Implemented** |
| Cursed Rootkeeper เจ้าที่รากไม้ต้องสาป | 10 | mini boss: telegraphed root slam, summons wisps | **Implemented** (192 px canvas) |

**Leaf Wisp review notes.**
- The seed matches the character's outline and density.
- Death leaves a faint core; the runtime fade finishes it.
- Hurt is subtle; the tint carries it.
- Attack frames 5-6 contain an orange 8-ray impact spark. It is kept for now and awaits user review.
- Animation sheet: `leaf-wisp-animations.png`.

**Phase 6 review notes (2026-10-09).**
- All seeds were accepted first try (`roster-scale.png` shows them next to the player). Animation sheets:
  `<id>-animations.png`.
- **Spirit Flame:** idle frames 2-3 contained the spat orb, so idle uses frames 0, 1 and 4. Hurt frame 2 was a
  symmetric white starburst, the shape the user rejected for Amulet Blast, so it was dropped (`FRAME_PICK` in
  `build_monsters.py`).
- **Rootkeeper:** the first death barely moved and was re-rolled with an explicit collapse. The rejected frames are in
  `raw/cursed-rootkeeper/death-rejected/`.
- **Specks:** detached sparkles under 12 px are removed at build time (`tools/sprites/rig_cleanup.py`), except on the
  Spirit Flame, whose motes are part of its design.
- **Anchors:** x is the silhouette centre, so mirroring keeps the body in place. y is the bottom of the seed, plus an 8 px
  hover for the Spirit Flame.
- **Generator:** `generate_monster.ps1` now retries while PixelLab's 8-job queue is full and records each job id
  immediately, so a failed run can resume without paying twice.
