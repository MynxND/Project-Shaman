#!/usr/bin/env bash
# Post-processes and packs every Indonesia effect whose animation finished (idempotent; no generation).
# Per-skill anchor rules follow the placement in skills-indonesia.ts: projectile/impact/tether/dash/zone = centre,
# others = feet (bottom). Shadow Stealth clears its white "character space".
cd "$(dirname "$0")/../.."
export VFX_SET=indonesia-v1
RAW=docs/design/skills/$VFX_SET/raw
declare -A MODE=(
  [black-magic-dart]=center [venom-spit]=center [keris-thrust]=center [voodoo-link]=center [assassinate]=center
  [poison-cloud]=center [mass-decay]=center [curse-of-the-archipelago]=center
)
declare -A POST=([shadow-stealth]=--clear-white [fatal-assassination]=--retint [keris-soul]=--cyan-to-green)
for d in "$RAW"/*/; do
  k=$(basename "$d"); [[ "$k" == *-post || "$k" == icons-* || "$k" == *-cast-circle* ]] && continue
  [ -f "$d"rejected/review.json ] && continue  # replaced/rejected in visual QA
  ls "$d"frame-*.png >/dev/null 2>&1 || continue
  node tools/sprites/post_thai_vfx.mjs "$k" ${POST[$k]} >/dev/null || continue
  if [ "$k" = keris-soul ]; then node tools/sprites/pack_thai_vfx.mjs "$k-post" --as shadow-clone; continue; fi  # rework v2: Keris Soul art under the shadow-clone id
  if [ "${MODE[$k]}" = center ]; then node tools/sprites/pack_thai_vfx.mjs "$k-post" --as "$k" --center; else node tools/sprites/pack_thai_vfx.mjs "$k-post" --as "$k"; fi
done
# Indonesia master casting/area circle (seed → line pass → static kit).
if [ -f "$RAW/id-cast-circle/seed.png" ]; then node tools/sprites/circle_lines.mjs id-cast-circle >/dev/null; mkdir -p "$RAW/id-cast-circle-post" && cp "$RAW/id-cast-circle-lines/seed.png" "$RAW/id-cast-circle-post/frame-00.png" && cp "$RAW/id-cast-circle/jobs.json" "$RAW/id-cast-circle-post/jobs.json" && node tools/sprites/pack_thai_vfx.mjs id-cast-circle-post --as id-cast-circle --center; fi
