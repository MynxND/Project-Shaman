$ErrorActionPreference = 'Stop'
$hairStage = 'docs/design/character-v2/hair-front-pipeline-02/'
foreach ($hairId in @('wind-crop','curtain-bob','ritual-knot')) {
  $hairSubmission = Get-Content ($hairStage + $hairId + '-submit.json') -Raw | ConvertFrom-Json
  $hairJob = $hairSubmission.result.structuredContent.job_id
  if (-not $hairJob) { throw 'Submission has no job ID. Do not resubmit automatically.' }
  $hairArgs = $hairStage + $hairId + '-poll.json'
  @{ job_id=$hairJob } | ConvertTo-Json | Set-Content $hairArgs -Encoding utf8
  & (Join-Path $PSScriptRoot 'hair_pixellab.ps1') -Action call -Tool get_image -ArgumentsFile $hairArgs -OutputFile ($hairStage + $hairId + '-result.json')
  $hairResult = Get-Content ($hairStage + $hairId + '-result.json') -Raw | ConvertFrom-Json
  $hairResult.result.content | Where-Object type -eq 'text' | ForEach-Object { Write-Output ($hairId + ': ' + $_.text) }
}
