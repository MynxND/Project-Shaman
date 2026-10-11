# Downloads an authenticated PixelLab MCP file (e.g. an image job's "download" URL) to a local path.
# Auth comes from the user-level Codex config, like pixellab.ps1; nothing is printed or stored.
# Example: .\scripts\pixellab-download.ps1 -Url https://api.pixellab.ai/mcp/images/<job>/download -OutFile out.png
param(
  [Parameter(Mandatory=$true)][string]$Url,
  [Parameter(Mandatory=$true)][string]$OutFile
)
$ErrorActionPreference = 'Stop'
if ($Url -notmatch '^https://api\.pixellab\.ai/') { throw 'Only api.pixellab.ai URLs carry the PixelLab auth header.' }
$pixelConfig = [System.IO.File]::ReadAllText((Join-Path $env:USERPROFILE '.codex/config.toml'))
$pixelSection = [regex]::Match($pixelConfig, '(?ms)^\[mcp_servers\.pixellab\.env\]\s*(.*?)(?=^\[|\z)').Groups[1].Value
$pixelAuth = [regex]::Match($pixelSection, 'AUTH_HEADER\s*=\s*"([^"]+)"').Groups[1].Value
if (-not $pixelAuth) { throw 'PixelLab AUTH_HEADER is not configured in user-level Codex config.' }
Invoke-WebRequest $Url -UseBasicParsing -Headers @{ Authorization = $pixelAuth } -OutFile $OutFile -TimeoutSec 120
Write-Output "saved $OutFile"
