# Decision log

## ADR-001 — Cues run on the device

**Decision:** The backend returns a complete `RoutePlan` with cues; the phone fires them locally.

**Why:** GPS updates arrive on the phone. A server round-trip per cue adds latency, dies in dead zones, and sends live location off-device. On-device guidance also survives airplane mode after planning.

**Cost:** The route must be cached; re-planning is an explicit network call.

## ADR-002 — One HTTP endpoint for Phase 0

**Decision:** `/api/plan` is the only required endpoint. No WebSocket, Redis, session service, or route database.

**Why:** The shortest reliable path to a demo and a pilot. The app is stateless from the server's perspective.

**Revisit:** Phase 1 adds accounts, saved places, and venue data; that is when Postgres/PostGIS arrives.

## ADR-003 — Mock-first routing

**Decision:** With no Google key, the backend uses four UJ mock destinations and the Strands agent still runs.

**Why:** Google Cloud requires a billing-enabled project. A mock mode lets the product be built, tested, and demoed immediately, and it keeps tests offline and free.

**Honesty:** Mock mode is labeled `demoRouteNote` in the UI and is not sold as real routing.

## ADR-004 — DeepSeek through the OpenAI-compatible provider

**Decision:** `OpenAIModel(base_url="https://api.deepseek.com", model_id="deepseek-v4-pro")`.

**Why:** The key is available, tool calling works, and Strands is provider-agnostic. Swapping to Gemini, Claude, or a self-hosted model is a config change.

**Caveats:** DeepSeek is China-hosted; verify residency before an EU/Gulf launch. Arabic NLU needs an evaluation set; keep the fallback parser.

## ADR-005 — No map on the main guidance screen

**Decision:** The primary guide is an instruction stage + schematic progress rail. The real map is a sheet.

**Why:** Outdoor readability, cognitive load, offline use, and a distinctive transit-sign aesthetic. It also avoids a hard dependency on a mobile map SDK key in Phase 0.

**Revisit:** Add MapLibre/OSM as an optional orientation view in Phase 1.

## ADR-006 — Night + Daylight, not one theme

**Decision:** Blind/low-vision defaults to Night Route; Deaf/HoH defaults to Daylight; both are switchable; High Contrast is always available.

**Why:** Amman sunlight destroys dark UIs; night glare hurts low-light users. The profile picks a sensible default without locking anyone in.

## ADR-007 — Structured cues, not free-text instructions

**Decision:** The backend returns `Cue` objects; clients render them as speech, text, or haptics.

**Why:** One route, two skins, no duplicated guidance logic. The LLM never writes turn text.

## ADR-008 — KiroCrew is a design reference, not a dependency

**Decision:** Borrow the token discipline, calm palette, visible agent execution, and accessibility rules. Do not fork the repo or copy brand assets.

**Why:** KiroCrew is a 3.4 GB React DOM/Tailwind/Electron project. Wasel is React Native. The system transfers; the code does not. Apache-2.0 would allow code reuse with attribution, but there is no reason to take the dependency.

## ADR-009 — No accounts in Phase 0

**Decision:** Preferences and the last route live in AsyncStorage. No login, no server-side profile.

**Why:** Faster pilot, better privacy, fewer failure modes. Venue analytics, when needed, are opt-in and aggregate.

## ADR-010 — Arabic is a first-class layout, not a translation

**Decision:** Arabic ships in Phase 0 with RTL-aware layout, Arabic TTS/STT testing, and physical turn arrows that do not mirror.

**Why:** The pilot is Amman. Arabic-first is the local advantage; a translated afterthought would fail the demo and the users.

## ADR-011 — Bus occupancy is simulated in demo mode only

**Decision:** The Bus tab shows simulated seat counts only when `demo: true`, with a persistent "Demo data" banner and a per-leg "Simulated" label. Google mode returns `occupancy: unknown`.

**Why:** There is no public Amman seat-occupancy feed. Presenting simulated counts as live would be misleading and unsafe. Crowdsourced reports or operator APC data can replace the provider later without changing the UI.

## ADR-012 — Google Transit first, GTFS-Realtime later

**Decision:** Use Google Routes API `transit` for real Amman bus itineraries; add GTFS-Realtime or operator AVL only when a feed is available.

**Why:** Amman GTFS is live in Google Maps, so it is the fastest path to real line/stop/timing data. Google times are estimates, not a guaranteed live feed; the UI labels them `Estimated`. Never label them `Live` without a timestamped real-time source.
