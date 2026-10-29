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
