# Medium novice walk, eight directions (walk-eight-02)

User approved body-eight-02 ("ผ่านแล้ว ทำท่าเดิน 8 ทิศต่อเลย", 2026-10-10; see body-eight-02/user-approval.json) and requested an eight-direction walk.

Generation: one PixelLab `animate_object` v3 call on the approved headless 8-direction object (03b27465-…), 8 frames per direction (provider stores 9; frame 0 is the echoed idle reference and is excluded from the loop). Actual 16 generations (balance-before/after), no retries. Raw frames in `raw/`.

Assembly: the body is the only animated texture. The approved static head for that direction (head-eight-01, frozen) is parented to a per-frame NeckAnchor. Each frame's neck pivot is measured from the real neck stump and offset by the approved static anchor (so the E/W 3px correction carries over). Frames are ground-locked: the whole frame is shifted vertically so the lowest foot pixel sits on the idle baseline (removes provider drift; north drifted up to 5px), see neck-pivots.json.

Runtime: `apps/client/public/assets/character-v3/walk-eight-02/` (64 PNGs, 1024×1024 sheet, manifest walk-eight/1, 8 fps loop). Inspector: /characters/v3 top section plays all eight directions together with play/pause, frame step, fps, head toggle and neck guides. `walk-review-2x.gif` and `assembled-review-2x.png` are diagnostic composites only.

South regenerated once at user request (2026-10-10, +2 generations, total 18): v1 torso twisted to three-quarter mid-cycle; v1 frames kept as raw/south-v1-*.png, v2 used. North regenerated once at user request (+2, total 20): v1 swung both arms outward together and legs barely alternated; v2 prompt specifies contralateral gait. v1 kept as raw/north-v1-*.png. Not yet live-world integrated; no run/attack.

North v3 (2026-10-10, +3, total 23): arms still swung together in prompt-only v2, so north now uses animate_with_skeleton_v3 with an explicit 8-frame contralateral skeleton (tools/rig/walk_skeleton.mjs; skeleton-north-poses.json). Motion principles (arms close to body, arm opposite same-side leg, contact/down/pass/up per leg) were studied from a user-shown reference sheet that was NOT sent to any provider. v2 kept as raw/north-v2-*.png.
