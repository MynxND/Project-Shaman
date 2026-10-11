# Generates inventory item icons with PixelLab create_image_pixflux (1 generation each), sequentially.
# Usage: .\tools\ui\generate_item_icons.ps1 [-Only id1,id2]
# Writes apps/client/public/assets/ui/items/<id>.png and docs/design/ui/item-icons.json (prompts + job ids).
param([string[]]$Only = @())
$ErrorActionPreference = 'Stop'
$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$pixellab = Join-Path $root 'scripts/pixellab.ps1'
$style = 'pixel art RPG inventory item icon, single object centred, thick dark outline, warm muted palette of dark wood, weathered bronze, parchment, crimson and jade, readable silhouette, transparent background'
$items = [ordered]@{
  'potion-red'      = 'small round glass bottle of red healing herbal tonic with cork'
  'potion-blue'     = 'small round glass bottle of blue spirit tonic with cork'
  'herb-bundle'     = 'bundle of green medicinal herb leaves tied with red string'
  'holy-water'      = 'tall clay vial of holy water with a white talisman label'
  'bone'            = 'single old white animal bone'
  'raw-meat'        = 'slab of raw red meat with white fat'
  'spirit-flower'   = 'glowing purple spirit flower blossom'
  'dark-ore'        = 'chunk of black ore with faint jade glints'
  'ghost-feather'   = 'pale ghostly white feather'
  'talisman-paper'  = 'yellow paper talisman with red Thai yantra script'
  'cursed-doll'     = 'small straw voodoo doll bound with red thread'
  'bronze-amulet'   = 'round bronze amulet with a carved spirit sigil on a cord'
  'shaman-sash'     = 'folded crimson cloth sash with gold embroidered trim'
  'spirit-sash'     = 'folded violet cloth sash with jade embroidered trim'
  'spirit-bell'     = 'small bronze ritual hand bell'
}
$log = @{}
foreach ($id in $items.Keys) {
  if ($Only.Count -gt 0 -and $Only -notcontains $id) { continue }
  $desc = "$($items[$id]), $style"
  $req = @{ description = $desc; width = 32; height = 32; no_background = $true; outline = 'single color black outline'; shading = 'medium shading'; detail = 'medium detail'; seed = 11 } | ConvertTo-Json -Compress
  $out = (& $pixellab -Tool create_image_pixflux -ArgumentsJson $req) -join "`n"
  $job = [regex]::Match($out, 'job_id:\s*(\S+)').Groups[1].Value
  for ($i = 0; $i -lt 30; $i++) { Start-Sleep 5; $r = (& $pixellab -Tool get_image -ArgumentsJson (@{ job_id = $job } | ConvertTo-Json -Compress)) -join "`n"; if ($r -notmatch 'processing|pending') { break } }
  $url = [regex]::Match($r, 'download:\s*(\S+)').Groups[1].Value
  & (Join-Path $root 'scripts/pixellab-download.ps1') -Url $url -OutFile (Join-Path $root "apps/client/public/assets/ui/items/$id.png") | Out-Null
  $log[$id] = @{ description = $desc; job_id = $job; size = 32 }
  Write-Output "icon $id ($job)"
}
$logPath = Join-Path $root 'docs/design/ui/item-icons.json'
$log | ConvertTo-Json -Depth 4 | Out-File -Encoding utf8 $logPath
