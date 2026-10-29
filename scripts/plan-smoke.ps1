param(
  [string]$Lang = 'en',
  [string]$Text = $(if ($Lang -eq 'ar') { 'خذني إلى المكتبة' } else { 'Take me to the library' })
)

$body = @{
  text  = $Text
  lat   = 32.0134
  lng   = 35.8734
  lang  = $Lang
  constraints = @('step_free', 'avoid_stairs')
} | ConvertTo-Json -Depth 5

try {
  $response = Invoke-RestMethod -Uri 'http://localhost:8000/api/plan' `
    -Method Post -ContentType 'application/json' -Body $body -TimeoutSec 40

  Write-Host 'REPLY:' $response.reply -ForegroundColor Green
  Write-Host 'DEST: ' $response.route.destination.name
  Write-Host 'MODE: ' $response.route.provider " | CUES:" $response.route.cues.Count
  Write-Host 'PLANNER:' $response.debug.planner
  Write-Host 'TOOLS: ' (($response.debug.tool_log | ForEach-Object { $_.tool }) -join ', ')
  $response.route.cues | Select-Object id, kind, short, trigger_m | Format-Table -AutoSize
} catch {
  Write-Host 'SMOKE TEST FAILED' -ForegroundColor Red
  Write-Host $_.Exception.Message
  exit 1
}
