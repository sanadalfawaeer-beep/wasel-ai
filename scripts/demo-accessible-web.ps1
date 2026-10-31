param(
  [switch]$SkipBuild,
  [int]$Port = 5174
)

$root = Split-Path -Parent $PSScriptRoot
$web = Join-Path $root 'apps\web'

if (-not (Test-Path (Join-Path $web 'node_modules'))) {
  Write-Host 'Installing website dependencies ...' -ForegroundColor Cyan
  Push-Location $web
  npm install
  Pop-Location
}

if (-not $SkipBuild) {
  Write-Host 'Building the ACCESSIBLE BRT website ...' -ForegroundColor Cyan
  Push-Location $web
  npm run build
  if ($LASTEXITCODE -ne 0) {
    Pop-Location
    Write-Host 'Build failed.' -ForegroundColor Red
    exit 1
  }
  Pop-Location
}

$lanIp = Get-NetIPConfiguration |
  Where-Object { $_.IPv4DefaultGateway -ne $null } |
  ForEach-Object { $_.IPv4Address.IPAddress } |
  Where-Object { $_ -notlike '169.254.*' } |
  Select-Object -First 1

$hostIp = if ($lanIp) { $lanIp } else { 'localhost' }
Write-Host ''
Write-Host "ACCESSIBLE BRT website: http://$($hostIp):$Port" -ForegroundColor Green
Write-Host 'Arabic-first with an English toggle. No backend and no Google key required.' -ForegroundColor Green
Write-Host 'Bus times and seat availability are simulated and labelled in the UI.' -ForegroundColor Yellow
Write-Host ''

Start-Process powershell -ArgumentList @(
  '-NoExit',
  '-Command',
  "Set-Location '$web'; npx vite preview --host 0.0.0.0 --port $Port"
)
