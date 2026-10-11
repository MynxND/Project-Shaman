$ErrorActionPreference = 'Stop'
$destination = Join-Path $PSScriptRoot '../../docs/design/character-v2/hair-fit-front-01'
$config = [System.IO.File]::ReadAllText((Join-Path $env:USERPROFILE '.codex/config.toml'))
$section = [regex]::Match($config, '(?ms)^\[mcp_servers\.pixellab\.env\]\s*(.*?)(?=^\[|\z)').Groups[1].Value
$auth = [regex]::Match($section, 'AUTH_HEADER\s*=\s*"([^"]+)"').Groups[1].Value
if (-not $auth) { throw 'User-level PixelLab authentication unavailable' }
$headers = @{ Authorization = $auth; Accept = 'application/json, text/event-stream' }
function Invoke-FitRpc($body) {
  $response = Invoke-WebRequest 'https://api.pixellab.ai/mcp' -UseBasicParsing -Method Post -Headers $headers -ContentType 'application/json' -Body ($body | ConvertTo-Json -Depth 30 -Compress) -TimeoutSec 65
  if ($response.Headers['Mcp-Session-Id']) { $headers['Mcp-Session-Id'] = [string]$response.Headers['Mcp-Session-Id'] }
  if ($response.Content.TrimStart().StartsWith('{')) { $result = $response.Content | ConvertFrom-Json }
  else { $result = (($response.Content -split "`n" | Where-Object { $_ -like 'data:*' } | Select-Object -First 1) -replace '^data:\s*','') | ConvertFrom-Json }
  if ($result.error -or $result.result.isError) { throw 'Read-only PixelLab request failed' }
  return $result
}
$null = Invoke-FitRpc @{jsonrpc='2.0';id=1;method='initialize';params=@{protocolVersion='2024-11-05';capabilities=@{};clientInfo=@{name='shaman-v2-fit-readonly';version='1'}}}
$null = Invoke-FitRpc @{jsonrpc='2.0';method='notifications/initialized'}
$listing = Invoke-FitRpc @{jsonrpc='2.0';id=2;method='tools/list';params=@{}}
$schemas = @($listing.result.tools | Where-Object { $_.name -in @('get_pro_flash_capabilities','inpaint_image_pro_flash','create_image_pro_flash') })
$capabilitySchema = $schemas | Where-Object { $_.name -eq 'get_pro_flash_capabilities' }
if (-not $capabilitySchema.annotations.readOnlyHint -or $schemas.Count -ne 3) { throw 'Expected actual read-only capability schema and image schemas' }
$operations = @($capabilitySchema.inputSchema.properties.operation.enum)
$operation = if ($operations -contains 'inpaint') { 'inpaint' } else { 'create' }
$capabilities = Invoke-FitRpc @{jsonrpc='2.0';id=3;method='tools/call';params=@{name='get_pro_flash_capabilities';arguments=@{}}}
$quote = Invoke-FitRpc @{jsonrpc='2.0';id=4;method='tools/call';params=@{name='get_pro_flash_capabilities';arguments=@{operation=$operation;width=128;height=128}}}
$null = New-Item -ItemType Directory -Force -Path $destination
$utf8 = New-Object System.Text.UTF8Encoding($false)
foreach ($record in @(@{name='live-tool-schemas.json';value=$schemas},@{name='live-capabilities.json';value=$capabilities.result},@{name='live-quote-128.json';value=$quote.result})) {
  [System.IO.File]::WriteAllText((Join-Path $destination $record.name),($record.value | ConvertTo-Json -Depth 40),$utf8)
}
$receipt = @{recordedUtc=[DateTime]::UtcNow.ToString('o');quoteOperation=$operation;schemaInspectedBeforeCalls=$true;capabilityCalls=2;generationAttempts=0;paidSubmissions=0;creditsSpent=0;authStored=$false;budgetCap=20;budgetSpent=20;remaining=0;decision='No new numerical credit authorization. Manual head-template authoring only; no provider image submissions.'}
[System.IO.File]::WriteAllText((Join-Path $destination 'capability-receipt.json'),($receipt | ConvertTo-Json -Depth 10),$utf8)
$quote.result.content | Where-Object { $_.type -eq 'text' } | ForEach-Object { $_.text }
Write-Output 'PASS: actual schemas inspected before two free capability calls; generationAttempts0; paidSubmissions0.'