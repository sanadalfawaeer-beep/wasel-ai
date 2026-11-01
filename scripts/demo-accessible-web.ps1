param(
  [switch]$SkipBuild,
  [int]$Port = 5174
)

$root = Split-Path -Parent $PSScriptRoot
$web = Join-Path $root 'apps\web'
$api = Join-Path $root 'services\api'
$python = Join-Path $api '.venv\Scripts\python.exe'

if (-not (Test-Path (Join-Path $web 'node_modules'))) {
  Write-Host 'Installing website dependencies ...' -ForegroundColor Cyan
  Push-Location $web
  npm install
  Pop-Location
}

if (-not $SkipBuild) {
  Write-Host 'Building the Wasel A.I. website ...' -ForegroundColor Cyan
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
Write-Host "Wasel A.I. on this PC: http://localhost:$Port" -ForegroundColor Green
if ($hostIp -ne 'localhost') {
  Write-Host "Wasel A.I. on the local network: http://$($hostIp):$Port" -ForegroundColor Green
}
Write-Host 'Use the localhost URL for voice input. Browsers block the microphone on plain HTTP LAN addresses.' -ForegroundColor Yellow
Write-Host 'Voice input works in Chrome or Edge after allowing microphone access.' -ForegroundColor Yellow
Write-Host 'Natural Arabic voice uses the local TTS endpoint; browser voice is the fallback.' -ForegroundColor Green
Write-Host 'Destination search and maps use OpenStreetMap.' -ForegroundColor Green
Write-Host 'Bus times and seat availability are simulated and labelled in the UI.' -ForegroundColor Yellow
Write-Host ''

$backendRunning = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
if (-not $backendRunning -and (Test-Path $python)) {
  & $python -c "import edge_tts" 2>$null
  if ($LASTEXITCODE -eq 0) {
    Write-Host 'Starting the natural-voice backend ...' -ForegroundColor Cyan
    Start-Process powershell -ArgumentList @(
      '-NoExit',
      '-Command',
      "Set-Location '$api'; & '$python' -m uvicorn app.main:app --host 127.0.0.1 --port 8000"
    )
    Start-Sleep -Seconds 2
  } else {
    Write-Host 'Natural voice dependency missing; run uv sync in services/api. Using browser voice.' -ForegroundColor Yellow
  }
}

Start-Process powershell -ArgumentList @(
  '-NoExit',
  '-Command',
  "Set-Location '$web'; npx vite preview --host 0.0.0.0 --port $Port"
)
