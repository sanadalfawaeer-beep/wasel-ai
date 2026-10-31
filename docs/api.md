# API

Base URL: `http://localhost:8000`

## `POST /api/plan`

```json
{
  "text": "Take me to the library",
  "lat": 32.0134,
  "lng": 35.8734,
  "lang": "en",
  "constraints": ["step_free", "avoid_stairs"]
}
```

Response:

```json
{
  "reply": "Heading to the University of Jordan Library. It is about 4 minutes away.",
  "route": {
    "route_id": "demo-uj-en",
    "destination": {
      "name": "University of Jordan Library",
      "address": "University of Jordan, Amman, Jordan",
      "lat": 32.0135,
      "lng": 35.8738
    },
    "polyline": "...",
    "points": [{ "lat": 32.0134, "lng": 35.8734 }],
    "distance_m": 300,
    "duration_s": 260,
    "cues": [
      {
        "id": "cue_1",
        "kind": "DEPART",
        "say": "Start walking north toward the main walkway.",
        "short": "Start",
        "at": { "lat": 32.0134, "lng": 35.8734 },
        "trigger_m": 0,
        "haptic": "tick",
        "urgency": "normal"
      }
    ],
    "provider": "mock",
    "language": "en"
  },
  "debug": {
    "mode": "mock",
    "model": "deepseek-v4-pro",
    "planner": "deepseek",
    "constraints": ["step_free", "avoid_stairs"],
    "tool_log": [{ "tool": "find_place" }, { "tool": "get_route" }]
  }
}
```

`debug` is dev-only in spirit; do not render it in the consumer UI. The debug drawer and Settings use it for support.

## `POST /api/transit/plan`

Bus itinerary planner for Amman. Same shape in mock and Google mode; mock itineraries carry `demo: true` and simulated occupancy.

```json
{
  "text": "City Mall",
  "lat": 32.0134,
  "lng": 35.8734,
  "lang": "en"
}
```

See [Bus planner](bus.md) for the full response and the occupancy limitation.

## `GET /api/demo?lang=en`

Returns the built-in University of Jordan route without invoking the LLM. Useful for UI work and for a backup demo.

## `GET /api/health`

```json
{
  "status": "ok",
  "mode": "mock",
  "model": null,
  "llm": false,
  "google_key": false
}
```

## Errors

| Status | Meaning |
|---|---|
| 422 | Invalid request body |
| 502 | Places/Routes failure with a user-safe message |
| 504 | Planner exceeded the timeout |
| 500 | Unexpected failure |

The app catches these and offers `Retry` and `Use demo route`.

## Contract

`packages/contract/cue.schema.json` is the source of truth. The mobile mirror is `apps/mobile/src/types.ts`. Keep them in sync until a generator is added.
