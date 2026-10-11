# Equipment continuation checkpoint

**STOP — user rejected identity-changing outfits.** Do not run the recovery commands below; they describe the earlier pipeline. All current pipeline workers were stopped and nine pending remote jobs cancelled. `finish_pending.ps1`/`finalize_pending.ps1` now fail immediately; non-base generation is blocked. Bronze-ward is archived and excluded from runtime packaging/equipping. Next work is identity-preserving garment reconstruction and one reviewed proof, not completing the rejected body variants. See `docs/art-direction.md`.

Current user task: continue Claude's interrupted modular character/equipment implementation. The latest Claude request concerned actual held weapons and worn outfits, not additional landscape work. The world, server, bag/status UI and `/characters` inspector now consume the modular rig.

Read `README.md` and `coverage.json` here for scope/asset coverage. Coverage is refreshed by `tools/rig/verify_rig_v2.py`; it is not design approval. Native body/outfit files and PixelLab job ids live in `docs/design/rig/raw/<body>/<outfit>/<action>/<facing>/`. A job may be completed remotely even if local PNGs are missing; resume `animate_skeleton.ps1` to fetch that saved job instead of submitting a new paid generation.

Generation jobs already running must be inspected before launching another worker for the same body/outfit/action. `resume_rig.ps1` skips complete frame sets. `finish_pending.ps1` coordinates the current pending sets, packages new files, and checks final coverage. Do not run two copies of that coordinator. It waits for the existing male base/outfit jobs before enabling subsequent female motion/outfit workers.

`finalize_pending.ps1` is also running for this continuation. It submits no generations: it waits for all raw sets, then packages, runs the strict complete-coverage verifier and rebuilds the four PNG/GIF overviews. This also handles the case where the generation coordinator is waiting for workers after its two-hour packaging loop. Neither script grants aesthetic approval. The latest coverage remains in `coverage.json`; inspect it instead of assuming that an elapsed wait means completion. New `resume_rig.ps1` invocations split each action into two disjoint direction groups by default; existing workers are unaffected. `-DirectionGroups 1` keeps one worker per action.

Recovery commands, using a Python installation with Pillow/NumPy:

```
tools/rig/resume_rig.ps1 -Body male -Outfit base
tools/rig/resume_rig.ps1 -Body male -Outfit bronze-ward
tools/rig/resume_rig.ps1 -Body female -Outfit base
tools/rig/resume_rig.ps1 -Body female -Outfit bronze-ward
python tools/rig/build_rig_v2.py
python tools/rig/verify_rig_v2.py --complete
python tools/rig/review_overview.py
pnpm typecheck
pnpm build
pnpm test
```

Run recovery generations only for missing sets with no existing worker. Inspect all eight facings / four actions in `/characters`, actual equip/unequip in the bag and status window, and cast attachment continuity. Responsive browser layout was checked through `/characters/responsive`: one iframe changes between 390×844 and 844×390 outer dimensions. The character canvas retained its runtime id and selected outfit across orientation changes, with no horizontal overflow. The live world's open status sheet survived the same orientation change. Evidence is under `screens/mobile-*.png`. This checks CSS viewport layout, not physical mobile input or device performance. The browser's direct viewport override did not affect actual DOM dimensions, so it was reset.

Independent hair/top/pants require new reviewed layers; flattened originals have not been automatically separated. Equipment bonuses are not integrated into combat formulas. These are explicit gaps, not placeholder functionality to advertise as complete.
