# Russia / Siberia skill VFX — design review (proposal, 2026-10-11)

User chose Russia for a shield tank: Juggernaut Volkhv = **one-handed axe + large shield** (user decision; the source only
names the shield in Shield Bash), theme **ice blue + iron silver + Slavic embroidery red**; Taiga Shaman (two-handed axe
bruiser) leans blood red / blood moon. Source lines 1317–1476. Catalogue `packages/shared/src/skills-russia.ts`
(30 skills, Thai names proposed, test `skills-russia-test.mjs`); lab tabs in `/skills`. Language: `RUSSIA_VFX_LANGUAGE.md`.

## Behaviour

Juggernaut: Wolf Spirit Armor (instant, 60 s aura), Taunting Howl (instant, 9×9), Siberian Frost Step (cast 0.5 s, 5×5),
Shield Bash (instant impact, stun), Snow Fort (cast 1 s, 10 s aura), Taiga's Absolute Fortress (instant, invulnerable aura),
Titan Stomp (cast 1.5 s, 7×7), Warlord's Command (cast 2 s, party reflect). Taiga Survivor / Unstoppable Will = triggers
reusing Wolf Armor / Fortress art; Iron Will, Vitality Boost, Heavy Armor Mastery, Aggro Mastery, Colossus Blood = stat.

Taiga Shaman: Slavic Axe Strike (instant impact, bleed), Berserker Blood (instant, 30 s aura), Wolf Pack Call (cast 1 s,
wolves charge in a line), Leap Strike (instant, 3×3 landing), Blood Scent (instant dash), Bloodthirsty Wolf Frenzy (instant,
12 s aura), Decapitate (cast 1 s), Blood Moon (cast 3 s, 11×11 party buff), Undying Rage (trigger, own art). Rend, Axe
Mastery, Frenzy ASPD, Pain Killer, Hunter's Mark, Wolf Blood Mastery = stat.

17 new effects + 2 icon sheets; estimate seeds ≈ 104, animations ≈ 84, icons ≈ 18 (≈ 206).

## Step 1 result (2026-10-11)

Plan PRODUCTION_SPEC.md approved. Kit K1–K5 and both icon sheets generated (per-job charges in LEDGER.md). Visual QA:
K1 centre was a flat white snow disc → cleared; washed patches recoloured to snow (post-pass is now nation-aware: Russia
snow/ice instead of Thai lilac / Indonesian parchment). K2, K3, K4 pass. K5 embroidery band is drawn as a short standing
ring rather than a flat ground band — kept for review. 30 icons published. Evidence: `step1-kit-seeds.png`,
`step1-kit-animated.png`, `icons-*-sheet-review.png`. Step 2 prompts (6 heroes) written, not generated.

## Step 2 result (2026-10-11)

Six heroes generated and animated (charges in LEDGER.md), post-passed and published. Visual QA: Frost Step, Shield Bash,
Leap Strike, Slavic Axe Strike, Decapitate pass (Decapitate's red mist splash reads close to a blood splash — flagged);
Titan Stomp's slabs barely move on their own, motion comes from the composed kit layers. The lab now composes kit layers
from `RUSSIA_VFX_LAYERS` (shared): ground at the anchor's feet, particles/front on the main art, and self-centred
particles under the actor so they never cover the player. Evidence: `step2-seeds.png`, `step2-animated.png`,
`titan-composite-in-lab.jpg`. Step 3 prompts (aura family overlays + heartbeat ring) written, not generated.

## Step 3 result (2026-10-11)

Generated: Berserker Blood veins, Wolf Frenzy claw slashes, Undying Rage overlay, heartbeat ring (charges in LEDGER.md).
Visual QA: veins and claws turned white/blue/yellow mid-animation (lightning look) → `post_thai_vfx.mjs --to-crimson`;
heartbeat ring morphed into diamond/star shapes → kept frame 0 only, pulsed in code (`pulse` in RUSSIA_VFX_LAYERS);
**Undying Rage overlay rejected** (drew a whole person outline with blades) → interim main art = K4 aura + pulsing ring,
redo prompt prepared in step 4. Decapitate's bottom splash recoloured to dusky mist (`--mist-bottom`, user request).
Evidence: `step3-animated.png` (raw), `step3-fixed.png`, `berserker-composite-in-lab.jpg`.

## Step 4 result (2026-10-11)

Snow Fort, Taiga's Absolute Fortress, War Banner, shield-wall ring, Blood Moon, wolf-ridge ring and the Undying Rage redo
(red shards only, no figure) generated and animated (charges in LEDGER.md). Visual QA fixes: shield wall's electric blue
→ ice ramp (`--to-ice`); Blood Moon's pale wash → seed detail (`--seed-detail`); banner anchored at its foot; Blood Moon
rebalanced (moon 1.1×, 150 px above the feet; wolf ridge 2×, ground band 1.6×). Lab supports main-art layer/offset
(`RUSSIA_VFX_MAIN`) and per-layer alpha/crop (Snow Fort front half below the waist). Evidence: `step4-seeds.png`,
`step4-animated.png`, `snow-fort-composite-in-lab.jpg`, `blood-moon-composite-in-lab.jpg`. Step 5 prompts updated.

## Step 5 result (2026-10-11) — Russia VFX complete (17/17 + 30 icons)

Wolf Spirit Armor, Taunting Howl, Wolf Pack Call and Blood Scent generated and animated (charges in LEDGER.md),
published. Wolf Spirit Armor and Taunting Howl draw behind the actor (`RUSSIA_VFX_MAIN`), verified in the lab:
the wolf coils behind the caster without covering the sprite. QA notes, then fixed free in code (user request; wolf-pack shields → pale fur `--shields-to-fur`, round patch still faintly visible; blood-scent flecks removed `--drop-flecks`):
some wolves in Wolf Pack Call show odd shield-like shapes on their backs; Blood Scent has a few white flecks
(`--clear-white` candidate). Evidence: `step5-animated.png`, `step5-lab-wolf-armor.jpg`, `step5-fixed.png`.
