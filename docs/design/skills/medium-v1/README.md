# Medium skill visual set v1

Latest revision (2026-10-09): five active release effects now use PixelLab v2 artwork: Soul Heal 17 frames, four other effects 13 each, total 69. The directory/manifest name remains stable for consumers. Five PASSIVE_STAT effects are excluded from production; original experiments and prior active art remain archived. See `docs/design/skill-system/medium-v2-art-review.md` for current direction, provenance and verification limits. Deliverable descriptions below document the original v1 set.

2026-10-09. The user requested PixelLab skill design and cast/effect animation, starting with the common first job. This set covers **all 10 Medium skills**, shared by all twelve nations. It does not claim the other 360 documented skills or server combat are implemented.

## Deliverables

- Original PixelLab effects: ten transparent native sprite sheets, each with the supplied reference frame plus eight generated frames.
- Ten 64px HUD icons adapted with nearest-neighbour filtering from the original PixelLab motif images; native images remain unchanged in raw/.
- Reusable Medium ritual casting gesture: male and female, eight genuinely generated directions each, eight frames per direction; no mirroring. South uses the existing frontal helper characters so the face and body match the current rig.
- Sprite sheets, frame counts, anchors, scale ratios, provenance IDs and skill source rules: apps/client/public/assets/skills/medium-v1/manifest.json.
- Interactive preview at /skills: sequence, effect-only and cast-only modes; male/female, eight directions, pause/restart, time scrub and every-frame strip. This viewer has no room connection and causes no damage, healing, wallet change or progression.
- Raw frames, original character export archives, rejected candidates, prompts and job IDs stay in this directory. tools/sprites/build_medium_vfx.py packages them; --strict checks coverage. The original game rig and server rules are preserved.

## Visual language

Original shaman ritual motifs: spirit flame, light lotus, parchment talismans with fictional unreadable ritual marks, third eye, sacred thread, bronze amulet and soul waves. Palette: dark teal, ivory, antique gold with restrained skill accents. Crisp pixel clusters, native transparent canvases, elevated three-quarter overhead scene, upright actors, rectangular ground. No third-party sprite references were submitted.

Character pose and effect are independently addressable layers. Active skills reuse the ritual gathering-and-release gesture; individual effects communicate the skill identity. The generated gesture includes a small teal hand charge near release. New gestures specific to throwing, blessings or weapons can be added later; this first set deliberately uses one common Medium ritual rig.

Whole-pixel foot alignment stabilizes casting frames. Renderer scaleRatio keeps generated silhouettes near the current idle height. Raw pixels are retained separately; no baked backgrounds or character silhouettes are added to effects. Icons alone are resized. Presentation translation, rotation and opacity are runtime operations, not invented animation frames.

## Storyboards and timing

| Skill | Casting | Effect attachment and sequence | Persistent or trigger behavior |
|---|---|---|---|
| Spirit Bolt | 1.5s ritual gathering | Hand/chest charge → turquoise projectile → soul fragments on target | One shot; +30% Undead/Demon affects damage rules, not projectile size |
| Soul Heal | 2.0s ritual gathering | Target feet light lotus → ivory droplets rise → light disperses | One healing event; no physical lotus/plant |
| Amulet Blast | 1.0s ritual gathering | v3: asymmetric low ground-ellipse burst of torn talismans and gold ribbons → fragments flutter down → embers | 3×3 source area; visual canvas does not define collision/range |
| Ghost Sight | Instant; no channel | Third-eye sigil above head → violet detection ripple | Source buff 60s; future game retains a quiet indicator, not continuous large flashes |
| Binding Thread | 0.5s gesture | Thin white/red light threads reach target ankles → tighten | Source slow 5s; application effect once, low thread cue while affected |
| Spirit Sense | Passive; no manual cast | Brief teal ward glyph on a qualifying hit | Show only when Undead/Demon mitigation applies |
| Amulet Mastery | Passive; no manual cast | Bronze amulet gem gleam | One brief cue on eligible equipment change/unlock; no permanent large aura |
| Meditation | Passive; no manual cast | Low breath ring and rising SP droplet | Source recovery every 10s outside combat; quiet cue only on an actual tick |
| Vessel Body | Passive; no manual cast | Copper enclosure and ivory soul core | One brief unlock/stat-change cue; no repeated flash on every HP update |
| Soul Resonance | Passive; no manual cast | Two synchronized spirit ribbons | Small secondary cue during a non-instant cast; no extra manual cast |

VFX presentation durations are proposed in design.json and are distinct from cast time, cooldown and buff lifetime. The preview uses a short viewing gap rather than enforcing cooldown. Alpha fades prevent abrupt application/removal; they are not gameplay status duration. The frame strip preserves all PixelLab frames for review. Buff/slow sustain indicators still require combat/status integration.

## Rules preserved and unresolved inputs

design.json preserves the user's max levels, formulas, CT/CD and durations. It also explicitly records null inputs: SP cost, target range in world units, Ghost Sight detection range, cast interruption, cell-to-world size, and percentage bases in Amulet Mastery/Vessel Body. No assumed arithmetic is presented as approved. "Within screen" must become a fixed world range before gameplay; phone and desktop cannot have different combat reach. No cooldown, heal, damage, reveal, slow, stat increase or passive trigger is authoritative in this viewer.

## Acceptance

Review all frames, recognizable motifs, transparent corners, all ten IDs, both bodies/eight directions, planted feet, desktop and narrow portrait/landscape preview, pause/scrub and cleanup. Formula and animation designs are ready for visual review; gameplay effects remain Phase 2 work.

## Verified delivery

- pnpm typecheck: passed for all workspace packages.
- pnpm --filter @shaman/client build: passed, including the /skills route.
- build_medium_vfx.py --download --strict and verify_medium_vfx.py: passed; ten source-correct skill IDs/formulas/timings, 90 transparent VFX frames, ten icons, 128 casting frames in sixteen generated directions. Every-frame contacts reviewed for both bodies and all effects.
- Browser: selected all ten skills, selected eight directions for each body, checked Instant Cast/Passive explanatory states, pause and time scrub, one canvas, zero broken icon images. 390x844 portrait and 844x390 landscape viewport checks; fixed grid intrinsic canvas overflow and retained one scene through resize. Actual touch hardware remains unverified. Screenshots under screens/.
- Rejected Soul Heal physical flower replaced with energy petals. Binding Thread physical base removed with PixelLab exact pixel workbench; the cleaned light ribbon was animated with PixelLab and all nine result frames reviewed. Unused fallback pixel cleanup is archived, not shipped.
- No server gameplay changes or economy assumptions were introduced. Source rules are ready for the subsequent authoritative combat implementation.
# Policy supersession — 2026-10-09

The later user rules in `SHAMAN_SKILL_DESIGN_SYSTEM.md` supersede the passive effect design below. All five Medium passives are PASSIVE_STAT; old generated effect art is archived only. Current manifest contains five active effects, five passive `effect: null` entries, all ten icons and the original cast rig. The renderer and packager consume the shared behavior policy. Historical previews below show the earlier experiment, not current passive behavior.



## Amulet Blast v3 (user review 2026-10-09)

**Problem.** In play the v2 cast showed as a rectangle with a symmetric four-way starburst. There were two causes:
- the v2 art (`amulet-blast-v2.png`) filled its whole 192x160 frame, so the frame edge was visible;
- a diamond `ritual-circle-neutral` ground pulse was drawn under the target, adding four symmetric corners.

**Fix.**
- **New art.** `tools/sprites/remake_amulet_blast.ps1` made a new PixelLab seed and animation:
  - seed: `create_image_pro_flash`, job `30313cff-a759-462b-a188-3d6d3116ebac`;
  - animation: `animate_image`, 12 frames, job `86dd4303-6c57-47c2-aaf2-91c88a4253a8`.
  - The prompt asks for an asymmetric low ellipse on the ground, with no rays, ring or cross, and with transparent
    margins.
  - Raw frames are in `raw/amulet-blast-v3/`.
- **Runtime.** It now uses `amulet-blast-v3.png` with the anchor at the ellipse centre (95, 104).
- **Ground pulse off.** `MEDIUM_RELEASE_STYLE['amulet-blast']` sets `groundPulse: false`, because the burst already
  contains its own ground ellipse.
- **Verifier.** `verify_medium_vfx.py` now fails if any Amulet Blast frame comes within 6 px of the frame edge, or if
  the burst is mirror-symmetric. v2 fails this check; v3 passes.
- **Archive.** The v2 entry is kept under `previousRevisions` in `jobs.json`. Its raw art and sheet stay as
  provenance.
- **Cost.** About 6 PixelLab generations for the animation, plus the seed.

**Evidence.** `amulet-blast-frames.png` (all 13 frames) and `amulet-blast-v3-in-lab.png`, captured from `/skills` in
headless Edge at 0.7, 1.1, 1.5 and 2.0 s after restart.

The exact artwork is still a proposal awaiting user review.

## Cast pose v2 (2026-10-09)

User feedback: casting looked choppy, with too few frames.
- **Frames:** casting poses are now 12 frames per direction (192 in total), from `tools/sprites/animate_rig.ps1`.
- **Playback:** a steady 12 fps through `castPoseFrame`: intro, then a channel ping-pong, then the release gesture.
- **Packaging:** `build_medium_vfx.py` prefers `docs/design/pixellab-main/raw/<body>/cast/` and falls back to the v1 zips.
- **Details and rejected attempts:** `docs/design/character-rig.md`, eighth pass.
