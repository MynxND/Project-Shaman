# Japan VFX production spec + credit estimate (2026-10-11, awaiting one-time user approval)

Approved inputs: `ONMYOJI_V2_DESIGN.md` (approved), `MIKO_V2_DESIGN.md` and `JAPAN_VFX_LANGUAGE.md` (approved
2026-10-11). Shimenawa rope: not used (user did not choose it; avoids a sacred object).
User 2026-10-11: one approval covers the whole Japan set (no step-by-step approvals like Russia). Visual approval of the
finished set stays with the user; QA fixes are free code post-passes.

Method (same as Russia): layered recipe in shared code (ground / behind / aura / front / particles), phases
anticipation → manifestation → impact → dissipation, pack + publish to `apps/client/public/assets/skills/japan-v1/`,
lab composite, ledger with the per-job "charged:" line.

Cost basis from Thailand/Indonesia/Russia ledgers: seed ≈ 6, animation 2–8 (≈ 5), icon sheet (16 icons) 9.
REGENERATE = new seed + animation (≈ 11). MODIFY = reuse art with code tint/scale/crop (0). REUSE = as-is (0).
PASSIVE_STAT = no VFX (policy).

## Kit (shared layers)

| Kit | Use | Layer | Size / frames | Class | Credits |
|---|---|---|---|---|---|
| K1 element residue marks (leaf, flame, stone, needle, ripple in one row, sliced) | residue on targets/ground; generate flow / overcome crack done in code (pulse, tint, scale) | particles | 160×32 static | REGENERATE (seed only) | 6 |
| K2 held talisman (paper ofuda, fictional brush strokes) | orbiting element talismans, tinted ×5 in code; Mandala aura | aura | 32×48 · 8 | REGENERATE | 11 |
| K3 ofuda burst (talismans fanning out) | Invoke flash on every spell; Ofuda Ward Shot impact | front | 128×96 · 8 | REGENERATE | 11 |
| K4 paper swallow | Molten Swallows (tinted molten), shikigami/paper motifs | projectile | 48×32 · 6 | REGENERATE | 11 |
| K5 Gogyō ground ring (five points in generating order, ring not star) | Mandala, Ring Seal | ground | 192×96 · 10 | REGENERATE | 11 |
| K6 blessing glint | Miko conversions (tinted per blessing), Purify, Divine Grace | particles | 64×64 · 8 | REGENERATE | 11 |
| K7 gohei sweep arc (white paper streamers) | Harae Sweep, Kagura accents | front | 128×64 · 8 | REGENERATE | 11 |

Kit subtotal: **72**

## Onmyoji (2nd job Onmyoji, 3rd job Grand Onmyoji Master)

| Skill | Behaviour | Placement | Layers | Class | Credits |
|---|---|---|---|---|---|
| Wood / Fire / Earth / Metal / Water Talisman | toggle element into ring | self | K2 tinted (aura) | MODIFY | 0 |
| Onmyō Seal (Invoke) | passive unlock + Invoke action | self | K3 flash | REUSE | 0 |
| Sōshō Flow, Sōkoku Break | trigger | target | K1 flow / crack pulses | MODIFY | 0 |
| Taikyoku Balance | trigger stack indicator | self | K2 small, code | MODIFY | 0 |
| Shikigami Pact | stat | — | none (PASSIVE_STAT) | — | 0 |
| Bonfire Ward (wood+fire) | zone | zone | ground bonfire circle of fox-fire + K1 leaf/flame | REGENERATE | 11 |
| Ash Barrier (fire+earth) | ward | zone | low ash-stone ring, embers | REGENERATE | 11 |
| Kongō Talisman (earth+metal) | ally shield | target | stone-and-gold plate shell, breaks into shards | REGENERATE | 11 |
| Mirror Pond (metal+water) | zone + swap | zone | flat water mirror with silver rim | REGENERATE | 11 |
| Spring Rain (water+wood) | party HOT zone | zone | Miko Cleansing Rain tinted green + K1 leaves | MODIFY | 0 |
| Root Fissure (wood+earth) | line CC | projectile line | roots splitting stone in a line | REGENERATE | 11 |
| Mudslide (earth+water) | cone knockback | impact cone | wave of mud and stones | REGENERATE | 11 |
| Steam Burst (water+fire) | single burst | target | steam explosion column | REGENERATE | 11 |
| Molten Swallows (fire+metal) | homing ×3 | projectile | K4 tinted molten + small K3 impact | MODIFY | 0 |
| Leaf Blade Storm (metal+wood) | AOE DOT | zone | whirl of blade-leaves | REGENERATE | 11 |
| 5 shikigami summons (same element ×2) | summon | summon | one cut-paper hitogata transformation flash, tinted per element | REGENERATE | 11 |
| Gogyō Mandala | ultimate mode | self | K5 ×1.6 + 5 K2 orbit | MODIFY | 0 |
| Gogyō Ring Seal | ultimate burst | zone | K5 + new five-point seal detonation | REGENERATE | 11 |
| Shikigami Ascension | ultimate buff | summon | hitogata flash ×2 + aura | MODIFY | 0 |
| Third Talisman, Onmyō Mastery | stat | — | none | — | 0 |

Onmyoji subtotal: **110**. Creature sprites for the 5 shikigami and their great forms are **not included** (summon
creatures were deferred earlier; separate decision).

## Miko (2nd job Miko, 3rd job High Oracle Priestess)

| Skill | Behaviour | Placement | Layers | Class | Credits |
|---|---|---|---|---|---|
| Harae Sweep | cleanse + convert | target | K7 + K6 | MODIFY | 0 |
| Kagura Purification Dance | party heal channel | zone | ground ring of streamers and falling paper petals | REGENERATE | 11 |
| Suzu Bell Blessing | ally buff | target | golden bell chime rings | REGENERATE | 11 |
| Ofuda Ward Shot | projectile + knockback | projectile | K2 single talisman as projectile + K3 impact | MODIFY | 0 |
| Cleansing Rain | party cleanse, screen | zone | wide falling rain with white streamers | REGENERATE | 11 |
| Holy Ward, Priestess Grace, Blessing Craft, Shrine Path | stat | — | none | — | 0 |
| Purify | trigger | self | K6 small | REUSE | 0 |
| Divine Miracle Resurrection | ultimate | zone | warm dawn light falling with rising streamers | REGENERATE | 11 |
| Kotodama Sacred Song | ultimate buff | self | sound ripple rings with streamers | REGENERATE | 11 |
| Sun Pillar | ultimate zone | zone | pillar of sunlight on the ground | REGENERATE | 11 |
| Divine Grace | trigger | self | K6 | REUSE | 0 |
| Oracle's Vision | stat/utility | — | none | — | 0 |

Miko subtotal: **66**

## Icons

30 icons (15 Onmyoji, 15 Miko) as 2 packed 4×4 sheets of 64 px: **18**

## Total

| Part | Credits |
|---|---|
| Kit | 72 |
| Onmyoji | 110 |
| Miko | 66 |
| Icons | 18 |
| **Estimate** | **266** |
| Redo buffer (QA rejects, ~20%) | 54 |
| **Approval cap requested** | **320** |

Animations vary 2–8, so the real total can land roughly 230–300. If spending reaches the 320 cap, work stops and
asks. No spend on creature sprites.

## Free work in the same run

`skills-japan.ts` catalog (30 skills, Thai readable names, v2 mechanics, presentation records, layer recipes), tests,
lab tabs for Onmyoji and Miko (element toggles + Invoke preview), Japan pale ramp in `post_thai_vfx.mjs`, docs,
ledger, QA sheets.

## Production order

1. Kit K1–K7 → QA (free fixes).
2. Icons (2 sheets).
3. Onmyoji destruction spells, then creation spells, summon flash, Ring Seal.
4. Miko spells.
5. Catalog + lab composite of all 30, QA sheet, report to the user for visual approval.

## Revision after user question (2026-10-11): "why ~100 more than other nations?"

Comparison from ledgers (seed charges were not logged per job, counted at ≈6 each):

| Nation | New generated pieces | Seeds | Animations (logged) | Icons | ≈ Total |
|---|---|---|---|---|---|
| Indonesia | 16 effects, no kit | ≈ 96 | 69 (avg 4.3) | ≈ 18 | ≈ 183 |
| Russia | 17 effects + 8 kit | ≈ 150 | 79 (avg 3.2) | ≈ 18 | ≈ 247 |
| Japan (first estimate) | 16 effects + 7 kit | 138 | 110 (avg 5 assumed) | 18 | 266 (+54 buffer → cap 320) |

Causes: the cap includes a 54 redo buffer that earlier nations never stated; animation average was assumed 5 while
the real average is ≈ 3.5; Japan has as many pieces as Russia (more than Indonesia) because two classes both need
their own spells plus an invoker kit.

Re-estimate with real averages (seed 6 + animation 3.5): **≈ 233**. Lean option (more reuse):
- K7 gohei arc → code-drawn arc with K3 paper pieces (−9.5)
- shikigami summon flash → K3 burst tinted per element (−9.5)
- Gogyō Ring Seal → K5 ring + K1 marks bursting in code (−9.5)
- Suzu Bell → K6 glint + code chime rings (−9.5)
- K2 talisman static, flutter in code (−3.5)

Lean estimate: **≈ 191** (17 animated pieces + K1 and K2 seed-only + icons), cap **≈ 220**.
