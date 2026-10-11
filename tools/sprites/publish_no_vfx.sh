#!/usr/bin/env bash
# Post-processes and packs every Norway effect/kit whose animation finished (idempotent; no generation), the static
# Norway circle (line pass), the code-drawn rune glyph sheets and the icon sheets.
cd "$(dirname "$0")/../.."
export VFX_SET=norway-v1
RAW=docs/design/skills/$VFX_SET/raw
mkdir -p apps/client/public/assets/skills/$VFX_SET
FEET=" rune-trap absolute-zero-field "
declare -A POST=([blizzard-storm]=--clear-edge-white [kit-spirit-impact]=--lilac-core [kit-spirit-arrow]=--lilac-core [kit-bone-falcon]=--lilac-core [kit-bone-falcon-dive]=--violet-flash)
for d in "$RAW"/*/; do
  k=$(basename "$d"); [[ "$k" == *-post || "$k" == *-lines || "$k" == icons-* || "$k" == no-cast-circle ]] && continue
  ls "$d"frame-*.png >/dev/null 2>&1 || continue
  [ -f "$d"rejected/review.json ] && continue
  node tools/sprites/post_thai_vfx.mjs "$k" ${POST[$k]} >/dev/null || continue
  if [[ "$FEET" == *" $k "* ]]; then node tools/sprites/pack_thai_vfx.mjs "$k-post" --as "$k"; else node tools/sprites/pack_thai_vfx.mjs "$k-post" --as "$k" --center; fi
done
# Norway master circle (seed → line pass → static kit).
if [ -f "$RAW/no-cast-circle/seed.png" ]; then
  node tools/sprites/circle_lines.mjs no-cast-circle --neutral >/dev/null
  mkdir -p "$RAW/no-cast-circle-post" && cp "$RAW/no-cast-circle-lines/seed.png" "$RAW/no-cast-circle-post/frame-00.png" && cp "$RAW/no-cast-circle/jobs.json" "$RAW/no-cast-circle-post/jobs.json"
  node tools/sprites/pack_thai_vfx.mjs no-cast-circle-post --as no-cast-circle --center
fi
# Code-drawn rune glyphs (tools/sprites/rune_glyphs.mjs).
for r in rune-isa rune-hagalaz rune-perthro rune-kenaz rune-naudiz rune-thurisaz rune-dagaz rune-uruz rune-raidho; do [ -d "$RAW/$r-post" ] && node tools/sprites/pack_thai_vfx.mjs "$r-post" --as "$r" --center; done
for s in icons-ullr-hunter-sheet icons-rune-seer-sheet; do [ -f "$RAW/$s/seed.png" ] && node tools/sprites/slice_thai_icons.mjs "$s"; done
