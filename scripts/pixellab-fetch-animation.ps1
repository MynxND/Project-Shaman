# Downloads one PixelLab animation's frames for a character into the client assets.
# Example:
#   .\scripts\pixellab-fetch-animation.ps1 -CharacterId <id> -Body male -Animation walk [-Group <group id>] [-Directions north,south]
# -Group limits to one animation group (a character can hold several walks); -Directions limits directions.
# Writes apps/client/public/assets/pixellab/main-<body>-v1/<animation>/<direction>/<frame>.png
param(
  [Parameter(Mandatory=$true)][string]$CharacterId,
  [Parameter(Mandatory=$true)][ValidateSet('male','female')][string]$Body,
  [Parameter(Mandatory=$true)][string]$Animation,
  [string]$Group = '',
  [string[]]$Directions = @()
)
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$listing = (& (Join-Path $PSScriptRoot 'pixellab.ps1') -Tool get_character -ArgumentsJson (@{ character_id = $CharacterId } | ConvertTo-Json -Compress)) -join "`n"
$dest = Join-Path $root "apps/client/public/assets/pixellab/main-$Body-v1/$Animation"
$count = 0
$currentGroup = ''
# Group header lines end with "[group: <uuid>]"; frame lines look like "    <direction>: <url>, <url>, ..."
foreach ($line in $listing -split "`n") {
  $g = [regex]::Match($line, '\[group:\s*([0-9a-f-]{36})\]')
  if ($g.Success) { $currentGroup = $g.Groups[1].Value; continue }
  if ($Group -and $currentGroup -ne $Group) { continue }
  $m = [regex]::Match($line, '^\s+(south|south-east|east|north-east|north|north-west|west|south-west):\s+(https://\S.*)$')
  if (-not $m.Success) { continue }
  $direction = $m.Groups[1].Value
  if ($Directions.Count -gt 0 -and $Directions -notcontains $direction) { continue }
  $urls = $m.Groups[2].Value -split ',\s*' | Where-Object { $_ -match '/animations/' }
  if (-not $urls) { continue }
  $dir = Join-Path $dest $direction
  if (Test-Path $dir) { Get-ChildItem $dir -Filter *.png | Remove-Item -Confirm:$false }
  New-Item -ItemType Directory -Force $dir | Out-Null
  foreach ($url in $urls) {
    $frame = [regex]::Match($url, "/$direction/(\d+)\.png").Groups[1].Value
    Invoke-WebRequest $url -UseBasicParsing -OutFile (Join-Path $dir "$frame.png") -TimeoutSec 60
    $count++
  }
  Write-Output "$direction : $($urls.Count) frames"
}
Write-Output "downloaded $count frames to $dest"
