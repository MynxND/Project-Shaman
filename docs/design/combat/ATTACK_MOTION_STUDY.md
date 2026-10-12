# Attack motion study: stances, kinetic chain, attack speed (2026-10-12)

User review of the first keris test: a straight-standing stab looks stiff. Fighters crouch and drive the stab from the
legs and hips. Dual daggers should alternate hands and stay smooth at high attack speed, and every class should follow
the same study. Sources are linked inline; items marked **[rec]** are our own choices rather than sourced numbers.

## Universal rules

- **Guard stance:** feet a little wider than the shoulders, knees bent, weight centred or slightly forward
  ([ActiveSG silat](https://www.activesgcircle.gov.sg/learn/silat/how-to-get-started-in-silat),
  [Wudang stances](https://wiki.wudang.academy/article/training-stances)). The silat front stance (kuda-kuda depan) puts
  the base on the bent front knee ([VOI](https://voi.id/en/sports/222578)). **[rec]** Knees 30–40°, hips 5–8 px lower
  in a 128 px frame, lead foot 3–6 px along the facing, torso leaning 10–20° toward the target.
- **Kinetic chain:** rear leg → hips → torso → shoulder → elbow → wrist, each segment peaking after the previous one.
  This holds for fencing lunges ([Mulloy et al. 2018](https://doaj.org/article/44ed994c71e544cda0238922d5c224a7),
  [lunge 2024](https://doaj.org/article/61b0e3adb9de467fae5b7d1ebc799c6f)) and straight punches
  ([Fuchs et al.](https://scholar.lib.ntnu.edu.tw/en/publications/kinematic-analysis-of-proximal-to-distal-and-simultaneous-motion-/)).
  In animation terms: the hips turn one frame before the arm extends.
- **Sink, drive, brake:** a lunge bends the rear knee, drives off the rear leg, then the front knee absorbs the stop.
- **Chamber and retract:** the weapon returns along its path to guard.
- **Guard hand:** the free hand stays up at chest or chin height, elbow tucked, never hanging.
- **Smears and readability:** smears go on contact frames only
  ([Slynyrd Pixelblog 9](https://slynyrd.com/blog/2018/9/8/pixelblog-9-melee-attacks),
  [Pixelblog 56](https://www.slynyrd.com/blog/2025/5/23/pixelblog-56-top-down-character-attack-animation)). Keep the
  weapon tip outside the head and torso silhouette at contact.
- **Facing toward or away from the camera:** a straight stab foreshortens to nothing. Angle it 10–20° to the striking
  side and sell the motion with the body (lunge plus a 1–2 px drop).

## Per weapon class (8 frames, frame 0 = frame 7 = guard, loopable)

| Class | Branches | Frames |
|---|---|---|
| Dual daggers | Keris | 0 guard (low silat stance, both blades at the hips) · 1 hips turn, right blade chambers · **2 right stab** · 3 retract · 4 hips counter-turn, left chambers · **5 left stab** · 6 retract · 7 guard. Forward grip; the free hand guards at the chest. |
| Ritual knife | Mor Phhee | 0 guard · 1 cock to the opposite shoulder, torso turned away ~20° · 2 smear · **3 diagonal slash** · 4 follow-through past the hip · 5 return · 6 settle · 7 guard (reverse grip optional) |
| Axe + shield | Juggernaut | Shield fixed in front of the torso in every frame. 0 guard · 1 axe to the shoulder, elbow high · 2 hips turn · **3 diagonal chop** · 4 axe low beside the shield · 5–6 rise · 7 guard |
| Two-hand axe | Taiga | Wide stance ~1.5× shoulders, deep knees. 0 guard (axe at a low diagonal) · 1–2 overhead wind-up (2 held as anticipation) · 3 smear · **4 chop**, torso hinged ~20° · 5 head near the ground · 6 lift · 7 guard |
| Longbow | Ullr Hunter | Side-on stance, hips ~30° open. 0 guard (bow up) · 1 nock · 2 half draw · 3 full draw at the mouth-corner anchor · **4 release** · 5 follow-through (draw hand past the ear) · 6 bow arm relaxes · 7 guard ([NASP 11 steps](https://www.naspschools.org/11-steps-to-archery-success/)). Fast loop: frames 2–5. |
| Staff | Achan, Rune Seer, Medium | Two-hand jab from an eye-level guard ([bo seigan](https://ryukyu-bugei.com/?p=9879)): 0–1 the rear hand draws the staff back · **2–3 the rear hand drives the thrust** · 4–5 retract · 6–7 guard |
| Short wand | Santet | One-hand forward flick at chest height; the free hand guards at the chest. |
| Fan | Onmyoji | Wrist-led flick slash ([tessenjutsu](https://en.wikipedia.org/wiki/Tessenjutsu)): chamber at the shoulder, **snap open on the hit**, close on the return. |
| Gohei | Miko | Purification wave left–right–left ([Ōnusa](https://en.wikipedia.org/wiki/%C5%8Cnusa)): guard · left sweep · **right sweep (hit)** · left sweep · guard. The streamers trail one frame behind the stick. |

## High attack speed

- **Two approaches in other games:** Diablo II drops whole frames at speed breakpoints and places the hit on an action
  frame ([Maxroll](https://maxroll.gg/d2/resources/attack-speed)). Warframe plays the same frames faster
  ([wiki](https://wiki.warframe.com/w/Attack_speed)).
- **Ragnarok:** ASPD becomes an attack delay ([iRO ASPD](https://irowiki.org/wiki/ASPD)); the damage number shows on
  the ACT `atk` event frame ([act-parser](https://raw.githubusercontent.com/csnv/act-parser/master/docs/fix-attack-delay.md)).
- **Policy for Project Shaman [rec]:**
  - Every attack animation stores its hit frames (dagger: 2 and 5).
  - The playback time fits the server attack delay, and the server stays authoritative for hits.
  - Below ~500 ms, compress anticipation first and recovery second, never the hit frame.
  - Each frame shows for at least 33–50 ms.
  - Below ~250 ms, play only one half-cycle per hit (dagger: 1–3 then 4–6 on the next hit), so every hit is still a
    readable stab and the hands alternate.
