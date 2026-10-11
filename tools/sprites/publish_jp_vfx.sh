#!/usr/bin/env bash
# Post-processes and packs every Japan effect and kit whose animation finished (idempotent; no generation).
# Anchor: centre for zones/rings/lines/kit pieces, feet (lowest opaque row) for things standing on a target.
# kit-element-marks (one still row of 5 marks) is sliced into kit-mark-<element> single-frame sheets (pulsed in code).
cd "$(dirname "$0")/../.."
export VFX_SET=japan-v1
RAW=docs/design/skills/$VFX_SET/raw
mkdir -p apps/client/public/assets/skills/$VFX_SET
FEET=" kongo-talisman steam-burst shikigami-summon divine-miracle-resurrection sun-pillar "
declare -A POST=([bonfire-ward]=--fox-to-flame [sun-pillar]=--clean-pillar)
if [ -f "$RAW/kit-element-marks/seed.png" ]; then
  node -e '
    const {sharp}=await import("./tools/rig/body-eight-lib.mjs"); const fs=await import("node:fs");
    const raw=process.argv[1]; const els=["wood","fire","earth","metal","water"];
    for (const [i,e] of els.entries()) { const d=`${raw}/kit-mark-${e}/`; fs.mkdirSync(d,{recursive:true});
      await sharp(`${raw}/kit-element-marks/seed.png`).extract({left:i*32,top:0,width:32,height:32}).png().toFile(d+"frame-00.png");
      fs.copyFileSync(`${raw}/kit-element-marks/jobs.json`, d+"jobs.json"); }' --input-type=module "$RAW"
fi
for d in "$RAW"/*/; do
  k=$(basename "$d"); [[ "$k" == *-post || "$k" == icons-* || "$k" == kit-element-marks || "$k" == shikigami-* || "$k" == great-* || "$k" == jp-* ]] && continue
  ls "$d"frame-*.png >/dev/null 2>&1 || continue
  [ -f "$d"rejected/review.json ] && continue  # rejected in visual QA
  node tools/sprites/post_thai_vfx.mjs "$k" ${POST[$k]} >/dev/null || continue
  if [[ "$FEET" == *" $k "* ]]; then node tools/sprites/pack_thai_vfx.mjs "$k-post" --as "$k"; else node tools/sprites/pack_thai_vfx.mjs "$k-post" --as "$k" --center; fi
done
for s in icons-onmyoji-sheet icons-onmyoji-spells-sheet icons-miko-sheet; do [ -f "$RAW/$s/seed.png" ] && node tools/sprites/slice_thai_icons.mjs "$s"; done
# Static circle kits (seed only; rotation, squash to the ground and tint are done in code). No pale ramp: kept bright for tinting.
for c in jp-cast-circle-main jp-cast-circle-satellite; do
  [ -f "$RAW/$c/seed.png" ] || continue
  mkdir -p "$RAW/$c-post" && cp "$RAW/$c/seed.png" "$RAW/$c-post/frame-00.png" && cp "$RAW/$c/jobs.json" "$RAW/$c-post/jobs.json"
  node tools/sprites/pack_thai_vfx.mjs "$c-post" --as "$c" --center
done
# Master Onmyoji circle (user 2026-10-11: line-only, brighter, bigger): the free line pass output is the published art.
if [ -f "$RAW/jp-master-circle-lines/seed.png" ]; then
  mkdir -p "$RAW/jp-master-circle-post" && cp "$RAW/jp-master-circle-lines/seed.png" "$RAW/jp-master-circle-post/frame-00.png" && cp "$RAW/jp-master-circle/jobs.json" "$RAW/jp-master-circle-post/jobs.json"
  node tools/sprites/pack_thai_vfx.mjs jp-master-circle-post --as jp-master-circle --center
fi
# Shikigami prototype: Kitsune attack with code tail fire (kitsune_tailfire.mjs), feet anchor; prototype circle parts.
if [ -f "$RAW/shikigami-kitsune-master/frame-00.png" ]; then
  node tools/sprites/kitsune_tailfire.mjs >/dev/null && node tools/sprites/pack_thai_vfx.mjs shikigami-kitsune-attack-post --as shikigami-kitsune
fi
for c in jp-spirit-smoke jp-ofuda-crest; do
  [ -f "$RAW/$c/seed.png" ] || continue
  mkdir -p "$RAW/$c-post" && cp "$RAW/$c/seed.png" "$RAW/$c-post/frame-00.png" && cp "$RAW/$c/jobs.json" "$RAW/$c-post/jobs.json"
  node tools/sprites/pack_thai_vfx.mjs "$c-post" --as "$c" --center
done
# Remaining shikigami (Kodama, Nurikabe, Kamaitachi, Mizuchi): white effect pixels → element ramp, feet anchor.
for n in kodama nurikabe kamaitachi mizuchi; do
  [ -f "$RAW/shikigami-$n-master/frame-00.png" ] || continue
  node tools/sprites/shikigami_post.mjs "shikigami-$n" >/dev/null && node tools/sprites/pack_thai_vfx.mjs "shikigami-$n-attack-post" --as "shikigami-$n"
done
# Shikigami Ascension great forms: element ramps, Nurikabe seal → abstract mark, feet anchor.
for n in kitsune nurikabe kodama kamaitachi mizuchi; do
  [ -f "$RAW/great-$n-master/frame-00.png" ] || continue
  node tools/sprites/shikigami_post.mjs "great-$n" >/dev/null && node tools/sprites/pack_thai_vfx.mjs "great-$n-attack-post" --as "great-$n"
done
# The 7 other circle archetypes (seed → free line pass → static kit).
for c in jp-circle-protection jp-circle-summoning jp-circle-purification jp-circle-attack jp-circle-binding jp-circle-sealing jp-circle-spirit; do
  [ -f "$RAW/$c/seed.png" ] || continue
  node tools/sprites/circle_lines.mjs "$c" >/dev/null
  mkdir -p "$RAW/$c-post" && cp "$RAW/$c-lines/seed.png" "$RAW/$c-post/frame-00.png" && cp "$RAW/$c/jobs.json" "$RAW/$c-post/jobs.json"
  node tools/sprites/pack_thai_vfx.mjs "$c-post" --as "$c" --center
done
