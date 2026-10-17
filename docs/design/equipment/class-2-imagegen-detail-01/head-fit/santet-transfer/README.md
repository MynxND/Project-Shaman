# Santet reference transfer — 2026-10-14

## Correction after user reports attack reversion

The source was NOT proven complete: absent entries cannot be treated as user-approved zero. Saved file, pre-transfer snapshots and exported live Edge draft all contain only16 explicit attack entries (SOUTH/SOUTH-WEST). Other corrected attack coordinates have not been found; exact loss cause is unresolved. Stale whole-packet writes were possible, so the editor/API now use saved-file revisions to refuse stale submissions and snapshot offsets on every save/apply. Preserve all existing drafts before reload. No claim of successful recovery of missing coordinates is made. Existing transfer remains a provisional candidate; do not rerun based on absent source entries.

User reports Santet placement complete and authorizes using it for the other five male classes. Saved source contains93 explicit Santet entries; remaining source frames retain zero correction as displayed, rather than inventing missing edits. Snapshot includes all200 Santet frames (8 idle +192 motion). Original explicit Santet values remain byte-equivalent as JSON entries.

All960 target motion frames have reference-transfer candidates. Formula: target measured collar displacement + (user Santet correction − Santet measured collar displacement), matched by action/direction/frame. This transfers the user's calibration while accounting for each costume's own motion. It is a heuristic, not an anatomical guarantee.

466 candidates pass both source and target tracker checks and are applied to the isolated detailed manifest;494 remain proposals because either collar match is uncertain. Existing manual target corrections are preserved. Existing SOUTH placements remain where a new proposal is uncertain.584 confirmed entries now exist including source and previous placements; this does not mean584 newly corrected frames. Other frames retain baseline coordinates. Generated contact sheets show actual applied values, not unaccepted candidates.

The editor serves transferred candidates and merges server entries with local manual drafts so old accepted browser drafts cannot discard newly saved placements on reload. Reload the editor before continuing. User art approval and full visual review of all targets remain open; the Keris SE attack review exposed floating heads in uncertain candidates, so these were excluded from application.

Snapshots in `../../head-history/`; report records all candidates and confidence flags. No PNG source, Thai/Russian published outfits, female pipeline or default gameplay manifest changes. No generation or PixelLab credits.

Validation:1200 runtime frame checks, tracker/hash guards, six-class responsive browser editor checks, workspace typecheck/build passed. `tools/rig/transfer-santet-heads.mjs` reproduces the transfer without overwriting manual entries.
