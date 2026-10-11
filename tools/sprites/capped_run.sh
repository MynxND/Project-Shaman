#!/usr/bin/env bash
# Runs approved PixelLab jobs one at a time under a credit cap, reading the exact charge after every job (seeds via a
# free get_image poll, animations from the response). No automatic retry. Stops before a job that could pass the cap
# (assumes up to 9 per job). Appends a running total line per job; ends with "RUN DONE <total>".
# Usage: bash tools/sprites/capped_run.sh <set> <seed|anim> <start_total> <cap> <id> ...
cd "$(dirname "$0")/../.."
SET=$1; MODE=$2; tot=$3; CAP=$4; shift 4
RAW=docs/design/skills/$SET/raw
for id in "$@"; do
  if [ $((tot + 9)) -gt "$CAP" ]; then echo "STOP before $id (running $tot, cap $CAP)"; break; fi
  if [ "$MODE" = seed ]; then
    out=$(powershell -NoProfile -File tools/sprites/thai_vfx.ps1 -Skill "$id" -Set "$SET" -SeedOnly 2>&1 | tail -1)
    job=$(grep -o '"seedJob": *"[0-9a-f-]*' "$RAW/$id/jobs.json" 2>/dev/null | grep -o '[0-9a-f-]\{36\}')
    c=$([ -n "$job" ] && powershell -NoProfile -File scripts/pixellab.ps1 -Tool get_image -ArgumentsJson "{\"job_id\":\"$job\"}" 2>&1 | grep -o 'charged: [0-9]*' | grep -o '[0-9]*')
  else
    out=$(powershell -NoProfile -File tools/sprites/thai_vfx.ps1 -Skill "$id" -Set "$SET" 2>&1 | tail -1)
    c=$(grep -a -o 'charged: [0-9]*' "$RAW/$id/animation.response.txt" 2>/dev/null | grep -o '[0-9]*')
  fi
  tot=$((tot + ${c:-0}))
  echo "$MODE $id: $out | charged ${c:-?} | running $tot"
done
echo "RUN DONE $tot"
