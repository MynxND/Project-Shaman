. "$PSScriptRoot/../autosprite-rune-seer-headless-2026-10-16/mcp-client.ps1"
$batchPlan=Get-Content "$PSScriptRoot/plan.json" -Raw|ConvertFrom-Json
foreach($batchItem in $batchPlan.items){
  $batchFolder=Join-Path $PSScriptRoot $batchItem.id
  if(Test-Path "$batchFolder/sheets.json"){Write-Output ($batchItem.id+': already downloaded');continue}
  if(-not(Test-Path "$batchFolder/generation-job.json")){Write-Output ($batchItem.id+': no accepted generation job');continue}
  $batchJob=Get-Content "$batchFolder/generation-job.json" -Raw|ConvertFrom-Json
  $batchStatus=Invoke-AutoSpriteTool -Name get_job_status -Arguments @{jobId=$batchJob.jobId}
  if($batchStatus.status -ne 'succeeded'){Write-Output ($batchItem.id+': '+$batchStatus.status);continue}
  $batchStatus|Select-Object * -ExcludeProperty zipUrl|ConvertTo-Json -Depth 12|Set-Content "$batchFolder/job-complete.json" -Encoding utf8
  if($batchStatus.zipUrl -and -not(Test-Path "$batchFolder/all-directions.zip")) {Invoke-WebRequest -Uri $batchStatus.zipUrl -OutFile "$batchFolder/all-directions.zip" -UseBasicParsing}
  $batchSheets=Invoke-AutoSpriteTool -Name list_spritesheets -Arguments @{characterId=$batchJob.characterId;latestOnly=$true;limit=50}
  $batchMetadata=@()
  foreach($batchSheet in $batchSheets.items){
    $batchDirection=@('northwest','northeast','southwest','southeast','right','left','down','up')|Where-Object {$batchSheet.kind.EndsWith('_'+$_)}|Select-Object -First 1
    if(-not $batchDirection){throw ('Unrecognized direction '+$batchSheet.kind)}
    foreach($batchAsset in @(@{url=$batchSheet.sheetUrl;file=($batchDirection+'.png')},@{url=$batchSheet.atlasUrl;file=($batchDirection+'-atlas.json')})){
      if(-not $batchAsset.url){throw 'Missing download URL'}
      $batchTarget=Join-Path $batchFolder $batchAsset.file
      if(-not(Test-Path $batchTarget)){Invoke-WebRequest -Uri $batchAsset.url -OutFile ($batchTarget+'.download') -UseBasicParsing;Move-Item -LiteralPath ($batchTarget+'.download') -Destination $batchTarget}
    }
    $batchMetadata+=@{id=$batchSheet.id;kind=$batchSheet.kind;direction=$batchDirection;frameCount=$batchSheet.frameCount;frameWidth=$batchSheet.frameWidth;frameHeight=$batchSheet.frameHeight;columns=$batchSheet.columns;sheet=($batchDirection+'.png');atlas=($batchDirection+'-atlas.json')}
  }
  if($batchMetadata.Count -ne 8){throw ('Expected eight sheets for '+$batchItem.id)}
  $batchMetadata|ConvertTo-Json -Depth 8|Set-Content "$batchFolder/sheets.json" -Encoding utf8
  Write-Output ($batchItem.id+': downloaded 8 directions')
}
