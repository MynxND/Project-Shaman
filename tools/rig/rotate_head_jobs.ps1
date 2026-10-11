# Submits head-layers-01 rotation jobs one at a time (waiting while PixelLab's slot queue is full — a rejected
# submission is not charged and is not a regeneration), then waits for each object and downloads its 8 views.
# Usage: powershell -File tools/rig/rotate_head_jobs.ps1 rot-bald rot-natural-short ...
$ErrorActionPreference = 'Stop'
$d = 'docs/design/character-v3/head-layers-01'
$dirs = 'south','south-east','east','north-east','north','north-west','west','south-west'
foreach ($job in $args) {
  if (-not (Test-Path "$d/$job-submit.json") -or -not ((Get-Content "$d/$job-submit.json" -Raw) -match 'object_id')) {
    for ($try = 0; $try -lt 30; $try++) {
      $out = powershell -NoProfile -File tools/rig/hair_pixellab.ps1 -Action call -Tool create_object_pro_flash -ArgumentsFile "$d/$job-request.json" -OutputFile "$d/$job-submit.json" 2>&1 | Out-String
      if ((Get-Content "$d/$job-submit.json" -Raw) -match '"object_id"') { break }
      if ($out -notmatch 'slots') { "$job SUBMIT FAILED: $out"; exit 1 }
      Start-Sleep 20
    }
  }
  $obj = (Get-Content "$d/$job-submit.json" -Raw | ConvertFrom-Json).result.structuredContent.object_id
  "{`"object_id`":`"$obj`",`"include_preview`":false}" | Set-Content -Encoding ascii "$d/$job-poll.json"
  for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep 15
    powershell -NoProfile -File tools/rig/hair_pixellab.ps1 -Action call -Tool get_object -ArgumentsFile "$d/$job-poll.json" -OutputFile "$d/$job-result.json" 2>$null | Out-Null
    $t = ((Get-Content "$d/$job-result.json" -Raw | ConvertFrom-Json).result.content | Where-Object type -eq 'text').text -join "`n"
    if ($t -match 'status: completed') { break }
    if ($t -match 'status: failed') { "$job FAILED"; break }
  }
  New-Item -ItemType Directory -Force "$d/$job" | Out-Null
  foreach ($dir in $dirs) {
    $line = ($t -split "`n") | Where-Object { $_.Trim().StartsWith("${dir}: https") } | Select-Object -First 1
    if (-not $line) { "$job missing $dir"; continue }
    Invoke-WebRequest ($line.Trim().Substring($dir.Length + 2)) -OutFile "$d/$job/$dir.png" -UseBasicParsing
  }
  "$job downloaded"
}
