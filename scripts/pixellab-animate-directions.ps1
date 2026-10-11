# Queues a PixelLab template-based animation (mode template or skeleton-v3) one direction at a time (plans limited to 1 concurrent
# generation), keeping every direction in one animation group. Retries while a job is running.
# Example:
#   .\scripts\pixellab-animate-directions.ps1 -CharacterId <id> -Template walking-8-frames -Name walk -GroupId <group>
param(
  [Parameter(Mandatory=$true)][string]$CharacterId,
  [Parameter(Mandatory=$true)][string]$Template,
  [Parameter(Mandatory=$true)][string]$Name,
  [string]$GroupId = '',
  [string[]]$Directions = @('south','south-east','east','north-east','north','north-west','west','south-west'),
  [ValidateSet("template","skeleton-v3")][string]$Mode = "template",
  [int]$RetrySeconds = 30,
  [int]$MaxWaitMinutes = 20
)
$ErrorActionPreference = 'Stop'
$pixellab = Join-Path $PSScriptRoot 'pixellab.ps1'
foreach ($direction in $Directions) {
  $deadline = (Get-Date).AddMinutes($MaxWaitMinutes)
  while ($true) {
    $callArgs = @{ character_id = $CharacterId; template_animation_id = $Template; animation_name = $Name; directions = @($direction); mode = $Mode }
    if ($GroupId) { $callArgs.animation_group_id = $GroupId }
    try {
      $out = (& $pixellab -Tool animate_character -ArgumentsJson ($callArgs | ConvertTo-Json -Compress)) -join "`n"
      $group = [regex]::Match($out, 'group:\s*([0-9a-f-]{36})').Groups[1].Value
      if (-not $GroupId -and $group) { $GroupId = $group }
      Write-Output "queued $direction (group $GroupId)"
      break
    } catch {
      if ((Get-Date) -gt $deadline) { throw "Timed out waiting to queue $direction" }
      Write-Output "waiting to queue $direction ($($_.Exception.Message))"
      Start-Sleep $RetrySeconds
    }
  }
}
Write-Output "group: $GroupId"
