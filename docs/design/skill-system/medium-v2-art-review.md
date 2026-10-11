# Medium active VFX — revision 2

User correction 2026-10-09: the five active effects do not sufficiently match the shared design system; Soul Heal is especially weak. Requested stronger thematic coherence and more impressive release effects, following AGENTS.md.

Audit: v1 Soul Heal reads as a static lotus icon, Ghost Sight as solid purple jewelry, Binding Thread as a white spherical cage. Spirit Bolt lacks ritual identity; Amulet Blast reads as three repeated scroll icons. The common casting seal alone does not make unrelated release artwork coherent.

Direction: a shared jade/ivory spirit-light language, antique gold woven seal accents, parchment/crimson fragments for Yantra and crimson enchanted threads for Binding. Stronger release silhouettes and secondary ground pulses reuse the existing shared seal geometry. Keep the actor's center readable; do not enlarge the source gameplay area or change CT/CD/formulas. No new passive VFX.

Soul Heal: two ascending jade spirit streams embracing an open center, staggered ivory soul motes, shared jade ground pulse. Spirit Bolt: directional jade soul core and golden filaments. Amulet Blast: low gold ritual burst with torn talisman fragments. Ghost Sight: airy jade revelation eye rather than solid jewelry. Binding Thread: low crimson knot loops, readable ankles and transparent center.

Initial highly detailed Pixen candidates rejected: physical cloak/pedestal, solid seal badges, painted stone floor and neon green. Jobs/prompts remain in provenance. Re-request pure luminous VFX with PixFlux; inspect all seeds and final animation frames before acceptance. Exact art, palette and release timing remain visual proposals until user review.

Refinement: PixFlux still produced some solid/generic forms. Soul Heal's exact open-center composition was artist-drawn in PixelLab workbench, then enriched with PixelLab Pro editing; the other four were also refined with Pro. Amulet Blast's off-center white core was removed with guarded PixelLab eraser operations and its neon orange ramp replaced with the bible's antique-gold/bronze/parchment ramp. Keep those edits and rejected candidates as provenance. Existing 64px tree icons remain unchanged; this pass revises release VFX rather than replacing icons with tall/wide effect thumbnails.

Implemented preview: 17 native Soul Heal frames and 13 frames for each of the other four effects (69 total). Shared release composition lives in `MEDIUM_RELEASE_STYLE`; the lab reuses the existing neutral seal for family-tinted release pulses. Spirit Bolt rotates only during travel and uses an upright target-foot impact; two generated return-to-projectile bookend frames remain in the frame inspector but are omitted from sequence playback. Five stat passives still have no effect assets. Casting poses, ten existing icons, formulas, CT/CD and status durations are preserved.

Validation: native asset/source-rule verification, workspace TypeScript/build and shared behavioral suite pass. Desktop browser previews were inspected for all five active effects; evidence is in `screens/v2-*.png`. Responsive verification remains open: the browser viewport override reported success but DOM dimensions remained 1280×720, so this run does not establish portrait/landscape behavior. Exact artwork remains a proposal awaiting user review. No authoritative combat was added.

## Amulet Blast v3 revision (2026-10-09)

User review: the cast showed as a rectangle with symmetric four-way rays.
- The v2 sheet filled the entire frame.
- The shared diamond ground pulse added four symmetric corners.

v3 replaces the release art with an asymmetric, ground-hugging talisman burst inside transparent margins, and turns
off the ground pulse for this skill. The verifier now checks the margins and asymmetry. Full record:
`docs/design/skills/medium-v1/README.md` ("Amulet Blast v3"). Active frame count is unchanged at 69.
