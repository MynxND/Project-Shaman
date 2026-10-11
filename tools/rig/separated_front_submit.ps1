param([Parameter(Mandatory=$true)][ValidateSet('body','head-a','head-b')][string]$Component)
$ErrorActionPreference='Stop'
$taskDir='docs/design/character-v3/separated-front-01'
$taskLedgerPath=Join-Path $taskDir 'ledger.json'
$taskLedger=Get-Content -LiteralPath $taskLedgerPath -Raw | ConvertFrom-Json
if(@($taskLedger.attempts | Where-Object {$_.component -eq $Component}).Count){throw 'One attempt already recorded. No retry.'}
if($taskLedger.spent+$taskLedger.reserved+5 -gt 15){throw 'Cap exceeded.'}
$taskLedger.reserved+=5
$taskLedger.attempts=@($taskLedger.attempts)+@(@{component=$Component;reserved=5;status='intent-recorded';retry=$false})
$taskLedger | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath $taskLedgerPath -Encoding utf8
& powershell -NoProfile -File tools/rig/hair_pixellab.ps1 -Action call -Tool create_image_pro_flash -ArgumentsFile "$taskDir/$Component-request.json" -OutputFile "$taskDir/$Component-submit.json"
if($LASTEXITCODE -ne 0){throw 'Ambiguous/error response retained; no automatic retry.'}
