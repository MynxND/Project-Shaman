param(
  [ValidateSet('list','call')][string]$Action = 'list',
  [string]$Tool,
  [string]$ArgumentsFile,
  [Parameter(Mandatory=$true)][string]$OutputFile
)
$ErrorActionPreference = 'Stop'
$config = [System.IO.File]::ReadAllText((Join-Path $env:USERPROFILE '.codex/config.toml'))
$section = [regex]::Match($config, '(?ms)^\[mcp_servers\.pixellab\.env\]\s*(.*?)(?=^\[|\z)').Groups[1].Value
$auth = [regex]::Match($section, 'AUTH_HEADER\s*=\s*"([^"]+)"').Groups[1].Value
if (-not $auth) { throw 'PixelLab user-level authentication is unavailable.' }
$headers = @{ Authorization = $auth; Accept = 'application/json, text/event-stream' }
function Invoke-Rpc($body) {
  $response = Invoke-WebRequest 'https://api.pixellab.ai/mcp' -UseBasicParsing -Method Post -Headers $headers -ContentType 'application/json' -Body ($body | ConvertTo-Json -Depth 60 -Compress) -TimeoutSec 65
  if ($response.Headers['Mcp-Session-Id']) { $headers['Mcp-Session-Id'] = [string]$response.Headers['Mcp-Session-Id'] }
  if ($response.Content.TrimStart().StartsWith('{')) { return $response.Content | ConvertFrom-Json }
  $data = ($response.Content -split "`n" | Where-Object { $_ -like 'data:*' } | Select-Object -First 1) -replace '^data:\s*',''
  if ($data) { return $data | ConvertFrom-Json }
  if (-not $body.ContainsKey('id')) { return $null }
  throw 'PixelLab returned no RPC response.'
}
$null = Invoke-Rpc @{ jsonrpc='2.0'; id=1; method='initialize'; params=@{ protocolVersion='2024-11-05'; capabilities=@{}; clientInfo=@{name='shaman-head-proof';version='1.0'} } }
$null = Invoke-Rpc @{ jsonrpc='2.0'; method='notifications/initialized' }
if ($Action -eq 'list') {
  $result = Invoke-Rpc @{ jsonrpc='2.0'; id=2; method='tools/list'; params=@{} }
} else {
  $arguments = if ($ArgumentsFile) { Get-Content -Raw $ArgumentsFile | ConvertFrom-Json } else { @{} }
  $result = Invoke-Rpc @{ jsonrpc='2.0'; id=2; method='tools/call'; params=@{name=$Tool;arguments=$arguments} }
}
[System.IO.Directory]::CreateDirectory((Split-Path -Parent $OutputFile)) | Out-Null
[System.IO.File]::WriteAllText($OutputFile, ($result | ConvertTo-Json -Depth 80), [System.Text.UTF8Encoding]::new($false))
if ($result.error) { throw ($result.error | ConvertTo-Json -Compress) }
if ($Action -eq 'list') {
  $result.result.tools | Where-Object { $_.name -in @('inpaint_image_pro_flash','get_image','get_pro_flash_capabilities') } | ConvertTo-Json -Depth 40
} else {
  foreach ($item in $result.result.content) { if ($item.type -eq 'text') { $item.text } }
  if ($result.result.isError) { throw 'PixelLab tool returned an error; raw response archived.' }
}