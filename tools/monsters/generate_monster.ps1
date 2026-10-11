# Monster sprites for Whispering Spiritwood (docs/design/monsters/README.md).
# Stage 'seed': one Pro Flash sprite on a 128 px canvas (same canvas and pixel density as the 128 px main character,
#   which is passed as the style reference), three-quarter view facing right; the client mirrors it to face left.
# Stage 'anim': animate_image from the reviewed seed for idle, move, attack, hurt and death.
# Raw output, prompts and job ids: docs/design/monsters/raw/<id>/. Never prints credentials (scripts/pixellab.ps1).
# Usage: .\tools\monsters\generate_monster.ps1 -Id leaf-wisp -Stage seed|anim [-Only attack,hurt]
param([Parameter(Mandatory = $true)][string]$Id, [ValidateSet('seed', 'anim')][string]$Stage = 'seed', [string[]]$Only = @())
$ErrorActionPreference = 'Stop'
$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$pixellab = Join-Path $root 'scripts/pixellab.ps1'
$raw = Join-Path $root "docs/design/monsters/raw/$Id"
New-Item -ItemType Directory -Force $raw | Out-Null
$spec = Get-Content -Raw -Encoding utf8 (Join-Path $root 'docs/design/monsters/monsters.json') | ConvertFrom-Json
$m = $spec.monsters.$Id
if (-not $m) { throw "unknown monster $Id" }
# One provenance file per job: seed.job.json, <animation>.job.json.
function Save-Log([string]$name, $data) { $data | ConvertTo-Json -Depth 8 | Out-File -Encoding utf8 (Join-Path $raw "$name.job.json") }

function Call([string]$tool, $a) { (& $pixellab -Tool $tool -ArgumentsJson ($a | ConvertTo-Json -Compress -Depth 6)) -join "`n" }
function JobId([string]$t) { [regex]::Match($t, 'job_id"?\s*[:=]\s*"?([0-9a-f-]{36})').Groups[1].Value }
function Wait-Image([string]$job) {
  for ($i = 0; $i -lt 160; $i++) { $r = Call 'get_image' @{ job_id = $job }; if ($r -notmatch '(?i)processing|pending|queued|in progress') { return $r }; Start-Sleep 5 }
  throw "timed out on $job"
}
function Download([string]$url, [string]$file) { & (Join-Path $root 'scripts/pixellab-download.ps1') -Url $url -OutFile $file | Out-Null }

$common = 'Thai shaman folklore creature for a classic 2D MMORPG, elevated three-quarter overhead camera, full body seen slightly from above, three-quarter view facing RIGHT and slightly toward the viewer, standing on the ground (feet or lowest point near the bottom centre of the canvas), same outline weight, pixel density, palette and shading as the reference character, upper-left key light, crisp detailed pixel art, transparent background, no ground, no shadow, no text, no frame'

if ($Stage -eq 'seed') {
  $prompt = "$($m.prompt). $common"
  # Canvas per monster (128 like the character; 192 for the mini boss). The style reference must match the canvas, so
  # larger canvases use the character padded to that size (docs/design/monsters/style-ref-<size>.png).
  $size = if ($m.size) { [int]$m.size } else { 128 }
  $styleRef = if ($size -eq 128) { "apps/client/public/assets/pixellab/main-female-v1/south.png" } else { "docs/design/monsters/style-ref-$size.png" }
  $req = @{ description = $prompt; width = $size; height = $size; no_background = $true; seed = [int]$m.seed
    style_image = @{ base64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes((Join-Path $root $styleRef))); usage_description = 'match this character art: outline weight, pixel density, palette and shading only (not its body or clothes)' } }
  $out = Call 'create_image_pro_flash' $req
  $job = JobId $out; if (-not $job) { throw "no seed job: $out" }
  Write-Output "seed job $job"
  $r = Wait-Image $job
  $url = [regex]::Match($r, 'download:\s*(\S+)').Groups[1].Value
  $urls = @(0..3 | ForEach-Object { $url -replace '\?.*$', "?index=$_" })
  for ($i = 0; $i -lt $urls.Count; $i++) { try { Download $urls[$i] (Join-Path $raw "seed-$i.png") } catch { break } }
  Save-Log 'seed' @{ job = $job; tool = 'create_image_pro_flash'; prompt = $prompt; url = $url; seed = [int]$m.seed; width = $size; height = $size }
  Write-Output 'seed candidates saved; copy the chosen one to seed.png'
  return
}

$seedUrl = $m.seedUrl
if (-not $seedUrl) { throw 'set monsters.json seedUrl to the chosen seed candidate (PixelLab download url) first' }
$jobs = @{}
foreach ($a in $m.animations.PSObject.Properties) {
  if ($Only.Count -and $Only -notcontains $a.Name) { continue }
  # Resume a job submitted earlier (its id is written right after submitting), so a failed run never pays twice.
  $pending = Join-Path $raw "$($a.Name).pending"
  if (Test-Path $pending) { $jobs[$a.Name] = (Get-Content -Raw $pending).Trim(); Write-Output "$($a.Name) resuming $($jobs[$a.Name])"; continue }
  if (Test-Path (Join-Path $raw "$($a.Name).job.json")) { continue }
  # PixelLab allows 8 jobs at once: wait and retry while the queue is full.
  $job = ''
  for ($try = 0; $try -lt 60 -and -not $job; $try++) {
    try { $out = Call 'animate_image' @{ first_frame_url = $seedUrl; action = $a.Value.action; frame_count = [int]$a.Value.frames; no_background = $true; seed = [int]$m.seed + 11 }; $job = JobId $out }
    catch { Write-Output "waiting to submit $($a.Name): $($_.Exception.Message)"; Start-Sleep 20 }
  }
  if (-not $job) { throw "no $($a.Name) job: $out" }
  Set-Content -Encoding ascii $pending $job
  Write-Output "$($a.Name) job $job"
  $jobs[$a.Name] = $job
}
foreach ($name in $jobs.Keys) {
  $r = Wait-Image $jobs[$name]
  $url = [regex]::Match($r, 'download:\s*(\S+)').Groups[1].Value
  $dir = Join-Path $raw $name; New-Item -ItemType Directory -Force $dir | Out-Null
  $frames = [int]$m.animations.$name.frames
  for ($i = 0; $i -le $frames; $i++) { Download ($url -replace '\?.*$', "?index=$i") (Join-Path $dir ("frame_{0:d2}.png" -f $i)) }
  Save-Log $name @{ job = $jobs[$name]; tool = 'animate_image'; action = $m.animations.$name.action; frames = $frames; url = $url; firstFrame = $seedUrl }
  Write-Output "$name saved ($($frames + 1) images, index 0 = seed)"
  Remove-Item -Force (Join-Path $raw "$name.pending") -ErrorAction SilentlyContinue
}
