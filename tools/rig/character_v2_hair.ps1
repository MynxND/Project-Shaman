param([ValidateSet('inspect','submit','retrieve')][string]$Mode)
$ErrorActionPreference = 'Stop'
$stage = Join-Path $PWD 'docs/design/character-v2/hair-proof-01/paid-stage'
if ($Mode -eq 'submit' -and (Test-Path (Join-Path $stage 'submit-intent.json'))) { throw 'Already attempted: NO duplicate or retry.' }
$ledgerPath = Join-Path $PWD 'docs/design/character-v2/cost-ledger.json'
$manifestPath = Join-Path $PWD 'apps/client/public/assets/character-v2/manifest.json'
function Read-Json($Path) { [System.IO.File]::ReadAllText($Path) | ConvertFrom-Json }
function Write-Json($Path, $Value) { [System.IO.File]::WriteAllText($Path, ($Value | ConvertTo-Json -Depth 90), [System.Text.UTF8Encoding]::new($false)) }
function Save-Evidence($Name, $Value) { Write-Json (Join-Path $stage $Name) $Value }
function Set-Field($Object, $Name, $Value) { $Object | Add-Member NoteProperty $Name $Value -Force }
. ./scripts/pixellab.ps1 -Tool get_balance | Out-Null
function Call-Pixel($Name, $Arguments) {
  $response = Invoke-PixelRpc @{jsonrpc='2.0';id=50;method='tools/call';params=@{name=$Name;arguments=$Arguments}}
  if ($response.error -or $response.result.isError) { throw 'Provider error: STOP, no retry.' }
  return $response
}
$authorization = Read-Json (Join-Path $stage 'authorization.json')
$ledger = Read-Json $ledgerPath
$manifest = Read-Json $manifestPath
function Save-Accounting {
  Set-Field $ledger 'pendingCredits' $ledger.reserved
  Set-Field $ledger 'remainingUncommitted' ($ledger.cap - $ledger.spent - $ledger.reserved)
  $manifest.budget.cap = $ledger.cap
  $manifest.budget.spent = $ledger.spent
  $manifest.budget.reserved = $ledger.reserved
  Write-Json $ledgerPath $ledger
  Write-Json $manifestPath $manifest
}
if ($Mode -eq 'inspect' -or $Mode -eq 'submit') {
  $schemas = Invoke-PixelRpc @{jsonrpc='2.0';id=51;method='tools/list';params=@{}}
  if ($schemas.error) { throw 'Schema inspection failed.' }
  $selected = @($schemas.result.tools | Where-Object { $_.name -in @('inpaint_image_pro_flash','get_pro_flash_capabilities','get_image','wait_for_jobs','get_balance') })
  if (-not (Test-Path (Join-Path $stage 'live-schemas.json'))) { Save-Evidence 'live-schemas.json' $selected }
  $hairSchema = $selected | Where-Object name -eq 'inpaint_image_pro_flash'
  $quote = Call-Pixel 'get_pro_flash_capabilities' @{operation='inpaint';width=128;height=128}
  Save-Evidence 'quote.json' $quote
  $cost = $quote.result.structuredContent.cost.total
  if ($null -eq $cost -or $cost -le 0 -or $cost -gt 6 -or $cost -gt $authorization.maxCredits) { throw 'Quote exceeds authorization.' }
  if ($hairSchema.description -notmatch 'No images or masks are rescaled' -or $hairSchema.inputSchema.properties.crop_to_mask.const -ne $true -or $hairSchema.inputSchema.properties.output_method.enum -notcontains 'New layer with changes') { throw 'Live isolation schema mismatch.' }
  $hairSchema.description
  'Native128 quote: ' + $cost
}
if ($Mode -eq 'submit') {
  if (Test-Path (Join-Path $stage 'submit-intent.json')) { throw 'Already attempted: NO duplicate or retry.' }
  if ($authorization.maxSubmissions -ne 1 -or $authorization.approvedCap -ne 20 -or -not $authorization.fourViewVisualApproved -or $authorization.retryAuthorized -or $authorization.direction -ne 'south') { throw 'Authorization gate failed.' }
  if (-not $ledger.acceptedSpec -or $ledger.cap -ne 18 -or $ledger.spent -ne 14 -or $ledger.reserved -ne 0 -or $ledger.pendingCredits -ne 0 -or @($ledger.jobs | Where-Object stage -eq 'hair-proof-01').Count) { throw 'Current ledger changed: STOP for review.' }
  $preparation = Read-Json 'docs/design/character-v2/hair-proof-01/preparation.json'
  foreach ($property in $preparation.untouchedHashes.PSObject.Properties) {
    if ((Get-FileHash $property.Name -Algorithm SHA256).Hash.ToLowerInvariant() -ne $property.Value) { throw "Evidence changed: $($property.Name)" }
  }
  [System.IO.File]::Copy($ledgerPath, (Join-Path $stage 'ledger-before.json'), $false)
  [System.IO.File]::Copy($manifestPath, (Join-Path $stage 'manifest-before.json'), $false)
  $recipe = Read-Json 'docs/design/character-v2/hair-proof-01/request.json'
  $arguments = @{}
  $recipe.providerArguments.PSObject.Properties | ForEach-Object { $arguments[$_.Name] = $_.Value }
  $arguments.Remove('mask_image_url')
  $maskField = @($hairSchema.inputSchema.properties.PSObject.Properties.Name | Where-Object { $_ -match '^mask.*base64$' })
  if ($maskField.Count -ne 1) { throw 'Unsupported mask transport: no submission.' }
  $arguments[$maskField[0]] = [Convert]::ToBase64String([System.IO.File]::ReadAllBytes((Join-Path $PWD $authorization.maskPath)))
  $arguments.description = 'Isolated HAIR ONLY, a short ivory-pearl Shaman crop cap with a small asymmetrical upper-left tuft. Fit the exact owned FRONT02 bald scalp in source_image_id; native128, same alignment. Generate hair clusters ONLY in the white 374-pixel mask x48..76 y16..31. This is a conservative cap-only prototype: NO bangs or face occlusion from y32 down, no sideburns or rear tail. Varied pointed tuft silhouette and coherent strand clusters, NOT a flat helmet. Ivory-pearl material with muted gray-green shadows and warm white highlights, upper-left light; proposed ramp #686C65 #A9ADA0 #D9DCCD #F1EEDB. Binary crisp pixel alpha. Every visible returned pixel must be HAIR, never scalp/skin copied from source, face, ears, neck, body, shorts, clothing, bow, crown, shadow or text. Transparent unused mask pixels and everything outside mask. Return New layer with changes ONLY, NOT a composite. Context is owned new V2 scalp and pose reference only; do not bake context into the layer. No rotation or animation.'
  foreach ($key in $arguments.Keys) { if (-not $hairSchema.inputSchema.properties.PSObject.Properties[$key]) { throw "Unsupported field: $key" } }
  $recorded = @{}
  foreach ($key in $arguments.Keys) { if ($key -ne $maskField[0]) { $recorded[$key] = $arguments[$key] } }
  Save-Evidence 'request.json' @{tool='inpaint_image_pro_flash';arguments=$recorded;maskTransport=@{field=$maskField[0];path=$authorization.maskPath;sha256=(Get-FileHash $authorization.maskPath).Hash.ToLowerInvariant()};sourceSha256=$authorization.sourceSha256;transformations=@();outputCount=1}
  Save-Evidence 'balance-before.json' (Call-Pixel 'get_balance' @{})
  Save-Evidence 'submit-intent.json' @{stage='hair-proof-01';attemptedAt=[DateTime]::UtcNow.ToString('o');tool='inpaint_image_pro_flash';estimatedCredits=$cost;maxSubmissions=1;retryAuthorized=$false;requestSha256=(Get-FileHash (Join-Path $stage 'request.json')).Hash.ToLowerInvariant()}
  $ledger.cap = 20
  Set-Field $ledger 'stageAuthorizations' (@($ledger.stageAuthorizations | Where-Object { $null -ne $_ }) + @($authorization))
  Set-Field $ledger 'bodyFourViewApproval' $authorization
  $manifest.assets | Where-Object layer -eq 'body' | ForEach-Object { $_.visualApproved = $true }
  Set-Field $manifest 'bodyFourViewApproval' $authorization
  Set-Field $manifest.budget 'capAuthority' @{stageId='hair-proof-01';previousCap=18;approvedCap=20;maxCredits=6;maxSubmissions=1;decisionPath='docs/design/character-v2/hair-proof-01/paid-stage/authorization.json'}
  $ledger.reserved = $cost
  $ledger.jobs = @($ledger.jobs) + @([pscustomobject]@{stage='hair-proof-01';tool='inpaint_image_pro_flash';jobId=$null;imageId=$null;status='submission-intent';estimatedCredits=$cost;chargedCredits=$null})
  Save-Accounting
  $submit = Call-Pixel 'inpaint_image_pro_flash' $arguments
  Save-Evidence 'submit.json' $submit
  $data = $submit.result.structuredContent
  $job = $ledger.jobs | Where-Object stage -eq 'hair-proof-01'
  $job.jobId = $data.job_id
  $job.imageId = $data.image_id
  if (-not $job.jobId) { throw 'Missing job ID: retain reservation, never resubmit.' }
  $job.status = 'pending'
  Save-Accounting
  $data | ConvertTo-Json -Depth 10
}
if ($Mode -eq 'retrieve') {
  $job = $ledger.jobs | Where-Object stage -eq 'hair-proof-01'
  if (-not $job.jobId -or $job.status -ne 'pending') { throw 'No pending hair job.' }
  Save-Evidence 'wait.json' (Call-Pixel 'wait_for_jobs' @{timeout_seconds=240})
  $response = Call-Pixel 'get_image' @{job_id=$job.jobId}
  Save-Evidence 'result.json' $response
  $data = $response.result.structuredContent
  if ($data.status -eq 'completed') {
    if (-not $data.download_url.StartsWith('https://api.pixellab.ai/mcp/images/')) { throw 'Unexpected PNG origin.' }
    if (Test-Path (Join-Path $stage 'raw.png')) { throw 'Raw already exists; no overwrite.' }
    Invoke-WebRequest $data.download_url -UseBasicParsing -OutFile (Join-Path $stage 'raw.png')
    if ($null -eq $data.charged_generations) { throw 'No charged receipt: reservation retained.' }
    $job.chargedCredits = $data.charged_generations
    $ledger.spent += $job.chargedCredits
    $ledger.reserved -= $job.estimatedCredits
    $job.status = 'completed-awaiting-isolation-review'
    Save-Accounting
    Save-Evidence 'balance-after.json' (Call-Pixel 'get_balance' @{})
    Save-Evidence 'accounting.json' @{jobId=$job.jobId;estimatedCredits=$job.estimatedCredits;receiptChargedCredits=$job.chargedCredits;receiptPath='docs/design/character-v2/hair-proof-01/paid-stage/result.json';overallSpent=$ledger.spent;cap=$ledger.cap;reserved=$ledger.reserved;pendingCredits=$ledger.pendingCredits;remainingUncommitted=$ledger.remainingUncommitted;basis='Job-specific charged_generations; balance is corroboration only.'}
  }
  $data | Select-Object status,job_id,image_id,width,height,charged_generations,download_url | ConvertTo-Json -Depth 10
}