# Wasel AI — واصل

Accessible wayfinding and conversation for blind, low-vision, and Deaf/hard-of-hearing people.

**Phase 0 scope:** one campus, three routes, English + Arabic, Android + iOS, voice + visual skins, and a deterministic on-device cue engine. The pilot target is the University of Jordan, Amman.

> Wasel guides. It does not replace a cane, a guide dog, or your own judgment. Do not use it to decide when to cross a road.

## What is in this repository

```
wasel-ai/
├─ apps/mobile/          Expo SDK 58 + React Native + TypeScript
├─ services/api/         FastAPI + Strands Agents + DeepSeek
├─ packages/contract/    Cue/route JSON Schema and example payload
├─ docs/                 Architecture, design system, roadmap, demo, accessibility
├─ scripts/              Dev launcher, API smoke test, contrast gate
├─ README.md
└─ .gitignore
```

## Prerequisites

- Node 24+ and npm 11+
- `uv` (it installs and manages Python 3.12)
- Git
- Optional: an Expo account and EAS CLI for an installable Android dev build
- A physical iOS install requires the paid Apple Developer Program ($99/year)

If a new terminal cannot find `uv`, either restart it or use the full path:

```powershell
& "$env:USERPROFILE\.local\bin\uv.exe" sync
```

## Quick start

### 1. Backend

```powershell
cd services/api
uv sync
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Open <http://localhost:8000/docs>.

The backend starts in **mock mode** when `GOOGLE_MAPS_API_KEY` is empty. That means the app works end-to-end with three core University of Jordan routes plus a pharmacy demo (Library, Main Gate, Student Center, Pharmacy) — no Google Cloud account needed. The Strands agent still runs against DeepSeek and still calls its `find_place` / `get_route` tools; those tools just return the demo data.

To use real Google routing, put a key in `services/api/.env`:

```env
GOOGLE_MAPS_API_KEY=your-key
PLANNER_MODE=auto
```

Enable **Routes API** and **Places API (New)** in a Google Cloud project with billing attached. Set quota caps and a budget alert before testing.

### 2. Mobile

```powershell
cd apps/mobile
npm install
npx expo start
```

- **Expo Go** works for the full UI, TTS, haptics, location, and the demo route.
- **Voice input** needs a development build (`npx expo run:android` or an EAS dev build). In Expo Go the mic button falls back to the text field.
- On Windows with VirtualBox or multiple adapters, `scripts/dev.ps1` forces Expo to advertise the Wi-Fi IP. If a QR ever shows `127.0.0.1`, use `exp://<your-lan-ip>:8081` manually.
- On a physical phone, keep the phone and PC on the same Wi-Fi. The app derives the API host from Expo's dev host automatically (`http://<your-lan-ip>:8000`). If that fails, create `apps/mobile/.env` with:

```env
EXPO_PUBLIC_API_URL=http://192.168.x.x:8000
```

Allow `uvicorn` through Windows Firewall on the private network.

Phone diagnostic: open `http://<your-lan-ip>:8081` and `http://<your-lan-ip>:8000/api/health` in the phone browser. If neither loads, the phone is on a different network, a VPN, or an AP with client isolation; fix that before troubleshooting Expo.

### 3. Verify

```powershell
# API smoke test (mock route)
powershell -ExecutionPolicy Bypass -File scripts/plan-smoke.ps1

# Backend tests
cd services/api
uv run pytest -q

# Mobile typecheck + logic tests
cd ../mobile
npx tsc --noEmit
npm test

# Design-token contrast gate
cd ../..
node scripts/check-contrast.mjs

# Google key validation (after adding the key)
powershell -ExecutionPolicy Bypass -File scripts/google-check.ps1
```

## Standalone bus demo

No backend or Google key needed:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\demo-web.ps1
```

Open the printed URL, tap **Bus** → **City Mall**. The demo is simulated and labelled as such; it is not real Amman Bus data.

## API modes

| Mode | Trigger | Behavior |
|---|---|---|
| `mock` | no Google key, or `PLANNER_MODE=mock` | Demo UJ destinations; agent tools return mock places/routes |
| `google` | Google key present, or `PLANNER_MODE=google` | Places API (New) + Routes API |
| `auto` | default | `google` when a key exists, otherwise `mock` |

`USE_LLM=false` skips Strands/DeepSeek and uses the deterministic fallback parser. This is the safety net for demos and tests.

## Notes

- Voice input needs a development build. Expo Go uses the text field instead; the app says so.
- Google Maps is optional. Mock mode is the default until a key is added.
- `expo-doctor` 1.21.5 reports a false positive about `.expo` being unignored in this monorepo. `git check-ignore -v apps/mobile/.expo` confirms it is ignored by `apps/mobile/.gitignore`.
- The DeepSeek timeout is 8 seconds; after that the deterministic fallback returns a route instead of failing.

## Security

- `services/api/.env` is gitignored. Never commit it.
- The DeepSeek key stays on the server. The mobile app never receives it.
- The key currently in `.env` was shared during development. **Rotate it before publishing the repo or deploying.**
- Google keys are separate from the DeepSeek key. Use a server key for Routes/Places and a separate Android key for any Maps SDK use. Do not put the server key in the app.

## Docs

- [Architecture](docs/architecture.md)
- [API](docs/api.md)
- [Google Maps setup and validation](docs/google-maps.md)
- [Amman bus planner](docs/bus.md)
- [UI design system](docs/design/ui-spec.md)
- [Accessibility testing](docs/accessibility/testing-plan.md)
- [Roadmap](docs/product/roadmap.md)
- [Demo script](docs/demo-script.md)
- [Decision log](docs/decisions.md)

## Status

Phase 0 vertical slice. The UI is complete enough to demo the full loop: plan → cues → guidance → arrival → conversation → bus planner → settings. The Bus tab currently uses demo occupancy; real seat data needs an operator feed. Real indoor maps, venue accounts, and the accessibility graph are Phase 1/2.
