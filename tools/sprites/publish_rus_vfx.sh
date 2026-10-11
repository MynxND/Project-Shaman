#!/usr/bin/env bash
# Post-processes and packs every Russia effect whose animation finished (idempotent; no generation).
# Per-skill anchor rules follow the placement in skills-indonesia.ts: projectile/impact/tether/dash/zone = centre,
# others = feet (bottom). Kit assets (kit-*) are packed separately.
cd "$(dirname "$0")/../.."
export VFX_SET=russia-v1
RAW=docs/design/skills/$VFX_SET/raw
declare -A MODE=(
  [snow-fort]=center [siberian-frost-step]=center [shield-bash]=center [titan-stomp]=center [slavic-axe-strike]=center
  [wolf-pack-call]=center [blood-scent]=center [taunting-howl]=center [blood-moon]=center
)
declare -A POST=([blood-moon]=--seed-detail [decapitate]=--mist-bottom [berserker-blood]=--to-crimson [bloodthirsty-wolf-frenzy]=--to-crimson [wolf-pack-call]=--shields-to-fur [shield-clang]= [blood-scent]=--drop-flecks)
for d in "$RAW"/*/; do
  k=$(basename "$d"); [[ "$k" == *-post || "$k" == icons-* || "$k" == kit-* || "$k" == *-cast-circle* ]] && continue
  ls "$d"frame-*.png >/dev/null 2>&1 || continue
  [ -f "$d"rejected/review.json ] && continue  # rejected in visual QA
  node tools/sprites/post_thai_vfx.mjs "$k" ${POST[$k]} >/dev/null || continue
  if [ "$k" = shield-clang ]; then node tools/sprites/pack_thai_vfx.mjs "$k-post" --as taunting-howl --center; continue; fi  # rework v2: Shield Clang art under the taunting-howl id
  if [ "${MODE[$k]}" = center ]; then node tools/sprites/pack_thai_vfx.mjs "$k-post" --as "$k" --center; else node tools/sprites/pack_thai_vfx.mjs "$k-post" --as "$k"; fi
done
# Russia master casting/area circle (seed → line pass → static kit).
if [ -f "$RAW/ru-cast-circle/seed.png" ]; then node tools/sprites/circle_lines.mjs ru-cast-circle >/dev/null; mkdir -p "$RAW/ru-cast-circle-post" && cp "$RAW/ru-cast-circle-lines/seed.png" "$RAW/ru-cast-circle-post/frame-00.png" && cp "$RAW/ru-cast-circle/jobs.json" "$RAW/ru-cast-circle-post/jobs.json" && node tools/sprites/pack_thai_vfx.mjs ru-cast-circle-post --as ru-cast-circle --center; fi
