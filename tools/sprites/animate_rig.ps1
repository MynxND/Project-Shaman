# PixelLab v3 custom animations for the main character rig (docs/design/character-rig.md), one direction per job.
# Each job starts AND ends on the direction's runtime idle rotation, so loops are seamless and one-shots return to
# stance. South uses the straight-front helper characters (same ids as the walk/cast passes), because v3 turned the
# torso when animating the main characters toward the camera.
#
#   .\tools\sprites\animate_rig.ps1 -Anim attack -Frames 10 -Action '...' [-Bodies male,female] [-Directions north]
#   .\tools\sprites\animate_rig.ps1 -Anim attack -Fetch      # after the jobs finish: download frames into raw/
#
# Requests (without the base64 images) and group ids: docs/design/pixellab-main/<Anim>/<body>-<direction>.json.
# Frames: docs/design/pixellab-main/raw/<body>/<Anim>/<direction>/<n>.png (public CDN urls; no credentials stored).
param(
  [Parameter(Mandatory = $true)][string]$Anim,
  [int]$Frames = 8,
  [string]$Action = '',
  [string[]]$Bodies = @('male', 'female'),
  [string[]]$Directions = @('south', 'south-east', 'east', 'north-east', 'north', 'north-west', 'west', 'south-west'),
  [switch]$Fetch,
  [switch]$NoEndFrame
)
$ErrorActionPreference = 'Stop'
$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$pixellab = Join-Path $root 'scripts/pixellab.ps1'
$logDir = Join-Path $root "docs/design/pixellab-main/$Anim"
New-Item -ItemType Directory -Force $logDir | Out-Null
$main = @{ male = '336280fc-8cfd-4a7f-98a3-056f78476544'; female = '5faf034e-7b29-46ce-9671-0fb4e945049e' }
$front = @{ male = 'cf7d9971-d700-4862-b1d3-863137dca224'; female = '83ea8a66-caff-4872-aeae-350e50c765f9' }
$name = "rig-$Anim"

function Call([string]$tool, $a) {
  $lines = & { try { & $pixellab -Tool $tool -ArgumentsJson ($a | ConvertTo-Json -Compress -Depth 6) } catch { "ERROR: $_" } } 2>&1
  return (($lines | ForEach-Object { "$_" }) -join "`n")
}

if (-not $Fetch) {
  if (-not $Action) { throw 'Action is required when submitting' }
  foreach ($body in $Bodies) {
    foreach ($dir in $Directions) {
      $char = if ($dir -eq 'south') { $front[$body] } else { $main[$body] }
      $idle = Join-Path $root "apps/client/public/assets/pixellab/main-$body-v1/$dir.png"
      $b64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($idle))
      $req = @{ character_id = $char; mode = 'v3'; directions = @($dir); frame_count = $Frames; keep_first_frame = $false
        animation_name = $name; action_description = $Action; custom_start_frame_base64 = $b64 }
      if (-not $NoEndFrame) { $req.end_frame_base64 = $b64 }
      for ($try = 0; $try -lt 40; $try++) {
        $out = Call 'animate_character' $req
        if ($out -notmatch 'ERROR: ') { break }
        Write-Output "waiting to queue $body/$dir"; Start-Sleep 20
      }
      if ($out -match 'ERROR: ') { throw "animate_character failed for $body/${dir}: $out" }
      $group = [regex]::Match($out, 'group:?\s*\[?([0-9a-f-]{36})').Groups[1].Value
      $cost = [regex]::Match($out, '(?i)cost[^\n]*').Value
      $log = [ordered]@{ body = $body; direction = $dir; characterId = $char; group = $group; frames = $Frames; animationName = $name
        action = $Action; startFrame = "apps/client/public/assets/pixellab/main-$body-v1/$dir.png"; endFrame = $(if ($NoEndFrame) { $null } else { 'same as start' }); cost = $cost; submitted = (Get-Date).ToString('s') }
      $log | ConvertTo-Json | Out-File -Encoding utf8 (Join-Path $logDir "$body-$dir.json")
      Write-Output "queued $body/$dir group $group $cost"
    }
  }
  return
}

# Fetch: read each logged job's group from get_character and download its frames.
foreach ($body in $Bodies) {
  foreach ($dir in $Directions) {
    $logPath = Join-Path $logDir "$body-$dir.json"
    if (-not (Test-Path $logPath)) { continue }
    $log = Get-Content -Raw $logPath | ConvertFrom-Json
    $urls = @()
    for ($i = 0; $i -lt 60; $i++) {
      $info = Call 'get_character' @{ character_id = $log.characterId }
      $lines = $info -split "`n"
      $at = -1
      for ($k = 0; $k -lt $lines.Count; $k++) { if ($lines[$k] -match [regex]::Escape($log.group)) { $at = $k; break } }
      if ($at -ge 0) {
        for ($k = $at + 1; $k -lt $lines.Count -and $lines[$k] -match '^\s{4}'; $k++) {
          if ($lines[$k] -match "^\s+$([regex]::Escape($dir)):\s*(.+)$") { $urls = @($Matches[1] -split ',\s*' | ForEach-Object { $_.Trim() }) }
        }
      }
      if ($urls.Count -ge $log.frames) { break }
      Write-Output "waiting for $body/$dir ($($urls.Count) frames so far)"; Start-Sleep 20
    }
    if ($urls.Count -lt $log.frames) { Write-Output "NOT READY $body/$dir"; continue }
    $out = Join-Path $root "docs/design/pixellab-main/raw/$body/$Anim/$dir"
    if (Test-Path $out) { Remove-Item -Recurse -Force $out }
    New-Item -ItemType Directory -Force $out | Out-Null
    for ($n = 0; $n -lt $urls.Count; $n++) { Invoke-WebRequest $urls[$n] -UseBasicParsing -OutFile (Join-Path $out "$n.png") }
    Write-Output "fetched $body/$dir ($($urls.Count) frames)"
  }
}
