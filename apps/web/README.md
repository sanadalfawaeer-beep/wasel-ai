# ACCESSIBLE BRT website

Bus-only Arabic-first website for the ACCESSIBLE BRT university project. It keeps the working tools only: trip planning, arrival time, empty-seat display, a seven-step rider journey, a visual/hearing mode switch, AI driver chat, and a survey. There are no about/features/impact explainer sections.

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

## What is real vs simulated

- Working interactions: destination → bus line, boarding stop, arrival clock, available seats, seat map, TTS, speech recognition where the browser supports it, flash/haptic hearing mode, chat, survey saved to `localStorage`.
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
| `src/App.tsx` | Planner, journey, mode switch, seats, chat, survey state |
| `src/styles.css` | Cherry-red light theme, responsive RTL/LTR layout |
| `index.html` | RTL shell, metadata, Google Fonts (IBM Plex Sans Arabic + Space Grotesk) |
