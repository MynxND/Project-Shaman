# UI kit v2 ("Thai shaman carved-teak" upgrade) with PixelLab create_image_pro_flash (5-9 generations per image,
# quote with get_pro_flash_capabilities). Jobs are submitted in batches of 6 (8 may run at once), then polled.
# Usage: .\tools\ui\generate_ui_kit_v2.ps1 -Only frame/window,icon/status [-StyleImage path.png] [-Known 'id=job;...']
# Writes apps/client/public/assets/ui/v2/<id>.png and merges prompts + job ids into docs/design/ui/kit-v2.json.
param([string[]]$Only = @(), [string]$StyleImage = '', [string]$Known = '')
$ErrorActionPreference = 'Stop'
$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$pixellab = Join-Path $root 'scripts/pixellab.ps1'

# One shared material language for every piece (docs/design/ui-system.md, "UI kit v2").
$material = 'premium detailed pixel art game UI, authentic Thai shaman occult theme, hand-carved dark teak wood with layered bevels and engraved Thai kanok flame motifs, weathered bronze and antique gold fittings, sacred red thread bindings, jade green accents, crisp pixel highlights and deep shadows, single dark outline, top-left light, no text, no letters'
$icon = 'pixel art RPG menu icon, one ornate object centred with a clear silhouette, consistent 1px dark outline, rich shading, Thai shaman ritual craft, palette of teak brown, antique gold, aged parchment, sacred red and jade green, no text, transparent background'

# Menu icons v2: the first three came out small inside 48 px; ask for objects that fill the canvas.
$big = 'large pixel art RPG menu icon, one ornate object drawn big so it fills almost the whole canvas edge to edge, clear silhouette, consistent 1px dark outline, rich shading, Thai shaman ritual craft, palette of teak brown, antique gold, aged parchment, sacred red and jade green, no text, transparent background'

$assets = [ordered]@{
  # Frames: hollow centres so the 9-slice interior stays a CSS colour.
  'frame/window'   = @(192, 192, "square window frame border only, thick carved teak frame with bronze corner caps shaped like Thai temple finials, a small red cloth talisman strip hanging from the top left corner tied with red thread, small round bronze amulet on the top centre, the centre of the frame is completely empty and transparent, $material")
  # Slot v1 (48 px canvas) came back small (27x31) with gems mid-edge, which a 9-slice would repeat; v2 fills the canvas.
  'frame/slot'     = @(32, 32, "square item slot frame that fills the entire canvas edge to edge, even carved teak border two pixels thick with a tiny bronze stud in each corner only, nothing in the middle of the edges, inner area dark recessed wood with a faint engraved diamond lattice, $material")
  'frame/skill'    = @(64, 64, "round skill button frame, carved bronze ring with four small gold lotus points at top bottom left and right and a thin red thread wrapped around it, the centre circle is completely empty and transparent, $material")
  'frame/portrait' = @(96, 96, "character portrait frame, ornate carved teak arch with a gold Thai temple roof finial at the top, bronze side pillars, red thread tassel hanging on the right, the inner window is completely empty and transparent, $material")
  # HUD panel: thinner than the window frame, ornaments only in the corners so the edges can repeat as a 9-slice.
  'frame/panel'    = @(128, 128, "rectangular HUD panel frame border only, slim carved dark teak band about eight pixels wide with an even repeating groove along every edge, small bronze corner caps with a tiny jade stone and a red thread knot at each of the four corners, no ornaments in the middle of the edges, the inside of the frame is completely empty and transparent, $material")
  # Readable item slot (user feedback 2026-10-09: the ornate slot hid the items): calm, light, thin border.
  # 4th element $false = keep a background: Pro Flash then fills the whole canvas (transparent sprites come back small).
  'frame/slot-plain' = @(24, 24, "plain square inventory slot tile filling the whole canvas, flat light aged parchment surface slightly recessed, thin two pixel dark teak border with a subtle bevel, a very faint low contrast engraved yantra star in the centre, calm and simple, no gems, no gold, no ornaments", $false)
  # Navigation icons.
  'icon/status'    = @(48, 48, "carved Thai ritual spirit mask in red and gold lacquer with jade eyes, $icon")
  'icon/skills'    = @(48, 48, "open ancient Thai palm-leaf manuscript glowing with a green spirit flame and gold yantra script lines, $icon")
  'icon/bag'       = @(48, 48, "traditional Thai woven cloth shoulder bag with red and gold patterned stripes, tied with red thread and a small bronze amulet, $icon")

  # Full menu set (all ten redrawn so they match in size): run with -StyleImage the approved khon mask icon.
  'menu/status'    = @(48, 48, "carved Thai khon spirit mask in red and gold lacquer with jade eyes and a tall gold crown, $big")
  'menu/skills'    = @(48, 48, "open ancient Thai palm-leaf manuscript glowing with a green spirit flame and gold yantra script lines, $big")
  'menu/equipment' = @(48, 48, "small ornate teak ritual chest with bronze corners, a red cloth talisman draped over the lid, $big")
  'menu/gold'      = @(48, 48, "stack of antique Thai gold coins with an engraved lotus, one bronze coin leaning in front, $big")
  'menu/class'     = @(48, 48, "spiritual crest emblem, gold Thai kanok flame shield with a jade gem at the centre and red thread tassels, $big")
  'menu/map'       = @(48, 48, "ancient rolled-open parchment map with red route lines and a bronze compass pin, $big")
  'menu/bag'       = @(48, 48, "traditional Thai woven cloth shoulder bag with red and gold patterned stripes, tied with red thread and a small bronze amulet, $big")
  'menu/bot'       = @(48, 48, "small guardian spirit doll in white and red Thai cloth with a gold headdress and calm face, $big")
  'menu/premium'   = @(48, 48, "golden Thai chada crown with a tall tiered spire and red and jade gems, $big")
  'menu/more'      = @(48, 48, "rolled ritual command scroll tied with red thread and a bronze seal, $big")

  # Controls (frames with plain middles so they can be 9-sliced; interiors stay CSS colours).
  'frame/button'   = @(96, 32, "wide rectangular game button frame, slim carved teak border with a thin antique gold inner bevel, tiny bronze caps at the left and right ends with a red thread knot, plain even edges in between, the inside is completely empty and transparent, $material")
  'frame/field'    = @(96, 32, "wide rectangular text input frame, recessed slim dark teak border with a fine gold inner line, tiny bronze studs only at the four corners, plain even edges, the inside is completely empty and transparent, $material")
  'frame/bar'      = @(128, 16, "long thin horizontal progress bar frame, slim carved teak border with small bronze end caps shaped like lotus buds, plain even top and bottom edges, the inside channel is completely empty and transparent, $material")
  'frame/plate'    = @(96, 32, "small antique bronze name plate frame for counters, weathered bronze border with engraved dots and rivets at the ends, plain even edges, the inside is completely empty and transparent, $material")
  'frame/iconbutton' = @(40, 40, "small square bronze-framed icon button frame, carved teak border with bronze corner studs, plain edges, the inside is completely empty and transparent, $material")
  'badge/level'    = @(32, 32, "small round bronze level medallion with a red thread loop at the top and an empty dark centre for a number, $material")
  # Decorations.
  'deco/talisman'  = @(32, 64, "hanging Thai pha yant talisman cloth strip, faded red cloth with a gold geometric yantra pattern, hanging from a bronze ring by red thread, frayed bottom edge, $material")
  'deco/tassel'    = @(24, 48, "hanging sacred red thread tassel with a small jade bead and a bronze cap, $material")
  'deco/corner'    = @(32, 32, "single top left corner ornament, carved bronze Thai kanok flame curl with a tiny jade stone, transparent background, $material")
  # Touch joystick (replaces the first pixflux pair so it matches the kit).
  'touch/stick-base' = @(96, 96, "round virtual joystick base seen from straight above, carved teak disc with a bronze rim, four small gold lotus arrow marks pointing up, down, left and right, a faint engraved yantra circle in the middle, flat and centred, $material")
  'touch/stick-knob' = @(40, 40, "round polished jade spirit orb button seen from straight above with a thin bronze rim and a soft highlight, flat and centred, $material")
}

$logPath = Join-Path $root 'docs/design/ui/kit-v2.json'
$log = [ordered]@{}
if (Test-Path $logPath) { (Get-Content -Raw -Encoding utf8 $logPath | ConvertFrom-Json).PSObject.Properties | ForEach-Object { $log[$_.Name] = $_.Value } }
$knownJobs = @{}
foreach ($pair in ($Known -split ';' | Where-Object { $_ })) { $k, $v = $pair -split '=', 2; $knownJobs[$k] = $v }
$style = $null
if ($StyleImage) { $style = @{ base64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes((Resolve-Path $StyleImage))); usage_description = 'match this UI kit: palette, outline weight, pixel density and shading' } }

function Save-Asset([string]$id, [string]$job) {
  $r = ''
  for ($i = 0; $i -lt 90; $i++) {
    $r = (& $pixellab -Tool get_image -ArgumentsJson (@{ job_id = $job } | ConvertTo-Json -Compress)) -join "`n"
    if ($r -notmatch 'processing|pending|queued') { break }
    Start-Sleep 5
  }
  $url = [regex]::Match($r, 'download:\s*(\S+)').Groups[1].Value
  if (-not $url) { Write-Output "FAILED $id ($job): $r"; return }
  $file = Join-Path $root "apps/client/public/assets/ui/v2/$id.png"
  New-Item -ItemType Directory -Force (Split-Path $file) | Out-Null
  & (Join-Path $root 'scripts/pixellab-download.ps1') -Url $url -OutFile $file | Out-Null
  Write-Output "saved $id"
}

$ids = @($assets.Keys | Where-Object { $Only.Count -eq 0 -or $Only -contains $_ })
for ($b = 0; $b -lt $ids.Count; $b += 6) {
  $batch = [ordered]@{}
  foreach ($id in $ids[$b..([Math]::Min($b + 5, $ids.Count - 1))]) {
    $w, $h, $desc, $transparent = $assets[$id]
    if ($null -eq $transparent) { $transparent = $true }
    $job = $knownJobs[$id]
    if (-not $job) {
      $req = @{ description = $desc; width = $w; height = $h; no_background = $transparent; seed = 7 }
      if ($style) { $req.style_image = $style }
      $out = (& $pixellab -Tool create_image_pro_flash -ArgumentsJson ($req | ConvertTo-Json -Compress -Depth 4)) -join "`n"
      # Pro Flash answers with JSON ("job_id": "...").
      $job = [regex]::Match($out, 'job_id"?\s*[:=]\s*"?([0-9a-f-]{36})').Groups[1].Value
      if (-not $job) { throw "no job id for ${id}: $out" }
      Write-Output "submitted $id ($job)"
    }
    $batch[$id] = $job
    $log[$id] = [ordered]@{ tool = 'create_image_pro_flash'; description = $desc; width = $w; height = $h; job_id = $job; style_image = [bool]$style }
  }
  foreach ($id in $batch.Keys) { Save-Asset $id $batch[$id] }
  $log | ConvertTo-Json -Depth 4 | Out-File -Encoding utf8 $logPath
}
