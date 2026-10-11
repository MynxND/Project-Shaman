# Generates Main HUD art (menu bar, Medium skill hotbar, touch joystick) with PixelLab create_image_pixflux, 1 generation each.
# Jobs are submitted in batches of 6 (PixelLab allows 8 in flight), then polled and downloaded.
# Usage: .\tools\ui\generate_hud_icons.ps1 [-Only id1,id2] [-Known 'id=jobId;id2=jobId2']
# -Known downloads jobs that were already submitted (e.g. after an interrupted run) without paying again.
# Writes apps/client/public/assets/ui/hud/<group>/<id>.png and merges prompts + job ids into docs/design/ui/hud-icons.json.
param([string[]]$Only = @(), [string]$Known = '')
$ErrorActionPreference = 'Stop'
$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$pixellab = Join-Path $root 'scripts/pixellab.ps1'
$menuStyle = 'pixel art RPG game menu icon, single ornate object centred, thick dark outline, Thai shaman talisman theme, palette of dark wood, weathered bronze, muted gold, parchment, ritual crimson and spirit jade, readable silhouette, transparent background'
$touchStyle = 'pixel art game UI element, flat front view seen from straight above, perfectly round and centred, thick dark outline, palette of dark wood, weathered bronze, muted gold and spirit jade, transparent background'
$skillStyle = 'pixel art RPG skill icon, square composition filling the frame, dark ink-brown background, glowing magical effect, Thai shaman spirit magic, crisp readable shapes'
$icons = [ordered]@{
  'menu/status'    = @($menuStyle, 'rolled parchment character record scroll with a red wax seal and a small carved spirit mask')
  'menu/skills'    = @($menuStyle, 'open ancient spell tome with a glowing jade spirit flame above the pages')
  'menu/equipment' = @($menuStyle, 'ornate bronze-bound dark wooden treasure chest with crimson cloth')
  'menu/gold'      = @($menuStyle, 'small pile of gold coins with one square-holed bronze coin on top')
  'menu/class'     = @($menuStyle, 'ornate crimson and gold ritual crest emblem with a jade gem in the centre')
  'menu/map'       = @($menuStyle, 'unrolled parchment map with red route marks and a jade pin')
  'menu/bag'       = @($menuStyle, 'brown cloth satchel bag tied with rope and a yellow talisman tag')
  'menu/bot'       = @($menuStyle, 'small cute spirit doll helper with a pale blue body and red ribbon')
  'menu/premium'   = @($menuStyle, 'golden crown with red gems')
  'menu/more'      = @($menuStyle, 'wooden prayer tablet carved with yantra symbols and bronze corners')
  'skills/spirit-bolt'    = @($skillStyle, 'bolt of jade spirit flame flying forward')
  'skills/soul-heal'      = @($skillStyle, 'swirling green healing spirit wisp spiral')
  'skills/amulet-blast'   = @($skillStyle, 'golden yantra circle bursting with light')
  'skills/ghost-sight'    = @($skillStyle, 'glowing third eye with a violet aura')
  'skills/binding-thread' = @($skillStyle, 'crimson magic threads binding a dark shadow')
  # Optional third element: canvas size (default 48).
  'touch/stick-base' = @($touchStyle, 'circular weathered bronze talisman ring with engraved yantra lines and four small arrow marks pointing up, down, left and right, dark carved wood disc inside', 64)
  'touch/stick-knob' = @($touchStyle, 'round polished jade spirit orb button with a thin bronze rim', 32)
  # Folded HUD panels show these inside the round frame (opening about 35 px).
  'fold/chat'  = @($menuStyle, 'cream parchment comic speech bubble with a pointed tail at the bottom left and three dark ink dots in a row, simple bold silhouette', 32)
  'fold/quest' = @($menuStyle, 'small rolled parchment quest scroll with a bold red exclamation mark', 32)
  'fold/map'   = @($menuStyle, 'round bronze compass rose with a red needle, simple bold silhouette', 32)
}

$logPath = Join-Path $root 'docs/design/ui/hud-icons.json'
$log = [ordered]@{}
if (Test-Path $logPath) { (Get-Content -Raw -Encoding utf8 $logPath | ConvertFrom-Json).PSObject.Properties | ForEach-Object { $log[$_.Name] = $_.Value } }
$knownJobs = @{}
foreach ($pair in ($Known -split ';' | Where-Object { $_ })) { $k, $v = $pair -split '=', 2; $knownJobs[$k] = $v }

function Save-Icon([string]$id, [string]$job) {
  $r = ''
  for ($i = 0; $i -lt 60; $i++) {
    $r = (& $pixellab -Tool get_image -ArgumentsJson (@{ job_id = $job } | ConvertTo-Json -Compress)) -join "`n"
    if ($r -notmatch 'processing|pending') { break }
    Start-Sleep 5
  }
  $url = [regex]::Match($r, 'download:\s*(\S+)').Groups[1].Value
  if (-not $url) { Write-Output "FAILED $id ($job): $r"; return }
  $file = Join-Path $root "apps/client/public/assets/ui/hud/$id.png"
  New-Item -ItemType Directory -Force (Split-Path $file) | Out-Null
  & (Join-Path $root 'scripts/pixellab-download.ps1') -Url $url -OutFile $file | Out-Null
  Write-Output "saved $id"
}

$ids = @($icons.Keys | Where-Object { $Only.Count -eq 0 -or $Only -contains $_ })
for ($b = 0; $b -lt $ids.Count; $b += 6) {
  $batch = [ordered]@{}
  foreach ($id in $ids[$b..([Math]::Min($b + 5, $ids.Count - 1))]) {
    $style, $subject, $size = $icons[$id]
    if (-not $size) { $size = 48 }
    $isMenu = -not $id.StartsWith('skills/')
    $desc = "$subject, $style"
    $job = $knownJobs[$id]
    if (-not $job) {
      $req = @{ description = $desc; width = $size; height = $size; no_background = $isMenu; outline = 'single color black outline'; shading = 'medium shading'; detail = 'medium detail'; seed = 11 } | ConvertTo-Json -Compress
      $out = (& $pixellab -Tool create_image_pixflux -ArgumentsJson $req) -join "`n"
      $job = [regex]::Match($out, 'job_id:\s*(\S+)').Groups[1].Value
      if (-not $job) { throw "no job id for ${id}: $out" }
      Write-Output "submitted $id ($job)"
    }
    $batch[$id] = $job
    $log[$id] = [ordered]@{ description = $desc; job_id = $job; size = $size; transparent = $isMenu }
  }
  foreach ($id in $batch.Keys) { Save-Icon $id $batch[$id] }
  $log | ConvertTo-Json -Depth 4 | Out-File -Encoding utf8 $logPath
}
