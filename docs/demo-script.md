# 90-second demo

## Before the demo

- Backend running in mock mode (or a working Google key).
- Phone brightness high, volume at 70%, haptics on.
- A saved demo route; internet not required after planning.
- A recorded backup video on the phone.
- If the venue GPS is bad, use Demo mode. Say so; don't pretend it's live.

## Script

1. **0:00 — Home.** "Wasel is one guidance engine with two output skins. Blind users get voice and haptics; Deaf users get large visual cues and haptics. Same route, same backend."
2. **0:10 — Plan.** Say "Take me to the library." Show the agent timeline: heard, found, route ready, cues prepared. "The Strands agent plans once. The phone does the real-time work, so guidance survives a dead zone."
3. **0:25 — Guide (Night / Voice).** The cue fires: haptic, then "In 30 meters, turn right." Show the giant instruction and the progress rail. Tap Repeat.
4. **0:40 — Switch to Daylight / Visual.** "Same cue, different rendering." Show the large arrow, next step, and the map sheet. Trigger a haptic test. "A Deaf user can complete this route with sound off."
5. **0:55 — Arrival.** "You have arrived at the University of Jordan Library." Show the arrival card.
6. **1:05 — Converse.** Tap a quick phrase: "Hello, I'm Deaf. Please type or speak slowly." The phone speaks it. Add a demo reply as a caption. "The conversation layer is the part Google Maps doesn't do."
7. **1:20 — Close.** "Phase 0 is one campus, three routes, English and Arabic. The moat is the accessibility graph and venue data, not the model. Wasel guides; it never replaces a cane or guide dog."

## If something fails

- Backend down → Use demo route (Home → Plan → Use demo route).
- Voice input unavailable → type the destination; say "voice input is a dev-build feature."
- GPS drift → switch to Demo mode and explain the simulation.
- Agent slow → the fallback parser still returns a route; the timeline shows the fallback.

## Judges' takeaway

One route. Two skins. A visible agent. A deterministic guide. A real conversation feature. A credible pilot city and venue.
