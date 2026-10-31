# Wasel A.I. website

Bus-only Arabic-first website for the Wasel A.I. / ACCESSIBLE BRT university project. It opens with a one-time visual/hearing choice, then splits into routed pages: **Plan**, **Trip**, **Seats**, **Chat**, and **Settings**. The working tools are trip planning, arrival time, empty-seat display, a seven-step rider journey, a visual/hearing mode switch, AI driver chat, and persisted accessibility settings. There are no about/features/impact/survey sections.

No backend or Google API key is required. Bus times and seat occupancy are local simulations and are labelled as such throughout the UI.

## Run

```powershell
cd apps/web
npm install
npm run dev
```

Open <http://localhost:5173>.

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
| `/` | Plan a trip, see the bus line, arrival time, and seats |
| `/trip` | Seven-step rider journey and visual/hearing switch |
| `/seats` | Interactive seat map and spoken seat availability |
| `/chat` | Rider–driver chat |
| `/settings` | Language, accessibility mode, preferred bus line, motion, voice, speech rate, auto-read, haptics, reset, show welcome again |

Settings are stored in `localStorage` under `accessible-brt-settings`.

## What is real vs simulated

- Working interactions: destination → bus line, boarding stop, arrival clock, available seats, seat map, TTS, speech recognition where the browser supports it, flash/haptic hearing mode, chat, and settings saved to `localStorage`.
- Simulated: bus times, seat counts, seat states, and driver replies. Real occupancy needs an operator APC feed or crowdsourced reports; real arrival data needs GTFS-RT or an operator API.

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
| `src/App.tsx` | Routes, planner, journey, seats, chat, settings, shared state |
| `src/styles.css` | Cherry-red light theme, responsive RTL/LTR layout |
| `index.html` | RTL shell, metadata, Google Fonts (IBM Plex Sans Arabic + Space Grotesk) |
