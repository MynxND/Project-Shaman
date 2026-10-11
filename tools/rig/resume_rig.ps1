# Resume only missing native animation sets. Existing Claude male/base workers must finish first.
param([string]$Body='male',[string]$Outfit='bronze-ward',[string[]]$Actions=@('idle','walk','attack','cast'),[ValidateRange(1,2)][int]$DirectionGroups=2)
$ErrorActionPreference='Stop'
if($Outfit -ne 'base'){throw 'Rejected whole-body outfit. Identity-preserving garment review is required; do not resume generation.'}
$root=Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
Set-Location $root
$facings='south','south-east','east','north-east','north','north-west','west','south-west'
$jobs=foreach($anim in $Actions) { foreach($group in 0..($DirectionGroups-1)) {
 $batch=@(for($i=$group;$i -lt $facings.Count;$i+=$DirectionGroups){$facings[$i]})
 Start-Job -ArgumentList $root,$Body,$Outfit,$anim,$batch -ScriptBlock {
  param($root,$body,$outfit,$anim,$facings)
  Set-Location $root
  foreach($f in $facings) {
   $expected=if($anim -eq 'idle'){4}elseif($anim -eq 'cast'){12}else{8}
   $folder="docs/design/rig/raw/$body/$outfit/$anim/$f"
   if((Get-ChildItem $folder -Filter '*.png' -ErrorAction SilentlyContinue).Count -eq $expected){continue}
   $reference=if($outfit -eq 'base'){"apps/client/public/assets/pixellab/main-$body-v1/$f.png"}else{"docs/design/rig/outfits/$outfit/$body/$f.png"}
   try { & ./tools/rig/animate_skeleton.ps1 -Body $body -Outfit $outfit -Facing $f -Anim $anim -Reference $reference | Select-Object -Last 1 }
   catch { Write-Output "FAILED $body/$outfit/$anim/${f}: $_" }
  }
 }
} }
$jobs | Wait-Job | Out-Null
$jobs | Receive-Job
$jobs | Remove-Job
