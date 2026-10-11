# White hair default — 2026-10-11

User requested white as the default colour for every hairstyle. Added 630 white PNG previews across 20 current and historical candidate sets using the existing SSR white eight-step ramp. Original sprite geometry, alpha, skin, fixed accents (including Wolf Cut silver tips), approved PNGs and source manifests remain byte-identical. Only pixels that demonstrably differ between existing gold/black previews are recoloured; unchanged pixels are preserved exactly. Separate white-manifest.json receipts contain source hashes and output hashes. No generation or credits used.

All candidate hair selectors (including eight FRONT prototypes and historical comparison panels) offer white and start with white. Shared DEFAULT_HEAD uses white for new or invalid/default appearances; valid existing saved colours are preserved. SSR prototype defaults to white. Candidate colour PNGs load with SHA verification and a shared 12-request queue so the Inspector's many panels do not overload browser fetching.

Validation: test_white_hair_default.mjs checks every new PNG hash, source hash, alpha, unchanged non-ramp pixels and declared white ramp, plus shared default/fallback and preservation of existing red selection. Typecheck/build and desktop/mobile Inspector checks are required for this change. No hairstyle approvals or gameplay hairstyle catalogue changes are implied.

Reproduce after publishing a new candidate: node tools/rig/add_white_hair_previews.mjs. White previews are additive; existing source manifests are untouched.

Completed verification: typecheck/build and all630 preview/default tests pass. All15 V3 Inspector hair palette selectors start white, all displayed candidate images load, no alert errors. Desktop4x and mobile portrait/landscape reviewed. Existing saved colour choices remain unchanged.

