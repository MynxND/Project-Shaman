# Thailand skill VFX — design review (proposal, 2026-10-10)

Status: **proposal awaiting user review. Nothing generated.** Source: `docs/design/skill-database-source.txt` lines 53–207
(Thailand: branch A Achan Saiyasat → Grand Necromancer, branch B Mor Phhee → Prai Phhee Lord, 15 skills each).
Rules applied: SHAMAN_WORLD_ART_BIBLE.md, SHAMAN_SKILL_DESIGN_SYSTEM.md, SHAMAN_VFX_DESIGN_SYSTEM.md,
SHAMAN_SKILL_CLASSIFICATION.md, `packages/shared/src/skill-system.ts`. Formulas, CT/CD and durations stay exactly as in the
source; SP cost, ranges in world units and status rules remain open decisions. Casting poses come later (user 2026-10-10).

## 1. Scope agreed with the user (2026-10-10)

- Skills and their effects first, starting with Thailand. Casting poses later.
- Bow / melee classes in other nations are decided later.
- PixelLab: small checked tests first, user review before each batch (memory: PixelLab spend discipline).

## 2. Behaviour per skill (needs your confirmation)

`PASSIVE_STAT` never gets VFX (shared policy). Changes from the automatic audit are marked **★**.

### Branch A — อาจารย์ไสยเวท (Achan Saiyasat) / Grand Necromancer — family mostly **Yantra (gold)**

| # | Skill | Source | Behaviour | VFX needed |
|---|---|---|---|---|
| 1 | Summon Hun Phayon | CT 3.0 / CD 15 | ACTIVE_CAST | circle + **clay-and-talisman rising burst** where the puppet appears. The puppet itself is a creature sprite (later, like poses) |
| 2 | Sacred Thread Barrier | CT 2.5 / CD 45, 10+2·Lv s | ACTIVE_CAST | circle + **ground zone 5×5**: sacred thread (สายสิญจน์) perimeter with corner knots; subtle loop while active, fade at end |
| 3 | Curse Breaking | CT 1.5 / CD 5 | ACTIVE_CAST | circle + **cleanse burst on target**: crimson threads snapping off, gold motes |
| 4 | Phayon Repair | CT 1.0 / CD 3 | ACTIVE_CAST | circle + **repair glow on the puppet** — reuse Soul Heal art tinted gold (no new art) |
| 5 | Achan's Command | Instant / CD 10 | ACTIVE_INSTANT | brief **impact burst on target** + shared Stun status |
| 6–10 | Phayon Durability, Sacred Aura, Guardian Link, Ward Mastery, Iron Shield Incantation | passive | PASSIVE_STAT | none (icons only). Sacred Aura's name does not justify an aura |
| 11 | Giant Phayon Colossus | CT 5.0 / CD 120 | ACTIVE_CAST | large circle + **big golden summon burst**; colossus = creature sprite (later) |
| 12 | Fortress of Sacred Thread | CT 3.0 / CD 180, 15 s | ACTIVE_CAST | **reuse Barrier art** tiled to the large area + gold DEF-up status on allies |
| 13 | Underworld Soul Pull | CT 2.0 / CD 60 | ACTIVE_CAST | **ground vortex 11×11** pulling inward (dark jade/gold) + impact |
| 14–15 | Colossus Resonance, Transcendent Medium | passive | PASSIVE_STAT ★(14: could be a small reflect flash = PASSIVE_TRIGGER; default none) | none |

### Branch B — หมอผีสายพราย (Mor Phhee) / Prai Phhee Lord — family mostly **Binding (crimson) + Spirit (jade, dark)**

| # | Skill | Source | Behaviour | VFX needed |
|---|---|---|---|---|
| 1 | Ghost Possession | Instant / CD 60, buff 60 s | ACTIVE_INSTANT ★ + state aura while the buff lasts | **possession cue** (prai spirit dives into the body) + **subtle dark aura loop** for 60 s |
| 2 | Prai Whispering Curse | CT 1.0 / CD 5, DOT 10 s | ACTIVE_CAST | circle + **whisper wisps hit target** + shared Curse-DOT status loop |
| 3 | Soul Drain | CT 1.5 / CD 8 | ACTIVE_CAST | circle + **soul tether from target to caster** + small heal return on caster |
| 4 | Terrorize Howl | CT 1.0 / CD 15, 7×7 | ACTIVE_CAST | circle + **radial howl wave** around caster + shared Fear status |
| 5 | Shadow Snare | Instant / CD 12 | ACTIVE_INSTANT | **shadow hands grip the ankles** of target (root loop for its duration) |
| 6, 7, 9 | Dark Affinity, Vampiric Instinct, Agile Spirit | passive | PASSIVE_STAT | none |
| 8 | Soul Harvest | passive, stacks 10 s | ★ PASSIVE_TRIGGER (was STAT: it reacts to a kill) | tiny soul-wisp absorbed on stack gain (reuse Soul Drain return art) |
| 10 | Blood Oil Coating | passive proc | PASSIVE_TRIGGER | only the shared Poison status on proc |
| 11 | Prai Curse Explosion | CT 2.0 / CD 40 | ACTIVE_CAST | circle + **curse burst on every cursed target** |
| 12 | Shadow Ghost Avatar | Instant / CD 120, 20 s | ACTIVE_INSTANT ★ + state aura 20 s | **transformation cue** + **shadow avatar aura loop** (body floats/darkens: runtime tint + aura art) |
| 13 | Mass Fear | CT 3.0 / CD 90 | ACTIVE_CAST | **reuse Howl wave** scaled + shared Fear status |
| 14 | Soul Harvester | passive | PASSIVE_TRIGGER | small cooldown-reset flash on the hotbar/caster (reuse) |
| 15 | Absolute Soul Defense | passive, death save | PASSIVE_TRIGGER | **death-save flash**: prai spirit takes the blow, jade revival burst |

Open: skill 14 of branch A, and whether passives 8/14/15 of branch B should be visible to other players or only to the caster.

## 3. Shared status effects (reused by all 12 nations)

Many Thai skills apply statuses. One shared set (small loops above head / at feet, 64×64) avoids per-skill art:
**Stun, Fear, Root, Curse-DOT, Poison, Status-Immunity (Barrier), DEF-up**. Same Thai occult language
(woven knots, thread, talisman fragments), no Western icons (no stars/skulls).

## 4. Asset list and credit estimate

**Measured 2026-10-10:** a Pro Flash seed at effect size costs **6** generations, so one release effect ≈ seed 6 + `animate_image` ≈ 6 = **≈ 12 credits** (the first estimate of 7 was wrong; see LEDGER.md). Icon cost not yet measured.

| Group | New effects | ≈ Credits |
|---|---|---|
| Branch A effects (summon, barrier, cleanse, command impact, colossus, soul pull) | 6 | ≈ 72 |
| Branch B effects (possession cue + aura, curse, drain, howl, snare, explosion, avatar cue + aura, death save) | 10 | ≈ 120 |
| Shared statuses | 7 | ≈ 84 (smaller canvases may cost less) |
| Skill icons 64 px (30 skills) | 30 | not measured |
| **Total effects + statuses** | | **≈ 276** (+ icons) |

Reused, no new art: Phayon Repair, Fortress, Mass Fear, Soul Harvest, Soul Harvester, Blood Oil (status only).
Creature sprites (Hun Phayon, Colossus) and casting poses are **not** included.

## 5. Proposed staged plan (each stage needs your OK)

1. **Approve this review** (behaviours, reuse, shared statuses). Code work with no credits: add the 30 Thai skills to the shared catalog
   (`skill-system.ts` presentation registry, IDs, source CT/CD) and to the `/skills` lab with placeholder effects using the
   existing circle and runtime tints, so behaviour/timing can be checked before any art.
2. **Test 1 (≈ 14 credits)**: one effect per branch — Sacred Thread Barrier (ground zone) and Prai Whispering Curse
   (target effect + curse status). Review in the lab.
3. Batch A effects, then batch B, then statuses, then icons — each after review.

## 6. Not decided by this document

Gameplay of summons (AI, aggro), status rules (Fear movement, Root, immunity), area sizes in world units, SP costs,
party/screen ranges ("ทั้งหน้าจอ" must become a fixed world range). Effects are presentation only until the server
implements them.

## 7. Test batch result (2026-10-10)

- User approved the review, stage 1 and the two-skill test (+ extra credits after the measured seed cost).
- Stage 1 done: `packages/shared/src/skills-thailand.ts` (30 skills, tests `skills-thailand-test.mjs`), `/skills` lab tabs for both Thai branches with placeholder pulses.
- Prai Whispering Curse: seed + `animate_image` 13 frames → `apps/client/public/assets/skills/thailand-v1/prai-whispering-curse.png` (anchor = target feet). Evidence `prai-curse-in-lab.jpg`. Motion is subtle (faces whisper, then fade).
- Sacred Thread Barrier: seed #1 rejected (45° diamond); seed #2 approved by the user; 13-frame shimmer loop → `sacred-thread-barrier.png` (anchor = zone centre). Evidence `barrier-frames.png`, `barrier-in-lab.jpg`.
- Spend and job ids: LEDGER.md. Scripts: `tools/sprites/thai_vfx.ps1` (generate, resumable), `tools/sprites/pack_thai_vfx.mjs` (sheet + manifest).

## 8. Sacred Thread Barrier v2 (2026-10-10)

User: v1 thread rectangle too plain → grand ground circle with purple fire and smoke (seed adc9ef33…, animation f918115d…).
Then, free code fixes requested by the user (`tools/sprites/post_barrier_v2.mjs`): Thai theme recolour to crimson + purple,
detail taken from the seed in every frame (the PixelLab frames washed toward white) with motion from the animation
(glow sweeps, fire flicker), seed rim smoke restored with a slow drift, transparent centre, and ancient-Thai-style letters
(a ring of 14 around the centre + one large letter in each side seal; original shapes, not a text). Published as
`sacred-thread-barrier.png`, anchor = circle centre (124, 78), drawn under the actor. Evidence: `barrier-v2-post.png`,
`barrier-v2-post-in-lab.jpg`. **Thai theme for later effects: crimson + purple.**

## 9. Terrorize Howl (2026-10-10)

Seed #1 rejected by the user (Western sheet ghosts); seed #2 blocked by PixelLab content policy (violent/terrifying wording);
seed #3 (softened wording: Thai long-haired prai spirit maidens, three jagged crimson ripple rings, violet flames, mist)
approved and animated (13 frames). Free post-pass `tools/sprites/post_thai_vfx.mjs` turns flat white blobs into theme lilac.
Published as `terrorize-howl.png`, anchor = ring centre (109, 77), drawn under the actor; **Mass Fear reuses it**.
Evidence: `howl-frames-post.png`, `howl-in-lab.jpg`. Lab: area/zone effects draw under the actor; the Thai manifest is
fetched uncached and sheets carry `?v=packedAt` so repacked art shows immediately.
Prompt lesson: avoid "violent / terrifying / gaunt / hollow eyes" with human figures (content policy).

## 10. Soul Drain (2026-10-10)

Seed #1 rejected by the user (cartoon round ghosts); seed #2 with soul flames approved and animated (13 frames, 192×64).
Free post-pass `post_thai_vfx.mjs --fill-cores` fills the dark dots in the flame cores (they read as eyes). Published as
`soul-drain.png`, anchor = beam centre (96, 32); the lab draws it as a tether: centred between caster and target at chest
height, rotated toward the target and stretched to their distance (art: left = caster vortex, right = target flare).
Soul Harvest / Soul Harvester keep placeholders until a caster-side piece is cut (lab reuses art only for the same
placement). Evidence: `drain-frames-post.png`, `drain-in-lab.jpg`.

## 11. Batch 1 and free derived effects (2026-10-10)

User asked to design and approve several skills at once. Batch 1 = the remaining 10 new effects (prompts.json `batch: 1`,
tone: ominous Thai horror-folklore, not cute). Seeds approved in one go; animations will be approved in one go after a
single review sheet (`tools/sprites/review_thai_seeds.mjs`).
Free derived effects (`tools/sprites/derive_thai_vfx.mjs`, no generation):
- `soul-harvest`: caster-side vortex cut from Soul Drain (56×64, right edge faded); Soul Harvester reuses it.
- `phayon-repair`: Medium Soul Heal frames recoloured to the Thai crimson/purple ramp.
- Fortress of Sacred Thread reuses the Barrier art (same zone placement).

## 12. Thai shaman redesign — batches 2 and 3 (2026-10-10)

User rejected batch 1 as Japanese/Taiwanese in style; THAI_SHAMAN_VFX_LANGUAGE.md adopted (ritual objects, yantra cloth and
Khom-style ornament, sacred thread, ritual clay, Thai folk ghosts incl. krasue/krahang/pret). Proposed Thai names added to
`skills-thailand.ts` (`thaiName`, pending approval) and shown in the lab.
- Batch 2: 10 redesigned effects + Mass Fear with its own ghost-horde art; animations charged 61.
- Batch 3: the four earlier effects redesigned (barrier, howl, drain, whisper); animations charged 21; they replace the
  pre-Thai sheets (kept in `archive/`). Soul Harvest is now the clay-jar end of the new Soul Drain.
- Free post-passes in `post_thai_vfx.mjs`: `--clear-white` (central white "character space" → transparent, other washed
  shapes → old parchment), `--seed-detail` (washed pixels take the seed's pixel; used for Absolute Soul Defense).
- Prompts must be ASCII (Windows PowerShell 5.1 corrupts Thai text; PixelLab answers -32603). Batch scripts:
  `thai_vfx_batch.sh` (seeds) and `thai_vfx_animate_batch.sh` (animations), both retry only on "heavy load".
All 16 Thai skills that need effects now have art in `/skills` (17 sheets incl. Soul Harvest). Evidence: `batch2-seeds.png`,
`batch2-animated.png`, `batch3-seeds.png`, `batch3-animated.png`.

## 13. Icons (2026-10-10)

All 30 Thai skill icons made as two PixelLab icon sheets (256×256, 4×4 grid of 64 px cells, 15 icons each; 9 generations
per sheet, about 0.6 per icon) and cut with `tools/sprites/slice_thai_icons.mjs` into
`apps/client/public/assets/skills/thailand-v1/icons/<skill>.png` (manifest `icons`). Motifs follow the Thai shaman
language (ritual objects, clay puppets, sacred thread, prai ghosts, krasue). Evidence: `icons-achan-sheet-review.png`,
`icons-morphhee-sheet-review.png`, `icons-*-in-lab.jpg`. Lesson: packed icon sheets are far cheaper than single icons.

## 14. Bigger area effects without regeneration (2026-10-10)

User: AOE skills should look full and grand on the map, by enlarging existing art. `ThaiSkill.vfxScale` (shared, presentation
only, never gameplay range): Barrier 1.8, Fortress 3, Underworld Soul Pull 2, Terrorize Howl 1.8, Mass Fear 2.2,
Giant Colossus 1.5, Prai Curse Explosion 1.4, Achan's Command 1.3, Summon Hun Phayon 1.2; others 1. The lab scales the
release art by it and draws effects at ≥ 1.8 under the actor. Mass Fear anchor moved to the centre of its burning ground
ring (121, 118). Evidence: `soul-pull-scaled-in-lab.jpg`, `mass-fear-scaled-in-lab.jpg`. Nearest-neighbour scaling at
non-integer factors makes some pixels wider than others; the world already renders at a non-integer scale.
