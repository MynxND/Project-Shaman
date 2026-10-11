param([ValidateSet('inspect','submit','retrieve')][string]$Mode)
$ErrorActionPreference = 'Stop'
$stage = Join-Path $PWD 'docs/design/character-v2/body-front-01'
$ledgerPath = Join-Path $PWD 'docs/design/character-v2/cost-ledger.json'
$manifestPath = Join-Path $PWD 'apps/client/public/assets/character-v2/manifest.json'
function Save-Json($Path, $Value) { [System.IO.File]::WriteAllText($Path, ($Value | ConvertTo-Json -Depth 90), [System.Text.UTF8Encoding]::new($false)) }
function Save-Evidence($Name, $Value) { Save-Json (Join-Path $stage $Name) $Value }
. ./scripts/pixellab.ps1 -Tool get_pro_flash_capabilities -ArgumentsJson '{"operation":"create","width":128,"height":128}' | Out-Null
function Call-Pixel($Name, $Arguments) {
  $response = Invoke-PixelRpc @{jsonrpc='2.0';id=30;method='tools/call';params=@{name=$Name;arguments=$Arguments}}
  return $response
}
function Require-Success($Response) {
  if ($Response.error -or $Response.result.isError) { throw 'Provider returned an error. Evidence retained; no retry authorized.' }
}
$ledger = Get-Content $ledgerPath -Raw | ConvertFrom-Json
$manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
function Save-Accounting {
  Save-Json $ledgerPath $ledger
  $manifest.budget.spent = $ledger.spent
  $manifest.budget.reserved = $ledger.reserved
  Save-Json $manifestPath $manifest
}
if ($Mode -eq 'inspect') {
  $schemas = Invoke-PixelRpc @{jsonrpc='2.0';id=31;method='tools/list';params=@{}}
  Require-Success $schemas
  $selected = @($schemas.result.tools | Where-Object { $_.name -in @('create_image_pro_flash','get_pro_flash_capabilities','get_image','wait_for_jobs','get_balance') })
  Save-Evidence 'live-schemas.json' $selected
  $quote = Call-Pixel 'get_pro_flash_capabilities' @{operation='create';width=128;height=128}
  Save-Evidence 'quote.json' $quote
  Require-Success $quote
  $balance = Call-Pixel 'get_balance' @{}
  Save-Evidence 'balance-before.json' $balance
  Require-Success $balance
  $selected | ForEach-Object { $_ | ConvertTo-Json -Depth 30 }
  $quote.result.structuredContent | ConvertTo-Json -Depth 30
  $balance.result.structuredContent | ConvertTo-Json -Depth 20
}
if ($Mode -eq 'submit') {
  if (Test-Path (Join-Path $stage 'submit-intent.json')) { throw 'Already attempted. No duplicate or retry permitted.' }
  if (-not $ledger.acceptedSpec -or $ledger.stageAuthorization.id -ne 'body-front-01' -or $ledger.jobs.Count -ne 0 -or $ledger.spent -ne 0 -or $ledger.reserved -ne 0) { throw 'Stage authorization or zero-job accounting gate failed.' }
  $quote = Call-Pixel 'get_pro_flash_capabilities' @{operation='create';width=128;height=128}
  Save-Evidence 'submit-quote.json' $quote
  Require-Success $quote
  $cost = $quote.result.structuredContent.cost.total
  if ($null -eq $cost -or $cost -le 0 -or $cost -gt 6 -or $cost -gt $ledger.stageAuthorization.maxCredits -or $ledger.spent + $ledger.reserved + $cost -gt 18) { throw 'Missing or excessive live quote. No submission.' }
  $schemas = Get-Content (Join-Path $stage 'live-schemas.json') -Raw | ConvertFrom-Json
  $schema = $schemas | Where-Object name -eq 'create_image_pro_flash'
  if (-not $schema.inputSchema.properties.style_image) { throw 'Live schema does not support owned style reference.' }
  $request = Get-Content (Join-Path $stage 'request.json') -Raw | ConvertFrom-Json
  $arguments = @{}
  $request.arguments.PSObject.Properties | ForEach-Object { $arguments[$_.Name] = $_.Value }
  $arguments.style_image = @{base64=[Convert]::ToBase64String([System.IO.File]::ReadAllBytes((Join-Path $PWD $request.referencePath)));usage_description=$request.styleUsage}
  $referenceHash = (Get-FileHash (Join-Path $PWD $request.referencePath) -Algorithm SHA256).Hash.ToLowerInvariant()
  Save-Evidence 'submit-intent.json' @{tool=$request.tool;attemptedAt=[DateTime]::UtcNow.ToString('o');estimatedCredits=$cost;referencePath=$request.referencePath;referenceSha256=$referenceHash;retryAuthorized=$false;rotationAuthorized=$false;argumentsEvidence='request.json + exact hashed owned reference';requestSha256=(Get-FileHash (Join-Path $stage 'request.json') -Algorithm SHA256).Hash.ToLowerInvariant()}
  $ledger.reserved = $cost
  $ledger.jobs = @(@{stage='body-front-01';tool=$request.tool;jobId=$null;imageId=$null;status='submission-intent';estimatedCredits=$cost;chargedCredits=$null})
  Save-Accounting
  $submit = Call-Pixel $request.tool $arguments
  Save-Evidence 'submit.json' $submit
  Require-Success $submit
  $job = $submit.result.structuredContent
  if (-not $job.job_id) { throw 'No job ID. Reservation retained, no resubmission.' }
  $ledger.jobs[0].jobId = $job.job_id
  $ledger.jobs[0].imageId = $job.image_id
  $ledger.jobs[0].status = 'pending'
  Save-Accounting
  $job | ConvertTo-Json -Depth 20
}
if ($Mode -eq 'retrieve') {
  $job = $ledger.jobs[0]
  if (-not $job.jobId -or $job.status -ne 'pending') { throw 'No pending submitted FRONT job.' }
  $wait = Call-Pixel 'wait_for_jobs' @{timeout_seconds=240}
  Save-Evidence 'wait.json' $wait
  Require-Success $wait
  $result = Call-Pixel 'get_image' @{job_id=$job.jobId}
  Save-Evidence 'result.json' $result
  $balance = Call-Pixel 'get_balance' @{}
  Save-Evidence 'balance-after.json' $balance
  Require-Success $result
  $data = $result.result.structuredContent
  if ($data.status -eq 'completed') {
    if (-not $data.download_url.StartsWith('https://api.pixellab.ai/mcp/images/')) { throw 'Unexpected PNG origin.' }
    Invoke-WebRequest $data.download_url -UseBasicParsing -OutFile (Join-Path $stage 'raw.png')
    $job.status = 'completed-awaiting-review'
    if ($null -ne $data.charged_generations) {
      $job.chargedCredits = $data.charged_generations
      $ledger.spent = $data.charged_generations
      $ledger.reserved = 0
    } else { $job.status = 'completed-charge-unconfirmed' }
    Save-Accounting
  }
  $data | ConvertTo-Json -Depth 30
}