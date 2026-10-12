# Skill book v1 art (user-approved batch of 13, 2026-10-12): corner plaque, five nation night banners, altar corner,
# hanging talisman strip and five category icons. PixelLab create_image_pro_flash, same material language as UI kit v2.
# Usage: .\tools\ui\generate_skill_book_v1.ps1 [-Only id,id] [-Known 'id=job;...']
# Writes apps/client/public/assets/ui/skill-book/<id>.png and logs prompts, job ids and charged credits to
# docs/design/ui/skill-book-v1.json.
param([string[]]$Only = @(), [string]$Known = '')
$ErrorActionPreference = 'Stop'
$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$pixellab = Join-Path $root 'scripts/pixellab.ps1'

$material = 'premium detailed pixel art game UI, authentic Asian shaman occult theme, hand-carved dark teak wood with layered bevels and engraved kanok flame motifs, weathered bronze and antique gold fittings, sacred red thread bindings, jade green accents, crisp pixel highlights and deep shadows, single dark outline, top-left light, no text, no letters'
$icon = 'large pixel art RPG category icon, one ornate symbol drawn big so it fills almost the whole canvas, clear silhouette, consistent 1px dark outline, rich shading, palette of teak brown, antique gold, aged parchment, sacred red and jade green, no text, transparent background'
$scene = 'detailed pixel art night landscape panorama for a game UI banner, deep blue night sky with stars and a pale full moon, soft mist, crisp pixels, painterly lighting, no characters, no people, no text, the right third of the image is calmer open sky and ground so a character can stand there'

# id = width, height, prompt, transparent, style image (relative to repo, must fit the canvas)
$menuStyle = 'apps/client/public/assets/ui/v2/menu/skills.png'
$decoStyle = 'apps/client/public/assets/ui/v2/deco/talisman.png'
$assets = [ordered]@{
  'badge-skull'    = @(128, 128, "round carved teak plaque medallion seen from the front, a horned demon skull carved in bone sits on top of the ring, small red paper talismans and red thread tassels hang from both sides, thick antique gold ring border with engraved runes, the centre disc is plain dark red lacquer and completely empty for a label, $material", $true, $decoStyle)
  'banner-th'      = @(256, 96, "Thai Buddhist temple silhouettes with tiered golden roofs and chofa finials, floating spirit lanterns, banyan tree with red cloth ribbons, $scene", $false, '')
  'banner-id'      = @(256, 96, "Javanese candi stone temple silhouettes and split gates, tropical palms, misty jungle, flickering offering torches, $scene", $false, '')
  'banner-ru'      = @(256, 96, "snowy Siberian taiga with dark pine forest, wooden church with onion domes, falling snow, $scene", $false, '')
  'banner-jp'      = @(256, 96, "Japanese shrine with a red torii gate, stone lanterns, strings of paper ofuda talismans fluttering, pagoda silhouette, $scene", $false, '')
  'banner-no'      = @(256, 96, "Norwegian fjord with steep cliffs, green aurora borealis, standing rune stones, wooden stave church silhouette, $scene", $false, '')
  'altar-candles'  = @(96, 96, "shaman altar corner, lit white and red candles with dripping wax on a small carved teak stand, a bronze ritual offering bowl, folded paper talismans with red seals and a little incense smoke, $material", $true, $decoStyle)
  'talisman-strip' = @(32, 96, "long hanging paper talisman strip, aged parchment paper with a red ink seal symbol and black brush strokes, hanging from a bronze ring by red thread, torn bottom edge, $material", $true, $decoStyle)
  'cat-all'        = @(48, 48, "open ancient spell book with glowing gold pages and a radiant star above it, $icon", $true, $menuStyle)
  'cat-attack'     = @(48, 48, "crossed ritual kris dagger and bronze sword with a red flame burst behind them, $icon", $true, $menuStyle)
  'cat-support'    = @(48, 48, "glowing jade lotus flower inside a soft green healing aura with a small gold cross of light, $icon", $true, $menuStyle)
  'cat-passive'    = @(48, 48, "round bronze yantra amulet with a jade gem at the centre and a steady golden glow, $icon", $true, $menuStyle)
  'cat-ready'      = @(48, 48, "golden upward arrow made of light rising from a small red thread knot with sparkles, $icon", $true, $menuStyle)
}

$logPath = Join-Path $root 'docs/design/ui/skill-book-v1.json'
$log = [ordered]@{}
if (Test-Path $logPath) { (Get-Content -Raw -Encoding utf8 $logPath | ConvertFrom-Json).PSObject.Properties | ForEach-Object { $log[$_.Name] = $_.Value } }
$knownJobs = @{}
foreach ($pair in ($Known -split ';' | Where-Object { $_ })) { $k, $v = $pair -split '=', 2; $knownJobs[$k] = $v }

function Save-Asset([string]$id, [string]$job) {
  $r = ''
  for ($i = 0; $i -lt 120; $i++) {
    $r = (& $pixellab -Tool get_image -ArgumentsJson (@{ job_id = $job } | ConvertTo-Json -Compress)) -join "`n"
    if ($r -notmatch 'processing|pending|queued') { break }
    Start-Sleep 5
  }
  $url = [regex]::Match($r, 'download:\s*(\S+)').Groups[1].Value
  $charged = [regex]::Match($r, 'charged:\s*([^\r\n]+)').Groups[1].Value
  if (-not $url) { Write-Output "FAILED $id ($job): $r"; return }
  $file = Join-Path $root "apps/client/public/assets/ui/skill-book/$id.png"
  New-Item -ItemType Directory -Force (Split-Path $file) | Out-Null
  & (Join-Path $root 'scripts/pixellab-download.ps1') -Url $url -OutFile $file | Out-Null
  if ($charged) { $log[$id].charged = $charged }
  Write-Output "saved $id (charged: $charged)"
}

$ids = @($assets.Keys | Where-Object { $Only.Count -eq 0 -or $Only -contains $_ })
for ($b = 0; $b -lt $ids.Count; $b += 6) {
  $batch = [ordered]@{}
  foreach ($id in $ids[$b..([Math]::Min($b + 5, $ids.Count - 1))]) {
    $w, $h, $desc, $transparent, $stylePath = $assets[$id]
    $job = $knownJobs[$id]
    if (-not $job) {
      $req = @{ description = $desc; width = $w; height = $h; no_background = $transparent; seed = 7 }
      if ($stylePath) { $req.style_image = @{ base64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes((Join-Path $root $stylePath))); usage_description = 'match this UI kit: palette, outline weight, pixel density and shading' } }
      $out = (& $pixellab -Tool create_image_pro_flash -ArgumentsJson ($req | ConvertTo-Json -Compress -Depth 4)) -join "`n"
      $job = [regex]::Match($out, 'job_id"?\s*[:=]\s*"?([0-9a-f-]{36})').Groups[1].Value
      if (-not $job) { throw "no job id for ${id}: $out" }
      Write-Output "submitted $id ($job)"
    }
    $batch[$id] = $job
    $log[$id] = [ordered]@{ tool = 'create_image_pro_flash'; description = $desc; width = $w; height = $h; no_background = $transparent; style_image = $stylePath; job_id = $job; approved = '2026-10-12 batch of 13' }
  }
  foreach ($id in $batch.Keys) { Save-Asset $id $batch[$id] }
  $log | ConvertTo-Json -Depth 4 | Out-File -Encoding utf8 $logPath
}
