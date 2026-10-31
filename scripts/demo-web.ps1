param(
  [switch]$SkipBuild
)

$root = Split-Path -Parent $PSScriptRoot
$mobile = Join-Path $root 'apps\mobile'
$python = Join-Path $root 'services\api\.venv\Scripts\python.exe'

if (-not $SkipBuild) {
  Write-Host 'Building the web demo ...' -ForegroundColor Cyan
  Push-Location $mobile
  npx expo export --platform web
  Pop-Location
}

if (-not (Test-Path $python)) {
  Write-Host "Python not found at $python" -ForegroundColor Red
  exit 1
}

$lanIp = Get-NetIPConfiguration |
  Where-Object { $_.IPv4DefaultGateway -ne $null } |
  ForEach-Object { $_.IPv4Address.IPAddress } |
  Where-Object { $_ -notlike '169.254.*' } |
  Select-Object -First 1

$hostIp = if ($lanIp) { $lanIp } else { 'localhost' }
Write-Host ''
Write-Host "Wasel web demo: http://$($hostIp):3000" -ForegroundColor Green
Write-Host 'Tap Bus -> City Mall. No backend and no Google key required.' -ForegroundColor Green
Write-Host 'The bus times and seat counts are clearly marked as simulated.' -ForegroundColor Yellow
Write-Host ''

Start-Process powershell -ArgumentList @(
  '-NoExit',
  '-Command',
  "Set-Location '$mobile'; & '$python' -m http.server 3000 --directory '$mobile\dist'"
)
