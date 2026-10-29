# Wasel contract

`cue.schema.json` is the source of truth for the shape the Python planner returns and every client renders.

Rules:

- Cues are **structured**, not free text. The backend localizes `say` and `short`; the client never invents instructions.
- A cue is fired once, on the device, when the user is within `trigger_m` of `at`.
- The same cue object renders as speech, large text, or haptics. No duplicated guidance logic.
- `urgency` is a hint; the client may raise it to `imminent` when the remaining distance is small.

`plan.response.json` is a real example used by the demo and by contract tests. Keep it in sync when the schema changes.

The TypeScript mirror lives in `apps/mobile/src/types.ts`. It is intentionally duplicated in Phase 0 so Metro does not need a monorepo resolver. When the venue dashboard arrives, generate both from this schema.
