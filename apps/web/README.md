# Wasel A.I. website

Bus-only Arabic-first website for the Wasel A.I. / ACCESSIBLE BRT university project. A short branded splash screen runs on load, then the audio/visual help choice opens; doing nothing for 5 seconds selects audio help. Choosing audio help announces the selection and starts listening automatically. It then splits into routed pages: **Plan**, **Trip**, **Chat**, and **Settings**. The working tools are press-to-talk trip planning, spoken bus options and spoken bus choice, arrival time, empty-seat display, seat details that appear when a bus is selected, a seven-step rider journey, an audio/visual help switch, AI driver chat, and persisted accessibility settings. There are no about/features/impact/survey sections.

No API key is required to run the demo. Destination search uses OpenStreetMap Nominatim and the map uses OpenStreetMap tiles. An optional local FastAPI endpoint provides smooth neural Arabic voices through Edge TTS; if it is unavailable, the browser voice is used.

The planner calls the hosted API, which uses a local snapshot of the official Amman Bus/BRT route and timetable data. The browser asks for the rider’s location so the route starts from where they are. If the transit API is unreachable or the rider denies location access, the UI clearly falls back to demo routes from central Amman. Seat occupancy remains unavailable for real Amman Bus itineraries.

## Run

```powershell
cd apps/web
npm install
npm run dev
```

Open <http://localhost:5173>.

For the natural Arabic voice, start the local API in another terminal:

```powershell
cd services/api
uv run uvicorn app.main:app --host 127.0.0.1 --port 8000
```

The Vite dev server proxies `/api` to it.

From the repository root you can also run the built site on port 5174:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\demo-accessible-web.ps1
```

## Verify

```powershell
npm run build
```

## Pages

| Route | Purpose |
|---|---|
| `/` | Press-to-talk or type a destination, hear the bus options, pick a bus for its seat map, and view the OSM destination map |
| `/trip` | Seven-step rider journey and audio/visual help switch |
| `/chat` | Rider–driver chat |
| `/settings` | Language, audio/visual help mode, preferred bus line, motion, natural/browser voice, speech rate, hands-free listening, auto-read, haptics, reset, show welcome again |

Settings are stored in `localStorage` under `accessible-brt-settings`.

## What is real vs simulated

- Working interactions: press-to-talk destination, spoken bus options, spoken bus choice, boarding stop, arrival clock, available seats, selectable bus with seat map, TTS, flash/haptic visual-help mode, chat, and settings saved to `localStorage`.
- Real transit: routes, lines, stops, and scheduled departure times come from a local snapshot of the official Amman Bus/BRT timetable. The rider’s location is used as the origin. The UI labels these as **Scheduled**, never **Live**, and links to **Amman Bus** for attribution.
- OpenStreetMap: destination coordinates come from Nominatim (with local Amman fallbacks) and the destination map is an OpenStreetMap embed with attribution.
- Simulated fallback: when the transit API is unavailable, the app says so and uses demo data for the results. Seat counts, seat states, and driver replies are demo data and labelled as such. Real occupancy needs an operator APC feed or crowdsourced reports; live arrival data needs GTFS-RT or an operator API.

## Location

The first plan asks for browser location permission so the route can start from the rider’s position. Location is sent only to the Wasel API for that plan; it is not stored. If permission is denied or the request times out, the app says so and plans from central Amman. The **Use my location** button retries.

## Voice troubleshooting

Voice input uses the browser SpeechRecognition API and requires a **secure context**:

- Use `http://localhost:5174` on the same PC, or serve the site over HTTPS.
- Plain `http://192.168.x.x` addresses are not secure contexts, so browsers block the microphone. They may also be unreachable from a phone because of Wi-Fi client isolation or the Windows firewall.
- For Safari/iOS, use an HTTPS tunnel to the local server. Vite is configured to allow `.trycloudflare.com` hosts for this purpose.
- Use Chrome or Edge. Some Chromium-based browsers do not ship the speech-recognition service.
- Allow microphone access when prompted.
- Natural replies use the local `/api/tts` endpoint with `ar-JO-SanaNeural` or `ar-JO-TaimNeural`. If the API is unavailable, the browser voice is used.
- Browser fallback needs an Arabic voice installed in the OS/browser.
- If voice is unavailable, the page shows a warning with the specific reason and the destination form still works.
- Hands-free listening can be turned off in Settings. When enabled, the assistant starts listening again after each spoken prompt.

## Accessibility notes

- Arabic RTL by default, with an English LTR toggle.
- Skip link, semantic landmarks, labelled controls, `aria-live` updates, visible focus.
- Reduce-motion preference respects both the in-page toggle and `prefers-reduced-motion`.
- Visual mode uses Speech Synthesis; hearing mode uses screen flash plus Vibration API where available.
- Seat status buttons are keyboard reachable and include ID + status in their accessible names.

## Structure

| File | Purpose |
|---|---|
| `src/content.ts` | Arabic/English copy, journey, seats, trips, messages |
| `src/osm.ts` | Nominatim geocoding, local Amman fallbacks, OSM embed URL |
| `src/transit.ts` | Calls `/api/transit/plan`, maps real itineraries to the UI |
| `src/App.tsx` | Routes, planner, journey, seats, chat, settings, shared state |
| `src/styles.css` | Cherry-red light theme, responsive RTL/LTR layout |
| `index.html` | RTL shell, metadata, Google Fonts (IBM Plex Sans Arabic + Space Grotesk) |
