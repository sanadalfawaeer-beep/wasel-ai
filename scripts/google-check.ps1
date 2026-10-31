param(
  [string]$Query = 'University of Jordan Library',
  [double]$Lat = 32.0134,
  [double]$Lng = 35.8734
)

$envPath = Join-Path (Split-Path -Parent $PSScriptRoot) 'services\api\.env'
if (-not (Test-Path $envPath)) {
  Write-Host "Missing $envPath" -ForegroundColor Red
  exit 1
}

$lines = Get-Content $envPath
$keyLine = $lines | Where-Object { $_ -match '^\s*GOOGLE_MAPS_API_KEY\s*=' } | Select-Object -First 1
$modeLine = $lines | Where-Object { $_ -match '^\s*PLANNER_MODE\s*=' } | Select-Object -First 1
$key = if ($keyLine) { ($keyLine -replace '^\s*GOOGLE_MAPS_API_KEY\s*=\s*', '').Trim().Trim('"').Trim("'") } else { '' }
$mode = if ($modeLine) { ($modeLine -replace '^\s*PLANNER_MODE\s*=\s*', '').Trim() } else { 'auto' }

if (-not $key) {
  Write-Host 'GOOGLE_MAPS_API_KEY is empty.' -ForegroundColor Yellow
  Write-Host ''
  Write-Host '1. Create a Google Cloud project with billing enabled.' -ForegroundColor Cyan
  Write-Host '2. Enable Routes API and Places API (New).' -ForegroundColor Cyan
  Write-Host '3. Create a server API key restricted to those two APIs.' -ForegroundColor Cyan
  Write-Host '4. Put it in services\api\.env as GOOGLE_MAPS_API_KEY=...' -ForegroundColor Cyan
  Write-Host '5. Run this script again.' -ForegroundColor Cyan
  exit 1
}

Write-Host "Key loaded ($($key.Length) characters). Planner mode: $mode" -ForegroundColor Green
if ($mode -eq 'mock') {
  Write-Host 'PLANNER_MODE is mock; change it to auto or google after the key is validated.' -ForegroundColor Yellow
}

$placesHeaders = @{
  'Content-Type'      = 'application/json'
  'X-Goog-Api-Key'    = $key
  'X-Goog-FieldMask'  = 'places.displayName,places.formattedAddress,places.location'
}
$placesBody = @{
  textQuery      = $Query
  languageCode   = 'en'
  maxResultCount = 1
  locationBias   = @{
    circle = @{
      center = @{ latitude = $Lat; longitude = $Lng }
      radius = 3000.0
    }
  }
} | ConvertTo-Json -Depth 10

$destinationLat = 32.0135
$destinationLng = 35.8738

try {
  $places = Invoke-RestMethod -Uri 'https://places.googleapis.com/v1/places:searchText' `
    -Method Post -Headers $placesHeaders -Body $placesBody -TimeoutSec 30
  if (-not $places.places -or $places.places.Count -eq 0) {
    Write-Host 'PLACES: no result' -ForegroundColor Yellow
  } else {
    $place = $places.places[0]
    $destinationLat = $place.location.latitude
    $destinationLng = $place.location.longitude
    Write-Host 'PLACES: PASS' -ForegroundColor Green
    Write-Host "  $($place.displayName.text)"
    Write-Host "  $($place.formattedAddress)"
    Write-Host "  $destinationLat, $destinationLng"
  }
} catch {
  $status = $_.Exception.Response.StatusCode.value__
  Write-Host "PLACES: FAIL (HTTP $status)" -ForegroundColor Red
  if ($_.ErrorDetails.Message) { Write-Host $_.ErrorDetails.Message }
  if ($status -eq 403) {
    Write-Host '  Check billing and that Places API (New) is enabled.' -ForegroundColor Yellow
  }
}

$routesHeaders = @{
  'Content-Type'      = 'application/json'
  'X-Goog-Api-Key'    = $key
  'X-Goog-FieldMask'  = 'routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline,routes.legs.steps.navigationInstruction'
}
$routesBody = @{
  origin      = @{ location = @{ latLng = @{ latitude = $Lat; longitude = $Lng } } }
  destination = @{ location = @{ latLng = @{ latitude = $destinationLat; longitude = $destinationLng } } }
  travelMode  = 'WALK'
  routingPreference = 'TRAFFIC_UNAWARE'
  computeAlternativeRoutes = $false
  languageCode = 'en'
  units = 'METRIC'
} | ConvertTo-Json -Depth 10

try {
  $routes = Invoke-RestMethod -Uri 'https://routes.googleapis.com/directions/v2:computeRoutes' `
    -Method Post -Headers $routesHeaders -Body $routesBody -TimeoutSec 30
  if (-not $routes.routes -or $routes.routes.Count -eq 0) {
    Write-Host 'ROUTES: no route returned' -ForegroundColor Yellow
  } else {
    $route = $routes.routes[0]
    $steps = 0
    foreach ($leg in $route.legs) { $steps += $leg.steps.Count }
    Write-Host 'ROUTES: PASS' -ForegroundColor Green
    Write-Host "  distance: $($route.distanceMeters) m"
    Write-Host "  duration: $($route.duration)"
    Write-Host "  steps:    $steps"
    Write-Host '  Enable PLANNER_MODE=auto or google, restart the API, then walk the route.'
  }
} catch {
  $status = $_.Exception.Response.StatusCode.value__
  Write-Host "ROUTES: FAIL (HTTP $status)" -ForegroundColor Red
  if ($_.ErrorDetails.Message) { Write-Host $_.ErrorDetails.Message }
  if ($status -eq 403) {
    Write-Host '  Check billing and that Routes API is enabled.' -ForegroundColor Yellow
  }
}
