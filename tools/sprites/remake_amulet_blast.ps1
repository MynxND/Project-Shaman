# Amulet Blast v3 release VFX (user review 2026-10-09: v2 filled its whole 192x160 frame, so in game it read as a
# hard-edged rectangle with a symmetric eight-ray starburst). v3: an asymmetric, ground-hugging burst of talisman
# fragments that stays inside transparent margins. Steps: Pro Flash seed -> animate_image (12 frames) -> raw frames in
# docs/design/skills/medium-v1/raw/amulet-blast-v3/ ; tools/sprites/pack_amulet_blast_v3.py packs the sheet.
# Usage: .\tools\sprites\remake_amulet_blast.ps1 [-SeedJob <id>] [-AnimJob <id>]   (ids resume without paying again)
param([string]$SeedJob = '', [string]$AnimJob = '')
$ErrorActionPreference = 'Stop'
$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$pixellab = Join-Path $root 'scripts/pixellab.ps1'
$raw = Join-Path $root 'docs/design/skills/medium-v1/raw/amulet-blast-v3'
New-Item -ItemType Directory -Force $raw | Out-Null
$log = Join-Path $raw 'jobs.json'

function Call([string]$tool, $a) { (& $pixellab -Tool $tool -ArgumentsJson ($a | ConvertTo-Json -Compress -Depth 6)) -join "`n" }
function JobId([string]$t) { [regex]::Match($t, 'job_id"?\s*[:=]\s*"?([0-9a-f-]{36})').Groups[1].Value }
function Wait-Image([string]$job) {
  for ($i = 0; $i -lt 120; $i++) { $r = Call 'get_image' @{ job_id = $job }; if ($r -notmatch '(?i)processing|pending|queued') { return $r }; Start-Sleep 5 }
  throw "timed out on $job"
}

$seedPrompt = 'AMULET BLAST spell impact VFX for a classic elevated three-quarter MMORPG view, seen slightly from above: an ASYMMETRIC low burst that hugs the ground in a wide flattened ELLIPSE (a 3x3 tile area in perspective), torn cream Pha Yant talisman paper fragments with tiny abstract crimson stepped marks flung unevenly, more and larger on the right and front, fewer behind, a few curling antique-gold ritual light ribbons of different lengths, small amber and ivory sparks scattered irregularly, airy transparent gaps everywhere. NOT a starburst, NOT radial symmetry, NOT a ring, no straight rays, no cross shape. The whole effect sits well inside the canvas with at least 14 pixels of empty transparent margin on every side, nothing touches the edges. Weathered antique gold, bronze, parchment and dark crimson palette, crisp pixel clusters, transparent background, no floor, no disk, no character, no text.'
if (-not $SeedJob) {
  $out = Call 'create_image_pro_flash' @{ description = $seedPrompt; width = 192; height = 160; no_background = $true; seed = 109703 }
  $SeedJob = JobId $out
  if (-not $SeedJob) { throw "no seed job: $out" }
  Write-Output "seed job $SeedJob"
}
$r = Wait-Image $SeedJob
$seedUrl = [regex]::Match($r, 'download:\s*(\S+)').Groups[1].Value
& (Join-Path $root 'scripts/pixellab-download.ps1') -Url $seedUrl -OutFile (Join-Path $raw 'seed.png') | Out-Null

$action = 'The asymmetric talisman burst erupts from the ground: paper fragments fling outward and tumble at different speeds and angles, more toward the front-right, gold light ribbons curl and unwind unevenly, sparks scatter, then everything flutters down and fades into a few drifting embers. Keep the burst low and inside the canvas margins, never touching the edges, keep the exact palette, transparent background.'
if (-not $AnimJob) {
  $out = Call 'animate_image' @{ first_frame_url = $seedUrl; action = $action; frame_count = 12; no_background = $true; seed = 109803 }
  $AnimJob = JobId $out
  if (-not $AnimJob) { throw "no animation job: $out" }
  Write-Output "animation job $AnimJob"
}
$r = Wait-Image $AnimJob
Set-Content -Encoding utf8 (Join-Path $raw 'animation.response.txt') $r
$urls = [regex]::Matches($r, 'https://api\.pixellab\.ai/\S+?\.png') | ForEach-Object { $_.Value } | Select-Object -Unique
$n = 0
foreach ($u in $urls) { & (Join-Path $root 'scripts/pixellab-download.ps1') -Url $u -OutFile (Join-Path $raw ("frame-{0:d2}.png" -f $n)) | Out-Null; $n++ }
if ($n -eq 0) {
  $dl = [regex]::Match($r, 'download:\s*(\S+)').Groups[1].Value
  if ($dl) { & (Join-Path $root 'scripts/pixellab-download.ps1') -Url $dl -OutFile (Join-Path $raw 'frames.download') | Out-Null }
}
@{ seedJob = $SeedJob; animationJob = $AnimJob; seedPrompt = $seedPrompt; action = $action; frames = $n } | ConvertTo-Json | Out-File -Encoding utf8 $log
Write-Output "frames $n"
