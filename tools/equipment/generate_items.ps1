# Equipment layer art (docs/design/equipment/README.md): PixelLab create_object_pro_flash, 8 views per item.
#   .\tools\equipment\generate_items.ps1 [-Only hat-ngob,staff-bell]           # submit (job ids saved immediately)
#   .\tools\equipment\generate_items.ps1 -Fetch [-Only ...]                     # download the 8 views
# Raw output: docs/design/equipment/raw/<id>/<direction>.png plus <id>.job.json (prompt, ids). No credentials stored.
param([string[]]$Only = @(), [switch]$Fetch)
$ErrorActionPreference = 'Stop'
$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$pixellab = Join-Path $root 'scripts/pixellab.ps1'
$spec = Get-Content -Raw -Encoding utf8 (Join-Path $root 'docs/design/equipment/items.json') | ConvertFrom-Json
$common = 'equipment item for a classic 2D MMORPG character, crisp detailed pixel art matching the reference outline weight, palette and shading, upper-left key light, object only, transparent background, no text'
function Call([string]$tool, $a) { (& $pixellab -Tool $tool -ArgumentsJson ($a | ConvertTo-Json -Compress -Depth 6)) -join "`n" }

foreach ($prop in $spec.items.PSObject.Properties) {
  $id = $prop.Name; $it = $prop.Value
  if ($Only.Count -and $Only -notcontains $id) { continue }
  $raw = Join-Path $root "docs/design/equipment/raw/$id"
  New-Item -ItemType Directory -Force $raw | Out-Null
  $log = Join-Path $raw "$id.job.json"
  if (-not $Fetch) {
    if (Test-Path $log) { Write-Output "$id already submitted"; continue }
    # Style reference: a centred crop of the main character that fits the item canvas (palette, outline, density).
    $style = Join-Path $root "docs/design/equipment/style-ref-$($it.size[0])x$($it.size[1]).png"
    $req = @{ description = "$($it.prompt). $common"; width = [int]$it.size[0]; height = [int]$it.size[1]; n_directions = 8; view = 'low top-down'; seed = [int]$it.seed
      style_image = @{ base64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($style)); usage_description = 'match only the outline weight, pixel density, palette and shading of this character art' } }
    $out = ''
    for ($try = 0; $try -lt 40; $try++) {
      try { $out = Call 'create_object_pro_flash' $req; break } catch { Write-Output "waiting to submit ${id}: $($_.Exception.Message)"; Start-Sleep 20 }
    }
    $objectId = [regex]::Match($out, '(?i)object[_ ]id"?\s*[:=]\s*"?([0-9a-f-]{36})').Groups[1].Value
    if (-not $objectId) { $objectId = [regex]::Match($out, '([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})').Groups[1].Value }
    if (-not $objectId) { throw "no object id for ${id}: $out" }
    @{ id = $id; objectId = $objectId; prompt = "$($it.prompt). $common"; size = $it.size; seed = $it.seed; tool = 'create_object_pro_flash'; views = 8 } | ConvertTo-Json | Out-File -Encoding utf8 $log
    Write-Output "submitted $id object $objectId $([regex]::Match($out, '(?i)cost[^\n]*').Value)"
    continue
  }
  $job = Get-Content -Raw $log | ConvertFrom-Json
  for ($i = 0; $i -lt 90; $i++) {
    $r = Call 'get_object' @{ object_id = $job.objectId }
    if ($r -notmatch '(?i)processing|pending|queued|in progress|generating') { break }
    Start-Sleep 10
  }
  Set-Content -Encoding utf8 (Join-Path $raw 'get_object.txt') $r
  $urls = [regex]::Matches($r, '(?m)^\s*(south|south-east|east|north-east|north|north-west|west|south-west):\s*(https://\S+)')
  if ($urls.Count -ge 8) {
    foreach ($u in $urls) { Invoke-WebRequest $u.Groups[2].Value -UseBasicParsing -OutFile (Join-Path $raw "$($u.Groups[1].Value).png") }
    Write-Output "fetched $id (8 views)"
  } else {
    $zip = [regex]::Match($r, '(https://\S+\.zip\S*|https://api\.pixellab\.ai/\S+/download\S*)').Groups[1].Value
    if (-not $zip) { Write-Output "NO VIEWS for $id; see get_object.txt"; continue }
    & (Join-Path $root 'scripts/pixellab-download.ps1') -Url $zip -OutFile (Join-Path $raw "$id.zip") | Out-Null
    Expand-Archive -Force (Join-Path $raw "$id.zip") (Join-Path $raw 'zip')
    Write-Output "fetched $id (zip)"
  }
}
