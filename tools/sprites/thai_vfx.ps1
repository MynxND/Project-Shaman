# Thailand skill release VFX (docs/design/skills/thailand-v1). One skill per run, user-approved batches only.
# Steps: Pro Flash seed -> animate_image -> raw frames in docs/design/skills/thailand-v1/raw/<skill>/ (+ jobs.json).
# Prompts live in docs/design/skills/thailand-v1/prompts.json. Ids resume without paying again; a skill that already
# has jobs.json is never resubmitted unless its ids are passed explicitly.
# Usage: .\tools\sprites\thai_vfx.ps1 -Skill <id> [-SeedOnly] [-SeedJob <id>] [-AnimJob <id>]
param([Parameter(Mandatory)][string]$Skill, [string]$Set = 'thailand-v1', [switch]$SeedOnly, [string]$SeedJob = '', [string]$AnimJob = '')
$ErrorActionPreference = 'Stop'
$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$pixellab = Join-Path $root 'scripts/pixellab.ps1'
$spec = (Get-Content -Raw (Join-Path $root "docs/design/skills/$Set/prompts.json") | ConvertFrom-Json).skills.$Skill
if (-not $spec) { throw "no prompt for $Skill" }
$raw = Join-Path $root "docs/design/skills/$Set/raw/$Skill"
New-Item -ItemType Directory -Force $raw | Out-Null
$log = Join-Path $raw 'jobs.json'
$prev = if (Test-Path $log) { Get-Content -Raw $log | ConvertFrom-Json } else { $null }
if ($prev -and -not $SeedJob) { $SeedJob = $prev.seedJob }
if ($prev -and -not $AnimJob -and $prev.animationJob) { $AnimJob = $prev.animationJob }

function Call([string]$tool, $a) { (& $pixellab -Tool $tool -ArgumentsJson ($a | ConvertTo-Json -Compress -Depth 6)) -join "`n" }
function JobId([string]$t) { [regex]::Match($t, 'job_id"?\s*[:=]\s*"?([0-9a-f-]{36})').Groups[1].Value }
function Wait-Image([string]$job) {
  for ($i = 0; $i -lt 120; $i++) { $r = Call 'get_image' @{ job_id = $job }; if ($r -notmatch '(?i)processing|pending|queued') { return $r }; Start-Sleep 5 }
  throw "timed out on $job"
}
function Save([string]$animJob, [int]$frames) {
  @{ skill = $Skill; seedJob = $SeedJob; animationJob = $animJob; width = $spec.width; height = $spec.height; seedPrompt = $spec.description; action = $spec.action; frames = $frames; tool = 'create_image_pro_flash + animate_image' } | ConvertTo-Json | Out-File -Encoding utf8 $log
}

if (-not $SeedJob) {
  $out = Call 'create_image_pro_flash' @{ description = $spec.description; width = $spec.width; height = $spec.height; no_background = $true; seed = $spec.seed }
  $SeedJob = JobId $out
  if (-not $SeedJob) { throw "no seed job: $out" }
  Save '' 0
  Write-Output "seed job $SeedJob"
}
$r = Wait-Image $SeedJob
$seedUrl = [regex]::Match($r, 'download:\s*(\S+)').Groups[1].Value
& (Join-Path $root 'scripts/pixellab-download.ps1') -Url $seedUrl -OutFile (Join-Path $raw 'seed.png') | Out-Null
if ($SeedOnly) { Save $AnimJob 0; Write-Output "seed saved"; return }

if (-not $AnimJob) {
  $out = Call 'animate_image' @{ first_frame_url = $seedUrl; action = $spec.action; frame_count = $spec.frames; no_background = $true; seed = $spec.animSeed }
  $AnimJob = JobId $out
  if (-not $AnimJob) { throw "no animation job: $out" }
  Save $AnimJob 0
  Write-Output "animation job $AnimJob"
}
$r = Wait-Image $AnimJob
Set-Content -Encoding utf8 (Join-Path $raw 'animation.response.txt') $r
$urls = @([regex]::Matches($r, 'https://api\.pixellab\.ai/\S+?\.png') | ForEach-Object { $_.Value } | Select-Object -Unique)
# Newer responses list "frames: N" and one download URL with ?index=0 ... ?index=N-1.
$base = [regex]::Match($r, 'download:\s*(\S+?\?index=)0').Groups[1].Value
$m = [regex]::Match($r, '(?m)^frames:\s*(\d+)'); $count = if ($m.Success) { [int]$m.Groups[1].Value } else { 0 }
if ($urls.Count -eq 0 -and $base -and $count -gt 0) { $urls = 0..($count - 1) | ForEach-Object { "$base$_" } }
$n = 0
foreach ($u in $urls) { & (Join-Path $root 'scripts/pixellab-download.ps1') -Url $u -OutFile (Join-Path $raw ("frame-{0:d2}.png" -f $n)) | Out-Null; $n++ }
Save $AnimJob $n
Write-Output "frames $n"
