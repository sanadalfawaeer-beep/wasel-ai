# Roadmap

## Locked

| Decision | Choice |
|---|---|
| First market | Amman, Jordan |
| First venue | University of Jordan campus |
| Capacity | Solo, full-time |
| Clients | Expo React Native, Android + iOS |
| Backend | FastAPI + Strands Agents |
| Model | DeepSeek (`deepseek-v4-pro`), provider-agnostic |
| Languages | English + Arabic |
| Positioning | Wayfinding + conversation, not another maps app |

## Current state — 31 October 2026

**Working now**

- Expo app on the phone: Home, Plan, Guide, Converse, Settings, Onboarding.
- Night Route and Daylight themes with a cherry-red accent; English + Arabic RTL.
- On-device cue engine, simulation + GPS, TTS, haptics, route persistence.
- FastAPI + Strands + DeepSeek; `find_place` and `get_route` tools.
- Four mock UJ destinations, Google Places/Routes adapters, deterministic fallback.
- Bus tab with Amman itineraries, departure countdowns, and clearly labelled simulated occupancy.
- 16 backend tests, 13 mobile tests, contrast gate, web export, CI.

**Not yet pilot-ready**

- Real routing data. The mock coordinates are illustrative, not the actual UJ paths.
- Voice input on a development build. Expo Go still falls back to text.
- Off-route detection and re-routing.
- Event logging, a “report a cue” action, and the metrics the Phase 0 gate needs.
- A deployed HTTPS backend; today the phone talks to the laptop.
- Accessibility validation with blind and Deaf users, including Arabic TTS and screen readers.
- iOS device build; this needs the Apple Developer account.
- App icon, store assets, privacy policy, and tester consent.

## Next 10 days — validation sprint

| Day | Work | Output |
|---|---|---|
| 1 | EAS Android development build; install the APK | Voice input and native haptics available on the phone |
| 2 | Device pass: voice, Arabic TTS, haptics, TalkBack, 200% text, RTL | A written list of native-only defects |
| 3 | Google Cloud key; enable Routes + Places; real UJ routes | Three real routes from the app |
| 4 | Walk the three routes; compare with mock; check footpath coverage | Go/no-go on Google routing; note gaps for a campus graph |
| 5 | Add off-route detection, re-route, and a “report a cue” event log | A route can recover from a missed turn; failures are measurable |
| 6 | Deploy the API over HTTPS; point the app at it | Testers no longer depend on the laptop |
| 7 | Accessibility pass: VoiceOver/TalkBack, Arabic voice, sunlight, haptics | A route that is safe to put in front of testers |
| 8 | Two supervised pilot walks: one blind, one Deaf tester | First real feedback and safety review |
| 9 | 5 blind + 5 Deaf sessions; collect route outcomes and cue errors | Phase 0 gate data |
| 10 | Gate review; decide whether to start Phase 1 | A go/no-go decision, not a vibe |

Android first. Add iOS after the Android route is stable and the Apple Developer account is ready.

**What this needs**

- Google Cloud billing + a server key for Routes/Places.
- An Expo access token (or browser login) for EAS.
- One Android phone; two is better for the tester sessions.
- UJ route access, 5 blind/low-vision and 5 Deaf/HoH volunteers, and an O&M specialist for the supervised walks.
- A small backend host (Render/Fly/AWS) for the pilot; the laptop is fine for the first two walks.
- Consent, privacy, and incident forms before external testers arrive.

## Phase 0 — Prove the loop (4–5 weeks)

**Scope:** three core UJ routes plus a pharmacy demo, 10 testers, Android + iOS, English + Arabic, voice + visual skins, on-device cues, offline after planning, demo route.

**Build order:**

| Week | Deliverable |
|---|---|
| 1 | Toolchain, repo, EAS builds, `/plan` + DeepSeek + mock route, cue builder, contract tests |
| 2 | GPS + simulation, cue engine, TTS/haptics, two skins, map sheet |
| 3 | Arabic/RTL, settings, onboarding, offline cache, iOS build |
| 4 | Tester sessions, fixes, safety copy, contrast + screen-reader passes |
| 5 | Buffer, gate review, demo video |

**Gate:** 8/10 testers complete two unfamiliar routes without help; cue errors <5%; 9/10 arrivals; zero safety incidents; both languages pass.

**Explicitly out:** accounts, database, indoor maps, beacons, wheelchair routing, payments, web dashboard, sign language, background/lock-screen audio.

## Phase 1 — Pilot MVP (6–8 weeks)

- One campus deployment with a signed pilot agreement.
- Rerouting, favorites, crash reporting, opt-in analytics.
- Accessibility audit and a VPAT/ACR draft.
- Privacy policy, consent, incident log.
- 50 users; TestFlight + Play internal track.

**Gate:** 4-week retention ≥40%, task success ≥85%, first venue LOI, no safety incidents.

## Phase 2 — Indoor + venue SaaS (3–6 months)

- 2–3 venues with IMDF/OSM floor plans.
- BLE / Wi-Fi RTT / QR anchors at entrances and decision points.
- Venue dashboard: map editor, accessibility tags, analytics, compliance reports.
- Own accessibility graph for pilot venues (PostGIS + Valhalla/GraphHopper).
- First paying venue.

**Gate:** paying customer; repeatable mapping cost per venue; indoor arrival success ≥85%.

## Phase 3 — Scale (6–12 months)

- Three cities, transit integrations, API/partnerships.
- More languages; sign language video for critical flows.
- Expanded accessibility graph and venue marketplace.

## Business model

Free consumer app. Venue subscription for indoor map hosting, accessibility data, analytics, and compliance reporting. Transit/airport licenses later. The consumer app is not ad-supported.

## Moat

1. Accessibility-tagged graph: step-free, tactile paving, ramp gradient, door width, lighting, noise, crowds.
2. Venue data and mapping playbook.
3. Bilingual Arabic/English cue library and voice tuning.
4. Trust with disability communities and O&M specialists.

The LLM is not the moat. It is a config line.

## Budget (Phase 0)

| Item | Estimate |
|---|---|
| Apple Developer Program | $99/year |
| Google Cloud (capped) | $0–50 |
| DeepSeek API | $5–20 |
| EAS builds | $0 on free tier |
| **Total** | **~$105–170** excluding phones |

No domain or tester stipends in the Phase 0 budget: the founder runs the first self-test, then recruits a small volunteer group from the UJ disability network. External paid accessibility testing belongs in the Phase 1 pilot budget, where it can be tied to a venue agreement.

## Risks

| Risk | Mitigation |
|---|---|
| Google lacks UJ footpaths | Validate three routes in week 1; hand-build a 30–50 node campus graph if needed |
| Arabic STT/TTS quality | Spike in week 1; keep typed input; budget a cloud voice fallback |
| iOS background/lock-screen limits | Do not promise; test in Phase 1 |
| DeepSeek data residency | Model-agnostic provider; self-host/regional host for EU/Gulf |
| GPS drift between buildings | Generous triggers, projection, simulation fallback |
| Safety/liability | Conservative cue phrasing, disclaimers, O&M review, incident log |
| Venue sales cycle | Start LOIs during the pilot |
| Trademark "Wasel" | Check Zain Jordan mark and domain before branding spend |

## Metrics

- Task success: route completed without human help.
- Cue precision: wrong/missed cues per route.
- Time-to-destination vs. a Google baseline.
- SUS and open feedback from blind and Deaf testers.
- 4-week retention; venue conversion; cost per route.
