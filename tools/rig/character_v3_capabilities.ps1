$ErrorActionPreference = 'Stop'
$destination = Join-Path $PSScriptRoot '../../docs/design/character-v3/proportion-front-01'
$null = New-Item -ItemType Directory -Force -Path $destination
. (Join-Path $PSScriptRoot '../../scripts/pixellab.ps1') -Tool get_pro_flash_capabilities -ArgumentsJson '{}' | Out-Null
$listing = Invoke-PixelRpc @{ jsonrpc='2.0'; id=31; method='tools/list'; params=@{} }
if ($listing.error) { throw 'Read-only tools/list failed' }
$names = @('get_pro_flash_capabilities','create_image_pro_flash','create_character_pro_flash')
$schemas = @($listing.result.tools | Where-Object { $_.name -in $names })
if ($schemas.Count -ne 3) { throw 'Expected all three actual live schemas' }
$capabilitySchema = $schemas | Where-Object { $_.name -eq 'get_pro_flash_capabilities' }
if (-not $capabilitySchema.annotations.readOnlyHint) { throw 'Capabilities is not declared read-only' }
$capabilities = Invoke-PixelRpc @{jsonrpc='2.0';id=32;method='tools/call';params=@{name='get_pro_flash_capabilities';arguments=@{}}}
$quote = Invoke-PixelRpc @{jsonrpc='2.0';id=33;method='tools/call';params=@{name='get_pro_flash_capabilities';arguments=@{operation='create';width=128;height=128}}}
if ($capabilities.error -or $quote.error -or $capabilities.result.isError -or $quote.result.isError) { throw 'Read-only capability/quote failed' }
$utf8 = New-Object System.Text.UTF8Encoding($false)
foreach ($record in @(@{name='live-tool-schemas.json';value=$schemas},@{name='live-capabilities.json';value=$capabilities.result},@{name='live-quote-128.json';value=$quote.result})) {
  [System.IO.File]::WriteAllText((Join-Path $destination $record.name),($record.value | ConvertTo-Json -Depth 40),$utf8)
}
$receipt = @{
  recordedUtc=[DateTime]::UtcNow.ToString('o'); endpoint='https://api.pixellab.ai/mcp';
  methods=@('initialize','notifications/initialized','tools/list','tools/call:get_pro_flash_capabilities');
  submittedGenerationTools=@(); paidCalls=0; chargedCredits=0;
  provisionalQuoteOnly=$true; authStored=$false;
  decision='Original manual V3 authoring. Independent provider jobs do not guarantee identical face pixels. V2 budget20/spent20; V3 paid budget unapproved.'
}
[System.IO.File]::WriteAllText((Join-Path $destination 'capability-receipt.json'),($receipt | ConvertTo-Json -Depth 10),$utf8)
Write-Output 'PASS: live tools/list and free capabilities/quote archived; paidCalls0; no credentials recorded.'
$quote.result.content | Where-Object { $_.type -eq 'text' } | ForEach-Object { $_.text }