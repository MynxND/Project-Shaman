# Ambient townsfolk: rotates each Pro Flash south sprite (docs/design/umbral-v2/raw/walker-<id>.png) into a 4-direction
# PixelLab character (create_character v3 with the sprite as reference), then adds a template walk animation and
# downloads rotations and frames to docs/design/umbral-v2/walkers/<id>/{rotations,walk/<dir>}/.
# Usage: .\tools\map\make_walkers.ps1 -Ids boy,girl [-Known 'boy=<character id>;...']
# Ids and character ids are logged to docs/design/umbral-v2/walkers/characters.json.
param([string[]]$Ids = @('boy', 'girl', 'grandpa', 'grandma'), [string]$Known = '', [string]$Template = 'walking-8-frames')
$ErrorActionPreference = 'Stop'
$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$pixellab = Join-Path $root 'scripts/pixellab.ps1'
$out = Join-Path $root 'docs/design/umbral-v2/walkers'
New-Item -ItemType Directory -Force $out | Out-Null
$logPath = Join-Path $out 'characters.json'
$log = [ordered]@{}
if (Test-Path $logPath) { (Get-Content -Raw -Encoding utf8 $logPath | ConvertFrom-Json).PSObject.Properties | ForEach-Object { $log[$_.Name] = $_.Value } }
$knownIds = @{}
foreach ($pair in ($Known -split ';' | Where-Object { $_ })) { $k, $v = $pair -split '=', 2; $knownIds[$k] = $v }
$dirs = @('south', 'east', 'north', 'west')

function Get-Char([string]$cid) { (& $pixellab -Tool get_character -ArgumentsJson (@{ character_id = $cid; include_preview = $false } | ConvertTo-Json -Compress)) -join "`n" }
# Rotation and frame URLs are public CDN links (backblaze.pixellab.ai); only api.pixellab.ai needs the auth header.
function Save-Url([string]$u, [string]$file) {
  if ($u -match '^https://api\.pixellab\.ai/') { & (Join-Path $root 'scripts/pixellab-download.ps1') -Url $u -OutFile $file | Out-Null }
  else { Invoke-WebRequest $u -UseBasicParsing -OutFile $file -TimeoutSec 120 | Out-Null }
}
function Wait-Char([string]$cid, [string]$until) {
  for ($i = 0; $i -lt 120; $i++) { $r = Get-Char $cid; if ($r -match $until) { return $r }; Start-Sleep 10 }
  throw "timed out waiting for $cid ($until)"
}

foreach ($id in $Ids) {
  $cid = $knownIds[$id]
  if (-not $cid -and $log[$id]) { $cid = $log[$id].character_id }
  if (-not $cid) {
    $ref = [Convert]::ToBase64String([IO.File]::ReadAllBytes((Join-Path $root "docs/design/umbral-v2/raw/walker-$id.png")))
    $req = @{ description = "Thai village townsfolk ($id), same outfit and colours as the reference"; name = "walker-$id"; mode = 'v3'; n_directions = 4; reference_image_base64 = $ref; view = 'low top-down' }
    $r = (& $pixellab -Tool create_character -ArgumentsJson ($req | ConvertTo-Json -Compress)) -join "`n"
    $cid = [regex]::Match($r, '([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})').Groups[1].Value
    if (-not $cid) { throw "no character id for ${id}: $r" }
    Write-Output "created $id ($cid)"
    $log[$id] = [ordered]@{ character_id = $cid; template = $Template }
    $log | ConvertTo-Json -Depth 4 | Out-File -Encoding utf8 $logPath
  }
  $r = Wait-Char $cid '(?s)status:\s*completed(?!.*pending jobs)'
  # Rotations.
  $rotDir = Join-Path $out "$id/rotations"; New-Item -ItemType Directory -Force $rotDir | Out-Null
  foreach ($d in $dirs) {
    $u = [regex]::Match($r, "(?m)^\s*${d}:\s*(https://\S+?\.png)").Groups[1].Value
    if ($u) { Save-Url $u (Join-Path $rotDir "$d.png") }
  }
  # Walk animation (template mode, one direction at a time; existing scripts handle queue limits).
  if ($r -match '(?m)^animations:\s*none') {
    & (Join-Path $root 'scripts/pixellab-animate-directions.ps1') -CharacterId $cid -Template $Template -Name 'walk' -Directions $dirs | Out-Null
  }
  $r = Wait-Char $cid '(?s)/animations/(?!.*pending jobs)'
  foreach ($line in $r -split "`n") {
    $m = [regex]::Match($line, '^\s+(south|east|north|west):\s+(https://\S.*)$')
    if (-not $m.Success) { continue }
    $urls = $m.Groups[2].Value -split ',\s*' | Where-Object { $_ -match '/animations/' }
    if (-not $urls) { continue }
    $wd = Join-Path $out "$id/walk/$($m.Groups[1].Value)"; New-Item -ItemType Directory -Force $wd | Out-Null
    $n = 0
    foreach ($u in $urls) { Save-Url $u.Trim() (Join-Path $wd ("{0}.png" -f $n)); $n++ }
  }
  Write-Output "done $id"
}
