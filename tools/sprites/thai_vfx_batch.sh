#!/usr/bin/env bash
# Runs approved Thai seeds one after another (user-approved batches only). A seed that PixelLab fails under
# "heavy load" (no image, nothing produced) is resubmitted up to twice; any other failure (e.g. content policy) is
# reported and skipped. Writes progress lines to stdout; ends with "BATCH DONE".
# Usage: bash tools/sprites/thai_vfx_batch.sh <skill> ...
cd "$(dirname "$0")/../.."
SET=${VFX_SET:-thailand-v1}   # nation asset set, e.g. VFX_SET=indonesia-v1
RAW=docs/design/skills/$SET/raw
for k in "$@"; do
  for attempt in 1 2 3; do
    # Prompts must be ASCII: Windows PowerShell 5.1 mangles non-ASCII bodies and PixelLab answers -32603.
    out=$(powershell -NoProfile -File tools/sprites/thai_vfx.ps1 -Skill "$k" -Set "$SET" -SeedOnly 2>&1)
    echo "$out" | grep -E "jsonrpc|Exception" | head -1
    if echo "$out" | grep -q "seed saved"; then echo "OK $k"; break; fi
    id=$(grep -o '"seedJob": *"[^"]*' "$RAW/$k/jobs.json" 2>/dev/null | grep -o '[0-9a-f-]\{36\}')
    printf '{"job_id":"%s"}' "$id" > "$RAW/$k/poll.json"
    powershell -NoProfile -File tools/rig/hair_pixellab.ps1 -Action call -Tool get_image -ArgumentsFile "$RAW/$k/poll.json" -OutputFile "$RAW/$k/seed-result.json" >/dev/null 2>&1
    err=$(grep -o 'error: [^"\\]*' "$RAW/$k/seed-result.json" | head -1)
    mv "$RAW/$k/jobs.json" "$RAW/$k/failed-$attempt-jobs.json" 2>/dev/null
    echo "FAIL $k attempt $attempt ($id): $err"
    echo "$err" | grep -qi "heavy load" || break
    sleep 20
  done
done
echo "BATCH DONE"
