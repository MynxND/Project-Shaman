# Read-only waiting for the existing generation coordinator, then package/review all native sets.
# Never submits PixelLab jobs. Keep visual approval pending until a person reviews the final art.
$ErrorActionPreference='Stop'
throw 'Superseded: identity-changing outfits rejected. Final coverage is not an art approval.'
$root=Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
Set-Location $root
$python=Join-Path $env:USERPROFILE '.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe'
$started=Get-Date
while(((Get-Date)-$started).TotalHours -lt 6) {
 # Check raw frames too: the generation coordinator may have stopped its packaging loop
 # while it waits for long-running workers. Never rely on a stale coverage report.
 $ready=$true
 foreach($body in 'male','female'){foreach($outfit in 'base','bronze-ward'){
  foreach($action in 'idle','walk','attack','cast'){
   $expected=if($action -eq 'idle'){4}elseif($action -eq 'cast'){12}else{8}
   foreach($facing in 'south','south-east','east','north-east','north','north-west','west','south-west'){
    if((Get-ChildItem "docs/design/rig/raw/$body/$outfit/$action/$facing" -Filter '*.png' -ErrorAction SilentlyContinue).Count -ne $expected){$ready=$false}
   }
  }
 }}
 if($ready) {
  & $python tools/rig/build_rig_v2.py
  if($LASTEXITCODE -ne 0){throw 'Final native packaging failed'}
  & $python tools/rig/verify_rig_v2.py --complete
  if($LASTEXITCODE -ne 0){throw 'Final native coverage validation failed'}
  & $python tools/rig/review_overview.py
  if($LASTEXITCODE -ne 0){throw 'Final contact sheets failed'}
  Write-Output 'Native coverage and contact sheets complete. Human visual approval remains pending.'
  exit 0
 }
 Start-Sleep 30
}
throw 'Native coverage is still incomplete; inspect saved jobs and coverage.json before recovery.'
