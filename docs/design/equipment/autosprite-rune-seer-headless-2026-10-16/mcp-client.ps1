function Invoke-AutoSpriteTool {
  param([Parameter(Mandatory=$true)][string]$Name, [hashtable]$Arguments=@{})
  $autospriteCredential=[Environment]::GetEnvironmentVariable('AUTOSPRITE_API_KEY','User')
  if(-not $autospriteCredential){throw 'AUTOSPRITE_API_KEY is not set in the user environment'}
  $autospriteRequest=@{jsonrpc='2.0';id=1;method='tools/call';params=@{name=$Name;arguments=$Arguments}} | ConvertTo-Json -Depth 20 -Compress
  $autospriteResponse=Invoke-WebRequest -Uri 'https://www.autosprite.io/api/mcp' -Method Post -Headers @{Authorization=('Bearer '+$autospriteCredential);Accept='application/json, text/event-stream'} -ContentType 'application/json' -Body $autospriteRequest -UseBasicParsing
  $autospriteLine=($autospriteResponse.Content -split "`n"|Where-Object {$_.StartsWith('data: ')}|Select-Object -Last 1)
  if($autospriteLine){$autospriteEnvelope=$autospriteLine.Substring(6)|ConvertFrom-Json}else{$autospriteEnvelope=$autospriteResponse.Content|ConvertFrom-Json}
  if($autospriteEnvelope.error){throw ($autospriteEnvelope.error|ConvertTo-Json -Compress)}
  if($autospriteEnvelope.result.isError){throw ($autospriteEnvelope.result.content|ConvertTo-Json -Depth 8 -Compress)}
  if($autospriteEnvelope.result.structuredContent){return $autospriteEnvelope.result.structuredContent}
  return ($autospriteEnvelope.result.content|Where-Object {$_.type -eq 'text'}|Select-Object -First 1).text|ConvertFrom-Json
}
