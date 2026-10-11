param(
  [Parameter(Mandatory=$true)][string]$Tool,
  [string]$ArgumentsJson = '{}'
)
$ErrorActionPreference = 'Stop'
$pixelConfigPath = Join-Path $env:USERPROFILE '.codex/config.toml'
$pixelConfig = [System.IO.File]::ReadAllText($pixelConfigPath)
$pixelSection = [regex]::Match($pixelConfig, '(?ms)^\[mcp_servers\.pixellab\.env\]\s*(.*?)(?=^\[|\z)').Groups[1].Value
$pixelAuth = [regex]::Match($pixelSection, 'AUTH_HEADER\s*=\s*"([^"]+)"').Groups[1].Value
if (-not $pixelAuth) { throw 'PixelLab AUTH_HEADER is not configured in user-level Codex config.' }
$pixelHeaders = @{ Authorization = $pixelAuth; Accept = 'application/json, text/event-stream' }
function Invoke-PixelRpc($rpcBody) {
  $response = Invoke-WebRequest 'https://api.pixellab.ai/mcp' -UseBasicParsing -Method Post -Headers $pixelHeaders -ContentType 'application/json' -Body ($rpcBody | ConvertTo-Json -Depth 30 -Compress) -TimeoutSec 65
  if ($response.Headers['Mcp-Session-Id']) { $pixelHeaders['Mcp-Session-Id'] = [string]$response.Headers['Mcp-Session-Id'] }
  if ($response.Content.TrimStart().StartsWith('{')) { return $response.Content | ConvertFrom-Json }
  $data = ($response.Content -split "`n" | Where-Object { $_ -like 'data:*' } | Select-Object -First 1) -replace '^data:\s*',''
  if ($data) { return $data | ConvertFrom-Json }
}
$null = Invoke-PixelRpc @{ jsonrpc='2.0'; id=1; method='initialize'; params=@{ protocolVersion='2024-11-05'; capabilities=@{}; clientInfo=@{name='project-shaman';version='0.1'} } }
$null = Invoke-PixelRpc @{ jsonrpc='2.0'; method='notifications/initialized' }
$result = Invoke-PixelRpc @{ jsonrpc='2.0'; id=2; method='tools/call'; params=@{name=$Tool;arguments=($ArgumentsJson | ConvertFrom-Json)} }
if ($result.error) { throw ($result.error | ConvertTo-Json -Compress) }
foreach ($item in $result.result.content) { if ($item.type -eq 'text') { $item.text } }
if ($result.result.isError) { throw 'PixelLab tool returned an error; see message above.' }
