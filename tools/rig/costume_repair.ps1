param([ValidateSet('submit','retrieve')][string]$Mode, [ValidateSet('east','north','west')][string]$View = 'east')
$ErrorActionPreference = 'Stop'
$stage = Join-Path $PWD 'docs/design/character-turnaround/costume-repair-01'
$directory = Join-Path $stage $View
. ./scripts/pixellab.ps1 -Tool get_pro_flash_capabilities -ArgumentsJson '{"operation":"inpaint","width":128,"height":128}' | Out-Null
function Save-Receipt($Name, $Receipt) { [System.IO.File]::WriteAllText((Join-Path $directory $Name), ($Receipt | ConvertTo-Json -Depth 80), [System.Text.UTF8Encoding]::new($false)) }
function Call-Pixel($Name, $Arguments) {
  $receipt = Invoke-PixelRpc @{jsonrpc='2.0';id=20;method='tools/call';params=@{name=$Name;arguments=$Arguments}}
  if ($receipt.error -or $receipt.result.isError) { throw "Provider error for $Name; no retry authorized." }
  return $receipt
}
function Save-Ledger { [System.IO.File]::WriteAllText((Join-Path $stage 'ledger.json'), ($ledger | ConvertTo-Json -Depth 60), [System.Text.UTF8Encoding]::new($false)) }
$ledger = Get-Content (Join-Path $stage 'ledger.json') -Raw | ConvertFrom-Json
if ($Mode -eq 'submit') {
  node tools/rig/costume_repair.mjs check $View
  if ($LASTEXITCODE -ne 0) { throw 'Native preflight failed; submission blocked.' }
  if (Test-Path (Join-Path $directory 'submit-intent.json')) { throw 'Submission already attempted; no retries.' }
  if ($ledger.pendingJobs.Count -gt 0) { throw 'Pending job must be resolved first.' }
  if ($View -ne 'east') {
    $previous = if ($View -eq 'north') { 'east' } else { 'north' }
    $review = Get-Content (Join-Path $stage "$previous/review.json") -Raw | ConvertFrom-Json
    if (-not $review.credibleCandidate -or $review.stop) { throw 'Previous art review did not pass.' }
  }
  $quote = Call-Pixel 'get_pro_flash_capabilities' @{operation='inpaint';width=128;height=128}
  Save-Receipt 'quote.json' $quote
  $quoteData = $quote.result.structuredContent
  $cost = $quoteData.cost.total
  if ($null -eq $cost) { throw 'Unrecognized quote shape; inspect quote.json before submission.' }
  if ($cost -gt 6 -or ($ledger.chargedCredits + $ledger.reservedCredits + $cost) -gt 18) { throw 'Quote exceeds bounded budget.' }
  $tools = Invoke-PixelRpc @{jsonrpc='2.0';id=21;method='tools/list';params=@{}}
  Save-Receipt 'live-schemas.json' @($tools.result.tools | Where-Object { $_.name -in @('inpaint_image_pro_flash','get_image','wait_for_jobs','get_balance','animate_image') })
  Save-Receipt 'balance-before.json' (Call-Pixel 'get_balance' @{})
  $request = Get-Content (Join-Path $directory 'request.json') -Raw | ConvertFrom-Json
  $arguments = @{}
  $request.arguments.PSObject.Properties | ForEach-Object { $arguments[$_.Name] = $_.Value }
  $request.inputs.PSObject.Properties | ForEach-Object {
    $encoded = [Convert]::ToBase64String([System.IO.File]::ReadAllBytes((Join-Path $directory $_.Value.file)))
    $arguments[$_.Name] = if ($_.Name -eq 'context_image') { @{base64=$encoded;usage_description='Left native target; right untouched approved FRONT costume master. No resizing or pose transfer.'} } else { $encoded }
  }
  Save-Receipt 'submit-intent.json' @{view=$View;reservedCredits=$cost;retryAuthorized=$false;attemptedAt=[DateTime]::UtcNow.ToString('o')}
  $ledger.reservedCredits += $cost
  Save-Ledger
  $submit = Call-Pixel 'inpaint_image_pro_flash' $arguments
  Save-Receipt 'submit.json' $submit
  $job = $submit.result.structuredContent
  if (-not $job.job_id) { throw 'Missing job ID; retain reservation and do not retry.' }
  $ledger.jobs += @{id=$job.job_id;view=$View;status='pending';estimatedCredits=$cost;chargedCredits=$null;imageId=$job.image_id}
  $ledger.pendingJobs += $job.job_id
  Save-Ledger
  Write-Output ($job | ConvertTo-Json -Depth 15 -Compress)
}
if ($Mode -eq 'retrieve') {
  $job = $ledger.jobs | Where-Object view -eq $View | Select-Object -First 1
  if (-not $job) { throw 'No submitted job.' }
  $wait = Call-Pixel 'wait_for_jobs' @{timeout_seconds=240}
  Save-Receipt 'wait.json' $wait
  $result = Call-Pixel 'get_image' @{job_id=$job.id}
  Save-Receipt 'result.json' $result
  Save-Receipt 'balance-after.json' (Call-Pixel 'get_balance' @{})
  if ($result.result.structuredContent.status -eq 'completed') {
    $download = $result.result.structuredContent.download_url
    if (-not $download.StartsWith('https://api.pixellab.ai/mcp/images/')) { throw 'Unexpected download origin.' }
    Invoke-WebRequest $download -UseBasicParsing -OutFile (Join-Path $directory 'raw.png')
    $charged = $result.result.structuredContent.charged_generations
    if ($null -eq $charged) { throw 'Charge receipt missing; reservation remains.' }
    $job.status = 'completed-awaiting-review'
    $job.chargedCredits = $charged
    $ledger.chargedCredits = ($ledger.jobs | Measure-Object -Property chargedCredits -Sum).Sum
    $ledger.pendingJobs = @($ledger.pendingJobs | Where-Object { $_ -ne $job.id })
    $ledger.reservedCredits = [double](($ledger.jobs | Where-Object { $_.status -eq 'pending' } | Measure-Object -Property estimatedCredits -Sum).Sum)
    Save-Ledger
    node tools/rig/costume_repair.mjs result $View
    if ($LASTEXITCODE -ne 0) { throw 'Raw artwork pixel validation failed; stop subsequent paid jobs.' }
  }
  $result.result.content | Where-Object type -eq 'text' | ForEach-Object text
  if ($result.result.structuredContent) { $result.result.structuredContent | ConvertTo-Json -Depth 20 -Compress }
}