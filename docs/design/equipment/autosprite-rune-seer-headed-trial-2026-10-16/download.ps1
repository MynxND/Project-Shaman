. "$PSScriptRoot/../autosprite-rune-seer-headless-2026-10-16/mcp-client.ps1"
$autospriteJob=Get-Content "$PSScriptRoot/generation-job.json" -Raw|ConvertFrom-Json
$autospriteStatus=Invoke-AutoSpriteTool -Name get_job_status -Arguments @{jobId=$autospriteJob.jobId}
if($autospriteStatus.status -ne 'succeeded'){
  $autospriteStatus|Select-Object * -ExcludeProperty zipUrl|ConvertTo-Json -Depth 12
  return
}
$autospriteStatus|Select-Object * -ExcludeProperty zipUrl|ConvertTo-Json -Depth 12|Set-Content "$PSScriptRoot/job-complete.json" -Encoding utf8
if($autospriteStatus.zipUrl){Invoke-WebRequest -Uri $autospriteStatus.zipUrl -OutFile "$PSScriptRoot/all-directions.zip" -UseBasicParsing}
$autospriteSheets=Invoke-AutoSpriteTool -Name list_spritesheets -Arguments @{characterId=$autospriteJob.characterId;latestOnly=$true;limit=50}
$autospriteMetadata=@()
foreach($autospriteSheet in $autospriteSheets.items){
  $autospriteDirection=@('northwest','northeast','southwest','southeast','right','left','down','up')|Where-Object {$autospriteSheet.kind.EndsWith('_'+$_)}|Select-Object -First 1
  if(-not $autospriteDirection){throw ('Unrecognized sheet kind '+$autospriteSheet.kind)}
  if($autospriteSheet.status -ne 'succeeded' -and $autospriteSheet.status -ne 'ready' -and $autospriteSheet.status -ne 'completed'){Write-Output ('Sheet status '+$autospriteSheet.status)}
  if(-not $autospriteSheet.sheetUrl){throw 'Missing sheet URL'}
  Invoke-WebRequest -Uri $autospriteSheet.sheetUrl -OutFile "$PSScriptRoot/$autospriteDirection.png" -UseBasicParsing
  if($autospriteSheet.atlasUrl){Invoke-WebRequest -Uri $autospriteSheet.atlasUrl -OutFile "$PSScriptRoot/$autospriteDirection-atlas.json" -UseBasicParsing}
  $autospriteMetadata+=@{id=$autospriteSheet.id;kind=$autospriteSheet.kind;direction=$autospriteDirection;frameCount=$autospriteSheet.frameCount;frameWidth=$autospriteSheet.frameWidth;frameHeight=$autospriteSheet.frameHeight;columns=$autospriteSheet.columns;sheet=($autospriteDirection+'.png');atlas=($autospriteDirection+'-atlas.json')}
}
if($autospriteMetadata.Count -ne 8){throw ('Expected eight sheets, got '+$autospriteMetadata.Count)}
$autospriteMetadata|ConvertTo-Json -Depth 8|Set-Content "$PSScriptRoot/sheets.json" -Encoding utf8
Write-Output 'Downloaded eight native sheets and atlas metadata. Signed URLs were not stored in metadata.'

