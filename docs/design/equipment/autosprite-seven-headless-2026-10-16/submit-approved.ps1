. "$PSScriptRoot/../autosprite-rune-seer-headless-2026-10-16/mcp-client.ps1"
$batchPlan=Get-Content "$PSScriptRoot/plan.json" -Raw|ConvertFrom-Json
if($batchPlan.approvedCreditBudget -ne 105){throw 'This batch needs explicit 105-credit user approval.'}
foreach($batchItem in $batchPlan.items){
  $batchFolder=Join-Path $PSScriptRoot $batchItem.id
  if(Test-Path "$batchFolder/generation-request.json"){Write-Output ($batchItem.id+': existing request retained; not resubmitted');continue}
  $batchImage='data:image/png;base64,'+[Convert]::ToBase64String([IO.File]::ReadAllBytes("$batchFolder/input.png"))
  $batchUpload=Invoke-AutoSpriteTool -Name upload_character -Arguments @{name=($batchItem.name+' - User Headless Unarmed');imageUrl=$batchImage;isHumanoid=$true}
  @{id=$batchUpload.character.id;name=$batchUpload.character.name;source='input.png';uploadCredits=0}|ConvertTo-Json|Set-Content "$batchFolder/character.json" -Encoding utf8
  $batchArgs=@{characterId=$batchUpload.character.id;action='custom';name='Headless Unarmed Walk';loop=$true;frameCount=56;frameSize=256;prompt=$batchPlan.prompt;idempotencyKey=('seven-'+$batchItem.id+'-'+[guid]::NewGuid().ToString())}
  $batchArgs|ConvertTo-Json -Depth 8|Set-Content "$batchFolder/generation-request.json" -Encoding utf8
  $batchJob=Invoke-AutoSpriteTool -Name generate_isometric_pack -Arguments $batchArgs
  $batchJob|ConvertTo-Json -Depth 12|Set-Content "$batchFolder/generation-job.json" -Encoding utf8
  Write-Output ($batchItem.id+': '+$batchJob.status+'; charged '+$batchJob.usage.creditsUsed+'; remaining '+$batchJob.usage.creditsRemaining)
}
