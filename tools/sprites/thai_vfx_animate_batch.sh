#!/usr/bin/env bash
# Animates approved Thai seeds one after another (user-approved batches only). thai_vfx.ps1 reuses each skill's seed
# job and never resubmits a recorded animation job. If PixelLab fails an animation under "heavy load" (no frames), the
# animation job id is cleared and it is resubmitted up to twice; any other failure is reported and skipped.
# Prints "OK <skill> charged: N" or "FAIL ..." per skill and ends with "BATCH DONE".
# Usage: bash tools/sprites/thai_vfx_animate_batch.sh <skill> ...
cd "$(dirname "$0")/../.."
SET=${VFX_SET:-thailand-v1}   # nation asset set, e.g. VFX_SET=indonesia-v1
RAW=docs/design/skills/$SET/raw
for k in "$@"; do
  for attempt in 1 2 3; do
    out=$(powershell -NoProfile -File tools/sprites/thai_vfx.ps1 -Skill "$k" -Set "$SET" 2>&1)
    frames=$(echo "$out" | grep -o 'frames [0-9]*' | tail -1 | grep -o '[0-9]*')
    if [ "${frames:-0}" -gt 0 ]; then echo "OK $k $(grep -a -o 'charged: [0-9]* generations' "$RAW/$k/animation.response.txt" | head -1)"; break; fi
    err=$(grep -a -o 'error: [^\r]*' "$RAW/$k/animation.response.txt" 2>/dev/null | head -1)
    echo "FAIL $k attempt $attempt: ${err:-$(echo "$out" | grep -E 'jsonrpc|Exception' | head -1)}"
    echo "$err" | grep -qi "heavy load" || break
    node -e 'const fs=require("fs"),p=process.argv[1];const j=JSON.parse(fs.readFileSync(p,"utf8").replace(/^﻿/,""));j.failedAnimationJobs=[...(j.failedAnimationJobs||[]),j.animationJob];j.animationJob="";fs.writeFileSync(p,JSON.stringify(j,null,2))' "$RAW/$k/jobs.json"
    sleep 20
  done
done
echo "BATCH DONE"
