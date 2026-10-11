# Owned-front native rotation experiment 01

2026-10-09. Actual outcome: **REJECTED, STOP**. No hairstyle, equipment or
animation requests. Original rig-v2 male idle-south frame0 remains byte-exact,
selected but not user-approved. All corrected side/rear candidates remain null.

## Supported workflow and cost

- Live tools: `tools-live.json`, retrieved through the existing credential-safe
  user-level PixelLab RPC. No credentials in this folder.
- Tool: `create_character_pro_flash`, supplied exact owned `first_frame_base64`,
  south first direction, native128 source, no size/style override. Rotations use V3.
- Live schema requires8 directions; no right-only control exists on this tool.
- `quote.json`: new-image6 + rotations2 = total8. Source reuse skips the image.
- `submit.json`: first_direction_generated=false, estimated_generations2.
- Job: e3004236-7c93-436a-9a6b-c3139e60edd2.
- Character: 40ffc152-8925-492a-8b5a-e7c296d5deac.
- `result-final.json`: completed, eight static128 rotations, animations:none.
- `jobs-final.json`: this job completed, no active jobs listed. Reservations0.
- Observed usage2: remaining171->169, used1829->1831. Matches quote/estimate;
  completion does not expose charged_generations. An unrelated previously-running
  animation finished during wait-01, so balance delta alone is not job-exclusive
  billing proof. See ledger rotationInvocation.usageEvidence.
- Additional internal ceiling8 for this invocation, not a user numerical budget.
  Earlier masked attempt actual6 retained; cumulative recorded usage8.

## Review result

`east-comparison-native.png` and `east-comparison-2x.png` show, left to right:
protected master front, original east audit reference, generated rejected east.
No alignment transform, crop, scale, stretch or source-art pixel edit.

East is more profile-like than the failed frontal inpaint. It has a rightward
nose/near eye and narrower projected body, but invents long flowing white hair
behind the shoulders and loses the master's crimson hair ties. Side coat hem
and embroidery also need design review. It is not an identity-consistent right90
candidate. Exact anatomical/camera certification is not inferred from labels.

Master silhouette66x119 at top5,bottom123; generated east50x118 at
left33,top6,right82,bottom123. East head assembly37x33 vs master's45x34.
Both ground edges124. Baseline and one-pixel top difference are not rejection
reasons. No small foot correction was needed or made; such correction would not
fix the substantive hair/tie drift. `review.json` records manualPixelCorrections[].

Service south pixels equal the source, but PNG encoding differs. Runtime uses
the original file bytes. All eight `raw/` files are unchanged archives. North,
west and diagonals were not reviewed or promoted after east failed.

## Deterministic evidence

Prepare only: `node tools/rig/prepare_turnaround_rotation.mjs`.
Collect existing completed result: `node tools/rig/collect_turnaround_rotation.mjs east`.
Package rejection comparison: `node tools/rig/build_character_turnaround.mjs`.
Test: `node tools/rig/test_character_turnaround.mjs`.

Do not rerun recorder/finalizer: their assertions deliberately prevent duplicate
ledger charges. Builder reads the current ledger and never rewrites it. Source
hashes and all existing ledger fields/history are retained by structured merges.
Exact contact images use RGBA row copies and direct nearest2x replication, avoiding
transparent-RGB changes from alpha compositing/resizing. Tests prove byte/pixel
retention, not semantic art approval. Main owns any inspector UI follow-up; the
manifest exposes only `rejectedPreview`, not a corrected candidate.

Final checks: focused pixel test, workspace `pnpm typecheck` and `pnpm build`
passed. Final native/nearest2x images manually inspected. No client UI edit or
new browser interaction was implemented or claimed.