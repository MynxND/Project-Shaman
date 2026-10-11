param(
  [Parameter(Mandatory=$true)][ValidateSet('list','call')][string]$Action,
  [string]$Tool,
  [string]$ArgumentsFile,
  [Parameter(Mandatory=$true)][string]$OutputFile
)
$ErrorActionPreference = 'Stop'
$config = [System.IO.File]::ReadAllText((Join-Path $env:USERPROFILE '.codex/config.toml'))
$section = [regex]::Match($config, '(?ms)^\[mcp_servers\.pixellab\.env\]\s*(.*?)(?=^\[|\z)').Groups[1].Value
$auth = [regex]::Match($section, 'AUTH_HEADER\s*=\s*"([^"]+)"').Groups[1].Value
if (-not $auth) { throw 'User-level PixelLab authentication is unavailable.' }
$headers = @{ Authorization=$auth; Accept='application/json, text/event-stream' }
function Invoke-Rpc($body) {
  $response = Invoke-WebRequest 'https://api.pixellab.ai/mcp' -UseBasicParsing -Method Post -Headers $headers -ContentType 'application/json' -Body ($body | ConvertTo-Json -Depth 50 -Compress) -TimeoutSec 120
  if ($response.Headers['Mcp-Session-Id']) { $headers['Mcp-Session-Id'] = [string]$response.Headers['Mcp-Session-Id'] }
  if (-not $body.ContainsKey('id')) { return $null }
  if ($response.Content.TrimStart().StartsWith('{')) { return $response.Content | ConvertFrom-Json }
  $data = ($response.Content -split "`n" | Where-Object { $_ -like 'data:*' } | Select-Object -First 1) -replace '^data:\s*',''
  if (-not $data) { throw 'No JSON RPC response received.' }
  return $data | ConvertFrom-Json
}
$null = Invoke-Rpc @{jsonrpc='2.0';id=1;method='initialize';params=@{protocolVersion='2024-11-05';capabilities=@{};clientInfo=@{name='shaman-hair-collection';version='1'}}}
$null = Invoke-Rpc @{jsonrpc='2.0';method='notifications/initialized'}
if ($Action -eq 'list') {
  $result = Invoke-Rpc @{jsonrpc='2.0';id=2;method='tools/list';params=@{}}
} else {
  $arguments = if ($ArgumentsFile) { [System.IO.File]::ReadAllText((Resolve-Path $ArgumentsFile)) | ConvertFrom-Json } else { @{} }
  $result = Invoke-Rpc @{jsonrpc='2.0';id=2;method='tools/call';params=@{name=$Tool;arguments=$arguments}}
}
$absolute = [System.IO.Path]::GetFullPath($OutputFile)
$null = [System.IO.Directory]::CreateDirectory([System.IO.Path]::GetDirectoryName($absolute))
[System.IO.File]::WriteAllText($absolute, ($result | ConvertTo-Json -Depth 70), (New-Object System.Text.UTF8Encoding($false)))
if ($result.error) { throw ($result.error | ConvertTo-Json -Compress) }
if ($result.result.isError) { throw 'PixelLab returned an error; sanitized response archived.' }
if ($Action -eq 'list') { $result.result.tools | Select-Object name | Format-Table }
else { $result.result.structuredContent | ConvertTo-Json -Depth 12 }