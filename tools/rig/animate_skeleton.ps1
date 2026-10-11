# Draw one rig animation (body or outfit sprite) along the shared skeletons with PixelLab animate_with_skeleton_v3.
#   .\tools\rig\animate_skeleton.ps1 -Body male -Facing east -Anim walk -Outfit base [-Reference path.png]
# Reference: the sprite to animate in its rest pose for that facing (default: the rig's idle rotation, i.e. the
# existing appearance). Keypoints come from docs/design/rig/skeletons.json (tools/rig/skeleton.py).
# Output: docs/design/rig/raw/<body>/<outfit>/<anim>/<facing>/<n>.png + job.json. No credentials stored.
param(
  [Parameter(Mandatory = $true)][ValidateSet('male', 'female')][string]$Body,
  [Parameter(Mandatory = $true)][string]$Facing,
  [Parameter(Mandatory = $true)][ValidateSet('idle', 'walk', 'attack', 'cast')][string]$Anim,
  [string]$Outfit = 'base',
  [string]$Reference = '',
  [string]$Description = '',
  [int]$Seed = 520001
)
$ErrorActionPreference = 'Stop'
if ($Outfit -ne 'base') { throw 'Outfit generation paused: whole-body redraw changed character identity. Review identity-preserving garment layers before resuming.' }
$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$pixellab = Join-Path $root 'scripts/pixellab.ps1'
$skel = Get-Content -Raw (Join-Path $root 'docs/design/rig/skeletons.json') | ConvertFrom-Json
$entry = $skel.bodies.$Body.$Facing
if (-not $Reference) { $Reference = "apps/client/public/assets/pixellab/main-$Body-v1/$Facing.png" }
$outfits = Get-Content -Raw -Encoding utf8 (Join-Path $root 'docs/design/rig/outfits.json') | ConvertFrom-Json
if (-not $Description) { $Description = $outfits.outfits.$Outfit.$Body }
$out = Join-Path $root "docs/design/rig/raw/$Body/$Outfit/$Anim/$Facing"
New-Item -ItemType Directory -Force $out | Out-Null
$req = @{
  description = $Description; action = $Anim; direction = $Facing; view = 'low top-down'; template_id = 'mannequin'; no_background = $true; seed = $Seed
  first_frame_base64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes((Join-Path $root $Reference)))
  first_frame_keypoints = @($entry.rest); keypoints = @($entry.$Anim)
}
function Call([string]$tool, $a) { (& $pixellab -Tool $tool -ArgumentsJson ($a | ConvertTo-Json -Compress -Depth 8)) -join "`n" }
$res = ''
$savedJob = Join-Path $out 'job.json'
$job = if (Test-Path $savedJob) { (Get-Content $savedJob -Raw | ConvertFrom-Json).job } else { '' }
if (-not $job) {
 for ($try = 0; $try -lt 40; $try++) { try { $res = Call 'animate_with_skeleton_v3' $req; break } catch { Write-Output "waiting to submit: $($_.Exception.Message)"; Start-Sleep 20 } }
 $job = [regex]::Match($res, 'job_id"?\s*[:=]\s*"?([0-9a-f-]{36})').Groups[1].Value
}
if (-not $job) { throw "no job: $res" }
if (-not (Test-Path $savedJob)) {
 @{ body = $Body; facing = $Facing; anim = $Anim; outfit = $Outfit; job = $job; reference = $Reference; description = $Description; seed = $Seed; frames = @($entry.$Anim).Count; cost = [regex]::Match($res, '(?i)cost[^\n]*').Value } | ConvertTo-Json | Out-File -Encoding utf8 $savedJob
}
Write-Output "using $Body/$Outfit/$Anim/$Facing job $job"
for ($i = 0; $i -lt 120; $i++) {
  $r = Call 'get_image' @{ job_id = $job }
  if ($r -notmatch '(?i)processing|pending|queued|in progress') { break }
  Start-Sleep 8
}
$url = [regex]::Match($r, 'download:\s*(\S+)').Groups[1].Value
if (-not $url) { throw "no frames: $r" }
$n = @($entry.$Anim).Count
for ($k = 0; $k -lt $n; $k++) { & (Join-Path $root 'scripts/pixellab-download.ps1') -Url ($url -replace '\?.*$', "?index=$k") -OutFile (Join-Path $out "$k.png") | Out-Null }
Write-Output "saved $n frames to $out"
