# Polls queued PixelLab image jobs for head-layers-01 (each <job>-submit.json) and downloads finished PNGs to <job>-raw.png.
# Usage: powershell -File tools/rig/poll_head_jobs.ps1 job1 job2 ...   (never resubmits)
$ErrorActionPreference = 'Stop'
$d = if ($env:HEAD_DIR) { $env:HEAD_DIR } else { 'docs/design/character-v3/head-layers-01' }
$pending = [System.Collections.ArrayList]@($args)
for ($round = 0; $round -lt 30 -and $pending.Count -gt 0; $round++) {
  foreach ($job in @($pending)) {
    $id = ((Get-Content "$d/$job-submit.json" -Raw | ConvertFrom-Json).result.structuredContent.job_id)
    "{`"job_id`":`"$id`"}" | Set-Content -Encoding ascii "$d/$job-poll.json"
    powershell -NoProfile -File tools/rig/hair_pixellab.ps1 -Action call -Tool get_image -ArgumentsFile "$d/$job-poll.json" -OutputFile "$d/$job-result.json" 2>$null | Out-Null
    $t = ((Get-Content "$d/$job-result.json" -Raw | ConvertFrom-Json).result.content | Where-Object type -eq 'text').text -join "`n"
    if ($t -match 'status: completed') {
      Invoke-WebRequest "https://api.pixellab.ai/mcp/images/$id/download" -OutFile "$d/$job-raw.png" -UseBasicParsing
      "$job done"; $pending.Remove($job) | Out-Null
    } elseif ($t -notmatch 'status: (processing|queued)') { "$job FAILED: $($t.Substring(0, [Math]::Min(200, $t.Length)))"; $pending.Remove($job) | Out-Null }
  }
  if ($pending.Count -gt 0) { Start-Sleep 20 }
}
if ($pending.Count) { "still pending: $($pending -join ', ')" }
