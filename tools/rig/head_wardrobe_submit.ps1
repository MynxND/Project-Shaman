param([Parameter(Mandatory=$true)][string]$Style,[Parameter(Mandatory=$true)][ValidateSet('front','rotation')][string]$Stage)
$ErrorActionPreference='Stop'
$taskDirectory=Join-Path (Get-Location) 'docs/design/head-wardrobe-01'
$taskLedgerPath=Join-Path $taskDirectory 'ledger.json'
$taskLedger=Get-Content -LiteralPath $taskLedgerPath -Raw | ConvertFrom-Json
$taskPlan=Get-Content -LiteralPath (Join-Path $taskDirectory 'plan.json') -Raw | ConvertFrom-Json
if ($Style -notin $taskPlan.styles.id) { throw 'Unknown style.' }
if (@($taskLedger.attempts | Where-Object { $_.style -eq $Style -and $_.stage -eq $Stage -and $_.status -ne 'rejected-concurrency' }).Count -gt 0) { throw 'An attempt already exists. No retry.' }
$taskCharge=if($Stage -eq 'front'){6}else{2}
if ($taskLedger.spent+$taskLedger.reserved+$taskCharge -gt 88) { throw 'Budget exhausted.' }
$taskRequest=Join-Path $taskDirectory "$Style-$Stage-request.json"
if (-not (Test-Path -LiteralPath $taskRequest)) { throw 'Missing prepared request.' }
$taskLedger.reserved += $taskCharge
$taskLedger.attempts=@($taskLedger.attempts)+@(@{style=$Style;stage=$Stage;reserved=$taskCharge;status='intent-recorded';retry=$false})
$taskLedger | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath $taskLedgerPath -Encoding utf8
$taskTool=if($Stage -eq 'front'){'inpaint_image_pro_flash'}else{'create_object_pro_flash'}
& powershell -NoProfile -File tools/rig/hair_pixellab.ps1 -Action call -Tool $taskTool -ArgumentsFile $taskRequest -OutputFile (Join-Path $taskDirectory "$Style-$Stage-submit.json")
if ($LASTEXITCODE -ne 0) { throw 'Submission failed or ambiguous. Reservation retained; never retry automatically.' }
$taskLedger=Get-Content -LiteralPath $taskLedgerPath -Raw | ConvertFrom-Json
$taskLedger.attempts[-1].status='submitted'
$taskLedger | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath $taskLedgerPath -Encoding utf8
Write-Output "$Style $Stage submitted; reserved $($taskLedger.reserved)/88"
