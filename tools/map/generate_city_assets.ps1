# Umbral Capital v2 map art with PixelLab (docs/design/UMBRAL_CAPITAL_REDESIGN.md).
# Kinds: 'object' = create_map_object (view high top-down, transparent), 'pro' = create_image_pro_flash,
#        'tileset' = create_topdown_tileset (16 px Wang tiles; sheet PNG + metadata JSON).
# Usage: .\tools\map\generate_city_assets.ps1 -Only lantern,spirit-pillar [-Known 'id=jobId;...']
# Raw results: docs/design/umbral-v2/raw/<id>.png (+ <id>.json for tilesets); prompts and ids merged into
# docs/design/umbral-v2/assets.json. Processing into the game is done by tools/map/build_city_assets.py.
param([string[]]$Only = @(), [string]$Known = '')
$ErrorActionPreference = 'Stop'
$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$pixellab = Join-Path $root 'scripts/pixellab.ps1'
$rawDir = Join-Path $root 'docs/design/umbral-v2/raw'
New-Item -ItemType Directory -Force $rawDir | Out-Null

# Shared art language (kept short: create_map_object rejects long descriptions, ~400 characters failed).
$style = 'classic 2D MMORPG town art, elevated three-quarter view, ancient Thai shaman style, carved teak, grey stone, gold trim, red cloth, jade accents, no text'
$forest = 'classic 2D MMORPG forest art, elevated three-quarter view, Thai shaman folklore, muted greens, moss, weathered wood and stone, no text'

$assets = [ordered]@{
  # Phase 3 style test.
  'lantern'       = @('object', 32, 64, "Thai ritual lantern on a carved stone post, bronze cap, glowing amber lantern, red talisman strip, $style")
  'spirit-pillar' = @('object', 48, 112, "Thai city spirit pillar shrine, gold lotus-bud top, wrapped in red and yellow sacred cloth, incense at the base, $style")
  'sacred-tree'   = @('object', 128, 160, "ancient sacred bodhi tree, twisted trunk wrapped in colourful cloth sashes, small spirit house at its roots, dark green canopy, $style")
  'house-teak'    = @('object', 160, 160, "traditional Thai teak house, steep layered roof with gable finials, carved panels, front porch with steps, lantern by the door, $style")
  # create_map_object drew the house isometric on a diamond of grass, which the camera rules forbid (AGENTS.md);
  # buildings use Pro Flash with an explicit straight-on facade instead.
  'house-front'   = @('pro', 160, 160, "traditional Thai teak house seen from the front and slightly above like a classic 2D RPG town, the front facade faces the camera straight on and is symmetric, steep layered roof with gold gable finials, carved panels, front porch with steps, red cloth banner, not isometric, no ground tile, transparent background, no text", '')
  # Ground: road stone (lower) to ornamental plaza paving (upper).
  'tiles-plaza'   = @('tileset', 16, 16, 'weathered grey stone cobble road', 'ornate sacred plaza paving of warm sandstone slabs with engraved Thai yantra geometric lines')

  # Phase 4 - Great Yantra Plaza. The first plaza paving read as orange wicker; v2 keeps the road tile (chained by its
  # base tile id) and asks for muted stone slabs.
  'tiles-plaza2'  = @('tileset', 16, 16, 'weathered grey stone cobble road', 'large square slabs of pale weathered beige sandstone with thin dark joints and faint engraved lines, muted colours', @{ lower_base_tile_id = 'eca11e4b-7d96-4ac2-81e4-b9b3e099c690' })
  'yantra-disc'   = @('pro', 256, 256, "flat circular ceremonial stone platform seen from directly above, engraved original Thai sacred yantra geometry with concentric rings, lotus petals and radiating lines, pale weathered sandstone with antique gold inlay and a few red cloth offerings at the rim, no text, no letters, transparent background", '')
  'ritual-pillar' = @('object', 32, 80, "small Thai ritual pillar with a gold lotus top, red and yellow cloth bands, carved stone base, $style")
  'brazier'       = @('object', 48, 64, "bronze ritual brazier bowl on three carved legs with warm amber fire, Thai temple style, $style")
  'guardian'      = @('object', 64, 112, "Thai temple giant guardian statue standing with a club, painted stone with gold crown, facing right, $style")
  'banner-pole'   = @('object', 32, 96, "tall teak pole with a hanging red talisman banner with a gold yantra pattern and a bronze finial, $style")
  'flowerbed'     = @('object', 64, 48, "low carved stone flowerbed with orange marigolds and pink lotus buds, $style")
  'incense'       = @('object', 32, 48, "small bronze incense burner urn with smoking incense sticks and marigold garland, $style")

  # Scale pass: PixelLab fills the canvas, so canvas size sets in-game size (16 px = 1 unit; the player is ~1.9 units
  # tall). The first brazier (3.5 units), guardian (7) and flowerbed came out far too large next to the player.
  'brazier-s'     = @('object', 32, 40, "bronze ritual brazier bowl on three carved legs with warm amber fire, Thai temple style, $style")
  'guardian-s'    = @('object', 48, 80, "Thai temple giant guardian statue standing with a club on a stone pedestal, painted stone with gold crown, facing right, $style")
  'flowerbed-s'   = @('object', 48, 32, "low carved stone flowerbed with orange marigolds and pink lotus buds, $style")
  'ritual-pillar-s' = @('object', 32, 64, "small Thai ritual pillar with a gold lotus top, red and yellow cloth bands, carved stone base, $style")

  # Level design pass (2026-10-09): only pieces the layout cannot be built without (UMBRAL_CAPITAL_REDESIGN.md).
  'temple-thai'   = @('pro', 256, 208, "grand Thai ritual temple hall, multi-tiered layered dark red and gold roof with chofa finials, white and dark teak walls, wide stone staircase in front with naga balustrades, glowing doorway, seen from the front and slightly above like a classic 2D RPG town, symmetric front facade facing the camera, not isometric, no ground tile, transparent background, no text", '')
  'training-hall' = @('pro', 192, 160, "Thai shaman training hall, open-sided teak sala pavilion with a two-tier red roof and gold finials, low stone platform with front steps, ritual banners, seen from the front and slightly above like a classic 2D RPG town, symmetric front facade facing the camera, not isometric, no ground tile, transparent background, no text", '')
  'house-stilt'   = @('pro', 128, 128, "small Thai village house on short wooden stilts, steep thatched roof, woven bamboo walls, front ladder, potted plants, seen from the front and slightly above like a classic 2D RPG town, symmetric front facade facing the camera, not isometric, no ground tile, transparent background, no text", '')
  'house-row'     = @('pro', 160, 128, "Thai teak shophouse with a long low dark tiled roof, wooden folding doors, a hanging red lantern and a cloth sign, seen from the front and slightly above like a classic 2D RPG town, symmetric front facade facing the camera, not isometric, no ground tile, transparent background, no text", '')
  'fence'         = @('object', 48, 32, "short carved teak garden fence segment seen from the front, posts with small gold caps, red thread tied, $style")
  'dummy'         = @('object', 32, 48, "straw and wood training dummy on a post with paper talismans stuck on it, $style")
  # Path tiles: grass joins the existing road tile (chained by its base tile id), then grass to packed earth.
  'tiles-grass-road' = @('tileset', 16, 16, 'dark green grass lawn with tiny wild flowers', 'weathered grey stone cobble road', @{ upper_base_tile_id = 'eca11e4b-7d96-4ac2-81e4-b9b3e099c690' })
  # tiles-grass-road came back neon green; v2 asks for a muted night grass. Its grass tile is then the base for water and earth.
  'tiles-grass-road2' = @('tileset', 16, 16, 'dark muted mossy green grass with a few tiny dark flowers, shadowy night palette', 'weathered grey stone cobble road', @{ upper_base_tile_id = 'eca11e4b-7d96-4ac2-81e4-b9b3e099c690' })

  # User prototype (2026-10-09): canals, bridges, a city wall with towers, dense planted trees.
  'bridge-h'      = @('object', 64, 48, "short arched teak footbridge crossing from left to right, red wooden railings, stone abutments, $style")
  'bridge-v'      = @('object', 48, 64, "short flat teak footbridge running straight away from the viewer, red wooden railings on both sides, $style")
  'wall'          = @('pro', 128, 64, "straight section of an old grey stone city wall with a crenellated top, moss, small red cloth banners, seen from the front and slightly above like a classic 2D RPG town, front facing the camera, not isometric, no ground tile, transparent background, no text", '')
  'tower'         = @('object', 64, 112, "Thai city wall corner watchtower, square grey stone base, teak upper floor with a red tiered roof and gold finial, glowing lanterns, $style")
  'pine'          = @('object', 48, 80, "tall slender dark green cypress tree, $style")
  'blossom'       = @('object', 96, 96, "tree covered in pink blossoms with a dark trunk, a few petals on the ground, $style")
  'bush'          = @('object', 48, 32, "round dark green shrub with small orange flowers, $style")
  'lotus-pads'    = @('object', 32, 32, "floating lotus pads with one pink lotus flower, seen from above, $style")
  # Chained on the tiles-grass-road2 grass tile (c2d52436...) so all grass edges match.
  'tiles-water'   = @('tileset', 16, 16, 'deep dark blue canal water with gentle ripples', 'dark muted mossy green grass with a few tiny dark flowers, shadowy night palette', @{ upper_base_tile_id = 'c2d52436-164a-44bd-b912-b068817a33d0'; transition_description = 'carved grey stone canal edge' })
  'tiles-dirt'    = @('tileset', 16, 16, 'dark muted mossy green grass with a few tiny dark flowers, shadowy night palette', 'packed brown earth footpath with small pebbles', @{ lower_base_tile_id = 'c2d52436-164a-44bd-b912-b068817a33d0' })
  'pine2'         = @('object', 48, 80, "single tall slender dark green cypress tree on its own, no buildings, $style")
  # User review 2026-10-09: replace the dark v1 gate and the busy road pattern.
  'gate-thai'     = @('pro', 192, 160, "grand Thai city gate seen from the front and slightly above like a classic 2D RPG town, two thick white and red stone pillars joined by a tiered red and gold Thai roof with chofa finials, wide open passage in the middle, red cloth banners, glowing lanterns, symmetric, front facing the camera, not isometric, no ground tile, transparent background, no text", '')
  'tiles-road-calm' = @('tileset', 16, 16, 'dark muted mossy green grass with a few tiny dark flowers, shadowy night palette', 'worn grey flagstone road of large irregular stones with soft muted colours and subtle thin joints', @{ lower_base_tile_id = 'c2d52436-164a-44bd-b912-b068817a33d0' })
  # East/west city walls: the wall runs north-south, so in the three-quarter view it reads as a long vertical strip
  # (crenellated walkway on top, the inner stone face down the right side). Two tools tried; build picks one.
  'wall-side'     = @('pro', 48, 128, "straight section of an old grey stone city wall running north to south, seen from above at a three-quarter angle like a classic 2D RPG town: a long vertical strip showing the crenellated top walkway with moss and the inner stone face along its right side, small red cloth banner, fills the canvas from top to bottom, no ground tile, transparent background, no text", '')
  'wall-side-obj' = @('object', 48, 128, "long straight grey stone city wall segment running from the top of the image to the bottom, crenellated walkway on top, stone face on the right side, moss, $style")
  # Lighting redesign (2026-10-09): three lighting props with distinct roles plus a building-mounted lantern.
  'light-talisman' = @('object', 32, 48, "short carved teak lantern post with an antique bronze lantern glowing warm amber, red sacred thread and a small hanging Thai talisman cloth, $style")
  'light-spirit'   = @('object', 32, 48, "carved grey stone lantern pedestal with an engraved Thai occult motif, holding a softly glowing jade green spirit crystal, $style")
  'light-brazier'  = @('object', 48, 48, "weathered bronze ritual fire brazier bowl with carved Thai flame ornaments, glowing embers and small ceremonial flames, $style")
  'light-hanging'  = @('object', 32, 32, "small red paper lantern hanging from a short carved wooden wall bracket, warm glow, $style")
  # Town NPCs (2026-10-09): one front-facing standing sprite each, styled on the main character.
  'npc-guide' = @('pro', 128, 128, "friendly young town guide in a jade and cream Thai tunic holding a paper map scroll, full body standing still facing the viewer, same chibi proportions, outline and pixel density as the reference character, Thai shaman fantasy, transparent background, no text", '', @{ style = 'apps/client/public/assets/pixellab/main-female-v1/south.png' })
  'npc-elder' = @('pro', 128, 128, "elderly temple master in dark red and saffron robes with prayer beads and a white beard, full body standing still facing the viewer, same chibi proportions, outline and pixel density as the reference character, Thai shaman fantasy, transparent background, no text", '', @{ style = 'apps/client/public/assets/pixellab/main-female-v1/south.png' })
  'npc-instructor' = @('pro', 128, 128, "stern shaman instructor in black and red ritual garb with a carved staff and talisman papers, full body standing still facing the viewer, same chibi proportions, outline and pixel density as the reference character, Thai shaman fantasy, transparent background, no text", '', @{ style = 'apps/client/public/assets/pixellab/main-female-v1/south.png' })
  'npc-herbalist' = @('pro', 128, 128, "kind herbal healer woman with a woven herb basket, green and brown cloth, flower in her hair, full body standing still facing the viewer, same chibi proportions, outline and pixel density as the reference character, Thai shaman fantasy, transparent background, no text", '', @{ style = 'apps/client/public/assets/pixellab/main-female-v1/south.png' })
  'npc-talisman' = @('pro', 128, 128, "talisman craftsman with a red headband holding a glowing yellow talisman paper, apron with ink brushes, full body standing still facing the viewer, same chibi proportions, outline and pixel density as the reference character, Thai shaman fantasy, transparent background, no text", '', @{ style = 'apps/client/public/assets/pixellab/main-female-v1/south.png' })
  'npc-trader' = @('pro', 128, 128, "plump merchant in rich gold and crimson silk with a coin pouch and an abacus, full body standing still facing the viewer, same chibi proportions, outline and pixel density as the reference character, Thai shaman fantasy, transparent background, no text", '', @{ style = 'apps/client/public/assets/pixellab/main-female-v1/south.png' })
  'npc-storage' = @('pro', 128, 128, "storage keeper with a big key ring and a wooden chest strapped to his back, brown work clothes, full body standing still facing the viewer, same chibi proportions, outline and pixel density as the reference character, Thai shaman fantasy, transparent background, no text", '', @{ style = 'apps/client/public/assets/pixellab/main-female-v1/south.png' })
  'npc-smith' = @('pro', 128, 128, "muscular amulet smith with a bronze hammer and leather apron, rolled sleeves, full body standing still facing the viewer, same chibi proportions, outline and pixel density as the reference character, Thai shaman fantasy, transparent background, no text", '', @{ style = 'apps/client/public/assets/pixellab/main-female-v1/south.png' })
  'npc-teleporter' = @('pro', 128, 128, "mysterious spirit medium woman in flowing violet and white robes holding a glowing jade orb, full body standing still facing the viewer, same chibi proportions, outline and pixel density as the reference character, Thai shaman fantasy, transparent background, no text", '', @{ style = 'apps/client/public/assets/pixellab/main-female-v1/south.png' })
  'npc-guard' = @('pro', 128, 128, "city gate guard in teak and bronze Thai armour with a spear and a red sash, full body standing still facing the viewer, same chibi proportions, outline and pixel density as the reference character, Thai shaman fantasy, transparent background, no text", '', @{ style = 'apps/client/public/assets/pixellab/main-female-v1/south.png' })
  'npc-keeper' = @('pro', 128, 128, "shrine keeper woman in white and gold holding a small incense bowl, calm smile, full body standing still facing the viewer, same chibi proportions, outline and pixel density as the reference character, Thai shaman fantasy, transparent background, no text", '', @{ style = 'apps/client/public/assets/pixellab/main-female-v1/south.png' })
  # Ambient townsfolk (2026-10-09): south sprites that create_character v3 rotates; walk via template animation.
  'walker-boy' = @('pro', 128, 128, "small village boy about eight years old, much shorter than an adult, simple orange shirt and brown shorts, barefoot, cheerful, full body standing straight facing the viewer, arms relaxed, same outline and pixel density as the reference character, Thai village townsfolk, transparent background, no text", '', @{ style = 'apps/client/public/assets/pixellab/main-female-v1/south.png' })
  'walker-girl' = @('pro', 128, 128, "small village girl about seven years old, much shorter than an adult, pink blouse and green sarong, hair in two buns, full body standing straight facing the viewer, arms relaxed, same outline and pixel density as the reference character, Thai village townsfolk, transparent background, no text", '', @{ style = 'apps/client/public/assets/pixellab/main-female-v1/south.png' })
  'walker-grandpa' = @('pro', 128, 128, "elderly grandfather with a white beard and a walking stick, faded indigo shirt and loose fisherman trousers, slightly stooped, full body standing straight facing the viewer, arms relaxed, same outline and pixel density as the reference character, Thai village townsfolk, transparent background, no text", '', @{ style = 'apps/client/public/assets/pixellab/main-female-v1/south.png' })
  'walker-grandma' = @('pro', 128, 128, "elderly grandmother with grey hair in a bun, cream blouse and dark patterned sarong, carrying a small woven basket, full body standing straight facing the viewer, arms relaxed, same outline and pixel density as the reference character, Thai village townsfolk, transparent background, no text", '', @{ style = 'apps/client/public/assets/pixellab/main-female-v1/south.png' })
  # Landscape pass (2026-10-09): only the missing low layers; trees are reused.
  'reeds'         = @('object', 32, 32, "clump of tall green canal reeds and grasses growing at a water edge, $style")
  'moss-stones'   = @('object', 32, 32, "two or three low mossy grey garden stones with small ferns, $style")
  'clay-pots'     = @('object', 32, 32, "group of three terracotta clay pots with small green herbs and a marigold, $style")
  'stone-bed'     = @('object', 64, 32, "low rectangular planting bed with a carved grey stone border filled with neat low green shrubs and a few red flowers, $style")
  'stepping'      = @('object', 32, 32, "three flat round stepping stones set in grass, seen from above, $style")
  'shrub-low'     = @('object', 48, 32, "low clipped dark green hedge shrub cluster, $style")
  'small-tree'    = @('object', 48, 64, "small round shade tree with a dark green canopy and a slim trunk, $style")
  # Whispering Spiritwood (2026-10-09, docs/design/spiritwood/README.md): forest pieces the town set lacks.
  'sw-bamboo'        = @('object', 48, 80, "dense clump of tall green bamboo stalks with leaves, a few yellowed stalks, $forest")
  'sw-jungle-tree'   = @('object', 96, 112, "large ancient tropical forest tree with buttress roots and a dark green layered canopy, moss on the bark, $forest")
  'sw-mossy-rock'    = @('object', 48, 32, "low mossy grey boulder with small ferns at its base, $forest")
  'sw-fern'          = @('object', 32, 32, "low clump of wild forest ferns and broad leaves, $forest")
  'sw-cursed-tree'   = @('object', 64, 96, "twisted leafless black cursed tree wrapped in faded red cloth strips and hanging paper talismans, $forest")
  'sw-ruined-shrine' = @('object', 96, 96, "abandoned crumbling Thai stone spirit shrine with a broken tiered roof, cracked steps, roots and moss growing over it, $forest")
  'sw-spirit-house'  = @('object', 32, 48, "small weathered Thai spirit house on a wooden post with tiny offerings and a marigold garland, $forest")
  'sw-noticeboard'   = @('object', 48, 48, "village teak notice board on two posts with pinned blank paper notes and a small roof, $forest")
}

$logPath = Join-Path $root 'docs/design/umbral-v2/assets.json'
$log = [ordered]@{}
if (Test-Path $logPath) { (Get-Content -Raw -Encoding utf8 $logPath | ConvertFrom-Json).PSObject.Properties | ForEach-Object { $log[$_.Name] = $_.Value } }
$knownJobs = @{}
foreach ($pair in ($Known -split ';' | Where-Object { $_ })) { $k, $v = $pair -split '=', 2; $knownJobs[$k] = $v }

function Call([string]$tool, $args1) {
  # Keep PixelLab's own message when a call fails (pixellab.ps1 prints it, then throws).
  $lines = & { try { & $pixellab -Tool $tool -ArgumentsJson ($args1 | ConvertTo-Json -Compress -Depth 6) } catch { "ERROR: $_" } } 2>&1
  $text = ($lines | ForEach-Object { "$_" }) -join "`n"
  if ($text -match 'ERROR: ') { throw "$tool failed: $text" }
  return $text
}
function FirstId([string]$text, [string]$key) { [regex]::Match($text, "$key`"?\s*[:=]\s*`"?([0-9a-f-]{36})").Groups[1].Value }

function Submit([string]$id) {
  $kind, $w, $h, $a, $b, $extra = $assets[$id]
  switch ($kind) {
    'object'  { $out = Call 'create_map_object' @{ description = $a; width = $w; height = $h; view = 'high top-down'; outline = 'single color outline'; shading = 'detailed shading'; detail = 'high detail' }; $jid = FirstId $out 'object_id'; if (-not $jid) { $jid = FirstId $out 'id' } }
    'pro'     {
      $req = @{ description = $a; width = $w; height = $h; no_background = $true; seed = 7 }
      # Optional 6th element @{ style = 'repo/relative.png' }: style reference (must already be the canvas size).
      if ($extra -and $extra.style) {
        $req.style_image = @{ base64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes((Join-Path $root $extra.style))); usage_description = 'match this character art: proportions, outline weight, palette and shading' }
      }
      $out = Call 'create_image_pro_flash' $req; $jid = FirstId $out 'job_id'
    }
    'tileset' {
      $req = @{ lower_description = $a; upper_description = $b; tile_size = @{ width = $w; height = $h }; transition_size = 0.25; view = 'high top-down'; outline = 'lineless'; shading = 'detailed shading'; detail = 'highly detailed' }
      # Optional 6th element: extra arguments, e.g. lower_base_tile_id to chain tilesets so shared terrains match.
      if ($extra) { foreach ($k in $extra.Keys) { $req[$k] = $extra[$k] } }
      $out = Call 'create_topdown_tileset' $req; $jid = FirstId $out 'tileset_id'; if (-not $jid) { $jid = FirstId $out 'id' }
    }
  }
  if (-not $jid) { throw "no id for ${id}: $out" }
  Write-Host "submitted $id ($kind $jid)"  # Write-Host: function output must be only the id
  return $jid
}

function Fetch([string]$id, [string]$jid) {
  $kind = $assets[$id][0]
  $poll = @{ object = 'get_map_object'; pro = 'get_image'; tileset = 'get_topdown_tileset' }[$kind]
  $arg = @{ object = @{ object_id = $jid }; pro = @{ job_id = $jid }; tileset = @{ tileset_id = $jid } }[$kind]
  $r = ''
  for ($i = 0; $i -lt 120; $i++) {
    $r = Call $poll $arg
    if ($r -notmatch '(?i)processing|pending|queued|in progress|generating') { break }
    Start-Sleep 5
  }
  Set-Content -Encoding utf8 (Join-Path $rawDir "$id.response.txt") $r
  $url = [regex]::Match($r, '(?i)download[^:]*:\s*(\S+)').Groups[1].Value
  if (-not $url) { $url = [regex]::Match($r, 'https://\S+?\.png').Value }
  if ($kind -eq 'tileset') { $url = "https://api.pixellab.ai/mcp/tilesets/$jid/image?inline=true" }
  if (-not $url) { Write-Output "FAILED $id ($jid): see $id.response.txt"; return }
  & (Join-Path $root 'scripts/pixellab-download.ps1') -Url $url -OutFile (Join-Path $rawDir "$id.png") | Out-Null
  if ($kind -eq 'tileset') {
    & (Join-Path $root 'scripts/pixellab-download.ps1') -Url "https://api.pixellab.ai/mcp/tilesets/$jid/metadata" -OutFile (Join-Path $rawDir "$id.json") | Out-Null
  }
  Write-Output "saved $id"
}

$ids = @($assets.Keys | Where-Object { $Only.Count -eq 0 -or $Only -contains $_ })
for ($b = 0; $b -lt $ids.Count; $b += 6) {
  $batch = [ordered]@{}
  foreach ($id in $ids[$b..([Math]::Min($b + 5, $ids.Count - 1))]) {
    $jid = $knownJobs[$id]
    if (-not $jid) { $jid = Submit $id }
    $batch[$id] = $jid
    $kind, $w, $h, $a, $bb = $assets[$id]
    $log[$id] = [ordered]@{ kind = $kind; width = $w; height = $h; description = $a; upper = $bb; id = $jid }
  }
  foreach ($id in $batch.Keys) { Fetch $id $batch[$id] }
  $log | ConvertTo-Json -Depth 4 | Out-File -Encoding utf8 $logPath
}
