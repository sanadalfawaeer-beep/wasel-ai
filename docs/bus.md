# Amman bus planner

The Bus tab answers three questions:

1. **Which bus do I take?** Itineraries with walk → bus → transfer → walk legs.
2. **When is the next one?** A countdown to the first bus departure, plus the next departures.
3. **How full is it?** In demo mode, a clearly labelled simulated seat count. In real mode, occupancy is `unknown` until an operator or crowdsourced feed exists.

## What is real

| Feature | Demo mode | Google mode |
|---|---|---|
| Bus line and stops | Simulated Amman lines | Google Routes API `TRANSIT` using Amman's GTFS data |
| Next departure | Simulated absolute time | Google's transit estimate |
| Live vs scheduled | `Simulated` | `Estimated` unless a real-time feed is connected |
| Occupancy | Simulated seats / standing | `Unavailable` |
| Attribution | Demo banner | `Transit data from Google` |

Amman's GTFS is live in Google Maps, so Google mode is the fastest path to real bus itineraries. It is still an estimate, not a guaranteed live feed. Do not label it `Live` without a GTFS-Realtime or operator AVL source.

## Empty seats

There is no public seat-occupancy feed in Amman. Exact counts require one of:

1. **Operator APC/AVL** — Kentkart/GAM passenger counting or vehicle sensors.
2. **Crowdsourced rider reports** — `Seats available / Standing / Full`, with report age and confidence.
3. **Simulation** — for a pitch or UI demo only, always labelled.

The current build uses option 3 in mock mode. Do not present simulated counts as real. For a production pilot, use option 2 first; pursue option 1 with the operator.

The official Vision City Bus app has live vehicle tracking, but no public developer API. Wasel does not scrape or depend on its private endpoints.

## API

```http
POST /api/transit/plan
Content-Type: application/json

{
  "text": "City Mall",
  "lat": 32.0134,
  "lng": 35.8734,
  "lang": "en"
}
```

Response:

```json
{
  "destination": { "name": "City Mall", "address": "Amman, Jordan", "lat": 31.976, "lng": 35.849 },
  "provider": "mock",
  "demo": true,
  "note": "Demo data: bus times and seat counts are simulated.",
  "generated_at": "2026-10-31T10:00:00Z",
  "itineraries": [
    {
      "id": "demo-1",
      "duration_s": 1140,
      "walk_s": 420,
      "transfers": 0,
      "summary": "Walk 4 min · Bus 100 · 12 min · 5 stops · Walk 3 min",
      "next_departures_min": [4, 14, 24],
      "demo": true,
      "provider": "mock",
      "realtime": false,
      "legs": [
        { "mode": "WALK", "duration_s": 240, "distance_m": 300 },
        {
          "mode": "BUS",
          "line": "Amman Bus 100",
          "line_short": "100",
          "line_color": "#0F766E",
          "headsign": "City Mall",
          "board_stop": "University of Jordan Main Gate",
          "alight_stop": "City Mall",
          "departure_at": "2026-10-31T10:04:00Z",
          "arrival_at": "2026-10-31T10:16:00Z",
          "duration_s": 720,
          "distance_m": 3000,
          "num_stops": 5,
          "occupancy": "seats",
          "seats_left": 8,
          "occupancy_source": "simulated"
        }
      ]
    }
  ]
}
```

## Run it

### Standalone web demo — no backend, no Google key

```powershell
cd C:\Users\user\Desktop\wasel-ai
powershell -ExecutionPolicy Bypass -File scripts\demo-web.ps1
```

Open the URL it prints, tap **Bus**, then **City Mall**. The app falls back to local simulated itineraries if the API is unreachable, so this works on a phone with only the web page.

This is a **demo**: the lines and seat counts are simulated. It is not real Amman Bus data.

### With the backend

```powershell
cd C:\Users\user\Desktop\wasel-ai
powershell -ExecutionPolicy Bypass -File scripts\dev.ps1
```

Open the app, tap **Bus**, and try **City Mall**, **Downtown**, **Abdoun**, or **UJ Library**.

For Google mode, add `GOOGLE_MAPS_API_KEY` to `services/api/.env` and restart. See [Google Maps setup](google-maps.md). Without the key, the backend uses its mock provider and the Bus tab shows the demo banner.

## Next steps for real arrivals and seats

- **Real-time arrivals:** obtain a GTFS-Realtime or operator AVL feed, add a `GtfsRealtimeProvider`, and show a `Live` badge only when the feed timestamp is fresh.
- **Occupancy:** add the crowdsourced `POST /api/occupancy` endpoint first; it needs no operator contract. Use operator APC when available.
- **Accessibility:** use GTFS `wheelchair_accessible` / `bikes_allowed` where available, and add low-floor/step-free filters to the itinerary cards.
- **Fares:** not implemented; add only if the operator exposes fare data.
