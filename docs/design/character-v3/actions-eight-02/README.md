# Medium novice attack and cast, eight directions (actions-eight-02)

User request (2026-10-10): V3 attack and cast after the walk went live. Headless body-eight-02 animations; the approved static head-eight-01 rides a per-frame neck pivot exactly like the walk.

- Attack: 8 frames, empty-handed palm strike, 16 fps one-shot (same timing as rig-v2).
- Cast: 12 frames matching `castPoseFrame` (intro 0-4, channel ping-pong 5-7, release 8-11); frames are driven by the server cast timeline.

Sources (raw/<action>-final/ is what was published; every candidate is kept):
- Attack S: skeleton (prompt-only S rotated to profile while the head stayed front). SE, E, N: first animate_object v3 call. NE: v3 fix call (first NE held a knife). NW, W, SW: animate_with_skeleton_v3 (`tools/rig/action_skeleton.mjs`; prompt-only versions added sparkles, turned, or waved above the shoulder).
- Cast S, SE, E, NE, W, SW: first v3 call. N: skeleton v2 with elbows-only pose (v3 and skeleton v1 both drew hands on the back). NW: **horizontal mirror of NE cast** (two NW generations raised fists above the shoulders or turned to face front); the back of the outfit is nearly symmetric. The NW head is still the real NW head.

Processing (`tools/rig/publish_action_eight.mjs`): islands under 8 px removed (provider specks), ground lock to the idle baseline, neck stump searched in a narrow column so hands beside the chest are ignored. Attack S frame 4 has no clear stump and uses the shoulder-line centre. Actual spend 72 generations (ledger.json, balance before/after). Diagnostics: attack/cast-assembled-review.png, attack/cast-review-2x.gif.

Runtime: `V3Puppet` plays attack via `CharacterSprite.playOnce` and holds server-timed cast frames via `setCastFrame`. Art review in the map: `/?rig=preview&pose=attack` or `/?rig=preview&pose=cast&frame=N`.
