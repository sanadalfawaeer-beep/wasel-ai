param(
  [switch]$NoMobile
)

$root = Split-Path -Parent $PSScriptRoot
$uv = Join-Path $env:USERPROFILE '.local\bin\uv.exe'
if (-not (Test-Path $uv)) { $uv = 'uv' }

Write-Host 'Starting Wasel backend on http://localhost:8000 ...' -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
  '-NoExit',
  '-Command',
  "Set-Location '$root\services\api'; & '$uv' run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
)

if (-not $NoMobile) {
  Write-Host 'Starting Expo ...' -ForegroundColor Cyan
  Start-Process powershell -ArgumentList @(
    '-NoExit',
    '-Command',
    "Set-Location '$root\apps\mobile'; npx expo start"
  )
}

Write-Host ''
Write-Host 'Backend:  http://localhost:8000/docs' -ForegroundColor Green
Write-Host 'Health:   http://localhost:8000/api/health' -ForegroundColor Green
Write-Host 'Phone:    same Wi-Fi; Expo derives the API host from the dev server.' -ForegroundColor Green
Write-Host 'Firewall: allow uvicorn on the private network if the phone cannot reach it.' -ForegroundColor Yellow
