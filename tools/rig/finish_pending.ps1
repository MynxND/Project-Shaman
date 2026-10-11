# Current task pipeline. Wait for existing workers before starting overlapping generation sets.
$ErrorActionPreference='Stop'
throw 'Superseded: whole-body outfit generation rejected by user. Do not restart this coordinator.'
$root=Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
Set-Location $root
$python=Join-Path $env:USERPROFILE '.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe'
function Frames($body,$outfit) { (Get-ChildItem "docs/design/rig/raw/$body/$outfit" -Recurse -Filter '*.png' -ErrorAction SilentlyContinue).Count }
$started=Get-Date
# Claude's walk/cast workers have already passed north; those two submissions had no retained job or frames.
$north=Start-Job -ArgumentList $root -ScriptBlock { param($root) Set-Location $root; foreach($anim in 'walk','cast') {
 if (-not (Test-Path "docs/design/rig/raw/male/base/$anim/north/job.json")) {
  & ./tools/rig/animate_skeleton.ps1 -Body male -Outfit base -Anim $anim -Facing north | Select-Object -Last 1
 }
} }
$femaleMotion=$null; $femaleOutfit=$null; $last=-1
while(((Get-Date)-$started).TotalHours -lt 2) {
 if((Frames male base) -ge 256 -and -not $femaleMotion) {
  $femaleMotion=Start-Job -ArgumentList $root -ScriptBlock { param($root) Set-Location $root; & ./tools/rig/resume_rig.ps1 -Body female -Outfit base -Actions walk,cast }
 }
 if((Frames male bronze-ward) -ge 256 -and -not $femaleOutfit) {
  $femaleOutfit=Start-Job -ArgumentList $root -ScriptBlock { param($root) Set-Location $root; & ./tools/rig/resume_rig.ps1 -Body female -Outfit bronze-ward }
 }
 $total=(Frames male base)+(Frames male bronze-ward)+(Frames female base)+(Frames female bronze-ward)
 if($total -ne $last) {
  & $python tools/rig/build_rig_v2.py
  if($LASTEXITCODE -eq 0) {
   & $python tools/rig/verify_rig_v2.py
   if($LASTEXITCODE -eq 0) { $last=$total }
  }
 }
 if($total -ge 1024 -and $last -eq $total) {
  & $python tools/rig/verify_rig_v2.py --complete
  if($LASTEXITCODE -eq 0) { break }
 }
 Start-Sleep 30
}
foreach($job in @($north,$femaleMotion,$femaleOutfit)) { if($job) { $job | Wait-Job | Receive-Job; $job | Remove-Job } }
Write-Output "finished native frame count: $last/1024"
