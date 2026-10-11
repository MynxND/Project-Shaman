# Shikigami prototype — Kitsune (user 2026-10-11)

Scope approved: Kitsune only. Phase 1 one master sprite → user review → phase 2 one short attack animation from the
master → phase 3 composite (master circle + ofuda + spirit smoke + Kitsune) in the engine → user review before Kodama,
Nurikabe, Kamaitachi, Mizuchi. No extra directions or Ascension forms; no automatic retries; exact charge per job.

## Phase 1 result
`raw/shikigami-kitsune-master/seed.png` (128×128, facing right, elevated three-quarter view), job
e69873dc-a8b0-49e5-8d3f-226d58543d41, **6 credits exact**. Inspection: three tails, cream/white fur (1 pure-white pixel),
restrained vermilion kumadori markings, ofuda on a red cord at the neck, small fox-fire wisps at the tail tips only,
clean transparent background, four legs, no duplicates. Gameplay-scale still (free composite, world scale ×2 for a
1080p screen): `kitsune-gameplay-scale.png` — the fox stands about 1.4× the player's height on the fire-tinted master
circle with spirit smoke; `kitsune-master.png` is the 3× close-up.

## Phase 2 result (user approved; asked for bigger tail fire)
One animation job from the master, 11 frames, **3 credits exact** (fd2b0372-d4dd-4eb5-a972-2f61c8355fcc). Consistency:
same face, proportions and markings in all frames, three tails, ground line stable (bottom row 117 every frame), no
extra limbs. The animation kept the tail fire small (it put the fire into the bite instead) and frame 8 had a washed
pure-white flare (222 px). Free fix (`kitsune_tailfire.mjs`): pixel flames drawn up from each frame's own red tail tips
(they follow the tails), 1-px dark outline, flare whites → flame yellow; canvas padded to 160×168. Note: in a few frames
the right-hand tail's tip is outside the search area and has no flame.
Evidence: `kitsune-attack-frames.png` (raw), `kitsune-attack-tailfire.png` (fixed).

## Phase 3 result (engine composite, free)
`summon-kitsune` in the lab: Japan casting circle under the caster (1 s CT) → at the target: master circle (release
circle, 5 cells, fire tint, turning) + spirit smoke (ground) + paper-doll flash (behind) → the fox bursts out
(delay 22%) and bites with tail fire in front, ofuda crest floating above; release shown for 2.6 s. Kodama, Nurikabe,
Kamaitachi, Mizuchi still use the tinted flash. Evidence: `kitsune-summon-in-lab.jpg`, `kitsune-summon-in-lab-zoom.png`.

## Remaining four (user 2026-10-11: "ทำต่อไปเลย") — 36 credits exact
Kodama, Nurikabe, Kamaitachi, Mizuchi: one master each (6 credits) then one attack animation from it (3 credits),
one job at a time. Free post (`shikigami_post.mjs`): pure-white effect pixels → element ramps (Kamaitachi silver wind,
Mizuchi aqua water), canvas padded. Lab: same composite as the Kitsune with element tints (smoke, release circle, paper
flash behind, creature in front at 22%, ofuda crest above, 2.6 s release).
QA notes:
- Kodama: the "thick roots" came out as thin yellow-green grass (weak attack); frames 1–3 change its eye shape briefly
  (closed/smiling) — breaks the "no changing face" rule. Candidate for a redo or a frame cut (free: drop frames 1–3).
- Nurikabe: good stomp and dust; the seal on its ofuda looks like seal-script kanji — not verified, should be treated as
  decorative only or recoloured to an abstract mark (art bible: no unverified kanji presented as real).
- Kamaitachi: consistent body, crossing slashes (now silver); it hovers mid-leap (no ground contact) by design.
- Mizuchi: consistent coils, strong water burst (now aqua).
Evidence: `shikigami-masters.png`, `shikigami-attack-frames.png` (raw), `shikigami-post-check.png`, `mizuchi-summon-in-lab.png`.

## Fix-all + great forms (user 2026-10-11: "แก้ไขทั้งหมดนั้นเลย แล้วทำให้เสร็จทีเดียวไปเลย") — 53 of the 75 cap
- Kodama attack redone (3): face fixed (three holes never change), thick gnarled roots; harsh yellow leaf glow → moss
  green (free). Old animation archived in `raw/shikigami-kodama-master/replaced-anim-1/`.
- Nurikabe seal (free): red seal blobs on paper become an abstract vermilion ring + ink stroke (no unverified kanji);
  the same pass removed the great Nurikabe's plain red disc on white, which read as a national flag.
- Five Ascension great forms (masters 30 + animations 20): nine-tailed Kitsune, Nurikabe fortress, elder Kodama, twin
  Kamaitachi, great Mizuchi. QA: all consistent; great Kodama's mouth turned into a frown in frames 8–10 → trimmed to
  8 frames (free). No pure-white pixels left in any creature sheet.
- Lab: Shikigami Ascension shows the five great forms in turn (one per preview loop, `cycle` layers) over a 7-cell gold
  circle with smoke, the paper flash behind and the ofuda crest above (3 s release).
Evidence: `great-forms-masters.png`, `great-forms-frames.png`, `fix-check.png`, `ascension-in-lab.jpg`.
