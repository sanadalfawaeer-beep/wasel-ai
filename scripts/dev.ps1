param(
  [switch]$NoMobile
)

$root = Split-Path -Parent $PSScriptRoot
$uv = Join-Path $env:USERPROFILE '.local\bin\uv.exe'
if (-not (Test-Path $uv)) { $uv = 'uv' }

# Expo's LAN IP detection can pick a VirtualBox or disconnected adapter on
# Windows. Bind the advertised host to the adapter that actually has a gateway
# (the Wi-Fi/Ethernet used by the phone).
$lanIp = Get-NetIPConfiguration |
  Where-Object { $_.IPv4DefaultGateway -ne $null } |
  ForEach-Object { $_.IPv4Address.IPAddress } |
  Where-Object { $_ -notlike '169.254.*' } |
  Select-Object -First 1

if ($lanIp) {
  $env:REACT_NATIVE_PACKAGER_HOSTNAME = $lanIp
  Write-Host "Expo LAN host: $lanIp" -ForegroundColor Green
  Write-Host "Phone URL:     exp://$($lanIp):8081" -ForegroundColor Green
} else {
  Write-Host 'No LAN IPv4 address found; Expo will choose its own host.' -ForegroundColor Yellow
}

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
    "Set-Location '$root\apps\mobile'; npx expo start --lan"
  )
}

Write-Host ''
Write-Host 'Backend:  http://localhost:8000/docs' -ForegroundColor Green
Write-Host 'Health:   http://localhost:8000/api/health' -ForegroundColor Green
Write-Host 'Phone:    same Wi-Fi; Expo derives the API host from the dev server.' -ForegroundColor Green
Write-Host 'Firewall: allow uvicorn on the private network if the phone cannot reach it.' -ForegroundColor Yellow
