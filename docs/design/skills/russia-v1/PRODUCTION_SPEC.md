# Russia VFX — production specification (for approval, 2026-10-11)

Status: **plan only — nothing generated or modified** (user requirement: "Do not generate or modify any assets until I
approve the plan"). Replaces the single-sprite batch in `prompts.json` (those prompts stay unused until re-approved).

Reference size: the native character is **≈ 95 px tall, ≈ 40 px wide** (feet at y 112, neck at y 48 on a 128 canvas).
"1.0 C" below = one character height. Style for all 17: Ragnarok-inspired 2D MMORPG pixel art, Slavic winter warrior +
Siberian spirit ritual + wolf guardian, hand-crafted look, one pixel density (native, no upscaled art), dark 1-px
outlines, upper-left light, no bloom or soft gradients, few large readable particles.

Palettes. **Tank (T):** ice blue `#bfe3f2 #7fb8d6 #3e6f8e`, iron `#c9ced4 #8a9099 #4a4f57`, embroidery red `#b5262e`,
linen `#efe6d2`, snow `#f4f7fa` (never pure white). **Berserker (B):** blood red `#e04040 #a01f24 #5c0f14`, iron, snow,
moon `#d9433a`, dark mist `#2a1416`.

Layers: **G** ground (under actor) · **BH** behind character · **OV** character overlay (thin, never covers face/body) ·
**FG** foreground · **P** particles · **AU** persistent aura (loop while state lasts). **Follows** = attached to the actor;
**Fixed** = stays at the world position where it was cast.

## 1. Existing Russian assets (inspected)

`apps/client/public/assets/skills/russia-v1/` and `docs/design/skills/russia-v1/raw/` contain **no art yet** (only an empty
manifest). Nothing to REUSE / MODIFY / REGENERATE. Other nations' kits (Thai smoke, Indonesian incense) are off-palette and
off-culture → not reused. Free runtime operations (scale, tint, alpha, rotation, flip, splitting one sprite into a
behind/front pair by mask) are used wherever possible.

## 2. Shared Russian kit (generated first, reused by many skills)

| Kit | Content | Layer | Size | Frames | Used by |
|---|---|---|---|---|---|
| K1 frost-crack ring | cracks race out across snow, ice shards poke up, fade | G | 192×112 | 10, once | Frost Step, Titan Stomp (×1.6), Leap Strike (×0.8), Shield Bash (×0.5) |
| K2 snow-ice burst | chunky snow puffs + ice splinters fly out and fall | P/FG | 128×96 | 8, once | Shield Bash, Leap Strike, Titan Stomp, Taunting Howl rim |
| K3 iron sparks | small hot sparks + iron flecks | P | 64×64 | 6, once | Shield Bash, Slavic Axe Strike, Decapitate |
| K4 crimson rage aura | low dark-red mist licking up around the actor (open centre) | AU (BH) | 128×144 | 12, loop | Berserker Blood, Wolf Frenzy, Undying Rage (each with its own overlay) |
| K5 embroidery ground band | ring of red Slavic cross-stitch geometric pattern on linen-white | G | 224×128 | static (runtime pulse/rotate) | Warlord's Command, Fortress base, Blood Moon (red tint) |

## 3. Skill table

| # | Skill | Visual concept (distinct silhouette) | Sequence A → M → I → D | Frames / timing | Size vs C · placement | Layers | Palette | Reuses | New art | Risks |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Wolf Spirit Armor | translucent wolf **pelt cloak** on shoulders, wolf muzzle over one shoulder (no howl) | A frost breath gathers · M cloak drapes down · I frost flash · D settles into idle loop | 8 once + 8 loop · 0.5 s + loop 0.8 s | 1.1 C · Follows · AU loop 60 s | BH cloak, small FG muzzle (one sprite split by mask) | T | — | hero 128×144 | covering the face → muzzle kept at shoulder height, cloak ≤ 40% alpha over body |
| 2 | Taunting Howl | big **howling wolf head** rising behind (the only howling head) + frost rings | A head rises · M howl · I rings sweep out · D head dissolves to snow | 10 once · 0.7 s | 2.0 C wide · Fixed at cast point | BH head, G rings (K1 tinted, rings only), P K2 at rim | T | K1, K2 | hero head 128×128 | head too large over party → max 1.4 C tall |
| 3 | Siberian Frost Step | **stomp + jagged ice spikes** in a ring | A boot lifts (pose, later) · M cracks · I spikes jut · D spikes crumble | 10 once · 0.6 s | 1.6 C · Fixed | G K1, FG spikes ring | T | K1, K2 | spikes 192×96 | spikes hiding enemies' feet → spikes short |
| 4 | Shield Bash | **round iron-rimmed shield with red band** slams forward | A shield draw-back · M slam smear · I impact flash · D splinters fall | 8 once · 0.45 s | 0.9 C · Fixed, faces target | FG shield + smear, P K3 + K2 small, G K1 ×0.5 | T | K1, K2, K3 | hero 128×80 | shield must read as the player's own shield, not a projectile |
| 5 | Snow Fort | **low curved wall of snow blocks + ice slabs**, birch stakes, small red flags | A snow heaps · M blocks rise · I wall locks · D (on expiry) collapses | 10 build + 6 loop + 8 collapse | 1.6 C wide, ≤ 0.6 C high · Fixed | BH back half, FG front half (low, below the waist) | T | — | wall 192×96 (split by mask) | front half covering the body → front half ≤ 0.45 C high |
| 6 | Taiga's Absolute Fortress | **curled iron-and-ice wolf** around the actor + plate dome | A plates fall in · M wolf curls · I dome locks (flash) · D plates shatter | 8 build + 12 loop + 8 break | 1.6 C · Follows (actor cannot move) | BH wolf + back plates, FG translucent front plates (alpha ≤ 35%), G K5 ice-blue | T | K5 | hero 160×176 | dome hiding the player → front plates outline-only |
| 7 | Titan Stomp | **ground split** with heaved slabs and boulders | A dust gathers · M slabs heave · I shock ring · D debris rains | 12 once · 0.8 s | 2.6 C · Fixed | G K1 ×1.6, FG slabs/boulders, P K2 | T | K1, K2 | slabs 224×112 | screen noise → max 6 debris pieces |
| 8 | Warlord's Command | **planted war banner** (red embroidery) + horn blast rings + faint shield-wall ring | A banner raised · M planted · I horn ring sweeps · D shield-wall fades | 10 once + 8 banner loop | 1.6 C tall banner · Fixed | BH banner, G K5 + ring, FG faint shields (outline) | T | K5 | banner 96×160, shield-wall 224×96 | text-like embroidery → geometric only |
| 9 | Slavic Axe Strike | **wide bearded-axe arc** (horizontal) | A wind-up glint · M arc · I cut flash · D red mist trails off | 8 once · 0.4 s | 1.1 C · Fixed, faces target | FG arc, P K3, small red mist | B | K3 | arc 128×96 | blood look → red spirit mist, no droplets |
| 10 | Berserker Blood | **glowing red vein pattern** over a dark aura (no wolf) | A self-cut flash · M veins light · I pulse · D loop | 6 once + 12 loop | 1.2 C · Follows · AU 30 s | AU K4 (BH), OV thin vein glow at limbs only | B | K4 | veins overlay 96×128 | overlay on face → veins limited to arms/torso edges |
| 11 | Wolf Pack Call | **three full-body running wolves** (not heads) from a bone horn | A horn blast · M wolves leap out · I hit in a line · D fade | 12 once · 0.8 s | strip 2.4 C · Fixed, stretched toward target | FG strip | B | — | strip 224×80 | wolves overlapping into a blob → staggered spacing |
| 12 | Leap Strike | **vertical falling-axe streak** into a crater | A rise trail · M streak · I crater burst · D chunks fall | 10 once · 0.6 s | 1.3 C · Fixed at landing | FG streak, G K1 ×0.8, P K2 | B | K1, K2 | streak 64×128 | streak covering the landing actor → thin |
| 13 | Blood Scent | **thin red scent trail** + low sprinting wolf silhouette | A sniff mist · M trail draws · I dash · D trail evaporates | 8 once · 0.45 s | strip 2 C · Fixed, stretched | G trail strip | B | — | strip 192×48 | too similar to 11 → no full wolf, only a shadow outline |
| 14 | Bloodthirsty Wolf Frenzy | **claw-slash marks + red steam** bursting from the actor (no wolf head) | A crouch steam · M slashes rip the air · I flash · D loop | 6 once + 12 loop | 1.4 C · Follows · AU 12 s | AU K4 (BH), FG claw slashes (sparse) | B | K4 | slashes 128×128 | constant slashes = noise → 3 slashes per loop |
| 15 | Decapitate | **huge downward axe arc** (vertical, heavier than 9) | A long wind-up glint · M arc · I heavy flash · D mist halves | 10 once · 0.6 s | 1.5 C · Fixed on target | FG arc, P K3, G red mist splash | B | K3 | arc 128×144 | gore → no body parts, mist only |
| 16 | Blood Moon | **giant blood moon** low behind + howling wolf **silhouettes on the horizon ring** (small, distant) | A sky darkens · M moon rises · I wolves howl, ground pulses · D moon sinks | 12 once + 12 loop | 3 C wide · Fixed · AU zone 30 s | BH moon (high, behind), G K5 red + mist ellipse, FG none | B | K5 | moon 128×128, wolves ring 256×96 | covering allies → moon stays behind and above heads |
| 17 | Undying Rage | **cracked red light** breaking out of the actor + **heartbeat shock ring** | A HP-0 freeze · M cracks · I heartbeat ring · D loop until revive | 6 once + 8 loop | 1.3 C · Follows · AU 5 s | AU K4 (BH, stronger tint), OV thin crack glow (edges only), G heartbeat ring | B | K4 | cracks 96×128, ring 160×80 | white flash → red only |

Wolf manifestations are now distinct: cloak (1), howling head (2), curled guardian (6), running pack (11), shadow outline
(13), distant silhouettes (16). Frenzy, Berserker Blood and Undying Rage use no wolf head.

## 4. QA checklist per asset (before showing it as done)

Frame size and count match the table; no duplicated or missing frames; alignment stable (anchor drift ≤ 1 px); palette
within the tables above; no white silhouettes; nothing opaque over the player's face/body; no background pixels; native
pixel scale only; particle count within limits; direction correct for faced effects. Then a **visual inspection** of the
rendered frames and the in-lab composite — automatic checks never replace it.

## 5. Production order (reuse first, cheapest first)

1. **Kit K1–K5** (5 seeds, 4 animations) ≈ 25 + 14 → validates palette and pixel density for everything after.
2. **Kit-heavy skills** that need only one small hero sprite: Frost Step, Shield Bash, Titan Stomp, Leap Strike,
   Slavic Axe Strike, Decapitate (6 heroes) ≈ 30 + 24.
3. **Aura family** on K4: Berserker Blood, Wolf Frenzy, Undying Rage (3 overlays + 1 ring) ≈ 20 + 14.
4. **Formations**: Snow Fort, Fortress, Warlord's Command, Blood Moon (5 heroes) ≈ 32 + 24.
5. **Unique creatures/strips**: Wolf Spirit Armor, Taunting Howl, Wolf Pack Call, Blood Scent ≈ 22 + 16.
6. **Icons** (2 sheets, already prompt-ready) ≈ 18 — can run with step 1.

Estimated total ≈ **240** generations (PixelLab per-job charges), slightly above the single-sprite plan (≈ 206) because
of separate layers; each step is shown for review before the next. Each step's prompts are written and shown with its
exact list before any generation.
