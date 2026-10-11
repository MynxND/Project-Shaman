param([ValidateSet('inspect','submit','retrieve')][string]$Mode)
$ErrorActionPreference = 'Stop'
$stage = Join-Path $PWD 'docs/design/character-v2/body-rotation-01'
$ledgerPath = Join-Path $PWD 'docs/design/character-v2/cost-ledger.json'
$manifestPath = Join-Path $PWD 'apps/client/public/assets/character-v2/manifest.json'
$sourcePath = 'docs/design/character-v2/body-front-02/raw.png'
$sourceHash = '0ed1ddf448b70a93dc5f624617e832a0af593779b6b7257d65db39b61be35958'
function Read-Json($Path) { [System.IO.File]::ReadAllText($Path) | ConvertFrom-Json }
function Save-Json($Name, $Value) { [System.IO.File]::WriteAllText((Join-Path $stage $Name), ($Value | ConvertTo-Json -Depth 90), [System.Text.UTF8Encoding]::new($false)) }
function Set-Field($Object, $Name, $Value) { $Object | Add-Member -MemberType NoteProperty -Name $Name -Value $Value -Force }
function Require-Success($Response) { if ($Response.error -or $Response.result.isError) { throw 'Provider error: no retry permitted.' } }
if ((Get-FileHash $sourcePath -Algorithm SHA256).Hash.ToLowerInvariant() -ne $sourceHash) { throw 'Approved FRONT02 bytes changed.' }
$null = New-Item -ItemType Directory -Path $stage -Force
. ./scripts/pixellab.ps1 -Tool get_balance | Out-Null
function Call-Pixel($Name, $Arguments) { $response = Invoke-PixelRpc @{jsonrpc='2.0';id=40;method='tools/call';params=@{name=$Name;arguments=$Arguments}}; Require-Success $response; return $response }
$ledger = Read-Json $ledgerPath
$manifest = Read-Json $manifestPath
function Save-Accounting {
  Set-Field $ledger 'pendingCredits' $ledger.reserved
  Set-Field $ledger 'remainingUncommitted' ($ledger.cap - $ledger.spent - $ledger.reserved)
  [System.IO.File]::WriteAllText($ledgerPath, ($ledger | ConvertTo-Json -Depth 90), [System.Text.UTF8Encoding]::new($false))
  $manifest.budget.spent = $ledger.spent
  $manifest.budget.reserved = $ledger.reserved
  [System.IO.File]::WriteAllText($manifestPath, ($manifest | ConvertTo-Json -Depth 90), [System.Text.UTF8Encoding]::new($false))
}
if ($Mode -eq 'inspect' -or $Mode -eq 'submit') {
  $schemas = Invoke-PixelRpc @{jsonrpc='2.0';id=41;method='tools/list';params=@{}}
  Require-Success $schemas
  $selected = @($schemas.result.tools | Where-Object { $_.name -in @('create_character_pro_flash','get_pro_flash_capabilities','get_character','wait_for_jobs','get_balance') })
  Save-Json 'live-schemas.json' $selected
  $rotationSchema = $selected | Where-Object name -eq 'create_character_pro_flash'
  if ($rotationSchema.description -notmatch 'only rotations are charged' -or $rotationSchema.inputSchema.properties.n_directions.const -ne 8 -or -not $rotationSchema.inputSchema.properties.first_frame_base64) { throw 'Reuse schema does not guarantee rotation-only billing.' }
  $quote = Call-Pixel 'get_pro_flash_capabilities' @{operation='character';width=128;height=128;n_directions=8}
  Save-Json 'quote.json' $quote
  $capability = $quote.result.structuredContent
  $cost = $capability.cost.rotations
  if (-not $capability.operations.character.supports_existing_source -or $null -eq $cost -or $cost -le 0 -or $cost -gt 2 -or $ledger.spent + $ledger.reserved + $cost -gt $ledger.cap) { throw 'Missing/excessive reuse quote: STOP for approval.' }
  Save-Json 'reuse-quote.json' @{reuseFirstFrame=$true;imageCharge=0;rotationCharge=$cost;stageCap=2;provisional=$true;basis='Live capability rotations component plus live tool guarantee: first-frame reuse skips image creation. Capability endpoint has no reuse argument.'}
  $rotationSchema.description
  $rotationSchema.inputSchema.properties.PSObject.Properties | ForEach-Object { "FIELD $($_.Name): $($_.Value | ConvertTo-Json -Depth 8 -Compress)" }
  "Reuse rotation quote: $cost; current spent: $($ledger.spent)"
}
if ($Mode -eq 'submit') {
  if (Test-Path (Join-Path $stage 'submit-intent.json')) { throw 'Already attempted: NO duplicate or retry.' }
  if (-not $ledger.acceptedSpec -or $ledger.cap -ne 18 -or $ledger.spent -ne 12 -or $ledger.reserved -ne 0 -or $ledger.pendingCredits -ne 0 -or @($ledger.jobs | Where-Object stage -eq 'body-rotation-01').Count) { throw 'Accounting gate failed.' }
  $authorization = Read-Json (Join-Path $stage 'authorization.json')
  if ($authorization.maxSubmissions -ne 1 -or $authorization.maxCredits -ne 2 -or -not $authorization.frontVisualApproved) { throw 'Authorization gate failed.' }
  [System.IO.File]::Copy($ledgerPath, (Join-Path $stage 'ledger-before.json'), $false)
  [System.IO.File]::Copy($manifestPath, (Join-Path $stage 'manifest-before.json'), $false)
  $request = Read-Json (Join-Path $stage 'request.json')
  $arguments = @{}
  $request.PSObject.Properties | ForEach-Object { $arguments[$_.Name] = $_.Value }
  $arguments.first_frame_base64 = [Convert]::ToBase64String([System.IO.File]::ReadAllBytes((Join-Path $PWD $sourcePath)))
  if ($arguments.n_directions -ne 8 -or $arguments.first_frame_direction -ne 'south' -or $arguments.ContainsKey('width') -or $arguments.ContainsKey('height') -or $arguments.ContainsKey('style_image') -or $arguments.ContainsKey('style_options')) { throw 'Reference reuse shape failed.' }
  foreach ($key in $arguments.Keys) { if (-not $rotationSchema.inputSchema.properties.PSObject.Properties[$key]) { throw "Unsupported request field: $key" } }
  Save-Json 'submit-intent.json' @{stage='body-rotation-01';attemptedAt=[DateTime]::UtcNow.ToString('o');tool='create_character_pro_flash';sourcePath=$sourcePath;sourceSha256=$sourceHash;estimatedCredits=$cost;reuseFirstFrame=$true;maxSubmissions=1;requestSha256=(Get-FileHash (Join-Path $stage 'request.json')).Hash.ToLowerInvariant();transformations=@();retryAuthorized=$false}
  Set-Field $ledger 'stageAuthorizations' (@($ledger.stageAuthorizations | Where-Object { $null -ne $_ }) + @($authorization))
  $ledger.reserved += $cost
  $ledger.jobs = @($ledger.jobs) + @([pscustomobject]@{stage='body-rotation-01';tool='create_character_pro_flash';jobId=$null;characterId=$null;status='submission-intent';estimatedCredits=$cost;chargedCredits=$null})
  Save-Accounting
  Save-Json 'balance-before.json' (Call-Pixel 'get_balance' @{})
  $response = Call-Pixel 'create_character_pro_flash' $arguments
  Save-Json 'submit.json' $response
  $data = $response.result.structuredContent
  $record = $ledger.jobs | Where-Object stage -eq 'body-rotation-01'
  $record.characterId = $data.character_id
  $record.jobId = $data.job_id
  if (-not $record.characterId) { throw 'Missing character ID: retain reservation, no resubmission.' }
  $record.status = 'pending'
  Save-Accounting
  $response.result.content | Where-Object type -eq 'text' | ForEach-Object text
}
if ($Mode -eq 'retrieve') {
  $record = $ledger.jobs | Where-Object stage -eq 'body-rotation-01'
  if (-not $record.characterId -or $record.status -ne 'pending') { throw 'No pending rotation.' }
  $response = Call-Pixel 'get_character' @{character_id=$record.characterId;include_preview=$false}
  Save-Json 'result.json' $response
  $outerResponse = Invoke-WebRequest "https://api.pixellab.ai/v2/background-jobs/$($record.jobId)" -UseBasicParsing -Headers $pixelHeaders
  $outer = $outerResponse.Content | ConvertFrom-Json
  Save-Json 'outer-job.json' $outer
  if ($outer.status -eq 'completed') {
    $receipt = $outer.last_response
    if (-not $receipt.billing_charged -or $receipt.first_direction_generated -ne $false -or $receipt.billing_usage.generations -ne 2 -or @($receipt.billing_stages).Count -ne 1 -or $receipt.billing_stages[0].stage -ne 'rotations') { throw 'Unexpected billing receipt: STOP, preserve reservation.' }
    $record.chargedCredits = $receipt.billing_usage.generations
    $record.status = 'completed-awaiting-four-view-review'
    $ledger.spent += $record.chargedCredits
    $ledger.reserved -= $record.estimatedCredits
    Save-Accounting
    Save-Json 'accounting.json' @{jobId=$record.jobId;estimatedCredits=2;receiptChargedCredits=$record.chargedCredits;receiptPath='docs/design/character-v2/body-rotation-01/outer-job.json';billingStages=$receipt.billing_stages;overallSpent=$ledger.spent;reserved=$ledger.reserved;pendingCredits=$ledger.pendingCredits;remainingUncommitted=$ledger.remainingUncommitted;basis='Job-specific outer last_response billing_charged and billing_usage establish charge2. Account balance is corroboration only; unrelated pre-existing animation was active.'}
  }
  Save-Json 'balance-after.json' (Call-Pixel 'get_balance' @{})
  $response.result.content | Where-Object type -eq 'text' | ForEach-Object text
}