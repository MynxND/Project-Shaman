# Weapon attack follow-up — 2026-10-12

User request: “ทำงานถัดไปเลย”, following the live combat smoke review. This slice addresses the four
remaining palm-body weapon classes on the currently playable male V3 body. It does not approve new
skill behavior, balance, female V3, or replace the shared magic point/cast action.

## Motion and sources

| Body action | Item | Eight-frame motion | Contact/release frame |
|---|---|---|---|
| attack-bow | bow-ullr | bow arm extended; draw fist to cheek; release past ear; recover | 4 |
| attack-knife | knife-mor | chamber at opposite shoulder; diagonal slash; low follow-through; guard | 3 |
| attack-axe-shield | axe-juggernaut | shoulder wind-up; diagonal chop; other forearm guards with existing shield | 3 |
| attack-axe-twohand | axe-taiga | both hands raise together; held overhead anticipation; downward chop; lift | 4 |

Native128, eight independent generated directions, eight frames each at16fps. Main character head and item
PNGs remain unchanged. Body sources are the owned `body-eight-02` direction files, using original authored
18-joint poses from `weapon_attack_03.mjs` and the existing motion study. No third-party sprite inputs.
The existing item layers supply every weapon/shield; explicit per-frame rotation replaces the palm-strike
tilt for these clips. Both Taiga hand anchors stay9 native pixels apart along the same shaft. The chosen
guard hand also applies during idle/walk/cast, preventing an item swap at attack start.

PixelLab `animate_with_skeleton_v3` requests, poses, reference PNGs, job receipts and untouched raw frames
are under each `attack-*-04/`. Each eight-frame job charges3 generations. Initial `attack-*-03/` EAST
probes are rejected: the model baked generic weapons into the body despite empty-hand instructions.
Those four jobs cost12; their pixels never enter runtime. Revision04 describes only empty-hand movement.
Provider admission rejections at10/10 are not accepted jobs and are retried only after a slot opens.
Successful receipts/poll files prevent repeat submission. Unknown submission errors stop the runner.

Publishing removes tiny detached specks and shifts whole frames by integer pixels to the original foot
baseline, retaining raw originals. Neck and hand anchors receive the same translation. Every frame,
head reference and atlas has a SHA256 hash. Hand overlays copy warm skin pixels near authored hand anchors;
this is a grip aid, not evidence that the generator followed every joint exactly.

## Runtime review

- `/?rig=preview&pose=attack&weapon=bow-ullr` repeats the selected motion in all eight directions.
- Add `&frame=4` to hold the contact/release frame (0–7). The male row is V3; the female row remains legacy.
- Replace the weapon with `knife-mor`, `axe-juggernaut`, or `axe-taiga` for the other classes.
- Live combat remains server-driven. The previous authoritative `attackDelayMs` playback fitting applies
  to all new clips. Contact indices are presentation metadata; server damage/projectile timing is unchanged.
- Bow item art retains its existing string; body draw/release is implemented, not a deforming string simulation.

## Validation

`pnpm test:weapon-actions` checks action selection, every published frame/atlas hash, unchanged head sources,
ground contact, hand translation, overlay dimensions, rotations and Taiga shaft spacing. Source sheets and
browser captures are review evidence; final visual acceptance belongs to the user.

## Publish status

All 32 direction jobs completed (96 generations) and were published; `raw-review.png` per `attack-*-04/` is the
frame-by-frame sheet. Review findings:

- attack-axe-twohand north-west frames 2–3 had a baked-in generic axe. Fixed without regeneration:
  `tools/rig/clean_baked_weapon.mjs` erases the blade region into `attack-axe-twohand-04/clean/` (raw kept);
  `publish_weapon_action.mjs` prefers `clean/` frames when present.
- attack-bow east frames 3–5 pixels above the neck are the draw fist behind the head, not noise; no change.
- Raised-hand frames (bow west/south-west, axe-shield west/south-west, twohand west/north-west) warn that the neck
  stump differs from the authored neck. Head-composite check confirms the authored neck attaches correctly.

## Per-branch magic casts — 2026-10-12

User request: “ทำการเปลี่ยนท่าร่ายให้ไม่เหมือนกันแต่ละสาย”. Each magic branch weapon now has its own basic-attack body (motion study
per-class table); `staff-bell`/`staff-bone` keep the shared `attack-cast` point. Same pipeline and checks as above.

| Body action | Item | Motion | Hit |
|---|---|---|---|
| attack-cast-staff | staff-achan | two hands on the shaft: draw back to the hip, jab forward at chest height | 3 |
| attack-cast-rune | staff-rune-seer | staff raised high, planted in front leaning outward; free palm pushes a rune forward | 4 |
| attack-cast-wand | wand-santet | wand cocked by the ear, flicked forward; free fist yanks back to the hip (needle thread) | 3 |
| attack-cast-fan | fan-onmyoji | chamber at the opposite shoulder, wide sweep; two fingers raised at the face | 3 |
| attack-cast-gohei | gohei-miko | purification wave across the body left–right–left; free palm upright at the chest | 3 |

40 jobs, 120 generations (EAST probes first, then seven directions). Fan east frame 6 had a baked grey fan; cleaned
by `clean_baked_weapon.mjs`. Rune staff lean is attachment-only (no regeneration). Browser captures at the hit frame:
`docs/design/combat/playtest-2026-10-12/rig-<weapon>-f<frame>.png`. `visualApproved: false`.

Remaining after this slice: VFX readability/ground rotation, physical-device
touch testing and exhaustive multi-client skill cases from the preceding playtest report.
