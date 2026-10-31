# Wasel API

FastAPI service that turns a spoken or typed destination into a route plus a list of deterministic cues.

```powershell
uv sync
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- `GET /api/health` — planner mode, model, key presence.
- `POST /api/plan` — walking route planning for the guide.
- `POST /api/transit/plan` — Amman bus itineraries (mock or Google Transit).
- `GET /api/demo?lang=en` — the UJ demo route without the LLM.

The agent plans; the phone guides. Strands runs once per request and is never in the real-time cue loop.

## Modes

`PLANNER_MODE=auto` uses Google only when `GOOGLE_MAPS_API_KEY` is set. Otherwise it uses `MockMapsClient`, which returns three core University of Jordan routes plus a pharmacy demo (Library, Main Gate, Student Center, Pharmacy) and still lets the Strands agent call `find_place` and `get_route`.

`USE_LLM=false` skips DeepSeek and exercises the deterministic fallback parser. Tests run in this mode.

## Tests

```powershell
uv run pytest -q
```

## Secrets

`.env` is gitignored. The DeepSeek key is server-side only. Rotate the development key before publishing or deploying.
