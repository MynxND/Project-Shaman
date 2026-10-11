param([ValidateSet('inspect','submit','retrieve')][string]$Mode)
$ErrorActionPreference = 'Stop'
$stage = Join-Path $PWD 'docs/design/character-v2/body-front-02'
$ledgerPath = Join-Path $PWD 'docs/design/character-v2/cost-ledger.json'
$manifestPath = Join-Path $PWD 'apps/client/public/assets/character-v2/manifest.json'
function Read-Json($Path) { return [System.IO.File]::ReadAllText($Path) | ConvertFrom-Json }
function Save-Json($Path, $Value) { [System.IO.File]::WriteAllText($Path, ($Value | ConvertTo-Json -Depth 90), [System.Text.UTF8Encoding]::new($false)) }
function Save-Evidence($Name, $Value) { Save-Json (Join-Path $stage $Name) $Value }
function Set-Field($Object, $Name, $Value) { $Object | Add-Member -MemberType NoteProperty -Name $Name -Value $Value -Force }
. ./scripts/pixellab.ps1 -Tool get_pro_flash_capabilities -ArgumentsJson '{"operation":"create","width":128,"height":128}' | Out-Null
function Call-Pixel($Name, $Arguments) { return Invoke-PixelRpc @{jsonrpc='2.0';id=40;method='tools/call';params=@{name=$Name;arguments=$Arguments}} }
function Require-Success($Response) { if ($Response.error -or $Response.result.isError) { throw 'Provider error; retained evidence, NO retry.' } }
$ledger = Read-Json $ledgerPath
$manifest = Read-Json $manifestPath
$authorization = Read-Json (Join-Path $stage 'authorization.json')
function Save-Accounting {
  Set-Field $ledger 'pendingCredits' $ledger.reserved
  Set-Field $ledger 'remainingUncommitted' ($ledger.cap - $ledger.spent - $ledger.reserved)
  Save-Json $ledgerPath $ledger
  $manifest.budget.spent = $ledger.spent
  $manifest.budget.reserved = $ledger.reserved
  Save-Json $manifestPath $manifest
}
if ($Mode -eq 'inspect') {
  $schemas = Invoke-PixelRpc @{jsonrpc='2.0';id=41;method='tools/list';params=@{}}
  Require-Success $schemas
  $selected = @($schemas.result.tools | Where-Object { $_.name -in @('create_image_pro_flash','get_pro_flash_capabilities','get_image','wait_for_jobs','get_balance') })
  Save-Evidence 'live-schemas.json' $selected
  $quote = Call-Pixel 'get_pro_flash_capabilities' @{operation='create';width=128;height=128}
  Save-Evidence 'quote.json' $quote
  Require-Success $quote
  $balance = Call-Pixel 'get_balance' @{}
  Save-Evidence 'balance-before.json' $balance
  Require-Success $balance
  $selected | Where-Object name -eq 'create_image_pro_flash' | ConvertTo-Json -Depth 30
  $quote.result.structuredContent | ConvertTo-Json -Depth 30
  $balance.result.structuredContent | ConvertTo-Json -Depth 20
}
if ($Mode -eq 'submit') {
  if (Test-Path (Join-Path $stage 'submit-intent.json')) { throw 'Stage already attempted; NO duplicate or retry.' }
  if (-not $ledger.acceptedSpec -or $authorization.id -ne 'body-front-02' -or $authorization.maxSubmissions -ne 1 -or $ledger.cap -ne 18 -or $ledger.reserved -ne 0 -or $ledger.pendingCredits -ne 0 -or @($ledger.jobs | Where-Object stage -eq 'body-front-02').Count) { throw 'Authorization/accounting gate failed.' }
  if (@($ledger.jobs | Where-Object { $null -eq $_.chargedCredits }).Count) { throw 'Unconfirmed earlier charge; STOP.' }
  $quote = Call-Pixel 'get_pro_flash_capabilities' @{operation='create';width=128;height=128}
  Save-Evidence 'submit-quote.json' $quote
  Require-Success $quote
  $cost = $quote.result.structuredContent.cost.total
  if ($null -eq $cost -or $cost -le 0 -or $cost -gt 6 -or $cost -gt $authorization.maxCredits -or $ledger.spent + $ledger.reserved + $cost -gt $ledger.cap) { throw 'Missing/excessive quote; NO submission.' }
  $schemas = Read-Json (Join-Path $stage 'live-schemas.json')
  $schema = $schemas | Where-Object name -eq 'create_image_pro_flash'
  $request = Read-Json (Join-Path $stage 'request.json')
  if (-not $schema.inputSchema.properties.style_image -or $request.arguments.description.Length -gt $schema.inputSchema.properties.description.maxLength) { throw 'Live schema mismatch.' }
  [System.IO.File]::Copy($ledgerPath, (Join-Path $stage 'ledger-before.json'), $false)
  [System.IO.File]::Copy($manifestPath, (Join-Path $stage 'manifest-before.json'), $false)
  $arguments = @{}
  $request.arguments.PSObject.Properties | ForEach-Object { $arguments[$_.Name] = $_.Value }
  $arguments.style_image = @{base64=[Convert]::ToBase64String([System.IO.File]::ReadAllBytes((Join-Path $PWD $request.referencePath)));usage_description=$request.styleUsage}
  Save-Evidence 'submit-intent.json' @{stage=$authorization.id;tool=$request.tool;attemptedAt=[DateTime]::UtcNow.ToString('o');estimatedCredits=$cost;referencePath=$request.referencePath;referenceSha256=(Get-FileHash (Join-Path $PWD $request.referencePath) -Algorithm SHA256).Hash.ToLowerInvariant();requestSha256=(Get-FileHash (Join-Path $stage 'request.json') -Algorithm SHA256).Hash.ToLowerInvariant();retryAuthorized=$false;rotationAuthorized=$false}
  Set-Field $ledger 'stageAuthorizations' (@($ledger.stageAuthorizations | Where-Object { $null -ne $_ }) + @($authorization))
  $ledger.reserved += $cost
  $ledger.jobs = @($ledger.jobs) + @([pscustomobject]@{stage=$authorization.id;tool=$request.tool;jobId=$null;imageId=$null;status='submission-intent';estimatedCredits=$cost;chargedCredits=$null})
  Save-Accounting
  $submit = Call-Pixel $request.tool $arguments
  Save-Evidence 'submit.json' $submit
  Require-Success $submit
  $job = $submit.result.structuredContent
  if (-not $job.job_id) { throw 'Missing job ID; reservation retained, NO resubmission.' }
  $record = $ledger.jobs | Where-Object stage -eq 'body-front-02'
  $record.jobId = $job.job_id
  $record.imageId = $job.image_id
  $record.status = 'pending'
  Save-Accounting
  $job | ConvertTo-Json -Depth 20
}
if ($Mode -eq 'retrieve') {
  $job = $ledger.jobs | Where-Object stage -eq 'body-front-02'
  if (-not $job.jobId -or $job.status -ne 'pending') { throw 'No pending FRONT02 job.' }
  $result = Call-Pixel 'get_image' @{job_id=$job.jobId}
  Save-Evidence 'result.json' $result
  Require-Success $result
  $data = $result.result.structuredContent
  if ($data.status -eq 'completed') {
    if (-not $data.download_url.StartsWith('https://api.pixellab.ai/mcp/images/')) { throw 'Unexpected PNG origin.' }
    Invoke-WebRequest $data.download_url -UseBasicParsing -OutFile (Join-Path $stage 'raw.png')
    $job.status = 'completed-charge-unconfirmed'
    if ($null -ne $data.charged_generations) {
      $job.chargedCredits = $data.charged_generations
      $ledger.spent += $data.charged_generations
      $ledger.reserved -= $job.estimatedCredits
      $job.status = 'completed-awaiting-review'
    }
    Save-Accounting
    $balance = Call-Pixel 'get_balance' @{}
    Save-Evidence 'balance-after.json' $balance
    Require-Success $balance
  }
  $data | ConvertTo-Json -Depth 30
}