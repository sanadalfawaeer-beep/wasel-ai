# Deploy Wasel A.I.

The website and API ship as **one Docker service**. FastAPI serves the built React app and `/api` from the same origin, so there is no separate CORS or proxy configuration.

```
Browser ──HTTPS──► FastAPI (Render)
                    ├── /              React SPA
                    ├── /trip          React SPA fallback
                    ├── /api/health    health check
                    ├── /api/plan      planner
                    ├── /api/transit   bus planner
                    └── /api/tts       neural speech
```

## Hosted pilot: Render

The repository includes `render.yaml` and a multi-stage `Dockerfile`.

### 1. Put the repository on GitHub

Render deploys from a Git repository. Push this repository to GitHub (private is fine), then connect it in Render.

### 2. Create the Blueprint

1. In Render, choose **New → Blueprint**.
2. Select the repository.
3. Render reads `render.yaml` and creates the `wasel-ai` web service.
4. Add the secret environment variables when prompted:

| Variable | Required | Purpose |
|---|---|---|
| `DEEPSEEK_API_KEY` | For the LLM planner | DeepSeek key; rotate the development key first. |
| `GOOGLE_MAPS_API_KEY` | For real Amman bus routes | Routes + Places API; keep server-side. |
| `AZURE_SPEECH_KEY` | For production TTS | Azure Speech resource key. |
| `AZURE_SPEECH_REGION` | For production TTS | Example: `westeurope`. |

`render.yaml` sets `DEBUG=false`, `PLANNER_MODE=auto`, and `TTS_PROVIDER=auto`. Auto uses Azure Speech when a key/region is present and falls back to Edge TTS otherwise.

### 3. Deploy and verify

Render builds the Docker image and runs:

```text
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Verify:

```powershell
curl.exe https://YOUR-SERVICE.onrender.com/api/health
curl.exe -o NUL -w "%{http_code} %{content_type}`n" "https://YOUR-SERVICE.onrender.com/api/tts?text=Hello&voice=en-US-AvaNeural"
```

The health response includes the active planner and TTS providers:

```json
{"status":"ok","mode":"google","tts":"azure","azure_tts":true}
```

Open `/`, `/trip`, `/chat`, and `/settings` and confirm each route returns the app.

### 4. Custom domain

In Render, open the service → **Settings → Custom Domains**, add the domain, and create the DNS record Render shows. Render provisions the TLS certificate. The microphone requires HTTPS, so use the custom domain for Safari/iOS testing.

### 5. Always-on

`render.yaml` uses the **starter** plan. The free plan spins down after inactivity, which adds a long cold start and is not suitable for a rider standing at a bus stop. Keep starter for a pilot.

Approximate running cost: Render Starter ~$7/month, a domain ~$10–15/year, plus Google Maps and Azure Speech usage. Cap both cloud accounts with budget alerts.

## Production TTS

- `TTS_PROVIDER=auto` (default): Azure when configured, Edge fallback.
- `TTS_PROVIDER=azure`: require Azure; returns `502` if Azure is unavailable.
- `TTS_PROVIDER=edge`: prototype only.

Azure Speech is the production path because the Sana/Taim/Ava neural voices come from Microsoft and the endpoint is supported. Edge TTS is an unofficial endpoint and is acceptable for demos, not a service dependency.

## Security checklist

- Rotate the DeepSeek key that was used during development.
- Set `DEBUG=false` (already in `render.yaml`).
- Keep all keys in Render environment variables, never in the repository.
- Set `ALLOWED_ORIGINS` to the production domain once it is known. The same-origin deployment does not need `*`.
- Add a request-rate limit in front of `/api/tts` before a public launch; speech is the most abusable endpoint.
- Do not put Google or Azure keys in the browser bundle.

## Local container test

If Docker is installed:

```powershell
docker build -t wasel-ai .
docker run --rm -p 8010:8000 --env-file services/api/.env wasel-ai
```

Open <http://127.0.0.1:8010>. The image builds the website, installs the API, and serves both from one process.

## Rollback

Render keeps previous deploys. Use **Deploys → Rollback** to return to the last known-good image. Database migrations are not part of this project yet, so rollback is stateless.
