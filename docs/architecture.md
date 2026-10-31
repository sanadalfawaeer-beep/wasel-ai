# Architecture

## The rule

**The agent plans; the phone guides.**

Strands + DeepSeek runs once per request. It resolves the destination and asks for a route. The resulting cues are cached on the device. A deterministic cue engine fires them from GPS, with no network in the loop.

```
Speech / typing
      │
      ▼
POST /api/plan ──► Strands agent (DeepSeek)      ~1–8 s, once
                   tools: find_place, get_route
                   fallback: raw text → Places
      │
      ▼
RoutePlan + cues[]   ← cached in AsyncStorage
      │
      ▼
On-device cue engine  ← 500 ms tick, no network
      │
      ├── Voice skin: speech + haptics
      └── Visual skin: large text + haptics
```

Why this shape:

- **Latency:** an LLM round-trip per turn would break the walking experience.
- **Safety:** cue logic is deterministic and testable.
- **Privacy:** live location never leaves the phone in Phase 0.
- **Resilience:** guidance survives a dead zone after the route is planned.

## Backend

| Module | Responsibility |
|---|---|
| `app/main.py` | FastAPI app, CORS, router mounting |
| `app/routers/plan.py` | `/api/plan`, `/api/demo`, `/api/health`, timeout and error mapping |
| `app/routers/transit.py` | `/api/transit/plan` |
| `app/planner.py` | Strands agent, two tools, fallback parser, reply generation |
| `app/maps.py` | `MapsClient` protocol, Google Places/Routes, mock client |
| `app/transit.py` | Google Transit + mock bus itineraries, simulated occupancy |
| `app/cues.py` | Provider maneuver → cue kind, English/Arabic templates, arrival synthesis |
| `app/mock_data.py` | Four University of Jordan demo destinations |
| `app/geo.py` | Haversine, polyline encode/decode |
| `app/models.py` | Pydantic contract |

The agent has exactly two tools:

1. `find_place(query)` — Places API (New), location-biased to the user.
2. `get_route(destination_name)` — Routes API, walking mode.

The model never writes turn instructions. `cues.py` owns the text, haptics, and trigger distances.

## Client

| Layer | Responsibility |
|---|---|
| `src/app` | Expo Router screens: home, plan, guide, bus, converse, settings, onboarding |
| `src/state/AppProvider.tsx` | Preferences + last route, persisted to AsyncStorage |
| `src/lib/api.ts` | Plan request; derives the LAN host from Expo's dev server |
| `src/lib/cueEngine.ts` | Fire-once cue selection, distance, urgency tone |
| `src/lib/geo.ts` | Haversine, route projection, simulation interpolation |
| `src/lib/location.ts` | Permission, quick location, GPS watch |
| `src/lib/speech.ts` | TTS, screen-reader-aware announcements |
| `src/lib/haptics.ts` | Android patterns, iOS fallback, test legend |
| `src/lib/voice.ts` | Lazy speech recognition; Expo Go falls back to text |
| `src/ui` | Themes, tokens, primitives, instruction stage, route sketch |

## Cue lifecycle

1. Backend builds cues from provider steps. Each cue is anchored to a coordinate.
2. The app caches the whole route.
3. On every position update, `cueToFire` returns the first unfired cue within its trigger radius.
4. The cue is marked fired, spoken/announced, and haptically rendered.
5. The UI derives the urgency tone from the remaining distance.
6. On arrival, the app stops speech/haptics and offers `Done`.

The departure cue has a zero trigger and an 8 m practical buffer for GPS noise.

## Modes

| Mode | Behavior |
|---|---|
| `mock` | Demo UJ route; agent tools return mock places/routes; no Google key |
| `google` | Places API (New) + Routes API |
| `fallback` | No LLM; deterministic destination parser + the same maps client |

`mock` is not a toy: it lets the whole product, tests, and demo run without a Google Cloud account. It is explicitly not a substitute for real routing.

## What is deliberately not here yet

- Accounts, database, venue CMS.
- Indoor maps, BLE/Wi-Fi RTT, IMDF.
- Wheelchair/step-free routing (the `constraints` field is carried through, but Google ignores it).
- Background/lock-screen guidance.
- Sign language video.
- The venue web dashboard.

Those are Phase 1/2. See the roadmap.
