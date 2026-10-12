# Submit animate_with_skeleton_v3 requests written by dagger_thrust.mjs / cast_point.mjs, wait, and download the frames.
#   .\tools\rig\skeleton_jobs.ps1 -Folder docs/design/character-v3/weapon-class/cast-point -Dirs south,east [-Frames 8]
# For each direction: <dir>-request.json -> <dir>-submit.json (job id) -> <dir>-result.json -> raw/<dir>-<i>.png.
# A direction that already has a poll file is not resubmitted (no double spend). Prints the charge per job.
param([Parameter(Mandatory = $true)][string]$Folder, [string[]]$Dirs = @('south', 'south-east', 'east', 'north-east', 'north', 'north-west', 'west', 'south-west'), [int]$Frames = 8)
$ErrorActionPreference = 'Continue'
$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
Set-Location $root
$call = Join-Path $root 'tools/rig/hair_pixellab.ps1'
New-Item -ItemType Directory -Force "$Folder/raw" | Out-Null
foreach ($dir in $Dirs) {
  if (Test-Path "$Folder/$dir-poll.json") { "$dir already submitted"; continue }
  try { powershell -NoProfile -File $call -Action call -Tool animate_with_skeleton_v3 -ArgumentsFile "$Folder/$dir-request.json" -OutputFile "$Folder/$dir-submit.json" 2>$null | Out-Null } catch {}
  $t = Get-Content -Raw "$Folder/$dir-submit.json"
  $job = [regex]::Match($t, 'job_id:\s*([0-9a-f-]{36})').Groups[1].Value
  if (-not $job) { "SUBMIT FAILED $dir (see $dir-submit.json)"; continue }
  '{"job_id":"' + $job + '"}' | Out-File -Encoding ascii "$Folder/$dir-poll.json"
  "$dir submitted $job"
}
foreach ($dir in $Dirs) {
  if (-not (Test-Path "$Folder/$dir-poll.json")) { continue }
  $t = ''
  for ($i = 0; $i -lt 60; $i++) {
    try { powershell -NoProfile -File $call -Action call -Tool get_image -ArgumentsFile "$Folder/$dir-poll.json" -OutputFile "$Folder/$dir-result.json" 2>$null | Out-Null } catch {}
    $t = Get-Content -Raw "$Folder/$dir-result.json"
    if ($t -match 'status:\s*completed') { break }
    Start-Sleep 10
  }
  $charged = [regex]::Match($t, 'charged:\s*([^\\\r\n]+)').Groups[1].Value
  $url = [regex]::Match($t, '(https://api\.pixellab\.ai/mcp/images/[0-9a-f-]+/download)').Groups[1].Value
  if (-not $url) { "FAILED $dir"; continue }
  for ($k = 0; $k -lt $Frames; $k++) { & (Join-Path $root 'scripts/pixellab-download.ps1') -Url "$url`?index=$k" -OutFile "$Folder/raw/$dir-$k.png" | Out-Null }
  "$dir done ($charged)"
}
