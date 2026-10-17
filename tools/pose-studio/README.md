# Pose Studio — MiniMax H3 image → video → sprite

Local tool, added 2026-10-14. It fixes mismatched character motion: each clip starts from the character's **exact idle frame** for that facing. MiniMax H3 (running locally in ComfyUI) animates the clip, and the tool then turns the video back into 128px sprite frames. The tool replaces the head in every frame with the **original head pixels**, then runs automatic QA and holds the clip until a human approves it.

- Web UI: `node tools/pose-studio/server.mjs` → http://127.0.0.1:8790/ (or the `pose-studio` entry in `.claude/launch.json`)
- CLI for people, Codex and Claude: `node tools/pose-studio/cli.mjs <command>`
- GPU-free behavioural test: `node tools/pose-studio/test.mjs`
- Requires ComfyUI at `C:\ComfyUI\ComfyUI_windows_portable` (0.39, `run_nvidia_gpu.bat`, port 8188) with the MiniMax H3 files listed in `lib/workflow.mjs`.

## Pipeline

1. **Keyframe** (`lib/prepare.mjs`)
   - Start from `<class>/idle/<dir>-with-head.png` (body plus original head) in `docs/design/equipment/class-2-imagegen-detail-01`.
   - Flatten it onto the key colour that is farthest from the sprite palette, then scale it ×6 with nearest-neighbour to 768px.
   - The prompt names the facing in screen terms and asks for a static camera, a flat background, the same costume and the motion.
2. **H3** (`lib/workflow.mjs`)
   - Uses the bundled template graph: fl2va int8 model, Qwen3-VL nvfp4 text encoder, int8 video VAE, and the turbo 8-step LoRA by default.
   - `first_frame` is the idle. Looping actions also set `last_frame` to the idle, so the clip returns to the stance.
   - Length snaps to H3's 17k+5 grid at 24 fps (22, 39, 56…).
   - Frames are saved as PNG. Audio is not decoded.
3. **Sprite conversion** (`lib/process.mjs`)
   - Key the background against the colour the model actually rendered.
   - Downsample each 6×6 block with a block medoid, then force every pixel into the idle palette.
   - Remove islands smaller than 8px.
   - Register the clip so that frame 0 lines up with the idle, and lock the feet to the idle baseline (not for `death`).
4. **Head**
   - Original head = the pixels that differ between the idle with head and the idle without head.
   - Track the head per frame inside a search window, erase the generated head above the collar, and stamp the original head at the tracked offset.
   - Each frame is also saved without the head (`body/`), with its `headOffset`, for the existing separate-head renderer.
5. **QA** (`lib/qa.mjs`) checks:
   - frame count and size, and empty frames
   - frame 0 matches the idle; for loops, the last frame also matches the idle
   - scale stays the same (no zoom) and the character doesn't drift sideways
   - nothing touches the canvas edge
   - colour distance from the original palette
   - how well the head was tracked
   - leftover pixel noise
   - frozen or popping motion

   **A QA pass is technical only. It is not visual approval.**
6. **Review**
   - Pick which video frames become the sprite (re-running QA), then approve or reject with a note.
   - Approval copies the clip to `docs/design/pose-studio/approved/<class>/<action>/<dir>/` with `visualApproved:true`.
   - Nothing is published to `apps/client/public` or the game manifests. Adopting a clip in the game is a separate, explicit step.

Job files are in `docs/design/pose-studio/jobs/<id>/`:
- `job.json` (status, parameters, QA, review), `prompt.txt`, `graph.json`, `input-first.png`
- `raw-sheet.png`, `native/` (all converted frames), `body/`, `frames.json`
- `sprite/`: `<dir>-<k>.png`, `sheet.png`, `preview.gif`, `manifest.json`

The full-size video frames in `raw/` are gitignored. Everything else stays in the repository.

## Ordering poses through Codex or Claude

When the user asks for a pose in plain language, for example "ให้ Keris แทงกริช 8 ทิศ":

```bash
node tools/pose-studio/cli.mjs status                     # server + ComfyUI must both be up
node tools/pose-studio/cli.mjs characters                 # ids, directions, action presets
node tools/pose-studio/cli.mjs generate --character keris --direction all --action thrust --by codex
node tools/pose-studio/cli.mjs generate --character miko --direction east --action custom \
     --custom "waves a gohei wand in a figure-eight, then bows" --frames 10 --length 39
node tools/pose-studio/cli.mjs wait <jobId> [<jobId>...]
node tools/pose-studio/cli.mjs show <jobId>               # QA lines + file paths + review URL
node tools/pose-studio/cli.mjs select <jobId> --frames 0,3,6,9,12,15,18,21
```

Rules for agents:
- **Ask the user before you queue GPU work.** On 2026-10-14 this PC lost power three times under heavy load, once while H3 was loading (`docs/design-decisions.md`).
- Inspect the result yourself: open `sprite/preview.gif` and `sprite/sheet.png`, and use the web UI's onion skin against the idle.
  - If you see anatomical, gait or costume problems, report them even when QA passes.
  - QA `fail` or `warn` lines must be quoted in your report.
- Fix bad clips with a new seed (`retry` in the UI, or `generate --seed N`), a sharper `--custom` motion description, or a different frame selection. Do not edit pixels by hand inside a job.
- **Never run `approve` unless the user explicitly approves that clip.** Visual approval belongs to the user.
- Write motion text in English and describe it in screen space. The tool already adds the facing, the camera lock, the background and the costume-lock wording.

## Known limits

- H3 renders at a 768 short edge. Sub-pixel detail below 6×6 blocks is lost, and the palette forcing removes colours that are not in the idle.
- The head tracker assumes the head keeps its idle facing. Turning the head, or hiding it behind a weapon, raises the head error. Check those frames.
- Large pose changes (crouch, death) can legitimately trip the scale warning.
- The H3 FunControlNet union patch (pose/depth control video) is supported by ComfyUI but not downloaded. Driving exact skeleton poses through it is a possible next step.
- MiniMax H3 is licensed under the MiniMax H3 Community License, not Apache/MIT. Review it before any commercial release.
