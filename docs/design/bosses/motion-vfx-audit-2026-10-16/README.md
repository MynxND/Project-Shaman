# Boss animation and spatial VFX audit — 2026-10-16
User rejects static sprites translated as locomotion and low-pose attack/cast.
User confirmed: complete Calon Arang first under the new motion/VFX standard. No request
for GPU jobs has been made and none will be queued without separate permission.

## Confirmed existing defects
- Monster manifest: Koschei, Maiyarap, Shuten each `move.frames=1` per direction.
- KoscheiLayer and MaiyarapLayer stop sprite animation every update and assign a
  fixed idle frame for reposition. ShutenPresentation does the equivalent.
  Raising FPS cannot create missing gait/contact poses.
- Koschei cast uses4 timing beats,3 unique authored poses/facing (24 unique PNG
  cells in32 timings). Maiyarap has4 source poses/facing. Both pose functions
  switch abruptly between these beats; Shuten switches isolated windup/strike.
- Koschei/Maiyarap organic attack adapters use only3 active frames, although an
  atlas contains8. Charge/aftermath allocation is not equivalent to8 active poses.
- Main material uses one square with size clamped145..400px and midpoint/center
  placement for most footprints. Correct ground telegraphs do not make this
  material cover the actual capsule/sector/ring. Arbitrary origin(.5,.6) and
  y-size*.16 offset are not measured per-effect ground/weapon anchors.
- Last live tests validate damage/telegraph/escape, not a real authored gait,
  full organic-motion continuity or production art approval. Earlier results
  must not be reused as proof of this new quality request.

## Correction contract / first proof
Begin one owned boss/direction/action and one attack spatial binding, inspect
actual game at slow/normal speed before scaling. Real authored contact/down/pass/
up poses, opposite left/right support and loop continuity; phase follows world
travel, does not restart on direction changes. No timewarp duplicates, global
sprite bobbing, crossfade or FPS bump counted as new authored motion frames.
Cast has authored preparation, windup, release and recovery in-betweens. Release
is mapped to authoritative startsAt; do not change hit timing to suit art.
Organic VFX require stage frame budgets/FPS and geometry-aware material profiles:
source socket, locked destination, beam length/halfwidth, swept ring inner/outer,
sector mask and decaying aftermath separate from dangerous area. Do not stretch
one spherical image across all attacks. Ground tells remain exact and visible.
Use owned ImageGen sprites/materials plus bounded Phaser texture particles,
mesh/rope trails and WebGL-guarded lighting/distortion only where justified;
Canvas fallback/reduced motion and cleanup are required. These additions do not
replace authored organic art. Physical GPU tools require the existing explicit
queue permission; no GPU queueing/auto-approval is authorized by this audit.

Calon implementation and evidence are now in ../calon-arang/README.md. Existing boss corrections and user visual approvals remain pending; no earlier boss runtime was changed in this batch.
