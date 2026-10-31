# Google Maps routing

The code is wired. This page is the setup and validation runbook.

## What the app uses

- **Places API (New)** — `places:searchText`, location-biased to the user, to resolve "the library" into a real place.
- **Routes API** — `directions/v2:computeRoutes` with `travelMode: WALK`, to get distance, duration, polyline, and step instructions.
- **Routes API transit** — `travelMode: TRANSIT` powers the Bus tab. See [Bus planner](bus.md).
- **Wasel cue builder** — converts steps into the stable `Cue` contract. The LLM never writes turn instructions.

## Create the key

1. Open <https://console.cloud.google.com/> and create a project (for example `wasel-guide`).
2. Attach a **billing account**. Google Maps Platform returns 403 without billing, even inside the free usage tier.
3. Enable:
   - **Routes API**
   - **Places API (New)**
4. Create an API key under **APIs & Services → Credentials**.
5. Restrict the key to those two APIs. This is a **server key**: do not add an Android/iOS application restriction, and never put it in the mobile app.
6. Set a daily quota cap and a billing budget alert. A runaway loop is the only way this gets expensive.
7. Put it in `services/api/.env`:

```env
GOOGLE_MAPS_API_KEY=your-server-key
PLANNER_MODE=auto
```

`auto` uses Google when the key exists, otherwise mock mode. Use `google` to force it, or `mock` to force demo data.

## Validate it

```powershell
cd C:\Users\user\Desktop\wasel-ai
powershell -ExecutionPolicy Bypass -File scripts\google-check.ps1
```

The script tests Places and Routes directly, prints the resolved place and route, and gives a specific message for 403/429/400. It never prints the key.

Then restart the API and check:

```powershell
Invoke-RestMethod http://localhost:8000/api/health
```

`mode` should be `google`. If it still says `mock`, the key is empty, `PLANNER_MODE=mock`, or the server was not restarted.

## Walk the three routes

Do not trust a route because it computes. Walk it.

| Route | What to verify |
|---|---|
| Main Gate → Library | Does it use the actual footpath and entrance? Any stairs? |
| Library → Student Center | Does it cut through a building or a closed courtyard? |
| Student Center → Pharmacy | Does the last 20 m reach the correct door? |
| Arabic | Are street names localized and pronounceable? |
| Cues | Do turns land at the actual junction, not before/after it? |
| Crossings | Does it ever imply "cross now"? |

Record every place Google is wrong. If the campus footpath graph is missing or wrong on more than one route, build a small campus graph (30–50 nodes with step-free/stair/ramp tags) and add it behind the existing `MapsClient` interface. That graph is the Phase 1 moat, not a detour.

## Common errors

| HTTP | Cause | Fix |
|---|---|---|
| 403 | Billing not enabled, API not enabled, or key restricted incorrectly | Enable billing, Routes API, Places API (New) |
| 400 | Bad field mask or request shape | Check the `X-Goog-FieldMask` header |
| 429 | Quota exhausted | Raise the quota cap or wait |
| Empty `routes` | No walking route between points | Try a closer destination; check the origin |
| `REQUEST_DENIAL` | Key restriction or API mismatch | Use the server key; remove app restrictions |

## Terms and privacy

- **Attribution:** the guide and the route sheet show **Powered by Google** when the provider is Google.
- **Caching:** Google does not allow permanently caching Directions/Routes results or building your own route database from them. The app caches the planned route locally for the trip only. Phase 1's own accessibility graph is the long-term replacement.
- **Privacy:** the route request sends origin and destination to Google. Disclose this in the pilot privacy policy. Live GPS updates stay on the phone.
- **Key safety:** the key is server-side only, in `services/api/.env`, which is gitignored.

## If Google is not enough

Keep the `MapsClient` boundary. Add a `CampusGraphClient` that:

1. Uses a hand-mapped graph for the three UJ routes.
2. Tags edges with `step_free`, `stairs`, `ramp`, `incline`, `lit`, `crossing`, `surface`.
3. Returns the same `RoutePlan` and cues.

The app does not change. That is the point of the contract.
